// ============================================
// MIMIN ERP - Agent Provider Routing Config (v89.6.9.3)
// ============================================

import { AGENT_PERSONAS, AgentPersona } from "./agent-personas";

export type AIProvider = "deepseek" | "minimax" | "gemini";

export interface ProviderEndpoint {
  provider: AIProvider;
  baseUrl: string;
  apiKeyEnv: string;
  defaultModel: string;
}

export const PROVIDER_CONFIGS: Record<AIProvider, ProviderEndpoint> = {
  deepseek: {
    provider: "deepseek",
    baseUrl: "https://api.deepseek.com/v1",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    defaultModel: "deepseek-chat",
  },
  minimax: {
    provider: "minimax",
    baseUrl: "https://api.minimax.io/v1",  // MiniMax International (chỉ cần API key, OpenAI-compatible)
    apiKeyEnv: "MINIMAX_API_KEY",
    defaultModel: "MiniMax-M3",
  },
  gemini: {
    provider: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    apiKeyEnv: "GEMINI_API_KEY",
    defaultModel: "gemini-1.5-flash",
  },
};

export function getProviderForAgent(agentId: string): AgentPersona {
  return AGENT_PERSONAS[agentId] || AGENT_PERSONAS["mimin-orchestrator"];
}

export function getApiKeyForProvider(provider: AIProvider): string {
  if (typeof process === "undefined") return "";
  const env = process.env;
  switch (provider) {
    case "deepseek":
      return env.DEEPSEEK_API_KEY || env.NEXT_PUBLIC_DEEPSEEK_API_KEY || "";
    case "minimax":
      return env.MINIMAX_API_KEY || env.NEXT_PUBLIC_MINIMAX_API_KEY || "";
    case "gemini":
      return env.GEMINI_API_KEY || env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    default:
      return "";
  }
}
