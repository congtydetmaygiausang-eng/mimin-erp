// Data layer cho trang /nhan-su
// Tach ra file rieng de trang chinh load nhanh hon
// Lazy load qua dynamic import neu can

import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";
import type { NhanSu } from "@/lib/data/real-data";

export type NhanSuExt = NhanSu & {
  rating?: number;
  ngayVao?: string;
  luongCung?: number;
  taiKhoan?: string;
  avatar?: string;
  cccdFrontImage?: string;
  cccdBackImage?: string;
};

/**
 * Mock data cho 18 NV (NV001-NV018) - thong tin lien lac
 * Se thay bang data that tu Supabase khi co
 */
export const NV_MOCK_DETAIL: Record<string, { sdt: string; email: string; ngaySinh: string; gioiTinh: string; cccd: string; diaChiTT: string }> = {
  NV001: { sdt: "0901234567", email: "giau.nt@mimin.vn", ngaySinh: "1985-05-15", gioiTinh: "Nữ", cccd: "079185000123", diaChiTT: "12/39 Xuân Thới Thượng, Hóc Môn, TP.HCM" },
  NV002: { sdt: "0912345678", email: "thanh.bt@mimin.vn", ngaySinh: "1990-08-20", gioiTinh: "Nữ", cccd: "079190000456", diaChiTT: "Quận 12, TP.HCM" },
  NV003: { sdt: "0933456789", email: "huyen.dt@mimin.vn", ngaySinh: "1992-03-10", gioiTinh: "Nữ", cccd: "079192000789", diaChiTT: "Gò Vấp, TP.HCM" },
  NV004: { sdt: "0944567890", email: "vy.nn@mimin.vn", ngaySinh: "1995-11-25", gioiTinh: "Nữ", cccd: "079195000234", diaChiTT: "Bà Điểm, Hóc Môn, TP.HCM" },
  NV005: { sdt: "0955678901", email: "hau.nq@mimin.vn", ngaySinh: "1988-07-12", gioiTinh: "Nam", cccd: "079188000567", diaChiTT: "Hóc Môn, TP.HCM" },
  NV006: { sdt: "0966789012", email: "giang.nh@mimin.vn", ngaySinh: "1991-04-18", gioiTinh: "Nam", cccd: "079191000890", diaChiTT: "Củ Chi, TP.HCM" },
  NV007: { sdt: "0977890123", email: "de.pv@mimin.vn", ngaySinh: "1989-09-30", gioiTinh: "Nam", cccd: "079189000123", diaChiTT: "Hóc Môn, TP.HCM" },
  NV008: { sdt: "0988901234", email: "phu.hvm@mimin.vn", ngaySinh: "1993-12-05", gioiTinh: "Nam", cccd: "079193000456", diaChiTT: "Bình Chánh, TP.HCM" },
  NV009: { sdt: "0999012345", email: "nhi.ntm@mimin.vn", ngaySinh: "1996-02-22", gioiTinh: "Nữ", cccd: "079196000789", diaChiTT: "Tân Hưng, Long An" },
  NV010: { sdt: "0901123456", email: "phuong.vt@mimin.vn", ngaySinh: "1994-06-14", gioiTinh: "Nữ", cccd: "079194000012", diaChiTT: "Bà Điểm, Hóc Môn" },
  NV011: { sdt: "0912234567", email: "tuyen.dvc@mimin.vn", ngaySinh: "1987-10-08", gioiTinh: "Nam", cccd: "079187000345", diaChiTT: "Quận 12, TP.HCM" },
  NV012: { sdt: "0923345678", email: "huynh.pv@mimin.vn", ngaySinh: "1990-01-25", gioiTinh: "Nam", cccd: "079190000678", diaChiTT: "Hóc Môn, TP.HCM" },
  NV013: { sdt: "0934456789", email: "thuy.cq@mimin.vn", ngaySinh: "1988-08-17", gioiTinh: "Nam", cccd: "079188000901", diaChiTT: "Củ Chi, TP.HCM" },
  NV014: { sdt: "0945567890", email: "anh.t@mimin.vn", ngaySinh: "1992-11-03", gioiTinh: "Nam", cccd: "079192000234", diaChiTT: "Đức Hòa, Long An" },
  NV015: { sdt: "0956678901", email: "tim@mimin.vn", ngaySinh: "1995-05-28", gioiTinh: "Nữ", cccd: "079195000567", diaChiTT: "Bình Chánh, TP.HCM" },
  NV016: { sdt: "0967789012", email: "phien.ttb@mimin.vn", ngaySinh: "1993-09-09", gioiTinh: "Nữ", cccd: "079193000890", diaChiTT: "Hóc Môn, TP.HCM" },
  NV017: { sdt: "0978890123", email: "ruong.nv@mimin.vn", ngaySinh: "1986-04-12", gioiTinh: "Nam", cccd: "079186000123", diaChiTT: "Phú Tân, An Giang" },
  NV018: { sdt: "0989901234", email: "khoi.bm@mimin.vn", ngaySinh: "1997-07-20", gioiTinh: "Nam", cccd: "079197000456", diaChiTT: "Sóc Trăng" },
};

/**
 * Suy ra chucVu tu boPhan + ghiChu
 */
function inferChucVu(boPhan: string, ghiChu: string, _ma: string): string {
  if (boPhan === "Điều hành") return "Giám đốc điều hành";
  if (boPhan.includes("Kế toán")) return "Kế toán trưởng";
  if (boPhan.includes("Quản lý KH")) return "Trưởng phòng KD";
  if (boPhan.includes("Content")) return "Trưởng nhóm Media";
  if (boPhan === "Kho") return "Thủ kho trưởng";
  if (/trưởng|quản lý/i.test(ghiChu)) return "Tổ trưởng";
  if (/hỗ trợ|phụ/i.test(ghiChu)) return "Công nhân hỗ trợ";
  return "Công nhân";
}

function inferLuongCung(boPhan: string, chucVu: string): number {
  if (chucVu.includes("Giám đốc")) return 25000000;
  if (chucVu.includes("trưởng")) return 12000000;
  if (boPhan === "Kế toán") return 10000000;
  if (boPhan === "Kho") return 8000000;
  return 7000000;
}

const FALLBACK_DETAIL = { sdt: "", email: "", ngaySinh: "1990-01-01", gioiTinh: "Nữ", cccd: "", diaChiTT: "" };

/**
 * 18 NV khoi dau, computed 1 lan khi module load
 */
export const NHAN_SU_KHOI_DAU: NhanSuExt[] = REAL_NHAN_VIEN.map((nv, i) => {
  const chucVu = inferChucVu(nv.boPhan, nv.ghiChu, nv.ma);
  const luongCung = inferLuongCung(nv.boPhan, chucVu);
  const detail = NV_MOCK_DETAIL[nv.ma] || FALLBACK_DETAIL;
  return {
    stt: i + 1,
    maNV: nv.ma,
    hoTen: nv.ten,
    boPhan: nv.boPhan,
    chucVu,
    ngaySinh: detail.ngaySinh,
    gioiTinh: detail.gioiTinh,
    cccd: detail.cccd,
    sdt: detail.sdt,
    email: detail.email,
    diaChiTT: detail.diaChiTT,
    diaChiTamTru: detail.diaChiTT,
    viTri: nv.ghiChu,
    ngayVaoLam: `2020-${String((i % 12) + 1).padStart(2, "0")}-01`,
    loaiHD: "HĐ không xác định thời hạn",
    tinhTrangHN: "Đã đóng BHXH",
    soTK: "",
    nganHang: "",
    mst: "",
    bhxh: `79${String(1000000 + i * 137).padStart(7, "0")}`,
    trangThai: "dang_lam",
    luongCB: luongCung,
    loaiLuong: "Thời gian + Sản phẩm",
    rating: 3.5 + (i % 3) * 0.5,
    ngayVao: `2020-${String((i % 12) + 1).padStart(2, "0")}-01`,
    luongCung,
    taiKhoan: `nv${(i + 1).toString().padStart(3, "0")}`,
  } as NhanSuExt;
});
