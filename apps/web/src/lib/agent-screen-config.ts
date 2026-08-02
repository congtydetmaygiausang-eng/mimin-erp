// ============================================
// MIMIN ERP - Agent Screen Config
// Spec do sep Sang viet (2026-08-03) - Cau hinh AI hien thi theo man hinh
// Moi man hinh co 1 AI phu trach chinh + cac AI phoi hop theo khu vuc
// ============================================

import { AGENT_PERSONAS } from "./agent-personas";

// ============================================
// AGENT STATUS (7 trang thai)
// ============================================
export type AgentStatus =
  | "monitoring" // Đang theo dõi - đã nhận context
  | "checking" // Đang kiểm tra - đang đọc dữ liệu
  | "awaiting" // Đang chờ xác nhận - đã có đề xuất
  | "executing" // Đang thực hiện - đang bấm/cập nhật
  | "done" // Đã hoàn thành - đã thực hiện + kiểm chứng
  | "warning" // Có cảnh báo - phát hiện sai lệch
  | "blocked"; // Bị chặn - thiếu quyền/dữ liệu

export const AGENT_STATUS_LABELS: Record<AgentStatus, { label: string; color: string; icon: string }> = {
  monitoring: { label: "Đang theo dõi", color: "bg-sky-100 text-sky-700 border-sky-300", icon: "👁️" },
  checking: { label: "Đang kiểm tra", color: "bg-blue-100 text-blue-700 border-blue-300", icon: "🔍" },
  awaiting: { label: "Đang chờ xác nhận", color: "bg-amber-100 text-amber-700 border-amber-300", icon: "⏳" },
  executing: { label: "Đang thực hiện", color: "bg-violet-100 text-violet-700 border-violet-300", icon: "⚙️" },
  done: { label: "Đã hoàn thành", color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: "✅" },
  warning: { label: "Có cảnh báo", color: "bg-orange-100 text-orange-700 border-orange-300", icon: "⚠️" },
  blocked: { label: "Bị chặn", color: "bg-rose-100 text-rose-700 border-rose-300", icon: "🔒" },
};

// ============================================
// SCREEN SECTION (khu vuc chuyen mon)
// ============================================
export type ScreenSection =
  | "fabric" // vải
  | "materials" // phụ liệu
  | "inventory" // tồn kho
  | "process_cost" // đơn giá công đoạn
  | "fixed_cost" // chi phí cố định
  | "cogs" // COGS
  | "general" // thông tin chung
  | "order" // đơn hàng
  | "customer" // khách hàng
  | "payment" // thanh toán
  | "salary" // lương
  | "production" // sản xuất
  | "qc" // chất lượng
  | "staff" // nhân viên
  | "system" // hệ thống
  | "report"; // báo cáo

// ============================================
// SCREEN ROUTING CONFIG
// Moi man hinh co 1 primaryAgent + cac supportingAgents theo section
// ============================================
export interface ScreenConfig {
  screenCode: string;
  screenName: string;
  primaryAgent: string; // agent_id
  supportingAgents: Array<{
    agent: string;
    sections: ScreenSection[];
  }>;
  allowedActions?: string[];
  confirmationRequired?: boolean;
  requiredPermissions?: string[];
}

export const SCREEN_CONFIGS: ScreenConfig[] = [
  // ===== SẢN XUẤT =====
  {
    screenCode: "PRODUCTION_OVERVIEW",
    screenName: "Tổng quan sản xuất",
    primaryAgent: "agent-san-xuat",
    supportingAgents: [
      { agent: "agent-kho", sections: ["inventory"] },
      { agent: "agent-tai-chinh", sections: ["cogs"] },
    ],
  },
  {
    screenCode: "PRODUCTION_CUTTING_ORDER_LIST",
    screenName: "Danh sách lệnh cắt",
    primaryAgent: "agent-san-xuat",
    supportingAgents: [{ agent: "agent-kho", sections: ["inventory"] }],
  },
  {
    screenCode: "PRODUCTION_CUTTING_ORDER_CREATE",
    screenName: "Tạo lệnh cắt",
    primaryAgent: "agent-san-xuat",
    supportingAgents: [
      { agent: "agent-kho", sections: ["fabric", "materials", "inventory"] },
      { agent: "agent-ke-toan", sections: ["process_cost", "fixed_cost", "cogs"] },
    ],
    confirmationRequired: true,
    requiredPermissions: ["lenh-cat.create", "kho.view", "ke-toan.view"],
  },
  {
    screenCode: "PRODUCTION_CUTTING_ORDER_DETAIL",
    screenName: "Chi tiết lệnh cắt",
    primaryAgent: "agent-san-xuat",
    supportingAgents: [
      { agent: "agent-kho", sections: ["fabric", "materials", "inventory"] },
      { agent: "agent-ke-toan", sections: ["process_cost", "fixed_cost", "cogs"] },
    ],
  },
  {
    screenCode: "PRODUCTION_PHASE_ASSIGNMENT",
    screenName: "Phân công công đoạn",
    primaryAgent: "agent-san-xuat",
    supportingAgents: [{ agent: "agent-nhan-su", sections: ["staff"] }],
    confirmationRequired: true,
  },
  {
    screenCode: "PRODUCTION_PROGRESS_TRACKING",
    screenName: "Theo dõi tiến độ",
    primaryAgent: "agent-san-xuat",
    supportingAgents: [{ agent: "agent-nhan-su", sections: ["staff"] }],
  },
  {
    screenCode: "PRODUCTION_QC",
    screenName: "QC sản xuất",
    primaryAgent: "agent-san-xuat",
    supportingAgents: [{ agent: "agent-kho", sections: ["inventory"] }],
  },

  // ===== KHO =====
  {
    screenCode: "INVENTORY_FABRIC",
    screenName: "Kho vải",
    primaryAgent: "agent-kho",
    supportingAgents: [
      { agent: "agent-san-xuat", sections: ["fabric"] },
      { agent: "agent-tai-chinh", sections: ["cogs"] },
    ],
  },
  {
    screenCode: "INVENTORY_MATERIALS",
    screenName: "Kho bo và phụ liệu",
    primaryAgent: "agent-kho",
    supportingAgents: [
      { agent: "agent-san-xuat", sections: ["materials"] },
      { agent: "agent-tai-chinh", sections: ["cogs"] },
    ],
  },
  {
    screenCode: "INVENTORY_IMPORT",
    screenName: "Nhập kho",
    primaryAgent: "agent-kho",
    supportingAgents: [{ agent: "agent-ke-toan", sections: ["payment"] }],
    confirmationRequired: true,
  },
  {
    screenCode: "INVENTORY_EXPORT",
    screenName: "Xuất kho",
    primaryAgent: "agent-kho",
    supportingAgents: [
      { agent: "agent-san-xuat", sections: ["production"] },
      { agent: "agent-ke-toan", sections: ["cogs"] },
    ],
    confirmationRequired: true,
  },
  {
    screenCode: "INVENTORY_AUDIT",
    screenName: "Kiểm kê",
    primaryAgent: "agent-kho",
    supportingAgents: [{ agent: "agent-ke-toan", sections: ["cogs"] }],
    confirmationRequired: true,
  },

  // ===== BÁN HÀNG =====
  {
    screenCode: "SALES_ORDER_LIST",
    screenName: "Danh sách đơn hàng",
    primaryAgent: "agent-ban-hang",
    supportingAgents: [
      { agent: "agent-kho", sections: ["inventory"] },
      { agent: "agent-tai-chinh", sections: ["cogs"] },
    ],
  },
  {
    screenCode: "SALES_ORDER_CREATE",
    screenName: "Tạo đơn hàng",
    primaryAgent: "agent-ban-hang",
    supportingAgents: [
      { agent: "agent-kho", sections: ["inventory"] },
      { agent: "agent-ke-toan", sections: ["payment"] },
    ],
    confirmationRequired: true,
  },
  {
    screenCode: "SALES_CUSTOMER",
    screenName: "Khách hàng",
    primaryAgent: "agent-ban-hang",
    supportingAgents: [{ agent: "agent-tai-chinh", sections: ["payment"] }],
  },

  // ===== KẾ TOÁN =====
  {
    screenCode: "ACCOUNTING_RECEIPT",
    screenName: "Phiếu thu",
    primaryAgent: "agent-ke-toan",
    supportingAgents: [{ agent: "agent-tai-chinh", sections: ["payment"] }],
    confirmationRequired: true,
  },
  {
    screenCode: "ACCOUNTING_PAYROLL",
    screenName: "Bảng lương",
    primaryAgent: "agent-ke-toan",
    supportingAgents: [{ agent: "agent-nhan-su", sections: ["staff"] }],
    confirmationRequired: true,
  },
  {
    screenCode: "ACCOUNTING_PRODUCTION_COST",
    screenName: "Chi phí sản xuất",
    primaryAgent: "agent-ke-toan",
    supportingAgents: [
      { agent: "agent-san-xuat", sections: ["production"] },
      { agent: "agent-kho", sections: ["inventory"] },
    ],
  },

  // ===== TÀI CHÍNH =====
  {
    screenCode: "FINANCE_DEBT",
    screenName: "Công nợ",
    primaryAgent: "agent-tai-chinh",
    supportingAgents: [
      { agent: "agent-ke-toan", sections: ["payment"] },
      { agent: "agent-ban-hang", sections: ["customer"] },
    ],
  },
  {
    screenCode: "FINANCE_CASHFLOW",
    screenName: "Dòng tiền",
    primaryAgent: "agent-tai-chinh",
    supportingAgents: [{ agent: "agent-ke-toan", sections: ["payment"] }],
  },
  {
    screenCode: "FINANCE_REPORT",
    screenName: "Báo cáo tài chính",
    primaryAgent: "agent-tai-chinh",
    supportingAgents: [{ agent: "agent-ke-toan", sections: ["payment"] }],
  },

  // ===== NHÂN SỰ =====
  {
    screenCode: "HR_STAFF",
    screenName: "Nhân viên",
    primaryAgent: "agent-nhan-su",
    supportingAgents: [{ agent: "agent-ke-toan", sections: ["salary"] }],
  },
  {
    screenCode: "HR_ATTENDANCE",
    screenName: "Chấm công",
    primaryAgent: "agent-nhan-su",
    supportingAgents: [{ agent: "agent-san-xuat", sections: ["production"] }],
  },
  {
    screenCode: "HR_NOTIFICATION",
    screenName: "Thông báo nội bộ",
    primaryAgent: "agent-nhan-su",
    supportingAgents: [{ agent: "agent-san-xuat", sections: [] }, { agent: "agent-kho", sections: [] }],
  },

  // ===== HỆ THỐNG =====
  {
    screenCode: "SYSTEM_PERMISSIONS",
    screenName: "Phân quyền hệ thống",
    primaryAgent: "mimin-orchestrator",
    supportingAgents: [
      { agent: "agent-nhan-su", sections: ["staff"] },
      { agent: "agent-ke-toan", sections: ["system"] },
    ],
    confirmationRequired: true,
    requiredPermissions: ["admin"],
  },
  {
    screenCode: "SYSTEM_CODE_REVIEW",
    screenName: "Kiểm tra dự án/code",
    primaryAgent: "mimin-orchestrator",
    supportingAgents: [
      { agent: "agent-san-xuat", sections: ["production"] },
      { agent: "agent-kho", sections: ["inventory"] },
      { agent: "agent-ke-toan", sections: ["cogs"] },
    ],
  },
];

// ============================================
// SCREEN CONTEXT
// Khi user mo man hinh, he thong gui context cho Agent
// ============================================
export interface ScreenContext {
  screenCode: string;
  screenName: string;
  primaryAgent: string;
  supportingAgents: string[];
  recordId: string | null;
  recordStatus: "DRAFT" | "PENDING" | "APPROVED" | "IN_PROGRESS" | "DONE" | "REJECTED" | "CANCELLED" | string;
  hasUnsavedChanges: boolean;
  userId?: string;
  userRole?: string;
  permissions?: string[];
  currentFormData?: Record<string, any>;
  missingFields?: string[];
  validationErrors?: string[];
}

// ============================================
// HELPER: Lay config cho screenCode
// ============================================
export function getScreenConfig(screenCode: string): ScreenConfig | undefined {
  return SCREEN_CONFIGS.find((s) => s.screenCode === screenCode);
}

export function getPrimaryAgent(screenCode: string) {
  const config = getScreenConfig(screenCode);
  if (!config) return null;
  return AGENT_PERSONAS[config.primaryAgent] || null;
}

export function getSupportingAgents(screenCode: string) {
  const config = getScreenConfig(screenCode);
  if (!config) return [];
  return config.supportingAgents
    .map((sa) => AGENT_PERSONAS[sa.agent])
    .filter(Boolean);
}

// ============================================
// HELPER: Build greeting theo screen context
// ============================================
export function buildAgentGreeting(context: ScreenContext): string {
  const primary = AGENT_PERSONAS[context.primaryAgent];
  if (!primary) return "";

  const supportingNames = context.supportingAgents
    .map((id) => AGENT_PERSONAS[id]?.name)
    .filter(Boolean)
    .join(", ");

  let greeting = `Dạ anh, em là ${primary.name}, phụ trách ${context.screenName} tại màn hình này.`;

  if (supportingNames) {
    greeting += ` Em đang phối hợp với ${supportingNames}.`;
  }

  // Tasks của primary agent
  if (context.screenCode.startsWith("PRODUCTION_CUTTING_ORDER")) {
    greeting += " Em đang kiểm tra thông tin sản phẩm, màu, size, nguyên liệu, công đoạn và tiến độ cho anh.";
  } else if (context.screenCode.startsWith("INVENTORY")) {
    greeting += " Em đang theo dõi tồn kho vải và phụ liệu.";
  } else if (context.screenCode.startsWith("SALES")) {
    greeting += " Em đang hỗ trợ anh về đơn hàng và khách hàng.";
  } else if (context.screenCode.startsWith("ACCOUNTING") || context.screenCode.startsWith("FINANCE")) {
    greeting += " Em đang theo dõi chi phí, lương và dòng tiền.";
  }

  return greeting;
}
