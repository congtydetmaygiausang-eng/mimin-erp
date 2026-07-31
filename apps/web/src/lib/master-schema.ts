// ============================================
// MIMIN ERP - MASTER SCHEMA v89.6.9.3
// Standard Master Schema - Single Source of Truth
// ============================================

export type Role =
  | "QUAN_TRI_HE_THONG"
  | "GIAM_DOC"
  | "DIEU_PHOI_SX"
  | "KE_TOAN"
  | "THU_KHO_VAI"
  | "THU_KHO_PHU_LIEU"
  | "THU_KHO_THANH_PHAM"
  | "PHU_TRACH_QC"
  | "PHU_TRACH_MAY"
  | "PHU_TRACH_KHUY_NUT"
  | "PHU_TRACH_IN_THEU"
  | "PHU_TRACH_GIAT_LA"
  | "NHAN_VIEN_CAT"
  | "NHAN_VIEN_MAY"
  | "NHAN_VIEN_KHUY_NUT"
  | "NHAN_VIEN_IN_THEU"
  | "NHAN_VIEN_GIAT_LA";

export type Module =
  | "dashboard"
  | "lenh-cat"
  | "khach-hang"
  | "ke-hoach-sx"
  | "nhan-su"
  | "kho-vai"
  | "kho-phu-lieu"
  | "kho-thanh-pham"
  | "don-hang"
  | "cong-no-cong-doan"
  | "kiem-tra-chat-luong"
  | "to-may"
  | "hoan-thien"
  | "giao-hang"
  | "cham-cong"
  | "bang-luong"
  | "nha-cung-cap"
  | "gia-cong-ngoai"
  | "bao-cao"
  | "realtime"
  | "cai-dat"
  | "trang-chu-gia-cong"
  | "bang-dieu-hanh-sx"
  | "doi-soat-tien-cong";

export type Action = "create" | "read" | "update" | "delete" | "approve" | "export";

export type DataScope = "ALL" | "DEPT" | "SELF";

export type TicketStatus =
  | "CHO_NHAN"
  | "DANG_LAM"
  | "DA_HOAN_THANH"
  | "DANG_BAN_GIAO"
  | "DA_BAN_GIAO"
  | "CHO_KIEM_TRA"
  | "DAT_QC"
  | "KHONG_DAT_QC"
  | "HUY"
  | "TAM_DUNG"
  | "DANG_DOI_SOAT";

export type ProcessType = "CAT" | "MAY" | "KHUY_NUT" | "IN_THEU" | "GIAT_LA" | "DONG_GOI";

export type WageStatus = "CHO_DOI_SOAT" | "DA_DOI_SOAT" | "CHO_DUYET" | "DA_DUYET" | "DA_THANH_TOAN" | "KIEU_NAI" | "TU_TUONG";

export type CuttingOrderStatus = "NHAP_THO" | "DA_DUYET" | "DANG_CAT" | "DA_CAT" | "DANG_MAY" | "DA_MAY" | "DANG_HOAN_THIEN" | "HOAN_THANH" | "HUY";

export const STORAGE_KEYS = {
  DOI_SOAT: "mimin_doi_soat_v1",
  HOAN_THIEN: "mimin_hoan_thien_v1",
  KHO_MOBILE: "mimin_kho_mobile_v1",
  QC: "mimin_qc_v1",
  GIA_CONG: "mimin_gia_cong_v1",
  KHSX: "mimin_khsx_v1",
  GIAO_HANG: "mimin_giao_hang_v1",
  KHO: "mimin_kho_v1",
  CONG_NO: "mimin_cong_no_v1",
  USERS: "mimin_users_v1",
} as const;

export const PERMISSION_MATRIX: Record<Role, Module[]> = {
  QUAN_TRI_HE_THONG: [
    "dashboard", "lenh-cat", "khach-hang", "ke-hoach-sx", "nhan-su", "kho-vai",
    "kho-phu-lieu", "kho-thanh-pham", "don-hang", "cong-no-cong-doan",
    "kiem-tra-chat-luong", "to-may", "hoan-thien", "giao-hang", "cham-cong",
    "bang-luong", "nha-cung-cap", "gia-cong-ngoai", "bao-cao", "realtime",
    "cai-dat", "trang-chu-gia-cong", "bang-dieu-hanh-sx", "doi-soat-tien-cong"
  ],
  GIAM_DOC: [
    "dashboard", "lenh-cat", "khach-hang", "ke-hoach-sx", "nhan-su", "kho-vai",
    "kho-phu-lieu", "kho-thanh-pham", "don-hang", "cong-no-cong-doan",
    "kiem-tra-chat-luong", "to-may", "hoan-thien", "giao-hang", "cham-cong",
    "bang-luong", "nha-cung-cap", "gia-cong-ngoai", "bao-cao", "realtime",
    "trang-chu-gia-cong", "bang-dieu-hanh-sx", "doi-soat-tien-cong"
  ],
  DIEU_PHOI_SX: ["dashboard", "lenh-cat", "ke-hoach-sx", "to-may", "hoan-thien", "bang-dieu-hanh-sx", "bao-cao"],
  KE_TOAN: ["dashboard", "cong-no-cong-doan", "bang-luong", "doi-soat-tien-cong", "bao-cao"],
  THU_KHO_VAI: ["dashboard", "kho-vai"],
  THU_KHO_PHU_LIEU: ["dashboard", "kho-phu-lieu"],
  THU_KHO_THANH_PHAM: ["dashboard", "kho-thanh-pham", "giao-hang"],
  PHU_TRACH_QC: ["dashboard", "kiem-tra-chat-luong", "bao-cao"],
  PHU_TRACH_MAY: ["dashboard", "to-may", "trang-chu-gia-cong"],
  PHU_TRACH_KHUY_NUT: ["dashboard", "hoan-thien", "trang-chu-gia-cong"],
  PHU_TRACH_IN_THEU: ["dashboard", "trang-chu-gia-cong"],
  PHU_TRACH_GIAT_LA: ["dashboard", "hoan-thien"],
  NHAN_VIEN_CAT: ["trang-chu-gia-cong"],
  NHAN_VIEN_MAY: ["trang-chu-gia-cong"],
  NHAN_VIEN_KHUY_NUT: ["trang-chu-gia-cong", "hoan-thien"],
  NHAN_VIEN_IN_THEU: ["trang-chu-gia-cong"],
  NHAN_VIEN_GIAT_LA: ["hoan-thien"],
};

export function canView(role?: Role | string, module?: Module): boolean {
  if (!role || !module) return false;
  const allowedModules = PERMISSION_MATRIX[role as Role] || [];
  return allowedModules.includes(module);
}

export function canDo(role?: Role | string, action?: Action, module?: Module): boolean {
  if (!role || !action || !module) return false;
  if (role === "QUAN_TRI_HE_THONG" || role === "GIAM_DOC") return true;
  if (!canView(role, module)) return false;
  if (action === "read") return true;
  if (action === "approve") return ["KE_TOAN", "DIEU_PHOI_SX"].includes(role);
  return true;
}

export function getAccessibleModules(role?: Role | string): Module[] {
  if (!role) return [];
  return PERMISSION_MATRIX[role as Role] || [];
}

export function getDataScope(role?: Role | string): DataScope {
  if (role === "QUAN_TRI_HE_THONG" || role === "GIAM_DOC") return "ALL";
  if (role?.startsWith("PHU_TRACH_") || role === "DIEU_PHOI_SX" || role === "KE_TOAN") return "DEPT";
  return "SELF";
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export function formatDateVN(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
