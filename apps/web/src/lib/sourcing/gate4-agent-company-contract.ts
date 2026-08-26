import { cleanCompanyLegalName, isCompanyIdentityName } from "../company-identity-cleaner";

export type Gate4EvidenceField =
  | "LEGAL_NAME" | "TRADE_NAME" | "SHORT_NAME" | "TAX_CODE"
  | "REGISTERED_ADDRESS" | "FACTORY_ADDRESS" | "OFFICE_ADDRESS"
  | "PHONE" | "ZALO" | "EMAIL" | "WEBSITE" | "FACEBOOK"
  | "LEGAL_REPRESENTATIVE" | "BUSINESS_LINE" | "CAPABILITY"
  | "COMPANY_INTRODUCTION" | "FOUNDED_YEAR" | "OPERATING_STATUS";

export interface Gate4FieldEvidence {
  fieldName: Gate4EvidenceField;
  fieldValue: string;
  sourceUrl: string;
  sourceExcerpt: string;
  confidence: number;
}

export interface Gate4CandidateSource {
  url: string;
  title: string;
  sourceType?: string;
  sourceProvider?: string;
  excerpt?: string;
  rawContent?: string;
  relevanceScore?: number;
  searchQuery?: string;
}

/** Contract nhỏ nhất tại biên Search Engine -> AI Agent UI. */
export interface Gate4CompanyCandidate {
  legalName: string;
  address: string;
  province: string;
  district: string;
  phone: string;
  phones?: string[];
  email?: string;
  taxCode?: string;
  website: string;
  latitude: number | null;
  longitude: number | null;
  capabilities: string[];
  sourceUrl: string;
  sourceTitle: string;
  confidence: number;
  fieldEvidence?: Gate4FieldEvidence[];
  sources?: Gate4CandidateSource[];
  sourceCount?: number;
  verifiedFields?: string[];
  resultTier?: "EXACT" | "RELATED";
}

export interface Gate4RejectedCandidate {
  candidate: Gate4CompanyCandidate;
  reason: "INVALID_COMPANY_IDENTITY";
}

export interface Gate4PayloadMetrics {
  inputCandidates: number;
  outputCandidates: number;
  rejectedInvalidIdentity: number;
  mergedDuplicates: number;
}

const TRACKING_PARAMS = new Set([
  "fbclid", "gclid", "dclid", "msclkid", "ref", "ref_src", "srsltid",
]);

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function digits(value: string | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function canonicalAgentSourceUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of Array.from(url.searchParams.keys())) {
      if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    const query = url.searchParams.toString();
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.protocol}//${url.hostname.toLowerCase()}${path}${query ? `?${query}` : ""}`;
  } catch {
    return value.trim();
  }
}

function sourceDomain(value: string): string {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return ""; }
}

function allowedEvidenceUrls(candidate: Gate4CompanyCandidate): Set<string> {
  const urls = [candidate.sourceUrl, candidate.website, ...(candidate.sources ?? []).map((source) => source.url)]
    .filter((value): value is string => Boolean(value?.trim()));
  return new Set(urls.flatMap((url) => [canonicalAgentSourceUrl(url), sourceDomain(url)]).filter(Boolean));
}

function evidenceBelongsToCandidate(candidate: Gate4CompanyCandidate, evidence: Gate4FieldEvidence): boolean {
  const allowed = allowedEvidenceUrls(candidate);
  return allowed.has(canonicalAgentSourceUrl(evidence.sourceUrl)) || allowed.has(sourceDomain(evidence.sourceUrl));
}

function bestEvidence(candidate: Gate4CompanyCandidate, fields: Gate4EvidenceField[]): Gate4FieldEvidence | undefined {
  return [...(candidate.fieldEvidence ?? [])]
    .filter((entry) => fields.includes(entry.fieldName) && entry.fieldValue.trim() && entry.sourceExcerpt.trim().length >= 8)
    .filter((entry) => entry.confidence >= 55 && evidenceBelongsToCandidate(candidate, entry))
    .sort((left, right) => right.confidence - left.confidence)[0];
}

function applyEvidence(candidate: Gate4CompanyCandidate): Gate4CompanyCandidate {
  const phone = candidate.phone.trim() ? undefined : bestEvidence(candidate, ["PHONE", "ZALO"]);
  const address = candidate.address.trim() ? undefined : bestEvidence(candidate, ["FACTORY_ADDRESS", "REGISTERED_ADDRESS", "OFFICE_ADDRESS"]);
  const email = candidate.email?.trim() ? undefined : bestEvidence(candidate, ["EMAIL"]);
  const taxCode = candidate.taxCode?.trim() ? undefined : bestEvidence(candidate, ["TAX_CODE"]);
  const website = candidate.website.trim() ? undefined : bestEvidence(candidate, ["WEBSITE"]);
  const verifiedFields = new Set(candidate.verifiedFields ?? []);
  if (phone) verifiedFields.add("phone");
  if (address) verifiedFields.add("address");
  if (email) verifiedFields.add("email");
  if (taxCode) verifiedFields.add("taxCode");
  if (website) verifiedFields.add("website");
  return {
    ...candidate,
    phone: candidate.phone || phone?.fieldValue || "",
    phones: Array.from(new Set([...(candidate.phones ?? []), candidate.phone, phone?.fieldValue].filter((value): value is string => Boolean(value?.trim())))),
    address: candidate.address || address?.fieldValue || "",
    email: candidate.email || email?.fieldValue,
    taxCode: candidate.taxCode || taxCode?.fieldValue,
    website: candidate.website || website?.fieldValue || "",
    verifiedFields: Array.from(verifiedFields),
  };
}

function completeness(candidate: Gate4CompanyCandidate): number {
  return [candidate.address, candidate.phone, candidate.email, candidate.taxCode, candidate.website]
    .filter((value) => typeof value === "string" && value.trim()).length * 10
    + (candidate.fieldEvidence?.length ?? 0)
    + (candidate.sources?.length ?? 0)
    + candidate.confidence / 100;
}

function identityKeys(candidate: Gate4CompanyCandidate): string[] {
  const name = normalizeText(candidate.legalName);
  const address = normalizeText(candidate.address);
  const taxCode = digits(candidate.taxCode);
  const phone = digits(candidate.phone);
  return [
    taxCode.length >= 10 ? `tax:${taxCode}` : "",
    phone.length >= 9 ? `phone:${phone}` : "",
    candidate.sourceUrl ? `url:${canonicalAgentSourceUrl(candidate.sourceUrl)}` : "",
    name && address ? `name-address:${name}|${address}` : "",
  ].filter(Boolean);
}

function mergeSources(left: Gate4CandidateSource[] = [], right: Gate4CandidateSource[] = []): Gate4CandidateSource[] {
  return Array.from(new Map([...left, ...right].map((source) => [canonicalAgentSourceUrl(source.url), source])).values()).slice(0, 12);
}

function mergeEvidence(left: Gate4FieldEvidence[] = [], right: Gate4FieldEvidence[] = []): Gate4FieldEvidence[] {
  return Array.from(new Map([...left, ...right].map((entry) => [
    `${entry.fieldName}|${normalizeText(entry.fieldValue)}|${canonicalAgentSourceUrl(entry.sourceUrl)}`,
    entry,
  ])).values()).slice(0, 120);
}

function mergeCandidates(left: Gate4CompanyCandidate, right: Gate4CompanyCandidate): Gate4CompanyCandidate {
  const [base, supplement] = completeness(right) > completeness(left) ? [right, left] : [left, right];
  return applyEvidence({
    ...supplement,
    ...base,
    address: base.address || supplement.address,
    phone: base.phone || supplement.phone,
    phones: Array.from(new Set([...(base.phones ?? []), ...(supplement.phones ?? []), base.phone, supplement.phone].filter(Boolean))),
    email: base.email || supplement.email,
    taxCode: base.taxCode || supplement.taxCode,
    website: base.website || supplement.website,
    capabilities: Array.from(new Set([...base.capabilities, ...supplement.capabilities])),
    sources: mergeSources(base.sources, supplement.sources),
    fieldEvidence: mergeEvidence(base.fieldEvidence, supplement.fieldEvidence),
    sourceCount: Math.max(base.sourceCount ?? 0, supplement.sourceCount ?? 0, mergeSources(base.sources, supplement.sources).length),
    confidence: Math.max(base.confidence, supplement.confidence),
  });
}

export function normalizeAgentCompanyCandidates<T extends Gate4CompanyCandidate>(input: readonly T[]): {
  candidates: T[];
  rejected: Gate4RejectedCandidate[];
} {
  const rejected: Gate4RejectedCandidate[] = [];
  const clusters: T[] = [];
  const clusterKeys: Array<Set<string>> = [];

  for (const raw of input) {
    const legalName = cleanCompanyLegalName(raw.legalName) || cleanCompanyLegalName(raw.sourceTitle);
    if (!legalName || !isCompanyIdentityName(legalName)) {
      rejected.push({ candidate: raw, reason: "INVALID_COMPANY_IDENTITY" });
      continue;
    }
    const candidate = applyEvidence({ ...raw, legalName }) as T;
    const keys = new Set(identityKeys(candidate));
    const index = clusterKeys.findIndex((known) => Array.from(keys).some((key) => known.has(key)));
    if (index < 0) {
      clusters.push(candidate);
      clusterKeys.push(keys);
      continue;
    }
    const merged = mergeCandidates(clusters[index], candidate) as T;
    clusters[index] = merged;
    clusterKeys[index] = new Set([...clusterKeys[index], ...identityKeys(merged)]);
  }

  return { candidates: clusters, rejected };
}

/**
 * Consumer adapter dùng chung cho các giao diện AI Agent (Tổng quan và Tìm
 * nâng cao). Payload từ API được kiểm chứng lại bằng đúng Gate 4 contract trước
 * khi ghi vào state giao diện; metadata provider/diagnostics vẫn được giữ nguyên.
 */
export function normalizeAgentSearchPayload<
  T extends Gate4CompanyCandidate,
  P extends { candidates: readonly T[] },
>(payload: P): Omit<P, "candidates"> & { candidates: T[]; gate4: Gate4PayloadMetrics } {
  const normalized = normalizeAgentCompanyCandidates(payload.candidates);
  return {
    ...payload,
    candidates: normalized.candidates,
    gate4: {
      inputCandidates: payload.candidates.length,
      outputCandidates: normalized.candidates.length,
      rejectedInvalidIdentity: normalized.rejected.length,
      mergedDuplicates: Math.max(
        0,
        payload.candidates.length - normalized.rejected.length - normalized.candidates.length,
      ),
    },
  };
}
