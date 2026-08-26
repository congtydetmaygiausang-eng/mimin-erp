import assert from "node:assert/strict";
import test from "node:test";
import {
  GATE5_PRODUCTION_SCENARIOS,
  evaluateGate5Scenario,
  type Gate5ObservedCandidate,
} from "./gate5-production-evaluation";

function observed(overrides: Partial<Gate5ObservedCandidate> = {}): Gate5ObservedCandidate {
  return {
    legalName: "CÔNG TY TNHH DỆT MAY GIÀU SANG",
    isB2B: true,
    identityValid: true,
    locationStatus: "IN_RADIUS",
    phoneEvidence: true,
    addressEvidence: true,
    emailEvidence: true,
    taxCodeEvidence: true,
    websiteEvidence: true,
    duplicateGroupKey: "0318507560",
    rejectionReason: null,
    ...overrides,
  };
}

test("Gate 5 fixes the three production scenarios and their search radii", () => {
  assert.deepEqual(
    GATE5_PRODUCTION_SCENARIOS.map(({ capability, center, radiusKm }) => ({ capability, center, radiusKm })),
    [
      { capability: "Nhà cung cấp vải cotton", center: "Hóc Môn", radiusKm: 10 },
      { capability: "Xưởng may gia công", center: "Tân Phú", radiusKm: 20 },
      { capability: "Công ty dệt may", center: "Bình Thạnh", radiusKm: 30 },
    ],
  );
});

test("Gate 5 passes an evidence-backed B2B result set without mutating candidates", () => {
  const candidates = [
    observed(),
    observed({ legalName: "CÔNG TY TNHH VẢI MINH TÂM", duplicateGroupKey: "0311111111" }),
    observed({ legalName: "XƯỞNG DỆT THÀNH CÔNG", duplicateGroupKey: "0903111222", taxCodeEvidence: false }),
    observed({ legalName: "CÔNG TY TNHH VẢI PHÚC AN", duplicateGroupKey: "phuc-an.vn", emailEvidence: false }),
    observed({ legalName: "CÔNG TY TNHH DỆT VIỆT", duplicateGroupKey: "0312222222", websiteEvidence: false }),
  ] as const;
  const before = JSON.stringify(candidates);
  const report = evaluateGate5Scenario(GATE5_PRODUCTION_SCENARIOS[0], candidates);

  assert.equal(JSON.stringify(candidates), before);
  assert.equal(report.status, "PASS");
  assert.equal(report.metrics.b2bPrecisionPercent, 100);
  assert.equal(report.metrics.inRadiusVerifiedPercent, 100);
  assert.equal(report.metrics.duplicateRatePercent, 0);
  assert.equal(report.metrics.coreContactCoveragePercent, 100);
});

test("Gate 5 fails closed and reports every measurable production defect", () => {
  const report = evaluateGate5Scenario(GATE5_PRODUCTION_SCENARIOS[1], [
    observed({ isB2B: false, locationStatus: "OUT_OF_RADIUS", identityValid: false, duplicateGroupKey: "dup" }),
    observed({ locationStatus: "UNVERIFIED", duplicateGroupKey: "dup", phoneEvidence: false, emailEvidence: false }),
    observed({ locationStatus: "OUT_OF_RADIUS", duplicateGroupKey: "third", addressEvidence: false }),
    observed({ locationStatus: "UNVERIFIED", duplicateGroupKey: "fourth", phoneEvidence: false }),
    observed({ locationStatus: "OUT_OF_RADIUS", duplicateGroupKey: "fifth", identityValid: false }),
    observed({ locationStatus: "OUT_OF_RADIUS", duplicateGroupKey: "rejected", rejectionReason: "OUT_OF_RADIUS" }),
  ]);

  assert.equal(report.status, "FAIL");
  assert.ok(report.failures.includes("B2B_PRECISION_BELOW_90"));
  assert.ok(report.failures.includes("IN_RADIUS_VERIFICATION_BELOW_80"));
  assert.ok(report.failures.includes("INVALID_IDENTITY_PRESENT"));
  assert.ok(report.failures.includes("DUPLICATE_RATE_ABOVE_5"));
  assert.ok(report.rejectionReasons.OUT_OF_RADIUS >= 1);
});

test("Gate 5 refuses to pass a tiny sample even when every row looks correct", () => {
  const report = evaluateGate5Scenario(GATE5_PRODUCTION_SCENARIOS[2], [observed(), observed({ duplicateGroupKey: "second" })]);
  assert.equal(report.status, "INSUFFICIENT_SAMPLE");
  assert.ok(report.failures.includes("ACCEPTED_CANDIDATES_BELOW_5"));
});
