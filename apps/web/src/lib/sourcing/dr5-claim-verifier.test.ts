import assert from "node:assert/strict";
import test from "node:test";
import { buildDr5ClaimVerifierAudit, dr5ToolCall, readDr5Audit } from "./dr5-claim-verifier";

test("DR5 measures verified and partial claims without mutating candidates", () => {
  const candidates = [{
    legalName: "Công ty A",
    taxCode: "0311111111",
    address: "Hóc Môn",
    phone: "0901234567",
    capabilities: ["vải cotton"],
    fieldConfidence: [
      { fieldName: "LEGAL_NAME", selectedValue: "Công ty A", status: "VERIFIED" as const },
      { fieldName: "TAX_CODE", selectedValue: "0311111111", status: "VERIFIED" as const },
      { fieldName: "REGISTERED_ADDRESS", selectedValue: "Hóc Môn", status: "PARTIAL" as const },
      { fieldName: "PHONE", selectedValue: "0901234567", status: "VERIFIED" as const },
      { fieldName: "CAPABILITY", selectedValue: "vải cotton", status: "VERIFIED" as const },
    ],
  }] as const;
  const before = JSON.stringify(candidates);
  const audit = buildDr5ClaimVerifierAudit(candidates);
  assert.equal(JSON.stringify(candidates), before);
  assert.equal(audit.claimCount, 5);
  assert.equal(audit.verifiedClaims, 4);
  assert.equal(audit.partialClaims, 1);
  assert.equal(audit.criticalCoveragePercent, 90);
  assert.equal(readDr5Audit([dr5ToolCall(audit)])?.claimCount, 5);
});

test("DR5 reports missing critical evidence and conflicts", () => {
  const audit = buildDr5ClaimVerifierAudit([{
    legalName: "Công ty B",
    taxCode: "0312222222",
    capabilities: ["dệt vải"],
    fieldConfidence: [
      { fieldName: "LEGAL_NAME", selectedValue: "Công ty B", status: "CONFLICT" },
    ],
  }]);
  assert.equal(audit.conflictClaims, 1);
  assert.equal(audit.missingCriticalEvidence, 2);
  assert.equal(audit.reviewRequiredCandidateCount, 1);
  assert.equal(audit.grade, "RISK");
});
