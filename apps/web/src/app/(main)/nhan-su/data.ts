// Data layer cho trang /nhan-su
// Tach ra file rieng de trang chinh load nhanh hon
// Lazy load qua dynamic import neu can

import { USERS } from "@/lib/users";
import type { NhanSu } from "@/lib/data/real-data";

export type NhanSuExt = NhanSu & {
  rating?: number;
  ngayVao?: string;
  luongCung?: number;
  taiKhoan?: string;
  avatar?: string;
  cccdFrontImage?: string;
  cccdBackImage?: string;
  donGiaSP?: string;
  ghiChu?: string;
};

/**
 * Suy ra chucVu tu phongBan + chucVu text cua user
 */
function inferChucVu(phongBan: string, ghiChu: string): string {
  if (phongBan === "ban-giam-doc") return "Giám đốc điều hành";
  if (phongBan.includes("ke-toan")) return "Kế toán trưởng";
  if (phongBan.includes("kinh-doanh")) return "Trưởng phòng KD";
  if (phongBan.includes("marketing")) return "Trưởng nhóm Media";
  if (phongBan === "kho") return "Thủ kho trưởng";
  if (/trưởng|quản lý/i.test(ghiChu)) return "Tổ trưởng";
  if (/hỗ trợ|phụ/i.test(ghiChu)) return "Công nhân hỗ trợ";
  return "Công nhân";
}

function inferLuongCung(phongBan: string, chucVu: string): number {
  if (chucVu.includes("Giám đốc")) return 25000000;
  if (chucVu.includes("trưởng")) return 12000000;
  if (phongBan === "ke-toan") return 10000000;
  if (phongBan === "kho") return 8000000;
  return 7000000;
}

/**
 * Danh sach Nhan Su chuẩn lấy từ users.ts, computed 1 lan khi module load
 */
const realUsers = USERS.filter((u) => !u.isMock && u.id !== "admin" && u.id !== "gs018" && u.id !== "gs019");

export const NHAN_SU_KHOI_DAU: NhanSuExt[] = realUsers.map((nv, i) => {
  const chucVu = inferChucVu(nv.phongBan, nv.chucVu);
  const luongCung = inferLuongCung(nv.phongBan, chucVu);
  
  // Convert phongBan code (to-may, kho, marketing) to readable Bo Phan
  let bpName = "Sản xuất";
  if (nv.phongBan === "kho") bpName = "Kho vận";
  if (nv.phongBan === "ke-toan") bpName = "Kế toán";
  if (nv.phongBan === "marketing") bpName = "Media";
  if (nv.phongBan === "kinh-doanh") bpName = "Kinh doanh";
  if (nv.phongBan === "ban-giam-doc") bpName = "Điều hành";

  return {
    stt: i + 1,
    maNV: nv.maNV,
    hoTen: nv.name,
    boPhan: bpName,
    chucVu: nv.chucVu || chucVu, // uu tien chucVu text neu co
    ngaySinh: "1990-01-01",
    gioiTinh: "Nữ", // random default
    cccd: "",
    sdt: nv.sdt || "",
    email: nv.email || "",
    diaChiTT: "",
    diaChiTamTru: "",
    viTri: nv.chucVu,
    ngayVaoLam: `2020-${String((i % 12) + 1).padStart(2, "0")}-01`,
    loaiHD: "HĐ không xác định thời hạn",
    tinhTrangHN: "Đã đóng BHXH",
    soTK: "",
    nganHang: "",
    mst: "",
    bhxh: `79${String(1000000 + i * 137).padStart(7, "0")}`,
    trangThai: nv.isActive === false ? "nghi_viec" : "dang_lam",
    luongCB: luongCung,
    loaiLuong: nv.laCongNhan ? "Thời gian + Sản phẩm" : "Thời gian",
    rating: 3.5 + (i % 3) * 0.5,
    ngayVao: `2020-${String((i % 12) + 1).padStart(2, "0")}-01`,
    luongCung,
    taiKhoan: nv.id,
  } as NhanSuExt;
});
