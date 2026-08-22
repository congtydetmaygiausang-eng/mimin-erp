import type { Api1ProviderContractAudit } from "./api1-provider-contracts";
import type { Api2RoutingPolicyAudit } from "./api2-routing-policy";
import type { Api3ProviderBudgetAudit } from "./api3-provider-budget";
import type { Api4ResilienceAudit } from "./api4-resilience-audit";
import type { Api5ProviderValueAudit } from "./api5-provider-value";

export type Api6RolloutDecision = "HOLD_INSUFFICIENT_EVIDENCE" | "BLOCKED" | "READY_FOR_CANARY";

export interface Api6GateCheck {
  name: "OBSERVATION_VOLUME" | "PROVIDER_CONTRACTS" | "ROUTING" | "BUDGET" | "RESILIENCE" | "VALUE_SIGNAL";
  passed: boolean;
  detail: string;
}

export interface Api6RolloutGateAudit {
  schemaVersion: "API6.1";
  shadowOnly: true;
  decision: Api6RolloutDecision;
  eligibleForCanary: boolean;
  recommendedCanaryPercent: 0 | 1;
  observedRuns: number;
  requiredRuns: number;
  checks: Api6GateCheck[];
  blockers: string[];
}

export const API6_MINIMUM_OBSERVED_RUNS = 20;

export function buildApi6RolloutGateAudit(input: {
  api1: Api1ProviderContractAudit;
  api2: Api2RoutingPolicyAudit;
  api3: Api3ProviderBudgetAudit;
  api4: Api4ResilienceAudit;
  api5: Api5ProviderValueAudit;
  observedRuns: number;
}): Api6RolloutGateAudit {
  const observedRuns = Math.max(0, Math.round(input.observedRuns));
  const checks: Api6GateCheck[] = [
    { name: "OBSERVATION_VOLUME", passed: observedRuns >= API6_MINIMUM_OBSERVED_RUNS, detail: `${observedRuns}/${API6_MINIMUM_OBSERVED_RUNS} lượt đã quan sát.` },
    { name: "PROVIDER_CONTRACTS", passed: input.api1.healthy, detail: `${input.api1.findings.length} phát hiện hợp đồng API.` },
    { name: "ROUTING", passed: input.api2.deviationCount === 0, detail: `${input.api2.deviationCount} sai lệch định tuyến.` },
    { name: "BUDGET", passed: input.api3.healthy, detail: `${input.api3.requestBudgetViolations} vượt request, ${input.api3.latencyViolations} vượt thời gian.` },
    { name: "RESILIENCE", passed: input.api4.healthy, detail: `${input.api4.credentialIncidents} lỗi xác thực, ${input.api4.degradedRoles} vai trò suy giảm.` },
    { name: "VALUE_SIGNAL", passed: input.api5.measuredOperations > 0, detail: `${input.api5.measuredOperations} API có thể đo, điểm trung bình ${input.api5.averageValueScore}/100.` },
  ];
  const blockers = checks.filter((check) => !check.passed).map((check) => `${check.name}: ${check.detail}`);
  const evidenceReady = checks.find((check) => check.name === "OBSERVATION_VOLUME")?.passed ?? false;
  const safetyChecksPassed = checks.filter((check) => check.name !== "OBSERVATION_VOLUME").every((check) => check.passed);
  const decision: Api6RolloutDecision = !evidenceReady
    ? "HOLD_INSUFFICIENT_EVIDENCE"
    : safetyChecksPassed
      ? "READY_FOR_CANARY"
      : "BLOCKED";
  return {
    schemaVersion: "API6.1",
    shadowOnly: true,
    decision,
    eligibleForCanary: decision === "READY_FOR_CANARY",
    recommendedCanaryPercent: decision === "READY_FOR_CANARY" ? 1 : 0,
    observedRuns,
    requiredRuns: API6_MINIMUM_OBSERVED_RUNS,
    checks,
    blockers,
  };
}

export function api6ToolCall(audit: Api6RolloutGateAudit): { type: "API6_ROLLOUT_GATE_AUDIT"; audit: Api6RolloutGateAudit } {
  return { type: "API6_ROLLOUT_GATE_AUDIT", audit };
}
