// 19 tài khoản nội bộ theo 10 NHÓM GIAO DIỆN/MODULE (chốt a Cường 2026-07-29)
// 6 nhóm quản lý (1 user/nhóm) + 4 nhóm sản xuất (13 user)
//
// Cấu trúc: 19 tài khoản → 10 nhóm giao diện → 4 module sản xuất dùng chung cho 13 công nhân
// Mỗi người vẫn có 1 tài khoản riêng để xác định chính xác ai nhận việc, sản lượng, lỗi, tiền công

export type NhomGiaoDien =
  | "quan-tri"        // 1. Anh Sang - Quản trị hệ thống
  | "dieu-hanh"       // 2. Chị Giàu - Dashboard điều hành
  | "ke-toan"        // 3. Bùi Thị Thanh - Kế toán, điều phối SX
  | "khach-hang"     // 4. Đỗ Thị Huyền - KH sỉ, bán hàng
  | "content"        // 5. Cẩm Vy - Content, Media
  | "kho"            // 6. Hậu - Kho
  | "cat"            // 7. Nhóm Cắt (3 người)
  | "khuy-nut"       // 8. Nhóm Khuy nút (2 người)
  | "ui"             // 9. Nhóm Ủi (4 người)
  | "dong-goi";      // 10. Nhóm Gấp xếp - Đóng gói (4 người)

export interface DemoUser {
  email: string;
  password: string;
  name: string;
  role: "admin" | "planner" | "warehouse" | "sewing" | "qc" | "finishing" | "accountant";
  nhom: NhomGiaoDien;        // 10 nhóm theo bảng chốt
  phongBan: string;          // Phòng ban (chi tiết thêm)
  maNV: string;              // NV001-NV018 hoặc NV019+
  chucVu: string;
  sdt: string;
  trangThai: "active";
}

// ============ 19 USER NỘI BỘ THEO 10 NHÓM ============
export const DEMO_USERS_19: DemoUser[] = [
  // ====== 1. ANH SANG - Quản trị hệ thống, phân quyền, toàn bộ module (1) ======
  { email: "sang@mimin.vn", password: "sang123", name: "Nguyễn Quốc Sang (Admin)", role: "admin",
    nhom: "quan-tri", phongBan: "ban-giam-doc", maNV: "NV035", chucVu: "Quản trị hệ thống", sdt: "0901234500", trangThai: "active" as const },

  // ====== 2. CHỊ GIÀU - Dashboard điều hành, bán hàng, phê duyệt, báo cáo (1) ======
  { email: "giau@mimin.vn", password: "giau123", name: "Nguyễn Thị Ngọc Giàu", role: "admin",
    nhom: "dieu-hanh", phongBan: "ban-giam-doc", maNV: "NV001", chucVu: "Giám đốc điều hành", sdt: "0901234567", trangThai: "active" as const },

  // ====== 3. BÙI THỊ THANH - Kế toán, điều phối SX, sản lượng, công nợ (1) ======
  { email: "thanh@mimin.vn", password: "thanh123", name: "Bùi Thị Thanh", role: "accountant",
    nhom: "ke-toan", phongBan: "ke-toan", maNV: "NV002", chucVu: "Kế toán trưởng + Điều phối SX", sdt: "0912345678", trangThai: "active" as const },

  // ====== 4. ĐỖ THỊ HUYỀN - KH sỉ, báo giá, đơn bán, công nợ KH (1) ======
  { email: "huyen@mimin.vn", password: "huyen123", name: "Đỗ Thị Huyền", role: "planner",
    nhom: "khach-hang", phongBan: "kinh-doanh", maNV: "NV003", chucVu: "Trưởng phòng KH sỉ", sdt: "0933456789", trangThai: "active" as const },

  // ====== 5. NGUYỄN NGỌC CẨM VY - Content, Media, thư viện ảnh, lịch đăng (1) ======
  { email: "vy@mimin.vn", password: "vy123", name: "Nguyễn Ngọc Cẩm Vy", role: "admin",
    nhom: "content", phongBan: "marketing", maNV: "NV004", chucVu: "Trưởng nhóm Content - Media", sdt: "0944567890", trangThai: "active" as const },

  // ====== 6. NGUYỄN QUỐC HẬU - Kho, nhập-xuất, giao nhận, kiểm kê (1) ======
  { email: "hau@mimin.vn", password: "hau123", name: "Nguyễn Quốc Hậu", role: "warehouse",
    nhom: "kho", phongBan: "kho-soi", maNV: "NV005", chucVu: "Thủ kho trưởng", sdt: "0955678901", trangThai: "active" as const },

  // ====== 7. NHÓM CẮT - Lệnh cắt, nhận việc, sản lượng, lỗi, bàn giao (3) ======
  { email: "giang@mimin.vn", password: "giang123", name: "Nguyễn Hoàng Giang", role: "sewing",
    nhom: "cat", phongBan: "to-may", maNV: "NV006", chucVu: "Tổ trưởng Cắt", sdt: "0966789012", trangThai: "active" as const },
  { email: "de@mimin.vn", password: "de123", name: "Phạm Văn Đệ", role: "sewing",
    nhom: "cat", phongBan: "to-may", maNV: "NV007", chucVu: "Công nhân Cắt (áo trụ 1400đ, tròn 1200đ, quần 900đ)", sdt: "0977890123", trangThai: "active" as const },
  { email: "phu@mimin.vn", password: "phu123", name: "Hồ Văn Minh Phú", role: "sewing",
    nhom: "cat", phongBan: "to-may", maNV: "NV008", chucVu: "Công nhân Cắt hỗ trợ", sdt: "0988901234", trangThai: "active" as const },

  // ====== 8. NHÓM KHUY NÚT - Nhận hàng, khuy nút, sản lượng, bàn giao ủi (2) ======
  { email: "ruong@mimin.vn", password: "ruong123", name: "Nguyễn Văn Ruộng", role: "finishing",
    nhom: "khuy-nut", phongBan: "hoan-thien", maNV: "NV017", chucVu: "Tổ trưởng Khuy nút (750đ/cái)", sdt: "0978890123", trangThai: "active" as const },
  { email: "khoi@mimin.vn", password: "khoi123", name: "Bùi Minh Khôi", role: "finishing",
    nhom: "khuy-nut", phongBan: "hoan-thien", maNV: "NV018", chucVu: "Công nhân Khuy nút hỗ trợ", sdt: "0989901234", trangThai: "active" as const },

  // ====== 9. NHÓM ỦI - Nhận việc, ủi, sản lượng, lỗi, bàn giao (4) ======
  { email: "tuyen@mimin.vn", password: "tuyen123", name: "Đặng Võ Công Tuyền", role: "finishing",
    nhom: "ui", phongBan: "hoan-thien", maNV: "NV011", chucVu: "Tổ trưởng Ủi", sdt: "0912234567", trangThai: "active" as const },
  { email: "huynh@mimin.vn", password: "huynh123", name: "Phạm Văn Huynh", role: "finishing",
    nhom: "ui", phongBan: "hoan-thien", maNV: "NV012", chucVu: "Công nhân Ủi áo/quần", sdt: "0923345678", trangThai: "active" as const },
  { email: "thuy@mimin.vn", password: "thuy123", name: "Chu Quang Thủy", role: "finishing",
    nhom: "ui", phongBan: "hoan-thien", maNV: "NV013", chucVu: "Công nhân Ủi hoàn thiện", sdt: "0934456789", trangThai: "active" as const },
  { email: "anhui@mimin.vn", password: "anhui123", name: "Thế Anh", role: "finishing",
    nhom: "ui", phongBan: "hoan-thien", maNV: "NV014", chucVu: "Công nhân Ủi theo lô", sdt: "0945567890", trangThai: "active" as const },

  // ====== 10. NHÓM GẤP XẾP - ĐÓNG GÓI - Gấp xếp, đóng gói, tem size, bàn giao kho (4) ======
  { email: "nhi@mimin.vn", password: "nhi123", name: "Nguyễn Thị Mỹ Nhi", role: "sewing",
    nhom: "dong-goi", phongBan: "hoan-thien", maNV: "NV009", chucVu: "Tổ trưởng Gấp xếp", sdt: "0999012345", trangThai: "active" as const },
  { email: "phuong@mimin.vn", password: "phuong123", name: "Võ Thị Phương", role: "sewing",
    nhom: "dong-goi", phongBan: "hoan-thien", maNV: "NV010", chucVu: "Công nhân Gấp - Xếp", sdt: "0990123456", trangThai: "active" as const },
  { email: "tim@mimin.vn", password: "tim123", name: "Tím", role: "sewing",
    nhom: "dong-goi", phongBan: "hoan-thien", maNV: "NV015", chucVu: "Công nhân Phân loại - Bao", sdt: "0956678901", trangThai: "active" as const },
  { email: "phien@mimin.vn", password: "phien123", name: "Trần Thị Bé Phiên", role: "sewing",
    nhom: "dong-goi", phongBan: "hoan-thien", maNV: "NV016", chucVu: "Công nhân Gấp - Tem - Đóng bao", sdt: "0967789012", trangThai: "active" as const },
];

// ============ THÔNG TIN 10 NHÓM ============
export const NHOM_GIAO_DIEN: Record<NhomGiaoDien, {
  name: string;
  icon: string;
  desc: string;
  soUser: number;
  modules: string[];
  mau: string;       // gradient class
  laCongNhan: boolean;
}> = {
  "quan-tri": {
    name: "Anh Sang",
    icon: "👨‍💼",
    desc: "Quản trị hệ thống, phân quyền, toàn bộ module",
    soUser: 1,
    modules: ["Tất cả 21 module", "Quản lý user", "Audit log", "Cài đặt"],
    mau: "from-rose-500 to-pink-500",
    laCongNhan: false,
  },
  "dieu-hanh": {
    name: "Chị Giàu",
    icon: "👑",
    desc: "Dashboard điều hành, bán hàng, phê duyệt, báo cáo",
    soUser: 1,
    modules: ["Dashboard", "Khách hàng", "Đơn hàng", "Báo cáo", "Phê duyệt LSX"],
    mau: "from-violet-500 to-purple-500",
    laCongNhan: false,
  },
  "ke-toan": {
    name: "Bùi Thị Thanh",
    icon: "💰",
    desc: "Kế toán, điều phối sản xuất, sản lượng, công nợ",
    soUser: 1,
    modules: ["Kế toán", "Công nợ", "Lương", "Điều phối SX", "Sản lượng"],
    mau: "from-blue-500 to-indigo-500",
    laCongNhan: false,
  },
  "khach-hang": {
    name: "Đỗ Thị Huyền",
    icon: "🤝",
    desc: "Khách hàng sỉ, báo giá, đơn bán, công nợ khách",
    soUser: 1,
    modules: ["Khách hàng sỉ", "Báo giá", "Đơn bán", "Công nợ KH"],
    mau: "from-emerald-500 to-teal-500",
    laCongNhan: false,
  },
  "content": {
    name: "Cẩm Vy",
    icon: "📸",
    desc: "Content, Media, thư viện hình ảnh, lịch đăng",
    soUser: 1,
    modules: ["Content - Media", "Thư viện ảnh", "Lịch đăng bài"],
    mau: "from-pink-500 to-rose-500",
    laCongNhan: false,
  },
  "kho": {
    name: "Nguyễn Quốc Hậu",
    icon: "📦",
    desc: "Kho, nhập-xuất, giao nhận, kiểm kê",
    soUser: 1,
    modules: ["Kho vải", "Kho phụ liệu", "Kho TP", "Nhập/Xuất/Tồn"],
    mau: "from-amber-500 to-orange-500",
    laCongNhan: false,
  },
  "cat": {
    name: "Nhóm Cắt",
    icon: "✂️",
    desc: "Lệnh cắt, nhận việc, sản lượng, lỗi, bàn giao",
    soUser: 3,
    modules: ["Lệnh cắt", "Nhận việc", "Nhập sản lượng", "Báo lỗi", "Bàn giao INTD"],
    mau: "from-sky-500 to-cyan-500",
    laCongNhan: true,
  },
  "khuy-nut": {
    name: "Nhóm Khuy nút",
    icon: "🪡",
    desc: "Nhận hàng, khuy nút, sản lượng, bàn giao ủi",
    soUser: 2,
    modules: ["Nhận hàng may", "Làm khuy", "Đính nút", "Bàn giao Ủi"],
    mau: "from-amber-500 to-yellow-500",
    laCongNhan: true,
  },
  "ui": {
    name: "Nhóm Ủi",
    icon: "👔",
    desc: "Nhận việc, ủi, sản lượng, lỗi, bàn giao",
    soUser: 4,
    modules: ["Nhận hàng KN", "Ủi áo/quần", "Sản lượng", "Bàn giao QC"],
    mau: "from-rose-500 to-pink-500",
    laCongNhan: true,
  },
  "dong-goi": {
    name: "Gấp xếp - Đóng gói",
    icon: "📦",
    desc: "Gấp xếp, đóng gói, tem size, bàn giao kho",
    soUser: 4,
    modules: ["Gấp xếp", "Đóng gói", "Tem size", "Bàn giao Kho TP"],
    mau: "from-violet-500 to-fuchsia-500",
    laCongNhan: true,
  },
};

// ============ HELPER ============
export function getUserByNhom(nhom: NhomGiaoDien): DemoUser[] {
  return DEMO_USERS_19.filter((u) => u.nhom === nhom);
}

export function getUserByEmail(email: string): DemoUser | undefined {
  return DEMO_USERS_19.find((u) => u.email === email);
}

export function getAllNhom(): NhomGiaoDien[] {
  return Object.keys(NHOM_GIAO_DIEN) as NhomGiaoDien[];
}

export function getNhomQuanLy(): NhomGiaoDien[] {
  return getAllNhom().filter((n) => !NHOM_GIAO_DIEN[n].laCongNhan);
}

export function getNhomCongNhan(): NhomGiaoDien[] {
  return getAllNhom().filter((n) => NHOM_GIAO_DIEN[n].laCongNhan);
}

// Đếm user mỗi nhóm
export function thongKeNhom(): Record<NhomGiaoDien, number> {
  const stats: any = {};
  getAllNhom().forEach((n) => {
    stats[n] = getUserByNhom(n).length;
  });
  return stats;
}
