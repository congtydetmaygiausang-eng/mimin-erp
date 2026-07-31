"use client";

import { useState, useEffect } from "react";
import { Bot, Search, Filter, Activity, Cpu, DollarSign, Zap, Clock, ChevronRight, Pause, Play, Settings, BarChart3, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  module: string;
  status: "active" | "paused" | "error" | "disabled";
  model: string;
  tools: number;
  avgLatency: number;
  callsToday: number;
  costToday: number;
  icon: string;
  color: string;
}

const MOCK_AGENTS: Agent[] = [
  { id: "agent-dashboard", name: "Dashboard", module: "dashboard", status: "active", model: "Sonnet-4", tools: 5, avgLatency: 1.2, callsToday: 234, costToday: 2.4, icon: "📊", color: "from-sky-500 to-blue-500" },
  { id: "agent-lenh-cat", name: "Lệnh cắt", module: "lenh-cat", status: "active", model: "Sonnet-4", tools: 7, avgLatency: 0.8, callsToday: 156, costToday: 1.6, icon: "✂️", color: "from-amber-500 to-orange-500" },
  { id: "agent-khach-hang", name: "Khách hàng", module: "khach-hang", status: "active", model: "Sonnet-4", tools: 7, avgLatency: 1.5, callsToday: 89, costToday: 0.9, icon: "👥", color: "from-purple-500 to-pink-500" },
  { id: "agent-ke-hoach", name: "Kế hoạch SX", module: "ke-hoach", status: "active", model: "Sonnet-4", tools: 7, avgLatency: 2.1, callsToday: 67, costToday: 0.7, icon: "📅", color: "from-indigo-500 to-purple-500" },
  { id: "agent-nhan-su", name: "Nhân sự", module: "nhan-su", status: "active", model: "Sonnet-4", tools: 7, avgLatency: 1.0, callsToday: 45, costToday: 0.5, icon: "👤", color: "from-rose-500 to-red-500" },
  { id: "agent-kho-vai", name: "Kho vải", module: "kho-vai", status: "active", model: "Sonnet-4", tools: 6, avgLatency: 0.6, callsToday: 123, costToday: 1.2, icon: "🧵", color: "from-teal-500 to-cyan-500" },
  { id: "agent-kho-soi", name: "Kho sợi", module: "kho-soi", status: "active", model: "Sonnet-4", tools: 7, avgLatency: 0.9, callsToday: 78, costToday: 0.8, icon: "🧶", color: "from-cyan-500 to-blue-500" },
  { id: "agent-kho-phu-lieu", name: "Kho PL", module: "kho-phu-lieu", status: "active", model: "Sonnet-4", tools: 7, avgLatency: 0.7, callsToday: 92, costToday: 0.9, icon: "📦", color: "from-emerald-500 to-green-500" },
  { id: "agent-kho-tp", name: "Kho TP", module: "kho-tp", status: "active", model: "Sonnet-4", tools: 6, avgLatency: 0.5, callsToday: 67, costToday: 0.7, icon: "🏭", color: "from-amber-500 to-yellow-500" },
  { id: "agent-don-hang", name: "Đơn hàng", module: "don-hang", status: "active", model: "Sonnet-4", tools: 7, avgLatency: 1.1, callsToday: 145, costToday: 1.5, icon: "📋", color: "from-blue-500 to-indigo-500" },
  { id: "agent-cong-no", name: "Công nợ", module: "cong-no", status: "active", model: "Sonnet-4", tools: 8, avgLatency: 0.8, callsToday: 189, costToday: 1.9, icon: "💰", color: "from-green-500 to-emerald-500" },
  { id: "agent-qc", name: "QC", module: "qc", status: "active", model: "Sonnet-4", tools: 6, avgLatency: 0.4, callsToday: 56, costToday: 0.6, icon: "✅", color: "from-lime-500 to-green-500" },
  { id: "agent-may", name: "Tổ may", module: "may", status: "active", model: "Sonnet-4", tools: 6, avgLatency: 0.6, callsToday: 134, costToday: 1.3, icon: "🪡", color: "from-pink-500 to-rose-500" },
  { id: "agent-hoan-thien", name: "Hoàn thiện", module: "hoan-thien", status: "active", model: "Sonnet-4", tools: 7, avgLatency: 0.5, callsToday: 87, costToday: 0.9, icon: "♨️", color: "from-orange-500 to-amber-500" },
  { id: "agent-giao-hang", name: "Giao hàng", module: "giao-hang", status: "active", model: "Sonnet-4", tools: 7, avgLatency: 1.3, callsToday: 98, costToday: 1.0, icon: "🚚", color: "from-violet-500 to-purple-500" },
  { id: "agent-cham-cong", name: "Chấm công", module: "cham-cong", status: "active", model: "Sonnet-4", tools: 7, avgLatency: 0.3, callsToday: 34, costToday: 0.3, icon: "⏰", color: "from-slate-500 to-gray-500" },
  { id: "agent-bang-luong", name: "Bảng lương", module: "bang-luong", status: "active", model: "Sonnet-4", tools: 5, avgLatency: 2.5, callsToday: 12, costToday: 0.1, icon: "💵", color: "from-yellow-500 to-orange-500" },
  { id: "agent-ncc", name: "NCC", module: "ncc", status: "active", model: "Sonnet-4", tools: 7, avgLatency: 0.9, callsToday: 56, costToday: 0.6, icon: "🏢", color: "from-blue-600 to-cyan-600" },
  { id: "agent-gia-cong", name: "Gia công ngoài", module: "gia-cong", status: "active", model: "Sonnet-4", tools: 6, avgLatency: 1.4, callsToday: 23, costToday: 0.2, icon: "🔧", color: "from-gray-600 to-slate-600" },
  { id: "agent-bao-cao", name: "Báo cáo", module: "bao-cao", status: "active", model: "Sonnet-4", tools: 8, avgLatency: 3.2, callsToday: 8, costToday: 0.1, icon: "📈", color: "from-indigo-600 to-blue-600" },
  { id: "agent-cai-dat", name: "Cài đặt", module: "cai-dat", status: "active", model: "Sonnet-4", tools: 9, avgLatency: 1.0, callsToday: 15, costToday: 0.2, icon: "⚙️", color: "from-slate-700 to-gray-700" },
  { id: "agent-security", name: "Security", module: "security", status: "active", model: "Haiku-3.5", tools: 8, avgLatency: 0.2, callsToday: 1234, costToday: 0.5, icon: "🔒", color: "from-red-500 to-rose-600" },
  { id: "agent-audit", name: "Audit", module: "audit", status: "active", model: "Haiku-3.5", tools: 4, avgLatency: 0.1, callsToday: 5678, costToday: 1.2, icon: "📝", color: "from-gray-700 to-slate-700" },
  { id: "agent-notification", name: "Notification", module: "notifications", status: "active", model: "Haiku-3.5", tools: 7, avgLatency: 0.4, callsToday: 234, costToday: 0.3, icon: "🔔", color: "from-pink-500 to-rose-500" },
  { id: "agent-backup", name: "Backup", module: "backup", status: "active", model: "Haiku-3.5", tools: 7, avgLatency: 5.0, callsToday: 4, costToday: 0.1, icon: "💾", color: "from-emerald-600 to-teal-600" },
  { id: "agent-integration", name: "Integration", module: "integration", status: "active", model: "Haiku-3.5", tools: 9, avgLatency: 1.8, callsToday: 89, costToday: 0.4, icon: "🔗", color: "from-blue-500 to-indigo-500" },
];

export default function AgentsDashboardPage() {
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [agents, setAgents] = useState(MOCK_AGENTS);

  // Auto-refresh mỗi 30s
  useEffect(() => {
    const interval = setInterval(() => {
      // Random update latency/calls
      setAgents((prev) =>
        prev.map((a) => ({
          ...a,
          avgLatency: Math.max(0.1, a.avgLatency + (Math.random() - 0.5) * 0.2),
          callsToday: a.callsToday + Math.floor(Math.random() * 3),
        }))
      );
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = agents.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterModule !== "all" && a.module !== filterModule) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    return true;
  });

  const totalCalls = agents.reduce((s, a) => s + a.callsToday, 0);
  const totalCost = agents.reduce((s, a) => s + a.costToday, 0);
  const activeCount = agents.filter((a) => a.status === "active").length;
  const avgLatency = agents.reduce((s, a) => s + a.avgLatency, 0) / agents.length;

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
                Quản lý 26 AI agents chuyên trách từng module. Real-time status, latency, cost, tools & activity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                {activeCount}/26 Active
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold">{totalCalls.toLocaleString()}</div>
              <div className="opacity-90">Calls/ngày</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold">${totalCost.toFixed(2)}</div>
              <div className="opacity-90">Cost/ngày</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold">{avgLatency.toFixed(2)}s</div>
              <div className="opacity-90">Avg latency</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold">{agents.length}</div>
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
            <option value="disabled">⚪ Disabled</option>
          </select>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Tất cả modules</option>
            <option value="lenh-cat">Lệnh cắt</option>
            <option value="kho-vai">Kho vải</option>
            <option value="cong-no">Công nợ</option>
            <option value="bang-luong">Bảng lương</option>
          </select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((a) => (
            <AgentCard key={a.id} agent={a} />
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
function AgentCard({ agent }: { agent: Agent }) {
  const statusColors: Record<string, string> = {
    active: "bg-emerald-500",
    paused: "bg-amber-500",
    error: "bg-rose-500",
    disabled: "bg-slate-400",
  };

  const statusLabels: Record<string, string> = {
    active: "● Active",
    paused: "⏸ Paused",
    error: "⚠ Error",
    disabled: "○ Disabled",
  };

  return (
    <Link href={`/agents/${agent.id}`}>
      <div className="card-hover group cursor-pointer">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-br ${agent.color} p-3 rounded-t-xl text-white`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">{agent.icon}</span>
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded text-[10px] font-bold flex items-center gap-1">
              <span className={`w-1.5 h-1.5 ${statusColors[agent.status]} rounded-full ${agent.status === "active" ? "animate-pulse" : ""}`} />
              {statusLabels[agent.status]}
            </span>
          </div>
          <h3 className="font-bold text-sm">{agent.name}</h3>
          <p className="text-[10px] opacity-90">{agent.id}</p>
        </div>

        {/* Body */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              {agent.model}
            </span>
            <span>{agent.tools} tools</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-slate-50 rounded p-1.5">
              <div className="text-sm font-bold text-slate-800">{agent.avgLatency.toFixed(1)}s</div>
              <div className="text-[9px] text-slate-500">latency</div>
            </div>
            <div className="bg-slate-50 rounded p-1.5">
              <div className="text-sm font-bold text-slate-800">{agent.callsToday}</div>
              <div className="text-[9px] text-slate-500">calls/d</div>
            </div>
            <div className="bg-slate-50 rounded p-1.5">
              <div className="text-sm font-bold text-emerald-600">${agent.costToday.toFixed(2)}</div>
              <div className="text-[9px] text-slate-500">cost/d</div>
            </div>
          </div>

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
