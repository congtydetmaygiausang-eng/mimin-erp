// Công đoạn - Mô hình chuẩn MIMIN OS theo chị Giàu
// 11 trạng thái + 8 quyền thao tác + Quy trình 2 bước bàn giao

// ============ 11 TRẠNG THÁI CÔNG ĐOẠN ============
export type TrangThaiCongDoan =
  | "CHO_NHAN"              // Đã tạo việc, chưa có người nhận
  | "DA_NHAN"               // Phụ trách đã xác nhận nhận
  | "DANG_LAM"              // Đang thực hiện
  | "CHO_KIEM"              // Làm xong, chờ kiểm
  | "DAT"                   // QC duyệt đạt
  | "LOI"                   // Có lỗi cần xử lý
  | "LAM_LAI"               // Đang sửa/làm lại
  | "CHO_BAN_GIAO"          // Đủ ĐK bàn giao
  | "DA_BAN_GIAO"           // Bộ phận trước đã giao
  | "DA_XAC_NHAN_NHAN"      // Bộ phận sau đã xác nhận nhận
  | "HOAN_THANH";           // Công đoạn kết thúc

export const TRANG_THAI_LABELS: Record<TrangThaiCongDoan, string> = {
  CHO_NHAN: "Chờ nhận",
  DA_NHAN: "Đã nhận",
  DANG_LAM: "Đang làm",
  CHO_KIEM: "Chờ kiểm",
  DAT: "Đạt",
  LOI: "Có lỗi",
  LAM_LAI: "Đang làm lại",
  CHO_BAN_GIAO: "Chờ bàn giao",
  DA_BAN_GIAO: "Đã bàn giao",
  DA_XAC_NHAN_NHAN: "Đã xác nhận nhận",
  HOAN_THANH: "Hoàn thành",
};

export const TRANG_THAI_COLORS: Record<TrangThaiCongDoan, string> = {
  CHO_NHAN: "bg-slate-100 text-slate-700 border-slate-300",
  DA_NHAN: "bg-blue-100 text-blue-700 border-blue-300",
  DANG_LAM: "bg-amber-100 text-amber-700 border-amber-300",
  CHO_KIEM: "bg-cyan-100 text-cyan-700 border-cyan-300",
  DAT: "bg-emerald-100 text-emerald-700 border-emerald-300",
  LOI: "bg-rose-100 text-rose-700 border-rose-300",
  LAM_LAI: "bg-orange-100 text-orange-700 border-orange-300",
  CHO_BAN_GIAO: "bg-violet-100 text-violet-700 border-violet-300",
  DA_BAN_GIAO: "bg-indigo-100 text-indigo-700 border-indigo-300",
  DA_XAC_NHAN_NHAN: "bg-teal-100 text-teal-700 border-teal-300",
  HOAN_THANH: "bg-green-100 text-green-700 border-green-300",
};

// ============ 8 QUYỀN THAO TÁC TRONG CÔNG ĐOẠN ============
export type QuyenCongDoan =
  | "xem"              // Xem lệnh thuộc công đoạn
  | "nhan_viec"        // Bấm Nhận việc
  | "cap_nhat"         // Nhập SL nhận/đạt/lỗi/thiếu + đính ảnh
  | "phan_cong"        // Phân công NV trong bộ phận
  | "ban_giao"         // Bàn giao công đoạn tiếp theo
  | "duyet"            // Duyệt đạt / trả lỗi
  | "xoa"              // Xóa phiếu (chỉ khi CHO_NHAN, chưa ai nhận)
  | "xem_tien";        // Xem tiền công / công nợ

export const QUYEN_LABELS: Record<QuyenCongDoan, string> = {
  xem: "Xem",
  nhan_viec: "Nhận việc",
  cap_nhat: "Cập nhật SL",
  phan_cong: "Phân công",
  ban_giao: "Bàn giao",
  duyet: "Duyệt",
  xoa: "Xóa",
  xem_tien: "Xem tiền",
};

// ============ MA TRẬN VAI TRÒ × 8 QUYỀN ============
// Mỗi nhóm: [xem, nhan_viec, cap_nhat, phan_cong, ban_giao, duyet, xoa, xem_tien]
export const MA_TRAN_QUYEN: Record<string, QuyenCongDoan[]> = {
  // Nhân viên: xem việc mình + cập nhật SL + không xem tiền người khác
  NHAN_VIEN: ["xem", "nhan_viec", "cap_nhat"],
  NHAN_VIEN_CAT: ["xem", "nhan_viec", "cap_nhat"],
  NHAN_VIEN_UI: ["xem", "nhan_viec", "cap_nhat"],
  NHAN_VIEN_DONG_GOI: ["xem", "nhan_viec", "cap_nhat"],
  NHAN_VIEN_KHUY_NUT: ["xem", "nhan_viec", "cap_nhat"],

  // Phụ trách công đoạn: full trong bộ phận (trừ xóa + xem tiền)
  PHU_TRACH_CAT: ["xem", "nhan_viec", "cap_nhat", "phan_cong", "ban_giao", "xem_tien"],
  PHU_TRACH_IN_THEU: ["xem", "nhan_viec", "cap_nhat", "phan_cong", "ban_giao", "xem_tien"],
  PHU_TRACH_MAY: ["xem", "nhan_viec", "cap_nhat", "phan_cong", "ban_giao", "xem_tien"],
  PHU_TRACH_KHUY_NUT: ["xem", "nhan_viec", "cap_nhat", "phan_cong", "ban_giao", "xem_tien"],
  PHU_TRACH_UI: ["xem", "nhan_viec", "cap_nhat", "phan_cong", "ban_giao", "xem_tien"],
  PHU_TRACH_QC: ["xem", "nhan_viec", "cap_nhat", "phan_cong", "duyet", "xem_tien"],
  PHU_TRACH_DONG_GOI: ["xem", "nhan_viec", "cap_nhat", "phan_cong", "ban_giao", "xem_tien"],
  THU_KHO_TP: ["xem", "nhan_viec", "cap_nhat", "ban_giao", "xem_tien"],

  // Đối tác gia công: chỉ xem phiếu giao cho mình + cập nhật SL + bàn giao
  DOI_TAC_IN_THEU: ["xem", "nhan_viec", "cap_nhat", "ban_giao"],
  DOI_TAC_MAY: ["xem", "nhan_viec", "cap_nhat", "ban_giao"],

  // Điều phối: toàn SX + mở lại lệnh
  DIEU_PHOI_SX: ["xem", "nhan_viec", "cap_nhat", "phan_cong", "ban_giao", "duyet", "xem_tien"],

  // Kế toán: xem sản lượng + duyệt thanh toán
  KE_TOAN: ["xem", "cap_nhat", "duyet", "xem_tien"],

  // Kho vải
  THU_KHO_VAI: ["xem", "nhan_viec", "cap_nhat", "ban_giao", "xem_tien"],

  // Giám đốc: xem toàn bộ + duyệt + điều chỉnh
  GIAM_DOC: ["xem", "nhan_viec", "cap_nhat", "phan_cong", "ban_giao", "duyet", "xem_tien"],

  // Quản trị hệ thống: cấu hình (hạn chế xem tiền)
  QUAN_TRI_HE_THONG: ["xem", "phan_cong", "xoa"],
};

// ============ QUY TRÌNH 2 BƯỚC BÀN GIAO ============

export interface BanGiaoRecord {
  phieuId: string;
  congDoanTruoc: string;       // VD: "Cắt"
  congDoanSau: string;         // VD: "In/Thêu/Dập"
  nguoiBanGiao: string;        // userId
  slBanGiao: number;           // SL bộ phận trước bàn giao
  ngayBanGiao: string;
  trangThaiBanGiao: "DA_BAN_GIAO" | "DA_XAC_NHAN_NHAN" | "CHO_XU_LY_CHENH_LECH";

  nguoiNhan?: string;          // userId
  slNhan?: number;             // SL bộ phận sau thực nhận
  ngayNhan?: string;
  slThieu?: number;            // slBanGiao - slNhan
  ghiChu?: string;             // "Thiếu 5 cái do lỗi cắt"
}

/**
 * Tính chênh lệch khi bộ phận sau nhận
 * Trả về cảnh báo nếu SL nhận < SL bàn giao
 */
export function tinhChenhLechBanGiao(slBanGiao: number, slNhan: number): {
  chenhLech: number;
  trangThai: "DAT" | "THIEU" | "DU";
  canhBao: string | null;
} {
  const chenhLech = slBanGiao - slNhan;
  if (chenhLech > 0) {
    return {
      chenhLech,
      trangThai: "THIEU",
      canhBao: `⚠️ Bộ phận sau thực nhận thiếu ${chenhLech} cái so với SL bàn giao ${slBanGiao}. Phiếu chuyển trạng thái CHỜ_XỬ_LÝ_CHÊNH_LỆCH. Điều phối SX sẽ nhận thông báo xử lý.`,
    };
  }
  if (chenhLech < 0) {
    return {
      chenhLech: Math.abs(chenhLech),
      trangThai: "DU",
      canhBao: `ℹ️ Bộ phận sau nhận dư ${Math.abs(chenhLech)} cái. Cần đối chiếu lại với bộ phận trước.`,
    };
  }
  return { chenhLech: 0, trangThai: "DAT", canhBao: null };
}

// ============ FLOW CHUYỂN TRẠNG THÁI ============

export const FLOW_TRANG_THAI: Record<TrangThaiCongDoan, TrangThaiCongDoan[]> = {
  CHO_NHAN: ["DA_NHAN", "LOI"],
  DA_NHAN: ["DANG_LAM", "LOI"],
  DANG_LAM: ["CHO_KIEM", "LOI", "CHO_BAN_GIAO"],
  CHO_KIEM: ["DAT", "LOI"],
  DAT: ["CHO_BAN_GIAO", "HOAN_THANH"],
  LOI: ["LAM_LAI", "CHO_BAN_GIAO"],
  LAM_LAI: ["CHO_KIEM", "LOI"],
  CHO_BAN_GIAO: ["DA_BAN_GIAO"],
  DA_BAN_GIAO: ["DA_XAC_NHAN_NHAN", "CHO_XU_LY_CHENH_LECH" as any],
  DA_XAC_NHAN_NHAN: ["HOAN_THANH"],
  HOAN_THANH: [],
};

/**
 * Check chuyển trạng thái có hợp lệ không
 */
export function coTheChuyenTrangThai(
  tu: TrangThaiCongDoan,
  den: TrangThaiCongDoan
): boolean {
  return FLOW_TRANG_THAI[tu]?.includes(den) ?? false;
}

// ============ CẢNH BÁO & THÔNG BÁO ============

export interface CanhBao {
  loai: "THIEU_HANG" | "TRE_TIEN_DO" | "LOI_NHIEU" | "PHIEU_KHOA";
  mucDo: "THAP" | "TRUNG_BINH" | "CAO";
  noiDung: string;
  nguoiLienQuan?: string[];
  ngay?: string;
}

export function taoCanhBaoChenhLech(
  phieuId: string,
  slBanGiao: number,
  slNhan: number,
  nguoiLienQuan: string[]
): CanhBao {
  const chenhLech = slBanGiao - slNhan;
  return {
    loai: "THIEU_HANG",
    mucDo: chenhLech > 10 ? "CAO" : chenhLech > 0 ? "TRUNG_BINH" : "THAP",
    noiDung: `Phiếu ${phieuId}: Bàn giao ${slBanGiao} → Nhận ${slNhan} → THIẾU ${chenhLech} cái. Cần điều phối xử lý.`,
    nguoiLienQuan,
    ngay: new Date().toISOString(),
  };
}

// ============ GIAO DIỆN THEO VAI TRÒ ============

export type GiaoDienNhom =
  | "CONG_NHAN"             // Công nhân: 1 menu, 5 hành động
  | "PHU_TRACH"             // Phụ trách công đoạn: 5 tab
  | "DIEU_PHOI"             // Điều phối: timeline toàn chuỗi
  | "QUAN_LY"               // Giám đốc: dashboard
  | "QUAN_TRI";             // Admin: cấu hình

export function giaoDienChoVaiTro(vaiTro: string): GiaoDienNhom {
  if (vaiTro.startsWith("NHAN_VIEN")) return "CONG_NHAN";
  if (vaiTro.startsWith("PHU_TRACH") || vaiTro === "THU_KHO_TP" || vaiTro === "THU_KHO_VAI") return "PHU_TRACH";
  if (vaiTro === "DIEU_PHOI_SX") return "DIEU_PHOI";
  if (vaiTro === "GIAM_DOC") return "QUAN_LY";
  if (vaiTro === "QUAN_TRI_HE_THONG" || vaiTro === "KE_TOAN") return "QUAN_TRI";
  return "CONG_NHAN";
}

// ============ HELPER ============

export function hasQuyen(vaiTro: string, quyen: QuyenCongDoan): boolean {
  return MA_TRAN_QUYEN[vaiTro]?.includes(quyen) ?? false;
}

export function layQuyenCuaVaiTro(vaiTro: string): QuyenCongDoan[] {
  return MA_TRAN_QUYEN[vaiTro] || [];
}
