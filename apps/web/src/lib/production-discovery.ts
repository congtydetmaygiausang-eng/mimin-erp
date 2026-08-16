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
  website: string;
  latitude: number | null;
  longitude: number | null;
  sourceProvider: string;
  sourceUrl: string;
  externalId: string;
  status: DiscoveryStatus;
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
  status: DiscoveryStatus; discovered_at: string;
}

function mapRow(row: CandidateRow): DiscoveryCandidate {
  return { id: row.id, role: row.role, searchQuery: row.search_query, legalName: row.legal_name,
    address: row.address ?? "", province: row.province ?? "", district: row.district ?? "",
    phone: row.phone ?? "", website: row.website ?? "", latitude: row.latitude,
    longitude: row.longitude, sourceProvider: row.source_provider, sourceUrl: row.source_url,
    externalId: row.external_id, status: row.status, discoveredAt: row.discovered_at };
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
