// USERS - Source of truth duy nhất cho toàn bộ hệ thống
// Bao gồm: 6 quản lý + 13 công nhân + 7 mock legacy = 26 user



// CANONICAL: định nghĩa ModuleSX ở đây (congnhan-13.ts re-export từ đây)
export type ModuleSX = "cat" | "intd" | "may" | "khuy-nut" | "ui" | "dong-goi";

export const MODULE_SX_INFO: Record<ModuleSX, { name: string; icon: string; color: string }> = {
  "cat":      { name: "Cắt vải",     icon: "✂️", color: "amber" },
  "intd":     { name: "In/Thêu/Dập", icon: "🎨", color: "purple" },
  "may":      { name: "May",          icon: "🧵", color: "blue" },
  "khuy-nut": { name: "Khuy nút",    icon: "🔘", color: "pink" },
  "ui":       { name: "Ủi/Đóng gói", icon: "♨️", color: "cyan" },
  "dong-goi": { name: "Đóng gói",    icon: "📦", color: "emerald" },
};

export type Role = "admin" | "planner" | "warehouse" | "sewing" | "qc" | "finishing" | "accountant";

export interface UserAccount {
  id: string;
  maNV: string;
  email: string;
  password: string;       // plain text - dùng cho login
  passwordHash?: string;  // SHA-256 - dùng cho verify
  name: string;
  role: Role;
  chucVu: string;
  phongBan: string;
  nhom: string;           // nhóm giao diện
  laCongNhan: boolean;
  module?: ModuleSX;
  donGia?: number;
  donVi?: string;
  sdt?: string;
  isMock?: boolean;       // true = legacy mock
  // Audit fields (mới)
  isActive?: boolean;     // có thể login không
  lastLogin?: string;     // ISO timestamp
  lastActiveAt?: string;  // ISO timestamp
  loginCount?: number;
}

// 19 user nội bộ (theo 10 nhóm) + 13 CN = unified 19 users với đầy đủ thông tin
export const USERS: UserAccount[] = [
  // ============ 6 NHÓM QUẢN LÝ ============
  {
    id: "sang", maNV: "NV035", email: "sang@mimin.vn", password: "sang123", passwordHash: "",
    name: "Hồ Minh Sang", role: "admin", chucVu: "Quản trị hệ thống",
    phongBan: "ban-giam-doc", nhom: "quan-tri", laCongNhan: false,
    sdt: "0901234567",
  },
  {
    id: "giau", maNV: "NV001", email: "giau@mimin.vn", password: "giau123", passwordHash: "",
    name: "Nguyễn Thị Ngọc Giàu", role: "admin", chucVu: "GĐ điều hành",
    phongBan: "ban-giam-doc", nhom: "dieu-hanh", laCongNhan: false,
    sdt: "0912345678",
  },
  {
    id: "thanh", maNV: "NV002", email: "thanh@mimin.vn", password: "thanh123", passwordHash: "",
    name: "Bùi Thị Thanh", role: "accountant", chucVu: "Kế toán trưởng + Điều phối SX",
    phongBan: "ke-toan", nhom: "ke-toan", laCongNhan: false,
    sdt: "0923456789",
  },
  {
    id: "huyen", maNV: "NV003", email: "huyen@mimin.vn", password: "huyen123", passwordHash: "",
    name: "Đỗ Thị Huyền", role: "planner", chucVu: "Trưởng phòng KH sỉ",
    phongBan: "kinh-doanh", nhom: "ban-si", laCongNhan: false,
    sdt: "0934567890",
  },
  {
    id: "vy", maNV: "NV004", email: "vy@mimin.vn", password: "vy123", passwordHash: "",
    name: "Nguyễn Ngọc Cẩm Vy", role: "admin", chucVu: "Trưởng nhóm Content - Media",
    phongBan: "marketing", nhom: "content", laCongNhan: false,
    sdt: "0945678901",
  },
  {
    id: "hau", maNV: "NV005", email: "hau@mimin.vn", password: "hau123", passwordHash: "",
    name: "Nguyễn Quốc Hậu", role: "warehouse", chucVu: "Thủ kho trưởng",
    phongBan: "kho", nhom: "kho", laCongNhan: false,
    sdt: "0956789012",
  },
  // ============ NHÓM CẮT (3 CN) ============
  {
    id: "giang", maNV: "NV006", email: "giang@mimin.vn", password: "giang123", passwordHash: "",
    name: "Nguyễn Hoàng Giang", role: "sewing", chucVu: "Tổ trưởng Cắt",
    phongBan: "to-may", nhom: "cat", laCongNhan: true, module: "cat",
    donGia: 1200, donVi: "cái", sdt: "0966789012",
  },
  {
    id: "de", maNV: "NV007", email: "de@mimin.vn", password: "de123", passwordHash: "",
    name: "Phạm Văn Đệ", role: "sewing", chucVu: "CN Cắt (1400đ/1200đ/900đ)",
    phongBan: "to-may", nhom: "cat", laCongNhan: true, module: "cat",
    donGia: 1200, donVi: "cái", sdt: "0977890123",
  },
  {
    id: "phu", maNV: "NV008", email: "phu@mimin.vn", password: "phu123", passwordHash: "",
    name: "Hồ Văn Minh Phú", role: "sewing", chucVu: "CN Cắt hỗ trợ",
    phongBan: "to-may", nhom: "cat", laCongNhan: true, module: "cat",
    donGia: 1200, donVi: "cái", sdt: "0988901234",
  },
  // ============ NHÓM ĐÓNG GÓI (4 CN) - đổi từ "gap" → "dong-goi" ============
  {
    id: "nhi", maNV: "NV009", email: "nhi@mimin.vn", password: "nhi123", passwordHash: "",
    name: "Nguyễn Thị Mỹ Nhi", role: "sewing", chucVu: "Tổ trưởng Gấp xếp",
    phongBan: "hoan-thien", nhom: "dong-goi", laCongNhan: true, module: "dong-goi",
    donGia: 800, donVi: "cái", sdt: "0999012345",
  },
  {
    id: "phuong", maNV: "NV010", email: "phuong@mimin.vn", password: "phuong123", passwordHash: "",
    name: "Võ Thị Phương", role: "sewing", chucVu: "CN Gấp - Xếp",
    phongBan: "hoan-thien", nhom: "dong-goi", laCongNhan: true, module: "dong-goi",
    donGia: 800, donVi: "cái", sdt: "0990123456",
  },
  // ============ NHÓM ỦI (4 CN) ============
  {
    id: "tuyen", maNV: "NV011", email: "tuyen@mimin.vn", password: "tuyen123", passwordHash: "",
    name: "Đặng Võ Công Tuyền", role: "finishing", chucVu: "Tổ trưởng Ủi",
    phongBan: "hoan-thien", nhom: "ui", laCongNhan: true, module: "ui",
    donGia: 2000, donVi: "sp", sdt: "0912234567",
  },
  {
    id: "huynh", maNV: "NV012", email: "huynh@mimin.vn", password: "huynh123", passwordHash: "",
    name: "Phạm Văn Huynh", role: "finishing", chucVu: "CN Ủi áo/quần",
    phongBan: "hoan-thien", nhom: "ui", laCongNhan: true, module: "ui",
    donGia: 2000, donVi: "sp", sdt: "0923345678",
  },
  {
    id: "thuy", maNV: "NV013", email: "thuy@mimin.vn", password: "thuy123", passwordHash: "",
    name: "Chu Quang Thủy", role: "finishing", chucVu: "CN Ủi hoàn thiện",
    phongBan: "hoan-thien", nhom: "ui", laCongNhan: true, module: "ui",
    donGia: 2000, donVi: "sp", sdt: "0934456789",
  },
  {
    id: "anhui", maNV: "NV014", email: "anhui@mimin.vn", password: "anhui123", passwordHash: "",
    name: "Thế Anh", role: "finishing", chucVu: "CN Ủi theo lô",
    phongBan: "hoan-thien", nhom: "ui", laCongNhan: true, module: "ui",
    donGia: 2000, donVi: "sp", sdt: "0945567890",
  },
  // ============ NHÓM ĐÓNG GÓI (cont.) ============
  {
    id: "tim", maNV: "NV015", email: "tim@mimin.vn", password: "tim123", passwordHash: "",
    name: "Tím", role: "sewing", chucVu: "CN Phân loại - Bao",
    phongBan: "hoan-thien", nhom: "dong-goi", laCongNhan: true, module: "dong-goi",
    donGia: 800, donVi: "cái", sdt: "0956678901",
  },
  {
    id: "phien", maNV: "NV016", email: "phien@mimin.vn", password: "phien123", passwordHash: "",
    name: "Trần Thị Bé Phiên", role: "sewing", chucVu: "CN Gấp - Tem - Đóng bao",
    phongBan: "hoan-thien", nhom: "dong-goi", laCongNhan: true, module: "dong-goi",
    donGia: 800, donVi: "cái", sdt: "0967789012",
  },
  // ============ NHÓM KHUY NÚT (2 CN) ============
  {
    id: "ruong", maNV: "NV017", email: "ruong@mimin.vn", password: "ruong123", passwordHash: "",
    name: "Nguyễn Văn Ruộng", role: "finishing", chucVu: "Tổ trưởng Khuy nút (750đ/cái)",
    phongBan: "hoan-thien", nhom: "khuy-nut", laCongNhan: true, module: "khuy-nut",
    donGia: 750, donVi: "cái", sdt: "0978890123",
  },
  {
    id: "khoi", maNV: "NV018", email: "khoi@mimin.vn", password: "khoi123", passwordHash: "",
    name: "Bùi Minh Khôi", role: "finishing", chucVu: "CN Khuy nút hỗ trợ",
    phongBan: "hoan-thien", nhom: "khuy-nut", laCongNhan: true, module: "khuy-nut",
    donGia: 750, donVi: "cái", sdt: "0989901234",
  },
  // ============ 7 MOCK LEGACY ============
  { id: "admin", maNV: "MOCK-1", email: "admin@mimin.vn", password: "admin123", name: "Admin", role: "admin", chucVu: "Quản trị viên", phongBan: "it", nhom: "mock", laCongNhan: false, isMock: true },
  { id: "planner", maNV: "MOCK-2", email: "planner@mimin.vn", password: "planner123", name: "Planner", role: "planner", chucVu: "Chuyên viên kế hoạch", phongBan: "ke-hoach", nhom: "mock", laCongNhan: false, isMock: true },
  { id: "warehouse", maNV: "MOCK-3", email: "warehouse@mimin.vn", password: "warehouse123", name: "Warehouse", role: "warehouse", chucVu: "Quản lý kho", phongBan: "kho", nhom: "mock", laCongNhan: false, isMock: true },
  { id: "sewing", maNV: "MOCK-4", email: "sewing@mimin.vn", password: "sewing123", name: "Sewing", role: "sewing", chucVu: "Tổ trưởng may", phongBan: "to-may", nhom: "mock", laCongNhan: false, isMock: true },
  { id: "qc", maNV: "MOCK-5", email: "qc@mimin.vn", password: "qc123", name: "QC", role: "qc", chucVu: "Kiểm tra chất lượng", phongBan: "qc", nhom: "mock", laCongNhan: false, isMock: true },
  { id: "finishing", maNV: "MOCK-6", email: "finishing@mimin.vn", password: "finishing123", name: "Finishing", role: "finishing", chucVu: "Tổ trưởng hoàn thiện", phongBan: "hoan-thien", nhom: "mock", laCongNhan: false, isMock: true },
  { id: "accountant", maNV: "MOCK-7", email: "accountant@mimin.vn", password: "accountant123", name: "Accountant", role: "accountant", chucVu: "Kế toán", phongBan: "ke-toan", nhom: "mock", laCongNhan: false, isMock: true },
];

// Công nhân (13 người) - lọc từ USERS
export const CONG_NHAN_13: UserAccount[] = USERS.filter((u) => u.nhom === "cn");

// Helpers
export function findUserByEmail(email: string): UserAccount | undefined {
  return USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserByMaNV(maNV: string): UserAccount | undefined {
  return USERS.find((u) => u.maNV === maNV);
}

export function getUsersByNhom(nhom: string): UserAccount[] {
  return USERS.filter((u) => u.nhom === nhom);
}

export function getUsersByModule(module: ModuleSX): UserAccount[] {
  return USERS.filter((u) => u.module === module);
}

export function getCongNhan(): UserAccount[] {
  return USERS.filter((u) => u.laCongNhan);
}

export function getQuanLy(): UserAccount[] {
  return USERS.filter((u) => !u.laCongNhan && !u.isMock);
}

export const USER_STATS = {
  total: USERS.length,
  quanLy: getQuanLy().length,
  congNhan: getCongNhan().length,
  mock: USERS.filter((u) => u.isMock).length,
  modules: 4, // cat, khuy-nut, ui, dong-goi
};
