import { supabase } from "@/lib/supabase/client";
import { PRODUCTION_ORGANIZATION_ID, type ProductionPartnerRole } from "@/lib/production-network";
import type { DirectSearchCandidate } from "@/lib/production-discovery";

export type CompanyProfileStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type CompanyVerificationStatus = "DISCOVERED" | "REVIEWED" | "VERIFIED";
export type CompanyEvidenceVerificationStatus = "UNVERIFIED" | "PARTIAL" | "VERIFIED" | "REJECTED";
export type CompanyEvidenceField = "LEGAL_NAME" | "TRADE_NAME" | "SHORT_NAME" | "TAX_CODE" |
  "REGISTERED_ADDRESS" | "FACTORY_ADDRESS" | "OFFICE_ADDRESS" | "PHONE" | "ZALO" | "EMAIL" |
  "WEBSITE" | "FACEBOOK" | "LEGAL_REPRESENTATIVE" | "BUSINESS_LINE" | "CAPABILITY" |
  "COMPANY_INTRODUCTION" | "FOUNDED_YEAR" | "OPERATING_STATUS";

export interface ProductionCompanyFieldEvidence {
  id: string;
  fieldName: CompanyEvidenceField;
  fieldValue: string;
  sourceId: string;
  sourceUrl: string;
  sourceExcerpt: string;
  confidence: number;
  verificationStatus: CompanyEvidenceVerificationStatus;
  isSelected: boolean;
  capturedAt: string;
}

export interface ProductionCompanyProfile {
  id: string;
  role: ProductionPartnerRole;
  legalName: string;
  tradeName: string;
  shortName: string;
  taxCode: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  registeredAddress: string;
  factoryAddress: string;
  officeAddress: string;
  phones: string[];
  zaloPhone: string;
  facebookUrl: string;
  legalRepresentative: string;
  businessLines: string[];
  companyIntroduction: string;
  foundedYear: number | null;
  operatingStatus: string;
  province: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  capabilities: string[];
  profileStatus: CompanyProfileStatus;
  verificationStatus: CompanyVerificationStatus;
  summary: string;
  sourceProvider: string;
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionCompanySource {
  id: string;
  sourceType: "SEARCH" | "OFFICIAL" | "REGISTRY" | "MAP" | "SOCIAL" | "OTHER";
  sourceProvider: string;
  sourceUrl: string;
  sourceTitle: string;
  verificationStatus: "UNVERIFIED" | "PARTIAL" | "VERIFIED" | "REJECTED";
  capturedAt: string;
}

export type CompanyImageCategory = "LOGO" | "FACADE" | "FACTORY" | "MACHINERY" | "PRODUCT" | "CERTIFICATE" | "OTHER";
export type CompanyImageReviewStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface ProductionCompanyImage {
  id: string;
  imageUrl: string;
  displayUrl: string;
  sourcePageUrl: string;
  sourceProvider: string;
  sourceTitle: string;
  caption: string;
  category: CompanyImageCategory;
  reviewStatus: CompanyImageReviewStatus;
  matchScore: number;
  isPrimary: boolean;
  archivalStatus: "REMOTE" | "ARCHIVED" | "FAILED";
  storagePath: string;
  createdAt: string;
}

export type CompanyDocumentType = "BUSINESS_LICENSE"|"TAX_REGISTRATION"|"BRAND_LICENSE"|"CERTIFICATE"|"FACTORY_LICENSE"|"OTHER";
export interface ProductionCompanyDocument { id:string;documentType:CompanyDocumentType;title:string;documentNumber:string;issuer:string;issuedOn:string;expiresOn:string;notes:string;originalFilename:string;mimeType:string;fileBytes:number;reviewStatus:"PENDING"|"VERIFIED"|"REJECTED";signedUrl:string;createdAt:string }
export type CompanyDocumentExtractionStatus = "PENDING"|"ACCEPTED"|"REJECTED";
export interface ProductionCompanyDocumentExtraction {
  id:string;documentId:string;status:CompanyDocumentExtractionStatus;provider:"GEMINI";model:string;
  legalName:string;taxCode:string;documentNumber:string;issuer:string;issuedOn:string;expiresOn:string;
  registeredAddress:string;legalRepresentative:string;summary:string;rawTextExcerpt:string;
  confidence:number;createdAt:string;reviewedAt:string;
}
export type CompanyAuditEventType = "PROFILE_CREATED"|"PROFILE_UPDATED"|"IMAGE_DISCOVERED"|"IMAGE_APPROVED"|"IMAGE_REJECTED"|"DOCUMENT_UPLOADED"|"DOCUMENT_VERIFIED"|"DOCUMENT_REJECTED"|"DOCUMENT_OCR_COMPLETED"|"DOCUMENT_OCR_ACCEPTED"|"DOCUMENT_OCR_REJECTED";
export interface ProductionCompanyAuditEvent {
  id:string;entityType:"PROFILE"|"IMAGE"|"DOCUMENT"|"DOCUMENT_EXTRACTION";entityId:string;
  eventType:CompanyAuditEventType;title:string;details:Record<string,string|number|boolean|null>;
  actorId:string;occurredAt:string;
}

export type CompanyManualCheckType = "PHONE_REACHED" | "ZALO_CONFIRMED" | "SITE_VISITED" | "DOCUMENTS_MATCHED";
export type CompanyManualCheckStatus = "CONFIRMED" | "REVOKED";
export interface ProductionCompanyManualCheck {
  id: string;
  checkType: CompanyManualCheckType;
  status: CompanyManualCheckStatus;
  notes: string;
  checkedBy: string;
  checkedAt: string;
}

export interface ProductionCompanyTrustAssessment {
  id: string;
  formulaVersion: string;
  score: number;
  baseScore: number;
  penaltyTotal: number;
  coverage: number;
  label: string;
  riskLevel: "NONE" | "MEDIUM" | "HIGH" | "CRITICAL";
  factors: Array<{key:string;label:string;score:number;maximum:number;reasons:string[]}>;
  penalties: Array<{code:string;label:string;points:number;severity:string;evidence:string[]}>;
  evidenceSummary: Record<string,number>;
  note: string;
  assessedBy: string;
  assessedAt: string;
}

export interface CompanyTrustSnapshotInput {
  formulaVersion:string;score:number;baseScore:number;penaltyTotal:number;coverage:number;label:string;
  riskLevel:ProductionCompanyTrustAssessment["riskLevel"];
  factors:ProductionCompanyTrustAssessment["factors"];
  penalties:ProductionCompanyTrustAssessment["penalties"];
  evidenceSummary:Record<string,number>;note:string;
}

interface DiscoveredCompanyImage {
  imageUrl: string; sourcePageUrl: string; sourceTitle: string; caption: string;
  category: CompanyImageCategory; matchScore: number;
}

interface CompanyProfileRow {
  id: string; role: ProductionPartnerRole; legal_name: string; tax_code: string | null;
  trade_name?: string | null; short_name?: string | null;
  phone: string | null; email: string | null; website: string | null; address: string | null;
  registered_address?: string | null; factory_address?: string | null; office_address?: string | null;
  phones?: string[] | null; zalo_phone?: string | null; facebook_url?: string | null;
  legal_representative?: string | null; business_lines?: string[] | null;
  company_introduction?: string | null; founded_year?: number | null; operating_status?: string | null;
  province: string | null; district: string | null; latitude: number | null; longitude: number | null;
  capabilities: string[] | null; profile_status: CompanyProfileStatus;
  verification_status: CompanyVerificationStatus; summary: string | null;
  source_provider: string | null; source_url: string | null; created_at: string; updated_at: string;
}

interface CompanySourceRow {
  id: string; source_type: ProductionCompanySource["sourceType"]; source_provider: string | null;
  source_url: string; source_title: string | null;
  verification_status: ProductionCompanySource["verificationStatus"]; captured_at: string;
}

interface CompanyFieldEvidenceRow {
  id: string; field_name: CompanyEvidenceField; field_value: string;
  source_id: string | null; source_url: string | null; source_excerpt: string | null;
  confidence: number; verification_status: CompanyEvidenceVerificationStatus;
  is_selected: boolean; captured_at: string;
}

function mapProfile(row: CompanyProfileRow): ProductionCompanyProfile {
  return { id: row.id, role: row.role, legalName: row.legal_name, taxCode: row.tax_code ?? "",
    tradeName: row.trade_name ?? "", shortName: row.short_name ?? "",
    phone: row.phone ?? "", email: row.email ?? "", website: row.website ?? "", address: row.address ?? "",
    registeredAddress: row.registered_address ?? row.address ?? "", factoryAddress: row.factory_address ?? "",
    officeAddress: row.office_address ?? "", phones: row.phones ?? (row.phone ? [row.phone] : []),
    zaloPhone: row.zalo_phone ?? "", facebookUrl: row.facebook_url ?? "",
    legalRepresentative: row.legal_representative ?? "", businessLines: row.business_lines ?? [],
    companyIntroduction: row.company_introduction ?? row.summary ?? "", foundedYear: row.founded_year ?? null,
    operatingStatus: row.operating_status ?? "",
    province: row.province ?? "", district: row.district ?? "", latitude: row.latitude, longitude: row.longitude,
    capabilities: row.capabilities ?? [], profileStatus: row.profile_status, verificationStatus: row.verification_status,
    summary: row.summary ?? "", sourceProvider: row.source_provider ?? "", sourceUrl: row.source_url ?? "",
    createdAt: row.created_at, updatedAt: row.updated_at };
}

function safeHttpsUrl(value: string): string {
  const trimmed = value.trim();
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  if (/^http:\/\//i.test(trimmed)) return `https://${trimmed.slice(7)}`;
  return "";
}

async function fingerprint(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value.toLowerCase().trim()));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function ensureCompanyProfileFromSearch(
  candidate: DirectSearchCandidate,
  role: ProductionPartnerRole,
  provider: string,
): Promise<string> {
  if (!supabase) throw new Error("Chưa kết nối Supabase");
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Phiên đăng nhập đã hết hạn");
  const identityKey = await fingerprint([candidate.taxCode, candidate.legalName, candidate.address, candidate.phone].filter(Boolean).join("|"));
  const sourceUrl = safeHttpsUrl(candidate.sourceUrl);
  const profileValues = {
    organization_id: PRODUCTION_ORGANIZATION_ID,
    identity_key: identityKey,
    role,
    legal_name: candidate.legalName.trim(),
    trade_name: candidate.tradeName?.trim() || null,
    short_name: candidate.shortName?.trim() || null,
    tax_code: candidate.taxCode?.trim() || null,
    phone: candidate.phone.trim() || null,
    email: candidate.email?.trim() || null,
    website: candidate.website.trim() || null,
    address: candidate.address.trim() || null,
    registered_address: candidate.registeredAddress?.trim() || candidate.address.trim() || null,
    factory_address: candidate.factoryAddress?.trim() || null,
    office_address: candidate.officeAddress?.trim() || null,
    phones: candidate.phones?.map((value) => value.trim()).filter(Boolean) ?? (candidate.phone.trim() ? [candidate.phone.trim()] : []),
    zalo_phone: candidate.zaloPhone?.trim() || null,
    facebook_url: safeHttpsUrl(candidate.facebookUrl ?? "") || null,
    legal_representative: candidate.legalRepresentative?.trim() || null,
    business_lines: candidate.businessLines?.map((value) => value.trim()).filter(Boolean) ?? [],
    company_introduction: candidate.companyIntroduction?.trim() || null,
    founded_year: candidate.foundedYear ?? null,
    operating_status: candidate.operatingStatus?.trim() || null,
    province: candidate.province.trim() || null,
    district: candidate.district.trim() || null,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    capabilities: candidate.capabilities,
    profile_status: "DRAFT",
    verification_status: candidate.verificationStatus === "VERIFIED" ? "VERIFIED" : candidate.verificationStatus === "PARTIAL" ? "REVIEWED" : "DISCOVERED",
    source_provider: provider,
    source_url: sourceUrl || null,
    raw_data: candidate,
    updated_by: userId,
  };
  const existing = await supabase.from("production_company_profiles")
    .select("id")
    .eq("organization_id", PRODUCTION_ORGANIZATION_ID)
    .eq("identity_key", identityKey)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  const profileResult = existing.data
    ? await supabase.from("production_company_profiles").update(profileValues).eq("id", existing.data.id).select("id").single()
    : await supabase.from("production_company_profiles").insert({ ...profileValues, created_by: userId }).select("id").single();
  const { data, error } = profileResult;
  if (error || !data) throw new Error(error?.message || "Không tạo được hồ sơ công ty");

  const sources = candidate.sources?.length ? candidate.sources : sourceUrl ? [{ url: sourceUrl, title: candidate.sourceTitle }] : [];
  if (sources.length) {
    const rows = sources.flatMap((source) => {
      const url = safeHttpsUrl(source.url);
      return url ? [{ organization_id: PRODUCTION_ORGANIZATION_ID, company_profile_id: data.id,
        source_type: "SEARCH", source_provider: provider, source_url: url,
        source_title: source.title || null, verification_status: "UNVERIFIED", created_by: userId }] : [];
    });
    if (rows.length) {
      const { error: sourceError } = await supabase.from("production_company_sources").upsert(rows, { onConflict: "company_profile_id,source_url", ignoreDuplicates: true });
      if (sourceError) throw new Error(sourceError.message);
    }
  }
  return data.id as string;
}

export async function loadCompanyProfile(id: string): Promise<{ profile: ProductionCompanyProfile; sources: ProductionCompanySource[] }> {
  if (!supabase) throw new Error("Chưa kết nối Supabase");
  const [profileResult, sourcesResult] = await Promise.all([
    supabase.from("production_company_profiles").select("*").eq("organization_id", PRODUCTION_ORGANIZATION_ID).eq("id", id).single(),
    supabase.from("production_company_sources").select("*").eq("organization_id", PRODUCTION_ORGANIZATION_ID).eq("company_profile_id", id).order("captured_at", { ascending: false }),
  ]);
  if (profileResult.error || !profileResult.data) throw new Error(profileResult.error?.message || "Không tìm thấy hồ sơ công ty");
  if (sourcesResult.error) throw new Error(sourcesResult.error.message);
  return {
    profile: mapProfile(profileResult.data as CompanyProfileRow),
    sources: (sourcesResult.data ?? []).map((row) => ({ id: (row as CompanySourceRow).id,
      sourceType: (row as CompanySourceRow).source_type, sourceProvider: (row as CompanySourceRow).source_provider ?? "",
      sourceUrl: (row as CompanySourceRow).source_url, sourceTitle: (row as CompanySourceRow).source_title ?? "",
      verificationStatus: (row as CompanySourceRow).verification_status, capturedAt: (row as CompanySourceRow).captured_at })),
  };
}

export async function loadCompanyFieldEvidence(profileId: string): Promise<ProductionCompanyFieldEvidence[]> {
  if (!supabase) throw new Error("Chưa kết nối Supabase");
  const { data, error } = await supabase.from("production_company_field_evidence").select("*")
    .eq("organization_id", PRODUCTION_ORGANIZATION_ID).eq("company_profile_id", profileId)
    .order("is_selected", { ascending: false }).order("confidence", { ascending: false })
    .order("captured_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((raw) => {
    const row = raw as CompanyFieldEvidenceRow;
    return { id: row.id, fieldName: row.field_name, fieldValue: row.field_value,
      sourceId: row.source_id ?? "", sourceUrl: row.source_url ?? "", sourceExcerpt: row.source_excerpt ?? "",
      confidence: Number(row.confidence), verificationStatus: row.verification_status,
      isSelected: row.is_selected, capturedAt: row.captured_at };
  });
}

export async function loadCompanyImages(profileId: string): Promise<ProductionCompanyImage[]> {
  if (!supabase) throw new Error("Chưa kết nối Supabase");
  const { data, error } = await supabase.from("production_company_images").select("*")
    .eq("organization_id", PRODUCTION_ORGANIZATION_ID).eq("company_profile_id", profileId)
    .order("match_score", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const archivedPaths = rows.flatMap((row) => row.archival_status === "ARCHIVED" && row.storage_path ? [String(row.storage_path)] : []);
  const signedUrls = new Map<string, string>();
  if (archivedPaths.length) {
    const signed = await supabase.storage.from("production-company-images").createSignedUrls(archivedPaths, 3600);
    if (signed.error) throw new Error(signed.error.message);
    for (const item of signed.data ?? []) if (item.path && item.signedUrl) signedUrls.set(item.path, item.signedUrl);
  }
  return rows.map((row) => ({
    id: String(row.id), imageUrl: String(row.image_url), displayUrl: signedUrls.get(String(row.storage_path ?? "")) || String(row.image_url), sourcePageUrl: String(row.source_page_url),
    sourceProvider: String(row.source_provider ?? ""), sourceTitle: String(row.source_title ?? ""),
    caption: String(row.caption ?? ""), category: row.image_category as CompanyImageCategory,
    reviewStatus: row.review_status as CompanyImageReviewStatus, matchScore: Number(row.match_score ?? 0),
    isPrimary: Boolean(row.is_primary), archivalStatus: (row.archival_status ?? "REMOTE") as ProductionCompanyImage["archivalStatus"],
    storagePath: String(row.storage_path ?? ""), createdAt: String(row.created_at),
  }));
}

export async function discoverCompanyImages(profile: ProductionCompanyProfile): Promise<number> {
  if (!supabase) throw new Error("Chưa kết nối Supabase");
  const session = (await supabase.auth.getSession()).data.session;
  if (!session?.access_token) throw new Error("Phiên đăng nhập đã hết hạn");
  const response = await fetch("/api/v1/sourcing/company-images", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ legalName: profile.legalName, address: profile.address, website: profile.website }),
  });
  const payload = await response.json() as { images?: DiscoveredCompanyImage[]; provider?: string; error?: string };
  if (!response.ok) throw new Error(payload.error || "Không tìm được hình ảnh");
  const images = payload.images ?? [];
  if (!images.length) return 0;
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Phiên đăng nhập đã hết hạn");
  const rows = images.map((image) => ({
    organization_id: PRODUCTION_ORGANIZATION_ID, company_profile_id: profile.id,
    image_url: image.imageUrl, source_page_url: image.sourcePageUrl,
    source_provider: payload.provider || "TAVILY", source_title: image.sourceTitle,
    caption: image.caption, image_category: image.category, match_score: image.matchScore,
    review_status: "PENDING", is_primary: false, created_by: userId,
  }));
  const { error } = await supabase.from("production_company_images").upsert(rows, {
    onConflict: "company_profile_id,image_url", ignoreDuplicates: true,
  });
  if (error) throw new Error(error.message);
  return images.length;
}

export async function reviewCompanyImage(id: string, status: Exclude<CompanyImageReviewStatus, "PENDING">): Promise<void> {
  if (!supabase) throw new Error("Chưa kết nối Supabase");
  const session = (await supabase.auth.getSession()).data.session;
  if (!session?.access_token) throw new Error("Phiên đăng nhập đã hết hạn");
  const response = await fetch(`/api/v1/sourcing/company-images/${encodeURIComponent(id)}/review`, {
    method: "POST", headers: { "Content-Type":"application/json", Authorization:`Bearer ${session.access_token}` },
    body: JSON.stringify({ status }),
  });
  const payload = await response.json() as { error?: string };
  if (!response.ok) throw new Error(payload.error || "Không cập nhật được ảnh");
}

export async function loadCompanyDocuments(profileId:string):Promise<ProductionCompanyDocument[]>{
  if(!supabase)throw new Error("Chưa kết nối Supabase");
  const{data,error}=await supabase.from("production_company_documents").select("*").eq("organization_id",PRODUCTION_ORGANIZATION_ID).eq("company_profile_id",profileId).order("created_at",{ascending:false});
  if(error)throw new Error(error.message);
  const rows=data??[],paths=rows.map(row=>String(row.storage_path));
  const urls=new Map<string,string>();
  if(paths.length){const signed=await supabase.storage.from("production-company-documents").createSignedUrls(paths,900);if(signed.error)throw new Error(signed.error.message);for(const item of signed.data??[])if(item.path&&item.signedUrl)urls.set(item.path,item.signedUrl);}
  return rows.map(row=>({id:String(row.id),documentType:row.document_type as CompanyDocumentType,title:String(row.title),documentNumber:String(row.document_number??""),issuer:String(row.issuer??""),issuedOn:String(row.issued_on??""),expiresOn:String(row.expires_on??""),notes:String(row.notes??""),originalFilename:String(row.original_filename),mimeType:String(row.mime_type),fileBytes:Number(row.file_bytes),reviewStatus:row.review_status as ProductionCompanyDocument["reviewStatus"],signedUrl:urls.get(String(row.storage_path))??"",createdAt:String(row.created_at)}));
}

export async function uploadCompanyDocument(profileId:string,input:{file:File;documentType:CompanyDocumentType;title:string;documentNumber:string;issuer:string;issuedOn:string;expiresOn:string;notes:string}):Promise<void>{
  if(!supabase)throw new Error("Chưa kết nối Supabase");
  const token=(await supabase.auth.getSession()).data.session?.access_token;if(!token)throw new Error("Phiên đăng nhập đã hết hạn");
  const form=new FormData();form.set("profileId",profileId);form.set("file",input.file);Object.entries(input).forEach(([key,value])=>{if(key!=="file")form.set(key,value)});
  const response=await fetch("/api/v1/sourcing/company-documents",{method:"POST",headers:{Authorization:`Bearer ${token}`},body:form});
  const payload=await response.json() as{error?:string};if(!response.ok)throw new Error(payload.error||"Không tải được giấy tờ");
}

export async function reviewCompanyDocument(id:string,status:"VERIFIED"|"REJECTED"):Promise<void>{
  if(!supabase)throw new Error("Chưa kết nối Supabase");
  const{error}=await supabase.from("production_company_documents").update({review_status:status}).eq("organization_id",PRODUCTION_ORGANIZATION_ID).eq("id",id);if(error)throw new Error(error.message);
}

export async function loadCompanyDocumentExtractions(profileId:string):Promise<ProductionCompanyDocumentExtraction[]>{
  if(!supabase)throw new Error("Chưa kết nối Supabase");
  const{data:documents,error:documentError}=await supabase.from("production_company_documents").select("id").eq("organization_id",PRODUCTION_ORGANIZATION_ID).eq("company_profile_id",profileId);
  if(documentError)throw new Error(documentError.message);
  const ids=(documents??[]).map(document=>String(document.id));if(!ids.length)return[];
  const{data,error}=await supabase.from("production_company_document_extractions").select("*").eq("organization_id",PRODUCTION_ORGANIZATION_ID).in("document_id",ids).order("created_at",{ascending:false});
  if(error)throw new Error(error.message);
  return(data??[]).map(row=>({id:String(row.id),documentId:String(row.document_id),status:row.extraction_status as CompanyDocumentExtractionStatus,provider:"GEMINI",model:String(row.model),legalName:String(row.legal_name??""),taxCode:String(row.tax_code??""),documentNumber:String(row.document_number??""),issuer:String(row.issuer??""),issuedOn:String(row.issued_on??""),expiresOn:String(row.expires_on??""),registeredAddress:String(row.registered_address??""),legalRepresentative:String(row.legal_representative??""),summary:String(row.summary??""),rawTextExcerpt:String(row.raw_text_excerpt??""),confidence:Number(row.confidence??0),createdAt:String(row.created_at),reviewedAt:String(row.reviewed_at??"")}));
}

export async function extractCompanyDocument(id:string):Promise<void>{
  if(!supabase)throw new Error("Chưa kết nối Supabase");
  const token=(await supabase.auth.getSession()).data.session?.access_token;if(!token)throw new Error("Phiên đăng nhập đã hết hạn");
  const response=await fetch(`/api/v1/sourcing/company-documents/${encodeURIComponent(id)}/extract`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});
  const payload=await response.json() as{error?:string};if(!response.ok)throw new Error(payload.error||"Không OCR được giấy tờ");
}

export async function reviewCompanyDocumentExtraction(id:string,status:"ACCEPTED"|"REJECTED"):Promise<void>{
  if(!supabase)throw new Error("Chưa kết nối Supabase");
  const{error}=await supabase.from("production_company_document_extractions").update({extraction_status:status}).eq("organization_id",PRODUCTION_ORGANIZATION_ID).eq("id",id).eq("extraction_status","PENDING");
  if(error)throw new Error(error.message);
}

export async function loadCompanyAuditEvents(profileId:string):Promise<ProductionCompanyAuditEvent[]>{
  if(!supabase)throw new Error("Chưa kết nối Supabase");
  const{data,error}=await supabase.from("production_company_audit_events").select("id,entity_type,entity_id,event_type,title,details,actor_id,occurred_at").eq("organization_id",PRODUCTION_ORGANIZATION_ID).eq("company_profile_id",profileId).order("occurred_at",{ascending:false}).order("id",{ascending:false}).limit(100);
  if(error)throw new Error(error.message);
  return(data??[]).map(row=>({id:String(row.id),entityType:row.entity_type as ProductionCompanyAuditEvent["entityType"],entityId:String(row.entity_id),eventType:row.event_type as CompanyAuditEventType,title:String(row.title),details:(row.details??{}) as Record<string,string|number|boolean|null>,actorId:String(row.actor_id??""),occurredAt:String(row.occurred_at)}));
}

export async function loadCompanyManualChecks(profileId:string):Promise<ProductionCompanyManualCheck[]>{
  if(!supabase)throw new Error("Chưa kết nối Supabase");
  const{data,error}=await supabase.from("production_company_manual_checks").select("id,check_type,check_status,notes,checked_by,checked_at").eq("organization_id",PRODUCTION_ORGANIZATION_ID).eq("company_profile_id",profileId).order("checked_at",{ascending:false});
  if(error)throw new Error(error.message);
  return(data??[]).map(row=>({id:String(row.id),checkType:row.check_type as CompanyManualCheckType,status:row.check_status as CompanyManualCheckStatus,notes:String(row.notes??""),checkedBy:String(row.checked_by??""),checkedAt:String(row.checked_at)}));
}

export async function updateCompanyManualCheck(profileId:string,checkType:CompanyManualCheckType,status:CompanyManualCheckStatus):Promise<void>{
  if(!supabase)throw new Error("Chưa kết nối Supabase");
  const userId=(await supabase.auth.getUser()).data.user?.id;
  if(!userId)throw new Error("Phiên đăng nhập đã hết hạn");
  const{error}=await supabase.from("production_company_manual_checks").upsert({organization_id:PRODUCTION_ORGANIZATION_ID,company_profile_id:profileId,check_type:checkType,check_status:status,checked_by:userId},{onConflict:"company_profile_id,check_type"});
  if(error)throw new Error(error.message);
}

export async function loadCompanyTrustAssessments(profileId:string):Promise<ProductionCompanyTrustAssessment[]>{
  if(!supabase)throw new Error("Chưa kết nối Supabase");
  const{data,error}=await supabase.from("production_company_trust_assessments").select("id,formula_version,score,base_score,penalty_total,coverage,assessment_label,risk_level,factors,penalties,evidence_summary,note,assessed_by,assessed_at").eq("organization_id",PRODUCTION_ORGANIZATION_ID).eq("company_profile_id",profileId).order("assessed_at",{ascending:false}).order("id",{ascending:false}).limit(50);
  if(error)throw new Error(error.message);
  return(data??[]).map(row=>({id:String(row.id),formulaVersion:String(row.formula_version),score:Number(row.score),baseScore:Number(row.base_score),penaltyTotal:Number(row.penalty_total),coverage:Number(row.coverage),label:String(row.assessment_label),riskLevel:row.risk_level as ProductionCompanyTrustAssessment["riskLevel"],factors:(row.factors??[]) as ProductionCompanyTrustAssessment["factors"],penalties:(row.penalties??[]) as ProductionCompanyTrustAssessment["penalties"],evidenceSummary:(row.evidence_summary??{}) as Record<string,number>,note:String(row.note??""),assessedBy:String(row.assessed_by??""),assessedAt:String(row.assessed_at)}));
}

export async function createCompanyTrustAssessment(profileId:string,input:CompanyTrustSnapshotInput):Promise<void>{
  if(!supabase)throw new Error("Chưa kết nối Supabase");
  const userId=(await supabase.auth.getUser()).data.user?.id;
  if(!userId)throw new Error("Phiên đăng nhập đã hết hạn");
  const{error}=await supabase.from("production_company_trust_assessments").insert({organization_id:PRODUCTION_ORGANIZATION_ID,company_profile_id:profileId,formula_version:input.formulaVersion,score:input.score,base_score:input.baseScore,penalty_total:input.penaltyTotal,coverage:input.coverage,assessment_label:input.label,risk_level:input.riskLevel,factors:input.factors,penalties:input.penalties,evidence_summary:input.evidenceSummary,note:input.note.trim(),assessed_by:userId});
  if(error)throw new Error(error.message);
}
