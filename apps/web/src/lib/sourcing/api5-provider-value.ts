import type { Api0OperationObservation, Api0OperationRole } from "./api0-search-observability";
import { API3_PROVIDER_BUDGETS } from "./api3-provider-budget";

export type Api5ContributionGrade = "HIGH" | "MEDIUM" | "LOW" | "NONE" | "NOT_MEASURED";

export interface Api5OperationValue {
  operation: string;
  role: Api0OperationRole;
  grade: Api5ContributionGrade;
  valueScore: number;
  uniqueContribution: number;
  uniqueRatio: number;
  millisecondsPerUniqueItem: number | null;
  requestWaste: boolean;
  reason: string;
}

export interface Api5ProviderValueAudit {
  schemaVersion: "API5.1";
  shadowOnly: true;
  operations: Api5OperationValue[];
  highValueOperations: string[];
  requestWasteOperations: string[];
  measuredOperations: number;
  averageValueScore: number;
  finalCandidateCount: number;
}

function contributionGrade(score: number, measurable: boolean): Api5ContributionGrade {
  if (!measurable) return "NOT_MEASURED";
  if (score >= 75) return "HIGH";
  if (score >= 50) return "MEDIUM";
  if (score > 0) return "LOW";
  return "NONE";
}

export function buildApi5ProviderValueAudit(input: {
  observations: Api0OperationObservation[];
  finalCandidateCount: number;
}): Api5ProviderValueAudit {
  const operations = input.observations.map((observation): Api5OperationValue => {
    const active = observation.status !== "DISABLED" && observation.status !== "SKIPPED";
    const measurable = active && observation.status !== "ERROR";
    const uniqueRatio = observation.rawItems > 0 ? Math.min(1, observation.uniqueItems / observation.rawItems) : 0;
    const durationBudget = API3_PROVIDER_BUDGETS[observation.name]?.maximumDurationMs ?? 60_000;
    const statusScore = observation.status === "OK" ? 20 : observation.status === "EMPTY" ? 0 : 5;
    const yieldScore = observation.rawItems > 0 ? Math.round(uniqueRatio * 60) : observation.uniqueItems > 0 ? 60 : 0;
    const latencyScore = observation.durationMs <= durationBudget
      ? Math.max(0, Math.round(20 * (1 - observation.durationMs / Math.max(1, durationBudget))))
      : 0;
    const valueScore = measurable ? Math.max(0, Math.min(100, statusScore + yieldScore + latencyScore)) : 0;
    const requestWaste = active && observation.plannedRequests > 0 && observation.uniqueItems === 0;
    const grade = contributionGrade(valueScore, measurable);
    const reason = !active
      ? "API không chạy trong lượt này."
      : observation.status === "ERROR"
        ? "API lỗi nên chưa thể đo giá trị đầu ra."
        : requestWaste
          ? "Có request nhưng không tạo dữ liệu duy nhất."
          : `${observation.uniqueItems}/${observation.rawItems} mục đóng góp duy nhất.`;
    return {
      operation: observation.name,
      role: observation.role,
      grade,
      valueScore,
      uniqueContribution: observation.uniqueItems,
      uniqueRatio: Math.round(uniqueRatio * 100) / 100,
      millisecondsPerUniqueItem: observation.uniqueItems > 0 ? Math.round(observation.durationMs / observation.uniqueItems) : null,
      requestWaste,
      reason,
    };
  });
  const measured = operations.filter((operation) => operation.grade !== "NOT_MEASURED");
  return {
    schemaVersion: "API5.1",
    shadowOnly: true,
    operations,
    highValueOperations: operations.filter((operation) => operation.grade === "HIGH").map((operation) => operation.operation),
    requestWasteOperations: operations.filter((operation) => operation.requestWaste).map((operation) => operation.operation),
    measuredOperations: measured.length,
    averageValueScore: measured.length ? Math.round(measured.reduce((total, operation) => total + operation.valueScore, 0) / measured.length) : 0,
    finalCandidateCount: Math.max(0, Math.round(input.finalCandidateCount)),
  };
}

export function api5ToolCall(audit: Api5ProviderValueAudit): { type: "API5_PROVIDER_VALUE_AUDIT"; audit: Api5ProviderValueAudit } {
  return { type: "API5_PROVIDER_VALUE_AUDIT", audit };
}
