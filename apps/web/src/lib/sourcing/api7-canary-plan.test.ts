import assert from "node:assert/strict";
import test from "node:test";
import type { Api6RolloutGateAudit } from "./api6-rollout-gate";
import { buildApi7CanaryPlanAudit } from "./api7-canary-plan";

const gate = (eligibleForCanary: boolean): Api6RolloutGateAudit => ({
  schemaVersion: "API6.1", shadowOnly: true,
  decision: eligibleForCanary ? "READY_FOR_CANARY" : "HOLD_INSUFFICIENT_EVIDENCE",
  eligibleForCanary,
  recommendedCanaryPercent: eligibleForCanary ? 1 : 0,
  observedRuns: eligibleForCanary ? 20 : 1,
  requiredRuns: 20,
  checks: [], blockers: [],
});

test("API7 never enables execution while operating in shadow mode", () => {
  const audit = buildApi7CanaryPlanAudit({ api6: gate(true), subjectId: "run-001" });
  assert.equal(audit.executionEnabled, false);
  assert.equal(audit.shadowOnly, true);
  assert.equal(audit.allocationPercent, 1);
});

test("API7 assigns the same subject to a stable simulated bucket", () => {
  const first = buildApi7CanaryPlanAudit({ api6: gate(true), subjectId: "organization:mimin:user:123" });
  const second = buildApi7CanaryPlanAudit({ api6: gate(true), subjectId: "organization:mimin:user:123" });
  assert.equal(first.bucket, second.bucket);
  assert.equal(first.wouldAssignVariant, second.wouldAssignVariant);
});

test("API7 keeps all traffic in control when API6 is not ready", () => {
  const audit = buildApi7CanaryPlanAudit({ api6: gate(false), subjectId: "any-subject" });
  assert.equal(audit.allocationPercent, 0);
  assert.equal(audit.wouldAssignVariant, "CONTROL");
  assert.equal(audit.guardrails.length, 5);
});
