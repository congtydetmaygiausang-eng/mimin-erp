import assert from "node:assert/strict";
import test from "node:test";
import { buildApi0SearchBaseline } from "./api0-search-observability";

test("API0 records the complete funnel without mutating observations", () => {
  const operations = [{ name: "Brave", role: "DISCOVERY" as const, status: "OK" as const, durationMs: 123.6, plannedRequests: 14, rawItems: 60, uniqueItems: 41 }];
  const before = JSON.stringify(operations);
  const baseline = buildApi0SearchBaseline({
    startedAtMs: 1_000,
    completedAtMs: 2_500,
    operations,
    funnel: {
      rawProviderItems: 60,
      uniqueDiscoveryUrls: 41,
      deepReaderSources: 5,
      normalizedCandidates: 12,
      directoryCandidates: 3,
      deterministicCandidates: 2,
      candidatesBeforeIdentityCleaning: 17,
      candidatesAfterIdentityCleaning: 15,
      exactCandidates: 8,
      relatedCandidates: 4,
      candidatesBeforeEntityMerge: 12,
      finalCandidates: 9,
      insideRadius: 6,
      unknownCoordinates: 3,
    },
  });
  assert.equal(JSON.stringify(operations), before);
  assert.equal(baseline.totalDurationMs, 1_500);
  assert.equal(baseline.operations[0]?.durationMs, 124);
  assert.equal(baseline.funnel.rawProviderItems, 60);
  assert.equal(baseline.funnel.finalCandidates, 9);
  assert.equal(baseline.shadowOnly, true);
});

test("API0 clamps invalid negative counters but never changes pipeline data", () => {
  const baseline = buildApi0SearchBaseline({
    startedAtMs: 10,
    completedAtMs: 5,
    operations: [{ name: "Tavily", role: "DISCOVERY", status: "ERROR", durationMs: -1, plannedRequests: -2, rawItems: -3, uniqueItems: -4, code: "HTTP 432" }],
    funnel: { rawProviderItems: 0, uniqueDiscoveryUrls: 0, deepReaderSources: 0, normalizedCandidates: 0, directoryCandidates: 0, deterministicCandidates: 0, candidatesBeforeIdentityCleaning: 0, candidatesAfterIdentityCleaning: 0, exactCandidates: 0, relatedCandidates: 0, candidatesBeforeEntityMerge: 0, finalCandidates: 0, insideRadius: 0, unknownCoordinates: 0 },
  });
  assert.equal(baseline.totalDurationMs, 0);
  assert.equal(baseline.operations[0]?.plannedRequests, 0);
  assert.equal(baseline.operations[0]?.code, "HTTP 432");
});
