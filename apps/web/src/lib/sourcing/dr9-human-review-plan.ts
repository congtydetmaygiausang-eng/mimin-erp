/** DR9 human-review sampling plan. Shadow-only; it never labels or promotes data automatically. */
export const DR9_SCHEMA_VERSION = "DR9-1" as const;

export type Dr9ReviewBucket = "READY" | "REVIEW" | "ABSTAIN";

export interface Dr9DecisionLike {
  candidateIndex: number;
  decision: Dr9ReviewBucket;
  reasons?: readonly string[] | null;
}

export interface Dr9ReviewQuota {
  bucket: Dr9ReviewBucket;
  available: number;
  sampleCount: number;
  candidateIndexes: number[];
}

export interface Dr9HumanReviewPlanAudit {
  schemaVersion: typeof DR9_SCHEMA_VERSION;
  kind: "SHADOW_HUMAN_REVIEW_PLAN";
  capturedAt: string;
  candidateCount: number;
  targetSampleSize: number;
  plannedSampleSize: number;
  coveragePercent: number;
  quotas: Dr9ReviewQuota[];
  priorityFields: string[];
  dualReviewRequiredCount: number;
  goldenSetEligible: boolean;
  blockers: string[];
  reviewerInstructions: string[];
  note: "DR9 chỉ lập kế hoạch lấy mẫu; không tự ghi nhãn, học, duyệt hồ sơ hoặc thay đổi production.";
}

export interface Dr9ToolCall {
  type: "DR9_HUMAN_REVIEW_PLAN";
  audit: Dr9HumanReviewPlanAudit;
}

export interface Dr9Input {
  decisions: readonly Dr9DecisionLike[];
  conflictClaimCount: number;
  missingCriticalEvidence: number;
  goldenDatasetValidated: boolean;
  maxSampleSize?: number;
}

const BUCKET_ORDER: readonly Dr9ReviewBucket[] = ["ABSTAIN", "REVIEW", "READY"];

function percent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function inferPriorityFields(decisions: readonly Dr9DecisionLike[]): string[] {
  const reasons = decisions.flatMap((decision) => [...(decision.reasons ?? [])]).join(" ").toLocaleLowerCase("vi");
  const fields = [
    reasons.includes("mâu thuẫn") ? "Dữ liệu mâu thuẫn" : "",
    reasons.includes("nhận dạng") ? "Tên pháp lý / mã số thuế" : "",
    reasons.includes("claim") ? "Claim trọng yếu" : "",
    reasons.includes("nguồn") || reasons.includes("chứng cứ") ? "Nguồn chứng cứ" : "",
  ].filter(Boolean);
  return fields.length > 0 ? fields : ["Tên pháp lý", "Mã số thuế", "Địa chỉ", "Điện thoại", "Năng lực"];
}

function allocateQuotas(decisions: readonly Dr9DecisionLike[], targetSampleSize: number): Dr9ReviewQuota[] {
  const grouped = new Map<Dr9ReviewBucket, Dr9DecisionLike[]>(BUCKET_ORDER.map((bucket) => [bucket, []]));
  for (const decision of decisions) grouped.get(decision.decision)?.push(decision);
  const desiredShare: Record<Dr9ReviewBucket, number> = { ABSTAIN: 0.4, REVIEW: 0.4, READY: 0.2 };
  const allocation = new Map<Dr9ReviewBucket, number>();
  let allocated = 0;
  for (const bucket of BUCKET_ORDER) {
    const available = grouped.get(bucket)?.length ?? 0;
    const desired = Math.ceil(targetSampleSize * desiredShare[bucket]);
    const count = Math.min(available, desired, targetSampleSize - allocated);
    allocation.set(bucket, count);
    allocated += count;
  }
  while (allocated < targetSampleSize) {
    const bucket = BUCKET_ORDER.find((item) => (allocation.get(item) ?? 0) < (grouped.get(item)?.length ?? 0));
    if (!bucket) break;
    allocation.set(bucket, (allocation.get(bucket) ?? 0) + 1);
    allocated += 1;
  }
  return BUCKET_ORDER.map((bucket) => {
    const candidates = grouped.get(bucket) ?? [];
    const sampleCount = allocation.get(bucket) ?? 0;
    return {
      bucket,
      available: candidates.length,
      sampleCount,
      candidateIndexes: candidates.slice(0, sampleCount).map((candidate) => candidate.candidateIndex),
    };
  });
}

export function buildDr9HumanReviewPlanAudit(input: Dr9Input): Dr9HumanReviewPlanAudit {
  const candidateCount = input.decisions.length;
  const maxSampleSize = Math.max(1, Math.min(100, Math.round(input.maxSampleSize ?? 20)));
  const targetSampleSize = Math.min(candidateCount, maxSampleSize);
  const quotas = allocateQuotas(input.decisions, targetSampleSize);
  const plannedSampleSize = quotas.reduce((sum, quota) => sum + quota.sampleCount, 0);
  const riskyAvailable = input.decisions.filter((decision) => decision.decision === "ABSTAIN" || decision.reasons?.some((reason) => reason.toLocaleLowerCase("vi").includes("mâu thuẫn"))).length;
  const dualReviewRequiredCount = Math.min(plannedSampleSize, riskyAvailable);
  const blockers = [
    candidateCount === 0 ? "Không có hồ sơ để lấy mẫu" : "",
    input.conflictClaimCount > 0 ? `${input.conflictClaimCount} claim mâu thuẫn cần hai người duyệt` : "",
    input.missingCriticalEvidence > 0 ? `${input.missingCriticalEvidence} trường trọng yếu thiếu chứng cứ` : "",
    !input.goldenDatasetValidated ? "Bộ dữ liệu vàng chưa được phê duyệt" : "",
  ].filter(Boolean);
  const goldenSetEligible = candidateCount > 0
    && plannedSampleSize === targetSampleSize
    && input.conflictClaimCount === 0
    && input.missingCriticalEvidence === 0
    && input.goldenDatasetValidated;

  return {
    schemaVersion: DR9_SCHEMA_VERSION,
    kind: "SHADOW_HUMAN_REVIEW_PLAN",
    capturedAt: new Date().toISOString(),
    candidateCount,
    targetSampleSize,
    plannedSampleSize,
    coveragePercent: percent(plannedSampleSize, candidateCount),
    quotas,
    priorityFields: inferPriorityFields(input.decisions),
    dualReviewRequiredCount,
    goldenSetEligible,
    blockers,
    reviewerInstructions: [
      "Đối chiếu từng giá trị với URL và đoạn trích nguồn, không chỉ xem điểm tổng.",
      "Hồ sơ mâu thuẫn hoặc ABSTAIN phải có hai người duyệt độc lập.",
      "Chỉ đưa vào bộ dữ liệu vàng khi đã chốt nhãn và lưu lý do quyết định.",
    ],
    note: "DR9 chỉ lập kế hoạch lấy mẫu; không tự ghi nhãn, học, duyệt hồ sơ hoặc thay đổi production.",
  };
}

export function dr9ToolCall(audit: Dr9HumanReviewPlanAudit): Dr9ToolCall {
  return { type: "DR9_HUMAN_REVIEW_PLAN", audit };
}

export function readDr9Audit(toolCalls: unknown): Dr9HumanReviewPlanAudit | null {
  if (!Array.isArray(toolCalls)) return null;
  const item = toolCalls.find((call) => typeof call === "object" && call !== null && (call as { type?: unknown }).type === "DR9_HUMAN_REVIEW_PLAN") as Partial<Dr9ToolCall> | undefined;
  const audit = item?.audit;
  return audit?.schemaVersion === DR9_SCHEMA_VERSION && audit.kind === "SHADOW_HUMAN_REVIEW_PLAN" ? audit : null;
}
