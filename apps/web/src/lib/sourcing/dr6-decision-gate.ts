/** DR6 decision-gate audit. Shadow-only; it never filters, ranks or mutates candidates. */
export const DR6_SCHEMA_VERSION = "DR6-1" as const;

export type Dr6Decision = "READY" | "REVIEW" | "ABSTAIN";

export interface Dr6FieldConfidenceLike {
  fieldName?: string | null;
  status?: "VERIFIED" | "PARTIAL" | "UNVERIFIED" | "CONFLICT" | null;
}

export interface Dr6EvidenceLike {
  fieldName?: string | null;
  sourceUrl?: string | null;
  sourceExcerpt?: string | null;
}

export interface Dr6CandidateLike {
  legalName?: string | null;
  taxCode?: string | null;
  address?: string | null;
  registeredAddress?: string | null;
  phone?: string | null;
  capabilities?: readonly string[] | null;
  fieldConfidence?: readonly Dr6FieldConfidenceLike[] | null;
  fieldEvidence?: readonly Dr6EvidenceLike[] | null;
  entityResolution?: { conflicts?: readonly string[] | null } | null;
}

export interface Dr6DecisionSummary {
  candidateIndex: number;
  decision: Dr6Decision;
  supportedCriticalClaims: number;
  independentSourceCount: number;
  reasons: string[];
}

export interface Dr6DecisionGateAudit {
  schemaVersion: typeof DR6_SCHEMA_VERSION;
  kind: "SHADOW_DECISION_GATE";
  capturedAt: string;
  candidateCount: number;
  readyCount: number;
  reviewCount: number;
  abstainCount: number;
  readyPercent: number;
  safeHandlingPercent: number;
  decisions: Dr6DecisionSummary[];
  warnings: string[];
  note: "DR6 chỉ đề xuất READY/REVIEW/ABSTAIN; không lọc, xếp hạng, sửa dữ liệu hoặc tự duyệt hồ sơ production.";
}

export interface Dr6ToolCall {
  type: "DR6_DECISION_GATE";
  audit: Dr6DecisionGateAudit;
}

const CRITICAL_FIELDS = new Set(["LEGAL_NAME", "TAX_CODE", "REGISTERED_ADDRESS", "FACTORY_ADDRESS", "OFFICE_ADDRESS", "PHONE", "CAPABILITY"]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function percent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function sourceDomain(value: unknown): string {
  try {
    return new URL(text(value)).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function hasMinimumIdentity(candidate: Dr6CandidateLike): boolean {
  const hasName = Boolean(text(candidate.legalName));
  const hasLocator = Boolean(text(candidate.taxCode) || text(candidate.registeredAddress) || text(candidate.address) || text(candidate.phone));
  const hasCapability = Boolean(candidate.capabilities?.some((value) => text(value)));
  return hasName && hasLocator && hasCapability;
}

function evaluateCandidate(candidate: Dr6CandidateLike, candidateIndex: number): Dr6DecisionSummary {
  const claims = candidate.fieldConfidence ?? [];
  const criticalClaims = claims.filter((claim) => CRITICAL_FIELDS.has(text(claim.fieldName).toUpperCase()));
  const supportedCriticalClaims = criticalClaims.filter((claim) => claim.status === "VERIFIED" || claim.status === "PARTIAL").length;
  const claimConflict = claims.some((claim) => claim.status === "CONFLICT");
  const entityConflict = Boolean(candidate.entityResolution?.conflicts?.length);
  const domains = new Set(
    (candidate.fieldEvidence ?? [])
      .filter((evidence) => text(evidence.fieldName) && text(evidence.sourceExcerpt))
      .map((evidence) => sourceDomain(evidence.sourceUrl))
      .filter(Boolean),
  );
  const independentSourceCount = domains.size;
  const minimumIdentity = hasMinimumIdentity(candidate);
  const reasons: string[] = [];

  if (!minimumIdentity) reasons.push("Thiếu bộ nhận dạng tối thiểu: tên, điểm định danh hoặc năng lực");
  if (claimConflict || entityConflict) reasons.push("Có claim hoặc thực thể mâu thuẫn");
  if (supportedCriticalClaims < 3) reasons.push(`Chỉ ${supportedCriticalClaims} claim trọng yếu có hỗ trợ`);
  if (independentSourceCount < 2) reasons.push(`Chỉ ${independentSourceCount} nguồn chứng cứ độc lập`);

  const decision: Dr6Decision = claimConflict || entityConflict || !minimumIdentity
    ? "ABSTAIN"
    : supportedCriticalClaims >= 3 && independentSourceCount >= 2
      ? "READY"
      : "REVIEW";

  return { candidateIndex, decision, supportedCriticalClaims, independentSourceCount, reasons };
}

export function buildDr6DecisionGateAudit(candidates: readonly Dr6CandidateLike[]): Dr6DecisionGateAudit {
  const decisions = candidates.map(evaluateCandidate);
  const readyCount = decisions.filter((item) => item.decision === "READY").length;
  const reviewCount = decisions.filter((item) => item.decision === "REVIEW").length;
  const abstainCount = decisions.filter((item) => item.decision === "ABSTAIN").length;
  const warnings = [
    abstainCount > 0 ? `${abstainCount} hồ sơ nên tạm không kết luận` : "",
    reviewCount > 0 ? `${reviewCount} hồ sơ cần người duyệt` : "",
    readyCount === 0 && candidates.length > 0 ? "Chưa có hồ sơ đạt cổng sẵn sàng" : "",
  ].filter(Boolean);

  return {
    schemaVersion: DR6_SCHEMA_VERSION,
    kind: "SHADOW_DECISION_GATE",
    capturedAt: new Date().toISOString(),
    candidateCount: candidates.length,
    readyCount,
    reviewCount,
    abstainCount,
    readyPercent: percent(readyCount, candidates.length),
    safeHandlingPercent: percent(readyCount + reviewCount + abstainCount, candidates.length),
    decisions,
    warnings,
    note: "DR6 chỉ đề xuất READY/REVIEW/ABSTAIN; không lọc, xếp hạng, sửa dữ liệu hoặc tự duyệt hồ sơ production.",
  };
}

export function dr6ToolCall(audit: Dr6DecisionGateAudit): Dr6ToolCall {
  return { type: "DR6_DECISION_GATE", audit };
}

export function readDr6Audit(toolCalls: unknown): Dr6DecisionGateAudit | null {
  if (!Array.isArray(toolCalls)) return null;
  const item = toolCalls.find((call) => typeof call === "object" && call !== null && (call as { type?: unknown }).type === "DR6_DECISION_GATE") as Partial<Dr6ToolCall> | undefined;
  const audit = item?.audit;
  return audit?.schemaVersion === DR6_SCHEMA_VERSION && audit.kind === "SHADOW_DECISION_GATE" ? audit : null;
}
