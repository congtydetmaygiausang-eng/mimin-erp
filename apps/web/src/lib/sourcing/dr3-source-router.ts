/** DR3 source-routing audit. Shadow-only; it never selects or calls a provider. */
export const DR3_SCHEMA_VERSION = "DR3-1" as const;

export type Dr3ProviderStatus = "OK" | "EMPTY" | "ERROR" | "DISABLED" | "SKIPPED";
export type Dr3RouteStatus = "RESILIENT" | "SINGLE_PATH" | "UNAVAILABLE";
export type Dr3ResearchBranch = "DISCOVERY" | "DIRECTORY" | "OFFICIAL" | "REGISTRY" | "CONTACT" | "LOCATION";

export interface Dr3ProviderHealthLike {
  name: string;
  status: Dr3ProviderStatus;
  count: number;
  code?: string;
}

export interface Dr3RouteAudit {
  branch: Dr3ResearchBranch;
  preferredProviders: string[];
  healthyProviders: string[];
  observedProviders: string[];
  status: Dr3RouteStatus;
}

export interface Dr3SourceRouterAudit {
  schemaVersion: typeof DR3_SCHEMA_VERSION;
  kind: "SHADOW_SOURCE_ROUTER";
  capturedAt: string;
  routes: Dr3RouteAudit[];
  resilientRoutes: number;
  singlePathRoutes: number;
  unavailableRoutes: number;
  providerSuccessPercent: number;
  fallbackReadinessPercent: number;
  providerErrors: Array<{ name: string; code: string }>;
  recommendation: string[];
  note: "DR3 chỉ kiểm toán định tuyến; không đổi thứ tự gọi hoặc bật thêm provider production.";
}

export interface Dr3ToolCall {
  type: "DR3_SOURCE_ROUTER";
  audit: Dr3SourceRouterAudit;
}

const ROUTES: Record<Dr3ResearchBranch, string[]> = {
  DISCOVERY: ["Tavily", "Brave", "Gemini", "OpenAI"],
  DIRECTORY: ["Tavily", "Brave"],
  OFFICIAL: ["Tavily", "Brave", "Gemini", "Company Reader"],
  REGISTRY: ["Registry Evidence"],
  CONTACT: ["Company Reader", "Gemini Web Agent"],
  LOCATION: ["Google Places", "OpenStreetMap"],
};

function canonicalProviderName(name: string): string {
  const normalized = name.trim().toLocaleLowerCase("vi");
  if (normalized.includes("company reader") || normalized.includes("trafilatura")) return "Company Reader";
  if (normalized.includes("gemini web agent")) return "Gemini Web Agent";
  if (normalized === "gemini") return "Gemini";
  if (normalized.includes("google places")) return "Google Places";
  if (normalized.includes("openstreetmap")) return "OpenStreetMap";
  if (normalized === "tavily") return "Tavily";
  if (normalized === "brave") return "Brave";
  if (normalized === "openai") return "OpenAI";
  return name.trim();
}

function percent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

export function buildDr3SourceRouterAudit(input: {
  providers: readonly Dr3ProviderHealthLike[];
  registryEvidenceCount: number;
}): Dr3SourceRouterAudit {
  const health = new Map<string, Dr3ProviderHealthLike>();
  for (const provider of input.providers) {
    const name = canonicalProviderName(provider.name);
    const existing = health.get(name);
    if (!existing || provider.status === "OK" || provider.count > existing.count) health.set(name, { ...provider, name });
  }
  if (input.registryEvidenceCount > 0) {
    health.set("Registry Evidence", { name: "Registry Evidence", status: "OK", count: input.registryEvidenceCount });
  }

  const branches = Object.keys(ROUTES) as Dr3ResearchBranch[];
  const routes = branches.map<Dr3RouteAudit>((branch) => {
    const preferredProviders = ROUTES[branch];
    const observedProviders = preferredProviders.filter((provider) => health.has(provider));
    const healthyProviders = preferredProviders.filter((provider) => health.get(provider)?.status === "OK");
    const status: Dr3RouteStatus = healthyProviders.length >= 2
      ? "RESILIENT"
      : healthyProviders.length === 1
        ? "SINGLE_PATH"
        : "UNAVAILABLE";
    return { branch, preferredProviders, healthyProviders, observedProviders, status };
  });

  const resilientRoutes = routes.filter((route) => route.status === "RESILIENT").length;
  const singlePathRoutes = routes.filter((route) => route.status === "SINGLE_PATH").length;
  const unavailableRoutes = routes.filter((route) => route.status === "UNAVAILABLE").length;
  const configuredProviders = [...health.values()].filter((provider) => provider.status !== "DISABLED" && provider.status !== "SKIPPED");
  const successfulProviders = configuredProviders.filter((provider) => provider.status === "OK");
  const providerErrors = [...health.values()]
    .filter((provider) => provider.status === "ERROR")
    .map((provider) => ({ name: provider.name, code: provider.code || "REQUEST_FAILED" }));
  const recommendation = [
    ...routes.filter((route) => route.status === "UNAVAILABLE").map((route) => `Nhánh ${route.branch} chưa có nguồn hoạt động`),
    ...routes.filter((route) => route.status === "SINGLE_PATH").map((route) => `Nhánh ${route.branch} mới có một đường nguồn`),
  ];

  return {
    schemaVersion: DR3_SCHEMA_VERSION,
    kind: "SHADOW_SOURCE_ROUTER",
    capturedAt: new Date().toISOString(),
    routes,
    resilientRoutes,
    singlePathRoutes,
    unavailableRoutes,
    providerSuccessPercent: percent(successfulProviders.length, configuredProviders.length),
    fallbackReadinessPercent: percent(resilientRoutes, routes.length),
    providerErrors,
    recommendation,
    note: "DR3 chỉ kiểm toán định tuyến; không đổi thứ tự gọi hoặc bật thêm provider production.",
  };
}

export function dr3ToolCall(audit: Dr3SourceRouterAudit): Dr3ToolCall {
  return { type: "DR3_SOURCE_ROUTER", audit };
}

export function readDr3Audit(toolCalls: unknown): Dr3SourceRouterAudit | null {
  if (!Array.isArray(toolCalls)) return null;
  const item = toolCalls.find((call) => typeof call === "object" && call !== null && (call as { type?: unknown }).type === "DR3_SOURCE_ROUTER") as Partial<Dr3ToolCall> | undefined;
  const audit = item?.audit;
  return audit?.schemaVersion === DR3_SCHEMA_VERSION && audit.kind === "SHADOW_SOURCE_ROUTER" ? audit : null;
}
