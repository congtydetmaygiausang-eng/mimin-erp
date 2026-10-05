// USERS - Danh bạ nhân viên CÔNG KHAI, an toàn để import từ client component.
// Cập nhật: 2026-10-04 - Đồng bộ đúng 5 nhân sự hiện tại của MIMIN theo Supabase

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
  isActive?: boolean;     // có thể login không
  lastLogin?: string;     // ISO timestamp
  lastActiveAt?: string;  // ISO timestamp
  loginCount?: number;
}

// 5 nhân sự hiện tại của MIMIN + 1 admin preview
export const USERS: UserAccount[] = [
  {
    id: "sang",
    maNV: "NV01",
    email: "sang@mimin.vn",
    name: "Hồ Minh Sang",
    role: "admin",
    chucVu: "Giám Đốc",
    phongBan: "ban-giam-doc",
    nhom: "quan-tri",
    laCongNhan: false,
    sdt: "0774480916",
  },
  {
    id: "dinh",
    maNV: "NV02",
    email: "dinh@mimin.vn",
    name: "Lê Định",
    role: "warehouse",
    chucVu: "Nhân viên Kho",
    phongBan: "kho",
    nhom: "kho",
    laCongNhan: false,
    sdt: "0334047628",
  },
  {
    id: "khang",
    maNV: "NV03",
    email: "khang@mimin.vn",
    name: "Nguyễn Triết Khang",
    role: "sewing",
    chucVu: "Nhân Viên Sản Xuất",
    phongBan: "to-may",
    nhom: "cat",
    laCongNhan: true,
    sdt: "0354370534",
  },
  {
    id: "phi",
    maNV: "NV04",
    email: "phi@mimin.vn",
    name: "Lương Hoàng Phi",
    role: "admin",
    chucVu: "Quản Lý",
    phongBan: "ban-giam-doc",
    nhom: "quan-tri",
    laCongNhan: false,
    sdt: "0938625594",
  },
  {
    id: "hung",
    maNV: "NV05",
    email: "hung@mimin.vn",
    name: "Trần Lương Hùng",
    role: "planner",
    chucVu: "Trưởng Phòng KD",
    phongBan: "kinh-doanh",
    nhom: "ban-si",
    laCongNhan: false,
    sdt: "0835228999",
  },
  {
    id: "admin",
    maNV: "ADMIN",
    email: "admin@mimin.com",
    name: "Administrator",
    role: "admin",
    chucVu: "Administrator",
    phongBan: "ban-giam-doc",
    nhom: "quan-tri",
    laCongNhan: false,
    isMock: true,
  },
];

// ============ HELPER FUNCTIONS ============
export const CONG_NHAN_13: UserAccount[] = USERS.filter((u) => u.laCongNhan && !u.isMock);
export function findUserByEmail(email: string): UserAccount | undefined {
  return USERS.find((u) => u.email === email);
}
export function findUserByMaNV(maNV: string): UserAccount | undefined {
  return USERS.find((u) => u.maNV === maNV);
}
export function getUsersByNhom(nhom: string): UserAccount[] {
  return USERS.filter((u) => u.nhom === nhom && !u.isMock);
}
export function getUsersByModule(module: ModuleSX): UserAccount[] {
  return USERS.filter((u) => u.module === module && !u.isMock);
}
export function getCongNhan(): UserAccount[] {
  return USERS.filter((u) => u.laCongNhan && !u.isMock);
}
export function getQuanLy(): UserAccount[] {
  return USERS.filter((u) => !u.laCongNhan && !u.isMock);
}
export const USER_STATS = {
  tong: USERS.filter((u) => !u.isMock).length,
  quanLy: getQuanLy().length,
  congNhan: getCongNhan().length,
  mock: USERS.filter((u) => u.isMock).length,
  modules: 4,
};
