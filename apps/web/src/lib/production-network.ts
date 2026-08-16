// @codex Phân hệ Mạng lưới sản xuất - tách biệt dữ liệu danh mục ERP cũ.

import { supabase } from "@/lib/supabase/client";

export const PRODUCTION_ORGANIZATION_ID = "mimin";
const LOCAL_STORAGE_KEY = "mimin_production_partners_v1";

export const PARTNER_ROLES = [
  "CUSTOMER",
  "SATELLITE_PROCESSOR",
  "MATERIAL_SUPPLIER",
  "PACKAGING_FINISHER",
] as const;

export type ProductionPartnerRole = (typeof PARTNER_ROLES)[number];
export type PartnerStatus = "ACTIVE" | "INACTIVE";
export type VerificationStatus = "DISCOVERED" | "REVIEWED" | "VERIFIED";

export interface ProductionPartner {
  id: string;
  organizationId: string;
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
  status: PartnerStatus;
  verificationStatus: VerificationStatus;
  notes: string;
  capabilities: string[];
  capacityPerMonth: number | null;
  minimumOrderQuantity: number | null;
  leadTimeDays: number | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number | null;
  qualityScore: number | null;
  reliabilityScore: number | null;
  roles: ProductionPartnerRole[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductionPartnerInput {
  id?: string;
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
  status: PartnerStatus;
  verificationStatus: VerificationStatus;
  notes: string;
  capabilities: string[];
  capacityPerMonth: number | null;
  minimumOrderQuantity: number | null;
  leadTimeDays: number | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number | null;
  qualityScore: number | null;
  reliabilityScore: number | null;
  roles: ProductionPartnerRole[];
}

interface PartnerRow {
  id: string;
  organization_id: string;
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
  status: PartnerStatus;
  verification_status: VerificationStatus;
  notes: string | null;
  capabilities: string[] | null;
  capacity_per_month: number | null;
  minimum_order_quantity: number | null;
  lead_time_days: number | null;
  latitude: number | null;
  longitude: number | null;
  service_radius_km: number | null;
  quality_score: number | null;
  reliability_score: number | null;
  created_at: string;
  updated_at: string;
}

interface RoleRow {
  partner_id: string;
  role: ProductionPartnerRole;
}

export interface DuplicateMatch {
  partner: ProductionPartner;
  reason: "Mã số thuế" | "Số điện thoại" | "Website" | "Tên và địa chỉ";
}

export const ROLE_LABELS: Record<ProductionPartnerRole, string> = {
  CUSTOMER: "Khách hàng",
  SATELLITE_PROCESSOR: "Gia công vệ tinh",
  MATERIAL_SUPPLIER: "Nhà cung cấp vật tư",
  PACKAGING_FINISHER: "Đóng gói & hoàn thiện",
};

export const ROLE_PREFIXES: Record<ProductionPartnerRole, string> = {
  CUSTOMER: "KH",
  SATELLITE_PROCESSOR: "GCVT",
  MATERIAL_SUPPLIER: "VT",
  PACKAGING_FINISHER: "DGHT",
};

export function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length >= 10) return `0${digits.slice(2)}`;
  return digits;
}

export function findDuplicatePartner(
  partners: ProductionPartner[],
  input: ProductionPartnerInput,
): DuplicateMatch | null {
  const currentId = input.id;
  const normalizedTaxCode = normalizeSearchValue(input.taxCode);
  const normalizedInputPhone = normalizePhone(input.phone);
  const normalizedWebsite = normalizeSearchValue(
    input.website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0],
  );
  const normalizedName = normalizeSearchValue(input.legalName);
  const normalizedAddress = normalizeSearchValue(input.address);

  for (const partner of partners) {
    if (partner.id === currentId) continue;
    if (normalizedTaxCode && normalizeSearchValue(partner.taxCode) === normalizedTaxCode) {
      return { partner, reason: "Mã số thuế" };
    }
    if (normalizedInputPhone && normalizePhone(partner.phone) === normalizedInputPhone) {
      return { partner, reason: "Số điện thoại" };
    }
    const partnerWebsite = normalizeSearchValue(
      partner.website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0],
    );
    if (normalizedWebsite && partnerWebsite === normalizedWebsite) {
      return { partner, reason: "Website" };
    }
    if (
      normalizedName &&
      normalizedAddress &&
      normalizeSearchValue(partner.legalName) === normalizedName &&
      normalizeSearchValue(partner.address) === normalizedAddress
    ) {
      return { partner, reason: "Tên và địa chỉ" };
    }
  }
  return null;
}

export function createPartnerCode(role: ProductionPartnerRole, partners: ProductionPartner[]): string {
  const prefix = ROLE_PREFIXES[role];
  const highestSequence = partners.reduce((highest, partner) => {
    const match = partner.partnerCode.match(new RegExp(`^${prefix}-(\\d+)$`, "i"));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `${prefix}-${String(highestSequence + 1).padStart(4, "0")}`;
}

export function calculateDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371.0088;
  const latitudeDelta = toRadians(toLatitude - fromLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(fromLatitude)) * Math.cos(toRadians(toLatitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculatePartnerScore(partner: ProductionPartner): number | null {
  const scores = [partner.qualityScore, partner.reliabilityScore].filter(
    (score): score is number => score !== null,
  );
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

function isPartnerRole(value: unknown): value is ProductionPartnerRole {
  return typeof value === "string" && PARTNER_ROLES.includes(value as ProductionPartnerRole);
}

function mapPartner(row: PartnerRow, roles: ProductionPartnerRole[]): ProductionPartner {
  return {
    id: row.id,
    organizationId: row.organization_id,
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
    latitude: row.latitude,
    longitude: row.longitude,
    serviceRadiusKm: row.service_radius_km,
    qualityScore: row.quality_score,
    reliabilityScore: row.reliability_score,
    roles,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function loadLocalPartners(): ProductionPartner[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ProductionPartner[]) : [];
  } catch {
    return [];
  }
}

function saveLocalPartners(partners: ProductionPartner[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(partners));
}

async function hasAuthenticatedSession(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session?.user);
}

export async function loadProductionPartners(): Promise<ProductionPartner[]> {
  if (!supabase || !(await hasAuthenticatedSession())) return loadLocalPartners();

  const [partnerResult, roleResult] = await Promise.all([
    supabase
      .from("production_partners")
      .select("*")
      .eq("organization_id", PRODUCTION_ORGANIZATION_ID)
      .order("legal_name"),
    supabase
      .from("production_partner_roles")
      .select("partner_id, role")
      .eq("organization_id", PRODUCTION_ORGANIZATION_ID),
  ]);

  if (partnerResult.error) throw partnerResult.error;
  if (roleResult.error) throw roleResult.error;

  const roleMap = new Map<string, ProductionPartnerRole[]>();
  for (const rawRole of roleResult.data ?? []) {
    const roleRow = rawRole as RoleRow;
    if (!isPartnerRole(roleRow.role)) continue;
    const current = roleMap.get(roleRow.partner_id) ?? [];
    roleMap.set(roleRow.partner_id, [...current, roleRow.role]);
  }

  return (partnerResult.data ?? []).map((rawPartner) => {
    const partnerRow = rawPartner as PartnerRow;
    return mapPartner(partnerRow, roleMap.get(partnerRow.id) ?? []);
  });
}

export async function saveProductionPartner(
  input: ProductionPartnerInput,
  currentPartners: ProductionPartner[],
): Promise<ProductionPartner[]> {
  const duplicate = findDuplicatePartner(currentPartners, input);
  if (duplicate) {
    throw new Error(`${duplicate.reason} đã thuộc hồ sơ ${duplicate.partner.partnerCode} — ${duplicate.partner.legalName}`);
  }
  if (input.roles.length === 0) throw new Error("Đối tác phải có ít nhất một vai trò");

  if (!supabase || !(await hasAuthenticatedSession())) {
    const now = new Date().toISOString();
    const saved: ProductionPartner = {
      ...input,
      id: input.id ?? crypto.randomUUID(),
      organizationId: PRODUCTION_ORGANIZATION_ID,
      createdAt: currentPartners.find((partner) => partner.id === input.id)?.createdAt ?? now,
      updatedAt: now,
    };
    const next = input.id
      ? currentPartners.map((partner) => (partner.id === input.id ? saved : partner))
      : [...currentPartners, saved];
    saveLocalPartners(next);
    return next;
  }

  const { error } = await supabase.rpc("save_production_partner", {
    p_id: input.id ?? null,
    p_partner_code: input.partnerCode,
    p_legal_name: input.legalName,
    p_tax_code: input.taxCode,
    p_phone: input.phone,
    p_email: input.email,
    p_website: input.website,
    p_contact_name: input.contactName,
    p_address: input.address,
    p_province: input.province,
    p_district: input.district,
    p_status: input.status,
    p_verification_status: input.verificationStatus,
    p_notes: input.notes,
    p_roles: input.roles,
    p_capabilities: input.capabilities,
    p_capacity_per_month: input.capacityPerMonth,
    p_minimum_order_quantity: input.minimumOrderQuantity,
    p_lead_time_days: input.leadTimeDays,
    p_latitude: input.latitude,
    p_longitude: input.longitude,
    p_service_radius_km: input.serviceRadiusKm,
    p_quality_score: input.qualityScore,
    p_reliability_score: input.reliabilityScore,
  });
  if (error) throw error;
  return loadProductionPartners();
}

export async function deleteProductionPartner(
  partnerId: string,
  currentPartners: ProductionPartner[],
): Promise<ProductionPartner[]> {
  if (!supabase || !(await hasAuthenticatedSession())) {
    const next = currentPartners.filter((partner) => partner.id !== partnerId);
    saveLocalPartners(next);
    return next;
  }

  const { error } = await supabase
    .from("production_partners")
    .delete()
    .eq("organization_id", PRODUCTION_ORGANIZATION_ID)
    .eq("id", partnerId);
  if (error) throw error;
  return currentPartners.filter((partner) => partner.id !== partnerId);
}
