// Quản lý tài khoản - Mở rộng từ DEMO_USERS
// Hỗ trợ CRUD + phân quyền theo Phòng ban + liên kết Nhân viên
// Mô hình chuẩn MIMIN OS: UserAccount → Phòng ban + Vai trò (1-n) + Data scope

import { USERS } from "./users";
import { logAudit } from "./audit-log";
import type { VaiTroChuan, DataScope } from "./vai-tro-chuan";

export type PhongBan =
  | "khac"
  | "ban-giam-doc"
  | "ke-toan"
  | "kho-soi"
  | "xuong-det"
  | "xuong-nhuom"
  | "kho-tp"
  | "qc"
  | "to-may"
  | "hoan-thien"
  | "giao-hang"
  | "mua-hang";

export const PHONG_BAN_LABELS: Record<PhongBan, string> = {
  "khac": "Khác / Chưa phân",
  "ban-giam-doc": "Ban giám đốc",
  "ke-toan": "Phòng kế toán",
  "kho-soi": "Kho sợi",
  "xuong-det": "Xưởng dệt",
  "xuong-nhuom": "Xưởng nhuộm",
  "kho-tp": "Kho vải TP",
  "qc": "Kiểm tra chất lượng",
  "to-may": "Tổ may",
  "hoan-thien": "Tổ hoàn thiện",
  "giao-hang": "Giao hàng",
  "mua-hang": "Phòng mua hàng",
};

export const PHONG_BAN_COLORS: Record<PhongBan, string> = {
  "khac": "bg-slate-500",
  "ban-giam-doc": "bg-rose-500",
  "ke-toan": "bg-blue-500",
  "kho-soi": "bg-indigo-500",
  "xuong-det": "bg-violet-500",
  "xuong-nhuom": "bg-purple-500",
  "kho-tp": "bg-emerald-500",
  "qc": "bg-green-500",
  "to-may": "bg-cyan-500",
  "hoan-thien": "bg-pink-500",
  "giao-hang": "bg-orange-500",
  "mua-hang": "bg-amber-500",
};

export interface UserAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "admin" | "planner" | "warehouse" | "sewing" | "qc" | "finishing" | "accountant";
  phongBan: PhongBan;
  // Mô hình chuẩn MIMIN OS (v83): một user có thể giữ nhiều vai trò
  vaiTroChuan?: VaiTroChuan[];   // 17 vai trò theo công đoạn
  dataScope?: DataScope;         // 6 cấp: SELF/TEAM/DEPT/PROD/COMPANY/PARTNER
  maNV?: string;
  chucVu: string;
  sdt?: string;
  trangThai: "active" | "disabled";
  ngayTao: string;
  nguoiTao?: string;
  lanDangNhapCuoi?: string;
}

// ============ DEFAULT ACCOUNTS ============
// Map từ 19 user nội bộ thật (USERS) sang UserAccount local (cho phân quyền settings)
const DEFAULT_ACCOUNTS: UserAccount[] = USERS.map((u, i) => {
  // Map role sang phòng ban mặc định
  const roleToPhongBan: Record<string, PhongBan> = {
    admin: "ban-giam-doc",
    planner: "mua-hang",
    warehouse: "kho-soi",
    sewing: "to-may",
    qc: "qc",
    finishing: "hoan-thien",
    accountant: "ke-toan",
  };
  return {
    id: `U${String(i + 1).padStart(3, "0")}`,
    email: u.email,
    // Không còn nguồn mật khẩu thật ở lib/users.ts (đã chuyển server-only) -
    // danh sách này chỉ phục vụ màn quản lý tài khoản legacy, không dùng để
    // xác thực đăng nhập thật (xem session-provider.tsx + /api/auth/login).
    password: "",
    name: u.name,
    role: u.role as any,
    phongBan: roleToPhongBan[u.role] || "khac",
    chucVu: u.chucVu,
    trangThai: "active",
    ngayTao: "2025-01-15",
    maNV: u.maNV || `NV${String(i + 1).padStart(3, "0")}`,
    sdt: u.sdt || `09${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`,
  };
});

const ACCOUNTS_KEY = "mimin_users_v3"; // v3: 2026-08-01 - reset, xoá 7 mock user cũ, chỉ giữ 19 user thật

// Danh sách email MOCK cũ cần xoá khi load (nếu còn trong localStorage)
const MOCK_EMAILS = [
  "admin@mimin.vn",
  "sewing@mimin.vn",
  "planner@mimin.vn",
  "qc@mimin.vn",
  "finishing@mimin.vn",
  "accountant@mimin.vn",
  "warehouse@mimin.vn",
];

function migrateStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return;
    const list: UserAccount[] = JSON.parse(raw);
    // Lọc bỏ user có email mock
    const filtered = list.filter((a) => !MOCK_EMAILS.includes(a.email.toLowerCase()));
    if (filtered.length !== list.length) {
      console.log(`[migrate] Xoá ${list.length - filtered.length} user mock cũ khỏi localStorage`);
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filtered));
    }
  } catch (err) {
    console.warn("[migrate] Lỗi migrate localStorage:", err);
  }
}

// Auto-migrate khi load module (chỉ chạy 1 lần)
if (typeof window !== "undefined") {
  migrateStorage();
}

function getStorage<T>(key: string, defaultData: T): T {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(key, JSON.stringify(defaultData));
  return defaultData;
}

function setStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ============ GETTERS / SETTERS ============
export function getAllAccounts(): UserAccount[] {
  return getStorage(ACCOUNTS_KEY, DEFAULT_ACCOUNTS);
}

export function getAccountById(id: string): UserAccount | undefined {
  return getAllAccounts().find((a) => a.id === id);
}

export function getAccountByEmail(email: string): UserAccount | undefined {
  return getAllAccounts().find((a) => a.email.toLowerCase() === email.toLowerCase());
}

export function saveAccounts(data: UserAccount[]): void {
  setStorage(ACCOUNTS_KEY, data);
}

// ============ CRUD ============
export function upsertAccount(acc: UserAccount, currentUser?: any): { ok: boolean; message: string; id?: string } {
  const list = getAllAccounts();
  const isNew = !list.find((a) => a.id === acc.id);

  if (isNew) {
    // Check email trùng
    if (list.find((a) => a.email.toLowerCase() === acc.email.toLowerCase())) {
      return { ok: false, message: "Email đã tồn tại trong hệ thống" };
    }
    // Tạo ID mới
    acc.id = `U${String(Date.now()).slice(-6)}`;
    acc.ngayTao = new Date().toISOString().slice(0, 10);
    acc.nguoiTao = currentUser?.name || "Admin";
    list.unshift(acc);
  } else {
    const idx = list.findIndex((a) => a.id === acc.id);
    if (idx >= 0) list[idx] = acc;
  }

  saveAccounts(list);

  logAudit({
    user: currentUser,
    action: isNew ? "create" : "update",
    module: "cai-dat",
    description: `${isNew ? "Tạo" : "Sửa"} tài khoản ${acc.email} (${acc.name}) - Role: ${acc.role}, Phòng ban: ${PHONG_BAN_LABELS[acc.phongBan]}`,
    resourceId: acc.id,
    success: true,
  });

  return { ok: true, message: isNew ? `✅ Đã tạo tài khoản ${acc.email}` : `✅ Đã cập nhật ${acc.email}`, id: acc.id };
}

export function deleteAccount(id: string, currentUser?: any): { ok: boolean; message: string } {
  const list = getAllAccounts();
  const acc = list.find((a) => a.id === id);
  if (!acc) return { ok: false, message: "Không tìm thấy tài khoản" };

  // Không cho xóa admin cuối cùng
  const admins = list.filter((a) => a.role === "admin" && a.trangThai === "active");
  if (acc.role === "admin" && admins.length <= 1) {
    return { ok: false, message: "Không thể xóa admin cuối cùng của hệ thống" };
  }

  saveAccounts(list.filter((a) => a.id !== id));

  logAudit({
    user: currentUser,
    action: "delete",
    module: "cai-dat",
    description: `Xóa tài khoản ${acc.email} (${acc.name})`,
    resourceId: id,
    success: true,
  });

  return { ok: true, message: `✅ Đã xóa tài khoản ${acc.email}` };
}

export function toggleAccountStatus(id: string, currentUser?: any): { ok: boolean; message: string } {
  const list = getAllAccounts();
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return { ok: false, message: "Không tìm thấy tài khoản" };

  const acc = list[idx];
  if (acc.role === "admin" && acc.trangThai === "active") {
    const activeAdmins = list.filter((a) => a.role === "admin" && a.trangThai === "active");
    if (activeAdmins.length <= 1) {
      return { ok: false, message: "Không thể khóa admin cuối cùng" };
    }
  }

  acc.trangThai = acc.trangThai === "active" ? "disabled" : "active";
  list[idx] = acc;
  saveAccounts(list);

  return {
    ok: true,
    message: acc.trangThai === "active" ? `✅ Đã mở khóa ${acc.email}` : `🔒 Đã khóa ${acc.email}`,
  };
}

export function resetPassword(id: string, newPassword: string, currentUser?: any): { ok: boolean; message: string } {
  const list = getAllAccounts();
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return { ok: false, message: "Không tìm thấy tài khoản" };

  list[idx].password = newPassword;
  saveAccounts(list);

  logAudit({
    user: currentUser,
    action: "update",
    module: "cai-dat",
    description: `Reset mật khẩu cho ${list[idx].email}`,
    resourceId: id,
    success: true,
  });

  return { ok: true, message: `✅ Đã reset mật khẩu cho ${list[idx].email}` };
}

// ============ THỐNG KÊ ============
export function thongKeAccounts(): {
  tong: number;
  active: number;
  disabled: number;
  theoPhongBan: { phongBan: PhongBan; count: number; ten: string; color: string }[];
  theoRole: { role: string; count: number; ten: string }[];
} {
  const all = getAllAccounts();
  const active = all.filter((a) => a.trangThai === "active").length;
  const disabled = all.filter((a) => a.trangThai === "disabled").length;

  // Nhóm theo phòng ban
  const byPhongBan: Record<string, number> = {};
  all.forEach((a) => {
    byPhongBan[a.phongBan] = (byPhongBan[a.phongBan] || 0) + 1;
  });
  const theoPhongBan = Object.entries(byPhongBan).map(([pb, count]) => ({
    phongBan: pb as PhongBan,
    count,
    ten: PHONG_BAN_LABELS[pb as PhongBan] || pb,
    color: PHONG_BAN_COLORS[pb as PhongBan] || "bg-slate-500",
  })).sort((a, b) => b.count - a.count);

  // Nhóm theo role
  const roleLabels: Record<string, string> = {
    admin: "Quản trị viên",
    planner: "CV kế hoạch",
    warehouse: "Quản lý kho",
    sewing: "Tổ trưởng may",
    qc: "Kiểm tra CL",
    finishing: "Tổ trưởng HT",
    accountant: "Kế toán",
  };
  const byRole: Record<string, number> = {};
  all.forEach((a) => { byRole[a.role] = (byRole[a.role] || 0) + 1; });
  const theoRole = Object.entries(byRole).map(([r, count]) => ({
    role: r,
    count,
    ten: roleLabels[r] || r,
  })).sort((a, b) => b.count - a.count);

  return { tong: all.length, active, disabled, theoPhongBan, theoRole };
}
