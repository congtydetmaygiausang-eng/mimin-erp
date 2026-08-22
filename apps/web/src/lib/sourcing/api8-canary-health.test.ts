import assert from "node:assert/strict";
import test from "node:test";
import { buildApi0SearchBaseline } from "./api0-search-observability";
import type { Api2RoutingPolicyAudit } from "./api2-routing-policy";
import type { Api4ResilienceAudit } from "./api4-resilience-audit";
import type { Api7CanaryPlanAudit } from "./api7-canary-plan";
import { buildApi8CanaryHealthAudit } from "./api8-canary-health";

const api0 = (durationMs = 1_000, candidates = 10, status: "OK" | "ERROR" = "OK") => buildApi0SearchBaseline({ startedAtMs: 0, completedAtMs: durationMs, operations: [{ name: "Tavily", role: "DISCOVERY", status, durationMs, plannedRequests: 1, rawItems: candidates, uniqueItems: candidates }], funnel: { rawProviderItems: candidates, uniqueDiscoveryUrls: candidates, deepReaderSources: 0, normalizedCandidates: candidates, directoryCandidates: 0, deterministicCandidates: 0, candidatesBeforeIdentityCleaning: candidates, candidatesAfterIdentityCleaning: candidates, exactCandidates: candidates, relatedCandidates: 0, candidatesBeforeEntityMerge: candidates, finalCandidates: candidates, insideRadius: candidates, unknownCoordinates: 0 } });
const api2: Api2RoutingPolicyAudit = { schemaVersion: "API2.1", shadowOnly: true, policy: "LOCATION_FIRST_WITH_WEB_FANOUT_AND_SAFE_FALLBACK", decisions: [], deviationCount: 0, notConfiguredCount: 0, healthy: true };
const api4: Api4ResilienceAudit = { schemaVersion: "API4.1", shadowOnly: true, incidents: [], roleCoverage: [], retryableIncidents: 0, credentialIncidents: 0, degradedRoles: 0, healthy: true };
const api7 = (allocationPercent: 0 | 1): Api7CanaryPlanAudit => ({ schemaVersion: "API7.1", shadowOnly: true, executionEnabled: false, allocationPercent, bucket: 0, wouldAssignVariant: allocationPercent ? "CANARY" : "CONTROL", rolloutDecision: allocationPercent ? "READY_FOR_CANARY" : "HOLD_INSUFFICIENT_EVIDENCE", guardrails: [], rollbackMode: "IMMEDIATE_TO_CONTROL", reason: "test" });

test("API8 keeps control when canary is not eligible", () => {
  const audit = buildApi8CanaryHealthAudit({ api0: api0(), api2, api4, api7: api7(0), baseline: null });
  assert.equal(audit.decision, "CONTROL_ONLY");
  assert.equal(audit.recommendedAction, "KEEP_CONTROL");
});

test("API8 continues a healthy simulated canary", () => {
  const audit = buildApi8CanaryHealthAudit({ api0: api0(1_050, 10), api2, api4, api7: api7(1), baseline: { errorRatePercent: 0, p95LatencyMs: 1_000, finalCandidateCount: 10 } });
  assert.equal(audit.decision, "CANARY_HEALTHY");
  assert.equal(audit.breaches.length, 0);
});

test("API8 requires rollback when latency and candidate guardrails break", () => {
  const audit = buildApi8CanaryHealthAudit({ api0: api0(1_500, 7), api2, api4, api7: api7(1), baseline: { errorRatePercent: 0, p95LatencyMs: 1_000, finalCandidateCount: 10 } });
  assert.equal(audit.decision, "ROLLBACK_REQUIRED");
  assert.ok(audit.breaches.some((breach) => breach.metric === "P95_LATENCY_INCREASE_PERCENT"));
  assert.ok(audit.breaches.some((breach) => breach.metric === "FINAL_CANDIDATE_DROP_PERCENT"));
  assert.equal(audit.executionEnabled, false);
});
