// SERVER-ONLY: nguồn dữ liệu đầy đủ cho luồng đăng nhập fallback.
// Chỉ dùng cho các tài khoản nội bộ chính thức của MIMIN.
import "server-only";
import type { ModuleSX, Role } from "./users";

export interface UserAccountFull {
  id: string;
  maNV: string;
  email: string;
  password: string;
  passwordHash?: string;
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

// 5 nhân sự chính thức của MIMIN + tài khoản admin dự phòng
export const USERS_FULL: UserAccountFull[] = [
  {
    id: "sang",
    maNV: "NV01",
    email: "sang@mimin.vn",
    password: "sang123",
    name: "Hồ Minh Sang",
    role: "admin",
    chucVu: "Giám Đốc",
    phongBan: "ban-giam-doc",
    nhom: "quan-tri",
    laCongNhan: false,
    sdt: "0774480916",
    isActive: true,
  },
  {
    id: "dinh",
    maNV: "NV02",
    email: "dinh@mimin.vn",
    password: "dinh123",
    name: "Lê Định",
    role: "warehouse",
    chucVu: "Nhân viên Kho",
    phongBan: "kho",
    nhom: "kho",
    laCongNhan: false,
    sdt: "0334047628",
    isActive: true,
  },
  {
    id: "khang",
    maNV: "NV03",
    email: "khang@mimin.vn",
    password: "khang123",
    name: "Nguyễn Triết Khang",
    role: "sewing",
    chucVu: "Nhân Viên Sản Xuất",
    phongBan: "to-may",
    nhom: "cat",
    laCongNhan: true,
    sdt: "0354370534",
    isActive: true,
  },
  {
    id: "phi",
    maNV: "NV04",
    email: "phi@mimin.vn",
    password: "phi123",
    name: "Lương Hoàng Phi",
    role: "admin",
    chucVu: "Quản Lý",
    phongBan: "ban-giam-doc",
    nhom: "quan-tri",
    laCongNhan: false,
    sdt: "0938625594",
    isActive: true,
  },
  {
    id: "hung",
    maNV: "NV05",
    email: "hung@mimin.vn",
    password: "hung123",
    name: "Trần Lương Hùng",
    role: "planner",
    chucVu: "Trưởng Phòng KD",
    phongBan: "kinh-doanh",
    nhom: "ban-si",
    laCongNhan: false,
    sdt: "0835228999",
    isActive: true,
  },
  {
    id: "admin",
    maNV: "ADMIN",
    email: "admin@mimin.com",
    password: "admin",
    name: "Administrator",
    role: "admin",
    chucVu: "Administrator",
    phongBan: "ban-giam-doc",
    nhom: "quan-tri",
    laCongNhan: false,
    isMock: true,
    isActive: true,
  },
];

export function findUserByEmailFull(email: string): UserAccountFull | undefined {
  return USERS_FULL.find((u) => u.email.toLowerCase() === email.toLowerCase());
}