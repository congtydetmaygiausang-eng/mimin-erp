// Agent usage tracking - reads from Supabase agent_usage_logs table
// Falls back to empty stats if table not found

import { supabase } from "@/lib/supabase/client";

export interface AgentSummary {
  agentId: string;
  callsToday: number;
  costToday: number;
  avgLatencyMs: number;
  errorCount: number;
  status: "active" | "paused" | "error";
  lastCallAt?: string;
}

export async function getAgentSummaryToday(agentId: string): Promise<AgentSummary> {
  const empty: AgentSummary = {
    agentId,
    callsToday: 0,
    costToday: 0,
    avgLatencyMs: 0,
    errorCount: 0,
    status: "active",
  };

  try {
    if (!supabase) return empty;

    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("agent_usage_logs")
      .select("latency_ms, cost_usd, is_error, created_at")
      .eq("agent_id", agentId)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    if (error || !data || data.length === 0) return empty;

    const callsToday = data.length;
    const costToday = data.reduce((s, r) => s + (r.cost_usd || 0), 0);
    const avgLatencyMs = data.reduce((s, r) => s + (r.latency_ms || 0), 0) / callsToday;
    const errorCount = data.filter((r) => r.is_error).length;
    const lastCallAt = data.at(-1)?.created_at;
    const status: AgentSummary["status"] = errorCount > callsToday * 0.5 ? "error" : "active";

    return { agentId, callsToday, costToday, avgLatencyMs, errorCount, status, lastCallAt };
  } catch {
    return empty;
  }
}
