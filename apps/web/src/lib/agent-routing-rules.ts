// ============================================
// MIMIN ERP - Agent Routing Rules (v89.6.9.4)
// Logic phân loại task từ user → agent phù hợp
// Mavis (orchestrator) sẽ dùng file này để route
// ============================================

import { AGENT_PERSONAS, type AgentPersona } from "./agent-personas";

export type TaskType =
  | "san-xuat"      // Lệnh cắt, KHSX, chuyền may
  | "kho"           // Tồn kho, nhập xuất, kiểm kê
  | "ke-toan"       // Công nợ, tiền công, lương
  | "nhan-su"       // Hồ sơ NV, chấm công, phân quyền
  | "ban-hang"      // Đơn hàng, KH, giao hàng
  | "tai-chinh"     // Báo cáo TC, dòng tiền, chi phí
  | "qc"            // Kiểm tra CL, theo dõi công đoạn
  | "ky-thuat"      // Sự cố máy may, định mức KT
  | "phan-tich"     // Logic phức tạp, tối ưu, dự báo
  | "general";      // Chung, hỏi đáp, tổng hợp

export interface RouteRule {
  agentId: string;
  taskTypes: TaskType[];
  // Keywords scoring: keyword nào xuất hiện → +score
  // Phân biệt: tiếng Việt có dấu/không dấu, cụm từ
  keywords: {
    high: string[];   // +3 điểm (chắc chắn match)
    medium: string[]; // +2 điểm
    low: string[];    // +1 điểm
  };
  // Pattern regex (chính xác hơn keyword)
  patterns?: RegExp[];
  // Nếu task có chứa keyword này → loại bỏ agent này (negative)
  excludeKeywords?: string[];
}

export const ROUTE_RULES: RouteRule[] = [
  // ============ SẢN XUẤT E2E (Minh) ============
  {
    agentId: "minh",
    taskTypes: ["san-xuat", "qc", "ky-thuat"],
    keywords: {
      high: ["lệnh cắt", "khsx", "kế hoạch sản xuất", "chuyền may", "công đoạn", "may áo", "may quần", "qc", "kiểm tra chất lượng", "lỗi", "phế phẩm", "máy may", "sự cố máy", "hỏng máy", "gia công ngoài", "xưởng gia công"],
      medium: ["sản xuất", "lsx", "cắt vải", "tiến độ may", "chuyền", "công đoạn", "hàng lỗi", "đạt chất lượng", "định mức", "kỹ thuật", "quy trình may", "gia công", "bàn giao gia công", "sản lượng gia công", "tiền công gia công"],
      low: ["thợ may", "công nhân may", "lịch sản xuất", "hoàn thiện", "ủi", "gấp", "thiết bị", "sửa chữa"],
    },
    patterns: [
      /lệnh cắt.*?(mới|tạo|thêm)/i,
      /tiến độ.*?(chuyền may|may)/i,
      /lỗi.*?(sản phẩm|may)/i,
      /qc.*?(báo cáo|check)/i,
      /máy may.*?(hỏng|trục trặc|sự cố)/i,
      /gia công.*?(ngoài|xưởng|bàn giao|sản lượng|tiền công)/i,
    ],
  },
  // ============ KHO & BÁN HÀNG (Lan) ============
  {
    agentId: "lan",
    taskTypes: ["kho", "ban-hang"],
    keywords: {
      high: ["kho", "tồn kho", "nhập kho", "xuất kho", "vải", "sợi", "phụ liệu", "đơn hàng", "khách hàng", "đặt hàng", "đơn mới"],
      medium: ["nhập", "xuất", "vật tư", "nguyên liệu", "kiểm kê", "bán sỉ", "bán lẻ"],
      low: ["vải còn", "còn bao nhiêu", "bù vải", "shop", "đại lý", "kênh bán"],
    },
    patterns: [
      /tồn kho.*?(vải|sợi|phụ liệu)/i,
      /nhập.*?kho/i,
      /xuất.*?kho/i,
      /đơn hàng.*?(mới|tạo|thêm)/i,
    ],
  },
  // ============ TÀI CHÍNH - KẾ TOÁN - NHÂN SỰ (Hà) ============
  {
    agentId: "ha",
    taskTypes: ["ke-toan", "tai-chinh", "nhan-su"],
    keywords: {
      high: ["công nợ", "đối soát", "tính lương", "bảng lương", "tiền công", "phải thu", "phải trả", "báo cáo tài chính", "dòng tiền", "chi phí sản xuất", "lợi nhuận", "excel", "nhân viên", "nhân sự", "chấm công", "phân quyền"],
      medium: ["lương", "thuế", "hóa đơn", "thanh toán", "tài chính", "chi phí", "doanh thu", "tuyển dụng", "nghỉ phép", "thưởng", "rủi ro"],
      low: ["chốt sổ", "kế toán", "phân tích", "dự báo", "phòng ban"],
    },
    patterns: [
      /tính lương.*?(tháng|năm)/i,
      /đối soát.*?(sản lượng|tiền công)/i,
      /công nợ.*?(phải|thu|trả)/i,
      /báo cáo.*?(tài chính|excel)/i,
      /chi phí.*?(sản xuất|nguyên vật liệu)/i,
      /chấm công/i,
    ],
  },
  // ============ CSKH (Vy) ============
  {
    agentId: "vy",
    taskTypes: ["ban-hang"],
    keywords: {
      high: ["giao hàng", "khiếu nại", "tư vấn", "hỗ trợ", "đổi trả", "thắc mắc"],
      medium: ["vận chuyển", "nhận hàng", "phản hồi", "tracking", "chăm sóc khách hàng"],
      low: ["hỏi", "đáp", "giúp"],
    },
    patterns: [
      /giao hàng/i,
      /đơn hàng.*?(đâu|chưa|khi nào)/i,
    ],
  },
  // ============ MIMIN HELP - LOGIC REASONING (Mimin-help) ============
  {
    agentId: "mimin-help",
    taskTypes: ["phan-tich", "general"],
    keywords: {
      high: ["tối ưu", "phân tích logic", "dự báo", "mô hình", "hướng dẫn", "cách dùng", "help", "lỗi hệ thống", "báo cáo tổng hợp", "bảng điều hành", "real-time", "realtime"],
      medium: ["giải thích", "tại sao", "nguyên nhân", "đề xuất", "phân tích", "tài liệu", "báo cáo", "cảnh báo"],
      low: ["phức tạp", "khó", "cần suy nghĩ", "làm sao"],
    },
    patterns: [
      /tối ưu/i,
      /phân tích.*?(định mức|quy trình|sản xuất|chi phí)/i,
      /hướng dẫn.*?(cách|sử dụng)/i,
      /báo cáo.*?(tổng hợp|toàn hệ thống)/i,
      /bảng điều hành/i,
    ],
  },
];

// ============================================
// SCORING + ROUTING
// ============================================

export interface RouteScore {
  agentId: string;
  agentName: string;
  score: number;
  reasons: string[];
  matchedKeywords: string[];
  taskTypes: TaskType[];
}

export interface RouteResult {
  primary: RouteScore | null;
  secondary: RouteScore[];
  taskTypes: TaskType[];
  isMultiAgent: boolean;
  totalAgents: number;
}

/**
 * Normalize text: bỏ dấu tiếng Việt, lowercase
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tính điểm routing cho 1 rule
 */
function scoreRule(rule: RouteRule, normalizedText: string, originalText: string): RouteScore {
  const reasons: string[] = [];
  const matchedKeywords: string[] = [];
  let score = 0;

  // Check exclude keywords (nếu có → loại bỏ)
  if (rule.excludeKeywords) {
    for (const kw of rule.excludeKeywords) {
      if (originalText.toLowerCase().includes(kw.toLowerCase())) {
        return { agentId: rule.agentId, agentName: AGENT_PERSONAS[rule.agentId]?.name || rule.agentId, score: 0, reasons: [`excluded by "${kw}"`], matchedKeywords: [], taskTypes: rule.taskTypes };
      }
    }
  }

  // Score keywords
  for (const kw of rule.keywords.high) {
    if (originalText.toLowerCase().includes(kw.toLowerCase())) {
      score += 3;
      matchedKeywords.push(kw);
      reasons.push(`+3 (high): "${kw}"`);
    }
  }
  for (const kw of rule.keywords.medium) {
    if (originalText.toLowerCase().includes(kw.toLowerCase())) {
      score += 2;
      matchedKeywords.push(kw);
      reasons.push(`+2 (medium): "${kw}"`);
    }
  }
  for (const kw of rule.keywords.low) {
    if (originalText.toLowerCase().includes(kw.toLowerCase())) {
      score += 1;
      matchedKeywords.push(kw);
      reasons.push(`+1 (low): "${kw}"`);
    }
  }

  // Score patterns (regex) - bonus +5 nếu match
  if (rule.patterns) {
    for (const pattern of rule.patterns) {
      if (pattern.test(originalText)) {
        score += 5;
        reasons.push(`+5 (pattern): ${pattern.source.slice(0, 30)}`);
      }
    }
  }

  return {
    agentId: rule.agentId,
    agentName: AGENT_PERSONAS[rule.agentId]?.name || rule.agentId,
    score,
    reasons,
    matchedKeywords,
    taskTypes: rule.taskTypes,
  };
}

/**
 * Route 1 user input → agent phù hợp
 * Returns: { primary, secondary, taskTypes, isMultiAgent }
 */
export function routeTask(userInput: string): RouteResult {
  const scores: RouteScore[] = ROUTE_RULES
    .map((rule) => scoreRule(rule, normalizeText(userInput), userInput))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Nếu không có score nào → fallback về orchestrator
  if (scores.length === 0) {
    return {
      primary: null,
      secondary: [],
      taskTypes: ["general"],
      isMultiAgent: false,
      totalAgents: 0,
    };
  }

  // Lấy top score và các score gần bằng (>= top * 0.6) cho multi-agent
  const topScore = scores[0].score;
  const primary = scores[0];
  const secondary = scores.slice(1).filter((s) => s.score >= topScore * 0.6);

  // Tổng hợp task types
  const taskTypesSet = new Set<TaskType>();
  [primary, ...secondary].forEach((s) => s.taskTypes.forEach((t) => taskTypesSet.add(t)));
  const taskTypes = Array.from(taskTypesSet);

  return {
    primary,
    secondary,
    taskTypes,
    isMultiAgent: secondary.length > 0,
    totalAgents: 1 + secondary.length,
  };
}

/**
 * Route + format message cho Mavis
 */
export function formatRouteForMavis(userInput: string): string {
  const result = routeTask(userInput);

  if (!result.primary) {
    return `Mavis: Không match agent cụ thể, tôi sẽ xử lý chung.`;
  }

  if (!result.isMultiAgent) {
    return `Mavis → ${result.primary.agentName}: ${result.primary.reasons.slice(0, 2).join(", ")}`;
  }

  // Multi-agent: cộng tác
  const agents = [result.primary, ...result.secondary]
    .map((s) => s.agentName)
    .join(" + ");
  return `Mavis → Multi-agent (${result.totalAgents}): ${agents}`;
}

// ============================================
// ROUTING EXAMPLES (test cases)
// ============================================
export const ROUTING_EXAMPLES: Array<{ input: string; expected: string }> = [
  { input: "Tồn kho vải còn bao nhiêu?", expected: "lan" },
  { input: "Tính lương tháng 7 cho thợ may", expected: "ha" },
  { input: "Báo cáo tài chính quý 3 file Excel", expected: "ha" },
  { input: "Tạo lệnh cắt mới cho đơn M758", expected: "minh" },
  { input: "Lỗi hàng QC tuần này", expected: "minh" },
  { input: "Đơn hàng mới từ khách sỉ", expected: "lan" },
  { input: "Máy may số 5 bị hỏng", expected: "minh" },
  { input: "Phân tích định mức vải tối ưu", expected: "mimin-help" },
  { input: "Chấm công cho Sang hôm qua", expected: "ha" },
  { input: "Bàn giao gia công ngoài tuần này", expected: "minh" },
  { input: "Báo cáo tổng hợp toàn hệ thống hôm nay", expected: "mimin-help" },
  { input: "Trời hôm nay đẹp nhỉ", expected: "mavis (general)" },
];
