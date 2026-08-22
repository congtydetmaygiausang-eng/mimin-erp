// @codex MIMIN GROUP - truy vấn dữ liệu đối tác phía server cho AI Search Agent.
// production-network.ts / production-discovery.ts đọc phiên đăng nhập qua client
// browser singleton (session từ cookie/localStorage) nên KHÔNG dùng trực tiếp được
// trong API route server-side. File này chỉ tái dùng các hàm/type THUẦN (không đụng
// `supabase` singleton) từ 2 file đó, còn lại tự truy vấn bằng client RLS-scoped
// được truyền vào từ route (constructed từ bearer token của người gọi).

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PRODUCTION_ORGANIZATION_ID,
  ROLE_LABELS,
  calculateDistanceKm,
  calculatePartnerScore,
  PARTNER_ROLES,
  type ProductionPartner,
  type ProductionPartnerRole,
} from "@/lib/production-network";
import type { DirectSearchCandidate } from "@/lib/production-discovery";

export interface AgentPartnerDetail {
  id: string;
  partnerCode: string;
  legalName: string;
  taxCode: string;
  phone: string;
  email: string;
  website: string;
  contactName: string;
  address: string;
  province: string;
  district: string;
  status: string;
  verificationStatus: string;
  notes: string;
  capabilities: string[];
  capacityPerMonth: number | null;
  minimumOrderQuantity: number | null;
  leadTimeDays: number | null;
  qualityScore: number | null;
  reliabilityScore: number | null;
  score: number | null;
  roles: ProductionPartnerRole[];
  roleLabels: string[];
  createdAt: string;
  updatedAt: string;
}

interface PartnerRow {
  id: string;
  partner_code: string;
  legal_name: string;
  tax_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  contact_name: string | null;
  address: string | null;
  province: string | null;
  district: string | null;
  status: string;
  verification_status: string;
  notes: string | null;
  capabilities: string[] | null;
  capacity_per_month: number | null;
  minimum_order_quantity: number | null;
  lead_time_days: number | null;
  quality_score: number | null;
  reliability_score: number | null;
  created_at: string;
  updated_at: string;
}

function isPartnerRole(value: unknown): value is ProductionPartnerRole {
  return typeof value === "string" && (PARTNER_ROLES as readonly string[]).includes(value);
}

function mapPartnerRow(row: PartnerRow, roles: ProductionPartnerRole[]): AgentPartnerDetail {
  const partnerForScore: Pick<ProductionPartner, "qualityScore" | "reliabilityScore"> = {
    qualityScore: row.quality_score,
    reliabilityScore: row.reliability_score,
  };
  return {
    id: row.id,
    partnerCode: row.partner_code,
    legalName: row.legal_name,
    taxCode: row.tax_code ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    website: row.website ?? "",
    contactName: row.contact_name ?? "",
    address: row.address ?? "",
    province: row.province ?? "",
    district: row.district ?? "",
    status: row.status,
    verificationStatus: row.verification_status,
    notes: row.notes ?? "",
    capabilities: row.capabilities ?? [],
    capacityPerMonth: row.capacity_per_month,
    minimumOrderQuantity: row.minimum_order_quantity,
    leadTimeDays: row.lead_time_days,
    qualityScore: row.quality_score,
    reliabilityScore: row.reliability_score,
    score: calculatePartnerScore(partnerForScore as ProductionPartner),
    roles,
    roleLabels: roles.map((role) => ROLE_LABELS[role]),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadRolesFor(client: SupabaseClient, organizationId: string, partnerIds: string[]): Promise<Map<string, ProductionPartnerRole[]>> {
  const map = new Map<string, ProductionPartnerRole[]>();
  if (partnerIds.length === 0) return map;
  const { data, error } = await client
    .from("production_partner_roles")
    .select("partner_id, role")
    .eq("organization_id", organizationId)
    .in("partner_id", partnerIds);
  if (error) throw error;
  for (const row of data ?? []) {
    const role = (row as { partner_id: string; role: unknown }).role;
    const partnerId = (row as { partner_id: string; role: unknown }).partner_id;
    if (!isPartnerRole(role)) continue;
    const current = map.get(partnerId) ?? [];
    map.set(partnerId, [...current, role]);
  }
  return map;
}

export async function getPartnerDetail(
  client: SupabaseClient,
  partnerId: string,
  organizationId: string = PRODUCTION_ORGANIZATION_ID,
): Promise<AgentPartnerDetail | null> {
  const { data: partnerRow, error } = await client
    .from("production_partners")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", partnerId)
    .maybeSingle();
  if (error) throw error;
  if (!partnerRow) return null;
  const roleMap = await loadRolesFor(client, organizationId, [partnerId]);
  return mapPartnerRow(partnerRow as PartnerRow, roleMap.get(partnerId) ?? []);
}

export async function listPartnersForCompare(
  client: SupabaseClient,
  partnerIds: string[],
  organizationId: string = PRODUCTION_ORGANIZATION_ID,
): Promise<AgentPartnerDetail[]> {
  const ids = partnerIds.slice(0, 10);
  if (ids.length === 0) return [];
  const { data, error } = await client
    .from("production_partners")
    .select("*")
    .eq("organization_id", organizationId)
    .in("id", ids);
  if (error) throw error;
  const rows = (data ?? []) as PartnerRow[];
  const roleMap = await loadRolesFor(client, organizationId, rows.map((row) => row.id));
  return rows.map((row) => mapPartnerRow(row, roleMap.get(row.id) ?? []));
}

export async function rankPartners(
  client: SupabaseClient,
  roles: ProductionPartnerRole[],
  limit: number,
  organizationId: string = PRODUCTION_ORGANIZATION_ID,
): Promise<AgentPartnerDetail[]> {
  const { data: roleRows, error: roleError } = await client
    .from("production_partner_roles")
    .select("partner_id")
    .eq("organization_id", organizationId)
    .in("role", roles);
  if (roleError) throw roleError;
  const partnerIds = Array.from(new Set((roleRows ?? []).map((row) => (row as { partner_id: string }).partner_id)));
  if (partnerIds.length === 0) return [];

  const { data, error } = await client
    .from("production_partners")
    .select("*")
    .eq("organization_id", organizationId)
    .in("id", partnerIds);
  if (error) throw error;
  const rows = (data ?? []) as PartnerRow[];
  const roleMap = await loadRolesFor(client, organizationId, rows.map((row) => row.id));
  return rows
    .map((row) => mapPartnerRow(row, roleMap.get(row.id) ?? []))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    .slice(0, Math.min(Math.max(limit, 1), 50));
}

// Khoảng Unicode combining diacritical marks (U+0300-U+036F), viết bằng mã ký tự
// để tránh gõ nhầm ký tự tổ hợp dấu literal trực tiếp vào source.
const DIACRITIC_MARKS_PATTERN = new RegExp(
  `[\\u${(0x0300).toString(16).padStart(4, "0")}-\\u${(0x036f).toString(16).padStart(4, "0")}]`,
  "g",
);

function normalizedIdentity(value: string): string {
  return value.normalize("NFD").replace(DIACRITIC_MARKS_PATTERN, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function textValue(value: unknown, maximum = 500): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

async function fingerprint(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

export interface InsertDiscoveryCandidateResult {
  inserted: boolean;
  saveKey: string;
}

/**
 * Lưu 1 kết quả tìm kiếm (đã được search_partners trả về, KHÔNG phải dữ liệu do LLM
 * tự gõ lại) vào vùng chờ production_discovery_candidates - mirror chính xác logic
 * saveDirectSearchCandidates() phía client (production-discovery.ts) để giữ cùng
 * cơ chế chống trùng (fingerprint theo provider+sourceUrl+legalName).
 */
export async function insertDiscoveryCandidate(
  client: SupabaseClient,
  candidate: DirectSearchCandidate,
  role: ProductionPartnerRole,
  searchQuery: string,
  provider: string,
  organizationId: string = PRODUCTION_ORGANIZATION_ID,
): Promise<InsertDiscoveryCandidateResult> {
  const externalId = await fingerprint(`${provider}|${candidate.sourceUrl}|${candidate.legalName}`);
  const row = {
    organization_id: organizationId,
    role,
    search_query: searchQuery,
    legal_name: textValue(candidate.legalName, 200),
    address: textValue(candidate.address),
    province: textValue(candidate.province, 100),
    district: textValue(candidate.district, 100),
    phone: textValue(candidate.phone, 50),
    website: textValue(candidate.website),
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    source_provider: `DIRECT_${provider}`,
    source_url: candidate.sourceUrl,
    external_id: externalId,
    raw_data: candidate,
  };
  const { error } = await client
    .from("production_discovery_candidates")
    .upsert([row], { onConflict: "organization_id,source_provider,external_id", ignoreDuplicates: true });
  if (error) throw error;
  return {
    inserted: true,
    saveKey: `${normalizedIdentity(candidate.sourceUrl)}|${normalizedIdentity(candidate.legalName)}|${normalizedIdentity(candidate.address)}`,
  };
}

export async function callApproveProductionCandidate(client: SupabaseClient, candidateId: string): Promise<string> {
  const { data, error } = await client.rpc("approve_production_candidate", { p_candidate_id: candidateId });
  if (error) throw error;
  return data as string;
}

export { calculateDistanceKm };
