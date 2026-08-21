// @codex MIMIN GROUP - Giai đoạn B (tra cứu pháp lý on-demand): xác minh MST/GPKD
// qua VietQR + MaSoThue cho MỘT ứng viên tìm kiếm CHƯA lưu vào production_company_profiles.
// Khác với 2 route sẵn có (company-registry/vietqr, company-registry/masothue) - route
// này KHÔNG cần profileId, KHÔNG ghi production_company_field_evidence/
// production_company_registry_reconciliations (2 bảng đó cần company_profile_id) - đây
// là bản xem nhanh (preview), tái dùng lookupVietQrBusiness/lookupMaSoThueBusiness/
// reconcileRegistryEvidence (hàm thuần, không đụng DB) và CÙNG bảng cache
// production_company_registry_cache (khóa theo tax_code, không cần profile) để có cache
// thật, chia sẻ cache với luồng xác minh đầy đủ đã có.
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { verify } from "@/lib/sourcing/search-engine";
import { checkRateLimit } from "@/lib/rate-limit";
import { lookupVietQrBusiness, normalizeRegistryValue, normalizeVietnamTaxCode, type VietQrBusinessRecord, type VietQrLookupResult } from "@/lib/vietqr-business";
import { lookupMaSoThueBusiness, type MaSoThueBusinessRecord, type MaSoThueLookupResult } from "@/lib/masothue-business";
import { reconcileRegistryEvidence, type RegistryEvidenceValue, type RegistryReconciliation } from "@/lib/registry-reconciliation";

export const runtime = "nodejs";

interface VietQrCacheRow {
  lookup_status: "SUCCESS" | "NOT_FOUND"; response_code: string; legal_name: string; international_name: string; short_name: string;
  registered_address: string; taxpayer_status: string; source_url: string; fetched_at: string; expires_at: string;
}
interface MaSoThueCacheRow {
  lookup_status: "SUCCESS" | "NOT_FOUND"; legal_name: string; registered_address: string; taxpayer_status: string;
  representative_name: string; phone: string; operation_date: string | null; managing_tax_authority: string; business_type: string; main_business_line: string;
  source_url: string; fetched_at: string; expires_at: string; source_updated_at: string | null;
}

async function lookupOrCacheVietQr(client: SupabaseClient, userId: string, taxCode: string): Promise<VietQrLookupResult & { cached: boolean }> {
  const { data: cached, error: cacheError } = await client.from("production_company_registry_cache")
    .select("lookup_status,response_code,legal_name,international_name,short_name,registered_address,taxpayer_status,source_url,fetched_at,expires_at")
    .eq("organization_id", "mimin").eq("provider", "VIETQR").eq("tax_code", taxCode)
    .in("lookup_status", ["SUCCESS", "NOT_FOUND"]).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (cacheError) throw new Error(cacheError.message);
  if (cached) {
    const row = cached as VietQrCacheRow;
    const record: VietQrBusinessRecord | null = row.lookup_status === "SUCCESS"
      ? { taxCode, legalName: row.legal_name, internationalName: row.international_name, shortName: row.short_name, registeredAddress: row.registered_address, taxpayerStatus: row.taxpayer_status }
      : null;
    return { status: row.lookup_status, responseCode: row.response_code, responseDescription: "", record, rawPayload: {}, payloadHash: "", sourceUrl: row.source_url, fetchedAt: row.fetched_at, expiresAt: row.expires_at, cached: true };
  }
  const result = await lookupVietQrBusiness(taxCode);
  const values = { organization_id: "mimin", provider: "VIETQR", tax_code: taxCode, lookup_status: result.status, response_code: result.responseCode, legal_name: result.record?.legalName ?? "", international_name: result.record?.internationalName ?? "", short_name: result.record?.shortName ?? "", registered_address: result.record?.registeredAddress ?? "", taxpayer_status: result.record?.taxpayerStatus ?? "", source_url: result.sourceUrl, raw_payload: result.rawPayload, payload_hash: result.payloadHash, fetched_at: result.fetchedAt, expires_at: result.expiresAt, created_by: userId, updated_by: userId };
  const { error } = await client.from("production_company_registry_cache").upsert(values, { onConflict: "organization_id,provider,tax_code" });
  if (error) throw new Error(error.message);
  return { ...result, cached: false };
}

async function lookupOrCacheMaSoThue(client: SupabaseClient, userId: string, taxCode: string): Promise<MaSoThueLookupResult & { cached: boolean }> {
  const { data: cached, error: cacheError } = await client.from("production_company_registry_cache")
    .select("lookup_status,legal_name,registered_address,taxpayer_status,representative_name,phone,operation_date,managing_tax_authority,business_type,main_business_line,source_url,fetched_at,expires_at,source_updated_at")
    .eq("organization_id", "mimin").eq("provider", "MASOTHUE").eq("tax_code", taxCode)
    .in("lookup_status", ["SUCCESS", "NOT_FOUND"]).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (cacheError) throw new Error(cacheError.message);
  if (cached) {
    const row = cached as MaSoThueCacheRow;
    const record: MaSoThueBusinessRecord | null = row.lookup_status === "SUCCESS"
      ? { taxCode, legalName: row.legal_name, registeredAddress: row.registered_address, taxpayerStatus: row.taxpayer_status, representativeName: row.representative_name, phone: row.phone, operationDate: row.operation_date ?? "", managingTaxAuthority: row.managing_tax_authority, businessType: row.business_type, mainBusinessLine: row.main_business_line }
      : null;
    return { status: row.lookup_status, record, rawPayload: {}, payloadHash: "", sourceUrl: row.source_url, fetchedAt: row.fetched_at, expiresAt: row.expires_at, sourceUpdatedAt: row.source_updated_at, cached: true };
  }
  const result = await lookupMaSoThueBusiness(taxCode);
  const record = result.record;
  const values = { organization_id: "mimin", provider: "MASOTHUE", tax_code: taxCode, lookup_status: result.status, response_code: result.status === "SUCCESS" ? "00" : "NOT_FOUND", legal_name: record?.legalName ?? "", international_name: "", short_name: "", registered_address: record?.registeredAddress ?? "", taxpayer_status: record?.taxpayerStatus ?? "", representative_name: record?.representativeName ?? "", phone: record?.phone ?? "", operation_date: record?.operationDate || null, managing_tax_authority: record?.managingTaxAuthority ?? "", business_type: record?.businessType ?? "", main_business_line: record?.mainBusinessLine ?? "", source_url: result.sourceUrl, raw_payload: result.rawPayload, payload_hash: result.payloadHash, fetched_at: result.fetchedAt, expires_at: result.expiresAt, source_updated_at: result.sourceUpdatedAt, created_by: userId, updated_by: userId };
  const { error } = await client.from("production_company_registry_cache").upsert(values, { onConflict: "organization_id,provider,tax_code" });
  if (error) throw new Error(error.message);
  return { ...result, cached: false };
}

function evidenceFrom(provider: "VIETQR" | "MASOTHUE", record: VietQrBusinessRecord | MaSoThueBusinessRecord | null, sourceUrl: string, capturedAt: string): RegistryEvidenceValue[] {
  if (!record) return [];
  const taxpayerStatus = "taxpayerStatus" in record ? record.taxpayerStatus : "";
  return ([
    { fieldName: "TAX_CODE" as const, fieldValue: record.taxCode },
    { fieldName: "LEGAL_NAME" as const, fieldValue: record.legalName },
    { fieldName: "REGISTERED_ADDRESS" as const, fieldValue: record.registeredAddress },
    { fieldName: "TAXPAYER_STATUS" as const, fieldValue: taxpayerStatus },
  ]).filter((field) => field.fieldValue).map((field) => ({ provider, fieldName: field.fieldName, fieldValue: field.fieldValue, normalizedValue: normalizeRegistryValue(field.fieldValue), sourceUrl, capturedAt }));
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verify(req);
    if (!auth) return NextResponse.json({ error: "Không có quyền tra cứu pháp lý" }, { status: 401 });

    const vietQrLimit = checkRateLimit(`legal-lookup:vietqr:user:${auth.user.id}`, { max: 10, windowMs: 60_000 });
    if (!vietQrLimit.allowed) return NextResponse.json({ error: `Vượt giới hạn tra cứu, thử lại sau ${vietQrLimit.retryAfterSec}s` }, { status: 429 });
    const maSoThueLimit = checkRateLimit(`legal-lookup:masothue:user:${auth.user.id}`, { max: 5, windowMs: 60_000 });
    if (!maSoThueLimit.allowed) return NextResponse.json({ error: `Vượt giới hạn tra cứu MaSoThue (5 lượt/phút), thử lại sau ${maSoThueLimit.retryAfterSec}s` }, { status: 429 });

    const body = await req.json() as { taxCode?: unknown };
    let taxCode: string;
    try {
      taxCode = normalizeVietnamTaxCode(typeof body.taxCode === "string" ? body.taxCode : "");
    } catch {
      return NextResponse.json({ error: "Mã số thuế không hợp lệ (phải có 10 hoặc 13 số)" }, { status: 400 });
    }

    const [vietQrSettled, maSoThueSettled] = await Promise.allSettled([
      lookupOrCacheVietQr(auth.client, auth.user.id, taxCode),
      lookupOrCacheMaSoThue(auth.client, auth.user.id, taxCode),
    ]);

    const vietQr = vietQrSettled.status === "fulfilled"
      ? { status: vietQrSettled.value.status, record: vietQrSettled.value.record, cached: vietQrSettled.value.cached, sourceUrl: vietQrSettled.value.sourceUrl, fetchedAt: vietQrSettled.value.fetchedAt }
      : { status: "ERROR" as const, error: vietQrSettled.reason instanceof Error ? vietQrSettled.reason.message : "Không tra cứu được VietQR" };
    const maSoThue = maSoThueSettled.status === "fulfilled"
      ? { status: maSoThueSettled.value.status, record: maSoThueSettled.value.record, cached: maSoThueSettled.value.cached, sourceUrl: maSoThueSettled.value.sourceUrl, fetchedAt: maSoThueSettled.value.fetchedAt }
      : { status: "ERROR" as const, error: maSoThueSettled.reason instanceof Error ? maSoThueSettled.reason.message : "Không tra cứu được MaSoThue" };

    const evidence: RegistryEvidenceValue[] = [
      ...(vietQrSettled.status === "fulfilled" ? evidenceFrom("VIETQR", vietQrSettled.value.record, vietQrSettled.value.sourceUrl, vietQrSettled.value.fetchedAt) : []),
      ...(maSoThueSettled.status === "fulfilled" ? evidenceFrom("MASOTHUE", maSoThueSettled.value.record, maSoThueSettled.value.sourceUrl, maSoThueSettled.value.fetchedAt) : []),
    ];
    const reconciliation: RegistryReconciliation | null = evidence.length ? reconcileRegistryEvidence(evidence) : null;

    return NextResponse.json({ taxCode, vietQr, maSoThue, reconciliation });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không tra cứu được pháp lý" }, { status: 502 });
  }
}
