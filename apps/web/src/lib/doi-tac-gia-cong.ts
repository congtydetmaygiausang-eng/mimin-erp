// Đối tác gia công thật - Imported từ file CSV sếp Sang ngày 2026-08-03
// 20 đối tác: 5 in/thêu/dập + 4 may quần + 5 may áo tròn + 6 may áo trụ
// Đầy đủ: Mã, Tên, Người LH, SĐT, Email, Địa chỉ, STK, Ngân hàng, MST, CCCD, Trạng thái

export type LoaiDoiTac = "GC-IN" | "GC-QUAN" | "GC-TRON" | "GC-TRU";

export type TrangThaiHopTac = "dang_hop_tac" | "ngung_hop_tac";

export type DoiTacGiaCong = {
  stt: number;
  ma: string;                  // GC-IN-001, GC-QUAN-001, ...
  tenDonVi: string;            // "Xưởng in/thêu/dập Bảo Ngân"
  nguoiLienHe: string;         // Tên người đại diện
  sdt: string;                 // SĐT liên hệ
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
  // Field tương thích ngược với code cũ
  chuyenMon: "In" | "Thêu" | "In – Dập" | "May quần" | "May áo tròn" | "May áo trụ";
};

// ============ HELPER: Parse CCCD từ ghiChú ============
function parseCCCD(ghiChu?: string): { cccd?: string; ngayCap?: string } {
  if (!ghiChu) return {};
  const cccdMatch = ghiChu.match(/CCCD:\s*([0-9\-]+)/i);
  const capMatch = ghiChu.match(/Cấp:\s*([\d\/]+)/i);
  return {
    cccd: cccdMatch?.[1]?.trim(),
    ngayCap: capMatch?.[1]?.trim(),
  };
}

// ============ 20 ĐỐI TÁC GIA CÔNG THẬT (từ CSV) ============
const _raw: Omit<DoiTacGiaCong, "loaiDoiTuong" | "boPhan" | "chucVu" | "chuyenMon" | "cccd" | "cccdNgayCap">[] = [
  // ===== 5 XƯỞNG IN/THÊU/DẬP =====
  { stt: 1, ma: "GC-IN-001", tenDonVi: "Xưởng in/thêu/dập Bảo Ngân", nguoiLienHe: "Bảo Ngân", sdt: "978417243", email: "", diaChi: "b13/1a/15c ấp 2, xã tân vĩnh lộc, tphcm", soTaiKhoan: "114624915555", nganHang: "TMCP công thương việt nam", maSoThue: "319004432", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 2, ma: "GC-IN-002", tenDonVi: "Xưởng in/thêu/dập Hạnh", nguoiLienHe: "Hạnh", sdt: "374592478", email: "honghanh38911@gmail.com", diaChi: "ấp mỹ hòa 2, xuân thới sơn, hcm", soTaiKhoan: "0374592478", nganHang: "viettinbank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 079188007153 Cấp: 12/01/2022  MST: ---" },
  { stt: 3, ma: "GC-IN-003", tenDonVi: "Xưởng in/thêu/dập Thanh Sơn", nguoiLienHe: "Thanh Sơn", sdt: "937557261", email: "thanhson040696@gmail.com", diaChi: "219/1/1 đường 12,bình tân", soTaiKhoan: "04061996", nganHang: "sacombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 4, ma: "GC-IN-004", tenDonVi: "Xưởng in/thêu/dập Tiến Đạt", nguoiLienHe: "Tiến Đạt", sdt: "987700589", email: "Invaitiendat@gmail.com", diaChi: "48 nguyễn văn vinh, phú thạnh, hcm", soTaiKhoan: "160320168", nganHang: "acb", maSoThue: "0316108031", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 6, ma: "GC-IN-006", tenDonVi: "Xưởng in/thêu/dập Vui", nguoiLienHe: "Vui", sdt: "373779959", email: "tranvuivn@gmai.com", diaChi: "đông hưng thuận 03, quận 12", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },

  // ===== 4 XƯỞNG MAY QUẦN =====
  { stt: 8, ma: "GC-QUAN-001", tenDonVi: "NGUYỄN THỊ NGỌC DUNG", nguoiLienHe: "Nguyễn Thị Ngọc Dung", sdt: "383373415", email: "nguyenthingocdung3415@gmail.com", diaChi: "Số 45C đường 26 ấp trung, Xã Tân Thông Hội, Huyện Củ Chi, TP.HCM", soTaiKhoan: "00241983", nganHang: "OCB", maSoThue: "8898968687-001", trangThai: "dang_hop_tac", ghiChu: "CCCD: 091183000355 - Cấp: 27/03/2022 - MST: 8898968687-001" },
  { stt: 9, ma: "GC-QUAN-002", tenDonVi: "NHÀ MAY MINH VY", nguoiLienHe: "Tổng Thị Minh", sdt: "362044839", email: "Tongminh10081987@gmail.com", diaChi: "27/6C Hưng Lân, Xã Bà Điểm, TP.HCM", soTaiKhoan: "4362044839", nganHang: "vietcombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 38187008969 - Cấp: 25/08/2022 - MST: ---" },
  { stt: 10, ma: "GC-QUAN-003", tenDonVi: "Xưởng may quần anh Thơ", nguoiLienHe: "Tăng Văn Thơ", sdt: "766769562", email: "Tangtho101@gmail.com", diaChi: "Ấp 12, Xã Vĩnh Lộc, TP.Hồ Chí Minh", soTaiKhoan: "1490190764", nganHang: "bidv", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 83084003261 - Cấp: 22/02/2023 - MST: ---" },
  { stt: 11, ma: "GC-QUAN-004", tenDonVi: "LÊ THỊ HOÀI HƯƠNG", nguoiLienHe: "Lê Thị Hoài Hương", sdt: "941104007", email: "0941104007h@gmail.com", diaChi: "Thôn Xuân Thuận, Xã Phú Xuân, Tỉnh Đăk Lăk", soTaiKhoan: "0231000604464", nganHang: "vietcombank", maSoThue: "66190017850", trangThai: "dang_hop_tac", ghiChu: "CCCD: 066190017850 - Cấp: 12/08/2021 - MST: 066190017850" },

  // ===== 5 XƯỞNG MAY ÁO TRÒN =====
  { stt: 12, ma: "GC-TRON-001", tenDonVi: "Xưởng may tròn anh Trai", nguoiLienHe: "Nguyễn Ngọc Trai", sdt: "908908167", email: "nguyenngoctrai139@gmail.com", diaChi: "Ấp 19, Xã Vĩnh Lộc, Huyện Bình Chánh, TP.HCM", soTaiKhoan: "3180088065", nganHang: "bidv", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 0520082013001 - Cấp: 27/01/2023 - MST: ---" },
  { stt: 13, ma: "GC-TRON-002", tenDonVi: "Xưởng may tròn chị Hằng", nguoiLienHe: "phan thị thúy hằng", sdt: "909802852", email: "", diaChi: "41/1C Hưng Lân, Bà Điểm, Hóc Môn", soTaiKhoan: "060259005607", nganHang: "sacombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 14, ma: "GC-TRON-003", tenDonVi: "Xưởng may tròn anh Chiến", nguoiLienHe: "Chiến", sdt: "986747344", email: "", diaChi: "1/8/13 Tân Thới Nhất 22, hẻm 123, Q.12", soTaiKhoan: "19035056718019", nganHang: "techcombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 15, ma: "GC-TRON-004", tenDonVi: "Xưởng may tròn anh Thuận", nguoiLienHe: "Thuận", sdt: "903071501", email: "ducthuan0715@gmail.com", diaChi: "28/10/15 KP40, Tân Thới Nhất 11, Q.12", soTaiKhoan: "43075977", nganHang: "ACB", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 16, ma: "GC-TRON-005", tenDonVi: "Xưởng may quang", nguoiLienHe: "Quang", sdt: "966670624", email: "", diaChi: "133/42 liên khu 4, khu phố 5, phường binh hưng hòa B, quận bình tân", soTaiKhoan: "6440205573303", nganHang: "agribank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },

  // ===== 6 XƯỞNG MAY ÁO TRỤ =====
  { stt: 26, ma: "GC-TRU-001", tenDonVi: "NGUYỄN THỊ NGỌC LIỄU", nguoiLienHe: "Nguyễn Thị Ngọc Liễu", sdt: "933305465", email: "", diaChi: "594/59 Âu Cơ, KP 4, P. Bảy Hiền, TP.HCM", maSoThue: "83182011101", trangThai: "dang_hop_tac", ghiChu: "CCCD: 083182011101 - Cấp: 22/12/2021 - MST: 083182011101" },
  { stt: 27, ma: "GC-TRU-002", tenDonVi: "Xưởng may trụ anh Tý Sơn", nguoiLienHe: "Nguyễn Hữu Kim Ly Sơn", sdt: "794953483", email: "nguyenhuukimlyson@gmail.com", diaChi: "Nhà không số ấp 29, Xã Tân Vĩnh Lộc, TP.HCM", soTaiKhoan: "060287316545", nganHang: "sacombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 066188019712 - Cấp: 20/01/2022 - MST: ---" },
  { stt: 28, ma: "GC-TRU-003", tenDonVi: "Xưởng may trụ anh Duẩn", nguoiLienHe: "Dương Xuân Duẩn", sdt: "966266775", email: "Xuanduanduong87@gmail.com", diaChi: "Đường N11, tổ 1 KP 2, P. Thới Hòa, TP.HCM", soTaiKhoan: "07119869", nganHang: "vietcombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 034086003445 - Cấp: 26/08/2022 - MST: ---" },
  { stt: 30, ma: "GC-TRU-005", tenDonVi: "THÔNG THƯƠNG", nguoiLienHe: "Nguyễn Văn Thông", sdt: "933305465", email: "bt5815989@gmail.com", diaChi: "28/8 Ấp 46, Xã Hóc Môn, TP.HCM", soTaiKhoan: "0355589066", nganHang: "mb", maSoThue: "86090005870", trangThai: "dang_hop_tac", ghiChu: "CCCD: 086090005870 - Cấp: 22/12/2021 - MST: 086090005870" },
  { stt: 31, ma: "GC-TRU-006", tenDonVi: "Xưởng may trụ cô Cúc", nguoiLienHe: "Huỳnh Thị Cúc Em", sdt: "907869422", email: "huynhthicucem1210@gmail.com", diaChi: "1/5B KP49 Nguyễn Văn Quá, P.Đông Hưng Thuận", soTaiKhoan: "9907869422", nganHang: "techcombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 32, ma: "GC-TRU-007", tenDonVi: "Xưởng may trụ anh Sản", nguoiLienHe: "Nguyễn Gia Sản", sdt: "906042853", email: "Giasan20015@gmail.com", diaChi: "Tổ 16 đường Lê Văn Chi, Linh Xuân", soTaiKhoan: "8888906042853", nganHang: "agribank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 030080000661 - Cấp: 19/09/2024 - MST: ---" },

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
