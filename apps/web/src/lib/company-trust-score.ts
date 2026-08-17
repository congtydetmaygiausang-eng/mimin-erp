import type {
  ProductionCompanyAuditEvent,
  ProductionCompanyDocument,
  ProductionCompanyDocumentExtraction,
  ProductionCompanyImage,
  ProductionCompanyProfile,
  ProductionCompanySource,
} from "@/lib/production-company-profile";

export const COMPANY_TRUST_SCORE_VERSION = "U3.1" as const;

export type CompanyTrustFactorKey = "LEGAL" | "IDENTITY" | "EVIDENCE" | "CAPABILITY" | "REPUTATION" | "HISTORY" | "FRESHNESS";

export interface CompanyTrustFactor {
  key: CompanyTrustFactorKey;
  label: string;
  score: number;
  maximum: number;
  reasons: string[];
}

export interface CompanyTrustAssessment {
  version: typeof COMPANY_TRUST_SCORE_VERSION;
  score: number;
  maximum: 100;
  coverage: number;
  label: string;
  provisional: true;
  factors: CompanyTrustFactor[];
  calculatedAt: string;
}

interface CompanyTrustInput {
  profile: ProductionCompanyProfile;
  sources: ProductionCompanySource[];
  images: ProductionCompanyImage[];
  documents: ProductionCompanyDocument[];
  extractions: ProductionCompanyDocumentExtraction[];
  auditEvents: ProductionCompanyAuditEvent[];
  now?: Date;
}

function distinctSourceDomains(sources: ProductionCompanySource[]): number {
  const domains = new Set<string>();
  for (const source of sources) {
    try { domains.add(new URL(source.sourceUrl).hostname.replace(/^www\./, "")); }
    catch { /* Nguồn sai URL không được tính là nguồn độc lập. */ }
  }
  return domains.size;
}

function factor(key: CompanyTrustFactorKey, label: string, score: number, maximum: number, reasons: string[]): CompanyTrustFactor {
  return { key, label, score: Math.max(0, Math.min(maximum, score)), maximum, reasons };
}

export function calculateCompanyTrust(input: CompanyTrustInput): CompanyTrustAssessment {
  const { profile, sources, images, documents, extractions, auditEvents } = input;
  const now = input.now ?? new Date();
  const verifiedSources = sources.filter(source => source.verificationStatus === "PARTIAL" || source.verificationStatus === "VERIFIED");
  const officialSources = verifiedSources.filter(source => source.sourceType === "OFFICIAL" || source.sourceType === "REGISTRY");
  const verifiedLegalDocument = documents.some(document => document.reviewStatus === "VERIFIED" && (document.documentType === "BUSINESS_LICENSE" || document.documentType === "TAX_REGISTRATION"));
  const acceptedOcr = extractions.some(extraction => extraction.status === "ACCEPTED");
  const approvedOperationalImage = images.some(image => image.reviewStatus === "APPROVED" && image.archivalStatus === "ARCHIVED" && ["FACTORY", "MACHINERY", "PRODUCT"].includes(image.category));
  const verifiedCapabilityDocument = documents.some(document => document.reviewStatus === "VERIFIED" && ["CERTIFICATE", "FACTORY_LICENSE"].includes(document.documentType));
  const independentDomains = distinctSourceDomains(verifiedSources);

  const legalReasons: string[] = [];
  let legalScore = 0;
  if (profile.taxCode) { legalScore += profile.verificationStatus === "VERIFIED" || verifiedLegalDocument ? 8 : 3; legalReasons.push(profile.verificationStatus === "VERIFIED" || verifiedLegalDocument ? "Mã số thuế có căn cứ xác minh" : "Có mã số thuế nhưng chưa đủ căn cứ"); }
  if (profile.verificationStatus === "VERIFIED") { legalScore += 5; legalReasons.push("Hồ sơ pháp lý đã xác minh"); }
  if (verifiedLegalDocument) { legalScore += 5; legalReasons.push("Có giấy tờ pháp lý được người dùng duyệt"); }
  if (acceptedOcr) { legalScore += 4; legalReasons.push("OCR giấy tờ đã được người dùng chấp nhận"); }
  if (profile.address && verifiedSources.length > 0) { legalScore += 3; legalReasons.push("Địa chỉ có nguồn đối chiếu"); }

  const identityReasons: string[] = [];
  let identityScore = 0;
  if (profile.phone && verifiedSources.length > 0) { identityScore += 4; identityReasons.push("Có điện thoại và nguồn đối chiếu"); }
  if (profile.website && verifiedSources.length > 0) { identityScore += 3; identityReasons.push("Có website và nguồn đối chiếu"); }
  if (profile.email && verifiedSources.length > 0) { identityScore += 3; identityReasons.push("Có email và nguồn đối chiếu"); }
  if (profile.address && profile.latitude !== null && profile.longitude !== null) { identityScore += 3; identityReasons.push("Địa chỉ có tọa độ"); }
  identityReasons.push("2 điểm Zalo được giữ lại đến khi nhân viên xác nhận liên lạc");

  const evidenceReasons: string[] = [];
  const evidenceScore = Math.min(8, independentDomains * 4) + (officialSources.length > 0 ? 4 : 0) + (auditEvents.length > 0 ? 3 : 0);
  if (independentDomains > 0) evidenceReasons.push(`${independentDomains} tên miền nguồn đã đối chiếu`);
  if (officialSources.length > 0) evidenceReasons.push("Có nguồn chính thức hoặc đăng ký doanh nghiệp");
  if (auditEvents.length > 0) evidenceReasons.push("Có nhật ký kiểm toán thay đổi hồ sơ");

  const capabilityReasons: string[] = [];
  let capabilityScore = 0;
  if (profile.capabilities.length > 0) { capabilityScore += 4; capabilityReasons.push("Có năng lực được ghi nhận"); }
  if (approvedOperationalImage) { capabilityScore += 5; capabilityReasons.push("Có ảnh xưởng, máy móc hoặc sản phẩm đã duyệt"); }
  if (verifiedCapabilityDocument) { capabilityScore += 4; capabilityReasons.push("Có chứng nhận hoặc giấy phép nhà xưởng đã xác minh"); }
  if (profile.latitude !== null && profile.longitude !== null) { capabilityScore += 2; capabilityReasons.push("Có tọa độ cơ sở"); }

  const updatedAt = new Date(profile.updatedAt);
  const ageDays = Number.isNaN(updatedAt.getTime()) ? Number.POSITIVE_INFINITY : Math.max(0, (now.getTime() - updatedAt.getTime()) / 86_400_000);
  const freshnessScore = ageDays <= 30 ? 5 : ageDays <= 90 ? 3 : ageDays <= 365 ? 1 : 0;
  const freshnessReasons = freshnessScore ? [`Hồ sơ được cập nhật ${Math.floor(ageDays)} ngày trước`] : ["Hồ sơ quá cũ hoặc thiếu ngày cập nhật hợp lệ"];

  const factors = [
    factor("LEGAL", "Pháp lý doanh nghiệp", legalScore, 25, legalReasons),
    factor("IDENTITY", "Danh tính và liên hệ", identityScore, 15, identityReasons),
    factor("EVIDENCE", "Chất lượng nguồn chứng cứ", evidenceScore, 15, evidenceReasons),
    factor("CAPABILITY", "Năng lực sản xuất", capabilityScore, 15, capabilityReasons),
    factor("REPUTATION", "Danh tiếng và độ ổn định", 0, 15, ["Chưa kích hoạt dữ liệu danh tiếng có kiểm chứng"]),
    factor("HISTORY", "Lịch sử hợp tác nội bộ", 0, 10, ["Chưa có dữ liệu giao dịch thực tế trong U3"]),
    factor("FRESHNESS", "Độ mới thông tin", freshnessScore, 5, freshnessReasons),
  ];
  const score = factors.reduce((total, item) => total + item.score, 0);
  const coverageSignals = [profile.address, profile.taxCode, profile.phone || profile.email || profile.website, verifiedSources.length, images.some(image => image.reviewStatus === "APPROVED"), documents.some(document => document.reviewStatus === "VERIFIED"), acceptedOcr, profile.capabilities.length].filter(Boolean).length;
  const coverage = Math.round(coverageSignals / 8 * 100);
  const label = score >= 75 ? "Bằng chứng tốt" : score >= 60 ? "Có căn cứ ban đầu" : score >= 40 ? "Cần xác minh thêm" : "Chưa đủ căn cứ";

  return { version: COMPANY_TRUST_SCORE_VERSION, score, maximum: 100, coverage, label, provisional: true, factors, calculatedAt: now.toISOString() };
}
