import assert from "node:assert/strict";
import test from "node:test";
import { buildDr3SourceRouterAudit, dr3ToolCall, readDr3Audit } from "./dr3-source-router";

test("DR3 reports resilient and single-path routes from observed health", () => {
  const providers = [
    { name: "Tavily", status: "OK" as const, count: 30 },
    { name: "Brave", status: "OK" as const, count: 25 },
    { name: "Gemini", status: "ERROR" as const, count: 0, code: "HTTP_429" },
    { name: "Google Places", status: "OK" as const, count: 8 },
    { name: "Trafilatura shadow", status: "OK" as const, count: 5 },
  ];
  const before = JSON.stringify(providers);
  const audit = buildDr3SourceRouterAudit({ providers, registryEvidenceCount: 2 });
  assert.equal(JSON.stringify(providers), before);
  assert.equal(audit.routes.find((route) => route.branch === "DISCOVERY")?.status, "RESILIENT");
  assert.equal(audit.routes.find((route) => route.branch === "REGISTRY")?.status, "SINGLE_PATH");
  assert.deepEqual(audit.providerErrors, [{ name: "Gemini", code: "HTTP_429" }]);
  assert.equal(readDr3Audit([dr3ToolCall(audit)])?.schemaVersion, "DR3-1");
});

test("DR3 does not claim fallback readiness when providers are unavailable", () => {
  const audit = buildDr3SourceRouterAudit({
    providers: [
      { name: "Tavily", status: "ERROR", count: 0, code: "TIMEOUT" },
      { name: "Brave", status: "DISABLED", count: 0 },
    ],
    registryEvidenceCount: 0,
  });
  assert.ok(audit.unavailableRoutes > 0);
  assert.equal(audit.routes.find((route) => route.branch === "REGISTRY")?.status, "UNAVAILABLE");
});
