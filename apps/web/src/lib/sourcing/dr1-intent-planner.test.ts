import assert from "node:assert/strict";
import test from "node:test";
import { auditDr1Execution, buildDr1ShadowPlan, dr1ToolCall, readDr1Audit } from "./dr1-intent-planner";

test("DR1 captures intent and explicit requested fields without rewriting input", () => {
  const plan = buildDr1ShadowPlan({
    query: "vải cotton",
    rawQueryText: "Tìm nhà cung cấp vải cotton có số điện thoại, website và mã số thuế",
    location: "Huyện Hóc Môn, Thành phố Hồ Chí Minh",
    role: "MATERIAL_SUPPLIER",
    radiusKm: 10,
    locationMode: "PREFER",
  });
  assert.equal(plan.readiness, "READY");
  assert.equal(plan.query, "vải cotton");
  assert.deepEqual(plan.requestedFields, ["CAPABILITY", "PHONE", "WEBSITE", "TAX_CODE"]);
});

test("DR1 marks incomplete contracts and audits execution in shadow mode", () => {
  const plan = buildDr1ShadowPlan({ query: "", location: "", role: "bad", radiusKm: 10, locationMode: "STRICT" });
  const audit = auditDr1Execution({ plan, executedQueries: [], candidateCount: 0 });
  assert.equal(plan.readiness, "NEEDS_INPUT");
  assert.equal(audit.contractAligned, false);
  assert.equal(readDr1Audit([dr1ToolCall(audit)])?.plan.locationMode, "STRICT");
});
