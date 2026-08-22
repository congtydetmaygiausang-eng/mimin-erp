import type { Api6RolloutGateAudit } from "./api6-rollout-gate";

export interface Api7CanaryGuardrail {
  metric: "ERROR_RATE_PERCENT" | "P95_LATENCY_INCREASE_PERCENT" | "FINAL_CANDIDATE_DROP_PERCENT" | "ROUTING_DEVIATIONS" | "CREDENTIAL_INCIDENTS";
  rollbackThreshold: number;
  direction: "ABOVE";
}

export interface Api7CanaryPlanAudit {
  schemaVersion: "API7.1";
  shadowOnly: true;
  executionEnabled: false;
  allocationPercent: 0 | 1;
  bucket: number;
  wouldAssignVariant: "CONTROL" | "CANARY";
  rolloutDecision: Api6RolloutGateAudit["decision"];
  guardrails: Api7CanaryGuardrail[];
  rollbackMode: "IMMEDIATE_TO_CONTROL";
  reason: string;
}

export const API7_GUARDRAILS: readonly Api7CanaryGuardrail[] = [
  { metric: "ERROR_RATE_PERCENT", rollbackThreshold: 2, direction: "ABOVE" },
  { metric: "P95_LATENCY_INCREASE_PERCENT", rollbackThreshold: 20, direction: "ABOVE" },
  { metric: "FINAL_CANDIDATE_DROP_PERCENT", rollbackThreshold: 10, direction: "ABOVE" },
  { metric: "ROUTING_DEVIATIONS", rollbackThreshold: 0, direction: "ABOVE" },
  { metric: "CREDENTIAL_INCIDENTS", rollbackThreshold: 0, direction: "ABOVE" },
] as const;

function stableBucket(subject: string): number {
  let hash = 2166136261;
  for (let index = 0; index < subject.length; index += 1) {
    hash ^= subject.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
}

export function buildApi7CanaryPlanAudit(input: { api6: Api6RolloutGateAudit; subjectId: string }): Api7CanaryPlanAudit {
  const allocationPercent = input.api6.eligibleForCanary ? input.api6.recommendedCanaryPercent : 0;
  const bucket = stableBucket(input.subjectId.trim() || "anonymous");
  const wouldAssignVariant = allocationPercent > 0 && bucket < allocationPercent ? "CANARY" : "CONTROL";
  return {
    schemaVersion: "API7.1",
    shadowOnly: true,
    executionEnabled: false,
    allocationPercent,
    bucket,
    wouldAssignVariant,
    rolloutDecision: input.api6.decision,
    guardrails: API7_GUARDRAILS.map((guardrail) => ({ ...guardrail })),
    rollbackMode: "IMMEDIATE_TO_CONTROL",
    reason: allocationPercent === 0
      ? `Không phân canary vì API6 đang ở trạng thái ${input.api6.decision}.`
      : `Mô phỏng phân nhóm ổn định ${allocationPercent}% để đánh giá trước khi bật thật.`,
  };
}

export function api7ToolCall(audit: Api7CanaryPlanAudit): { type: "API7_CANARY_PLAN_AUDIT"; audit: Api7CanaryPlanAudit } {
  return { type: "API7_CANARY_PLAN_AUDIT", audit };
}
