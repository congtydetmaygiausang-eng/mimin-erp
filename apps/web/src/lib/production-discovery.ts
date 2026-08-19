import { supabase } from "@/lib/supabase/client";
import { PRODUCTION_ORGANIZATION_ID, type ProductionPartnerRole } from "@/lib/production-network";

export type DiscoveryStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface DiscoveryCandidate {
  id: string;
  role: ProductionPartnerRole;
  searchQuery: string;
  legalName: string;
  address: string;
  province: string;
  district: string;
  phone: string;
  email: string;
  taxCode: string;
  website: string;
  latitude: number | null;
  longitude: number | null;
  sourceProvider: string;
  sourceUrl: string;
  externalId: string;
  status: DiscoveryStatus;
  matchedPartnerId: string;
  reviewedAt: string;
  discoveredAt: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  osm_type: string;
  osm_id: number;
  address?: { city?: string; town?: string; county?: string; state?: string };
}

interface CandidateRow {
  id: string; role: ProductionPartnerRole; search_query: string; legal_name: string;
  address: string | null; province: string | null; district: string | null;
  phone: string | null; website: string | null; latitude: number | null; longitude: number | null;
  source_provider: string; source_url: string; external_id: string;
  status: DiscoveryStatus; matched_partner_id: string | null; raw_data: unknown;
  reviewed_at: string | null; discovered_at: string;
}

function rawText(rawData: unknown, key: "email" | "taxCode"): string {
  if (!rawData || typeof rawData !== "object") return "";
  const value = (rawData as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

function mapRow(row: CandidateRow): DiscoveryCandidate {
  return { id: row.id, role: row.role, searchQuery: row.search_query, legalName: row.legal_name,
    address: row.address ?? "", province: row.province ?? "", district: row.district ?? "",
    phone: row.phone ?? "", email: rawText(row.raw_data,"email"), taxCode: rawText(row.raw_data,"taxCode"),
    website: row.website ?? "", latitude: row.latitude,
    longitude: row.longitude, sourceProvider: row.source_provider, sourceUrl: row.source_url,
    externalId: row.external_id, status: row.status, matchedPartnerId: row.matched_partner_id ?? "",
    reviewedAt: row.reviewed_at ?? "", discoveredAt: row.discovered_at };
}

export async function loadDiscoveryCandidates(): Promise<DiscoveryCandidate[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("production_discovery_candidates").select("*")
    .eq("organization_id", PRODUCTION_ORGANIZATION_ID).order("discovered_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as CandidateRow));
}

export async function discoverOpenStreetMap(
  query: string, location: string, role: ProductionPartnerRole,
): Promise<DiscoveryCandidate[]> {
  if (!supabase) throw new Error("Cần đăng nhập Supabase để lưu kết quả tìm kiếm");
  const params = new URLSearchParams({ q: `${query}, ${location}, Việt Nam`, format: "jsonv2", addressdetails: "1", limit: "20", countrycodes: "vn" });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: "application/json", "Accept-Language": "vi" },
  });
  if (!response.ok) throw new Error("Nguồn OpenStreetMap tạm thời không phản hồi");
  const results = await response.json() as NominatimResult[];
  if (results.length === 0) return [];
  const rows = results.map((item) => ({ organization_id: PRODUCTION_ORGANIZATION_ID, role,
    search_query: `${query} | ${location}`, legal_name: item.name || item.display_name.split(",")[0],
    address: item.display_name, province: item.address?.state ?? "",
    district: item.address?.city ?? item.address?.town ?? item.address?.county ?? "",
    latitude: Number(item.lat), longitude: Number(item.lon), source_provider: "OPENSTREETMAP",
    source_url: `https://www.openstreetmap.org/${item.osm_type}/${item.osm_id}`,
    external_id: String(item.place_id), raw_data: item }));
  const { error } = await supabase.from("production_discovery_candidates").upsert(rows,
    { onConflict: "organization_id,source_provider,external_id", ignoreDuplicates: true });
  if (error) throw error;
  return loadDiscoveryCandidates();
}

export async function setDiscoveryStatus(id: string, status: DiscoveryStatus): Promise<void> {
  if (!supabase) throw new Error("Chưa kết nối Supabase");
  const { error } = await supabase.from("production_discovery_candidates").update({
    status, reviewed_at: new Date().toISOString(), reviewed_by: (await supabase.auth.getUser()).data.user?.id ?? null,
  }).eq("organization_id", PRODUCTION_ORGANIZATION_ID).eq("id", id);
  if (error) throw error;
}

export async function approveDiscoveryCandidate(id: string): Promise<void> {
  if (!supabase) throw new Error("Chưa kết nối Supabase");
  const { error } = await supabase.rpc("approve_production_candidate", { p_candidate_id: id });
  if (error) throw error;
}

interface AICandidateInput {
  legalName?: unknown; name?: unknown; address?: unknown; province?: unknown; district?: unknown;
  phone?: unknown; website?: unknown; latitude?: unknown; longitude?: unknown;
}

function textValue(value: unknown, maximum = 500): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

async function fingerprint(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

export async function importAICandidates(
  rawText: string, role: ProductionPartnerRole, provider: string, sourceUrl: string,
): Promise<number> {
  if (!supabase) throw new Error("Cần đăng nhập Supabase để nhập dữ liệu");
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? rawText;
  let parsed: unknown;
  try { parsed = JSON.parse(fenced.trim()); } catch { throw new Error("Nội dung AI chưa phải JSON hợp lệ"); }
  const list = Array.isArray(parsed) ? parsed : [parsed];
  if (list.length === 0 || list.length > 50) throw new Error("Mỗi lần chỉ nhập từ 1 đến 50 ứng viên");
  const normalizedProvider = ["CHATGPT", "GEMINI", "DEEPSEEK"].includes(provider) ? provider : "AI_IMPORT";
  const rows = await Promise.all(list.map(async (raw) => {
    if (!raw || typeof raw !== "object") throw new Error("Ứng viên không đúng cấu trúc");
    const item = raw as AICandidateInput;
    const legalName = textValue(item.legalName ?? item.name, 200);
    if (!legalName) throw new Error("Mỗi ứng viên phải có legalName");
    const latitude = typeof item.latitude === "number" && item.latitude >= -90 && item.latitude <= 90 ? item.latitude : null;
    const longitude = typeof item.longitude === "number" && item.longitude >= -180 && item.longitude <= 180 ? item.longitude : null;
    const hasCoordinates = latitude !== null && longitude !== null;
    const identity = `${normalizedProvider}|${legalName}|${textValue(item.address)}|${textValue(item.phone)}`.toLowerCase();
    return { organization_id: PRODUCTION_ORGANIZATION_ID, role, search_query: `AI ${normalizedProvider}`,
      legal_name: legalName, address: textValue(item.address), province: textValue(item.province, 100),
      district: textValue(item.district, 100), phone: textValue(item.phone, 50), website: textValue(item.website),
      latitude: hasCoordinates ? latitude : null, longitude: hasCoordinates ? longitude : null,
      source_provider: `AI_${normalizedProvider}`, source_url: sourceUrl.startsWith("https://") ? sourceUrl : "https://mimin-erp.vercel.app",
      external_id: await fingerprint(identity), raw_data: item };
  }));
  const { error } = await supabase.from("production_discovery_candidates").upsert(rows,
    { onConflict: "organization_id,source_provider,external_id", ignoreDuplicates: true });
  if (error) throw error;
  return rows.length;
}

export interface SearchDistanceEvidence { method:"HAVERSINE";unit:"KM";calculatedAt:string;radiusKm:number;rawDistanceKm:number|null;center:{latitude:number;longitude:number;label:string;source:"GPS"|"ADDRESS"};destination:{latitude:number|null;longitude:number|null;coordinateSource?:"SOURCE"|"NOMINATIM";coordinateConfidence?:"HIGH"|"MEDIUM"|"LOW";geocodedAddress?:string};addressConsistency:"MATCHED"|"UNVERIFIED"|"CONFLICT" }
export type CompanySourceType = "SEARCH"|"OFFICIAL"|"REGISTRY"|"MAP"|"SOCIAL"|"OTHER";
export interface DirectCandidateSource {url:string;title:string;sourceType?:CompanySourceType;sourceProvider?:string;excerpt?:string;rawContent?:string;relevanceScore?:number;searchQuery?:string}
export interface DirectSearchCandidate { legalName:string;tradeName?:string;shortName?:string;address:string;registeredAddress?:string;factoryAddress?:string;officeAddress?:string;legacyAddress?:string;addressStandard?:"HCM_POST_MERGER_2025";province:string;district:string;phone:string;phones?:string[];zaloPhone?:string;email?:string;taxCode?:string;website:string;facebookUrl?:string;legalRepresentative?:string;businessLines?:string[];companyIntroduction?:string;foundedYear?:number|null;operatingStatus?:string;latitude:number|null;longitude:number|null;capabilities:string[];sourceUrl:string;sourceTitle:string;confidence:number;sourceCount?:number;sources?:DirectCandidateSource[];matchReasons?:string[];distanceKm?:number|null;locationStatus?:"INSIDE"|"OUTSIDE"|"UNKNOWN"|"CONFLICT";locationReason?:string;distanceEvidence?:SearchDistanceEvidence;verifiedFields?:string[];verificationStatus?:"VERIFIED"|"PARTIAL"|"UNVERIFIED";lastVerifiedAt?:string;coordinateSource?:"MANUAL"|"SOURCE"|"WEBSITE"|"NOMINATIM";coordinateConfidence?:"HIGH"|"MEDIUM"|"LOW";geocodedAddress?:string;geocodedAt?:string;geocodeStatus?:"VERIFIED"|"REJECTED"|"NOT_ATTEMPTED";coordinateBoundingBox?:[number,number,number,number];coordinateConflictReason?:string;geocodeCacheStatus?:"MEMORY"|"PERSISTENT"|"PROVIDER"|"STALE_FALLBACK" }

function normalizedIdentity(value:string):string{return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}
function identityKeys(item:Pick<DirectSearchCandidate,"legalName"|"address"|"phone"|"website"|"sourceUrl">&{taxCode?:string}):string[]{return[
  item.taxCode?`tax:${item.taxCode.replace(/\D/g,"")}`:"",
  item.phone?`phone:${item.phone.replace(/\D/g,"")}`:"",
  item.website?`web:${normalizedIdentity(item.website.replace(/^https?:\/\//i,"").replace(/^www\./i,""))}`:"",
  item.legalName&&item.address?`name:${normalizedIdentity(item.legalName)}|${normalizedIdentity(item.address)}`:"",
  item.sourceUrl&&item.legalName?`source:${normalizedIdentity(item.sourceUrl)}|${normalizedIdentity(item.legalName)}`:"",
].filter(key=>Boolean(key)&&!key.endsWith(":"))}

export function directCandidateSaveKey(item:DirectSearchCandidate):string{return `${normalizedIdentity(item.sourceUrl)}|${normalizedIdentity(item.legalName)}|${normalizedIdentity(item.address)}`}
export function isDirectCandidateSaved(item:DirectSearchCandidate,saved:DiscoveryCandidate[]):boolean{const keys=new Set(identityKeys(item));return saved.some(candidate=>identityKeys({...candidate,sourceUrl:candidate.sourceUrl}).some(key=>keys.has(key)))}

export interface SaveDirectCandidatesResult{savedCount:number;skippedCount:number;savedKeys:string[];existingKeys:string[]}
export async function saveDirectSearchCandidates(items:DirectSearchCandidate[],role:ProductionPartnerRole,query:string,provider:string):Promise<SaveDirectCandidatesResult>{
  if(!supabase)throw new Error("Chưa kết nối Supabase");
  const limited=items.slice(0,30);
  const existing=await loadDiscoveryCandidates();
  const knownKeys=new Set(existing.flatMap(candidate=>identityKeys({...candidate,sourceUrl:candidate.sourceUrl})));
  const accepted:DirectSearchCandidate[]=[];
  const existingKeys:string[]=[];
  for(const item of limited){
    const keys=identityKeys(item);
    if(keys.some(key=>knownKeys.has(key))){existingKeys.push(directCandidateSaveKey(item));continue}
    accepted.push(item);keys.forEach(key=>knownKeys.add(key));
  }
  const rows=await Promise.all(accepted.map(async item=>({organization_id:PRODUCTION_ORGANIZATION_ID,role,search_query:query,legal_name:textValue(item.legalName,200),address:textValue(item.address),province:textValue(item.province,100),district:textValue(item.district,100),phone:textValue(item.phone,50),website:textValue(item.website),latitude:item.latitude,longitude:item.longitude,source_provider:`DIRECT_${provider}`,source_url:item.sourceUrl,external_id:await fingerprint(`${provider}|${item.sourceUrl}|${item.legalName}`),raw_data:item})));
  if(rows.length){const{error}=await supabase.from("production_discovery_candidates").upsert(rows,{onConflict:"organization_id,source_provider,external_id",ignoreDuplicates:true});if(error)throw error}
  return{savedCount:accepted.length,skippedCount:existingKeys.length,savedKeys:accepted.map(directCandidateSaveKey),existingKeys};
}
