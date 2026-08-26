"use client";

// @codex MIMIN GROUP - Lịch sử tìm kiếm: đọc bảng ai_search_history/ai_search_results
// (ghi bởi search-engine.ts qua recordSearchHistory) để xem lại không cần tìm lại.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Bot, Building2, ChevronDown, ChevronUp, CircleSlash2, ClipboardCheck, Clock, Database, FileCheck2, Gauge, GitBranch, ListChecks, MapPin, Network, RefreshCw, Scale, Search, Sparkles, Timer, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase/client";
import { SupplierResultCard } from "@/components/sourcing/SupplierResultCard";
import { directCandidateSaveKey, saveDirectSearchCandidates, type DirectSearchCandidate } from "@/lib/production-discovery";
import { ensureCompanyProfileFromSearch } from "@/lib/production-company-profile";
import { PARTNER_ROLES, ROLE_LABELS, type ProductionPartnerRole } from "@/lib/production-network";


const PAGE_SIZE = 15;

interface HistoryRow {
  id: string;
  created_at: string;
  user_email: string | null;
  entry_point: "AGENT_CHAT" | "QUICK_CHIP" | "ADVANCED_FORM";
  query_text: string;
  structured_filters: { role?: string; location?: string; radiusKm?: number } | null;
  provider: string | null;
  result_count: number;
  status: "OK" | "ERROR" | "RATE_LIMITED";
  assistant_reply: string | null;
  tool_calls: unknown;
}

interface ResultRow {
  id: string;
  raw_candidate: DirectSearchCandidate;
}

const ENTRY_POINT_META: Record<HistoryRow["entry_point"], { label: string; icon: typeof Bot }> = {
  AGENT_CHAT: { label: "AI Agent (chat)", icon: Bot },
  QUICK_CHIP: { label: "Gợi ý nhanh", icon: Sparkles },
  ADVANCED_FORM: { label: "Tìm nâng cao", icon: Search },
};

function partnerRoleFromFilters(filters: HistoryRow["structured_filters"]): ProductionPartnerRole {
  const role = filters?.role;
  return role && (PARTNER_ROLES as readonly string[]).includes(role) ? (role as ProductionPartnerRole) : "SATELLITE_PROCESSOR";
}

export default function LichSuTimKiemPage() {
  const router = useRouter();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string>("");
  const [expandedResults, setExpandedResults] = useState<ResultRow[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [openingKey, setOpeningKey] = useState("");

  const load = useCallback(async (targetPage: number) => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const from = (targetPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE;
      const { data, error } = await supabase
        .from("ai_search_history")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      const list = (data ?? []) as HistoryRow[];
      setHasMore(list.length > PAGE_SIZE);
      setRows(list.slice(0, PAGE_SIZE));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được lịch sử tìm kiếm");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  const toggleExpand = async (row: HistoryRow) => {
    if (expandedId === row.id) {
      setExpandedId("");
      setExpandedResults([]);
      return;
    }
    setExpandedId(row.id);
    setLoadingResults(true);
    try {
      if (!supabase) throw new Error("Chưa kết nối Supabase");
      const { data, error } = await supabase
        .from("ai_search_results")
        .select("id, raw_candidate")
        .eq("search_history_id", row.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setExpandedResults((data ?? []) as ResultRow[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được kết quả đã lưu");
      setExpandedResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  const saveOne = async (row: HistoryRow, candidate: DirectSearchCandidate, key: string) => {
    setSavingKey(key);
    try {
      const role = partnerRoleFromFilters(row.structured_filters);
      const result = await saveDirectSearchCandidates([candidate], role, row.query_text, "HISTORY_REPLAY");
      if (result.savedCount) {
        setSavedKeys((current) => new Set(current).add(key));
        toast.success(`Đã lưu "${candidate.legalName}" vào vùng chờ duyệt`);
      } else {
        toast.info("Công ty này đã được lưu trước đó");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được");
    } finally {
      setSavingKey("");
    }
  };

  const viewDetails = async (row: HistoryRow, candidate: DirectSearchCandidate, key: string) => {
    setOpeningKey(key);
    try {
      const role = partnerRoleFromFilters(row.structured_filters);
      const profileId = await ensureCompanyProfileFromSearch(candidate, role, "HISTORY_REPLAY");
      router.push(`/mang-luoi-san-xuat/cong-ty?id=${encodeURIComponent(profileId)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không mở được hồ sơ công ty");
      setOpeningKey("");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        moduleLabel="MIMIN GROUP"
        title="Lịch sử tìm kiếm"
        subtitle="Toàn bộ lượt tìm kiếm AI (chat, gợi ý nhanh, tìm nâng cao) — xem lại kết quả không cần tìm lại."
        icon={<Clock className="w-5 h-5" />}
        actions={
          <div className="flex gap-2">
            <Link href="/mang-luoi-san-xuat/cong-ty-da-luu" className="btn-secondary inline-flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Vùng chờ duyệt
            </Link>
            <button onClick={() => void load(page)} className="btn-secondary inline-flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
            </button>
          </div>
        }
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center opacity-70">Đang tải lịch sử...</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <Clock className="w-12 h-12 text-slate-300" />
            <h3 className="mt-3 font-bold">Chưa có lượt tìm kiếm nào</h3>
            <p className="mt-1 text-sm opacity-60">Dùng ô "Tìm kiếm đối tác với AI" ở tab Tổng quan để bắt đầu.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {rows.map((row) => {
              const meta = ENTRY_POINT_META[row.entry_point] ?? ENTRY_POINT_META.ADVANCED_FORM;
              const Icon = meta.icon;
              const isExpanded = expandedId === row.id;
              const role = partnerRoleFromFilters(row.structured_filters);
              return (
                <div key={row.id}>
                  <button
                    type="button"
                    onClick={() => void toggleExpand(row)}
                    className="w-full text-left px-4 py-3 flex flex-wrap items-center gap-3 hover:bg-slate-50/60 dark:hover:bg-white/5"
                  >
                    <span className="text-[10px] rounded-full bg-slate-100 dark:bg-white/10 px-2 py-1 inline-flex items-center gap-1 shrink-0">
                      <Icon className="w-3 h-3" /> {meta.label}
                    </span>
                    <span className="font-medium min-w-0 flex-1 truncate">{row.query_text}</span>
                    <span className="text-xs opacity-60 shrink-0">{ROLE_LABELS[role]}</span>
                    <span className="text-xs opacity-60 shrink-0">{row.structured_filters?.location ?? ""}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${row.status === "OK" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {row.result_count} kết quả
                    </span>
                    <span className="text-[11px] opacity-50 shrink-0">{new Date(row.created_at).toLocaleString("vi-VN")}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 bg-slate-50/40 dark:bg-white/[0.02]">
                      {row.assistant_reply && (
                        <p className="text-sm rounded-lg bg-white dark:bg-white/5 border p-3" style={{ borderColor: "var(--border)" }}>{row.assistant_reply}</p>
                      )}
                      {loadingResults ? (
                        <div className="text-sm opacity-60 py-4 text-center">Đang tải kết quả...</div>
                      ) : expandedResults.length === 0 ? (
                        <div className="text-sm opacity-60 py-4 text-center">Không có kết quả nào được lưu cho lượt tìm này.</div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-3">
                          {expandedResults.map((result) => {
                            const key = `${row.id}-${result.id}`;
                            const candidate = result.raw_candidate;
                            const saveKey = candidate ? `${directCandidateSaveKey(candidate)}-${key}` : key;
                            return (
                              <SupplierResultCard
                                key={result.id}
                                item={candidate}
                                opening={openingKey === saveKey}
                                verifying={false}
                                saving={savingKey === saveKey}
                                selected={selectedKeys.has(saveKey)}
                                saved={savedKeys.has(saveKey)}
                                onToggle={() =>
                                  setSelectedKeys((current) => {
                                    const next = new Set(current);
                                    if (next.has(saveKey)) next.delete(saveKey);
                                    else next.add(saveKey);
                                    return next;
                                  })
                                }
                                onViewDetails={() => void viewDetails(row, candidate, saveKey)}
                                onSaveOne={() => void saveOne(row, candidate, saveKey)}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3 border-t text-xs" style={{ borderColor: "var(--border)" }}>
          <span className="opacity-60">Trang {page}</span>
          <div className="flex items-center gap-1.5">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary px-2.5 py-1 disabled:opacity-40">Trước</button>
            <button disabled={!hasMore} onClick={() => setPage((p) => p + 1)} className="btn-secondary px-2.5 py-1 disabled:opacity-40">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}
