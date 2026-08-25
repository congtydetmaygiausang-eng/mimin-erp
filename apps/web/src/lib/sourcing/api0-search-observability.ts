export type Api0OperationStatus = "OK" | "EMPTY" | "ERROR" | "DISABLED" | "SKIPPED";
export type Api0OperationRole = "QUERY_PLANNING" | "DISCOVERY" | "DEEP_READING" | "NORMALIZATION" | "ENRICHMENT" | "GEOLOCATION" | "LEGAL_VERIFICATION";

export interface Api0OperationObservation {
  name: string;
  role: Api0OperationRole;
  status: Api0OperationStatus;
  durationMs: number;
  plannedRequests: number;
  rawItems: number;
  uniqueItems: number;
  code?: string;
  radarLogs?: any[];
}

export interface Api0SearchFunnel {
  rawProviderItems: number;
  uniqueDiscoveryUrls: number;
  deepReaderSources: number;
  normalizedCandidates: number;
  directoryCandidates: number;
  deterministicCandidates: number;
  candidatesBeforeIdentityCleaning: number;
  candidatesAfterIdentityCleaning: number;
  exactCandidates: number;
  relatedCandidates: number;
  candidatesBeforeEntityMerge: number;
  finalCandidates: number;
  insideRadius: number;
  unknownCoordinates: number;
}

export interface Api0SearchBaseline {
  schemaVersion: "API0.1";
  shadowOnly: true;
  startedAt: string;
  completedAt: string;
  totalDurationMs: number;
  operations: Api0OperationObservation[];
  funnel: Api0SearchFunnel;
  invariants: {
    doesNotRewriteQueries: true;
    doesNotReorderCandidates: true;
    doesNotChangeFiltering: true;
  };
}

export function buildApi0SearchBaseline(input: {
  startedAtMs: number;
  completedAtMs: number;
  operations: Api0OperationObservation[];
  funnel: Api0SearchFunnel;
}): Api0SearchBaseline {
  const operations = input.operations.map((operation) => ({
    ...operation,
    durationMs: Math.max(0, Math.round(operation.durationMs)),
    plannedRequests: Math.max(0, Math.round(operation.plannedRequests)),
    rawItems: Math.max(0, Math.round(operation.rawItems)),
    uniqueItems: Math.max(0, Math.round(operation.uniqueItems)),
  }));
  return {
    schemaVersion: "API0.1",
    shadowOnly: true,
    startedAt: new Date(input.startedAtMs).toISOString(),
    completedAt: new Date(input.completedAtMs).toISOString(),
    totalDurationMs: Math.max(0, Math.round(input.completedAtMs - input.startedAtMs)),
    operations,
    funnel: { ...input.funnel },
    invariants: {
      doesNotRewriteQueries: true,
      doesNotReorderCandidates: true,
      doesNotChangeFiltering: true,
    },
  };
}

export function api0ToolCall(baseline: Api0SearchBaseline): { type: "API0_SEARCH_BASELINE"; baseline: Api0SearchBaseline } {
  return { type: "API0_SEARCH_BASELINE", baseline };
}
