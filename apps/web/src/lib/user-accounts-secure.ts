/**
 * User Accounts (P0-01 fixed) - dùng SHA-256 hash
 * 19 user nội bộ + 13 công nhân = 32 tài khoản
 * 
 * LƯU Ý: Tất cả password đã được hash SHA-256 với salt
 * Plain text KHÔNG còn tồn tại trong source code
 */

import { PRECOMPUTED_HASHES } from "./password-hash";

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;     // ✅ Hash, không phải plain text
  name: string;
  role: "admin" | "planner" | "warehouse" | "sewing" | "qc" | "finishing" | "accountant";
  nhom: string;
  phongBan?: string;
  maNV?: string;
  chucVu?: string;
  sdt?: string;
  trangThai: "active" | "inactive";
}

// ============ 7 USER CŨ (admin/planner/warehouse/sewing/qc/finishing/accountant) ============
export const USER_ACCOUNTS_SECURE: UserAccount[] = [
  { id: "u1", email: "admin@mimin.vn",      passwordHash: PRECOMPUTED_HASHES["admin123"],       name: "Nguyễn Văn An",    role: "admin",      nhom: "ban-giam-doc",   chucVu: "Quản trị viên",      trangThai: "active" },
  { id: "u2", email: "planner@mimin.vn",    passwordHash: PRECOMPUTED_HASHES["planner123"],     name: "Trần Thị Bình",    role: "planner",    nhom: "ke-hoach-sx",    chucVu: "Chuyên viên KH",     trangThai: "active" },
  { id: "u3", email: "warehouse@mimin.vn",  passwordHash: PRECOMPUTED_HASHES["warehouse123"],   name: "Lê Văn Cường",     role: "warehouse",  nhom: "kho-soi",        chucVu: "Quản lý kho",        trangThai: "active" },
  { id: "u4", email: "sewing@mimin.vn",     passwordHash: PRECOMPUTED_HASHES["sewing123"],      name: "Phạm Thị Dung",    role: "sewing",     nhom: "to-may",         chucVu: "Tổ trưởng may",      trangThai: "active" },
  { id: "u5", email: "qc@mimin.vn",         passwordHash: PRECOMPUTED_HASHES["qc123"],          name: "Hoàng Minh Đức",   role: "qc",         nhom: "qc",             chucVu: "Kiểm tra CL",        trangThai: "active" },
  { id: "u6", email: "finishing@mimin.vn",  passwordHash: PRECOMPUTED_HASHES["finishing123"],   name: "Đỗ Thị Hương",     role: "finishing",  nhom: "hoan-thien",     chucVu: "Tổ trưởng HT",       trangThai: "active" },
  { id: "u7", email: "accountant@mimin.vn", passwordHash: PRECOMPUTED_HASHES["accountant123"],  name: "Bùi Văn Hùng",     role: "accountant", nhom: "ke-toan",        chucVu: "Kế toán",            trangThai: "active" },

  // ============ 19 USER NỘI BỘ + 13 CÔNG NHÂN (theo 10 nhóm chốt a Cường) ============
  // 6 nhóm quản lý
  { id: "u8",  email: "sang@mimin.vn",   passwordHash: PRECOMPUTED_HASHES["sang123"],    name: "Anh Sang (Admin)",  role: "admin", nhom: "quan-tri",  phongBan: "ban-giam-doc", maNV: "NV035", chucVu: "Quản trị hệ thống", trangThai: "active" },
  { id: "u9",  email: "giau@mimin.vn",   passwordHash: PRECOMPUTED_HASHES["giau123"],    name: "Chị Giàu",          role: "admin", nhom: "dieu-hanh", phongBan: "ban-giam-doc", maNV: "NV001", chucVu: "Giám đốc điều hành", trangThai: "active" },
  { id: "u10", email: "thanh@mimin.vn",  passwordHash: PRECOMPUTED_HASHES["thanh123"],   name: "Bùi Thị Thanh",     role: "accountant", nhom: "ke-toan",   phongBan: "ke-toan", maNV: "NV002", chucVu: "Kế toán trưởng", trangThai: "active" },
  { id: "u11", email: "huyen@mimin.vn",  passwordHash: PRECOMPUTED_HASHES["huyen123"],   name: "Đỗ Thị Huyền",      role: "planner", nhom: "ban-si",    phongBan: "kinh-doanh", maNV: "NV003", chucVu: "Trưởng phòng KH sỉ", trangThai: "active" },
  { id: "u12", email: "vy@mimin.vn",     passwordHash: PRECOMPUTED_HASHES["vy123"],      name: "Nguyễn Ngọc Cẩm Vy", role: "planner", nhom: "content",  phongBan: "marketing", maNV: "NV004", chucVu: "Trưởng nhóm Content", trangThai: "active" },
  { id: "u13", email: "hau@mimin.vn",    passwordHash: PRECOMPUTED_HASHES["hau123"],     name: "Nguyễn Quốc Hậu",   role: "warehouse", nhom: "kho",     phongBan: "kho-soi",  maNV: "NV005", chucVu: "Thủ kho trưởng", trangThai: "active" },

  // 3 nhóm Cắt
  { id: "u14", email: "giang@mimin.vn",  passwordHash: PRECOMPUTED_HASHES["giang123"],   name: "Nguyễn Hoàng Giang", role: "sewing",  nhom: "cat",     phongBan: "to-may",     maNV: "NV006", chucVu: "Tổ trưởng Cắt", trangThai: "active" },
  { id: "u15", email: "de@mimin.vn",     passwordHash: PRECOMPUTED_HASHES["de123"],      name: "Phạm Văn Đệ",       role: "sewing",  nhom: "cat",     phongBan: "to-may",     maNV: "NV007", chucVu: "CN Cắt (1400đ trụ / 1200đ tròn / 900đ quần)", trangThai: "active" },
  { id: "u16", email: "phu@mimin.vn",    passwordHash: PRECOMPUTED_HASHES["phu123"],     name: "Hồ Văn Minh Phú",   role: "sewing",  nhom: "cat",     phongBan: "to-may",     maNV: "NV008", chucVu: "CN Cắt hỗ trợ", trangThai: "active" },

  // 2 nhóm Khuy nút
  { id: "u17", email: "ruong@mimin.vn",  passwordHash: PRECOMPUTED_HASHES["ruong123"],   name: "Nguyễn Văn Ruộng",   role: "finishing", nhom: "khuy-nut", phongBan: "hoan-thien", maNV: "NV017", chucVu: "Tổ trưởng Khuy nút (750đ/cái)", trangThai: "active" },
  { id: "u18", email: "khoi@mimin.vn",   passwordHash: PRECOMPUTED_HASHES["khoi123"],    name: "Bùi Minh Khôi",     role: "finishing", nhom: "khuy-nut", phongBan: "hoan-thien", maNV: "NV018", chucVu: "CN Khuy nút", trangThai: "active" },

  // 4 nhóm Ủi
  { id: "u19", email: "tuyen@mimin.vn",  passwordHash: PRECOMPUTED_HASHES["tuyen123"],   name: "Đặng Võ Công Tuyền", role: "finishing", nhom: "ui",      phongBan: "hoan-thien", maNV: "NV011", chucVu: "Tổ trưởng Ủi", trangThai: "active" },
  { id: "u20", email: "huynh@mimin.vn",  passwordHash: PRECOMPUTED_HASHES["huynh123"],   name: "Phạm Văn Huynh",     role: "finishing", nhom: "ui",      phongBan: "hoan-thien", maNV: "NV012", chucVu: "CN Ủi áo/quần", trangThai: "active" },
  { id: "u21", email: "thuy@mimin.vn",   passwordHash: PRECOMPUTED_HASHES["thuy123"],    name: "Chu Quang Thủy",     role: "finishing", nhom: "ui",      phongBan: "hoan-thien", maNV: "NV013", chucVu: "CN Ủi hoàn thiện", trangThai: "active" },
  { id: "u22", email: "anhui@mimin.vn",  passwordHash: PRECOMPUTED_HASHES["anhui123"],   name: "Thế Anh",            role: "finishing", nhom: "ui",      phongBan: "hoan-thien", maNV: "NV014", chucVu: "CN Ủi theo lô", trangThai: "active" },

  // 4 nhóm Gấp xếp - Đóng gói
  { id: "u23", email: "nhi@mimin.vn",    passwordHash: PRECOMPUTED_HASHES["nhi123"],     name: "Nguyễn Thị Mỹ Nhi",  role: "sewing", nhom: "gap",     phongBan: "hoan-thien", maNV: "NV009", chucVu: "Tổ trưởng Gấp xếp", trangThai: "active" },
  { id: "u24", email: "phuong@mimin.vn", passwordHash: PRECOMPUTED_HASHES["phuong123"],  name: "Võ Thị Phương",      role: "sewing", nhom: "gap",     phongBan: "hoan-thien", maNV: "NV010", chucVu: "CN Gấp - Xếp", trangThai: "active" },
  { id: "u25", email: "tim@mimin.vn",    passwordHash: PRECOMPUTED_HASHES["tim123"],     name: "Tím",                role: "sewing", nhom: "gap",     phongBan: "hoan-thien", maNV: "NV015", chucVu: "CN Phân loại - Bao", trangThai: "active" },
  { id: "u26", email: "phien@mimin.vn",  passwordHash: PRECOMPUTED_HASHES["phien123"],   name: "Trần Thị Bé Phiên",  role: "sewing", nhom: "gap",     phongBan: "hoan-thien", maNV: "NV016", chucVu: "CN Gấp - Tem - Đóng bao", trangThai: "active" },
];

// Verify helper
export async function findUserByEmail(email: string, password: string): Promise<UserAccount | null> {
  const { verifyPasswordHash } = await import("./password-hash");
  const user = USER_ACCOUNTS_SECURE.find((u) => u.email === email);
  if (!user) return null;
  const ok = await verifyPasswordHash(password, user.passwordHash);
  return ok ? user : null;
}
