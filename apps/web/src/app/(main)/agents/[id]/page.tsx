"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Cpu,
  MessageSquare,
  Settings,
  Activity,
  TrendingUp,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react";
import { AGENT_PERSONAS } from "@/lib/agent-personas";
import { getAgentSummaryToday, type AgentSummary } from "@/lib/agent-usage-tracker";

// ============================================
// /agents/[id] - Agent detail page
// Hien thi chi tiet 1 agent V6 (mavis, minh, lan, ha, vy, mimin-help)
// + shortcut chat
// ============================================

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params?.id as string;

  // Fallback visual neu agentId khong co trong persona
  const persona = AGENT_PERSONAS[agentId] || {
    id: agentId,
    name: agentId,
    role: "Unknown agent",
    description: "Khong tim thay thong tin agent nay",
    color: "from-slate-500 to-slate-600",
    icon: "❓",
  };

  const [summary, setSummary] = useState<AgentSummary | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getAgentSummaryToday(agentId);
        if (active) setSummary(data);
      } catch {
        // silent - return empty summary
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [agentId]);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/agents")}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lai danh sach 6 agents
      </button>

      {/* Header card with gradient */}
      <div
        className={`bg-gradient-to-br ${persona.color || "from-violet-500 to-purple-600"} rounded-2xl p-6 text-white shadow-xl`}
      >
        <div className="flex items-start gap-4">
          <div className="text-5xl">{persona.icon || "🤖"}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{persona.name}</h1>
            <p className="text-sm opacity-90 mb-2">{persona.role}</p>
            <p className="text-xs opacity-80">{persona.description}</p>
          </div>
          <span
            className={`px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold flex items-center gap-1.5 ${
              summary?.status === "active" ? "" : ""
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                summary?.status === "error"
                  ? "bg-rose-400"
                  : summary?.status === "paused"
                  ? "bg-amber-400"
                  : "bg-emerald-300 animate-pulse"
              }`}
            />
            {summary?.status === "error"
              ? "Error"
              : summary?.status === "paused"
              ? "Paused"
              : "Active"}
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={<Activity className="w-4 h-4" />}
          label="Calls today"
          value={loading ? "..." : String(summary?.callsToday ?? 0)}
          color="text-cyan-600"
        />
        <MetricCard
          icon={<Clock className="w-4 h-4" />}
          label="Avg latency"
          value={loading ? "..." : `${((summary?.avgLatencyMs ?? 0) / 1000).toFixed(2)}s`}
          color="text-amber-600"
        />
        <MetricCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Cost today"
          value={loading ? "..." : `$${(summary?.costToday ?? 0).toFixed(4)}`}
          color="text-emerald-600"
        />
        <MetricCard
          icon={<AlertCircle className="w-4 h-4" />}
          label="Errors"
          value={loading ? "..." : String(summary?.errorCount ?? 0)}
          color={(summary?.errorCount ?? 0) > 0 ? "text-rose-600" : "text-slate-500"}
        />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href={`/agents-chat?agent=${agentId}`}
          className="flex items-center gap-3 p-4 bg-white/60 dark:bg-white/5 backdrop-blur rounded-xl border border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition"
        >
          <MessageSquare className="w-5 h-5 text-cyan-600" />
          <div>
            <div className="font-bold text-sm">Chat voi {persona.name}</div>
            <div className="text-xs text-slate-500">Mo cua so chat rieng cho agent nay</div>
          </div>
        </Link>

        <Link
          href="/agents"
          className="flex items-center gap-3 p-4 bg-white/60 dark:bg-white/5 backdrop-blur rounded-xl border border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition"
        >
          <Settings className="w-5 h-5 text-slate-600" />
          <div>
            <div className="font-bold text-sm">Quan ly 6 agents</div>
            <div className="text-xs text-slate-500">Xem tat ca agents V6 (Mavis/Minh/Lan/Ha/Vy/MIMIN Help)</div>
          </div>
        </Link>
      </div>

      {/* Capability tags */}
      {persona.capabilities && persona.capabilities.length > 0 && (
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-xl border border-white/40 dark:border-white/10 p-4">
          <h2 className="font-bold text-sm mb-2 flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Capabilities
          </h2>
          <div className="flex flex-wrap gap-2">
            {persona.capabilities.map((c, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white/60 dark:bg-white/5 backdrop-blur rounded-xl border border-white/40 dark:border-white/10 p-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
