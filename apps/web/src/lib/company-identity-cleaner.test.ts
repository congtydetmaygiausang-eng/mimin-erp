import assert from "node:assert/strict";
import test from "node:test";
import { cleanCompanyLegalName, isCompanyIdentityName } from "./company-identity-cleaner";

test("keeps legal and recognizable business names", () => {
  assert.equal(cleanCompanyLegalName("CÔNG TY TNHH VẢI MỘC SÀI GÒN"), "CÔNG TY TNHH VẢI MỘC SÀI GÒN");
  assert.equal(cleanCompanyLegalName("Xưởng Nhuộm Vải - VieTextile"), "Xưởng Nhuộm Vải - VieTextile");
  assert.equal(isCompanyIdentityName("Cửa hàng Vải Vy Hương"), true);
});

test("rejects SEO article and directory titles as company identities", () => {
  const articleTitles = [
    "Xưởng dệt vải thun ở đâu tại TP.HCM? Chợ Tân Bình, Phú Thọ Hòa bán loại vải thun nào?",
    "Công ty in vải cotton ở tại Huyện Hóc Môn, TP. Hồ Chí Minh",
    "Xưởng May Áo Thun Nam Tại Hóc Môn – Sản Xuất & Phân Phối Sỉ Toàn Quốc",
    "công ty vải - danh bạ công ty vải",
  ];
  for (const title of articleTitles) assert.equal(cleanCompanyLegalName(title), "", title);
});
