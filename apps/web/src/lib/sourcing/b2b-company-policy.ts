export type B2BEntityType = "HOUSEHOLD_BUSINESS" | "COMPANY" | "INDIVIDUAL_SELLER" | "UNKNOWN";
export type B2BSegment = "B2B_PRODUCER_SUPPLIER" | "REVIEW" | "RETAIL";

export interface B2BCandidateInput {
  legalName: string;
  entityType?: B2BEntityType;
  evidenceText: string;
  capabilityEvidence: string[];
  taxCode?: string;
}

export interface B2BDecision {
  accepted: boolean;
  segment: B2BSegment;
  reasonCodes: string[];
  score: number;
}

export interface EvidenceValue {
  value: string;
  sourceUrl: string;
  sourceExcerpt: string;
  confidence: number;
  identityMatched: boolean;
}

const RETAIL_ONLY_PATTERN = /\b(?:bán\s*lẻ|cửa\s*hàng|shop|theo\s*mét|mua\s*lẻ|người\s*tiêu\s*dùng|giá\s*rẻ|flash\s*sale)\b/i;
const B2B_CAPABILITY_PATTERN = /\b(?:nhà\s*máy|xưởng|sản\s*xuất|gia\s*công|dệt|nhuộm|hoàn\s*thiện|cung\s*cấp\s*sỉ|bán\s*buôn|phân\s*phối|đơn\s*hàng\s*số\s*lượng|năng\s*lực\s*sản\s*xuất|manufacturer|factory|wholesale|supplier)\b/i;
const FORMAL_NAME_PATTERN = /\b(?:công\s*ty|tnhh|cổ\s*phần|doanh\s*nghiệp|dntn|nhà\s*máy|xưởng)\b/i;

export function evaluateB2BCandidate(input: B2BCandidateInput): B2BDecision {
  const directEvidence = input.capabilityEvidence.filter((item) => B2B_CAPABILITY_PATTERN.test(item));
  const combined = `${input.legalName} ${input.evidenceText} ${directEvidence.join(" ")}`;
  const hasB2BCapability = directEvidence.length > 0 && B2B_CAPABILITY_PATTERN.test(combined);
  const formalIdentity = input.entityType === "COMPANY" || FORMAL_NAME_PATTERN.test(input.legalName) || Boolean(input.taxCode);
  const retailOnly = RETAIL_ONLY_PATTERN.test(combined) && !hasB2BCapability;
  const reasonCodes = [
    retailOnly ? "RETAIL_ONLY" : "",
    !hasB2BCapability ? "NO_DIRECT_B2B_CAPABILITY_EVIDENCE" : "",
    !formalIdentity ? "NO_FORMAL_BUSINESS_IDENTITY" : "",
    input.entityType === "INDIVIDUAL_SELLER" ? "INDIVIDUAL_SELLER" : "",
  ].filter(Boolean);
  const accepted = hasB2BCapability && formalIdentity && input.entityType !== "INDIVIDUAL_SELLER";
  const score = Math.max(0, Math.min(100, (hasB2BCapability ? 55 : 0) + (formalIdentity ? 30 : 0) + (input.taxCode ? 15 : 0) - (retailOnly ? 50 : 0)));
  return { accepted, segment: accepted ? "B2B_PRODUCER_SUPPLIER" : retailOnly ? "RETAIL" : "REVIEW", reasonCodes, score };
}

export function buildB2BQueryVariants(query: string, location: string, role: string): string[] {
  const roleVariants = role === "SATELLITE_PROCESSOR"
    ? ["xưởng gia công", "công ty gia công", "nhà máy may"]
    : role === "PACKAGING_FINISHER"
      ? ["công ty hoàn thiện", "xưởng ủi đóng gói", "nhà cung cấp đóng gói"]
      : role === "CUSTOMER"
        ? ["công ty đặt may", "thương hiệu đặt hàng sỉ", "doanh nghiệp thời trang"]
        : ["nhà sản xuất", "nhà cung cấp sỉ", "công ty dệt", "nhà máy"];
  return Array.from(new Set(roleVariants.map((prefix) => `${prefix} ${query} ${location}`.replace(/\s+/g, " ").trim())));
}

export function selectEvidenceBackedValue(fieldName: string, evidence: EvidenceValue[]): EvidenceValue | null {
  const minimumConfidence = fieldName === "PHONE" || fieldName === "EMAIL" || fieldName === "TAX_CODE" ? 55 : 50;
  return [...evidence]
    .filter((item) => item.identityMatched && item.value.trim() && item.sourceUrl && item.sourceExcerpt.trim().length >= 8 && item.confidence >= minimumConfidence)
    .sort((left, right) => right.confidence - left.confidence)[0] ?? null;
}

export function splitCandidatesByLocation<T extends { locationStatus?: "INSIDE" | "OUTSIDE" | "UNKNOWN" | "CONFLICT" }>(candidates: T[]): {
  eligible: T[];
  needsLocationVerification: T[];
  outside: T[];
  conflicts: T[];
} {
  return {
    eligible: candidates.filter((item) => item.locationStatus === "INSIDE"),
    needsLocationVerification: candidates.filter((item) => !item.locationStatus || item.locationStatus === "UNKNOWN"),
    outside: candidates.filter((item) => item.locationStatus === "OUTSIDE"),
    conflicts: candidates.filter((item) => item.locationStatus === "CONFLICT"),
  };
}
