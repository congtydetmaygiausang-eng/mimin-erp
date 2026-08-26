"use client";

// @codex MIMIN GROUP - ô tìm kiếm đối tác bằng AI Agent (tool-calling qua
// /api/v1/mimin-group/agent/chat), đặt ở tab Tổng quan. Dùng chung SupplierResultCard
// với AiDiscoveryTab để không lặp lại UI kết quả tìm kiếm.
//
// Bộ chọn điều kiện (chip đa lựa chọn kiểu bộ lọc cửa hàng online): người dùng bấm nhiều
// chip (loại đối tác, chuyên môn, khu vực, MOQ) ghép thành 1 câu, có thể gõ thêm từ khóa tự
// do, chỉ chạy tìm kiếm khi bấm "Tìm kiếm" (không tự tìm khi bấm từng chip). Mỗi lượt tìm
// vẫn ghi vào ai_search_history như bình thường (search-engine.ts) - đó là cơ chế "học lại
// nhu cầu" hiện có: loadLearningProfile() đọc lịch sử duyệt/loại để tinh chỉnh câu tìm tiếp
// theo, và Search Profile (Cấu hình AI Agent) là nơi admin duyệt các tinh chỉnh đó.

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Boxes, Building2, Factory, Layers, MapPin, Package, RefreshCw, Search, Sparkles, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { SupplierResultCard } from "@/components/sourcing/SupplierResultCard";
import { directCandidateSaveKey, saveDirectSearchCandidates, type DirectSearchCandidate } from "@/lib/production-discovery";
import { ensureCompanyProfileFromSearch } from "@/lib/production-company-profile";
import { ROLE_LABELS, type ProductionPartnerRole } from "@/lib/production-network";
import { MANG_LUOI_DANH_MUC } from "@/lib/data/mang-luoi-danh-muc";
import { buildAgentChatMessages } from "@/lib/sourcing/agent-chat-contract";
import { normalizeAgentSearchPayload } from "@/lib/sourcing/gate4-agent-company-contract";

export type PartnerTypeChip = "factory" | "supplier" | "customer";

const PARTNER_TYPE_OPTIONS: { value: PartnerTypeChip; label: string; role: ProductionPartnerRole; icon: typeof Factory }[] = [
  { value: "factory", label: "Xưởng sản xuất", role: "SATELLITE_PROCESSOR", icon: Factory },
  { value: "supplier", label: "Nhà cung cấp", role: "MATERIAL_SUPPLIER", icon: Boxes },
  { value: "customer", label: "Khách hàng", role: "CUSTOMER", icon: Building2 },
];

const REGION_OPTIONS = ["TP.HCM", "Bình Dương", "Đồng Nai", "Long An", "Hà Nội"];
const MOQ_OPTIONS = [
  { label: "100", value: 100 },
  { label: "300", value: 300 },
  { label: "500", value: 500 },
  { label: "1.000+", value: 1000 },
];

function specialtyOptionsFor(partnerType: PartnerTypeChip): string[] {
  if (partnerType === "factory") return MANG_LUOI_DANH_MUC.SATELLITE_PROCESSOR;
  if (partnerType === "customer") return MANG_LUOI_DANH_MUC.CUSTOMER;
  return Array.from(new Set([...MANG_LUOI_DANH_MUC.MATERIAL_SUPPLIER, ...MANG_LUOI_DANH_MUC.PACKAGING_FINISHER]));
}

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

export default function AgentSearchBox({
  defaultPartnerType,
  lockPartnerType = false,
}: {
  defaultPartnerType?: PartnerTypeChip;
  lockPartnerType?: boolean;
} = {}) {
  const router = useRouter();
  const [partnerType, setPartnerType] = useState<PartnerTypeChip | null>(defaultPartnerType ?? null);
  const [specialties, setSpecialties] = useState<Set<string>>(new Set());
  const [region, setRegion] = useState("");
  const [moq, setMoq] = useState<number | null>(null);
  const [extraKeywords, setExtraKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [results, setResults] = useState<AgentCandidate[]>([]);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [savingKey, setSavingKey] = useState("");
  const [openingKey, setOpeningKey] = useState("");
  const [followUp, setFollowUp] = useState("");
  const requestId = useRef(0);

  const specialtyOptions = useMemo(() => (partnerType ? specialtyOptionsFor(partnerType) : []), [partnerType]);

  const composedMessage = useMemo(() => {
    if (!partnerType) return "";
    const typeLabel = PARTNER_TYPE_OPTIONS.find((option) => option.value === partnerType)?.label ?? "";
    const parts: string[] = [`Tìm ${typeLabel.toLowerCase()}`];
    if (specialties.size) parts.push(`chuyên ${Array.from(specialties).join(", ")}`);
    if (region.trim()) parts.push(`ở ${region.trim()}`);
    if (moq !== null) parts.push(`MOQ tối thiểu ${moq.toLocaleString("vi-VN")}`);
    let message = parts.join(" ");
    if (extraKeywords.trim()) message = `${message}, ${extraKeywords.trim()}`;
    return message;
  }, [partnerType, specialties, region, moq, extraKeywords]);

  const readyToSearch = Boolean(partnerType && region.trim());

  const toggleSpecialty = (value: string) => {
    setSpecialties((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const resetBuilder = () => {
    setPartnerType(null);
    setSpecialties(new Set());
    setRegion("");
    setMoq(null);
    setExtraKeywords("");
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    const messages = buildAgentChatMessages(bubbles, trimmed);
    setBubbles((current) => [...current, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      const response = await fetch("/api/v1/mimin-group/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages, lastResults: results }),
      });
      const data = (await response.json()) as ChatApiResponse;
      if (!response.ok) throw new Error(data.error ?? "AI Search Agent gặp lỗi");
      if (requestId.current !== currentRequestId) return;
      setBubbles((current) => [...current, { role: "assistant", content: data.reply ?? "Đã xử lý xong." }]);
      if (data.results) {
        // Gate 4 consumer boundary: Tổng quan kiểm chứng lại cùng contract với
        // Tìm nâng cao trước khi hiển thị, kể cả khi payload chat bị thay đổi.
        const gate4Payload = normalizeAgentSearchPayload<
          AgentCandidate,
          NonNullable<ChatApiResponse["results"]>
        >(data.results);
        setResults(gate4Payload.candidates);
      }
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

  const handleConfirmSearch = () => {
    if (!readyToSearch) {
      toast.error("Chọn ít nhất Loại đối tác và Khu vực trước khi tìm kiếm");
      return;
    }
    void send(composedMessage);
  };

  const handleSendFollowUp = () => {
    const trimmed = followUp.trim();
    if (!trimmed) return;
    void send(trimmed);
    setFollowUp("");
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
          <p className="text-xs opacity-60">Bấm chọn điều kiện bên dưới, có thể gõ thêm từ khóa, rồi bấm "Tìm kiếm".</p>
        </div>
      </div>

      <div className="space-y-3.5">
        {lockPartnerType ? (
          <div className="text-xs font-medium">
            Đang tìm: <span className="text-brand-700">{PARTNER_TYPE_OPTIONS.find((option) => option.value === partnerType)?.label ?? ""}</span>
          </div>
        ) : (
          <div>
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
              <Building2 className="w-3.5 h-3.5" />Loại đối tác <span className="text-rose-500 normal-case font-normal">*</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PARTNER_TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = partnerType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={loading}
                    onClick={() => { setPartnerType(option.value); setSpecialties(new Set()); }}
                    className={`text-xs rounded-xl border px-3 py-2 font-semibold transition disabled:opacity-50 inline-flex items-center gap-1.5 ${active ? "text-white border-transparent shadow" : "border-slate-200 text-slate-600 hover:border-brand-300 dark:text-slate-300"}`}
                    style={active ? { background: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)" } : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" />{option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {partnerType && (
          <div>
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
              <Layers className="w-3.5 h-3.5" />Chuyên môn / sản phẩm
            </span>
            <div className="flex flex-wrap gap-1.5">
              {specialtyOptions.map((option) => {
                const active = specialties.has(option);
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={loading}
                    onClick={() => toggleSpecialty(option)}
                    className={`text-xs rounded-full border px-2.5 py-1 transition disabled:opacity-50 ${active ? "bg-brand-500 text-white border-brand-500" : "border-slate-200 text-slate-600 hover:border-brand-300 dark:text-slate-300"}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
            <MapPin className="w-3.5 h-3.5" />Khu vực <span className="text-rose-500 normal-case font-normal">*</span>
          </span>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {REGION_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                disabled={loading}
                onClick={() => setRegion(option)}
                className={`text-xs rounded-full border px-2.5 py-1 transition disabled:opacity-50 ${region === option ? "bg-brand-500 text-white border-brand-500" : "border-slate-200 text-slate-600 hover:border-brand-300 dark:text-slate-300"}`}
              >
                {option}
              </button>
            ))}
          </div>
          <input
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            disabled={loading}
            className="input text-xs"
            placeholder="Hoặc gõ khu vực khác (VD: Quận 12, TP.HCM)"
          />
        </div>

        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
            <Package className="w-3.5 h-3.5" />MOQ tối thiểu <span className="normal-case font-normal opacity-60">(không bắt buộc)</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {MOQ_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={loading}
                onClick={() => setMoq((current) => (current === option.value ? null : option.value))}
                className={`text-xs rounded-full border px-2.5 py-1 transition disabled:opacity-50 ${moq === option.value ? "bg-brand-500 text-white border-brand-500" : "border-slate-200 text-slate-600 hover:border-brand-300 dark:text-slate-300"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Từ khóa khác <span className="normal-case font-normal opacity-60">(không bắt buộc)</span></span>
          <input
            value={extraKeywords}
            onChange={(event) => setExtraKeywords(event.target.value)}
            disabled={loading}
            className="input mt-1.5 text-xs"
            placeholder="VD: có chứng nhận OEKO-TEX, nhận đơn gấp..."
          />
        </label>

        {composedMessage && (
          <div
            className="rounded-xl border px-3.5 py-2.5 text-xs text-brand-900 dark:text-brand-100"
            style={{ borderColor: "var(--border)", background: "linear-gradient(135deg, rgba(13,148,136,0.08), rgba(6,182,212,0.08))" }}
          >
            <span className="opacity-60">Sẽ tìm: </span><b>{composedMessage}</b>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleConfirmSearch}
            disabled={loading || !readyToSearch}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 flex-1 sm:flex-none py-3"
          >
            <Search className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} /> {loading ? "Đang tìm..." : "Tìm kiếm ngay"}
          </button>
          {(partnerType || region || specialties.size > 0 || moq !== null || extraKeywords) && (
            <button type="button" onClick={resetBuilder} disabled={loading} className="btn-secondary text-xs">
              Xóa điều kiện
            </button>
          )}
        </div>
        {!readyToSearch && <span className="text-[11px] opacity-50 block">Chọn Loại đối tác + Khu vực để bật nút tìm kiếm</span>}
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
          <div className="flex items-center gap-2 pt-1">
            <input
              value={followUp}
              onChange={(event) => setFollowUp(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !loading) {
                  event.preventDefault();
                  handleSendFollowUp();
                }
              }}
              disabled={loading}
              className="input text-xs flex-1"
              placeholder="Hỏi thêm hoặc lọc lại kết quả vừa tìm (VD: chỉ lấy công ty có website)..."
            />
            <button
              type="button"
              onClick={handleSendFollowUp}
              disabled={loading || !followUp.trim()}
              className="btn-secondary text-xs shrink-0"
            >
              Gửi
            </button>
          </div>
        </div>
      )}

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
