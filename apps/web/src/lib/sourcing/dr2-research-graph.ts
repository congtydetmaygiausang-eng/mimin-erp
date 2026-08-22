/** DR2 research graph audit. Observation-only; never returns search arguments. */
export const DR2_SCHEMA_VERSION = "DR2-1" as const;

export type Dr2ResearchNode = "DISCOVERY" | "DIRECTORY" | "OFFICIAL" | "REGISTRY" | "CONTACT" | "LOCATION";
export type Dr2NodeStatus = "COVERED" | "PARTIAL" | "MISSING";

export interface Dr2NodeAudit {
  node: Dr2ResearchNode;
  status: Dr2NodeStatus;
  queryCount: number;
  evidenceCount: number;
}

export interface Dr2ResearchGraphAudit {
  schemaVersion: typeof DR2_SCHEMA_VERSION;
  kind: "SHADOW_RESEARCH_GRAPH";
  capturedAt: string;
  nodes: Dr2NodeAudit[];
  coveragePercent: number;
  coveredNodes: number;
  missingNodes: Dr2ResearchNode[];
  queryCount: number;
  distinctQueryCount: number;
  duplicateQueryRatePercent: number;
  recommendation: string[];
  note: "DR2 chỉ đo độ phủ; không sinh thêm truy vấn hoặc gọi thêm API production.";
}

export interface Dr2ToolCall {
  type: "DR2_RESEARCH_GRAPH";
  audit: Dr2ResearchGraphAudit;
}

type SourceTypeBreakdown = Partial<Record<"SEARCH" | "OFFICIAL" | "REGISTRY" | "MAP" | "SOCIAL" | "OTHER", number>>;

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("vi");
}

function queryMatches(query: string, node: Dr2ResearchNode): boolean {
  const rules: Record<Dr2ResearchNode, RegExp> = {
    DISCOVERY: /(?:công ty|doanh nghiệp|nhà cung cấp|xưởng|manufacturer|sản xuất)/i,
    DIRECTORY: /(?:site:|trang vàng|danh sách|directory)/i,
    OFFICIAL: /(?:website chính thức|trang chủ|giới thiệu công ty|inurl:gioi-thieu|inurl:about)/i,
    REGISTRY: /(?:mã số thuế|mst|đăng ký doanh nghiệp|masothue|vietqr|registry)/i,
    CONTACT: /(?:điện thoại|hotline|liên hệ|email|zalo|contact)/i,
    LOCATION: /(?:\bở\b|\btại\b|địa chỉ|quận|huyện|thành phố|tỉnh|district|city)/i,
  };
  return rules[node].test(query);
}

function evidenceCount(node: Dr2ResearchNode, sourceTypes: SourceTypeBreakdown, candidateCount: number, insideRadius: number): number {
  if (node === "DISCOVERY") return Math.max(0, candidateCount);
  if (node === "DIRECTORY") return Math.max(0, sourceTypes.OTHER ?? 0);
  if (node === "OFFICIAL") return Math.max(0, sourceTypes.OFFICIAL ?? 0);
  if (node === "REGISTRY") return Math.max(0, sourceTypes.REGISTRY ?? 0);
  if (node === "CONTACT") return Math.max(0, candidateCount);
  return Math.max(0, (sourceTypes.MAP ?? 0) + insideRadius);
}

export function buildDr2ResearchGraphAudit(input: {
  executedQueries: readonly string[];
  sourceTypeBreakdown?: SourceTypeBreakdown;
  candidateCount: number;
  insideRadius: number;
  contactCompleteCount: number;
}): Dr2ResearchGraphAudit {
  const normalizedQueries = input.executedQueries.map(normalize).filter(Boolean);
  const distinctQueries = [...new Set(normalizedQueries)];
  const sourceTypes = input.sourceTypeBreakdown ?? {};
  const requiredNodes: Dr2ResearchNode[] = ["DISCOVERY", "DIRECTORY", "OFFICIAL", "REGISTRY", "CONTACT", "LOCATION"];
  const nodes = requiredNodes.map<Dr2NodeAudit>((node) => {
    const queryCount = distinctQueries.filter((query) => queryMatches(query, node)).length;
    const observedEvidence = node === "CONTACT"
      ? Math.max(0, input.contactCompleteCount)
      : evidenceCount(node, sourceTypes, input.candidateCount, input.insideRadius);
    const status: Dr2NodeStatus = queryCount > 0 && observedEvidence > 0
      ? "COVERED"
      : queryCount > 0 || observedEvidence > 0
        ? "PARTIAL"
        : "MISSING";
    return { node, status, queryCount, evidenceCount: observedEvidence };
  });
  const coveredNodes = nodes.filter((node) => node.status === "COVERED").length;
  const missingNodes = nodes.filter((node) => node.status === "MISSING").map((node) => node.node);
  const coveragePoints = nodes.reduce((total, node) => total + (node.status === "COVERED" ? 1 : node.status === "PARTIAL" ? 0.5 : 0), 0);
  const duplicateCount = Math.max(0, normalizedQueries.length - distinctQueries.length);
  const recommendation = [
    missingNodes.includes("OFFICIAL") ? "Bổ sung nhánh website chính thức ở giai đoạn canary sau" : "",
    missingNodes.includes("REGISTRY") ? "Bổ sung nhánh nguồn đăng ký doanh nghiệp ở giai đoạn canary sau" : "",
    missingNodes.includes("CONTACT") ? "Bổ sung nhánh xác minh liên hệ ở giai đoạn canary sau" : "",
    missingNodes.includes("LOCATION") ? "Bổ sung nhánh xác minh bản đồ ở giai đoạn canary sau" : "",
  ].filter(Boolean);

  return {
    schemaVersion: DR2_SCHEMA_VERSION,
    kind: "SHADOW_RESEARCH_GRAPH",
    capturedAt: new Date().toISOString(),
    nodes,
    coveragePercent: Math.round((coveragePoints / requiredNodes.length) * 100),
    coveredNodes,
    missingNodes,
    queryCount: normalizedQueries.length,
    distinctQueryCount: distinctQueries.length,
    duplicateQueryRatePercent: normalizedQueries.length ? Math.round((duplicateCount / normalizedQueries.length) * 100) : 0,
    recommendation,
    note: "DR2 chỉ đo độ phủ; không sinh thêm truy vấn hoặc gọi thêm API production.",
  };
}

export function dr2ToolCall(audit: Dr2ResearchGraphAudit): Dr2ToolCall {
  return { type: "DR2_RESEARCH_GRAPH", audit };
}

export function readDr2Audit(toolCalls: unknown): Dr2ResearchGraphAudit | null {
  if (!Array.isArray(toolCalls)) return null;
  const item = toolCalls.find((call) => typeof call === "object" && call !== null && (call as { type?: unknown }).type === "DR2_RESEARCH_GRAPH") as Partial<Dr2ToolCall> | undefined;
  const audit = item?.audit;
  return audit?.schemaVersion === DR2_SCHEMA_VERSION && audit.kind === "SHADOW_RESEARCH_GRAPH" ? audit : null;
}
