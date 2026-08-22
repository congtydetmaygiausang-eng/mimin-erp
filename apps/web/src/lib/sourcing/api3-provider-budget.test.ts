import assert from "node:assert/strict";
import test from "node:test";
import type { Api0OperationObservation } from "./api0-search-observability";
import { buildApi3ProviderBudgetAudit } from "./api3-provider-budget";

const observation = (overrides: Partial<Api0OperationObservation> = {}): Api0OperationObservation => ({ name: "Tavily", role: "DISCOVERY", status: "OK", durationMs: 1_000, plannedRequests: 10, rawItems: 40, uniqueItems: 20, ...overrides });

test("API3 records healthy provider efficiency without mutating observations", () => {
  const observations = [observation()];
  const before = JSON.stringify(observations);
  const audit = buildApi3ProviderBudgetAudit(observations);
  assert.equal(JSON.stringify(observations), before);
  assert.equal(audit.healthy, true);
  assert.deepEqual(audit.operations[0]?.findings, []);
  assert.equal(audit.operations[0]?.uniqueRatio, 0.5);
});

test("API3 detects request, latency and duplicate budget violations", () => {
  const audit = buildApi3ProviderBudgetAudit([observation({ plannedRequests: 17, durationMs: 50_000, rawItems: 100, uniqueItems: 10 })]);
  assert.equal(audit.healthy, false);
  assert.equal(audit.requestBudgetViolations, 1);
  assert.equal(audit.latencyViolations, 1);
  assert.equal(audit.duplicateHeavyOperations, 1);
});

test("API3 excludes disabled and intentionally skipped APIs from efficiency scoring", () => {
  const audit = buildApi3ProviderBudgetAudit([observation({ status: "DISABLED" }), observation({ name: "Brave", status: "SKIPPED" })]);
  assert.equal(audit.operations.length, 0);
  assert.equal(audit.healthy, true);
});
