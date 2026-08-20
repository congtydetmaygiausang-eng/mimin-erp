"use client";

import { useState, useEffect } from "react";
import { Bot, Search, Cpu, DollarSign, Clock, ChevronRight, AlertCircle, Activity } from "lucide-react";
import Link from "next/link";
import { AGENT_PERSONAS, AGENT_IDS_V6, type AgentPersona } from "@/lib/agent-personas";
import { getAgentSummaryToday, type AgentSummary } from "@/lib/agent-usage-tracker";

// AgentPersona (agent-personas.ts) khong co color/icon rieng cho 6 agent V6 -
// map cuc bo o day, dung chung voi /agents/[id] de nhat quan hien thi.
const V6_STYLE: Record<string, { color: string; icon: string }> = {
  mavis: { color: "from-violet-500 to-purple-600", icon: "🧭" },
  minh: { color: "from-sky-500 to-cyan-600", icon: "✂️" },
  lan: { color: "from-emerald-500 to-teal-600", icon: "📦" },
  ha: { color: "from-amber-500 to-orange-600", icon: "💰" },
  vy: { color: "from-pink-500 to-rose-600", icon: "💬" },
  "mimin-help": { color: "from-slate-500 to-slate-600", icon: "❓" },
};

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
            <AgentCard key={r.persona.agent_id} row={r} loading={loading} />
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
function AgentCard({ row, loading }: { row: AgentRow; loading: boolean }) {
  const { persona, summary } = row;
  const style = V6_STYLE[persona.agent_id] || { color: "from-slate-500 to-slate-600", icon: "🤖" };
  const hasErrors = (summary?.errorCount || 0) > 0;

  return (
    <Link href={`/agents/${persona.agent_id}`}>
      <div className="card-hover group cursor-pointer">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-br ${style.color} p-3 rounded-t-xl text-white`}>
          <div className="flex items-center justify-between mb-2">
            {persona.avatar.startsWith("/avatars/") ? (
              <span className="w-12 h-12 rounded-xl bg-white/20 ring-2 ring-white/40 overflow-hidden shrink-0">
                <img src={persona.avatar} alt={persona.name} className="w-full h-full object-cover object-top" />
              </span>
            ) : (
              <span className="text-3xl">{style.icon}</span>
            )}
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
              ● Active
            </span>
          </div>
          <h3 className="font-bold text-sm">{persona.name}</h3>
          <p className="text-[10px] opacity-90">{persona.role_title}</p>
        </div>

        {/* Body */}
        <div className="p-3 space-y-2">
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
              Chi tiết <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
