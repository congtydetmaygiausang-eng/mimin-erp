import assert from "node:assert/strict";
import test from "node:test";
import { buildDr8QualityDriftAudit, dr8ToolCall, readDr8Audit, type Dr8Input } from "./dr8-quality-drift";

const input: Dr8Input = {
  dr0: {
    sourceCount: 100,
    candidateCount: 20,
    coordinateCoveragePercent: 80,
    completenessPercent: { legalName: 100, address: 90, phone: 80, email: 60, website: 70, taxCode: 50 },
  },
  dr2: { coveragePercent: 80 },
  dr3: { providerSuccessPercent: 90 },
  dr4: { primaryFieldCitationPercent: 80 },
  dr5: { verificationCoveragePercent: 80 },
  dr6: { readyPercent: 70 },
  dr7: { readinessScore: 75 },
};

test("DR8 captures a fingerprint but does not invent drift without baseline", () => {
  const before = JSON.stringify(input);
  const audit = buildDr8QualityDriftAudit(input);
  assert.equal(JSON.stringify(input), before);
  assert.equal(audit.status, "BASELINE_REQUIRED");
  assert.equal(audit.current.candidateCount, 20);
  assert.equal(readDr8Audit([dr8ToolCall(audit)])?.status, "BASELINE_REQUIRED");
});

test("DR8 reports stable metrics against an equivalent approved baseline", () => {
  const first = buildDr8QualityDriftAudit(input);
  const audit = buildDr8QualityDriftAudit({ ...input, baseline: first.current });
  assert.equal(audit.status, "STABLE");
  assert.equal(audit.degradedMetricCount, 0);
});

test("DR8 detects multi-metric severe degradation", () => {
  const reference = buildDr8QualityDriftAudit(input).current;
  const audit = buildDr8QualityDriftAudit({
    ...input,
    dr0: { ...input.dr0, sourceCount: 50, candidateCount: 10 },
    dr5: { verificationCoveragePercent: 45 },
    baseline: reference,
  });
  assert.equal(audit.status, "DRIFT");
  assert.ok(audit.degradedMetricCount >= 3);
});
