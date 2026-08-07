// Đối tác gia công thật - Đồng bộ từ file Excel "Danh_Sach_Doi_Tac_Gia_Cong_Chuan_MIMIN_ERP.xlsx"
// 20 đối tác: 5 in/thêu/dập + 4 may quần + 5 may áo tròn + 6 may áo trụ
// Đầy đủ: Mã, Tên, Người LH, SĐT, Email, Địa chỉ, STK, Ngân hàng, MST, CCCD, Trạng thái
// Cập nhật: 2026-08-04 - Fix SĐT thêm số 0 ở đầu + Tên đối tác chuẩn từ Excel + Tên NH viết hoa

export type LoaiDoiTac = "GC-IN" | "GC-QUAN" | "GC-TRON" | "GC-TRU";

export type TrangThaiHopTac = "dang_hop_tac" | "ngung_hop_tac";

// Enum chuẩn cho chuyên môn xưởng (P1 - 2026-08-07)
export type ChuyenMonXuong = "In" | "Thêu" | "Wash" | "May" | "In-Thêu" | "In-Thêu-May" | "Wash-May" | "Khác";

export const CHUYEN_MON_LABELS: Record<ChuyenMonXuong, string> = {
  "In": "In",
  "Thêu": "Thêu",
  "Wash": "Wash (Giặt)",
  "May": "May",
  "In-Thêu": "In + Thêu",
  "In-Thêu-May": "In + Thêu + May",
  "Wash-May": "Wash + May",
  "Khác": "Khác",
};

export const PHUONG_THUC_TT_OPTIONS = ["Chuyển khoản", "Tiền mặt", "Cả hai"] as const;
export type PhuongThucTT = typeof PHUONG_THUC_TT_OPTIONS[number];

export type DoiTacGiaCong = {
  stt: number;
  ma: string;                  // GC-IN-001, GC-QUAN-001, ...
  tenDonVi: string;            // "Xưởng in/thêu/dập Bảo Ngân"
  nguoiLienHe: string;         // Tên người đại diện
  sdt: string;                 // SĐT liên hệ (10 số, bắt đầu bằng 0)
  email?: string;
  diaChi: string;              // Địa chỉ xưởng
  boPhan: string;              // "sản xuất"
  chucVu: string;              // "gia công"
  soTaiKhoan?: string;
  nganHang?: string;
  maSoThue?: string;
  loaiDoiTuong: "doi_tac_gia_cong";
  trangThai: TrangThaiHopTac;
  cccd?: string;               // parse từ ghiChú
  cccdNgayCap?: string;
  ghiChu?: string;
  // Field tương thích ngược với code cũ (giữ cũ để không break)
  chuyenMon: ChuyenMonXuong | "In – Dập" | "May quần" | "May áo tròn" | "May áo trụ"; // union để back-compat
  // === P0/P1 - 2026-08-07 - Cong no gia cong ===
  congNo?: number;            // Tổng nợ hiện tại (VND)
  daThanhToan?: number;       // Đã thanh toán (VND)
  conLai?: number;            // Còn lại = congNo - daThanhToan
  hanMucNo?: number;          // Hạn mức cho nợ (VND)
  ngayHopTac?: string;        // Ngày bắt đầu hợp tác (YYYY-MM-DD)
  thoiHanThanhToan?: number;  // Số ngày thanh toán (mặc định 30)
  phuongThucTT?: PhuongThucTT;
  rating?: number;            // 1-5 sao
};

// ============ HELPER: Parse CCCD từ ghiChú ============
// Excel format: "CCCD: 079188007153 | Cấp: 12/01/2022 | MST: ---"
function parseCCCD(ghiChu?: string): { cccd?: string; ngayCap?: string } {
  if (!ghiChu) return {};
  const cccdMatch = ghiChu.match(/CCCD:\s*([^|]+)/i);
  const capMatch = ghiChu.match(/Cấp:\s*([^|]+)/i);
  return {
    cccd: cccdMatch?.[1]?.trim()?.replace(/^-+\s*$/, "")?.trim(),
    ngayCap: capMatch?.[1]?.trim()?.replace(/^-+\s*$/, "")?.trim(),
  };
}

// ============ 20 ĐỐI TÁC GIA CÔNG THẬT (đồng bộ từ Excel chuẩn 2026-08-04) ============
const _raw: Omit<DoiTacGiaCong, "loaiDoiTuong" | "boPhan" | "chucVu" | "chuyenMon" | "cccd" | "cccdNgayCap">[] = [
  // ===== 5 XƯỞNG IN/THÊU/DẬP =====
  { stt: 1, ma: "GC-IN-001", tenDonVi: "Xưởng in/thêu/dập Bảo Ngân", nguoiLienHe: "Bảo Ngân", sdt: "0978417243", email: "", diaChi: "B13/1A/15C Ấp 2, Xã Tân Vĩnh Lộc, TP.HCM", soTaiKhoan: "114624915555", nganHang: "TMCP Công Thương Việt Nam", maSoThue: "319004432", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- | Cấp: --- | MST: ---" },
  { stt: 2, ma: "GC-IN-002", tenDonVi: "Xưởng thêu chị Hạnh", nguoiLienHe: "Hạnh", sdt: "0374592478", email: "honghanh38911@gmail.com", diaChi: "Ấp Mỹ Hòa 2, Xuân Thới Sơn, HCM", soTaiKhoan: "0374592478", nganHang: "VietinBank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 079188007153 | Cấp: 12/01/2022 | MST: ---" },
  { stt: 3, ma: "GC-IN-003", tenDonVi: "Xưởng in/dập Thanh Sơn", nguoiLienHe: "Thanh Sơn", sdt: "0937557261", email: "thanhson040696@gmail.com", diaChi: "219/1/1 Đường 12, Bình Tân", soTaiKhoan: "04061996", nganHang: "Sacombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- | Cấp: --- | MST: ---" },
  { stt: 4, ma: "GC-IN-004", tenDonVi: "Xưởng in chuyển nhiệt Tiến Đạt", nguoiLienHe: "Tiến Đạt", sdt: "0987700589", email: "Invaitiendat@gmail.com", diaChi: "48 Nguyễn Văn Vinh, Phú Thạnh, HCM", soTaiKhoan: "160320168", nganHang: "ACB", maSoThue: "0316108031", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- | Cấp: --- | MST: ---" },
  { stt: 6, ma: "GC-IN-006", tenDonVi: "Xưởng thêu anh Vui", nguoiLienHe: "Vui", sdt: "0373779959", email: "tranvuivn@gmai.com", diaChi: "Đông Hưng Thuận 03, Quận 12", soTaiKhoan: "", nganHang: "", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- | Cấp: --- | MST: ---" },

  // ===== 4 XƯỞNG MAY QUẦN =====
  { stt: 8, ma: "GC-QUAN-001", tenDonVi: "Xưởng may quần chị Dung", nguoiLienHe: "Nguyễn Thị Ngọc Dung", sdt: "0383373415", email: "nguyenthingocdung3415@gmail.com", diaChi: "Số 45C Đường 26, Ấp Trung, Xã Tân Thông Hội, Huyện Củ Chi, TP.HCM", soTaiKhoan: "00241983", nganHang: "OCB", maSoThue: "8898968687-001", trangThai: "dang_hop_tac", ghiChu: "CCCD: 091183000355 | Cấp: 27/03/2022 | MST: 8898968687-001" },
  { stt: 9, ma: "GC-QUAN-002", tenDonVi: "Xưởng may quần chị Minh Vy", nguoiLienHe: "Tổng Thị Minh", sdt: "0362044839", email: "Tongminh10081987@gmail.com", diaChi: "27/6C Hưng Lân, Xã Bà Điểm, TP.HCM", soTaiKhoan: "4362044839", nganHang: "Vietcombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 38187008969 | Cấp: 25/08/2022 | MST: ---" },
  { stt: 10, ma: "GC-QUAN-003", tenDonVi: "Xưởng may quần anh Thơ", nguoiLienHe: "Tăng Văn Thơ", sdt: "0766769562", email: "Tangtho101@gmail.com", diaChi: "Ấp 12, Xã Vĩnh Lộc, TP.Hồ Chí Minh", soTaiKhoan: "1490190764", nganHang: "BIDV", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 83084003261 | Cấp: 22/02/2023 | MST: ---" },
  { stt: 11, ma: "GC-QUAN-004", tenDonVi: "Xưởng may quần chị Hương", nguoiLienHe: "Lê Thị Hoài Hương", sdt: "0941104007", email: "0941104007h@gmail.com", diaChi: "Thôn Xuân Thuận, Xã Phú Xuân, Tỉnh Đắk Lắk", soTaiKhoan: "0231000604464", nganHang: "Vietcombank", maSoThue: "66190017850", trangThai: "dang_hop_tac", ghiChu: "CCCD: 066190017850 | Cấp: 12/08/2021 | MST: 06690017850" },

  // ===== 5 XƯỞNG MAY ÁO TRÒN =====
  { stt: 12, ma: "GC-TRON-001", tenDonVi: "Xưởng may tròn anh Trai", nguoiLienHe: "Nguyễn Ngọc Trai", sdt: "0908908167", email: "nguyenngoctrai139@gmail.com", diaChi: "Ấp 19, Xã Vĩnh Lộc, Huyện Bình Chánh, TP.HCM", soTaiKhoan: "3180088065", nganHang: "BIDV", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 0520082013001 | Cấp: 27/01/2023 | MST: ---" },
  { stt: 13, ma: "GC-TRON-002", tenDonVi: "Xưởng may tròn chị Hằng", nguoiLienHe: "Phan Thị Thúy Hằng", sdt: "0909802852", email: "", diaChi: "41/1C Hưng Lân, Bà Điểm, Hóc Môn", soTaiKhoan: "060259005607", nganHang: "Sacombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- | Cấp: --- | MST: ---" },
  { stt: 14, ma: "GC-TRON-003", tenDonVi: "Xưởng may tròn anh Chiến", nguoiLienHe: "Chiến", sdt: "0986747344", email: "", diaChi: "1/8/13 Tân Thới Nhất 22, Hẻm 123, Q.12", soTaiKhoan: "19035056718019", nganHang: "Techcombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- | Cấp: --- | MST: ---" },
  { stt: 15, ma: "GC-TRON-004", tenDonVi: "Xưởng may tròn anh Thuận", nguoiLienHe: "Thuận", sdt: "0903071501", email: "ducthuan0715@gmail.com", diaChi: "28/10/15 KP40, Tân Thới Nhất 11, Q.12", soTaiKhoan: "43075977", nganHang: "ACB", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- | Cấp: --- | MST: ---" },
  { stt: 16, ma: "GC-TRON-005", tenDonVi: "Xưởng may tròn anh Quang", nguoiLienHe: "Quang", sdt: "0966670624", email: "", diaChi: "133/42 Liên Khu 4, Khu phố 5, Phường Bình Hưng Hòa B, Quận Bình Tân", soTaiKhoan: "6440205573303", nganHang: "Agribank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- | Cấp: --- | MST: ---" },

  // ===== 6 XƯỞNG MAY ÁO TRỤ =====
  { stt: 26, ma: "GC-TRU-001", tenDonVi: "Xưởng may trụ chị Liễu", nguoiLienHe: "Nguyễn Thị Ngọc Liễu", sdt: "0933305465", email: "", diaChi: "594/59 Âu Cơ, KP 4, P. Bảy Hiền, TP.HCM", soTaiKhoan: "", nganHang: "", maSoThue: "83182011101", trangThai: "dang_hop_tac", ghiChu: "CCCD: 083182011101 | Cấp: 22/12/2021 | MST: 083182011101" },
  { stt: 27, ma: "GC-TRU-002", tenDonVi: "Xưởng may trụ chị Tý Sơn", nguoiLienHe: "Nguyễn Hữu Kim Ly Sơn", sdt: "0794953483", email: "nguyenhuukimlyson@gmail.com", diaChi: "Nhà không số Ấp 29, Xã Tân Vĩnh Lộc, TP.HCM", soTaiKhoan: "060287316545", nganHang: "Sacombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 066188019712 | Cấp: 20/01/2022 | MST: ---" },
  { stt: 28, ma: "GC-TRU-003", tenDonVi: "Xưởng may trụ anh Duẩn", nguoiLienHe: "Dương Xuân Duẩn", sdt: "0966266775", email: "Xuanduanduong87@gmail.com", diaChi: "Đường N11, Tổ 1 KP 2, P. Thới Hòa, TP.HCM", soTaiKhoan: "07119869", nganHang: "Vietcombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 034086003445 | Cấp: 26/08/2022 | MST: ---" },
  { stt: 30, ma: "GC-TRU-005", tenDonVi: "Xưởng may trụ anh Thông", nguoiLienHe: "Nguyễn Văn Thông", sdt: "0933305465", email: "bt5815989@gmail.com", diaChi: "28/8 Ấp 46, Xã Hóc Môn, TP.HCM", soTaiKhoan: "0355589066", nganHang: "MB", maSoThue: "86090005870", trangThai: "dang_hop_tac", ghiChu: "CCCD: 086090005870 | Cấp: 22/12/2021 | MST: 086090005870" },
  { stt: 31, ma: "GC-TRU-006", tenDonVi: "Xưởng may trụ cô Cúc", nguoiLienHe: "Huỳnh Thị Cúc Em", sdt: "0907869422", email: "huynhthicucem1210@gmail.com", diaChi: "1/5B KP49 Nguyễn Văn Quá, P. Đông Hưng Thuận", soTaiKhoan: "9907869422", nganHang: "Techcombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- | Cấp: --- | MST: ---" },
  { stt: 32, ma: "GC-TRU-007", tenDonVi: "Xưởng may trụ anh Sản", nguoiLienHe: "Nguyễn Gia Sản", sdt: "0906042853", email: "Giasan20015@gmail.com", diaChi: "Tổ 16 Đường Lê Văn Chi, Linh Xuân", soTaiKhoan: "8888906042853", nganHang: "Agribank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 030080000661 | Cấp: 19/09/2024 | MST: ---" },

];

// ============ SUY RA CHUYÊN MÔN TỪ MÃ ============
function inferChuyenMon(ma: string): DoiTacGiaCong["chuyenMon"] {
  if (ma.startsWith("GC-IN-")) return "In – Dập";
  if (ma.startsWith("GC-QUAN-")) return "May quần";
  if (ma.startsWith("GC-TRON-")) return "May áo tròn";
  if (ma.startsWith("GC-TRU-")) return "May áo trụ";
  return "In – Dập";
}

// ============ EXPORT ĐỐI TÁC ĐÃ ĐƯỢC CHUẨN HÓA ============
export const DOI_TAC_GIA_CONG: DoiTacGiaCong[] = _raw.map((r) => {
  const { cccd, ngayCap } = parseCCCD(r.ghiChu);
  return {
    ...r,
    loaiDoiTuong: "doi_tac_gia_cong",
    boPhan: "Sản xuất",
    chucVu: "Đối tác gia công",
    chuyenMon: inferChuyenMon(r.ma),
    cccd,
    cccdNgayCap: ngayCap,
  };
});

// ============ HELPER FUNCTIONS ============
export function getDoiTacByMa(ma: string): DoiTacGiaCong | undefined {
  return DOI_TAC_GIA_CONG.find((d) => d.ma === ma);
}

export function getDoiTacByLoai(loai: LoaiDoiTac): DoiTacGiaCong[] {
  return DOI_TAC_GIA_CONG.filter((d) => d.ma.startsWith(loai + "-"));
}

export function getDoiTacDangHopTac(): DoiTacGiaCong[] {
  return DOI_TAC_GIA_CONG.filter((d) => d.trangThai === "dang_hop_tac");
}

export function getDoiTacNgungHopTac(): DoiTacGiaCong[] {
  return DOI_TAC_GIA_CONG.filter((d) => d.trangThai === "ngung_hop_tac");
}

// ============ THỐNG KÊ ============
export function thongKeDoiTac() {
  return {
    tong: DOI_TAC_GIA_CONG.length,
    inTheuDap: getDoiTacByLoai("GC-IN").length,
    mayQuan: getDoiTacByLoai("GC-QUAN").length,
    mayTron: getDoiTacByLoai("GC-TRON").length,
    mayTru: getDoiTacByLoai("GC-TRU").length,
    dangHopTac: getDoiTacDangHopTac().length,
    ngungHopTac: getDoiTacNgungHopTac().length,
  };
}

// ============ TƯƠNG THÍCH NGƯỢC VỚI workflow-data.ts ============
// Map mã cũ DT-MAY-XXX sang mã mới GC-XXX
export const NGUOI_IN_THEU_DAP_NEW = getDoiTacByLoai("GC-IN").map((d) => ({
  ma: d.ma,
  ten: d.nguoiLienHe,
  sdt: d.sdt,
  chuyenMon: d.chuyenMon,
  ghiChu: d.tenDonVi,
  diaChi: d.diaChi,
  trangThai: d.trangThai,
}));

export const NGUOI_MAY_QUAN = getDoiTacByLoai("GC-QUAN").map((d) => ({
  ma: d.ma,
  ten: d.nguoiLienHe,
  sdt: d.sdt,
  ghiChu: d.tenDonVi,
  diaChi: d.diaChi,
  trangThai: d.trangThai,
}));

export const NGUOI_MAY_TRON = getDoiTacByLoai("GC-TRON").map((d) => ({
  ma: d.ma,
  ten: d.nguoiLienHe,
  sdt: d.sdt,
  ghiChu: d.tenDonVi,
  diaChi: d.diaChi,
  trangThai: d.trangThai,
}));

export const NGUOI_MAY_TRU = getDoiTacByLoai("GC-TRU").map((d) => ({
  ma: d.ma,
  ten: d.nguoiLienHe,
  sdt: d.sdt,
  ghiChu: d.tenDonVi,
  diaChi: d.diaChi,
  trangThai: d.trangThai,
}));

export const NGUOI_MAY_NEW = {
  "May quần": NGUOI_MAY_QUAN,
  "May áo tròn": NGUOI_MAY_TRON,
  "May áo trụ": NGUOI_MAY_TRU,
};
