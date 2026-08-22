import assert from "node:assert/strict";
import test from "node:test";
import type { Api0OperationObservation, Api0SearchFunnel } from "./api0-search-observability";
import { buildApi2RoutingPolicyAudit } from "./api2-routing-policy";

const emptyFunnel: Api0SearchFunnel = { rawProviderItems: 0, uniqueDiscoveryUrls: 0, deepReaderSources: 0, normalizedCandidates: 0, directoryCandidates: 0, deterministicCandidates: 0, candidatesBeforeIdentityCleaning: 0, candidatesAfterIdentityCleaning: 0, exactCandidates: 0, relatedCandidates: 0, candidatesBeforeEntityMerge: 0, finalCandidates: 0, insideRadius: 0, unknownCoordinates: 0 };
const operation = (name: string, status: Api0OperationObservation["status"], uniqueItems = 0): Api0OperationObservation => ({ name, role: name === "Google Places" || name === "OpenStreetMap" ? "GEOLOCATION" : "DISCOVERY", status, durationMs: 1, plannedRequests: 1, rawItems: uniqueItems, uniqueItems });

test("API2 recommends skipping web fan-out when location-first Places is sufficient", () => {
  const observations = [operation("Google Places", "OK", 8), operation("Tavily", "SKIPPED"), operation("Brave", "SKIPPED"), operation("Gemini", "SKIPPED"), operation("OpenAI", "SKIPPED")];
  const before = JSON.stringify(observations);
  const audit = buildApi2RoutingPolicyAudit({ operations: observations, funnel: { ...emptyFunnel, uniqueDiscoveryUrls: 8 }, locationPriority: true });
  assert.equal(JSON.stringify(observations), before);
  assert.equal(audit.deviationCount, 0);
  assert.ok(audit.decisions.filter((decision) => decision.operation !== "Google Places").every((decision) => decision.expectation === "SHOULD_SKIP"));
});

test("API2 detects unnecessary web fan-out and missing geocoding", () => {
  const audit = buildApi2RoutingPolicyAudit({
    operations: [operation("Google Places", "OK", 9), operation("Tavily", "OK", 3), { ...operation("Google Maps / Nominatim Geocoding", "SKIPPED"), role: "GEOLOCATION" }],
    funnel: { ...emptyFunnel, uniqueDiscoveryUrls: 12, candidatesBeforeEntityMerge: 4 },
    locationPriority: true,
  });
  assert.equal(audit.deviationCount, 2);
  assert.equal(audit.healthy, false);
});

test("API2 treats disabled providers as configuration gaps, not routing defects", () => {
  const audit = buildApi2RoutingPolicyAudit({ operations: [operation("Tavily", "DISABLED")], funnel: emptyFunnel, locationPriority: false });
  assert.equal(audit.deviationCount, 0);
  assert.equal(audit.notConfiguredCount, 1);
  assert.equal(audit.healthy, true);
});
