/** DR8 quality-drift sentinel. Shadow-only; it never changes runtime behavior. */
export const DR8_SCHEMA_VERSION = "DR8-1" as const;

export type Dr8DriftStatus = "BASELINE_REQUIRED" | "STABLE" | "WATCH" | "DRIFT";

export interface Dr8QualityFingerprint {
  sourceCount: number;
  candidateCount: number;
  coordinateCoveragePercent: number;
  profileCompletenessPercent: number;
  researchCoveragePercent: number;
  providerSuccessPercent: number;
  evidenceCoveragePercent: number;
  claimVerificationPercent: number;
  readyPercent: number;
  rolloutReadinessScore: number;
}

export interface Dr8MetricDelta {
  metric: keyof Dr8QualityFingerprint;
  current: number;
  baseline: number;
  degradationPercent: number;
}

export interface Dr8QualityDriftAudit {
  schemaVersion: typeof DR8_SCHEMA_VERSION;
  kind: "SHADOW_QUALITY_DRIFT";
  capturedAt: string;
  status: Dr8DriftStatus;
  current: Dr8QualityFingerprint;
  baseline: Dr8QualityFingerprint | null;
  averageDegradationPercent: number;
  degradedMetricCount: number;
  deltas: Dr8MetricDelta[];
  warnings: string[];
  note: "DR8 chỉ giám sát drift; không tự đổi provider, threshold, xếp hạng hoặc hành vi production.";
}

export interface Dr8ToolCall {
  type: "DR8_QUALITY_DRIFT";
  audit: Dr8QualityDriftAudit;
}

export interface Dr8Input {
  dr0: {
    sourceCount: number;
    candidateCount: number;
    coordinateCoveragePercent: number;
    completenessPercent: { legalName: number; address: number; phone: number; email: number; website: number; taxCode: number };
  };
  dr2: { coveragePercent: number };
  dr3: { providerSuccessPercent: number };
  dr4: { primaryFieldCitationPercent: number };
  dr5: { verificationCoveragePercent: number };
  dr6: { readyPercent: number };
  dr7: { readinessScore: number };
  baseline?: Dr8QualityFingerprint | null;
}

function bounded(value: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

function nonNegative(value: number): number {
  return Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
}

function average(values: readonly number[]): number {
  return values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

export function buildDr8QualityFingerprint(input: Omit<Dr8Input, "baseline">): Dr8QualityFingerprint {
  return {
    sourceCount: nonNegative(input.dr0.sourceCount),
    candidateCount: nonNegative(input.dr0.candidateCount),
    coordinateCoveragePercent: bounded(input.dr0.coordinateCoveragePercent),
    profileCompletenessPercent: bounded(average(Object.values(input.dr0.completenessPercent).map(bounded))),
    researchCoveragePercent: bounded(input.dr2.coveragePercent),
    providerSuccessPercent: bounded(input.dr3.providerSuccessPercent),
    evidenceCoveragePercent: bounded(input.dr4.primaryFieldCitationPercent),
    claimVerificationPercent: bounded(input.dr5.verificationCoveragePercent),
    readyPercent: bounded(input.dr6.readyPercent),
    rolloutReadinessScore: bounded(input.dr7.readinessScore),
  };
}

function degradation(current: number, baseline: number, countMetric: boolean): number {
  if (baseline <= 0) return 0;
  const drop = Math.max(0, baseline - current);
  return bounded(countMetric ? (drop / baseline) * 100 : drop);
}

export function buildDr8QualityDriftAudit(input: Dr8Input): Dr8QualityDriftAudit {
  const current = buildDr8QualityFingerprint(input);
  const baseline = input.baseline ?? null;
  if (!baseline) {
    return {
      schemaVersion: DR8_SCHEMA_VERSION,
      kind: "SHADOW_QUALITY_DRIFT",
      capturedAt: new Date().toISOString(),
      status: "BASELINE_REQUIRED",
      current,
      baseline: null,
      averageDegradationPercent: 0,
      degradedMetricCount: 0,
      deltas: [],
      warnings: ["Chưa có baseline đã duyệt; DR8 chỉ lưu quality fingerprint và không kết luận drift"],
      note: "DR8 chỉ giám sát drift; không tự đổi provider, threshold, xếp hạng hoặc hành vi production.",
    };
  }

  const metrics = Object.keys(current) as Array<keyof Dr8QualityFingerprint>;
  const deltas = metrics.map<Dr8MetricDelta>((metric) => ({
    metric,
    current: current[metric],
    baseline: baseline[metric],
    degradationPercent: degradation(current[metric], baseline[metric], metric === "sourceCount" || metric === "candidateCount"),
  }));
  const degraded = deltas.filter((item) => item.degradationPercent >= 10);
  const severe = deltas.filter((item) => item.degradationPercent >= 20);
  const averageDegradationPercent = average(deltas.map((item) => item.degradationPercent));
  const status: Dr8DriftStatus = severe.length >= 2 || averageDegradationPercent >= 20
    ? "DRIFT"
    : degraded.length > 0 || averageDegradationPercent >= 10
      ? "WATCH"
      : "STABLE";
  const warnings = [
    ...severe.map((item) => `${item.metric} giảm ${item.degradationPercent}%`),
    status === "WATCH" && severe.length === 0 ? `${degraded.length} chỉ số giảm từ 10%` : "",
  ].filter(Boolean);

  return {
    schemaVersion: DR8_SCHEMA_VERSION,
    kind: "SHADOW_QUALITY_DRIFT",
    capturedAt: new Date().toISOString(),
    status,
    current,
    baseline,
    averageDegradationPercent,
    degradedMetricCount: degraded.length,
    deltas,
    warnings,
    note: "DR8 chỉ giám sát drift; không tự đổi provider, threshold, xếp hạng hoặc hành vi production.",
  };
}

export function dr8ToolCall(audit: Dr8QualityDriftAudit): Dr8ToolCall {
  return { type: "DR8_QUALITY_DRIFT", audit };
}

export function readDr8Audit(toolCalls: unknown): Dr8QualityDriftAudit | null {
  if (!Array.isArray(toolCalls)) return null;
  const item = toolCalls.find((call) => typeof call === "object" && call !== null && (call as { type?: unknown }).type === "DR8_QUALITY_DRIFT") as Partial<Dr8ToolCall> | undefined;
  const audit = item?.audit;
  return audit?.schemaVersion === DR8_SCHEMA_VERSION && audit.kind === "SHADOW_QUALITY_DRIFT" ? audit : null;
}
