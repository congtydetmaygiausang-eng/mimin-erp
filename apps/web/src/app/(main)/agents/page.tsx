"use client";

import { useState, useEffect } from "react";
import { Bot, Search, Cpu, DollarSign, Clock, ChevronRight, AlertCircle, Activity, MessageSquare, Volume2 } from "lucide-react";
import Link from "next/link";
import { AGENT_PERSONAS, AGENT_IDS_V6, type AgentPersona } from "@/lib/agent-personas";
import { getAgentSummaryToday, type AgentSummary } from "@/lib/agent-usage-tracker";

// Đọc to lời giới thiệu bằng Web Speech API (giọng trình duyệt) - giống hệt
// agents-chat/page.tsx, tách riêng vì 2 trang không share state chat. Bỏ
// markdown trước khi đọc để không đọc luôn ký tự định dạng.
function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-•]\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

// AgentPersona (agent-personas.ts) khong co color/icon rieng cho 6 agent V6 -
// map cuc bo o day, dung chung voi /agents/[id] de nhat quan hien thi.
// "color" giờ chỉ dùng làm điểm nhấn nhỏ (badge/border), KHÔNG phủ cả card
// nữa - trước đây header card phủ gradient rực (violet-600, rose-600...) bị
// chê "màu quá nổi bật, chói mắt". accentText dùng cho border/badge nhẹ.
const V6_STYLE: Record<string, { color: string; icon: string; accentText: string }> = {
  mavis: { color: "from-violet-500 to-purple-600", icon: "🧭", accentText: "text-violet-700" },
  minh: { color: "from-sky-500 to-cyan-600", icon: "✂️", accentText: "text-sky-700" },
  lan: { color: "from-emerald-500 to-teal-600", icon: "📦", accentText: "text-emerald-700" },
  ha: { color: "from-amber-500 to-orange-600", icon: "💰", accentText: "text-amber-700" },
  vy: { color: "from-pink-500 to-rose-600", icon: "💬", accentText: "text-rose-700" },
  "mimin-help": { color: "from-slate-500 to-slate-600", icon: "❓", accentText: "text-slate-700" },
};

// Nền khu vực avatar - tông màu DỊU, khớp phông ảnh gốc của từng agent (đồng
// bộ với trang agents-chat) thay vì gradient rực phủ cả card như trước.
const AGENT_CARD_BG: Record<string, string> = {
  mavis: "bg-gradient-to-b from-slate-200 to-slate-300",
  minh: "bg-gradient-to-b from-orange-100 to-orange-200",
  lan: "bg-gradient-to-b from-stone-200 to-stone-300",
  ha: "bg-gradient-to-b from-pink-100 to-purple-200",
  vy: "bg-gradient-to-b from-slate-50 to-slate-200",
  "mimin-help": "bg-gradient-to-b from-rose-50 to-rose-100",
};
const AVATAR_FADE_MASK = "linear-gradient(to bottom, black 75%, transparent 100%)";

interface AgentRow {
  persona: AgentPersona;
  summary: AgentSummary | null;
}

export default function AgentsDashboardPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<AgentRow[]>(
    AGENT_IDS_V6.map((id) => ({ persona: AGENT_PERSONAS[id], summary: null }))
  );
  const [loading, setLoading] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const speakGreeting = (agentId: string, text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (speakingId === agentId) {
      setSpeakingId(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
    utterance.lang = "vi-VN";
    utterance.rate = 1;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(agentId);
    window.speechSynthesis.speak(utterance);
  };

  // Trang nay truoc day hien 26 "agent" gia (module-scoped, model Sonnet-4/
  // Haiku-3.5 khong co that) voi so lieu random moi 30s - khong khop voi he
  // thong dieu phoi that (agent-routing-rules.ts chi co 6 agent V6). Gio doc
  // dung 6 agent that + so lieu that tu Supabase (agent_usage_logs), khong
  // con random hay bia so.
  useEffect(() => {
    let active = true;
    (async () => {
      const results = await Promise.all(
        AGENT_IDS_V6.map(async (id) => ({
          persona: AGENT_PERSONAS[id],
          summary: await getAgentSummaryToday(id).catch(() => null),
        }))
      );
      if (active) {
        setRows(results);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.persona.name.toLowerCase().includes(q) || r.persona.agent_id.toLowerCase().includes(q) || r.persona.role_title.toLowerCase().includes(q);
  });

  const totalCalls = rows.reduce((s, r) => s + (r.summary?.callsToday || 0), 0);
  const totalCost = rows.reduce((s, r) => s + (r.summary?.costToday || 0), 0);
  const avgLatency = (() => {
    const withCalls = rows.filter((r) => (r.summary?.callsToday || 0) > 0);
    if (withCalls.length === 0) return 0;
    return withCalls.reduce((s, r) => s + (r.summary?.avgLatencyMs || 0), 0) / withCalls.length;
  })();

  return (
    <div className="min-h-screen p-3 md:p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-5 md:p-7 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-xs font-medium opacity-90 mb-1 flex items-center gap-2">
                <Bot className="w-3.5 h-3.5" /> MIMIN OS · AI Agents
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">🤖 Agent Dashboard</h1>
              <p className="text-sm opacity-95 mt-1 max-w-3xl">
                6 agent V6 đang điều phối thật (Mavis điều phối + Minh/Lan/Hà/Vy/MIMIN Help chuyên trách). Số liệu bên dưới lấy trực tiếp từ nhật ký sử dụng thật, không phải số giả lập.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                {rows.length}/{rows.length} Active
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : totalCalls.toLocaleString()}</div>
              <div className="opacity-90">Calls/ngày</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : `$${totalCost.toFixed(4)}`}</div>
              <div className="opacity-90">Cost/ngày</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : `${(avgLatency / 1000).toFixed(2)}s`}</div>
              <div className="opacity-90">Avg latency</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold">{rows.length}</div>
              <div className="opacity-90">Total agents</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm agent theo tên hoặc vai trò..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <AgentCard key={r.persona.agent_id} row={r} loading={loading} speakingId={speakingId} onSpeak={speakGreeting} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="card p-8 text-center text-slate-400">
            <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <div className="text-sm">Không tìm thấy agent nào</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// AGENT CARD
// ============================================
function AgentCard({
  row,
  loading,
  speakingId,
  onSpeak,
}: {
  row: AgentRow;
  loading: boolean;
  speakingId: string | null;
  onSpeak: (agentId: string, text: string) => void;
}) {
  const { persona, summary } = row;
  const style = V6_STYLE[persona.agent_id] || { color: "from-slate-500 to-slate-600", icon: "🤖", accentText: "text-slate-700" };
  const cardBg = AGENT_CARD_BG[persona.agent_id] || "bg-gradient-to-b from-slate-100 to-slate-200";
  const hasErrors = (summary?.errorCount || 0) > 0;
  const hasImg = persona.avatar.startsWith("/avatars/");
  const isSpeaking = speakingId === persona.agent_id;

  return (
    // Bấm card = vào thẳng chat riêng với agent này - trước đây trỏ tới
    // /agents/[id] (trang thống kê calls/latency/cost), phải bấm thêm nút
    // "Chat với ..." mới vào chat được, anh Sang muốn bấm 1 phát vào chat
    // luôn, không qua trang trung gian.
    <Link href={`/agents-chat?agent=${persona.agent_id}`}>
      <div className="card-hover group cursor-pointer overflow-hidden rounded-2xl border border-slate-200">
        {/* Avatar lớn - tông màu dịu khớp phông ảnh gốc, KHÔNG phủ gradient rực cả card nữa */}
        <div className={`relative h-44 ${cardBg}`}>
          {hasImg ? (
            <img
              src={persona.avatar}
              alt={persona.name}
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{ maskImage: AVATAR_FADE_MASK, WebkitMaskImage: AVATAR_FADE_MASK }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">{style.icon}</div>
          )}
          {/* Nút nghe lời giới thiệu - preventDefault/stopPropagation để không
              bị Link cha điều hướng sang chat khi bấm nút này. */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSpeak(persona.agent_id, persona.greeting);
            }}
            title="Nghe agent tự giới thiệu"
            className={`absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur shadow-sm transition ${
              isSpeaking ? "bg-sky-600 text-white" : "bg-white/80 text-slate-700 hover:bg-white"
            }`}
          >
            <Volume2 className={`w-4 h-4 ${isSpeaking ? "animate-pulse" : ""}`} />
          </button>
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-white/80 backdrop-blur rounded-full text-[10px] font-bold flex items-center gap-1 text-slate-700 shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Active
          </span>
        </div>

        <div className="px-3.5 pt-3 pb-1">
          <h3 className={`font-bold text-base ${style.accentText}`}>{persona.name}</h3>
          <p className="text-xs text-slate-500">{persona.role_title}</p>
        </div>

        {/* Body */}
        <div className="p-3.5 pt-2 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              {persona.model}
            </span>
            <span className="uppercase">{persona.provider}</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {persona.allowed_domains.slice(0, 3).map((d) => (
              <span key={d} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {d}
              </span>
            ))}
            {persona.allowed_domains.length > 3 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                +{persona.allowed_domains.length - 3}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-slate-50 rounded p-1.5">
              <div className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1">
                <Activity className="w-3 h-3 text-slate-400" />
                {loading ? "…" : summary?.callsToday ?? 0}
              </div>
              <div className="text-[9px] text-slate-500">calls/d</div>
            </div>
            <div className="bg-slate-50 rounded p-1.5">
              <div className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {loading ? "…" : `${((summary?.avgLatencyMs || 0) / 1000).toFixed(1)}s`}
              </div>
              <div className="text-[9px] text-slate-500">latency</div>
            </div>
            <div className="bg-slate-50 rounded p-1.5">
              <div className={`text-sm font-bold flex items-center justify-center gap-1 ${hasErrors ? "text-rose-600" : "text-emerald-600"}`}>
                {hasErrors ? <AlertCircle className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                {loading ? "…" : hasErrors ? summary?.errorCount : `$${(summary?.costToday || 0).toFixed(3)}`}
              </div>
              <div className="text-[9px] text-slate-500">{hasErrors ? "lỗi" : "cost/d"}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
            <span className="text-[10px] text-slate-500 group-hover:text-indigo-600 font-semibold flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Chat ngay <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
