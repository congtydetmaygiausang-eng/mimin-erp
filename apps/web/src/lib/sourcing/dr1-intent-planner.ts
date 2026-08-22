/**
 * DR1 shadow intent planner.
 *
 * This module observes the request contract and the executed query plan. It
 * deliberately does not produce arguments consumed by the search pipeline.
 */
export const DR1_SCHEMA_VERSION = "DR1-1" as const;

export type Dr1PartnerRole = "CUSTOMER" | "SATELLITE_PROCESSOR" | "MATERIAL_SUPPLIER" | "PACKAGING_FINISHER" | "UNKNOWN";
export type Dr1RequestedField = "PHONE" | "EMAIL" | "WEBSITE" | "TAX_CODE" | "ADDRESS" | "CAPABILITY" | "COMPANY_INTRODUCTION";

export interface Dr1ShadowPlan {
  schemaVersion: typeof DR1_SCHEMA_VERSION;
  kind: "SHADOW_INTENT_PLAN";
  capturedAt: string;
  intent: "FIND_PRODUCTION_PARTNERS";
  query: string;
  location: string;
  role: Dr1PartnerRole;
  radiusKm: number;
  locationMode: "PREFER" | "STRICT";
  requestedFields: Dr1RequestedField[];
  constraints: {
    hasCapability: boolean;
    hasLocation: boolean;
    hasFiniteRadius: boolean;
  };
  readiness: "READY" | "NEEDS_INPUT";
  warnings: string[];
}

export interface Dr1ExecutionAudit {
  schemaVersion: typeof DR1_SCHEMA_VERSION;
  kind: "SHADOW_EXECUTION_AUDIT";
  plan: Dr1ShadowPlan;
  executedQueryCount: number;
  distinctQueryCount: number;
  candidateCount: number;
  contractAligned: boolean;
  note: "DR1 chỉ quan sát; không thay đổi truy vấn hoặc kết quả production.";
}

export interface Dr1ToolCall {
  type: "DR1_SHADOW_PLAN";
  audit: Dr1ExecutionAudit;
}

const ROLE_VALUES = new Set<Dr1PartnerRole>([
  "CUSTOMER",
  "SATELLITE_PROCESSOR",
  "MATERIAL_SUPPLIER",
  "PACKAGING_FINISHER",
]);

const FIELD_PATTERNS: ReadonlyArray<[Dr1RequestedField, RegExp]> = [
  ["PHONE", /(?:số điện thoại|điện thoại|hotline|zalo|phone)/i],
  ["EMAIL", /(?:email|e-mail|thư điện tử)/i],
  ["WEBSITE", /(?:website|trang web|domain)/i],
  ["TAX_CODE", /(?:mã số thuế|mst|tax code)/i],
  ["ADDRESS", /(?:địa chỉ|vị trí|ở đâu|bản đồ|maps?)/i],
  ["COMPANY_INTRODUCTION", /(?:giới thiệu|hồ sơ|profile|thông tin công ty)/i],
];

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export function buildDr1ShadowPlan(input: {
  query: string;
  rawQueryText?: string;
  location: string;
  role: string;
  radiusKm: number;
  locationMode: "PREFER" | "STRICT";
}): Dr1ShadowPlan {
  const query = clean(input.query);
  const rawQueryText = clean(input.rawQueryText) || query;
  const location = clean(input.location);
  const role = ROLE_VALUES.has(input.role as Dr1PartnerRole) ? input.role as Dr1PartnerRole : "UNKNOWN";
  const requestedFields = new Set<Dr1RequestedField>(["CAPABILITY"]);
  for (const [field, pattern] of FIELD_PATTERNS) if (pattern.test(rawQueryText)) requestedFields.add(field);

  const constraints = {
    hasCapability: query.length > 0,
    hasLocation: location.length > 0,
    hasFiniteRadius: Number.isFinite(input.radiusKm) && input.radiusKm > 0,
  };
  const warnings = [
    !constraints.hasCapability ? "Thiếu năng lực hoặc sản phẩm cần tìm" : "",
    !constraints.hasLocation ? "Thiếu vị trí trung tâm" : "",
    role === "UNKNOWN" ? "Vai trò đối tác không hợp lệ" : "",
    input.radiusKm >= 50 ? "Bán kính rộng; cần theo dõi độ chính xác vị trí" : "",
  ].filter(Boolean);

  return {
    schemaVersion: DR1_SCHEMA_VERSION,
    kind: "SHADOW_INTENT_PLAN",
    capturedAt: new Date().toISOString(),
    intent: "FIND_PRODUCTION_PARTNERS",
    query,
    location,
    role,
    radiusKm: input.radiusKm,
    locationMode: input.locationMode,
    requestedFields: [...requestedFields],
    constraints,
    readiness: constraints.hasCapability && constraints.hasLocation && constraints.hasFiniteRadius && role !== "UNKNOWN" ? "READY" : "NEEDS_INPUT",
    warnings,
  };
}

export function auditDr1Execution(input: {
  plan: Dr1ShadowPlan;
  executedQueries: readonly string[];
  candidateCount: number;
}): Dr1ExecutionAudit {
  const normalizedQueries = input.executedQueries.map((query) => clean(query).toLocaleLowerCase("vi")).filter(Boolean);
  return {
    schemaVersion: DR1_SCHEMA_VERSION,
    kind: "SHADOW_EXECUTION_AUDIT",
    plan: input.plan,
    executedQueryCount: normalizedQueries.length,
    distinctQueryCount: new Set(normalizedQueries).size,
    candidateCount: Math.max(0, input.candidateCount),
    contractAligned: input.plan.readiness === "READY" && normalizedQueries.length > 0,
    note: "DR1 chỉ quan sát; không thay đổi truy vấn hoặc kết quả production.",
  };
}

export function dr1ToolCall(audit: Dr1ExecutionAudit): Dr1ToolCall {
  return { type: "DR1_SHADOW_PLAN", audit };
}

export function readDr1Audit(toolCalls: unknown): Dr1ExecutionAudit | null {
  if (!Array.isArray(toolCalls)) return null;
  const item = toolCalls.find((call) =>
    typeof call === "object" && call !== null && (call as { type?: unknown }).type === "DR1_SHADOW_PLAN",
  ) as Partial<Dr1ToolCall> | undefined;
  const audit = item?.audit;
  return audit?.schemaVersion === DR1_SCHEMA_VERSION && audit.kind === "SHADOW_EXECUTION_AUDIT" ? audit : null;
}
