import assert from "node:assert/strict";
import test from "node:test";
import { buildDr0OperationalBaseline, dr0ToolCall, readDr0Baseline } from "./dr0-benchmark";

test("DR0 measures completeness and duplicates without mutating candidates", () => {
  const candidates = [
    { legalName: "Công ty A", address: "Quận 5", phone: "0901234567", website: "https://a.vn", taxCode: "0311111111" },
    { legalName: "Công ty A", address: "Quận 5", phone: "0901234567", website: "https://www.a.vn/gioi-thieu", taxCode: "0311111111" },
    { legalName: "Công ty B", address: "Hóc Môn", email: "info@b.vn" },
  ] as const;
  const before = JSON.stringify(candidates);
  const snapshot = buildDr0OperationalBaseline({
    startedAtMs: 1_000,
    completedAtMs: 2_500,
    diagnostics: {
      collectedSources: 12,
      exactCandidates: 2,
      relatedCandidates: 1,
      rejectedNoiseCandidates: 4,
      locationQuality: { coordinateCoveragePercent: 67 },
    },
    candidates,
  });

  assert.equal(JSON.stringify(candidates), before);
  assert.equal(snapshot.durationMs, 1_500);
  assert.equal(snapshot.candidateCount, 3);
  assert.equal(snapshot.completenessPercent.phone, 67);
  assert.equal(snapshot.completenessPercent.email, 33);
  assert.equal(snapshot.duplicateRatePercent, 33);
  assert.equal(readDr0Baseline([dr0ToolCall(snapshot)])?.sourceCount, 12);
});

test("DR0 reader safely ignores unrelated history tool calls", () => {
  assert.equal(readDr0Baseline(null), null);
  assert.equal(readDr0Baseline([{ type: "OTHER" }]), null);
});
