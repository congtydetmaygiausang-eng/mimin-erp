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
  // ============ KHO - Minimax (Anh Kho) ============
  {
    agentId: "agent-kho",
    taskTypes: ["kho"],
    keywords: {
      high: ["kho", "tồn kho", "nhập kho", "xuất kho", "vải", "sợi", "phụ liệu", "thành phẩm", "kiểm kê", "tồn"],
      medium: ["nhập", "xuất", "vật tư", "nguyên liệu", "kiểm"],
      low: ["vải còn", "còn bao nhiêu", "bù vải"],
    },
    patterns: [
      /tồn kho.*?(vải|sợi|phụ liệu)/i,
      /nhập.*?kho/i,
      /xuất.*?kho/i,
      /kiểm kê/i,
    ],
  },
  // ============ SẢN XUẤT - DeepSeek (Anh Hùng) ============
  {
    agentId: "agent-san-xuat",
    taskTypes: ["san-xuat"],
    keywords: {
      high: ["lệnh cắt", "khsx", "kế hoạch sản xuất", "chuyền may", "công đoạn", "may áo", "may quần"],
      medium: ["sản xuất", "lsx", "cắt vải", "tiến độ may", "chuyền"],
      low: ["thợ may", "công nhân may", "lịch sản xuất"],
    },
    patterns: [
      /lệnh cắt.*?(mới|tạo|thêm)/i,
      /khsx/i,
      /tiến độ.*?(chuyền may|may)/i,
    ],
  },
  // ============ KẾ TOÁN - Gemini (Anh Sơn) ============
  {
    agentId: "agent-ke-toan",
    taskTypes: ["ke-toan"],
    keywords: {
      high: ["công nợ", "đối soát", "tính lương", "bảng lương", "tiền công", "phải thu", "phải trả"],
      medium: ["lương", "thuế", "hóa đơn", "thanh toán", "công nhận"],
      low: ["chốt sổ", "sổ sách", "kế toán"],
    },
    patterns: [
      /tính lương.*?(tháng|năm)/i,
      /đối soát.*?(sản lượng|tiền công)/i,
      /công nợ.*?(phải|thu|trả)/i,
    ],
    excludeKeywords: ["báo cáo tài chính", "dòng tiền", "chi phí sản xuất", "excel"],
  },
  // ============ NHÂN SỰ - DeepSeek (Chị Mai) ============
  {
    agentId: "agent-nhan-su",
    taskTypes: ["nhan-su"],
    keywords: {
      high: ["nhân viên", "nhân sự", "hồ sơ", "chấm công", "phân quyền", "tài khoản"],
      medium: ["tuyển dụng", "lương cứng", "phòng ban", "nghỉ phép", "thưởng"],
      low: ["sang", "giau", "thanh", "huyen", "vy", "hau", "giang", "de", "phu", "nhi", "phuong", "tim", "phien", "tuyen", "huynh", "thuy", "anhui", "ruong", "khoi"],
    },
    patterns: [
      /chấm công/i,
      /phân quyền/i,
      /nhân viên.*?(mới|thêm|tạo)/i,
    ],
    excludeKeywords: ["tính lương", "bảng lương", "công nợ"],
  },
  // ============ BÁN HÀNG - Minimax (Chị Hoa) ============
  {
    agentId: "agent-ban-hang",
    taskTypes: ["ban-hang"],
    keywords: {
      high: ["đơn hàng", "khách hàng", "giao hàng", "đặt hàng", "đơn mới"],
      medium: ["bán sỉ", "bán lẻ", "vận chuyển", "giao", "nhận hàng"],
      low: ["shop", "đại lý", "kênh bán"],
    },
    patterns: [
      /đơn hàng.*?(mới|tạo|thêm)/i,
      /giao hàng/i,
      /khách hàng.*?(mới|thêm)/i,
    ],
  },
  // ============ TÀI CHÍNH - Gemini (Anh Quốc) - CFO ============
  {
    agentId: "agent-tai-chinh",
    taskTypes: ["tai-chinh", "phan-tich"],
    keywords: {
      high: ["báo cáo tài chính", "dòng tiền", "chi phí sản xuất", "lợi nhuận", "excel", "doanh thu"],
      medium: ["tài chính", "chi phí", "doanh thu", "lỗ", "lãi", "rủi ro", "ngân sách", "kế hoạch tài chính"],
      low: ["phân tích", "dự báo", "tăng trưởng"],
    },
    patterns: [
      /báo cáo.*?(tài chính|excel)/i,
      /dòng tiền/i,
      /chi phí.*?(sản xuất|nguyên vật liệu)/i,
      /lợi nhuận/i,
    ],
  },
  // ============ QC + THEO DÕI CÔNG ĐOẠN - DeepSeek (Chị Hạnh) ============
  {
    agentId: "agent-theo-doi-cd",
    taskTypes: ["qc", "san-xuat"],
    keywords: {
      high: ["qc", "kiểm tra chất lượng", "lỗi", "phế phẩm", "bàn giao"],
      medium: ["công đoạn", "hàng lỗi", "đạt chất lượng", "kiểm"],
      low: ["hoàn thiện", "ủi", "gấp"],
    },
    patterns: [
      /lỗi.*?(sản phẩm|may)/i,
      /qc.*?(báo cáo|check)/i,
      /bàn giao/i,
    ],
  },
  // ============ KỸ THUẬT MÁY - DeepSeek (Anh Tuấn) ============
  {
    agentId: "agent-ky-thuat-may",
    taskTypes: ["ky-thuat"],
    keywords: {
      high: ["máy may", "sự cố máy", "hỏng máy", "bảo trì máy"],
      medium: ["định mức", "kỹ thuật", "quy trình may", "máy"],
      low: ["thiết bị", "sửa chữa"],
    },
    patterns: [
      /máy may.*?(hỏng|trục trặc|sự cố)/i,
      /định mức.*?(thời gian|kỹ thuật)/i,
    ],
  },
  // ============ DEEPSEEK REASONER (Anh Sâu) - Phân tích logic ============
  {
    agentId: "agent-deepseek",
    taskTypes: ["phan-tich"],
    keywords: {
      high: ["tối ưu", "phân tích logic", "dự báo", "mô hình"],
      medium: ["giải thích", "tại sao", "nguyên nhân", "đề xuất", "phân tích"],
      low: ["phức tạp", "khó", "cần suy nghĩ"],
    },
    patterns: [
      /tối ưu/i,
      /phân tích.*?(định mức|quy trình|sản xuất|chi phí)/i,
      /dự báo/i,
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
  { input: "Tồn kho vải còn bao nhiêu?", expected: "agent-kho" },
  { input: "Tính lương tháng 7 cho thợ may", expected: "agent-ke-toan" },
  { input: "Báo cáo tài chính quý 3 file Excel", expected: "agent-tai-chinh" },
  { input: "Tạo lệnh cắt mới cho đơn M758", expected: "agent-san-xuat" },
  { input: "Lỗi hàng QC tuần này", expected: "agent-theo-doi-cd" },
  { input: "Đơn hàng mới từ khách sỉ", expected: "agent-ban-hang" },
  { input: "Máy may số 5 bị hỏng", expected: "agent-ky-thuat-may" },
  { input: "Phân tích định mức vải tối ưu", expected: "agent-deepseek" },
  { input: "Chấm công cho Sang hôm qua", expected: "agent-nhan-su" },
  { input: "Trời hôm nay đẹp nhỉ", expected: "orchestrator (general)" },
];
