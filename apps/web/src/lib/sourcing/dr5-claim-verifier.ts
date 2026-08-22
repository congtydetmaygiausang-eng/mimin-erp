/** DR5 claim-verification audit. Shadow-only; it never changes selected values. */
export const DR5_SCHEMA_VERSION = "DR5-1" as const;

export type Dr5ClaimStatus = "VERIFIED" | "PARTIAL" | "UNVERIFIED" | "CONFLICT";

export interface Dr5FieldConfidenceLike {
  fieldName?: string | null;
  selectedValue?: string | null;
  score?: number | null;
  independentSources?: number | null;
  status?: Dr5ClaimStatus | null;
  alternatives?: readonly string[] | null;
}

export interface Dr5CandidateLike {
  legalName?: string | null;
  taxCode?: string | null;
  address?: string | null;
  registeredAddress?: string | null;
  phone?: string | null;
  capabilities?: readonly string[] | null;
  fieldConfidence?: readonly Dr5FieldConfidenceLike[] | null;
  entityResolution?: { conflicts?: readonly string[] | null } | null;
}

export interface Dr5ClaimVerifierAudit {
  schemaVersion: typeof DR5_SCHEMA_VERSION;
  kind: "SHADOW_CLAIM_VERIFIER";
  capturedAt: string;
  candidateCount: number;
  claimCount: number;
  verifiedClaims: number;
  partialClaims: number;
  unverifiedClaims: number;
  conflictClaims: number;
  missingCriticalEvidence: number;
  verificationCoveragePercent: number;
  criticalCoveragePercent: number;
  reviewRequiredCandidateCount: number;
  grade: "PASS" | "REVIEW" | "RISK";
  warnings: string[];
  note: "DR5 chỉ đối chiếu trạng thái claim; không sửa giá trị, loại hồ sơ hoặc đổi xếp hạng production.";
}

export interface Dr5ToolCall {
  type: "DR5_CLAIM_VERIFIER";
  audit: Dr5ClaimVerifierAudit;
}

const CRITICAL_FIELDS = ["LEGAL_NAME", "TAX_CODE", "REGISTERED_ADDRESS", "PHONE", "CAPABILITY"] as const;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function percent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function criticalFieldPresent(candidate: Dr5CandidateLike, field: typeof CRITICAL_FIELDS[number]): boolean {
  if (field === "LEGAL_NAME") return Boolean(text(candidate.legalName));
  if (field === "TAX_CODE") return Boolean(text(candidate.taxCode));
  if (field === "REGISTERED_ADDRESS") return Boolean(text(candidate.registeredAddress) || text(candidate.address));
  if (field === "PHONE") return Boolean(text(candidate.phone));
  return Boolean(candidate.capabilities?.some((capability) => text(capability)));
}

export function buildDr5ClaimVerifierAudit(candidates: readonly Dr5CandidateLike[]): Dr5ClaimVerifierAudit {
  const claims = candidates.flatMap((candidate) => [...(candidate.fieldConfidence ?? [])]).filter((claim) => text(claim.fieldName) && text(claim.selectedValue));
  const countStatus = (status: Dr5ClaimStatus) => claims.filter((claim) => claim.status === status).length;
  const verifiedClaims = countStatus("VERIFIED");
  const partialClaims = countStatus("PARTIAL");
  const unverifiedClaims = countStatus("UNVERIFIED");
  const conflictClaims = countStatus("CONFLICT");
  let missingCriticalEvidence = 0;
  let criticalPresentCount = 0;
  let criticalEvidencePoints = 0;
  let reviewRequiredCandidateCount = 0;

  for (const candidate of candidates) {
    const byField = new Map((candidate.fieldConfidence ?? []).map((claim) => [text(claim.fieldName).toUpperCase(), claim]));
    let requiresReview = Boolean(candidate.entityResolution?.conflicts?.length);
    for (const field of CRITICAL_FIELDS) {
      if (!criticalFieldPresent(candidate, field)) continue;
      criticalPresentCount += 1;
      const claim = byField.get(field);
      if (!claim) {
        missingCriticalEvidence += 1;
        requiresReview = true;
        continue;
      }
      if (claim.status === "VERIFIED") criticalEvidencePoints += 1;
      else if (claim.status === "PARTIAL") criticalEvidencePoints += 0.5;
      else requiresReview = true;
      if (claim.status === "CONFLICT") requiresReview = true;
    }
    if ((candidate.fieldConfidence ?? []).some((claim) => claim.status === "CONFLICT")) requiresReview = true;
    if (requiresReview) reviewRequiredCandidateCount += 1;
  }

  const verificationCoveragePercent = percent(verifiedClaims + partialClaims * 0.5, claims.length);
  const criticalCoveragePercent = percent(criticalEvidencePoints, criticalPresentCount);
  const warnings = [
    missingCriticalEvidence > 0 ? `${missingCriticalEvidence} trường trọng yếu có dữ liệu nhưng chưa có claim chứng cứ` : "",
    conflictClaims > 0 ? `${conflictClaims} claim đang mâu thuẫn` : "",
    verificationCoveragePercent < 70 ? `Độ phủ xác minh claim chỉ ${verificationCoveragePercent}%` : "",
    reviewRequiredCandidateCount > 0 ? `${reviewRequiredCandidateCount} hồ sơ cần người duyệt` : "",
  ].filter(Boolean);
  const grade: Dr5ClaimVerifierAudit["grade"] = conflictClaims > 0 || criticalCoveragePercent < 50
    ? "RISK"
    : verificationCoveragePercent >= 80 && criticalCoveragePercent >= 80 && reviewRequiredCandidateCount === 0
      ? "PASS"
      : "REVIEW";

  return {
    schemaVersion: DR5_SCHEMA_VERSION,
    kind: "SHADOW_CLAIM_VERIFIER",
    capturedAt: new Date().toISOString(),
    candidateCount: candidates.length,
    claimCount: claims.length,
    verifiedClaims,
    partialClaims,
    unverifiedClaims,
    conflictClaims,
    missingCriticalEvidence,
    verificationCoveragePercent,
    criticalCoveragePercent,
    reviewRequiredCandidateCount,
    grade,
    warnings,
    note: "DR5 chỉ đối chiếu trạng thái claim; không sửa giá trị, loại hồ sơ hoặc đổi xếp hạng production.",
  };
}

export function dr5ToolCall(audit: Dr5ClaimVerifierAudit): Dr5ToolCall {
  return { type: "DR5_CLAIM_VERIFIER", audit };
}

export function readDr5Audit(toolCalls: unknown): Dr5ClaimVerifierAudit | null {
  if (!Array.isArray(toolCalls)) return null;
  const item = toolCalls.find((call) => typeof call === "object" && call !== null && (call as { type?: unknown }).type === "DR5_CLAIM_VERIFIER") as Partial<Dr5ToolCall> | undefined;
  const audit = item?.audit;
  return audit?.schemaVersion === DR5_SCHEMA_VERSION && audit.kind === "SHADOW_CLAIM_VERIFIER" ? audit : null;
}
