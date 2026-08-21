// @codex MIMIN GROUP - ghi nhật ký tìm kiếm AI (bảng ai_search_history/ai_search_results).
// Best-effort: lỗi khi ghi lịch sử không được làm hỏng kết quả tìm kiếm chính,
// nên mọi hàm ở đây nuốt lỗi và trả về null thay vì throw.

import type { SupabaseClient } from "@supabase/supabase-js";

export type SearchEntryPoint = "AGENT_CHAT" | "QUICK_CHIP" | "ADVANCED_FORM";
export type SearchHistoryStatus = "OK" | "ERROR" | "RATE_LIMITED";

export interface SearchHistoryCandidateSnapshot {
  legalName: string;
  address?: string | null;
  province?: string | null;
  district?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  taxCode?: string | null;
  resultTier?: string | null;
  confidence?: number | null;
  locationStatus?: string | null;
  distanceKm?: number | null;
  sourceUrl?: string | null;
  raw: unknown;
}

export interface RecordSearchHistoryParams {
  organizationId: string;
  userId: string | null;
  userEmail: string | null;
  entryPoint: SearchEntryPoint;
  queryText: string;
  toolName: string;
  structuredFilters: Record<string, unknown>;
  toolCalls?: unknown[];
  assistantReply?: string | null;
  provider: string;
  status: SearchHistoryStatus;
  errorMessage?: string | null;
  candidates: SearchHistoryCandidateSnapshot[];
}

/**
 * Ghi 1 lượt tìm kiếm + toàn bộ ứng viên trả về vào lịch sử. Trả về search_history_id
 * (để agent chat route đính kèm vào response) hoặc null nếu ghi thất bại - không throw.
 */
export async function recordSearchHistory(
  client: SupabaseClient,
  params: RecordSearchHistoryParams,
): Promise<string | null> {
  try {
    const { data: historyRow, error: historyError } = await client
      .from("ai_search_history")
      .insert({
        organization_id: params.organizationId,
        user_id: params.userId,
        user_email: params.userEmail,
        entry_point: params.entryPoint,
        query_text: params.queryText.slice(0, 2000),
        tool_name: params.toolName,
        structured_filters: params.structuredFilters,
        tool_calls: params.toolCalls ?? [],
        assistant_reply: params.assistantReply ?? null,
        provider: params.provider,
        result_count: params.candidates.length,
        status: params.status,
        error_message: params.errorMessage ?? null,
      })
      .select("id")
      .single();

    if (historyError || !historyRow) {
      console.error("[search-history] insert ai_search_history failed:", historyError);
      return null;
    }

    const historyId = historyRow.id as string;

    if (params.candidates.length > 0) {
      const rows = params.candidates.slice(0, 200).map((candidate) => ({
        search_history_id: historyId,
        organization_id: params.organizationId,
        legal_name: candidate.legalName,
        address: candidate.address ?? null,
        province: candidate.province ?? null,
        district: candidate.district ?? null,
        phone: candidate.phone ?? null,
        email: candidate.email ?? null,
        website: candidate.website ?? null,
        tax_code: candidate.taxCode ?? null,
        result_tier: candidate.resultTier ?? null,
        confidence: candidate.confidence ?? null,
        location_status: candidate.locationStatus ?? null,
        distance_km: candidate.distanceKm ?? null,
        source_url: candidate.sourceUrl ?? null,
        raw_candidate: candidate.raw ?? {},
      }));
      const { error: resultsError } = await client.from("ai_search_results").insert(rows);
      if (resultsError) console.error("[search-history] insert ai_search_results failed:", resultsError);
    }

    return historyId;
  } catch (error) {
    console.error("[search-history] unexpected error:", error);
    return null;
  }
}
