import { calculateDistanceKm, normalizeSearchValue, type ProductionPartner, type ProductionPartnerRole } from "@/lib/production-network";

export interface SourcingCriteria {
  role: ProductionPartnerRole; capability: string; requiredCapacity: number | null;
  maximumMoq: number | null; maximumLeadDays: number | null; minimumQuality: number | null;
  minimumReliability: number | null; latitude: number | null; longitude: number | null;
  maximumDistanceKm: number | null;
}

export interface PartnerMatch { partner: ProductionPartner; score: number; distanceKm: number | null; reasons: string[]; gaps: string[] }

export function scorePartner(partner: ProductionPartner, criteria: SourcingCriteria): PartnerMatch {
  let earned = 0; let possible = 0;
  const reasons: string[] = []; const gaps: string[] = [];
  const check = (weight: number, passed: boolean, success: string, failure: string) => {
    possible += weight; if (passed) { earned += weight; reasons.push(success); } else gaps.push(failure);
  };
  if (criteria.capability.trim()) {
    const needle = normalizeSearchValue(criteria.capability);
    check(30, partner.capabilities.some((item) => normalizeSearchValue(item).includes(needle)), "Đúng năng lực cần tìm", "Chưa xác nhận năng lực");
  }
  if (criteria.requiredCapacity !== null) check(15, (partner.capacityPerMonth ?? 0) >= criteria.requiredCapacity, "Đủ công suất", "Công suất thiếu/chưa có");
  if (criteria.maximumMoq !== null) check(10, partner.minimumOrderQuantity !== null && partner.minimumOrderQuantity <= criteria.maximumMoq, "MOQ phù hợp", "MOQ cao/chưa có");
  if (criteria.maximumLeadDays !== null) check(15, partner.leadTimeDays !== null && partner.leadTimeDays <= criteria.maximumLeadDays, "Đáp ứng đúng hạn", "Thời gian đáp ứng dài/chưa có");
  if (criteria.minimumQuality !== null) check(10, (partner.qualityScore ?? 0) >= criteria.minimumQuality, "Chất lượng đạt", "Chất lượng chưa đạt/chưa chấm");
  if (criteria.minimumReliability !== null) check(10, (partner.reliabilityScore ?? 0) >= criteria.minimumReliability, "Uy tín đạt", "Uy tín chưa đạt/chưa chấm");
  let distanceKm: number | null = null;
  if (criteria.maximumDistanceKm !== null && criteria.latitude !== null && criteria.longitude !== null) {
    distanceKm = partner.latitude !== null && partner.longitude !== null ? calculateDistanceKm(criteria.latitude, criteria.longitude, partner.latitude, partner.longitude) : null;
    check(10, distanceKm !== null && distanceKm <= criteria.maximumDistanceKm, "Trong bán kính", "Ngoài bán kính/chưa có tọa độ");
  }
  return { partner, score: possible === 0 ? 0 : Math.round((earned / possible) * 100), distanceKm, reasons, gaps };
}

export function rankPartners(partners: ProductionPartner[], criteria: SourcingCriteria): PartnerMatch[] {
  return partners.filter((item) => item.status === "ACTIVE" && item.roles.includes(criteria.role))
    .map((item) => scorePartner(item, criteria)).sort((a, b) => b.score - a.score || a.partner.legalName.localeCompare(b.partner.legalName, "vi"));
}
