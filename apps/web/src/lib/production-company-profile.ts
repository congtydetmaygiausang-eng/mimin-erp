import { supabase } from "@/lib/supabase/client";
import { PRODUCTION_ORGANIZATION_ID, type ProductionPartnerRole } from "@/lib/production-network";
import type { DirectSearchCandidate } from "@/lib/production-discovery";

export type CompanyProfileStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type CompanyVerificationStatus = "DISCOVERED" | "REVIEWED" | "VERIFIED";

export interface ProductionCompanyProfile {
  id: string;
  role: ProductionPartnerRole;
  legalName: string;
  taxCode: string;
  phone: string;
  email: string;
  website: string;
  address: string;
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

interface DiscoveredCompanyImage {
  imageUrl: string; sourcePageUrl: string; sourceTitle: string; caption: string;
  category: CompanyImageCategory; matchScore: number;
}

interface CompanyProfileRow {
  id: string; role: ProductionPartnerRole; legal_name: string; tax_code: string | null;
  phone: string | null; email: string | null; website: string | null; address: string | null;
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

function mapProfile(row: CompanyProfileRow): ProductionCompanyProfile {
  return { id: row.id, role: row.role, legalName: row.legal_name, taxCode: row.tax_code ?? "",
    phone: row.phone ?? "", email: row.email ?? "", website: row.website ?? "", address: row.address ?? "",
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
    tax_code: candidate.taxCode?.trim() || null,
    phone: candidate.phone.trim() || null,
    email: candidate.email?.trim() || null,
    website: candidate.website.trim() || null,
    address: candidate.address.trim() || null,
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
