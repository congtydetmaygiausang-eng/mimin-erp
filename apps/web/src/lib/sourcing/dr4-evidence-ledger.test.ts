import assert from "node:assert/strict";
import test from "node:test";
import { buildDr4EvidenceLedgerAudit, dr4ToolCall, readDr4Audit } from "./dr4-evidence-ledger";

const evidence = (fieldName: string, fieldValue: string, sourceUrl: string) => ({ fieldName, fieldValue, sourceUrl, sourceExcerpt: `${fieldName}: ${fieldValue}`, confidence: 80 });

test("DR4 audits citations and source diversity without mutating candidates", () => {
  const candidates = [{
    legalName: "Công ty A",
    address: "Hóc Môn",
    phone: "0901234567",
    capabilities: ["vải cotton"],
    fieldEvidence: [
      evidence("LEGAL_NAME", "Công ty A", "https://a.vn/gioi-thieu"),
      evidence("PHONE", "0901234567", "https://registry.vn/a"),
      evidence("REGISTERED_ADDRESS", "Hóc Môn", "https://registry.vn/a"),
      evidence("CAPABILITY", "vải cotton", "https://a.vn/san-pham"),
    ],
  }] as const;
  const before = JSON.stringify(candidates);
  const audit = buildDr4EvidenceLedgerAudit(candidates);
  assert.equal(JSON.stringify(candidates), before);
  assert.equal(audit.citedCandidatePercent, 100);
  assert.equal(audit.multiSourceCandidatePercent, 100);
  assert.equal(audit.primaryFieldCitationPercent, 100);
  assert.equal(audit.distinctSourceDomains, 2);
  assert.equal(readDr4Audit([dr4ToolCall(audit)])?.evidenceEntryCount, 4);
});

test("DR4 reports orphan evidence and conflicts instead of trusting them", () => {
  const audit = buildDr4EvidenceLedgerAudit([{
    legalName: "Công ty B",
    phone: "0900000000",
    fieldEvidence: [{ fieldName: "PHONE", fieldValue: "0900000000", sourceUrl: "", sourceExcerpt: "" }],
    fieldConfidence: [{ status: "CONFLICT" }],
  }]);
  assert.equal(audit.orphanEvidenceCount, 1);
  assert.equal(audit.conflictCandidateCount, 1);
  assert.equal(audit.citedCandidatePercent, 0);
  assert.equal(audit.grade, "WEAK");
});
