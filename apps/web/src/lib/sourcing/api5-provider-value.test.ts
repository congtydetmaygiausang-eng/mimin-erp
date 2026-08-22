import assert from "node:assert/strict";
import test from "node:test";
import type { Api0OperationObservation } from "./api0-search-observability";
import { buildApi5ProviderValueAudit } from "./api5-provider-value";

const operation = (overrides: Partial<Api0OperationObservation> = {}): Api0OperationObservation => ({ name: "Brave", role: "DISCOVERY", status: "OK", durationMs: 1_000, plannedRequests: 10, rawItems: 60, uniqueItems: 45, ...overrides });

test("API5 scores unique contribution without mutating observations", () => {
  const observations = [operation()];
  const before = JSON.stringify(observations);
  const audit = buildApi5ProviderValueAudit({ observations, finalCandidateCount: 12 });
  assert.equal(JSON.stringify(observations), before);
  assert.equal(audit.operations[0]?.grade, "HIGH");
  assert.equal(audit.operations[0]?.uniqueRatio, 0.75);
  assert.equal(audit.finalCandidateCount, 12);
});

test("API5 flags paid work that creates no unique output", () => {
  const audit = buildApi5ProviderValueAudit({ observations: [operation({ rawItems: 20, uniqueItems: 0 })], finalCandidateCount: 0 });
  assert.deepEqual(audit.requestWasteOperations, ["Brave"]);
  assert.equal(audit.operations[0]?.requestWaste, true);
  assert.equal(audit.operations[0]?.grade, "LOW");
});

test("API5 does not score disabled, skipped or failed providers as low value", () => {
  const audit = buildApi5ProviderValueAudit({ observations: [operation({ status: "DISABLED" }), operation({ name: "Tavily", status: "ERROR" })], finalCandidateCount: 0 });
  assert.ok(audit.operations.every((item) => item.grade === "NOT_MEASURED"));
  assert.equal(audit.measuredOperations, 0);
});
