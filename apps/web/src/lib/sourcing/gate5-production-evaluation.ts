export const GATE5_SCHEMA_VERSION = "GATE5-1" as const;

export type Gate5LocationStatus = "IN_RADIUS" | "OUT_OF_RADIUS" | "UNVERIFIED";
export type Gate5RejectionReason =
  | "NOT_B2B"
  | "INVALID_IDENTITY"
  | "OUT_OF_RADIUS"
  | "INSUFFICIENT_EVIDENCE"
  | "DUPLICATE"
  | "OTHER";

export interface Gate5ProductionScenario {
  id: "COTTON_HOC_MON_10" | "GARMENT_TAN_PHU_20" | "TEXTILE_BINH_THANH_30";
  capability: string;
  center: string;
  radiusKm: number;
}

export interface Gate5ObservedCandidate {
  legalName: string;
  isB2B: boolean;
  identityValid: boolean;
  locationStatus: Gate5LocationStatus;
  phoneEvidence: boolean;
  addressEvidence: boolean;
  emailEvidence: boolean;
  taxCodeEvidence: boolean;
  websiteEvidence: boolean;
  duplicateGroupKey: string;
  rejectionReason: Gate5RejectionReason | null;
}

export type Gate5Failure =
  | "ACCEPTED_CANDIDATES_BELOW_5"
  | "B2B_PRECISION_BELOW_90"
  | "IN_RADIUS_VERIFICATION_BELOW_80"
  | "INVALID_IDENTITY_PRESENT"
  | "DUPLICATE_RATE_ABOVE_5"
  | "CORE_CONTACT_COVERAGE_BELOW_70";

export interface Gate5ScenarioMetrics {
  observedCandidates: number;
  acceptedCandidates: number;
  b2bPrecisionPercent: number;
  inRadiusVerifiedPercent: number;
  identityValidityPercent: number;
  duplicateRatePercent: number;
  coreContactCoveragePercent: number;
  optionalEvidenceCoveragePercent: {
    email: number;
    taxCode: number;
    website: number;
  };
}

export interface Gate5ScenarioReport {
  schemaVersion: typeof GATE5_SCHEMA_VERSION;
  scenario: Gate5ProductionScenario;
  status: "PASS" | "FAIL" | "INSUFFICIENT_SAMPLE";
  metrics: Gate5ScenarioMetrics;
  failures: Gate5Failure[];
  rejectionReasons: Record<Gate5RejectionReason, number>;
}

export const GATE5_PRODUCTION_SCENARIOS: readonly Gate5ProductionScenario[] = [
  { id: "COTTON_HOC_MON_10", capability: "Nhà cung cấp vải cotton", center: "Hóc Môn", radiusKm: 10 },
  { id: "GARMENT_TAN_PHU_20", capability: "Xưởng may gia công", center: "Tân Phú", radiusKm: 20 },
  { id: "TEXTILE_BINH_THANH_30", capability: "Công ty dệt may", center: "Bình Thạnh", radiusKm: 30 },
] as const;

const EMPTY_REJECTION_COUNTS: Record<Gate5RejectionReason, number> = {
  NOT_B2B: 0,
  INVALID_IDENTITY: 0,
  OUT_OF_RADIUS: 0,
  INSUFFICIENT_EVIDENCE: 0,
  DUPLICATE: 0,
  OTHER: 0,
};

function percent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

/**
 * Gate 5 chỉ đo chất lượng đầu ra đã quan sát. Hàm không lọc, xếp hạng, làm
 * giàu hoặc thay đổi ứng viên, nên không tác động đến luồng tìm kiếm production.
 */
export function evaluateGate5Scenario(
  scenario: Gate5ProductionScenario,
  candidates: readonly Gate5ObservedCandidate[],
): Gate5ScenarioReport {
  const total = candidates.length;
  const accepted = candidates.filter((candidate) => candidate.rejectionReason === null);
  const duplicateKeys = candidates
    .map((candidate) => candidate.duplicateGroupKey.trim().toLocaleLowerCase("vi"))
    .filter(Boolean);
  const duplicateCount = Math.max(0, duplicateKeys.length - new Set(duplicateKeys).size);
  const rejectionReasons = { ...EMPTY_REJECTION_COUNTS };

  for (const candidate of candidates) {
    if (candidate.rejectionReason) rejectionReasons[candidate.rejectionReason] += 1;
  }

  const metrics: Gate5ScenarioMetrics = {
    observedCandidates: total,
    acceptedCandidates: accepted.length,
    b2bPrecisionPercent: percent(candidates.filter((candidate) => candidate.isB2B).length, total),
    inRadiusVerifiedPercent: percent(candidates.filter((candidate) => candidate.locationStatus === "IN_RADIUS").length, total),
    identityValidityPercent: percent(candidates.filter((candidate) => candidate.identityValid).length, total),
    duplicateRatePercent: percent(duplicateCount, total),
    coreContactCoveragePercent: percent(
      candidates.filter((candidate) => candidate.phoneEvidence && candidate.addressEvidence).length,
      total,
    ),
    optionalEvidenceCoveragePercent: {
      email: percent(candidates.filter((candidate) => candidate.emailEvidence).length, total),
      taxCode: percent(candidates.filter((candidate) => candidate.taxCodeEvidence).length, total),
      website: percent(candidates.filter((candidate) => candidate.websiteEvidence).length, total),
    },
  };

  const failures: Gate5Failure[] = [];
  if (accepted.length < 5) failures.push("ACCEPTED_CANDIDATES_BELOW_5");
  if (metrics.b2bPrecisionPercent < 90) failures.push("B2B_PRECISION_BELOW_90");
  if (metrics.inRadiusVerifiedPercent < 80) failures.push("IN_RADIUS_VERIFICATION_BELOW_80");
  if (metrics.identityValidityPercent < 100) failures.push("INVALID_IDENTITY_PRESENT");
  if (metrics.duplicateRatePercent > 5) failures.push("DUPLICATE_RATE_ABOVE_5");
  if (metrics.coreContactCoveragePercent < 70) failures.push("CORE_CONTACT_COVERAGE_BELOW_70");

  return {
    schemaVersion: GATE5_SCHEMA_VERSION,
    scenario,
    status: accepted.length < 5 ? "INSUFFICIENT_SAMPLE" : failures.length > 0 ? "FAIL" : "PASS",
    metrics,
    failures,
    rejectionReasons,
  };
}

