import type { Api0SearchBaseline } from "./api0-search-observability";
import type { Api2RoutingPolicyAudit } from "./api2-routing-policy";
import type { Api4ResilienceAudit } from "./api4-resilience-audit";
import type { Api7CanaryPlanAudit } from "./api7-canary-plan";

export interface Api8ControlBaseline {
  errorRatePercent: number;
  p95LatencyMs: number;
  finalCandidateCount: number;
}

export type Api8CanaryHealthDecision = "CONTROL_ONLY" | "WAITING_FOR_BASELINE" | "CANARY_HEALTHY" | "ROLLBACK_REQUIRED";

export interface Api8GuardrailBreach {
  metric: "ERROR_RATE_PERCENT" | "P95_LATENCY_INCREASE_PERCENT" | "FINAL_CANDIDATE_DROP_PERCENT" | "ROUTING_DEVIATIONS" | "CREDENTIAL_INCIDENTS";
  actual: number;
  threshold: number;
}

export interface Api8CanaryHealthAudit {
  schemaVersion: "API8.1";
  shadowOnly: true;
  executionEnabled: false;
  decision: Api8CanaryHealthDecision;
  current: Api8ControlBaseline;
  baseline: Api8ControlBaseline | null;
  latencyIncreasePercent: number | null;
  candidateDropPercent: number | null;
  breaches: Api8GuardrailBreach[];
  recommendedAction: "KEEP_CONTROL" | "CONTINUE_CANARY" | "ROLLBACK_TO_CONTROL";
}

function percentChange(current: number, baseline: number): number {
  if (baseline <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - baseline) / baseline) * 1_000) / 10;
}

export function buildApi8CanaryHealthAudit(input: {
  api0: Api0SearchBaseline;
  api2: Api2RoutingPolicyAudit;
  api4: Api4ResilienceAudit;
  api7: Api7CanaryPlanAudit;
  baseline: Api8ControlBaseline | null;
}): Api8CanaryHealthAudit {
  const active = input.api0.operations.filter((operation) => operation.status !== "DISABLED" && operation.status !== "SKIPPED");
  const errors = active.filter((operation) => operation.status === "ERROR").length;
  const current: Api8ControlBaseline = {
    errorRatePercent: active.length ? Math.round((errors / active.length) * 1_000) / 10 : 0,
    p95LatencyMs: active.length ? Math.max(...active.map((operation) => operation.durationMs)) : 0,
    finalCandidateCount: input.api0.funnel.finalCandidates,
  };
  const baseline = input.baseline ? { ...input.baseline } : null;
  const latencyIncreasePercent = baseline ? percentChange(current.p95LatencyMs, baseline.p95LatencyMs) : null;
  const candidateDropPercent = baseline ? Math.max(0, -percentChange(current.finalCandidateCount, baseline.finalCandidateCount)) : null;
  const breaches: Api8GuardrailBreach[] = [];

  if (baseline) {
    if (current.errorRatePercent > 2) breaches.push({ metric: "ERROR_RATE_PERCENT", actual: current.errorRatePercent, threshold: 2 });
    if ((latencyIncreasePercent ?? 0) > 20) breaches.push({ metric: "P95_LATENCY_INCREASE_PERCENT", actual: latencyIncreasePercent ?? 0, threshold: 20 });
    if ((candidateDropPercent ?? 0) > 10) breaches.push({ metric: "FINAL_CANDIDATE_DROP_PERCENT", actual: candidateDropPercent ?? 0, threshold: 10 });
    if (input.api2.deviationCount > 0) breaches.push({ metric: "ROUTING_DEVIATIONS", actual: input.api2.deviationCount, threshold: 0 });
    if (input.api4.credentialIncidents > 0) breaches.push({ metric: "CREDENTIAL_INCIDENTS", actual: input.api4.credentialIncidents, threshold: 0 });
  }

  const decision: Api8CanaryHealthDecision = input.api7.allocationPercent === 0
    ? "CONTROL_ONLY"
    : !baseline
      ? "WAITING_FOR_BASELINE"
      : breaches.length
        ? "ROLLBACK_REQUIRED"
        : "CANARY_HEALTHY";
  return {
    schemaVersion: "API8.1",
    shadowOnly: true,
    executionEnabled: false,
    decision,
    current,
    baseline,
    latencyIncreasePercent,
    candidateDropPercent,
    breaches,
    recommendedAction: decision === "ROLLBACK_REQUIRED" ? "ROLLBACK_TO_CONTROL" : decision === "CANARY_HEALTHY" ? "CONTINUE_CANARY" : "KEEP_CONTROL",
  };
}

export function api8ToolCall(audit: Api8CanaryHealthAudit): { type: "API8_CANARY_HEALTH_AUDIT"; audit: Api8CanaryHealthAudit } {
  return { type: "API8_CANARY_HEALTH_AUDIT", audit };
}
