import { supabase } from "@/lib/supabase/client";
import type { RegistryFieldComparison, RegistryReconciliation } from "@/lib/registry-reconciliation";

export interface CompanyRegistryVerification extends RegistryReconciliation {
  id: string;
  createdAt: string;
}

export interface RegistryProviderAttempt {
  provider: "VIETQR" | "MASOTHUE";
  ok: boolean;
  message: string;
}

export type RegistryReviewDecision = "ACCEPT_VIETQR" | "ACCEPT_MASOTHUE" | "KEEP_PROFILE" | "REJECT_BOTH";
export interface RegistryFieldReview {
  id: string;
  reconciliationId: string;
  fieldName: RegistryFieldComparison["fieldName"];
  decision: RegistryReviewDecision;
  selectedValue: string;
  note: string;
  reviewedBy: string;
  reviewedAt: string;
}

interface FieldReviewRow {
  id: string; reconciliation_id: string; field_name: RegistryFieldReview["fieldName"];
  decision: RegistryReviewDecision; selected_value: string | null; note: string; reviewed_by: string; reviewed_at: string;
}

interface ReconciliationRow {
  id: string;
  formula_version: "registry-v3.1";
  overall_status: CompanyRegistryVerification["overallStatus"];
  match_score: number;
  matched_fields: number;
  partial_fields: number;
  conflict_fields: number;
  missing_fields: number;
  field_results: RegistryFieldComparison[];
  created_at: string;
}

function mapReconciliation(row: ReconciliationRow): CompanyRegistryVerification {
  return {
    id: row.id,
    formulaVersion: row.formula_version,
    overallStatus: row.overall_status,
    matchScore: row.match_score,
    matchedFields: row.matched_fields,
    partialFields: row.partial_fields,
    conflictFields: row.conflict_fields,
    missingFields: row.missing_fields,
    fields: row.field_results,
    createdAt: row.created_at,
  };
}

async function accessToken(): Promise<string> {
  if (!supabase) throw new Error("Chưa kết nối Supabase");
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  if (!token) throw new Error("Phiên đăng nhập đã hết hạn");
  return token;
}

async function postRegistry(path: string, token: string, profileId: string, taxCode: string): Promise<Response> {
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ profileId, taxCode }),
  });
}

async function responseMessage(response: Response): Promise<string> {
  const payload = await response.json().catch((): Record<string, unknown> => ({})) as Record<string, unknown>;
  if (typeof payload.error === "string") return payload.error;
  return response.ok ? "Đã thu thập chứng cứ" : `Nguồn tạm lỗi (HTTP ${response.status})`;
}

export async function loadLatestRegistryVerification(profileId: string): Promise<CompanyRegistryVerification | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("production_company_registry_reconciliations")
    .select("id,formula_version,overall_status,match_score,matched_fields,partial_fields,conflict_fields,missing_fields,field_results,created_at")
    .eq("organization_id", "mimin")
    .eq("company_profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapReconciliation(data as ReconciliationRow) : null;
}

export async function runRegistryVerification(profileId: string, taxCode: string): Promise<{ verification: CompanyRegistryVerification; attempts: RegistryProviderAttempt[] }> {
  const token = await accessToken();
  const providers = [
    { provider: "VIETQR" as const, path: "/api/v1/sourcing/company-registry/vietqr" },
    { provider: "MASOTHUE" as const, path: "/api/v1/sourcing/company-registry/masothue" },
  ];
  const attempts = await Promise.all(providers.map(async ({ provider, path }): Promise<RegistryProviderAttempt> => {
    try {
      const response = await postRegistry(path, token, profileId, taxCode);
      return { provider, ok: response.ok, message: await responseMessage(response) };
    } catch (error) {
      return { provider, ok: false, message: error instanceof Error ? error.message : "Không kết nối được nguồn" };
    }
  }));
  const response = await postRegistry("/api/v1/sourcing/company-registry/reconcile", token, profileId, taxCode);
  const payload = await response.json().catch((): Record<string, unknown> => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Không đối chiếu được hai nguồn");
  return { verification: payload as unknown as CompanyRegistryVerification, attempts };
}

export async function loadRegistryFieldReviews(reconciliationId: string): Promise<RegistryFieldReview[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("production_company_registry_field_reviews")
    .select("id,reconciliation_id,field_name,decision,selected_value,note,reviewed_by,reviewed_at")
    .eq("organization_id", "mimin").eq("reconciliation_id", reconciliationId)
    .order("reviewed_at", { ascending: false });
  if (error) throw new Error(error.message);
  const latest = new Map<RegistryFieldReview["fieldName"], RegistryFieldReview>();
  for (const row of (data ?? []) as FieldReviewRow[]) if (!latest.has(row.field_name)) latest.set(row.field_name, { id: row.id, reconciliationId: row.reconciliation_id, fieldName: row.field_name, decision: row.decision, selectedValue: row.selected_value ?? "", note: row.note, reviewedBy: row.reviewed_by, reviewedAt: row.reviewed_at });
  return Array.from(latest.values());
}

export async function createRegistryFieldReview(profileId: string, reconciliationId: string, fieldName: RegistryFieldReview["fieldName"], decision: RegistryReviewDecision, note: string): Promise<void> {
  const token = await accessToken();
  const response = await fetch("/api/v1/sourcing/company-registry/reviews", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ profileId, reconciliationId, fieldName, decision, note }) });
  const payload = await response.json().catch((): Record<string, unknown> => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Không lưu được quyết định kiểm duyệt");
}
