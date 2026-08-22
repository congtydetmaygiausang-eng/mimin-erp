import type { Api0OperationObservation, Api0OperationRole } from "./api0-search-observability";

export type Api1ProviderMode = "PRIMARY" | "SECONDARY" | "FALLBACK" | "SHADOW";

export interface Api1ProviderContract {
  name: string;
  role: Api0OperationRole;
  mode: Api1ProviderMode;
  responsibility: string;
  mayOverlapWith: string[];
}

export interface Api1ContractFinding {
  code: "UNDECLARED_OPERATION" | "ROLE_MISMATCH" | "DUPLICATE_OBSERVATION" | "UNDECLARED_OVERLAP";
  severity: "INFO" | "WARNING";
  operation: string;
  detail: string;
}

export interface Api1ProviderContractAudit {
  schemaVersion: "API1.1";
  shadowOnly: true;
  contractCount: number;
  observedOperationCount: number;
  activeProvidersByRole: Partial<Record<Api0OperationRole, string[]>>;
  findings: Api1ContractFinding[];
  healthy: boolean;
}

export const API1_PROVIDER_CONTRACTS: readonly Api1ProviderContract[] = [
  { name: "DeepSeek Query Planner", role: "QUERY_PLANNING", mode: "PRIMARY", responsibility: "Lập bộ truy vấn theo năng lực và khu vực", mayOverlapWith: [] },
  { name: "Tavily", role: "DISCOVERY", mode: "PRIMARY", responsibility: "Tìm nguồn web có nội dung sâu", mayOverlapWith: ["Brave", "Gemini", "OpenAI"] },
  { name: "Brave", role: "DISCOVERY", mode: "SECONDARY", responsibility: "Mở rộng độ phủ nguồn web độc lập", mayOverlapWith: ["Tavily", "Gemini", "OpenAI"] },
  { name: "Gemini", role: "DISCOVERY", mode: "SECONDARY", responsibility: "Bổ sung nguồn từ Google Search grounding", mayOverlapWith: ["Tavily", "Brave", "OpenAI"] },
  { name: "OpenAI", role: "DISCOVERY", mode: "SECONDARY", responsibility: "Bổ sung nguồn web khi được cấu hình", mayOverlapWith: ["Tavily", "Brave", "Gemini"] },
  { name: "Google Places", role: "GEOLOCATION", mode: "PRIMARY", responsibility: "Tìm doanh nghiệp theo địa điểm và tọa độ", mayOverlapWith: ["OpenStreetMap", "Google Maps / Nominatim Geocoding"] },
  { name: "OpenStreetMap", role: "GEOLOCATION", mode: "FALLBACK", responsibility: "Dự phòng tìm địa điểm khi discovery rỗng", mayOverlapWith: ["Google Places", "Google Maps / Nominatim Geocoding"] },
  { name: "Trafilatura", role: "DEEP_READING", mode: "SHADOW", responsibility: "Đọc sâu nội dung nguồn đã tìm thấy", mayOverlapWith: [] },
  { name: "Gemini Directory Extraction", role: "NORMALIZATION", mode: "PRIMARY", responsibility: "Tách nhiều doanh nghiệp từ trang danh bạ", mayOverlapWith: ["DeepSeek Normalization"] },
  { name: "DeepSeek Normalization", role: "NORMALIZATION", mode: "PRIMARY", responsibility: "Chuẩn hóa nguồn thành hồ sơ doanh nghiệp", mayOverlapWith: ["Gemini Directory Extraction"] },
  { name: "Contact Enrichment", role: "ENRICHMENT", mode: "SECONDARY", responsibility: "Bổ sung liên hệ có chứng cứ", mayOverlapWith: ["Gemini Web Agent"] },
  { name: "Gemini Web Agent", role: "ENRICHMENT", mode: "SECONDARY", responsibility: "Bổ sung trường còn thiếu từ nguồn đã thu thập", mayOverlapWith: ["Contact Enrichment"] },
  { name: "Google Maps / Nominatim Geocoding", role: "GEOLOCATION", mode: "PRIMARY", responsibility: "Xác minh tọa độ và khoảng cách của hồ sơ", mayOverlapWith: ["Google Places", "OpenStreetMap"] },
] as const;

export function buildApi1ProviderContractAudit(operations: Api0OperationObservation[]): Api1ProviderContractAudit {
  const contracts = new Map(API1_PROVIDER_CONTRACTS.map((contract) => [contract.name, contract]));
  const findings: Api1ContractFinding[] = [];
  const seen = new Map<string, number>();
  const activeProvidersByRole: Partial<Record<Api0OperationRole, string[]>> = {};

  for (const operation of operations) {
    seen.set(operation.name, (seen.get(operation.name) ?? 0) + 1);
    const contract = contracts.get(operation.name);
    if (!contract) {
      findings.push({ code: "UNDECLARED_OPERATION", severity: "WARNING", operation: operation.name, detail: "API chưa có hợp đồng trách nhiệm trong API1." });
      continue;
    }
    if (contract.role !== operation.role) {
      findings.push({ code: "ROLE_MISMATCH", severity: "WARNING", operation: operation.name, detail: `Vai trò quan sát ${operation.role} khác hợp đồng ${contract.role}.` });
    }
    if (operation.status !== "DISABLED" && operation.status !== "SKIPPED") {
      const names = activeProvidersByRole[operation.role] ?? [];
      if (!names.includes(operation.name)) names.push(operation.name);
      activeProvidersByRole[operation.role] = names;
    }
  }

  for (const [name, count] of seen) {
    if (count > 1) findings.push({ code: "DUPLICATE_OBSERVATION", severity: "WARNING", operation: name, detail: `Một lượt tìm kiếm ghi nhận ${count} lần cho cùng API.` });
  }

  for (const [role, names] of Object.entries(activeProvidersByRole) as Array<[Api0OperationRole, string[]]>) {
    for (let leftIndex = 0; leftIndex < names.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < names.length; rightIndex += 1) {
        const left = contracts.get(names[leftIndex]);
        const rightName = names[rightIndex];
        if (left && !left.mayOverlapWith.includes(rightName)) {
          findings.push({ code: "UNDECLARED_OVERLAP", severity: "WARNING", operation: left.name, detail: `${left.name} và ${rightName} cùng chạy vai trò ${role} nhưng chưa khai báo được phép chồng lấn.` });
        }
      }
    }
  }

  return {
    schemaVersion: "API1.1",
    shadowOnly: true,
    contractCount: API1_PROVIDER_CONTRACTS.length,
    observedOperationCount: operations.length,
    activeProvidersByRole: Object.fromEntries(Object.entries(activeProvidersByRole).map(([role, names]) => [role, [...names].sort()])),
    findings,
    healthy: !findings.some((finding) => finding.severity === "WARNING"),
  };
}

export function api1ToolCall(audit: Api1ProviderContractAudit): { type: "API1_PROVIDER_CONTRACT_AUDIT"; audit: Api1ProviderContractAudit } {
  return { type: "API1_PROVIDER_CONTRACT_AUDIT", audit };
}
