import assert from "node:assert/strict";
import test from "node:test";
import { passesBusinessIdentityGate } from "./business-identity-gate";

test("accepts a formal company with one identity anchor", () => {
  assert.equal(passesBusinessIdentityGate({ legalName: "Công ty TNHH Dệt Tân Bình", identityEvidenceCount: 1, hasTaxCode: false }), true);
});

test("accepts a workshop or store only with two identity anchors", () => {
  assert.equal(passesBusinessIdentityGate({ legalName: "Xưởng dệt Minh Phát", identityEvidenceCount: 2, hasTaxCode: false }), true);
  assert.equal(passesBusinessIdentityGate({ legalName: "Cửa hàng vải An Phú", identityEvidenceCount: 1, hasTaxCode: false }), false);
});

test("rejects generic articles even when snippets contain contacts", () => {
  assert.equal(passesBusinessIdentityGate({ legalName: "Danh sách vải cotton tốt nhất", identityEvidenceCount: 4, hasTaxCode: true }), false);
});

