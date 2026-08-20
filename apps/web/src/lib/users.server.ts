// SERVER-ONLY: nguồn dữ liệu đầy đủ (kèm mật khẩu) cho luồng đăng nhập demo/fallback.
// Import "server-only" khiến build LỖI NGAY nếu file này lỡ bị kéo vào bất kỳ
// client component nào - trước đây lib/users.ts (không có guard) chứa cùng dữ
// liệu và bị bundle thẳng xuống trình duyệt, lộ mật khẩu thật của 18+ nhân viên.
// Chỉ import file này từ API route (route.ts) hoặc code server khác.
import "server-only";
import type { ModuleSX, Role } from "./users";

export interface UserAccountFull {
  id: string;
  maNV: string;
  email: string;
  password: string;       // plain text - dùng cho login
  passwordHash?: string;  // SHA-256 - dùng cho verify
  name: string;
  role: Role;
  chucVu: string;
  phongBan: string;
  nhom: string;
  laCongNhan: boolean;
  module?: ModuleSX;
  donGia?: number;
  donVi?: string;
  sdt?: string;
  isMock?: boolean;
  isActive?: boolean;
  lastLogin?: string;
  lastActiveAt?: string;
  loginCount?: number;
}

// 18 user: 1 admin (sang) + 17 user từ Excel
export const USERS_FULL: UserAccountFull[] = [
  // ============ ADMIN ============
  {
    id: "sang", maNV: "NV035", email: "sang@mimin.vn", password: "sang123", passwordHash: "",
    name: "Hồ Minh Sang", role: "admin", chucVu: "Quản trị hệ thống",
    phongBan: "ban-giam-doc", nhom: "quan-tri", laCongNhan: false,
    sdt: "0774480916",
  },
  {
    id: "de", maNV: "NV007", email: "de7481039@gmail.com", password: "de123", passwordHash: "",
    name: "Phạm Văn Đệ", role: "sewing", chucVu: "cắt - Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ",
    phongBan: "to-may", nhom: "cat", laCongNhan: true, module: "cat",
    donGia: 1400, donVi: "cái", sdt: "0834033992",
  },
  {
    id: "nhi", maNV: "NV009", email: "nguyennhi192145@gmail.com", password: "nhi123", passwordHash: "",
    name: "NGUYỄN THỊ MỸ NHI", role: "finishing", chucVu: "Gấp xếp - Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ",
    phongBan: "to-may", nhom: "dong-goi", laCongNhan: true, module: "dong-goi",
    donGia: 1300, donVi: "cái", sdt: "0901207771",
  },
  {
    id: "phuong", maNV: "NV010", email: "vop61089@gmail.com", password: "phuong123", passwordHash: "",
    name: "VÕ THỊ PHƯỜNG", role: "finishing", chucVu: "Gấp xếp - Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ",
    phongBan: "to-may", nhom: "dong-goi", laCongNhan: true, module: "dong-goi",
    donGia: 1300, donVi: "cái", sdt: "0702501456",
  },
  {
    id: "vy", maNV: "NV004", email: "nvy967300@gmail.com", password: "vy123", passwordHash: "",
    name: "NGUYỄN NGỌC CẨM VY", role: "admin", chucVu: "Content - Media - Lương CB: 8,000,000đ",
    phongBan: "marketing", nhom: "content", laCongNhan: false, module: "cat",
    donGia: 0, donVi: "cái", sdt: "0779182053",
  },
  {
    id: "huyen", maNV: "NV003", email: "dohuyencpr81@gmail.com", password: "huyen123", passwordHash: "",
    name: "ĐỖ THỊ HUYỀN", role: "planner", chucVu: "QL Khách hàng Sỉ - Lương CB: 7,000,000đ",
    phongBan: "kinh-doanh", nhom: "ban-si", laCongNhan: false, module: "cat",
    donGia: 0, donVi: "cái", sdt: "0376327699",
  },
  {
    id: "thanh", maNV: "NV002", email: "buithanh151199@gmail.com", password: "thanh123", passwordHash: "",
    name: "BÙI THỊ THANH", role: "accountant", chucVu: "Kế toán điều phối SX - Lương CB: 8,000,000đ",
    phongBan: "ke-toan", nhom: "ke-toan", laCongNhan: false, module: "cat",
    donGia: 0, donVi: "cái", sdt: "0911546004",
  },
  {
    id: "be", maNV: "NV019", email: "beekhuong1505@gmail.com", password: "be123", passwordHash: "",
    name: "NGUYỄN THỊ BÉ", role: "finishing", chucVu: "Gấp xếp - Bộ Thường: 1.300đ, Áo Thường: 800đ, Bộ Trắng: 1.500đ, Áo Trắng: 1.000đ",
    phongBan: "to-may", nhom: "dong-goi", laCongNhan: true, module: "dong-goi",
    donGia: 1300, donVi: "cái", sdt: "0363073998",
  },
  {
    id: "hoa", maNV: "NV020", email: "xhoa14052004@gmail.com", password: "hoa123", passwordHash: "",
    name: "HUỲNH XUÂN HÒA", role: "admin", chucVu: "Media - Lương CB: 10,000,000đ",
    phongBan: "marketing", nhom: "content", laCongNhan: false, module: "cat",
    donGia: 0, donVi: "cái", sdt: "0334536752",
  },
  {
    id: "duc1", maNV: "NV021", email: "nguyenminhduc199024@gmail.com", password: "duc1123", passwordHash: "",
    name: "NGUYỄN MINH ĐỨC", role: "finishing", chucVu: "Ủi - Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ",
    phongBan: "to-may", nhom: "ui", laCongNhan: true, module: "ui",
    donGia: 800, donVi: "cái", sdt: "0365052474",
  },
  {
    id: "tam", maNV: "NV022", email: "truongtam2044@gmail.com", password: "tam123", passwordHash: "",
    name: "TRƯƠNG MINH TÂM", role: "finishing", chucVu: "Ủi - Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ",
    phongBan: "to-may", nhom: "ui", laCongNhan: true, module: "ui",
    donGia: 800, donVi: "cái", sdt: "0343513417",
  },
  {
    id: "dinh", maNV: "NV023", email: "nan499229@gmail.com", password: "dinh123", passwordHash: "",
    name: "LÊ ĐỊNH", role: "finishing", chucVu: "Ủi - Áo trụ: 800đ, Áo tròn: 700đ, Quần: 600đ",
    phongBan: "to-may", nhom: "ui", laCongNhan: true, module: "ui",
    donGia: 800, donVi: "cái", sdt: "334047628",
  },
  {
    id: "vinh", maNV: "NV024", email: "duongvinh3102005@gmail.com", password: "vinh123", passwordHash: "",
    name: "DƯƠNG TẤN VĨNH", role: "sewing", chucVu: "Cắt - Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ",
    phongBan: "to-may", nhom: "cat", laCongNhan: true, module: "cat",
    donGia: 1400, donVi: "cái", sdt: "0392123831",
  },
  {
    id: "minh1", maNV: "NV025", email: "gs013@mimin-erp.local", password: "minh1123", passwordHash: "",
    name: "NGUYỄN QUỐC MINH", role: "sewing", chucVu: "Cắt - Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ",
    phongBan: "to-may", nhom: "cat", laCongNhan: true, module: "cat",
    donGia: 1400, donVi: "cái", sdt: "0332026731",
  },
  {
    id: "nhan", maNV: "NV026", email: "trvannhan1402@gmail.com", password: "nhan123", passwordHash: "",
    name: "TRƯƠNG VĂN NHẪN", role: "sewing", chucVu: "Cắt - Áo trụ: 1.400đ, Áo tròn: 1.200đ, Quần: 900đ",
    phongBan: "to-may", nhom: "cat", laCongNhan: true, module: "cat",
    donGia: 1400, donVi: "cái", sdt: "0345141953",
  },
  {
    id: "hau", maNV: "NV005", email: "beo26032019@gmail.com", password: "hau123", passwordHash: "",
    name: "NGUYỄN QUỐC HẬU", role: "warehouse", chucVu: "Nhân viên Kho - Lương CB: 7,000,000đ",
    phongBan: "kho", nhom: "kho", laCongNhan: false, module: "cat",
    donGia: 0, donVi: "cái", sdt: "0386231456",
  },
  {
    id: "phi", maNV: "NV027", email: "fizxnm2251994@mail.com", password: "phi123", passwordHash: "",
    name: "LƯƠNG HOÀNG PHI", role: "admin", chucVu: "Media",
    phongBan: "marketing", nhom: "content", laCongNhan: false, module: "cat",
    donGia: 0, donVi: "cái", sdt: "0938625594",
  },
  {
    id: "ruong", maNV: "NV017", email: "nguyenvanruong14@gmail.com", password: "ruong123", passwordHash: "",
    name: "NGUYỄN VĂN RUỘNG", role: "sewing", chucVu: "Khuy nút - Chung: 750đ",
    phongBan: "to-may", nhom: "khuy-nut", laCongNhan: true, module: "khuy-nut",
    donGia: 750, donVi: "cái", sdt: "0339724459",
  },
  // Các tài khoản ảo/admin trên Supabase
  {
    id: "admin", maNV: "ADMIN", email: "admin@mimin.com", password: "admin", passwordHash: "",
    name: "Administrator", role: "admin", chucVu: "Administrator",
    phongBan: "ban-giam-doc", nhom: "quan-tri", laCongNhan: false,
  },
  {
    id: "gs018", maNV: "NV018", email: "gs018@mimin-erp.local", password: "123", passwordHash: "",
    name: "MIMIN USER 18", role: "sewing", chucVu: "Công nhân",
    phongBan: "to-may", nhom: "cat", laCongNhan: true, module: "cat",
  },
  {
    id: "gs019", maNV: "NV019-2", email: "gs019@mimin-erp.local", password: "123", passwordHash: "",
    name: "MIMIN USER 19", role: "sewing", chucVu: "Công nhân",
    phongBan: "to-may", nhom: "cat", laCongNhan: true, module: "cat",
  },
];

export function findUserByEmailFull(email: string): UserAccountFull | undefined {
  return USERS_FULL.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
