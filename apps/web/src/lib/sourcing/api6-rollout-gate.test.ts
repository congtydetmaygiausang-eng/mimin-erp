import assert from "node:assert/strict";
import test from "node:test";
import { buildApi6RolloutGateAudit } from "./api6-rollout-gate";

const healthyInput = {
  api1: { schemaVersion: "API1.1" as const, shadowOnly: true as const, contractCount: 13, observedOperationCount: 5, activeProvidersByRole: {}, findings: [], healthy: true },
  api2: { schemaVersion: "API2.1" as const, shadowOnly: true as const, policy: "LOCATION_FIRST_WITH_WEB_FANOUT_AND_SAFE_FALLBACK" as const, decisions: [], deviationCount: 0, notConfiguredCount: 0, healthy: true },
  api3: { schemaVersion: "API3.1" as const, shadowOnly: true as const, operations: [], requestBudgetViolations: 0, latencyViolations: 0, zeroYieldOperations: 0, duplicateHeavyOperations: 0, healthy: true },
  api4: { schemaVersion: "API4.1" as const, shadowOnly: true as const, incidents: [], roleCoverage: [], retryableIncidents: 0, credentialIncidents: 0, degradedRoles: 0, healthy: true },
  api5: { schemaVersion: "API5.1" as const, shadowOnly: true as const, operations: [], highValueOperations: ["Brave"], requestWasteOperations: [], measuredOperations: 3, averageValueScore: 70, finalCandidateCount: 12 },
};

test("API6 holds optimization until enough shadow runs exist", () => {
  const audit = buildApi6RolloutGateAudit({ ...healthyInput, observedRuns: 1 });
  assert.equal(audit.decision, "HOLD_INSUFFICIENT_EVIDENCE");
  assert.equal(audit.eligibleForCanary, false);
  assert.equal(audit.recommendedCanaryPercent, 0);
});

test("API6 allows only a one-percent canary after all safety gates pass", () => {
  const audit = buildApi6RolloutGateAudit({ ...healthyInput, observedRuns: 20 });
  assert.equal(audit.decision, "READY_FOR_CANARY");
  assert.equal(audit.eligibleForCanary, true);
  assert.equal(audit.recommendedCanaryPercent, 1);
});

test("API6 blocks rollout when routing or resilience is unhealthy", () => {
  const audit = buildApi6RolloutGateAudit({
    ...healthyInput,
    api2: { ...healthyInput.api2, deviationCount: 1, healthy: false },
    api4: { ...healthyInput.api4, credentialIncidents: 1, healthy: false },
    observedRuns: 30,
  });
  assert.equal(audit.decision, "BLOCKED");
  assert.equal(audit.blockers.length, 2);
});
