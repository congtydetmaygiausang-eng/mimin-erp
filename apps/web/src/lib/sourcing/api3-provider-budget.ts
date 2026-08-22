import type { Api0OperationObservation } from "./api0-search-observability";

export interface Api3ProviderBudget {
  maximumRequests: number;
  maximumDurationMs: number;
  minimumUniqueRatio: number;
}

export type Api3BudgetFindingCode = "REQUEST_BUDGET_EXCEEDED" | "LATENCY_BUDGET_EXCEEDED" | "ZERO_YIELD" | "DUPLICATE_HEAVY";

export interface Api3OperationEfficiency {
  operation: string;
  requestBudget: number;
  plannedRequests: number;
  durationMs: number;
  uniqueRatio: number;
  findings: Api3BudgetFindingCode[];
}

export interface Api3ProviderBudgetAudit {
  schemaVersion: "API3.1";
  shadowOnly: true;
  operations: Api3OperationEfficiency[];
  requestBudgetViolations: number;
  latencyViolations: number;
  zeroYieldOperations: number;
  duplicateHeavyOperations: number;
  healthy: boolean;
}

const DEFAULT_BUDGET: Api3ProviderBudget = { maximumRequests: 20, maximumDurationMs: 60_000, minimumUniqueRatio: 0.2 };

export const API3_PROVIDER_BUDGETS: Readonly<Record<string, Api3ProviderBudget>> = {
  "DeepSeek Query Planner": { maximumRequests: 1, maximumDurationMs: 20_000, minimumUniqueRatio: 0.8 },
  Tavily: { maximumRequests: 16, maximumDurationMs: 45_000, minimumUniqueRatio: 0.25 },
  Brave: { maximumRequests: 16, maximumDurationMs: 45_000, minimumUniqueRatio: 0.25 },
  Gemini: { maximumRequests: 1, maximumDurationMs: 30_000, minimumUniqueRatio: 0.2 },
  "Google Places": { maximumRequests: 3, maximumDurationMs: 20_000, minimumUniqueRatio: 0.4 },
  OpenAI: { maximumRequests: 1, maximumDurationMs: 30_000, minimumUniqueRatio: 0.2 },
  OpenStreetMap: { maximumRequests: 1, maximumDurationMs: 20_000, minimumUniqueRatio: 0.5 },
  Trafilatura: { maximumRequests: 8, maximumDurationMs: 55_000, minimumUniqueRatio: 0.3 },
  "Gemini Directory Extraction": { maximumRequests: 5, maximumDurationMs: 45_000, minimumUniqueRatio: 0.15 },
  "DeepSeek Normalization": { maximumRequests: 5, maximumDurationMs: 60_000, minimumUniqueRatio: 0.15 },
  "Contact Enrichment": { maximumRequests: 20, maximumDurationMs: 45_000, minimumUniqueRatio: 0.1 },
  "Gemini Web Agent": { maximumRequests: 10, maximumDurationMs: 45_000, minimumUniqueRatio: 0.1 },
  "Google Maps / Nominatim Geocoding": { maximumRequests: 40, maximumDurationMs: 60_000, minimumUniqueRatio: 0.3 },
};

export function buildApi3ProviderBudgetAudit(observations: Api0OperationObservation[]): Api3ProviderBudgetAudit {
  const operations = observations
    .filter((observation) => observation.status !== "DISABLED" && observation.status !== "SKIPPED")
    .map((observation): Api3OperationEfficiency => {
      const budget = API3_PROVIDER_BUDGETS[observation.name] ?? DEFAULT_BUDGET;
      const uniqueRatio = observation.rawItems > 0 ? Math.min(1, observation.uniqueItems / observation.rawItems) : 0;
      const findings: Api3BudgetFindingCode[] = [];
      if (observation.plannedRequests > budget.maximumRequests) findings.push("REQUEST_BUDGET_EXCEEDED");
      if (observation.durationMs > budget.maximumDurationMs) findings.push("LATENCY_BUDGET_EXCEEDED");
      if (observation.status === "EMPTY" || (observation.rawItems > 0 && observation.uniqueItems === 0)) findings.push("ZERO_YIELD");
      if (observation.rawItems >= 5 && uniqueRatio < budget.minimumUniqueRatio) findings.push("DUPLICATE_HEAVY");
      return {
        operation: observation.name,
        requestBudget: budget.maximumRequests,
        plannedRequests: observation.plannedRequests,
        durationMs: observation.durationMs,
        uniqueRatio: Math.round(uniqueRatio * 100) / 100,
        findings,
      };
    });

  const requestBudgetViolations = operations.filter((operation) => operation.findings.includes("REQUEST_BUDGET_EXCEEDED")).length;
  const latencyViolations = operations.filter((operation) => operation.findings.includes("LATENCY_BUDGET_EXCEEDED")).length;
  const zeroYieldOperations = operations.filter((operation) => operation.findings.includes("ZERO_YIELD")).length;
  const duplicateHeavyOperations = operations.filter((operation) => operation.findings.includes("DUPLICATE_HEAVY")).length;
  return {
    schemaVersion: "API3.1",
    shadowOnly: true,
    operations,
    requestBudgetViolations,
    latencyViolations,
    zeroYieldOperations,
    duplicateHeavyOperations,
    healthy: requestBudgetViolations === 0 && latencyViolations === 0,
  };
}

export function api3ToolCall(audit: Api3ProviderBudgetAudit): { type: "API3_PROVIDER_BUDGET_AUDIT"; audit: Api3ProviderBudgetAudit } {
  return { type: "API3_PROVIDER_BUDGET_AUDIT", audit };
}
