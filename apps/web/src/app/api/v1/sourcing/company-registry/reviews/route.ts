import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { RegistryFieldComparison, RegistryFieldName } from "@/lib/registry-reconciliation";

export const runtime = "nodejs";
const ALLOWED_ROLES = new Set(["admin", "planner", "warehouse", "accountant"]);
const FIELDS = new Set(["TAX_CODE", "LEGAL_NAME", "REGISTERED_ADDRESS", "TAXPAYER_STATUS"]);
const DECISIONS = new Set(["ACCEPT_VIETQR", "ACCEPT_MASOTHUE", "KEEP_PROFILE", "REJECT_BOTH"]);

type ReviewDecision = "ACCEPT_VIETQR" | "ACCEPT_MASOTHUE" | "KEEP_PROFILE" | "REJECT_BOTH";

async function verify(req: NextRequest): Promise<{ client: SupabaseClient; user: User } | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return null;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  const role = String(data.user?.app_metadata?.role ?? "");
  return error || !data.user || !ALLOWED_ROLES.has(role) ? null : { client, user: data.user };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verify(req);
    if (!auth) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
    const body = await req.json() as Record<string, unknown>;
    const profileId = typeof body.profileId === "string" ? body.profileId.trim() : "";
    const reconciliationId = typeof body.reconciliationId === "string" ? body.reconciliationId.trim() : "";
    const fieldName = typeof body.fieldName === "string" ? body.fieldName.trim() : "";
    const decision = typeof body.decision === "string" ? body.decision.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : "";
    if (!profileId || !reconciliationId || !FIELDS.has(fieldName) || !DECISIONS.has(decision)) return NextResponse.json({ error: "Quyết định kiểm duyệt không hợp lệ" }, { status: 400 });
    const { data, error } = await auth.client.from("production_company_registry_reconciliations").select("id,company_profile_id,tax_code,field_results").eq("organization_id", "mimin").eq("id", reconciliationId).eq("company_profile_id", profileId).single();
    if (error || !data) return NextResponse.json({ error: "Không tìm thấy ảnh chụp đối chiếu" }, { status: 404 });
    const fields = Array.isArray(data.field_results) ? data.field_results as RegistryFieldComparison[] : [];
    const field = fields.find(item => item.fieldName === fieldName as RegistryFieldName);
    if (!field) return NextResponse.json({ error: "Ảnh chụp không có trường cần duyệt" }, { status: 409 });
    const typedDecision = decision as ReviewDecision;
    const selectedValue = typedDecision === "ACCEPT_VIETQR" ? field.vietQrValue : typedDecision === "ACCEPT_MASOTHUE" ? field.maSoThueValue : null;
    if ((typedDecision === "ACCEPT_VIETQR" || typedDecision === "ACCEPT_MASOTHUE") && !selectedValue) return NextResponse.json({ error: "Nguồn được chọn đang thiếu dữ liệu" }, { status: 409 });
    const { data: review, error: insertError } = await auth.client.from("production_company_registry_field_reviews").insert({ organization_id: "mimin", company_profile_id: profileId, reconciliation_id: reconciliationId, tax_code: data.tax_code, field_name: fieldName, decision: typedDecision, selected_value: selectedValue, note, evidence_snapshot: field, reviewed_by: auth.user.id }).select("id,reviewed_at").single();
    if (insertError) throw new Error(insertError.message);
    return NextResponse.json({ id: review.id, reviewedAt: review.reviewed_at, fieldName, decision: typedDecision, selectedValue, note });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không lưu được quyết định kiểm duyệt" }, { status: 500 });
  }
}
