// ============ PERMISSION MATRIX MỚI — MIMIN ERP v89.6.8 (Đợt 1) ============
// 19 vai trò × 21 module × 15 action × 5 data scope
// Đây là file MỚI, không phá file permissions.ts cũ (vẫn dùng cho PageGuard)
//
// Mapping:
// - File cũ `lib/permissions.ts`: 7 role × 21 module × 4 action (r/c/u/d) - giữ nguyên
// - File mới `lib/permission-matrix.ts`: 19 vai-tro-chuan × 21 module × 15 action × 5 scope
// - Helper `mapLegacyRole(role: string): VaiTroChuan | null` để bridge 2 hệ thống

import type { VaiTroChuan, DataScope } from "./vai-tro-chuan";
import { VAI_TRO_DATA_SCOPE } from "./vai-tro-chuan";

// ============ 15 ACTION (mở rộng từ 4 cũ) ============
export type Action =
  | "VIEW" | "CREATE" | "UPDATE" | "DELETE" // CRUD cơ bản (giữ từ cũ)
  | "ASSIGN"      // Giao việc
  | "RECEIVE"     // Nhận việc
  | "START"       // Bắt đầu làm
  | "REPORT_PROGRESS" // Cập nhật sản lượng
  | "HANDOVER"    // Bàn giao
  | "CONFIRM"     // Xác nhận (công đoạn sau / QC)
  | "APPROVE"     // Phê duyệt (QLSX / GĐ)
  | "REJECT"      // Từ chối
  | "REWORK"      // Yêu cầu làm lại
  | "LOCK"        // Khóa đối soát (kế toán)
  | "PAYMENT"     // Thanh toán
  | "REPORT_ISSUE"  // Báo lỗi / thiếu hàng
  | "REQUEST_SUPPORT"; // Yêu cầu hỗ trợ

export const ALL_ACTIONS: Action[] = [
  "VIEW", "CREATE", "UPDATE", "DELETE",
  "ASSIGN", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER",
  "CONFIRM", "APPROVE", "REJECT", "REWORK", "LOCK", "PAYMENT",
  "REPORT_ISSUE", "REQUEST_SUPPORT",
];

export const ACTION_LABELS: Record<Action, string> = {
  VIEW: "Xem",
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  ASSIGN: "Giao việc",
  RECEIVE: "Nhận việc",
  START: "Bắt đầu làm",
  REPORT_PROGRESS: "Cập nhật sản lượng",
  HANDOVER: "Bàn giao",
  CONFIRM: "Xác nhận",
  APPROVE: "Phê duyệt",
  REJECT: "Từ chối",
  REWORK: "Yêu cầu làm lại",
  LOCK: "Khóa đối soát",
  PAYMENT: "Thanh toán",
  REPORT_ISSUE: "Báo lỗi / thiếu hàng",
  REQUEST_SUPPORT: "Yêu cầu hỗ trợ",
};

// ============ 5 DATA SCOPE (mở rộng từ 6 cũ, gộp PARTNER vào ASSIGNED) ============
// SELF:     chỉ data của mình
// ASSIGNED: data được giao cho mình (cá nhân hoặc đối tác)
// TEAM:     data trong tổ
// DEPARTMENT: data trong phòng ban
// ALL:      toàn hệ thống
export type Scope = "SELF" | "ASSIGNED" | "TEAM" | "DEPARTMENT" | "ALL";

export const ALL_SCOPES: Scope[] = ["SELF", "ASSIGNED", "TEAM", "DEPARTMENT", "ALL"];

export const SCOPE_LABELS: Record<Scope, string> = {
  SELF: "Cá nhân",
  ASSIGNED: "Được giao",
  TEAM: "Tổ",
  DEPARTMENT: "Phòng ban",
  ALL: "Toàn hệ thống",
};

// Map scope mới (5) ↔ scope cũ (6) trong vai-tro-chuan.ts
export const SCOPE_TO_LEGACY: Record<Scope, DataScope> = {
  SELF: "SELF",
  ASSIGNED: "PARTNER",      // đối tác OR cá nhân được giao → gộp vào ASSIGNED
  TEAM: "TEAM",
  DEPARTMENT: "DEPARTMENT",
  ALL: "COMPANY",          // COMPANY + PRODUCTION → ALL
};

// ============ 21 MODULE (giữ nguyên từ permissions.ts cũ) ============
export type Module =
  | "dashboard" | "lenh-cat" | "khach-hang" | "ke-hoach-sx" | "nhan-su"
  | "kho-vai" | "kho-phu-lieu" | "kho-thanh-pham" | "don-hang"
  | "cong-no-cong-doan" | "kiem-tra-chat-luong" | "to-may" | "hoan-thien"
  | "giao-hang" | "cham-cong" | "bang-luong" | "nha-cung-cap"
  | "gia-cong-ngoai" | "bao-cao" | "ai-tinh-gia" | "khach-hang-tiem-nang" | "realtime" | "cai-dat";

export const ALL_MODULES: Module[] = [
  "dashboard", "lenh-cat", "khach-hang", "ke-hoach-sx", "nhan-su",
  "kho-vai", "kho-phu-lieu", "kho-thanh-pham", "don-hang",
  "cong-no-cong-doan", "kiem-tra-chat-luong", "to-may", "hoan-thien",
  "giao-hang", "cham-cong", "bang-luong", "nha-cung-cap",
  "gia-cong-ngoai", "bao-cao", "ai-tinh-gia", "khach-hang-tiem-nang", "realtime", "cai-dat",
];

// ============ LEGACY ROLE MAPPING ============
// Bridge role cũ (admin/planner/...) → vai trò chuẩn
export const LEGACY_ROLE_MAP: Record<string, VaiTroChuan> = {
  admin: "QUAN_TRI_HE_THONG",
  planner: "DIEU_PHOI_SX",
  warehouse: "THU_KHO_VAI",
  sewing: "PHU_TRACH_MAY",
  qc: "PHU_TRACH_QC",
  finishing: "PHU_TRACH_DONG_GOI",
  accountant: "KE_TOAN",
};

/** Map role string (cũ hoặc mới) → VaiTroChuan */
export function toVaiTroChuan(role: string | undefined | null): VaiTroChuan | null {
  if (!role) return null;
  if (role in LEGACY_ROLE_MAP) return LEGACY_ROLE_MAP[role];
  // Nếu đã là vai trò chuẩn
  if (role.startsWith("NHAN_VIEN_") || role.startsWith("PHU_TRACH_") ||
      role.startsWith("DOI_TAC_") || role.startsWith("THU_KHO_") ||
      ["DIEU_PHOI_SX", "KE_TOAN", "GIAM_DOC", "QUAN_TRI_HE_THONG"].includes(role)) {
    return role as VaiTroChuan;
  }
  return null;
}

/** Lấy scope mặc định theo vai trò */
export function getDefaultScope(role: string | undefined | null): Scope {
  const vt = toVaiTroChuan(role);
  if (!vt) return "SELF";
  const legacy = VAI_TRO_DATA_SCOPE[vt];
  // Map legacy scope (6) → scope mới (5)
  if (legacy === "SELF") return "SELF";
  if (legacy === "PARTNER") return "ASSIGNED";
  if (legacy === "TEAM") return "TEAM";
  if (legacy === "DEPARTMENT") return "DEPARTMENT";
  if (legacy === "PRODUCTION" || legacy === "COMPANY") return "ALL";
  return "SELF";
}

// ============ PERMISSION MATRIX ============
// 19 vai trò × 21 module × 15 action → true/false
// Cấu trúc: PERMISSIONS[role][module] = Set of Action (hoặc true/false cho từng action)
//
// Quy tắc:
// - VIEW: hầu hết role có (trừ NHAN_VIEN_* không có dashboard)
// - CREATE/UPDATE/DELETE: phụ thuộc vai trò
// - ASSIGN: QLSX, tổ trưởng các bộ phận
// - RECEIVE/START/REPORT_PROGRESS/HANDOVER: công nhân + đối tác + tổ trưởng
// - CONFIRM: QLSX + tổ trưởng + QC
// - APPROVE/REJECT: QLSX + GĐ + Admin
// - REWORK: tổ trưởng + QLSX
// - LOCK: kế toán
// - PAYMENT: kế toán + GĐ

type PermSet = { [K in Action]?: true };

// Helper để gọn khi khai báo - trả về PermSet { VIEW: true, ... }
// Trả về object literal với index signature để TS hiểu
const all = (...actions: Action[]): PermSet => {
  const result: PermSet = {};
  for (const a of actions) result[a] = true;
  return result;
};

const VIEW_ALL: PermSet = all("VIEW");
const CRUD: PermSet = all("VIEW", "CREATE", "UPDATE", "DELETE");

const PERMISSIONS: Record<VaiTroChuan, Partial<Record<Module, PermSet>>> = {
  // ============ QUẢN LÝ ============
  GIAM_DOC: {
    dashboard: all(...ALL_ACTIONS),
    "lenh-cat": all(...ALL_ACTIONS),
    "khach-hang": all(...ALL_ACTIONS),
    "ke-hoach-sx": all(...ALL_ACTIONS),
    "nhan-su": all(...ALL_ACTIONS),
    "kho-vai": all(...ALL_ACTIONS),
    "kho-phu-lieu": all(...ALL_ACTIONS),
    "kho-thanh-pham": all(...ALL_ACTIONS),
    "don-hang": all(...ALL_ACTIONS),
    "cong-no-cong-doan": all(...ALL_ACTIONS),
    "kiem-tra-chat-luong": all(...ALL_ACTIONS),
    "to-may": all(...ALL_ACTIONS),
    "hoan-thien": all(...ALL_ACTIONS),
    "giao-hang": all(...ALL_ACTIONS),
    "cham-cong": all(...ALL_ACTIONS),
    "bang-luong": all(...ALL_ACTIONS),
    "nha-cung-cap": all(...ALL_ACTIONS),
    "gia-cong-ngoai": all(...ALL_ACTIONS),
    "bao-cao": all(...ALL_ACTIONS),
    "ai-tinh-gia": all(...ALL_ACTIONS),
    "khach-hang-tiem-nang": all(...ALL_ACTIONS),
    realtime: all(...ALL_ACTIONS),
    "cai-dat": all(...ALL_ACTIONS),
  },
  QUAN_TRI_HE_THONG: {
    dashboard: all("VIEW", "UPDATE"),
    "nhan-su": { ...CRUD, ASSIGN: true },
    "cai-dat": CRUD,
    "ai-tinh-gia": all("VIEW"),
    "khach-hang-tiem-nang": all("VIEW"),
    audit_log: all("VIEW"),
  } as any,
  DIEU_PHOI_SX: {
    dashboard: VIEW_ALL,
    "lenh-cat": all("VIEW", "CREATE", "UPDATE", "ASSIGN", "RECEIVE", "START", "HANDOVER", "CONFIRM", "APPROVE", "REJECT", "REWORK"),
    "ke-hoach-sx": all("VIEW", "CREATE", "UPDATE", "ASSIGN", "APPROVE"),
    "nhan-su": all("VIEW"),
    "kho-vai": all("VIEW"),
    "kho-phu-lieu": all("VIEW"),
    "kho-thanh-pham": all("VIEW"),
    "don-hang": all("VIEW"),
    "cong-no-cong-doan": all("VIEW"),
    "kiem-tra-chat-luong": all("VIEW", "ASSIGN", "CONFIRM", "REWORK"),
    "to-may": all("VIEW", "ASSIGN", "RECEIVE", "START", "HANDOVER", "CONFIRM", "REWORK"),
    "hoan-thien": all("VIEW", "ASSIGN", "HANDOVER", "CONFIRM"),
    "giao-hang": all("VIEW"),
    "cham-cong": all("VIEW"),
    "bang-luong": all("VIEW"),
    "nha-cung-cap": all("VIEW"),
    "gia-cong-ngoai": all("VIEW"),
    "bao-cao": all("VIEW"),
    "ai-tinh-gia": all("VIEW"),
    "khach-hang-tiem-nang": all("VIEW", "CREATE", "UPDATE"),
    realtime: all("VIEW"),
  },
  KE_TOAN: {
    dashboard: VIEW_ALL,
    "lenh-cat": all("VIEW"),
    "khach-hang": all("VIEW"),
    "ke-hoach-sx": all("VIEW"),
    "nhan-su": all("VIEW"),
    "kho-vai": all("VIEW"),
    "kho-phu-lieu": all("VIEW"),
    "kho-thanh-pham": all("VIEW"),
    "don-hang": all("VIEW"),
    "cong-no-cong-doan": all("VIEW", "CREATE", "UPDATE", "LOCK", "PAYMENT", "CONFIRM"),
    "kiem-tra-chat-luong": all("VIEW"),
    "to-may": all("VIEW"),
    "hoan-thien": all("VIEW"),
    "giao-hang": all("VIEW"),
    "cham-cong": all("VIEW"),
    "bang-luong": all("VIEW", "CREATE", "UPDATE", "LOCK", "PAYMENT"),
    "nha-cung-cap": all("VIEW", "CREATE", "UPDATE"),
    "gia-cong-ngoai": all("VIEW", "UPDATE"),
    "bao-cao": all("VIEW"),
    "ai-tinh-gia": all("VIEW"),
    realtime: all("VIEW"),
  },
  // ============ KHO ============
  THU_KHO_VAI: {
    dashboard: VIEW_ALL,
    "lenh-cat": all("VIEW", "CONFIRM"),
    "ke-hoach-sx": all("VIEW"),
    "kho-vai": all("VIEW", "CREATE", "UPDATE", "DELETE", "HANDOVER", "CONFIRM"),
    "kho-phu-lieu": all("VIEW", "CREATE", "UPDATE", "DELETE", "HANDOVER", "CONFIRM"),
    "kho-thanh-pham": all("VIEW", "UPDATE", "CONFIRM"),
    "don-hang": all("VIEW"),
    "nha-cung-cap": all("VIEW", "UPDATE"),
    "cham-cong": all("VIEW"),
    "bao-cao": all("VIEW"),
  },
  THU_KHO_TP: {
    dashboard: VIEW_ALL,
    "lenh-cat": all("VIEW", "CONFIRM"),
    "ke-hoach-sx": all("VIEW"),
    "kho-vai": all("VIEW"),
    "kho-phu-lieu": all("VIEW"),
    "kho-thanh-pham": all("VIEW", "CREATE", "UPDATE", "DELETE", "HANDOVER", "CONFIRM"),
    "don-hang": all("VIEW"),
    "nha-cung-cap": all("VIEW"),
    "giao-hang": all("VIEW", "CONFIRM"),
    "bao-cao": all("VIEW"),
  },
  // ============ TỔ CẮT NỘI BỘ ============
  PHU_TRACH_CAT: {
    dashboard: VIEW_ALL,
    "lenh-cat": all("VIEW", "UPDATE", "ASSIGN", "RECEIVE", "HANDOVER", "CONFIRM", "REWORK"),
    "ke-hoach-sx": all("VIEW"),
    "kho-vai": all("VIEW", "HANDOVER", "CONFIRM"),
    "kho-phu-lieu": all("VIEW", "HANDOVER", "CONFIRM"),
    "nhan-su": all("VIEW"),
    "to-may": all("VIEW"),
    "cham-cong": all("VIEW", "CREATE", "UPDATE"),
    "bao-cao": all("VIEW"),
    realtime: all("VIEW"),
  },
  NHAN_VIEN_CAT: {
    "lenh-cat": all("VIEW", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER", "REPORT_ISSUE", "REQUEST_SUPPORT"),
    "kho-vai": all("VIEW"),
  },
  // ============ MAY (đối tác ngoài) ============
  PHU_TRACH_MAY: {
    dashboard: VIEW_ALL,
    "lenh-cat": all("VIEW", "ASSIGN", "RECEIVE", "HANDOVER", "CONFIRM", "REWORK"),
    "ke-hoach-sx": all("VIEW"),
    "kho-vai": all("VIEW"),
    "to-may": all("VIEW", "ASSIGN", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER", "CONFIRM", "REWORK"),
    "cham-cong": all("VIEW", "CREATE", "UPDATE"),
    "bao-cao": all("VIEW"),
  },
  DOI_TAC_MAY: {
    "lenh-cat": all("VIEW", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER", "REPORT_ISSUE", "REQUEST_SUPPORT"),
    "to-may": all("VIEW", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER", "REPORT_ISSUE", "REQUEST_SUPPORT"),
    "cong-no-cong-doan": all("VIEW"), // xem tiền công của mình
  },
  // ============ IN/THÊU/DẬP/KHUY NÚT (gộp vào DOI_TAC_IN_THEU) ============
  PHU_TRACH_IN_THEU: {
    dashboard: VIEW_ALL,
    "lenh-cat": all("VIEW", "ASSIGN", "RECEIVE", "HANDOVER", "CONFIRM", "REWORK"),
    "to-may": all("VIEW", "ASSIGN", "RECEIVE", "HANDOVER", "CONFIRM", "REWORK"),
    "bao-cao": all("VIEW"),
  },
  PHU_TRACH_KHUY_NUT: {
    dashboard: VIEW_ALL,
    "lenh-cat": all("VIEW", "ASSIGN", "RECEIVE", "HANDOVER", "CONFIRM", "REWORK"),
    "hoan-thien": all("VIEW", "ASSIGN", "RECEIVE", "HANDOVER", "CONFIRM", "REWORK"),
    "bao-cao": all("VIEW"),
  },
  DOI_TAC_IN_THEU: {
    // Gộp In + Thêu + Dập + Khuy nút (phân biệt qua module)
    "lenh-cat": all("VIEW", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER", "REPORT_ISSUE", "REQUEST_SUPPORT"),
    "hoan-thien": all("VIEW", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER", "REPORT_ISSUE", "REQUEST_SUPPORT"),
    "cong-no-cong-doan": all("VIEW"),
  },
  // ============ HOÀN THIỆN ============
  PHU_TRACH_UI: {
    dashboard: VIEW_ALL,
    "lenh-cat": all("VIEW", "ASSIGN", "RECEIVE", "HANDOVER", "CONFIRM", "REWORK"),
    "hoan-thien": all("VIEW", "ASSIGN", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER", "CONFIRM", "REWORK"),
    "kho-thanh-pham": all("VIEW", "HANDOVER", "CONFIRM"),
    "cham-cong": all("VIEW", "CREATE", "UPDATE"),
    "bao-cao": all("VIEW"),
  },
  PHU_TRACH_QC: {
    dashboard: VIEW_ALL,
    "lenh-cat": all("VIEW", "ASSIGN", "RECEIVE", "HANDOVER", "CONFIRM", "APPROVE", "REJECT", "REWORK"),
    "kiem-tra-chat-luong": all("VIEW", "CREATE", "UPDATE", "DELETE", "ASSIGN", "RECEIVE", "CONFIRM", "APPROVE", "REJECT", "REWORK"),
    "hoan-thien": all("VIEW", "RECEIVE", "HANDOVER", "CONFIRM"),
    "kho-thanh-pham": all("VIEW"),
    "bao-cao": all("VIEW"),
  },
  PHU_TRACH_DONG_GOI: {
    dashboard: VIEW_ALL,
    "lenh-cat": all("VIEW", "ASSIGN", "RECEIVE", "HANDOVER", "CONFIRM", "REWORK"),
    "hoan-thien": all("VIEW", "ASSIGN", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER", "CONFIRM", "REWORK"),
    "kho-thanh-pham": all("VIEW", "UPDATE", "HANDOVER", "CONFIRM"),
    "cham-cong": all("VIEW", "CREATE", "UPDATE"),
    "bao-cao": all("VIEW"),
  },
  NHAN_VIEN_UI: {
    "lenh-cat": all("VIEW", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER", "REPORT_ISSUE", "REQUEST_SUPPORT"),
    "hoan-thien": all("VIEW", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER", "REPORT_ISSUE", "REQUEST_SUPPORT"),
  },
  NHAN_VIEN_KHUY_NUT: {
    "lenh-cat": all("VIEW", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER", "REPORT_ISSUE", "REQUEST_SUPPORT"),
    "hoan-thien": all("VIEW", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER", "REPORT_ISSUE", "REQUEST_SUPPORT"),
  },
  NHAN_VIEN_DONG_GOI: {
    "lenh-cat": all("VIEW", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER", "REPORT_ISSUE", "REQUEST_SUPPORT"),
    "hoan-thien": all("VIEW", "RECEIVE", "START", "REPORT_PROGRESS", "HANDOVER", "REPORT_ISSUE", "REQUEST_SUPPORT"),
    "kho-thanh-pham": all("VIEW", "UPDATE", "HANDOVER"),
  },
};

// ============ HELPER FUNCTIONS ============

/**
 * Check quyền cơ bản: role có thể làm `action` trên `module` không?
 * KHÔNG check scope - chỉ check role-permission.
 */
export function canDo(role: string | undefined | null, module: Module, action: Action): boolean {
  const vt = toVaiTroChuan(role);
  if (!vt) return false;
  const perms = PERMISSIONS[vt]?.[module];
  if (!perms) return false;
  return perms[action] === true;
}

/**
 * Check quyền có action VIEW trên module
 */
export function canViewModule(role: string | undefined | null, module: Module): boolean {
  return canDo(role, module, "VIEW");
}

/**
 * Lấy tất cả action mà role có thể làm trên module
 */
export function getAllowedActions(role: string | undefined | null, module: Module): Action[] {
  const vt = toVaiTroChuan(role);
  if (!vt) return [];
  const perms = PERMISSIONS[vt]?.[module] || {};
  return ALL_ACTIONS.filter((a) => perms[a] === true);
}

/**
 * Lấy tất cả module mà role có quyền VIEW
 */
export function getAccessibleModulesForRole(role: string | undefined | null): Module[] {
  const vt = toVaiTroChuan(role);
  if (!vt) return [];
  const rolePerms = PERMISSIONS[vt] || {};
  return Object.keys(rolePerms).filter((m) => rolePerms[m as Module]?.VIEW) as Module[];
}

/**
 * Filter 1 array theo scope của user.
 * Mỗi item phải có field ownerId (user sở hữu) và/hoặc departmentId, teamId.
 * - SELF: chỉ item.ownerId === userId
 * - ASSIGNED: item.ownerId === userId HOẶC item.assignees?.includes(userId)
 * - TEAM: item.teamId === userTeamId
 * - DEPARTMENT: item.departmentId === userDeptId
 * - ALL: pass tất cả
 *
 * Note: Hàm này là utility, chưa dùng trong UI - dùng cho API/backend sau
 */
export function filterByScope<T extends { ownerId?: string; assignees?: string[]; teamId?: string; departmentId?: string }>(
  items: T[],
  scope: Scope,
  user: { id: string; teamId?: string; departmentId?: string }
): T[] {
  if (scope === "ALL") return items;
  if (scope === "SELF") return items.filter((x) => x.ownerId === user.id);
  if (scope === "ASSIGNED") {
    return items.filter((x) => x.ownerId === user.id || (x.assignees && x.assignees.includes(user.id)));
  }
  if (scope === "TEAM") return items.filter((x) => x.teamId && x.teamId === user.teamId);
  if (scope === "DEPARTMENT") return items.filter((x) => x.departmentId && x.departmentId === user.departmentId);
  return items;
}

/**
 * Full matrix export - dùng cho UI admin xem
 */
export function getFullPermissionMatrix(): Record<VaiTroChuan, Partial<Record<Module, PermSet>>> {
  return PERMISSIONS;
}

export const ALL_ROLES_CHUAN: VaiTroChuan[] = [
  "GIAM_DOC", "QUAN_TRI_HE_THONG", "DIEU_PHOI_SX", "KE_TOAN",
  "THU_KHO_VAI", "THU_KHO_TP",
  "PHU_TRACH_CAT", "NHAN_VIEN_CAT",
  "PHU_TRACH_MAY", "DOI_TAC_MAY",
  "PHU_TRACH_IN_THEU", "PHU_TRACH_KHUY_NUT", "DOI_TAC_IN_THEU",
  "PHU_TRACH_UI", "PHU_TRACH_QC", "PHU_TRACH_DONG_GOI",
  "NHAN_VIEN_UI", "NHAN_VIEN_KHUY_NUT", "NHAN_VIEN_DONG_GOI",
];
