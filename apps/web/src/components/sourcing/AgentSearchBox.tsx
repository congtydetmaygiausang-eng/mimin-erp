"use client";

// @codex MIMIN GROUP - ô tìm kiếm đối tác bằng AI Agent (tool-calling qua
// /api/v1/mimin-group/agent/chat), đặt ở tab Tổng quan. Dùng chung SupplierResultCard
// với AiDiscoveryTab để không lặp lại UI kết quả tìm kiếm.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, RefreshCw, Search, Sparkles, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { SupplierResultCard } from "@/components/sourcing/SupplierResultCard";
import { directCandidateSaveKey, saveDirectSearchCandidates, type DirectSearchCandidate } from "@/lib/production-discovery";
import { ensureCompanyProfileFromSearch } from "@/lib/production-company-profile";
import { ROLE_LABELS, type ProductionPartnerRole } from "@/lib/production-network";

const QUICK_CHIPS: string[] = [
  "Tìm xưởng may áo polo ở TP.HCM",
  "Tìm xưởng cắt ở TP.HCM",
  "Tìm xưởng in ở TP.HCM",
  "Tìm xưởng thêu ở TP.HCM",
  "Tìm xưởng giặt ở TP.HCM",
  "Tìm nhà cung cấp vải ở TP.HCM",
  "Tìm nhà cung cấp bo cổ ở TP.HCM",
  "Tìm nhà cung cấp dây kéo ở TP.HCM",
  "Tìm nhà cung cấp nhãn mác ở TP.HCM",
  "Tìm nhà cung cấp bao bì ở TP.HCM",
];

type AgentCandidate = DirectSearchCandidate & { role: ProductionPartnerRole; roleLabel: string; resultIndex: number };

interface ChatBubble {
  role: "user" | "assistant";
  content: string;
}

interface ChatApiResponse {
  reply?: string;
  error?: string;
  results?: { candidates: AgentCandidate[]; diagnostics: unknown[]; provider: string[] } | null;
}

export default function AgentSearchBox() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [results, setResults] = useState<AgentCandidate[]>([]);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [savingKey, setSavingKey] = useState("");
  const [openingKey, setOpeningKey] = useState("");
  const requestId = useRef(0);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    const history = bubbles.slice(-6).map((bubble) => ({ role: bubble.role, content: bubble.content }));
    setBubbles((current) => [...current, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      const response = await fetch("/api/v1/mimin-group/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = (await response.json()) as ChatApiResponse;
      if (!response.ok) throw new Error(data.error ?? "AI Search Agent gặp lỗi");
      if (requestId.current !== currentRequestId) return;
      setBubbles((current) => [...current, { role: "assistant", content: data.reply ?? "Đã xử lý xong." }]);
      if (data.results) setResults(data.results.candidates);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI Search Agent gặp lỗi";
      toast.error(message);
      if (requestId.current === currentRequestId) {
        setBubbles((current) => [...current, { role: "assistant", content: `Xin lỗi, có lỗi xảy ra: ${message}` }]);
      }
    } finally {
      if (requestId.current === currentRequestId) setLoading(false);
    }
  };

  const saveOne = async (item: AgentCandidate, key: string) => {
    setSavingKey(key);
    try {
      const result = await saveDirectSearchCandidates([item], item.role, `${item.legalName} | AI Agent`, "MIMIN_AGENT");
      if (result.savedCount) {
        setSavedKeys((current) => new Set(current).add(key));
        toast.success(`Đã lưu "${item.legalName}" vào vùng chờ duyệt`);
      } else {
        toast.info("Công ty này đã được lưu trước đó");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được");
    } finally {
      setSavingKey("");
    }
  };

  const viewDetails = async (item: AgentCandidate, key: string) => {
    setOpeningKey(key);
    try {
      const profileId = await ensureCompanyProfileFromSearch(item, item.role, "MIMIN_AGENT");
      router.push(`/mang-luoi-san-xuat/cong-ty?id=${encodeURIComponent(profileId)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không mở được hồ sơ công ty");
      setOpeningKey("");
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-600 text-white flex items-center justify-center shrink-0">
          <Sparkles className="w-4.5 h-4.5" />
        </div>
        <div>
          <h2 className="font-bold">Tìm kiếm đối tác với AI</h2>
          <p className="text-xs opacity-60">Nhập ngôn ngữ tự nhiên — AI Agent tự chuyển thành bộ lọc và tìm kiếm thật trên internet.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={loading}
            onClick={() => void send(chip)}
            className="text-xs rounded-full border px-2.5 py-1 text-slate-600 hover:border-brand-300 hover:text-brand-700 disabled:opacity-50 dark:text-slate-300"
            style={{ borderColor: "var(--border)" }}
          >
            {chip.replace("Tìm ", "")}
          </button>
        ))}
      </div>

      {bubbles.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
          {bubbles.map((bubble, index) => (
            <div key={index} className={`flex items-start gap-2 text-sm ${bubble.role === "user" ? "justify-end" : ""}`}>
              {bubble.role === "assistant" && <Bot className="w-4 h-4 mt-0.5 shrink-0 text-brand-600" />}
              <div className={`rounded-xl px-3 py-2 max-w-[85%] ${bubble.role === "user" ? "bg-brand-500 text-white" : "bg-slate-100 dark:bg-white/10"}`}>
                {bubble.content}
              </div>
              {bubble.role === "user" && <UserIcon className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm opacity-60">
              <Bot className="w-4 h-4 shrink-0 text-brand-600" />
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang tìm kiếm...
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="input pl-9"
            placeholder="VD: Tìm xưởng may áo polo ở TP.HCM, nhận đơn từ 500 áo, năng lực 20.000 áo/tháng"
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary inline-flex items-center gap-2 shrink-0">
          <Search className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} /> {loading ? "Đang tìm..." : "Tìm kiếm"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="space-y-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-semibold text-sm">Kết quả ({results.length})</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {results.map((item) => {
              const key = `${directCandidateSaveKey(item)}-${item.resultIndex}`;
              return (
                <div key={key}>
                  <div className="text-[10px] font-semibold text-brand-700 mb-1">{ROLE_LABELS[item.role] ?? item.roleLabel}</div>
                  <SupplierResultCard
                    item={item}
                    opening={openingKey === key}
                    verifying={false}
                    saving={savingKey === key}
                    selected={selectedKeys.has(key)}
                    saved={savedKeys.has(key)}
                    onToggle={() =>
                      setSelectedKeys((current) => {
                        const next = new Set(current);
                        if (next.has(key)) next.delete(key);
                        else next.add(key);
                        return next;
                      })
                    }
                    onViewDetails={() => void viewDetails(item, key)}
                    onSaveOne={() => void saveOne(item, key)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
