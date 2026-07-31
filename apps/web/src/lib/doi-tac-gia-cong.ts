// Đối tác gia công thật - Pulled từ file CSV chị Giàu ngày 2026-07-28
// 35 đối tác: 7 in/thêu/dập + 4 may quần + 14 may áo tròn + 10 may áo trụ
// Đầy đủ: Mã, Tên, Người LH, SĐT, Địa chỉ, STK, Ngân hàng, MST, CCCD, Trạng thái

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

// ============ 35 ĐỐI TÁC GIA CÔNG THẬT ============
const _raw: Omit<DoiTacGiaCong, "loaiDoiTuong" | "boPhan" | "chucVu" | "chuyenMon" | "cccd" | "cccdNgayCap">[] = [
  // ===== 7 XƯỞNG IN/THÊU/DẬP =====
  { stt: 1, ma: "GC-IN-001", tenDonVi: "Xưởng in/thêu/dập Bảo Ngân", nguoiLienHe: "Bảo Ngân", sdt: "978417243", email: "", diaChi: "b13/1a/15c ấp 2, xã tân vĩnh lộc, tphcm", soTaiKhoan: "114624915555", nganHang: "TMCP công thương việt nam", maSoThue: "319004432", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 2, ma: "GC-IN-002", tenDonVi: "Xưởng in/thêu/dập Hạnh", nguoiLienHe: "Hạnh", sdt: "374592478", email: "", diaChi: "ấp mỹ hòa 2, xuân thới sơn, hcm", soTaiKhoan: "0374592478", nganHang: "viettinbank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: 079188007153 Cấp: 12/01/2022  MST: ---" },
  { stt: 3, ma: "GC-IN-003", tenDonVi: "Xưởng in/thêu/dập Thanh Sơn", nguoiLienHe: "Thanh Sơn", sdt: "937557261", email: "", diaChi: "219/1/1 đường 12,bình tân", soTaiKhoan: "04061996", nganHang: "sacombank", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 4, ma: "GC-IN-004", tenDonVi: "Xưởng in/thêu/dập Tiến Đạt", nguoiLienHe: "Tiến Đạt", sdt: "987700589", email: "", diaChi: "48 nguyễn văn vinh, phú thạnh, hcm", soTaiKhoan: "160320168", nganHang: "acb", maSoThue: "0316108031", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 5, ma: "GC-IN-005", tenDonVi: "Xưởng in/thêu/dập Trung", nguoiLienHe: "Trung", sdt: "", email: "", diaChi: "khánh hòa nha trang", soTaiKhoan: "", nganHang: "", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 6, ma: "GC-IN-006", tenDonVi: "Xưởng in/thêu/dập Vui", nguoiLienHe: "Vui", sdt: "373779959", email: "", diaChi: "đông hưng thuận 03, quận 12", soTaiKhoan: "", nganHang: "", maSoThue: "", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 7, ma: "GC-IN-007", tenDonVi: "NGỌC QUÝ TP", nguoiLienHe: "Huỳnh Thanh Phong", sdt: "932003935", email: "", diaChi: "3/23, Hẻm 161, đường ĐHT02, Q. Tân Bình, TP.HCM", soTaiKhoan: "", nganHang: "", maSoThue: "72085011458", trangThai: "dang_hop_tac", ghiChu: "CCCD: 072085011458 - Cấp: 10/02/2025 - MST: 072085011458" },

  // ===== 4 XƯỞNG MAY QUẦN =====
  { stt: 8, ma: "GC-QUAN-001", tenDonVi: "NGUYỄN THỊ NGỌC DUNG", nguoiLienHe: "Nguyễn Thị Ngọc Dung", sdt: "383373415", email: "", diaChi: "Số 45C đường 26 ấp trung, Xã Tân Thông Hội, Huyện Củ Chi, TP.HCM", soTaiKhoan: "", nganHang: "", maSoThue: "8898968687-001", trangThai: "dang_hop_tac", ghiChu: "CCCD: 091183000355 - Cấp: 27/03/2022 - MST: 8898968687-001" },
  { stt: 9, ma: "GC-QUAN-002", tenDonVi: "NHÀ MAY MINH VY", nguoiLienHe: "Tổng Thị Minh", sdt: "362044839", email: "", diaChi: "27/6C Hưng Lân, Xã Bà Điểm, TP.HCM", soTaiKhoan: "4362044839", nganHang: "vietcombank", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: 38187008969 - Cấp: 25/08/2022 - MST: ---" },
  { stt: 10, ma: "GC-QUAN-003", tenDonVi: "Xưởng may quần anh Thơ", nguoiLienHe: "Tăng Văn Thơ", sdt: "766769562", email: "", diaChi: "Ấp 12, Xã Vĩnh Lộc, TP.Hồ Chí Minh", soTaiKhoan: "1490190764", nganHang: "bidv", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: 83084003261 - Cấp: 22/02/2023 - MST: ---" },
  { stt: 11, ma: "GC-QUAN-004", tenDonVi: "LÊ THỊ HOÀI HƯƠNG", nguoiLienHe: "Lê Thị Hoài Hương", sdt: "941104007", email: "", diaChi: "Thôn Xuân Thuận, Xã Phú Xuân, Tỉnh Đăk Lăk", soTaiKhoan: "0231000604464", nganHang: "vietcombank", maSoThue: "66190017850", trangThai: "dang_hop_tac", ghiChu: "CCCD: 066190017850 - Cấp: 12/08/2021 - MST: 066190017850" },

  // ===== 14 XƯỞNG MAY ÁO TRÒN =====
  { stt: 12, ma: "GC-TRON-001", tenDonVi: "Xưởng may tròn anh Trai", nguoiLienHe: "Nguyễn Ngọc Trai", sdt: "908908167", email: "", diaChi: "Ấp 19, Xã Vĩnh Lộc, Huyện Bình Chánh, TP.HCM", soTaiKhoan: "3180088065", nganHang: "bidv", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: 0520082013001 - Cấp: 27/01/2023 - MST: ---" },
  { stt: 13, ma: "GC-TRON-002", tenDonVi: "Xưởng may tròn chị Hằng", nguoiLienHe: "phan thị thúy hằng", sdt: "909802852", email: "", diaChi: "41/1C Hưng Lân, Bà Điểm, Hóc Môn", soTaiKhoan: "060259005607", nganHang: "sacombank", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 14, ma: "GC-TRON-003", tenDonVi: "Xưởng may tròn anh Chiến", nguoiLienHe: "Chiến", sdt: "986747344", email: "", diaChi: "1/8/13 Tân Thới Nhất 22, hẻm 123, Q.12", soTaiKhoan: "", nganHang: "", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 15, ma: "GC-TRON-004", tenDonVi: "Xưởng may tròn anh Thuận", nguoiLienHe: "Thuận", sdt: "903071501", email: "", diaChi: "28/10/15 KP40, Tân Thới Nhất 11, Q.12", soTaiKhoan: "43075977", nganHang: "ACB", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 16, ma: "GC-TRON-005", tenDonVi: "Xưởng may quang", nguoiLienHe: "Quang", sdt: "966670624", email: "", diaChi: "133/42 liên khu 4, khu phố 5, phường binh hưng hòa B, quận bình tân", soTaiKhoan: "6440205573303", nganHang: "agribank", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 17, ma: "GC-TRON-006", tenDonVi: "TRƯƠNG HOÀNG TUẤN 1", nguoiLienHe: "Trương Hoàng Tuấn", sdt: "989918562", email: "", diaChi: "67 đường số 9, KP 29, P. Bình Hưng Hòa, TP.HCM", soTaiKhoan: "", nganHang: "", maSoThue: "8045628381-001", trangThai: "ngung_hop_tac", ghiChu: "CCCD: 46087000011 - Cấp: 23/02/2022 - MST: 8045628381-001" },
  { stt: 18, ma: "GC-TRON-007", tenDonVi: "Xưởng may ánh", nguoiLienHe: "đinh văn ánh", sdt: "", email: "", diaChi: "17/2 xtt 7-2-1 trần vưn mười, ấp 14, bà điểm, hcm", soTaiKhoan: "", nganHang: "", maSoThue: "319106963", trangThai: "ngung_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 19, ma: "GC-TRON-008", tenDonVi: "Xưởng may kiếm", nguoiLienHe: "Kiếm", sdt: "", email: "", diaChi: "", soTaiKhoan: "", nganHang: "", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 20, ma: "GC-TRON-009", tenDonVi: "Xưởng may kiên", nguoiLienHe: "Kiên", sdt: "", email: "", diaChi: "", soTaiKhoan: "", nganHang: "", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 21, ma: "GC-TRON-010", tenDonVi: "Xưởng may mộng", nguoiLienHe: "Mộng", sdt: "", email: "", diaChi: "", soTaiKhoan: "", nganHang: "", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 22, ma: "GC-TRON-011", tenDonVi: "Xưởng may phúc", nguoiLienHe: "lê hoàng phúc", sdt: "", email: "", diaChi: "", soTaiKhoan: "", nganHang: "", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 23, ma: "GC-TRON-012", tenDonVi: "Xưởng may thắng", nguoiLienHe: "Thắng", sdt: "", email: "", diaChi: "", soTaiKhoan: "", nganHang: "", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 24, ma: "GC-TRON-013", tenDonVi: "Xưởng may thiện", nguoiLienHe: "Thiện", sdt: "", email: "", diaChi: "", soTaiKhoan: "", nganHang: "", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 25, ma: "GC-TRON-014", tenDonVi: "Xưởng may trí", nguoiLienHe: "Trí", sdt: "", email: "", diaChi: "", soTaiKhoan: "", nganHang: "", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },

  // ===== 10 XƯỞNG MAY ÁO TRỤ =====
  { stt: 26, ma: "GC-TRU-001", tenDonVi: "NGUYỄN THỊ NGỌC LIỄU", nguoiLienHe: "Nguyễn Thị Ngọc Liễu", sdt: "933305465", email: "", diaChi: "594/59 Âu Cơ, KP 4, P. Bảy Hiền, TP.HCM", soTaiKhoan: "", nganHang: "", maSoThue: "83182011101", trangThai: "dang_hop_tac", ghiChu: "CCCD: 083182011101 - Cấp: 22/12/2021 - MST: 083182011101" },
  { stt: 27, ma: "GC-TRU-002", tenDonVi: "Xưởng may trụ anh Tý Sơn", nguoiLienHe: "Nguyễn Hữu Kim Ly Sơn", sdt: "794953483", email: "", diaChi: "Nhà không số ấp 29, Xã Tân Vĩnh Lộc, TP.HCM", soTaiKhoan: "060287316545", nganHang: "sacombank", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: 066188019712 - Cấp: 20/01/2022 - MST: ---" },
  { stt: 28, ma: "GC-TRU-003", tenDonVi: "Xưởng may trụ anh Duẩn", nguoiLienHe: "Dương Xuân Duẩn", sdt: "966266775", email: "", diaChi: "Đường N11, tổ 1 KP 2, P. Thới Hòa, TP.HCM", soTaiKhoan: "07119869", nganHang: "vietcombank", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: 034086003445 - Cấp: 26/08/2022 - MST: ---" },
  { stt: 29, ma: "GC-TRU-004", tenDonVi: "Xưởng may trụ anh Toàn", nguoiLienHe: "Toàn", sdt: "799962940", email: "", diaChi: "Ấp 7, xã Bà Điểm, Hóc Môn", soTaiKhoan: "", nganHang: "", maSoThue: "---", trangThai: "ngung_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 30, ma: "GC-TRU-005", tenDonVi: "THÔNG THƯƠNG", nguoiLienHe: "Nguyễn Văn Thông", sdt: "933305465", email: "", diaChi: "28/8 Ấp 46, Xã Hóc Môn, TP.HCM", soTaiKhoan: "0355589066", nganHang: "mb", maSoThue: "86090005870", trangThai: "dang_hop_tac", ghiChu: "CCCD: 086090005870 - Cấp: 22/12/2021 - MST: 086090005870" },
  { stt: 31, ma: "GC-TRU-006", tenDonVi: "Xưởng may trụ cô Cúc", nguoiLienHe: "Cúc", sdt: "907869422", email: "", diaChi: "1/5B KP49 Nguyễn Văn Quá, P.Đông Hưng Thuận", soTaiKhoan: "9907869422", nganHang: "techcombank", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 32, ma: "GC-TRU-007", tenDonVi: "Xưởng may trụ anh Sản", nguoiLienHe: "Nguyễn Gia Sản", sdt: "906042853", email: "", diaChi: "Tổ 16 đường Lê Văn Chi, Linh Xuân", soTaiKhoan: "8888906042853", nganHang: "agribank", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: 030080000661 - Cấp: 19/09/2024 - MST: ---" },
  { stt: 33, ma: "GC-TRU-008", tenDonVi: "Xưởng may bình", nguoiLienHe: "Bình", sdt: "", email: "", diaChi: "", soTaiKhoan: "", nganHang: "", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 34, ma: "GC-TRU-009", tenDonVi: "Xưởng may hiền", nguoiLienHe: "Hiền", sdt: "352186386", email: "", diaChi: "ấp mới 1, xã myc hạnh nam huyện đức hòa, long an", soTaiKhoan: "", nganHang: "", maSoThue: "---", trangThai: "dang_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
  { stt: 35, ma: "GC-TRU-010", tenDonVi: "Xưởng may toản", nguoiLienHe: "Toản", sdt: "942044799", email: "", diaChi: "30 đường tk8, ấp tiền lân, bà ddiemr, hóc môn", soTaiKhoan: "", nganHang: "", maSoThue: "313905409", trangThai: "ngung_hop_tac", ghiChu: "CCCD: --- - Cấp: --- - MST: ---" },
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
