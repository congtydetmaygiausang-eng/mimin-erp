// Vai trò chuẩn MIMIN OS theo mô hình a Cường
// 17 vai trò tách nhỏ theo công đoạn

import type { PhongBan } from "./user-accounts";

// ============ 17 VAI TRÒ CHUẨN ============
export type VaiTroChuan =
  // Nhân viên (4)
  | "NHAN_VIEN_CAT"
  | "NHAN_VIEN_KHUY_NUT"
  | "NHAN_VIEN_UI"
  | "NHAN_VIEN_DONG_GOI"
  // Phụ trách công đoạn (7)
  | "PHU_TRACH_CAT"
  | "PHU_TRACH_IN_THEU"
  | "PHU_TRACH_MAY"
  | "PHU_TRACH_KHUY_NUT"
  | "PHU_TRACH_UI"
  | "PHU_TRACH_QC"
  | "PHU_TRACH_DONG_GOI"
  // Đối tác gia công (2)
  | "DOI_TAC_IN_THEU"
  | "DOI_TAC_MAY"
  // Kho (2)
  | "THU_KHO_VAI"
  | "THU_KHO_TP"
  // Quản lý (3)
  | "DIEU_PHOI_SX"
  | "KE_TOAN"
  | "GIAM_DOC"
  | "QUAN_TRI_HE_THONG";

export const VAI_TRO_LABELS: Record<VaiTroChuan, string> = {
  NHAN_VIEN_CAT: "Nhân viên cắt",
  NHAN_VIEN_KHUY_NUT: "Nhân viên khuy nút",
  NHAN_VIEN_UI: "Nhân viên ủi",
  NHAN_VIEN_DONG_GOI: "Nhân viên đóng gói",

  PHU_TRACH_CAT: "Phụ trách cắt",
  PHU_TRACH_IN_THEU: "Phụ trách in/thêu/dập",
  PHU_TRACH_MAY: "Phụ trách may gia công",
  PHU_TRACH_KHUY_NUT: "Phụ trách khuy nút",
  PHU_TRACH_UI: "Phụ trách ủi",
  PHU_TRACH_QC: "Phụ trách QC",
  PHU_TRACH_DONG_GOI: "Phụ trách đóng gói",

  DOI_TAC_IN_THEU: "Đối tác in/thêu/dập",
  DOI_TAC_MAY: "Xưởng may (đối tác)",

  THU_KHO_VAI: "Thủ kho vải",
  THU_KHO_TP: "Thủ kho thành phẩm",

  DIEU_PHOI_SX: "Điều phối sản xuất",
  KE_TOAN: "Kế toán",
  GIAM_DOC: "Giám đốc",
  QUAN_TRI_HE_THONG: "Quản trị hệ thống",
};

export const VAI_TRO_COLORS: Record<VaiTroChuan, string> = {
  // Công nhân: tone nhạt
  NHAN_VIEN_CAT: "from-slate-400 to-slate-500",
  NHAN_VIEN_KHUY_NUT: "from-slate-400 to-slate-500",
  NHAN_VIEN_UI: "from-slate-400 to-slate-500",
  NHAN_VIEN_DONG_GOI: "from-slate-400 to-slate-500",

  // Phụ trách: tone đậm
  PHU_TRACH_CAT: "from-cyan-500 to-blue-500",
  PHU_TRACH_IN_THEU: "from-violet-500 to-purple-500",
  PHU_TRACH_MAY: "from-fuchsia-500 to-pink-500",
  PHU_TRACH_KHUY_NUT: "from-amber-500 to-orange-500",
  PHU_TRACH_UI: "from-rose-500 to-pink-500",
  PHU_TRACH_QC: "from-emerald-500 to-green-500",
  PHU_TRACH_DONG_GOI: "from-teal-500 to-cyan-500",

  // Đối tác: tone riêng
  DOI_TAC_IN_THEU: "from-purple-400 to-pink-400",
  DOI_TAC_MAY: "from-pink-400 to-rose-400",

  // Kho
  THU_KHO_VAI: "from-indigo-500 to-blue-500",
  THU_KHO_TP: "from-emerald-500 to-teal-500",

  // Quản lý: tone VIP
  DIEU_PHOI_SX: "from-orange-500 to-red-500",
  KE_TOAN: "from-blue-500 to-indigo-500",
  GIAM_DOC: "from-rose-500 to-red-600",
  QUAN_TRI_HE_THONG: "from-slate-600 to-slate-700",
};

// Phân nhóm vai trò
export const NHOM_VAI_TRO = {
  "Công nhân": [
    "NHAN_VIEN_CAT",
    "NHAN_VIEN_KHUY_NUT",
    "NHAN_VIEN_UI",
    "NHAN_VIEN_DONG_GOI",
  ] as VaiTroChuan[],
  "Phụ trách công đoạn": [
    "PHU_TRACH_CAT",
    "PHU_TRACH_IN_THEU",
    "PHU_TRACH_MAY",
    "PHU_TRACH_KHUY_NUT",
    "PHU_TRACH_UI",
    "PHU_TRACH_QC",
    "PHU_TRACH_DONG_GOI",
  ] as VaiTroChuan[],
  "Đối tác gia công": ["DOI_TAC_IN_THEU", "DOI_TAC_MAY"] as VaiTroChuan[],
  "Kho": ["THU_KHO_VAI", "THU_KHO_TP"] as VaiTroChuan[],
  "Quản lý & Admin": [
    "DIEU_PHOI_SX",
    "KE_TOAN",
    "GIAM_DOC",
    "QUAN_TRI_HE_THONG",
  ] as VaiTroChuan[],
};

// ============ PHÒNG BAN CHUẨN (theo a Cường) ============
export type PhongBanChuan =
  | "BDH"           // Ban điều hành
  | "DPSX"          // Điều phối sản xuất
  | "KHO_VAI"       // Kho vải
  | "CAT"           // Bộ phận cắt
  | "GC_NGOAI"      // Gia công ngoài (in/thêu/dập/may)
  | "KHUY_NUT"      // Khuy nút
  | "UI"            // Bộ phận ủi
  | "QC"            // Kiểm hàng
  | "DONG_GOI"      // Gấp xếp - đóng gói
  | "KHO_TP"        // Kho thành phẩm
  | "KE_TOAN";      // Kế toán

export const PHONG_BAN_CHUAN_LABELS: Record<PhongBanChuan, string> = {
  BDH: "Ban điều hành",
  DPSX: "Điều phối sản xuất",
  KHO_VAI: "Kho vải",
  CAT: "Bộ phận cắt",
  GC_NGOAI: "Gia công ngoài",
  KHUY_NUT: "Khuy nút",
  UI: "Bộ phận ủi",
  QC: "Kiểm hàng",
  DONG_GOI: "Gấp xếp - đóng gói",
  KHO_TP: "Kho thành phẩm",
  KE_TOAN: "Kế toán",
};

export const PHONG_BAN_CHUAN_CONG_DOAN: Record<PhongBanChuan, string> = {
  BDH: "Toàn hệ thống",
  DPSX: "Kế hoạch và tiến độ",
  KHO_VAI: "Cấp và thu hồi vải",
  CAT: "Trải, cắt, phân loại",
  GC_NGOAI: "In, thêu, dập, may",
  KHUY_NUT: "Làm khuy và đính nút",
  UI: "Ủi và hoàn thiện",
  QC: "Kiểm lỗi và duyệt đạt",
  DONG_GOI: "Gấp, tem và đóng bao",
  KHO_TP: "Nhập–xuất–tồn thành phẩm",
  KE_TOAN: "Tiền công và công nợ",
};

// ============ DATA SCOPE (6 CẤP) ============
export type DataScope =
  | "SELF"          // Chỉ việc giao cho mình
  | "TEAM"          // Tất cả việc trong tổ
  | "DEPARTMENT"    // Toàn bộ phòng ban
  | "PRODUCTION"    // Toàn bộ chuỗi sản xuất
  | "COMPANY"       // Toàn công ty
  | "PARTNER";      // Chỉ phiếu giao cho đúng đối tác

export const DATA_SCOPE_LABELS: Record<DataScope, string> = {
  SELF: "Cá nhân (SELF)",
  TEAM: "Tổ (TEAM)",
  DEPARTMENT: "Phòng ban (DEPT)",
  PRODUCTION: "Toàn SX (PROD)",
  COMPANY: "Toàn công ty (COMPANY)",
  PARTNER: "Đối tác (PARTNER)",
};

export const DATA_SCOPE_DESCRIPTIONS: Record<DataScope, string> = {
  SELF: "Chỉ việc giao cho chính mình",
  TEAM: "Tất cả việc trong tổ",
  DEPARTMENT: "Toàn bộ phòng ban",
  PRODUCTION: "Toàn bộ chuỗi sản xuất",
  COMPANY: "Toàn công ty",
  PARTNER: "Chỉ phiếu giao cho đúng đối tác",
};

// Mapping mặc định vai trò → data scope
export const VAI_TRO_DATA_SCOPE: Record<VaiTroChuan, DataScope> = {
  // Công nhân: SELF
  NHAN_VIEN_CAT: "SELF",
  NHAN_VIEN_KHUY_NUT: "SELF",
  NHAN_VIEN_UI: "SELF",
  NHAN_VIEN_DONG_GOI: "SELF",

  // Phụ trách: DEPARTMENT
  PHU_TRACH_CAT: "DEPARTMENT",
  PHU_TRACH_IN_THEU: "DEPARTMENT",
  PHU_TRACH_MAY: "DEPARTMENT",
  PHU_TRACH_KHUY_NUT: "DEPARTMENT",
  PHU_TRACH_UI: "DEPARTMENT",
  PHU_TRACH_QC: "DEPARTMENT",
  PHU_TRACH_DONG_GOI: "DEPARTMENT",

  // Đối tác: PARTNER
  DOI_TAC_IN_THEU: "PARTNER",
  DOI_TAC_MAY: "PARTNER",

  // Kho: DEPARTMENT
  THU_KHO_VAI: "DEPARTMENT",
  THU_KHO_TP: "DEPARTMENT",

  // Quản lý
  DIEU_PHOI_SX: "PRODUCTION",
  KE_TOAN: "PRODUCTION",
  GIAM_DOC: "COMPANY",
  QUAN_TRI_HE_THONG: "COMPANY",
};

// Mapping vai trò → phòng ban chính
export const VAI_TRO_PHONG_BAN: Record<VaiTroChuan, PhongBanChuan> = {
  NHAN_VIEN_CAT: "CAT",
  NHAN_VIEN_KHUY_NUT: "KHUY_NUT",
  NHAN_VIEN_UI: "UI",
  NHAN_VIEN_DONG_GOI: "DONG_GOI",
  PHU_TRACH_CAT: "CAT",
  PHU_TRACH_IN_THEU: "GC_NGOAI",
  PHU_TRACH_MAY: "GC_NGOAI",
  PHU_TRACH_KHUY_NUT: "KHUY_NUT",
  PHU_TRACH_UI: "UI",
  PHU_TRACH_QC: "QC",
  PHU_TRACH_DONG_GOI: "DONG_GOI",
  DOI_TAC_IN_THEU: "GC_NGOAI",
  DOI_TAC_MAY: "GC_NGOAI",
  THU_KHO_VAI: "KHO_VAI",
  THU_KHO_TP: "KHO_TP",
  DIEU_PHOI_SX: "DPSX",
  KE_TOAN: "KE_TOAN",
  GIAM_DOC: "BDH",
  QUAN_TRI_HE_THONG: "BDH",
};

// ============ HELPER ============
export function isDoiTac(vaiTro: string): boolean {
  return vaiTro.startsWith("DOI_TAC_");
}

export function isCongNhan(vaiTro: string): boolean {
  return vaiTro.startsWith("NHAN_VIEN_");
}

export function isPhuTrach(vaiTro: string): boolean {
  return vaiTro.startsWith("PHU_TRACH_");
}

export function isQuanLy(vaiTro: string): boolean {
  return ["DIEU_PHOI_SX", "KE_TOAN", "GIAM_DOC", "QUAN_TRI_HE_THONG"].includes(vaiTro);
}
