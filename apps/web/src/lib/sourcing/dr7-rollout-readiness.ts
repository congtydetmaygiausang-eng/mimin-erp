/** DR7 rollout-readiness audit. Observation-only; it never enables rollout or changes search behavior. */
export const DR7_SCHEMA_VERSION = "DR7-1" as const;

export type Dr7Readiness = "BLOCKED" | "SHADOW_READY" | "CANARY_READY";

export interface Dr7Signal {
  key: "RESULTS" | "INTENT" | "RESEARCH" | "SOURCES" | "EVIDENCE" | "CLAIMS" | "DECISIONS" | "GOLDEN_SET";
  passed: boolean;
  score: number;
  detail: string;
}

export interface Dr7RolloutReadinessAudit {
  schemaVersion: typeof DR7_SCHEMA_VERSION;
  kind: "SHADOW_ROLLOUT_READINESS";
  capturedAt: string;
  readiness: Dr7Readiness;
  readinessScore: number;
  passedSignals: number;
  totalSignals: number;
  criticalBlockers: string[];
  signals: Dr7Signal[];
  nextActions: string[];
  goldenDatasetValidated: boolean;
  note: "DR7 chỉ đánh giá readiness; không tự bật shadow/canary, không đổi thuật toán và không tác động kết quả production.";
}

export interface Dr7ToolCall {
  type: "DR7_ROLLOUT_READINESS";
  audit: Dr7RolloutReadinessAudit;
}

export interface Dr7Input {
  dr0: {
    candidateCount: number;
    duplicateRatePercent: number;
    completenessPercent: { legalName: number; address: number; phone: number };
  };
  dr1: { contractAligned: boolean };
  dr2: { coveragePercent: number };
  dr3: { providerSuccessPercent: number; fallbackReadinessPercent: number; unavailableRoutes: number };
  dr4: { citedCandidatePercent: number; primaryFieldCitationPercent: number; grade: "STRONG" | "REVIEW" | "WEAK" };
  dr5: { verificationCoveragePercent: number; criticalCoveragePercent: number; conflictClaims: number };
  dr6: { candidateCount: number; readyPercent: number; abstainCount: number };
  goldenDatasetValidated?: boolean;
}

function boundedScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

function average(values: readonly number[]): number {
  return values.length > 0 ? boundedScore(values.reduce((sum, value) => sum + boundedScore(value), 0) / values.length) : 0;
}

export function buildDr7RolloutReadinessAudit(input: Dr7Input): Dr7RolloutReadinessAudit {
  const goldenDatasetValidated = input.goldenDatasetValidated === true;
  const abstainPercent = input.dr6.candidateCount > 0 ? Math.round((input.dr6.abstainCount / input.dr6.candidateCount) * 100) : 100;
  const resultScore = input.dr0.candidateCount > 0
    ? average([100 - input.dr0.duplicateRatePercent, input.dr0.completenessPercent.legalName, input.dr0.completenessPercent.address, input.dr0.completenessPercent.phone])
    : 0;
  const sourceScore = average([input.dr3.providerSuccessPercent, input.dr3.fallbackReadinessPercent, input.dr3.unavailableRoutes === 0 ? 100 : 0]);
  const evidenceScore = average([input.dr4.citedCandidatePercent, input.dr4.primaryFieldCitationPercent]);
  const claimScore = average([input.dr5.verificationCoveragePercent, input.dr5.criticalCoveragePercent, input.dr5.conflictClaims === 0 ? 100 : 0]);
  const decisionScore = average([input.dr6.readyPercent, 100 - abstainPercent]);
  const signals: Dr7Signal[] = [
    { key: "RESULTS", passed: input.dr0.candidateCount > 0 && resultScore >= 60, score: resultScore, detail: `${input.dr0.candidateCount} hồ sơ · trùng ${input.dr0.duplicateRatePercent}%` },
    { key: "INTENT", passed: input.dr1.contractAligned, score: input.dr1.contractAligned ? 100 : 0, detail: input.dr1.contractAligned ? "Hợp đồng tìm kiếm đầy đủ" : "Hợp đồng tìm kiếm còn thiếu" },
    { key: "RESEARCH", passed: input.dr2.coveragePercent >= 60, score: boundedScore(input.dr2.coveragePercent), detail: `Độ phủ nhánh ${input.dr2.coveragePercent}%` },
    { key: "SOURCES", passed: sourceScore >= 60 && input.dr3.unavailableRoutes === 0, score: sourceScore, detail: `${input.dr3.unavailableRoutes} nhánh nguồn chưa sẵn sàng` },
    { key: "EVIDENCE", passed: evidenceScore >= 70 && input.dr4.grade !== "WEAK", score: evidenceScore, detail: `Sổ chứng cứ ${input.dr4.grade}` },
    { key: "CLAIMS", passed: claimScore >= 70 && input.dr5.conflictClaims === 0, score: claimScore, detail: `${input.dr5.conflictClaims} claim mâu thuẫn` },
    { key: "DECISIONS", passed: decisionScore >= 60 && abstainPercent <= 20, score: decisionScore, detail: `READY ${input.dr6.readyPercent}% · ABSTAIN ${abstainPercent}%` },
    { key: "GOLDEN_SET", passed: goldenDatasetValidated, score: goldenDatasetValidated ? 100 : 0, detail: goldenDatasetValidated ? "Bộ dữ liệu vàng đã được duyệt" : "Chưa có bộ dữ liệu vàng được duyệt" },
  ];
  const readinessScore = average(signals.map((signal) => signal.score));
  const criticalBlockers = [
    input.dr0.candidateCount === 0 ? "Không có hồ sơ đầu ra" : "",
    !input.dr1.contractAligned ? "Ý định tìm kiếm chưa đủ điều kiện" : "",
    input.dr5.conflictClaims > 0 ? "Còn claim mâu thuẫn" : "",
    abstainPercent > 50 ? `Tỷ lệ ABSTAIN quá cao (${abstainPercent}%)` : "",
  ].filter(Boolean);
  const allOperationalSignalsPassed = signals.filter((signal) => signal.key !== "GOLDEN_SET").every((signal) => signal.passed);
  const readiness: Dr7Readiness = criticalBlockers.length > 0 || readinessScore < 50
    ? "BLOCKED"
    : allOperationalSignalsPassed && goldenDatasetValidated && readinessScore >= 80
      ? "CANARY_READY"
      : "SHADOW_READY";
  const nextActions = [
    ...signals.filter((signal) => !signal.passed && signal.key !== "GOLDEN_SET").map((signal) => `Cải thiện ${signal.key}: ${signal.detail}`),
    !goldenDatasetValidated ? "Duyệt bộ dữ liệu vàng trước khi cho phép canary" : "",
  ].filter(Boolean);

  return {
    schemaVersion: DR7_SCHEMA_VERSION,
    kind: "SHADOW_ROLLOUT_READINESS",
    capturedAt: new Date().toISOString(),
    readiness,
    readinessScore,
    passedSignals: signals.filter((signal) => signal.passed).length,
    totalSignals: signals.length,
    criticalBlockers,
    signals,
    nextActions,
    goldenDatasetValidated,
    note: "DR7 chỉ đánh giá readiness; không tự bật shadow/canary, không đổi thuật toán và không tác động kết quả production.",
  };
}

export function dr7ToolCall(audit: Dr7RolloutReadinessAudit): Dr7ToolCall {
  return { type: "DR7_ROLLOUT_READINESS", audit };
}

export function readDr7Audit(toolCalls: unknown): Dr7RolloutReadinessAudit | null {
  if (!Array.isArray(toolCalls)) return null;
  const item = toolCalls.find((call) => typeof call === "object" && call !== null && (call as { type?: unknown }).type === "DR7_ROLLOUT_READINESS") as Partial<Dr7ToolCall> | undefined;
  const audit = item?.audit;
  return audit?.schemaVersion === DR7_SCHEMA_VERSION && audit.kind === "SHADOW_ROLLOUT_READINESS" ? audit : null;
}
