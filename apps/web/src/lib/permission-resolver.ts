// Permission Resolver - Kết hợp Module + Role + Department
// Có thể mở rộng: Custom permissions, Group permissions, Field-level permissions

import {
  can as canBase, canView, canCreate, canEdit, canDelete,
  getAccessibleModules, type Role, type Module, type Action,
} from "./permissions";
import { PHONG_BAN_LABELS, type PhongBan } from "./user-accounts";
import type { UserAccount } from "./user-accounts";

// ============ DATA SCOPE - Phòng ban được xem data gì ============
export const PHONG_BAN_DATA_SCOPE: Record<PhongBan, Module[]> = {
  // Ban giám đốc: xem tất cả
  "ban-giam-doc": [],  // empty = all modules

  // Phòng kế toán: chỉ xem data tài chính
  "ke-toan": ["bang-luong", "cong-no-cong-doan", "nha-cung-cap", "bao-cao", "don-hang"],

  // Mua hàng: KH, NCC, đơn hàng
  "mua-hang": ["khach-hang", "nha-cung-cap", "don-hang", "ke-hoach-sx"],

  // Kho sợi: chỉ phần sợi
  "kho-soi": ["kho-vai", "ke-hoach-sx", "nha-cung-cap", "bao-cao"],

  // Xưởng dệt
  "xuong-det": ["lenh-cat", "ke-hoach-sx", "nhan-su", "to-may", "bao-cao"],

  // Xưởng nhuộm
  "xuong-nhuom": ["lenh-cat", "ke-hoach-sx", "hoan-thien", "bao-cao"],

  // Kho vải TP
  "kho-tp": ["kho-thanh-pham", "kho-phu-lieu", "don-hang", "giao-hang", "bao-cao"],

  // QC
  "qc": ["lenh-cat", "kiem-tra-chat-luong", "to-may", "hoan-thien", "bao-cao"],

  // Tổ may
  "to-may": ["lenh-cat", "nhan-su", "cham-cong", "to-may", "bao-cao"],

  // Hoàn thiện
  "hoan-thien": ["lenh-cat", "hoan-thien", "giao-hang", "cham-cong", "bao-cao"],

  // Giao hàng
  "giao-hang": ["don-hang", "giao-hang", "kho-thanh-pham", "khach-hang", "bao-cao"],

  // Khác
  "khac": [],
};

// ============ EXTENDED PERMISSION (mở rộng) ============
export interface ExtendedPermission {
  // Module-level (R/C/U/D) - từ permissions.ts
  module: Module;
  action: Action;
  // Data scope (phòng ban)
  dataScope: "all" | "department" | "own";
  // Custom (mở rộng)
  custom?: {
    fieldAccess?: Record<string, "r" | "rw" | "hidden">;  // field-level
    recordFilter?: (record: any) => boolean;  // custom filter
    timeRestricted?: { from: string; to: string };  // giờ làm việc
  };
}

// ============ RESOLVER ============
export interface PermissionContext {
  user: UserAccount | null;
  role: Role | null;
  phongBan: PhongBan | null;
}

/**
 * Check quyền kết hợp: Module (role) + Department scope
 */
export function can(
  ctx: PermissionContext,
  module: Module,
  action: Action
): boolean {
  if (!ctx.user || !ctx.role) return false;
  if (ctx.user.trangThai !== "active") return false;

  // Admin bypass everything
  if (ctx.role === "admin") return true;

  // 1. Check module-level permission (R/C/U/D)
  if (!canBase(ctx.role, module, action)) return false;

  // 2. Check data scope theo phòng ban
  const scope = PHONG_BAN_DATA_SCOPE[ctx.phongBan || "khac"];
  // Empty array = all modules
  if (scope.length === 0) return true;

  return scope.includes(module);
}

/**
 * Check user có THẤY menu/route của module không
 */
export function canSee(ctx: PermissionContext, module: Module): boolean {
  return can(ctx, module, "view");
}

/**
 * Check user có THAO TÁC trên record cụ thể không
 * (record-level permission)
 */
export function canAccessRecord(
  ctx: PermissionContext,
  record: { phongBan?: PhongBan; nguoiTao?: string; phuTrach?: string }
): boolean {
  if (!ctx.user) return false;
  if (ctx.role === "admin") return true;

  // Phòng ban của record phải khớp với user
  if (record.phongBan && record.phongBan === ctx.phongBan) return true;

  // Hoặc user tạo record
  if (record.nguoiTao === ctx.user.id) return true;

  // Hoặc user được phụ trách
  if (record.phuTrach === ctx.user.id) return true;

  return false;
}

/**
 * Filter danh sách record theo quyền user
 */
export function filterByPermission<T extends { phongBan?: PhongBan; nguoiTao?: string }>(
  ctx: PermissionContext,
  records: T[]
): T[] {
  if (!ctx.user) return [];
  if (ctx.role === "admin") return records;
  return records.filter((r) => canAccessRecord(ctx, r));
}

// ============ LABELS & METADATA ============
export const PERMISSION_LEVELS = [
  { level: 0, label: "Public", color: "slate", desc: "Ai cũng xem được (chưa login)" },
  { level: 1, label: "Department", color: "blue", desc: "Trong phòng ban thấy được" },
  { level: 2, label: "Own", color: "amber", desc: "Chỉ thấy data mình tạo/phụ trách" },
  { level: 3, label: "Manager", color: "violet", desc: "Quản lý thấy tất cả trong module" },
  { level: 4, label: "Admin", color: "rose", desc: "Toàn quyền tất cả" },
] as const;

export const ACTION_LABELS: Record<string, string> = {
  view: "Xem",
  create: "Tạo",
  update: "Sửa",
  delete: "Xóa",
};

// ============ UI BUILDER ============
/**
 * Tạo breadcrumb quyền cho user hiện tại
 */
export function getPermissionBreadcrumb(ctx: PermissionContext, module: Module): {
  role: string;
  phongBan: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
} {
  return {
    role: ctx.role ? ctx.role : "guest",
    phongBan: ctx.phongBan ? PHONG_BAN_LABELS[ctx.phongBan] : "Chưa phân",
    canView: can(ctx, module, "view"),
    canCreate: can(ctx, module, "create"),
    canUpdate: can(ctx, module, "u" as any),
    canDelete: can(ctx, module, "delete"),
  };
}
