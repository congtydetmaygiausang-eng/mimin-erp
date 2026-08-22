import assert from "node:assert/strict";
import test from "node:test";
import { buildApi1ProviderContractAudit } from "./api1-provider-contracts";

test("API1 accepts declared discovery overlap without mutating API0 observations", () => {
  const operations = [
    { name: "Tavily", role: "DISCOVERY" as const, status: "OK" as const, durationMs: 10, plannedRequests: 2, rawItems: 20, uniqueItems: 12 },
    { name: "Brave", role: "DISCOVERY" as const, status: "OK" as const, durationMs: 11, plannedRequests: 2, rawItems: 18, uniqueItems: 9 },
    { name: "DeepSeek Normalization", role: "NORMALIZATION" as const, status: "OK" as const, durationMs: 20, plannedRequests: 1, rawItems: 21, uniqueItems: 8 },
  ];
  const before = JSON.stringify(operations);
  const audit = buildApi1ProviderContractAudit(operations);
  assert.equal(JSON.stringify(operations), before);
  assert.equal(audit.healthy, true);
  assert.deepEqual(audit.activeProvidersByRole.DISCOVERY, ["Brave", "Tavily"]);
});

test("API1 reports undeclared, duplicate and role-conflicting operations", () => {
  const audit = buildApi1ProviderContractAudit([
    { name: "Tavily", role: "ENRICHMENT", status: "OK", durationMs: 1, plannedRequests: 1, rawItems: 1, uniqueItems: 1 },
    { name: "Tavily", role: "ENRICHMENT", status: "OK", durationMs: 1, plannedRequests: 1, rawItems: 1, uniqueItems: 1 },
    { name: "Unknown API", role: "DISCOVERY", status: "OK", durationMs: 1, plannedRequests: 1, rawItems: 1, uniqueItems: 1 },
  ]);
  assert.equal(audit.healthy, false);
  assert.ok(audit.findings.some((finding) => finding.code === "ROLE_MISMATCH"));
  assert.ok(audit.findings.some((finding) => finding.code === "DUPLICATE_OBSERVATION"));
  assert.ok(audit.findings.some((finding) => finding.code === "UNDECLARED_OPERATION"));
});
