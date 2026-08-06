// Agent usage tracking - reads + writes from/to Supabase agent_usage_logs table
// Falls back to empty stats if table not found
// Silent fail on write - khong break main flow neu Supabase loi

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

export interface AgentUsageLog {
  agent_id: string;
  user_id?: string;
  latency_ms: number;
  cost_usd: number;
  is_error: boolean;
  error_message?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  model?: string;
}

/**
 * Ghi log mot agent call vao Supabase.
 Goi sau moi invoke (real hoac mock) de /agents page hien thi data that.
 Silent fail - khong throw exception de khong break main flow.
 */
export async function trackUsage(log: AgentUsageLog): Promise<void> {
  try {
    if (!supabase) {
      console.warn("[trackUsage] Supabase chua init, bo qua log");
      return;
    }

    const { error } = await supabase.from("agent_usage_logs").insert({
      agent_id: log.agent_id,
      user_id: log.user_id || null,
      latency_ms: log.latency_ms,
      cost_usd: log.cost_usd,
      is_error: log.is_error,
      error_message: log.error_message || null,
      prompt_tokens: log.prompt_tokens || 0,
      completion_tokens: log.completion_tokens || 0,
      total_tokens: log.total_tokens || 0,
      model: log.model || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[trackUsage] Supabase error:", error.message);
    }
  } catch (e) {
    // Silent fail - quan trong nhat la agent call van thanh cong
    console.error("[trackUsage] Exception (silent):", e);
  }
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
