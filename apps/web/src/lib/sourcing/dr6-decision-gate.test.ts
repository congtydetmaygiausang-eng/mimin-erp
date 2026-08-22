import assert from "node:assert/strict";
import test from "node:test";
import { buildDr6DecisionGateAudit, dr6ToolCall, readDr6Audit } from "./dr6-decision-gate";

test("DR6 marks sufficiently evidenced candidates READY without mutation", () => {
  const candidates = [{
    legalName: "Công ty A",
    taxCode: "0311111111",
    address: "Hóc Môn",
    phone: "0901234567",
    capabilities: ["vải cotton"],
    fieldConfidence: [
      { fieldName: "LEGAL_NAME", status: "VERIFIED" as const },
      { fieldName: "TAX_CODE", status: "VERIFIED" as const },
      { fieldName: "PHONE", status: "PARTIAL" as const },
    ],
    fieldEvidence: [
      { fieldName: "LEGAL_NAME", sourceUrl: "https://registry.example/a", sourceExcerpt: "Công ty A" },
      { fieldName: "TAX_CODE", sourceUrl: "https://official.example/a", sourceExcerpt: "0311111111" },
    ],
  }] as const;
  const before = JSON.stringify(candidates);
  const audit = buildDr6DecisionGateAudit(candidates);
  assert.equal(JSON.stringify(candidates), before);
  assert.equal(audit.readyCount, 1);
  assert.equal(audit.reviewCount, 0);
  assert.equal(audit.abstainCount, 0);
  assert.equal(readDr6Audit([dr6ToolCall(audit)])?.readyCount, 1);
});

test("DR6 sends thin evidence to REVIEW and conflicts to ABSTAIN", () => {
  const audit = buildDr6DecisionGateAudit([
    {
      legalName: "Công ty B",
      address: "Tân Bình",
      capabilities: ["dệt vải"],
      fieldConfidence: [{ fieldName: "LEGAL_NAME", status: "VERIFIED" }],
      fieldEvidence: [{ fieldName: "LEGAL_NAME", sourceUrl: "https://one.example/b", sourceExcerpt: "Công ty B" }],
    },
    {
      legalName: "Công ty C",
      taxCode: "0312222222",
      capabilities: ["may"],
      fieldConfidence: [{ fieldName: "TAX_CODE", status: "CONFLICT" }],
      entityResolution: { conflicts: ["TAX_CODE"] },
    },
  ]);
  assert.equal(audit.readyCount, 0);
  assert.equal(audit.reviewCount, 1);
  assert.equal(audit.abstainCount, 1);
  assert.equal(audit.safeHandlingPercent, 100);
});
