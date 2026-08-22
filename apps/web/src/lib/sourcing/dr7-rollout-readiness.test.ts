import assert from "node:assert/strict";
import test from "node:test";
import { buildDr7RolloutReadinessAudit, dr7ToolCall, readDr7Audit, type Dr7Input } from "./dr7-rollout-readiness";

const healthyInput: Dr7Input = {
  dr0: { candidateCount: 10, duplicateRatePercent: 0, completenessPercent: { legalName: 100, address: 90, phone: 80 } },
  dr1: { contractAligned: true },
  dr2: { coveragePercent: 90 },
  dr3: { providerSuccessPercent: 90, fallbackReadinessPercent: 90, unavailableRoutes: 0 },
  dr4: { citedCandidatePercent: 90, primaryFieldCitationPercent: 85, grade: "STRONG" },
  dr5: { verificationCoveragePercent: 90, criticalCoveragePercent: 90, conflictClaims: 0 },
  dr6: { candidateCount: 10, readyPercent: 90, abstainCount: 1 },
};

test("DR7 remains shadow-ready until a golden dataset is validated", () => {
  const before = JSON.stringify(healthyInput);
  const audit = buildDr7RolloutReadinessAudit(healthyInput);
  assert.equal(JSON.stringify(healthyInput), before);
  assert.equal(audit.readiness, "SHADOW_READY");
  assert.equal(audit.goldenDatasetValidated, false);
  assert.equal(readDr7Audit([dr7ToolCall(audit)])?.readiness, "SHADOW_READY");
});

test("DR7 permits canary readiness only with all gates and golden data", () => {
  const audit = buildDr7RolloutReadinessAudit({ ...healthyInput, goldenDatasetValidated: true });
  assert.equal(audit.readiness, "CANARY_READY");
  assert.equal(audit.criticalBlockers.length, 0);
});

test("DR7 blocks empty or conflicting outputs", () => {
  const audit = buildDr7RolloutReadinessAudit({
    ...healthyInput,
    dr0: { ...healthyInput.dr0, candidateCount: 0 },
    dr5: { ...healthyInput.dr5, conflictClaims: 2 },
    dr6: { candidateCount: 0, readyPercent: 0, abstainCount: 0 },
  });
  assert.equal(audit.readiness, "BLOCKED");
  assert.ok(audit.criticalBlockers.includes("Không có hồ sơ đầu ra"));
  assert.ok(audit.criticalBlockers.includes("Còn claim mâu thuẫn"));
});
