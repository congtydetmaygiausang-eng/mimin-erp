import assert from "node:assert/strict";
import test from "node:test";
import {
  buildB2BQueryVariants,
  evaluateB2BCandidate,
  selectEvidenceBackedValue,
  splitCandidatesByLocation,
} from "./b2b-company-policy";

test("rejects retail listings without production or wholesale evidence", () => {
  const decision = evaluateB2BCandidate({
    legalName: "Cửa hàng vải cotton giá rẻ",
    entityType: "HOUSEHOLD_BUSINESS",
    evidenceText: "cửa hàng bán lẻ vải cotton theo mét cho người tiêu dùng",
    capabilityEvidence: [],
    taxCode: "0312345678",
  });

  assert.equal(decision.accepted, false);
  assert.equal(decision.reasonCodes.includes("RETAIL_ONLY"), true);
});

test("accepts a formal supplier only when direct B2B capability evidence exists", () => {
  const decision = evaluateB2BCandidate({
    legalName: "Công ty TNHH Dệt Vải Minh Tâm",
    entityType: "COMPANY",
    evidenceText: "nhà máy dệt và nhuộm vải cotton, nhận đơn hàng số lượng lớn",
    capabilityEvidence: ["nhà máy dệt vải cotton, cung cấp sỉ cho xưởng may"],
    taxCode: "0312345678",
  });

  assert.equal(decision.accepted, true);
  assert.equal(decision.segment, "B2B_PRODUCER_SUPPLIER");
});

test("builds only B2B query variants and excludes retail intent", () => {
  const queries = buildB2BQueryVariants("vải cotton", "Huyện Hóc Môn, TP.HCM", "MATERIAL_SUPPLIER");
  assert.ok(queries.length >= 4);
  assert.ok(queries.every((query) => !/cửa hàng|bán lẻ|giá rẻ|theo mét/i.test(query)));
  assert.ok(queries.some((query) => /nhà sản xuất|nhà cung cấp|công ty dệt/i.test(query)));
});

test("selects a field only from evidence attached to the same company", () => {
  const selected = selectEvidenceBackedValue("PHONE", [
    { value: "0909123456", sourceUrl: "https://directory.example/a", sourceExcerpt: "Công ty B: 0909123456", confidence: 80, identityMatched: false },
    { value: "02838153962", sourceUrl: "https://company.example/contact", sourceExcerpt: "Công ty A - Hotline 02838153962", confidence: 75, identityMatched: true },
  ]);

  assert.equal(selected?.value, "02838153962");
  assert.equal(selected?.sourceUrl, "https://company.example/contact");
});

test("keeps unknown and outside locations out of the eligible radius group", () => {
  const split = splitCandidatesByLocation([
    { id: "inside", locationStatus: "INSIDE" },
    { id: "unknown", locationStatus: "UNKNOWN" },
    { id: "outside", locationStatus: "OUTSIDE" },
  ]);

  assert.deepEqual(split.eligible.map((item) => item.id), ["inside"]);
  assert.deepEqual(split.needsLocationVerification.map((item) => item.id), ["unknown"]);
  assert.deepEqual(split.outside.map((item) => item.id), ["outside"]);
});
