"use client";

import { useState, useEffect } from "react";
import { Bot, Search, Activity, Cpu, DollarSign, Clock, ChevronRight, Pause, Play, Settings, TrendingUp, AlertCircle, CheckCircle2, Users, Sparkles } from "lucide-react";
import Link from "next/link";
import { AGENT_PERSONAS, AGENT_IDS_V6 } from "@/lib/agent-personas";
import { getAgentSummaryToday, type AgentSummary } from "@/lib/agent-usage-tracker";

// ============================================
// 6 AGENT CARD - theo chốt của sếp Sang (2026-08-05)
// Mavis + Minh + Lan + Hà + Vy + MIMIN Help
// ============================================
interface AgentDisplay {
  id: string;
  name: string;
  shortName: string;
  role: string;
  model: string;
  color: string;
  icon: string;
  avatar?: string;
  description: string;
}

const AGENTS_DISPLAY: AgentDisplay[] = [
  {
    id: "mavis",
    name: "Mavis",
    shortName: "Mavis",
    role: "Điều phối Tổng quan",
    model: "DeepSeek Chat",
    color: "from-violet-500 to-purple-600",
    icon: "🧠",
    avatar: "/avatars/mavis.png",
    description: "Chat chung + Route sang agent chuyên trách",
  },
  {
    id: "minh",
    name: "Minh",
    shortName: "Minh",
    role: "Sản xuất (E2E)",
    model: "DeepSeek Chat",
    color: "from-amber-500 to-orange-600",
    icon: "✂️",
    avatar: "/avatars/minh.png",
    description: "KH → Lệnh cắt → Công đoạn → Nhập kho TP",
  },
  {
    id: "lan",
    name: "Lan",
    shortName: "Lan",
    role: "Kho & Bán hàng",
    model: "DeepSeek Chat",
    color: "from-teal-500 to-cyan-600",
    icon: "🏭",
    avatar: "/avatars/lan.png",
    description: "Nhập kho → Tồn → Đơn hàng → Giao nhận",
  },
  {
    id: "ha",
    name: "Hà",
    shortName: "Hà",
    role: "Tài chính",
    model: "DeepSeek Chat",
    color: "from-emerald-500 to-green-600",
    icon: "💰",
    avatar: "/avatars/ha.png",
    description: "COGS → Công nợ → Lương → Báo cáo TC",
  },
  {
    id: "vy",
    name: "Vy",
    shortName: "Vy",
    role: "Chăm sóc khách hàng",
    model: "DeepSeek Chat",
    color: "from-pink-500 to-rose-600",
    icon: "💬",
    avatar: "/avatars/vy.png",
    description: "Tư vấn KH + Khiếu nại + Đổi trả",
  },
  {
    id: "mimin-help",
    name: "MIMIN Help",
    shortName: "Help",
    role: "Hỗ trợ hệ thống",
    model: "DeepSeek Chat",
    color: "from-sky-500 to-blue-600",
    icon: "🛟",
    avatar: "/avatars/mimin-help.png",
    description: "Hướng dẫn + Phân quyền + Giải thích lỗi",
  },
];

export default function AgentsDashboardPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [summaries, setSummaries] = useState<Record<string, AgentSummary>>({});
  const [loading, setLoading] = useState(true);

  // Fetch real stats from Supabase
  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      setLoading(true);
      const results: Record<string, AgentSummary> = {};
      await Promise.all(
        AGENTS_DISPLAY.map(async (a) => {
          const summary = await getAgentSummaryToday(a.id);
          results[a.id] = summary;
        })
      );
      if (mounted) {
        setSummaries(results);
        setLoading(false);
      }
    }
    fetchAll();
    // Auto-refresh mỗi 60s (không random)
    const interval = setInterval(fetchAll, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const filtered = AGENTS_DISPLAY.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.role.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && summaries[a.id]?.status !== filterStatus) return false;
    return true;
  });

  // Tổng stats
  const totalCalls = Object.values(summaries).reduce((s, x) => s + (x?.callsToday || 0), 0);
  const totalCost = Object.values(summaries).reduce((s, x) => s + (x?.costToday || 0), 0);
  const totalErrors = Object.values(summaries).reduce((s, x) => s + (x?.errorCount || 0), 0);
  const activeCount = Object.values(summaries).filter((x) => x?.status === "active").length;

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
                6 AI agents: 1 Mavis điều phối + 5 chuyên trách (Minh/Lan/Hà/Vy/MIMIN Help). Real-time usage, cost, latency, error rate.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                {activeCount}/6 Active
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold">{totalCalls.toLocaleString()}</div>
              <div className="opacity-90">Calls hôm nay</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold">${totalCost.toFixed(2)}</div>
              <div className="opacity-90">Cost hôm nay</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold">{totalErrors}</div>
              <div className="opacity-90">Errors hôm nay</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold">{AGENTS_DISPLAY.length}</div>
              <div className="opacity-90">Total agents</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-3 flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm agent..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">🟢 Active</option>
            <option value="paused">🟡 Paused</option>
            <option value="error">🔴 Error</option>
          </select>
        </div>

        {/* Grid - 6 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((a, idx) => {
            const summary = summaries[a.id];
            return (
              <AgentCard key={a.id} agent={a} summary={summary} loading={loading} idx={idx} />
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="card p-8 text-center text-slate-400">
            <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <div className="text-sm">Không tìm thấy agent nào</div>
          </div>
        )}

        {/* Footer note */}
        <div className="text-center text-xs text-slate-400 mt-6">
          <Sparkles className="w-3 h-3 inline mr-1" />
          Phase 1 · Tracking thật từ Supabase (không random) · Auto-refresh 60s
        </div>
      </div>
    </div>
  );
}

// ============================================
// AGENT CARD - với data thật
// ============================================
function AgentCard({ agent, summary, loading, idx }: { agent: AgentDisplay; summary?: AgentSummary; loading: boolean; idx: number }) {
  const statusColor = {
    active: "bg-emerald-500",
    paused: "bg-amber-500",
    error: "bg-rose-500",
  }[summary?.status || "active"];

  return (
    <Link
      href={`/agents/${agent.id}`}
      aria-label={`Mở ${agent.name} — ${agent.description}`}
      className="card-hover group block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-500/30 animate-fade-up"
      style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: "both" }}
    >
      <div>
        {/* Header with gradient */}
        <div className={`bg-gradient-to-br ${agent.color} p-3 rounded-t-xl text-white`}>
          <div className="flex items-center justify-between mb-2">
            {agent.avatar ? (
              <img
                src={agent.avatar}
                alt={`${agent.name} avatar`}
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur object-cover border-2 border-white/30"
                loading="lazy"
              />
            ) : (
              <span className="text-3xl">{agent.icon}</span>
            )}
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded text-[10px] font-bold flex items-center gap-1">
              <span className={`w-1.5 h-1.5 ${statusColor} rounded-full ${summary?.status === "active" ? "animate-pulse" : ""}`} />
              {summary?.status === "error" ? "Error" : summary?.status === "paused" ? "Paused" : "Active"}
            </span>
          </div>
          <h3 className="font-bold text-base">{agent.name}</h3>
          <p className="text-[10px] opacity-90">{agent.role}</p>
        </div>

        {/* Body */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              {agent.model}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-600 italic">{agent.description}</p>

          {/* Real metrics from Supabase */}
          {loading ? (
            <div className="grid grid-cols-3 gap-1.5 text-center animate-pulse">
              <div className="bg-slate-100 rounded p-2 h-12"></div>
              <div className="bg-slate-100 rounded p-2 h-12"></div>
              <div className="bg-slate-100 rounded p-2 h-12"></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-slate-50 rounded p-1.5">
                <div className="text-sm font-bold text-slate-800">{(summary?.avgLatencyMs || 0) / 1000}s</div>
                <div className="text-[9px] text-slate-500">latency</div>
              </div>
              <div className="bg-slate-50 rounded p-1.5">
                <div className="text-sm font-bold text-slate-800">{summary?.callsToday || 0}</div>
                <div className="text-[9px] text-slate-500">calls</div>
              </div>
              <div className="bg-slate-50 rounded p-1.5">
                <div className="text-sm font-bold text-emerald-600">${(summary?.costToday || 0).toFixed(2)}</div>
                <div className="text-[9px] text-slate-500">cost</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
            <span className="text-[10px] text-slate-500 group-hover:text-indigo-600 font-semibold flex items-center gap-1">
              Chi tiết <ChevronRight className="w-3 h-3" />
            </span>
            <div className="flex gap-0.5">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="p-1 rounded hover:bg-slate-100"
                title="Pause"
              >
                <Pause className="w-3 h-3 text-slate-500" />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="p-1 rounded hover:bg-slate-100"
                title="Settings"
              >
                <Settings className="w-3 h-3 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
