import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { RegistryFieldName } from "@/lib/registry-reconciliation";
import type { RegistryFieldReview } from "@/lib/company-registry-verification";

export const runtime = "nodejs";
const ALLOWED_ROLES = new Set(["admin", "planner", "warehouse", "accountant"]);
const REQUIRED_FIELDS: RegistryFieldName[] = ["TAX_CODE", "LEGAL_NAME", "REGISTERED_ADDRESS", "TAXPAYER_STATUS"];

interface ReviewRow {
  id: string; reconciliation_id: string; field_name: RegistryFieldName; decision: RegistryFieldReview["decision"];
  selected_value: string | null; note: string; reviewed_by: string; reviewed_at: string;
}

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
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : "";
    if (!profileId || !reconciliationId) return NextResponse.json({ error: "Thiếu hồ sơ hoặc lần đối chiếu" }, { status: 400 });
    const { data: reconciliation, error: reconciliationError } = await auth.client.from("production_company_registry_reconciliations").select("id,company_profile_id,tax_code").eq("organization_id", "mimin").eq("id", reconciliationId).eq("company_profile_id", profileId).single();
    if (reconciliationError || !reconciliation) return NextResponse.json({ error: "Không tìm thấy ảnh chụp đối chiếu" }, { status: 404 });
    const { data, error } = await auth.client.from("production_company_registry_field_reviews").select("id,reconciliation_id,field_name,decision,selected_value,note,reviewed_by,reviewed_at").eq("organization_id", "mimin").eq("reconciliation_id", reconciliationId).order("reviewed_at", { ascending: false });
    if (error) throw new Error(error.message);
    const latest = new Map<RegistryFieldName, ReviewRow>();
    for (const row of (data ?? []) as ReviewRow[]) if (!latest.has(row.field_name)) latest.set(row.field_name, row);
    const missing = REQUIRED_FIELDS.filter(field => !latest.has(field));
    if (missing.length) return NextResponse.json({ error: `Chưa duyệt đủ ${missing.length} trường pháp lý` }, { status: 409 });
    const reviews = REQUIRED_FIELDS.map(field => latest.get(field) as ReviewRow);
    const packetStatus = reviews.some(review => review.decision === "REJECT_BOTH") ? "NEEDS_REVIEW" : "VERIFIED";
    const selectedFields = Object.fromEntries(reviews.map(review => [review.field_name, { decision: review.decision, value: review.selected_value ?? "" }]));
    const reviewSnapshot = reviews.map(review => ({ id: review.id, fieldName: review.field_name, decision: review.decision, selectedValue: review.selected_value ?? "", note: review.note, reviewedBy: review.reviewed_by, reviewedAt: review.reviewed_at }));
    const { data: packet, error: insertError } = await auth.client.from("production_company_registry_verification_packets").insert({ organization_id: "mimin", company_profile_id: profileId, reconciliation_id: reconciliationId, tax_code: reconciliation.tax_code, packet_status: packetStatus, review_count: reviews.length, selected_fields: selectedFields, review_snapshot: reviewSnapshot, note, finalized_by: auth.user.id }).select("id,finalized_at").single();
    if (insertError) throw new Error(insertError.message);
    return NextResponse.json({ id: packet.id, status: packetStatus, reviewCount: reviews.length, finalizedAt: packet.finalized_at });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không chốt được biên bản xác minh" }, { status: 500 });
  }
}
