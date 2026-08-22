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
import { AGENT_PERSONAS, AGENT_IDS } from "@/lib/agent-personas";
import { getAgentSummaryToday, type AgentSummary } from "@/lib/agent-usage-tracker";

// Map style for 10 agents
const AGENT_STYLE: Record<string, { color: string; icon: string }> = {
  "mimin-orchestrator": { color: "from-violet-500 to-purple-600", icon: "🧭" },
  "agent-san-xuat": { color: "from-sky-500 to-cyan-600", icon: "✂️" },
  "agent-kho": { color: "from-emerald-500 to-teal-600", icon: "📦" },
  "agent-ke-toan": { color: "from-amber-500 to-orange-600", icon: "💰" },
  "agent-nhan-su": { color: "from-rose-500 to-pink-600", icon: "👤" },
  "agent-deepseek": { color: "from-indigo-500 to-blue-600", icon: "🧠" },
  "agent-ban-hang": { color: "from-fuchsia-500 to-purple-600", icon: "💬" },
  "agent-tai-chinh": { color: "from-emerald-600 to-green-700", icon: "📈" },
  "agent-theo-doi-cd": { color: "from-teal-500 to-emerald-500", icon: "✅" },
  "agent-ky-thuat-may": { color: "from-slate-500 to-gray-600", icon: "🔧" },
};

// ============================================
// /agents/[id] - Agent detail page
// Hien thi chi tiet 1 agent
// + shortcut chat
// ============================================

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params?.id as string;

  // Validate agentId thuoc 10 personas, neu sai -> redirect /agents
  const isValidId = agentId ? (AGENT_IDS as readonly string[]).includes(agentId) : false;

  useEffect(() => {
    if (agentId && !isValidId) {
      // Redirect ve danh sach agents sau 1.2s (de user thay thong bao)
      const t = setTimeout(() => router.replace("/agents"), 1200);
      return () => clearTimeout(t);
    }
  }, [agentId, isValidId, router]);

  if (agentId && !isValidId) {
    return (
      <div className="mx-auto max-w-2xl p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Khong tim thay agent
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
          ID: <code className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{agentId}</code>
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Chi ho tro 9 MIN AI Agents va Orchestrator
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
          Dang chuyen huong ve danh sach agents...
        </p>
        <Link
          href="/agents"
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lai ngay
        </Link>
      </div>
    );
  }

  // Fallback visual neu agentId khong co trong persona
  const basePersona = AGENT_PERSONAS[agentId];
  const style = AGENT_STYLE[agentId] || { color: "from-slate-500 to-slate-600", icon: "❓" };
  const persona = {
    name: basePersona?.name || agentId,
    role: basePersona?.role_title || "Unknown agent",
    description: basePersona?.capabilities?.join(" · ") || "Khong tim thay thong tin agent nay",
    color: style.color,
    icon: style.icon,
    capabilities: basePersona?.capabilities || [],
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
        Quay lai danh sach agents
      </button>

      {/* Header card with gradient */}
      <div
        className={`bg-gradient-to-br ${persona.color || "from-violet-500 to-purple-600"} rounded-2xl p-6 text-white shadow-xl`}
      >
        <div className="flex items-start gap-4">
          {basePersona?.avatar?.startsWith("/avatars/") ? (
            <div className="w-16 h-16 rounded-2xl bg-white/20 ring-2 ring-white/40 overflow-hidden shrink-0">
              <img src={basePersona.avatar} alt={persona.name} className="w-full h-full object-cover object-top" />
            </div>
          ) : (
            <div className="text-5xl">{persona.icon || "🤖"}</div>
          )}
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
            <div className="font-bold text-sm">Quan ly agents</div>
            <div className="text-xs text-slate-500">Xem tat ca cac MIN AI agents</div>
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
