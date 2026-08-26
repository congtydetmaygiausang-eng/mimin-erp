import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAgentCompanyCandidates, type Gate4CompanyCandidate } from "./gate4-agent-company-contract";

function candidate(overrides: Partial<Gate4CompanyCandidate> = {}): Gate4CompanyCandidate {
  return {
    legalName: "CÔNG TY TNHH DỆT MAY GIÀU SANG",
    address: "",
    province: "TP.HCM",
    district: "Hóc Môn",
    phone: "",
    website: "",
    latitude: null,
    longitude: null,
    capabilities: ["sản xuất vải cotton"],
    sourceUrl: "https://example.com/gioi-thieu",
    sourceTitle: "CÔNG TY TNHH DỆT MAY GIÀU SANG",
    confidence: 70,
    ...overrides,
  };
}

test("rejects article and list titles instead of presenting them as company names", () => {
  const result = normalizeAgentCompanyCandidates([
    candidate({
      legalName: "Xưởng dệt vải thun ở đâu tại TP.HCM? Chợ Tân Bình bán loại nào?",
      sourceTitle: "Xưởng dệt vải thun ở đâu tại TP.HCM?",
    }),
  ]);

  assert.equal(result.candidates.length, 0);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.rejected[0].reason, "INVALID_COMPANY_IDENTITY");
});

test("merges Jina evidence into the matching company contact fields", () => {
  const sourceUrl = "https://detmaygiausang.vn/gioi-thieu";
  const result = normalizeAgentCompanyCandidates([
    candidate({
      sourceUrl,
      fieldEvidence: [
        { fieldName: "PHONE", fieldValue: "0903 111 222", sourceUrl, sourceExcerpt: "Hotline: 0903 111 222", confidence: 92 },
        { fieldName: "REGISTERED_ADDRESS", fieldValue: "12 Nguyễn Văn Bứa, Hóc Môn, TP.HCM", sourceUrl, sourceExcerpt: "Địa chỉ: 12 Nguyễn Văn Bứa, Hóc Môn, TP.HCM", confidence: 90 },
        { fieldName: "EMAIL", fieldValue: "sales@detmaygiausang.vn", sourceUrl, sourceExcerpt: "Email: sales@detmaygiausang.vn", confidence: 88 },
        { fieldName: "TAX_CODE", fieldValue: "0318507560", sourceUrl, sourceExcerpt: "Mã số thuế: 0318507560", confidence: 95 },
      ],
    }),
  ]);

  assert.equal(result.candidates[0].phone, "0903 111 222");
  assert.equal(result.candidates[0].address, "12 Nguyễn Văn Bứa, Hóc Môn, TP.HCM");
  assert.equal(result.candidates[0].email, "sales@detmaygiausang.vn");
  assert.equal(result.candidates[0].taxCode, "0318507560");
});

test("deduplicates tracking URLs and keeps the richer evidence-backed profile", () => {
  const sparse = candidate({ sourceUrl: "https://detmaygiausang.vn/gioi-thieu?utm_source=brave" });
  const rich = candidate({
    sourceUrl: "https://detmaygiausang.vn/gioi-thieu?fbclid=abc",
    phone: "0903111222",
    address: "12 Nguyễn Văn Bứa, Hóc Môn, TP.HCM",
    sources: [
      { url: "https://detmaygiausang.vn/gioi-thieu", title: "Giới thiệu", sourceType: "OFFICIAL" },
      { url: "https://masothue.com/0318507560", title: "Mã số thuế", sourceType: "REGISTRY" },
    ],
  });

  const result = normalizeAgentCompanyCandidates([sparse, rich]);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].phone, "0903111222");
  assert.equal(result.candidates[0].sources?.length, 2);
});

test("does not merge different companies merely because they share a directory domain", () => {
  const result = normalizeAgentCompanyCandidates([
    candidate({ legalName: "CÔNG TY TNHH VẢI A", sourceUrl: "https://yellowpages.vn/a", taxCode: "0311111111" }),
    candidate({ legalName: "CÔNG TY TNHH VẢI B", sourceUrl: "https://yellowpages.vn/b", taxCode: "0322222222" }),
  ]);

  assert.equal(result.candidates.length, 2);
});

test("never overwrites an existing contact with evidence from an unrelated source", () => {
  const result = normalizeAgentCompanyCandidates([
    candidate({
      phone: "0903111222",
      fieldEvidence: [
        {
          fieldName: "PHONE",
          fieldValue: "0988777666",
          sourceUrl: "https://unrelated-company.vn/contact",
          sourceExcerpt: "Hotline: 0988777666",
          confidence: 99,
        },
      ],
      sources: [{ url: "https://detmaygiausang.vn/gioi-thieu", title: "Giới thiệu", sourceType: "OFFICIAL" }],
    }),
  ]);

  assert.equal(result.candidates[0].phone, "0903111222");
});
