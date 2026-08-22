import type { Api0OperationObservation, Api0SearchFunnel } from "./api0-search-observability";

export type Api2RouteExpectation = "SHOULD_RUN" | "SHOULD_SKIP" | "OPTIONAL";
export type Api2RouteCompliance = "COMPLIANT" | "DEVIATION" | "NOT_CONFIGURED";

export interface Api2RouteDecision {
  operation: string;
  expectation: Api2RouteExpectation;
  actualStatus: Api0OperationObservation["status"];
  compliance: Api2RouteCompliance;
  reason: string;
}

export interface Api2RoutingPolicyAudit {
  schemaVersion: "API2.1";
  shadowOnly: true;
  policy: "LOCATION_FIRST_WITH_WEB_FANOUT_AND_SAFE_FALLBACK";
  decisions: Api2RouteDecision[];
  deviationCount: number;
  notConfiguredCount: number;
  healthy: boolean;
}

const WEB_DISCOVERY = ["Tavily", "Brave", "Gemini", "OpenAI"] as const;
const SUFFICIENT_PLACES_RESULTS = 8;

function evaluate(
  operation: Api0OperationObservation | undefined,
  expectation: Api2RouteExpectation,
  reason: string,
): Api2RouteDecision {
  const actualStatus = operation?.status ?? "DISABLED";
  if (!operation || actualStatus === "DISABLED") {
    return { operation: operation?.name ?? "UNKNOWN", expectation, actualStatus, compliance: "NOT_CONFIGURED", reason };
  }
  const active = actualStatus !== "SKIPPED";
  const compliance = expectation === "OPTIONAL"
    || (expectation === "SHOULD_RUN" && active)
    || (expectation === "SHOULD_SKIP" && !active)
    ? "COMPLIANT"
    : "DEVIATION";
  return { operation: operation.name, expectation, actualStatus, compliance, reason };
}

export function buildApi2RoutingPolicyAudit(input: {
  operations: Api0OperationObservation[];
  funnel: Api0SearchFunnel;
  locationPriority: boolean;
}): Api2RoutingPolicyAudit {
  const byName = new Map(input.operations.map((operation) => [operation.name, operation]));
  const decisions: Api2RouteDecision[] = [];
  const places = byName.get("Google Places");
  const placesSufficient = input.locationPriority && (places?.uniqueItems ?? 0) >= SUFFICIENT_PLACES_RESULTS;

  if (places) {
    decisions.push(evaluate(
      places,
      input.locationPriority ? "SHOULD_RUN" : "OPTIONAL",
      input.locationPriority ? "Tìm theo vị trí phải ưu tiên Google Places trước." : "Form nâng cao cho phép chạy Places song song.",
    ));
  }

  for (const name of WEB_DISCOVERY) {
    const operation = byName.get(name);
    if (!operation) continue;
    decisions.push(evaluate(
      operation,
      placesSufficient ? "SHOULD_SKIP" : "SHOULD_RUN",
      placesSufficient ? "Places đã đủ ứng viên vị trí; fan-out web không còn bắt buộc." : "Places chưa đủ; cần discovery web để bảo đảm độ phủ.",
    ));
  }

  const discoveryUnique = WEB_DISCOVERY.reduce((total, name) => total + (byName.get(name)?.uniqueItems ?? 0), 0)
    + (places?.uniqueItems ?? 0);
  const openStreetMap = byName.get("OpenStreetMap");
  if (openStreetMap) {
    decisions.push(evaluate(
      openStreetMap,
      discoveryUnique === 0 ? "SHOULD_RUN" : "SHOULD_SKIP",
      discoveryUnique === 0 ? "Không có nguồn discovery; cần bản đồ dự phòng." : "Đã có nguồn discovery; không cần fallback OpenStreetMap.",
    ));
  }

  const reader = byName.get("Trafilatura");
  if (reader) decisions.push(evaluate(reader, input.funnel.uniqueDiscoveryUrls > 0 ? "SHOULD_RUN" : "SHOULD_SKIP", "Reader chỉ đọc sâu URL đã được discovery."));

  for (const name of ["Gemini Directory Extraction", "DeepSeek Normalization", "Contact Enrichment", "Gemini Web Agent"] as const) {
    const operation = byName.get(name);
    if (operation) decisions.push(evaluate(operation, "OPTIONAL", "Bước xử lý phụ thuộc loại nguồn và trường dữ liệu còn thiếu."));
  }

  const geocoding = byName.get("Google Maps / Nominatim Geocoding");
  if (geocoding) decisions.push(evaluate(
    geocoding,
    input.funnel.candidatesBeforeEntityMerge > 0 ? "SHOULD_RUN" : "SHOULD_SKIP",
    input.funnel.candidatesBeforeEntityMerge > 0 ? "Có hồ sơ doanh nghiệp cần xác minh tọa độ." : "Không có hồ sơ để định vị.",
  ));

  const deviationCount = decisions.filter((decision) => decision.compliance === "DEVIATION").length;
  const notConfiguredCount = decisions.filter((decision) => decision.compliance === "NOT_CONFIGURED").length;
  return {
    schemaVersion: "API2.1",
    shadowOnly: true,
    policy: "LOCATION_FIRST_WITH_WEB_FANOUT_AND_SAFE_FALLBACK",
    decisions,
    deviationCount,
    notConfiguredCount,
    healthy: deviationCount === 0,
  };
}

export function api2ToolCall(audit: Api2RoutingPolicyAudit): { type: "API2_ROUTING_POLICY_AUDIT"; audit: Api2RoutingPolicyAudit } {
  return { type: "API2_ROUTING_POLICY_AUDIT", audit };
}
