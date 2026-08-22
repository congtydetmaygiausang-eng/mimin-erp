import assert from "node:assert/strict";
import test from "node:test";
import { buildDr2ResearchGraphAudit, dr2ToolCall, readDr2Audit } from "./dr2-research-graph";

test("DR2 measures research branches without changing executed queries", () => {
  const queries = [
    "công ty vải cotton tại Hóc Môn",
    "công ty vải cotton Hóc Môn site:trangvangvietnam.com",
    "vải cotton Hóc Môn mã số thuế",
    "vải cotton Hóc Môn hotline liên hệ",
  ] as const;
  const before = JSON.stringify(queries);
  const audit = buildDr2ResearchGraphAudit({
    executedQueries: queries,
    sourceTypeBreakdown: { SEARCH: 10, OFFICIAL: 2, REGISTRY: 1, MAP: 1, OTHER: 3 },
    candidateCount: 6,
    insideRadius: 2,
    contactCompleteCount: 4,
  });
  assert.equal(JSON.stringify(queries), before);
  assert.equal(audit.queryCount, 4);
  assert.equal(audit.distinctQueryCount, 4);
  assert.equal(audit.nodes.find((node) => node.node === "REGISTRY")?.status, "COVERED");
  assert.equal(readDr2Audit([dr2ToolCall(audit)])?.coveragePercent, audit.coveragePercent);
});

test("DR2 exposes missing verification branches instead of inventing coverage", () => {
  const audit = buildDr2ResearchGraphAudit({
    executedQueries: ["công ty vải cotton tại Hóc Môn", "công ty vải cotton tại Hóc Môn"],
    sourceTypeBreakdown: { SEARCH: 8 },
    candidateCount: 3,
    insideRadius: 0,
    contactCompleteCount: 0,
  });
  assert.equal(audit.duplicateQueryRatePercent, 50);
  assert.ok(audit.missingNodes.includes("REGISTRY"));
  assert.ok(audit.missingNodes.includes("OFFICIAL"));
});
