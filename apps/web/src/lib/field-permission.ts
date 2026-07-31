// Field-level Permission - Ẩn cột/dữ liệu nhạy cảm theo role
// VD: NV thường không xem được lương NV khác, chỉ thấy lương mình

import type { Role } from "./permissions";

export type FieldKey =
  | "luong_cung" | "luong_sp" | "thuc_nhan" | "bhxh" | "luong_chi_tiet"
  | "gia_ban" | "gia_von" | "loi_nhuan" | "cong_no" | "so_tai_khoan"
  | "cmnd" | "so_dien_thoai" | "email" | "dia_chi";

export type FieldRule = {
  field: FieldKey;
  label: string;
  module: string;
  // Roles được phép xem
  visibleTo: Role[] | "all" | "owner-only";
  // Nếu "owner-only" → chỉ xem được data của chính mình
  description?: string;
};

export const FIELD_RULES: FieldRule[] = [
  // Lương
  { field: "luong_cung", label: "Lương cứng", module: "bang-luong", visibleTo: ["admin", "accountant"] },
  { field: "luong_sp", label: "Lương SP", module: "bang-luong", visibleTo: ["admin", "accountant"] },
  { field: "thuc_nhan", label: "Thực nhận", module: "bang-luong", visibleTo: ["admin", "accountant"] as any },
  { field: "bhxh", label: "BHXH chi tiết", module: "bang-luong", visibleTo: ["admin", "accountant"] },
  { field: "luong_chi_tiet", label: "Bảng lương chi tiết", module: "bang-luong", visibleTo: ["admin", "accountant"] as any },

  // Giá
  { field: "gia_ban", label: "Giá bán", module: "don-hang", visibleTo: ["admin", "planner", "accountant"] },
  { field: "gia_von", label: "Giá vốn", module: "lenh-cat", visibleTo: ["admin", "planner", "accountant"] },
  { field: "loi_nhuan", label: "Lợi nhuận", module: "bao-cao", visibleTo: ["admin", "accountant", "planner"] },

  // Công nợ
  { field: "cong_no", label: "Công nợ", module: "cong-no-cong-doan", visibleTo: ["admin", "accountant"] },

  // Thông tin cá nhân
  { field: "so_tai_khoan", label: "Số tài khoản", module: "nhan-su", visibleTo: ["admin", "accountant"] as any },
  { field: "cmnd", label: "CMND/CCCD", module: "nhan-su", visibleTo: ["admin", "accountant"] as any },
  { field: "so_dien_thoai", label: "Số điện thoại", module: "nhan-su", visibleTo: "all" },
  { field: "email", label: "Email", module: "nhan-su", visibleTo: "all" },
  { field: "dia_chi", label: "Địa chỉ", module: "nhan-su", visibleTo: "all" },
];

// Check field có được xem không
export function canViewField(
  role: Role | string | undefined,
  field: FieldKey,
  isOwner: boolean = false
): boolean {
  if (!role) return false;
  const rule = FIELD_RULES.find((r) => r.field === field);
  if (!rule) return true; // Không có rule = mặc định xem được

  if (rule.visibleTo === "all") return true;
  if (rule.visibleTo === "owner-only") return isOwner || role === "admin";
  return (rule.visibleTo as Role[]).includes(role as Role);
}

// Helper cho React component
export function useFieldPermission() {
  return {
    canViewField,
  };
}

// Mask data nếu không có quyền
export function maskField(value: string | number, role: Role | string | undefined, field: FieldKey, isOwner = false): string {
  if (canViewField(role, field, isOwner)) {
    return String(value);
  }
  if (typeof value === "number") {
    return "••••";
  }
  const str = String(value);
  if (str.length <= 4) return "••••";
  return str.slice(0, 2) + "•••" + str.slice(-2);
}
