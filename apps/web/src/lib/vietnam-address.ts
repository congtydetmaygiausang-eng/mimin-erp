export interface StandardizedAddress {
  currentAddress: string;
  legacyAddress?: string;
  standard?: "HCM_POST_MERGER_2025";
}

const HOC_MON_2025_COMMUNES = [
  { former: "Thới Tam Thôn", current: "Đông Thạnh" },
  { former: "Nhị Bình", current: "Đông Thạnh" },
  { former: "Đông Thạnh", current: "Đông Thạnh" },
  { former: "Tân Hiệp", current: "Hóc Môn" },
  { former: "Tân Xuân", current: "Hóc Môn" },
  { former: "Thị trấn Hóc Môn", current: "Hóc Môn" },
  { former: "Tân Thới Nhì", current: "Xuân Thới Sơn" },
  { former: "Xuân Thới Đông", current: "Xuân Thới Sơn" },
  { former: "Xuân Thới Sơn", current: "Xuân Thới Sơn" },
  { former: "Xuân Thới Thượng", current: "Bà Điểm" },
  { former: "Trung Chánh", current: "Bà Điểm" },
  { former: "Bà Điểm", current: "Bà Điểm" },
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Chỉ giữ phần địa chỉ bưu chính, loại mô tả bài viết và thông tin liên hệ nối phía sau. */
export function cleanVietnamPostalAddress(value: string): string {
  const compact = value
    .replace(/https?:\/\/\S+|www\.\S+/gi, " ")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, " ")
    .replace(/^[\s,;:-]*(?:địa chỉ(?: thuế)?|trụ sở(?: chính)?|văn phòng|xưởng)\s*[:#-]?\s*/i, "")
    .replace(/^[\s,;:-]*(?:tại|tọa lạc tại)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!compact) return "";

  const stopAtNarrative = compact.replace(
    /(?:[.;]\s*|\s+)(?:là một trong|tình trạng|trạng thái|ngày (?:cập nhật|hoạt động)|người đại diện|ngành nghề|chuyên |hãy |đến với|uy tín hàng đầu|sản phẩm|dịch vụ|điện thoại|hotline|phone|email|website|facebook|zalo|mã số thuế|mst)\b[\s\S]*$/i,
    "",
  );
  const throughCountry = stopAtNarrative.match(/^([\s\S]*?\bViệt Nam\b)/i)?.[1];
  const throughCity = stopAtNarrative.match(
    /^([\s\S]*?\b(?:Thành phố Hồ Chí Minh|TP\.?\s*Hồ Chí Minh|TP\.?\s*HCM|TPHCM|Hồ Chí Minh|Hà Nội|Đà Nẵng|Cần Thơ|Hải Phòng)\b)/i,
  )?.[1];
  return (throughCountry ?? throughCity ?? stopAtNarrative)
    .replace(/\s*\((?:TPHCM|TP\.\s*HCM)\)\s*$/i, "")
    .replace(/^[,;:\s]+|[,;:.\s]+$/g, "")
    .trim();
}

export function standardizeVietnamAddress(value: string): StandardizedAddress {
  const legacyAddress = cleanVietnamPostalAddress(value).replace(/\s+,/g, ",").trim();
  if (!legacyAddress || !/(?:hóc môn|thành phố hồ chí minh|tp\.?\s*hcm)/i.test(legacyAddress)) return { currentAddress: legacyAddress };
  const mapping = HOC_MON_2025_COMMUNES.find(({ former }) => new RegExp(`\\b${escapeRegExp(former)}\\b`, "i").test(legacyAddress));
  if (!mapping) return { currentAddress: legacyAddress };
  let currentAddress = legacyAddress
    .replace(new RegExp(`\\b(?:xã|thị trấn)\\s+${escapeRegExp(mapping.former)}\\b`, "i"), `Xã ${mapping.current}`)
    .replace(/\s*,?\s*huyện\s+hóc\s+môn\s*,?/i, ", ")
    .replace(/\s+/g, " ").replace(/\s+,/g, ",").replace(/,{2,}/g, ",").replace(/^[,\s]+|[,\s]+$/g, "");
  if (!/\b(?:thành phố hồ chí minh|tp\.?\s*hcm)\b/i.test(currentAddress)) currentAddress = `${currentAddress}, Thành phố Hồ Chí Minh`;
  const changed = currentAddress.toLocaleLowerCase("vi").normalize("NFC") !== legacyAddress.toLocaleLowerCase("vi").normalize("NFC");
  return changed ? { currentAddress, legacyAddress, standard: "HCM_POST_MERGER_2025" } : { currentAddress };
}
