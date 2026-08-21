// @codex MIMIN GROUP - Search Profile Engine (thí điểm). Lớp cấu hình BỔ SUNG cho pipeline
// tìm kiếm đã có (search-engine.ts) - không thay Query Builder/Scoring Engine lõi. Mỗi
// profile chỉ: (1) bổ sung ngữ cảnh synonyms/exclusion/query gợi ý vào system prompt của
// agent chat, (2) lọc hậu kiểm nhẹ theo exclusionRules trên kết quả đã có. Chỉ profile
// status='ACTIVE' mới được áp dụng; DRAFT không ảnh hưởng hành vi hiện tại.

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { DirectSearchCandidate } from "@/lib/production-discovery";

export const SEARCH_PROFILE_ORGANIZATION_ID = "mimin";

export interface SearchProfileConfig {
  requiredFilters: string[];
  optionalFilters: string[];
  defaultFilters: Record<string, unknown>;
  queryTemplates: string[];
  preferredSources: string[];
  verificationRules: string[];
  exclusionRules: string[];
  synonyms: Record<string, string[]>;
  outputFields: string[];
}

export interface SearchProfileScoring {
  code: string;
  total: number;
  criteria: Array<{ key: string; weight: number }>;
}

export interface SearchProfile {
  id: string;
  code: string;
  name: string;
  intent: string;
  entityType: string;
  config: SearchProfileConfig;
  scoringProfile: SearchProfileScoring | null;
  version: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  updatedAt: string;
}

interface SearchProfileRow {
  id: string;
  code: string;
  name: string;
  intent: string;
  entity_type: string;
  config: Partial<SearchProfileConfig> | null;
  scoring_profile: SearchProfileScoring | null;
  version: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  updated_at: string;
}

function mapRow(row: SearchProfileRow): SearchProfile {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    intent: row.intent,
    entityType: row.entity_type,
    config: {
      requiredFilters: row.config?.requiredFilters ?? [],
      optionalFilters: row.config?.optionalFilters ?? [],
      defaultFilters: row.config?.defaultFilters ?? {},
      queryTemplates: row.config?.queryTemplates ?? [],
      preferredSources: row.config?.preferredSources ?? [],
      verificationRules: row.config?.verificationRules ?? [],
      exclusionRules: row.config?.exclusionRules ?? [],
      synonyms: row.config?.synonyms ?? {},
      outputFields: row.config?.outputFields ?? [],
    },
    scoringProfile: row.scoring_profile && Object.keys(row.scoring_profile).length ? row.scoring_profile : null,
    version: row.version,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

/** Server-side (chat route): client RLS-scoped từ authenticateChatUser(). */
export async function getActiveProfile(
  client: SupabaseClient,
  entityType: string,
  organizationId: string = SEARCH_PROFILE_ORGANIZATION_ID,
): Promise<SearchProfile | null> {
  const { data, error } = await client
    .from("search_profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("entity_type", entityType)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (error) {
    console.error("[search-profiles] getActiveProfile failed:", error);
    return null;
  }
  return data ? mapRow(data as SearchProfileRow) : null;
}

/**
 * Server-side: tất cả profile ACTIVE của tổ chức. Dùng để bổ sung ngữ cảnh vào system prompt
 * TRƯỚC khi biết DeepSeek sẽ chọn partner_type nào (vòng 1 tool-calling) - vì vậy nạp toàn bộ
 * profile ACTIVE thay vì tra theo entityType (chỉ tra theo entityType được khi đã có kết quả
 * tool, dùng cho applyExclusionRules).
 */
export async function listActiveProfiles(
  client: SupabaseClient,
  organizationId: string = SEARCH_PROFILE_ORGANIZATION_ID,
): Promise<SearchProfile[]> {
  const { data, error } = await client
    .from("search_profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "ACTIVE");
  if (error) {
    console.error("[search-profiles] listActiveProfiles failed:", error);
    return [];
  }
  return (data ?? []).map((row) => mapRow(row as SearchProfileRow));
}

/** Chuyển profile thành đoạn text bổ sung vào system prompt của agent chat. */
export function profileToPromptContext(profile: SearchProfile): string {
  const lines: string[] = [];
  const synonymEntries = Object.entries(profile.config.synonyms);
  if (synonymEntries.length) {
    lines.push("Từ đồng nghĩa cho loại đối tác này (hiểu là tương đương):");
    for (const [canonical, words] of synonymEntries) lines.push(`  - ${canonical}: ${words.join(", ")}`);
  }
  if (profile.config.queryTemplates.length) {
    lines.push(`Gợi ý cách đặt câu tìm kiếm (không bắt buộc theo đúng mẫu): ${profile.config.queryTemplates.join(" | ")}`);
  }
  if (profile.config.exclusionRules.length) {
    lines.push(`Loại bỏ kết quả nếu: ${profile.config.exclusionRules.join("; ")}`);
  }
  if (lines.length === 0) return "";
  return `\n\nHồ sơ tìm kiếm "${profile.name}" (${profile.code}, v${profile.version}):\n${lines.join("\n")}`;
}

/** Gộp ngữ cảnh của nhiều profile ACTIVE (Phase 1 thường chỉ có 1) cho system prompt. */
export function profilesToPromptContext(profiles: SearchProfile[]): string {
  return profiles.map(profileToPromptContext).filter(Boolean).join("");
}

const EXCLUSION_KEYWORD_HINTS: Record<string, string[]> = {
  "đã ngừng hoạt động": ["ngừng hoạt động", "đã giải thể", "ngừng kinh doanh"],
  "không đúng ngành may mặc": [],
};

/**
 * Lọc hậu kiểm NHẸ theo exclusionRules - chỉ loại các trường hợp có tín hiệu rõ ràng trong
 * dữ liệu đã thu thập (VD ghi chú "đã ngừng hoạt động"). KHÔNG suy đoán/loại theo cảm tính vì
 * dữ liệu đầu vào đã qua postProcessCandidates() lọc chính; đây chỉ là lớp bổ sung mỏng.
 */
export function applyExclusionRules<T extends DirectSearchCandidate>(candidates: T[], profile: SearchProfile | null): T[] {
  if (!profile || profile.config.exclusionRules.length === 0) return candidates;
  const activeHints = profile.config.exclusionRules.flatMap((rule) => EXCLUSION_KEYWORD_HINTS[rule] ?? []);
  if (activeHints.length === 0) return candidates;
  return candidates.filter((candidate) => {
    const haystack = `${candidate.legalName} ${candidate.companyIntroduction ?? ""} ${candidate.operatingStatus ?? ""}`.toLowerCase();
    return !activeHints.some((hint) => haystack.includes(hint.toLowerCase()));
  });
}

/** Client-side (trang Cấu hình AI Agent) - danh sách profile để admin xem/duyệt. */
export async function listSearchProfiles(): Promise<SearchProfile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("search_profiles")
    .select("*")
    .eq("organization_id", SEARCH_PROFILE_ORGANIZATION_ID)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as SearchProfileRow));
}

export async function setSearchProfileStatus(id: string, status: SearchProfile["status"]): Promise<void> {
  if (!supabase) throw new Error("Chưa kết nối Supabase");
  const { error } = await supabase
    .from("search_profiles")
    .update({ status })
    .eq("id", id)
    .eq("organization_id", SEARCH_PROFILE_ORGANIZATION_ID);
  if (error) throw error;
}
