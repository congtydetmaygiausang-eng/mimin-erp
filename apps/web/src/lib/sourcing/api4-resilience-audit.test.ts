import assert from "node:assert/strict";
import test from "node:test";
import type { Api0OperationObservation } from "./api0-search-observability";
import { buildApi4ResilienceAudit } from "./api4-resilience-audit";

const operation = (name: string, status: Api0OperationObservation["status"], code?: string): Api0OperationObservation => ({ name, role: "DISCOVERY", status, durationMs: 1, plannedRequests: 1, rawItems: status === "OK" ? 1 : 0, uniqueItems: status === "OK" ? 1 : 0, code });

test("API4 classifies credential, rate-limit and timeout incidents correctly", () => {
  const observations = [operation("Tavily", "ERROR", "HTTP 401"), operation("Brave", "ERROR", "HTTP 429"), operation("Gemini", "ERROR", "GATEWAY_TIMEOUT"), operation("OpenAI", "OK")];
  const before = JSON.stringify(observations);
  const audit = buildApi4ResilienceAudit(observations);
  assert.equal(JSON.stringify(observations), before);
  assert.equal(audit.incidents.find((incident) => incident.operation === "Tavily")?.action, "FIX_CREDENTIALS");
  assert.equal(audit.incidents.find((incident) => incident.operation === "Brave")?.action, "BACKOFF_AND_RETRY");
  assert.equal(audit.incidents.find((incident) => incident.operation === "Gemini")?.action, "RETRY_THEN_FALLBACK");
  assert.equal(audit.degradedRoles, 0);
});

test("API4 detects a role with no available provider", () => {
  const audit = buildApi4ResilienceAudit([operation("Tavily", "ERROR", "HTTP 500"), operation("Brave", "DISABLED")]);
  assert.equal(audit.degradedRoles, 1);
  assert.equal(audit.healthy, false);
});

test("API4 treats an empty provider as fallback-worthy without blind retry", () => {
  const audit = buildApi4ResilienceAudit([operation("Tavily", "EMPTY"), operation("Brave", "OK")]);
  const incident = audit.incidents.find((item) => item.operation === "Tavily");
  assert.equal(incident?.action, "USE_FALLBACK");
  assert.equal(incident?.retryable, false);
  assert.equal(audit.healthy, true);
});
