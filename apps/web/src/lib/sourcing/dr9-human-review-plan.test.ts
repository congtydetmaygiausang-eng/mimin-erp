import assert from "node:assert/strict";
import test from "node:test";
import { buildDr9HumanReviewPlanAudit, dr9ToolCall, readDr9Audit } from "./dr9-human-review-plan";

test("DR9 prioritizes abstain and review samples without mutating decisions", () => {
  const decisions = [
    { candidateIndex: 0, decision: "READY" as const, reasons: [] },
    { candidateIndex: 1, decision: "READY" as const, reasons: [] },
    { candidateIndex: 2, decision: "REVIEW" as const, reasons: ["Chỉ 1 nguồn chứng cứ độc lập"] },
    { candidateIndex: 3, decision: "ABSTAIN" as const, reasons: ["Có claim hoặc thực thể mâu thuẫn"] },
    { candidateIndex: 4, decision: "ABSTAIN" as const, reasons: ["Thiếu bộ nhận dạng tối thiểu"] },
  ];
  const before = JSON.stringify(decisions);
  const audit = buildDr9HumanReviewPlanAudit({ decisions, conflictClaimCount: 1, missingCriticalEvidence: 1, goldenDatasetValidated: false, maxSampleSize: 4 });
  assert.equal(JSON.stringify(decisions), before);
  assert.equal(audit.plannedSampleSize, 4);
  assert.equal(audit.quotas.find((quota) => quota.bucket === "ABSTAIN")?.sampleCount, 2);
  assert.equal(audit.goldenSetEligible, false);
  assert.equal(readDr9Audit([dr9ToolCall(audit)])?.plannedSampleSize, 4);
});

test("DR9 only marks a clean approved sample eligible for golden data", () => {
  const audit = buildDr9HumanReviewPlanAudit({
    decisions: [{ candidateIndex: 0, decision: "READY", reasons: [] }],
    conflictClaimCount: 0,
    missingCriticalEvidence: 0,
    goldenDatasetValidated: true,
  });
  assert.equal(audit.goldenSetEligible, true);
  assert.equal(audit.blockers.length, 0);
});

test("DR9 handles an empty result set explicitly", () => {
  const audit = buildDr9HumanReviewPlanAudit({ decisions: [], conflictClaimCount: 0, missingCriticalEvidence: 0, goldenDatasetValidated: false });
  assert.equal(audit.targetSampleSize, 0);
  assert.equal(audit.plannedSampleSize, 0);
  assert.ok(audit.blockers.includes("Không có hồ sơ để lấy mẫu"));
});
