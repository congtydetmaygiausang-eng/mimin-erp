import type {
  ProductionCompanyAuditEvent,
  ProductionCompanyDocument,
  ProductionCompanyDocumentExtraction,
  ProductionCompanyImage,
  ProductionCompanyManualCheck,
  ProductionCompanyProfile,
  ProductionCompanySource,
} from "@/lib/production-company-profile";

export const COMPANY_TRUST_SCORE_VERSION = "U5.1" as const;

export type CompanyTrustFactorKey = "LEGAL" | "IDENTITY" | "EVIDENCE" | "CAPABILITY" | "REPUTATION" | "HISTORY" | "FRESHNESS";

export interface CompanyTrustFactor {
  key: CompanyTrustFactorKey;
  label: string;
  score: number;
  maximum: number;
  reasons: string[];
}

export type CompanyTrustRiskLevel = "NONE" | "MEDIUM" | "HIGH" | "CRITICAL";
export interface CompanyTrustPenalty {
  code: "INVALID_TAX_CODE" | "TAX_CODE_CONFLICT" | "EXPIRED_VERIFIED_DOCUMENT";
  label: string;
  points: number;
  severity: Exclude<CompanyTrustRiskLevel, "NONE">;
  evidence: string[];
}

export interface CompanyTrustAssessment {
  version: typeof COMPANY_TRUST_SCORE_VERSION;
  score: number;
  baseScore: number;
  penaltyTotal: number;
  maximum: 100;
  coverage: number;
  label: string;
  provisional: true;
  factors: CompanyTrustFactor[];
  penalties: CompanyTrustPenalty[];
  riskLevel: CompanyTrustRiskLevel;
  calculatedAt: string;
}

interface CompanyTrustInput {
  profile: ProductionCompanyProfile;
  sources: ProductionCompanySource[];
  images: ProductionCompanyImage[];
  documents: ProductionCompanyDocument[];
  extractions: ProductionCompanyDocumentExtraction[];
  auditEvents: ProductionCompanyAuditEvent[];
  manualChecks: ProductionCompanyManualCheck[];
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

function normalizedTaxCode(value: string): string { return value.replace(/\D/g, ""); }
function validDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year,month,day]=value.split("-").map(Number);
  const date = new Date(Date.UTC(year,month-1,day,23,59,59,999));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
  return date;
}

export function calculateCompanyTrust(input: CompanyTrustInput): CompanyTrustAssessment {
  const { profile, sources, images, documents, extractions, auditEvents, manualChecks } = input;
  const now = input.now ?? new Date();
  const verifiedSources = sources.filter(source => source.verificationStatus === "PARTIAL" || source.verificationStatus === "VERIFIED");
  const officialSources = verifiedSources.filter(source => source.sourceType === "OFFICIAL" || source.sourceType === "REGISTRY");
  const verifiedLegalDocument = documents.some(document => document.reviewStatus === "VERIFIED" && (document.documentType === "BUSINESS_LICENSE" || document.documentType === "TAX_REGISTRATION"));
  const acceptedOcr = extractions.some(extraction => extraction.status === "ACCEPTED");
  const approvedOperationalImage = images.some(image => image.reviewStatus === "APPROVED" && image.archivalStatus === "ARCHIVED" && ["FACTORY", "MACHINERY", "PRODUCT"].includes(image.category));
  const verifiedCapabilityDocument = documents.some(document => document.reviewStatus === "VERIFIED" && ["CERTIFICATE", "FACTORY_LICENSE"].includes(document.documentType));
  const independentDomains = distinctSourceDomains(verifiedSources);
  const confirmedChecks = new Set(manualChecks.filter(check => check.status === "CONFIRMED").map(check => check.checkType));

  const legalReasons: string[] = [];
  let legalScore = 0;
  if (profile.taxCode) { legalScore += profile.verificationStatus === "VERIFIED" || verifiedLegalDocument ? 8 : 3; legalReasons.push(profile.verificationStatus === "VERIFIED" || verifiedLegalDocument ? "Mã số thuế có căn cứ xác minh" : "Có mã số thuế nhưng chưa đủ căn cứ"); }
  if (profile.verificationStatus === "VERIFIED") { legalScore += 5; legalReasons.push("Hồ sơ pháp lý đã xác minh"); }
  if (verifiedLegalDocument) { legalScore += 5; legalReasons.push("Có giấy tờ pháp lý được người dùng duyệt"); }
  if (acceptedOcr) { legalScore += 4; legalReasons.push("OCR giấy tờ đã được người dùng chấp nhận"); }
  if (profile.address && verifiedSources.length > 0) { legalScore += 3; legalReasons.push("Địa chỉ có nguồn đối chiếu"); }
  if (confirmedChecks.has("DOCUMENTS_MATCHED")) { legalScore += 3; legalReasons.push("Nhân viên xác nhận giấy tờ khớp hồ sơ"); }

  const identityReasons: string[] = [];
  let identityScore = 0;
  if (profile.phone && (verifiedSources.length > 0 || confirmedChecks.has("PHONE_REACHED"))) { identityScore += 4; identityReasons.push(confirmedChecks.has("PHONE_REACHED") ? "Nhân viên đã liên hệ điện thoại thành công" : "Có điện thoại và nguồn đối chiếu"); }
  if (profile.website && verifiedSources.length > 0) { identityScore += 3; identityReasons.push("Có website và nguồn đối chiếu"); }
  if (profile.email && verifiedSources.length > 0) { identityScore += 3; identityReasons.push("Có email và nguồn đối chiếu"); }
  if (profile.address && profile.latitude !== null && profile.longitude !== null) { identityScore += 3; identityReasons.push("Địa chỉ có tọa độ"); }
  if (confirmedChecks.has("ZALO_CONFIRMED")) { identityScore += 2; identityReasons.push("Nhân viên xác nhận đúng tài khoản Zalo"); }
  else identityReasons.push("2 điểm Zalo được giữ lại đến khi nhân viên xác nhận liên lạc");

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
  if (confirmedChecks.has("SITE_VISITED")) { capabilityScore += 3; capabilityReasons.push("Nhân viên xác nhận đã khảo sát cơ sở"); }

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
  const baseScore = factors.reduce((total, item) => total + item.score, 0);
  const penalties: CompanyTrustPenalty[] = [];
  const profileTaxCode = normalizedTaxCode(profile.taxCode);
  if (profileTaxCode && ![10, 13].includes(profileTaxCode.length)) penalties.push({ code:"INVALID_TAX_CODE", label:"Mã số thuế sai độ dài chuẩn", points:5, severity:"MEDIUM", evidence:[profile.taxCode] });
  const conflictingTaxCodes = Array.from(new Set(extractions.filter(extraction=>extraction.status==="ACCEPTED").map(extraction=>normalizedTaxCode(extraction.taxCode)).filter(taxCode=>taxCode&&profileTaxCode&&taxCode!==profileTaxCode)));
  if (conflictingTaxCodes.length > 0) penalties.push({ code:"TAX_CODE_CONFLICT", label:"Mã số thuế mâu thuẫn với OCR đã chấp nhận", points:20, severity:"CRITICAL", evidence:conflictingTaxCodes });
  const expiredDocumentIds = new Set<string>();
  const expiredEvidence: string[] = [];
  for (const document of documents) {
    const expiresOn = validDate(document.expiresOn);
    if (document.reviewStatus === "VERIFIED" && expiresOn && expiresOn.getTime() < now.getTime()) { expiredDocumentIds.add(document.id); expiredEvidence.push(`${document.title} · hết hạn ${document.expiresOn}`); }
  }
  for (const extraction of extractions) {
    const expiresOn = validDate(extraction.expiresOn);
    if (extraction.status === "ACCEPTED" && !expiredDocumentIds.has(extraction.documentId) && expiresOn && expiresOn.getTime() < now.getTime()) { expiredDocumentIds.add(extraction.documentId); expiredEvidence.push(`OCR giấy tờ · hết hạn ${extraction.expiresOn}`); }
  }
  if (expiredEvidence.length > 0) penalties.push({ code:"EXPIRED_VERIFIED_DOCUMENT", label:"Giấy tờ đã xác minh nhưng hết hạn", points:10, severity:"HIGH", evidence:expiredEvidence });
  const penaltyTotal = Math.min(40, penalties.reduce((total, penalty) => total + penalty.points, 0));
  const score = Math.max(0, baseScore - penaltyTotal);
  const coverageSignals = [profile.address, profile.taxCode, profile.phone || profile.email || profile.website, verifiedSources.length, images.some(image => image.reviewStatus === "APPROVED"), documents.some(document => document.reviewStatus === "VERIFIED"), acceptedOcr, profile.capabilities.length].filter(Boolean).length;
  const coverage = Math.round(coverageSignals / 8 * 100);
  const riskLevel:CompanyTrustRiskLevel=penalties.some(penalty=>penalty.severity==="CRITICAL")?"CRITICAL":penaltyTotal>=20?"HIGH":penaltyTotal>0?"MEDIUM":"NONE";
  const label = riskLevel === "CRITICAL" ? "Cảnh báo đỏ" : score >= 75 ? "Bằng chứng tốt" : score >= 60 ? "Có căn cứ ban đầu" : score >= 40 ? "Cần xác minh thêm" : "Chưa đủ căn cứ";

  return { version: COMPANY_TRUST_SCORE_VERSION, score, baseScore, penaltyTotal, maximum: 100, coverage, label, provisional: true, factors, penalties, riskLevel, calculatedAt: now.toISOString() };
}
