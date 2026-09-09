// USERS - Danh bß║í nh├ón vi├¬n C├öNG KHAI, an to├án ─æß╗â import tß╗½ client component.
// KH├öNG chß╗⌐a password/passwordHash - viß╗çc x├íc thß╗▒c mß║¡t khß║⌐u chß╗ë diß╗àn ra server-side
// qua /api/auth/login (xem lib/users.server.ts, ─æ╞░ß╗úc "server-only" guard bß║úo vß╗ç).
// Imported tß╗½ file Excel sß║┐p Sang ng├áy 2026-08-03: 1 admin + 17 user mß╗¢i (NV001-NV019 + NV020-NV027)
// CANONICAL: ─æß╗ïnh ngh─⌐a ModuleSX ß╗ƒ ─æ├óy (congnhan-13.ts re-export tß╗½ ─æ├óy)
export type ModuleSX = "cat" | "intd" | "may" | "khuy-nut" | "ui" | "dong-goi";
export const MODULE_SX_INFO: Record<ModuleSX, { name: string; icon: string; color: string }> = {
  "cat":      { name: "Cß║»t vß║úi",     icon: "Γ£é∩╕Å", color: "amber" },
  "intd":     { name: "In/Th├¬u/Dß║¡p", icon: "≡ƒÄ¿", color: "purple" },
  "may":      { name: "May",          icon: "≡ƒº╡", color: "blue" },
  "khuy-nut": { name: "Khuy n├║t",    icon: "≡ƒöÿ", color: "pink" },
  "ui":       { name: "ß╗ªi/─É├│ng g├│i", icon: "ΓÖ¿∩╕Å", color: "cyan" },
  "dong-goi": { name: "─É├│ng g├│i",    icon: "≡ƒôª", color: "emerald" },
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
  nhom: string;           // nh├│m giao diß╗çn
  laCongNhan: boolean;
  module?: ModuleSX;
  donGia?: number;
  donVi?: string;
  sdt?: string;
  isMock?: boolean;       // true = legacy mock
  // Audit fields (mß╗¢i)
  isActive?: boolean;     // c├│ thß╗â login kh├┤ng
  lastLogin?: string;     // ISO timestamp
  lastActiveAt?: string;  // ISO timestamp
  loginCount?: number;
}
// 18 user: 1 admin (sang) + 17 user tß╗½ Excel ΓÇö KH├öNG c├│ password, chß╗ë dß╗» liß╗çu hiß╗ân thß╗ï
export const USERS: UserAccount[] = [
  // ============ ADMIN ============
  {
    id: "sang", maNV: "NV035", email: "sang@mimin.vn",
    name: "Hß╗ô Minh Sang", role: "admin", chucVu: "Quß║ún trß╗ï hß╗ç thß╗æng",
    phongBan: "ban-giam-doc", nhom: "quan-tri", laCongNhan: false,
    sdt: "0774480916",
  },
  {
    id: "de", maNV: "NV007", email: "de7481039@gmail.com",
    name: "Phß║ím V─ân ─Éß╗ç", role: "sewing", chucVu: "cß║»t - ├üo trß╗Ñ: 1.400─æ, ├üo tr├▓n: 1.200─æ, Quß║ºn: 900─æ",
    phongBan: "to-may", nhom: "cat", laCongNhan: true, module: "cat",
    donGia: 1400, donVi: "c├íi", sdt: "0834033992",
  },
  {
    id: "phuong", maNV: "NV010", email: "vop61089@gmail.com",
    name: "V├ò THß╗è PH╞»ß╗£NG", role: "finishing", chucVu: "Gß║Ñp xß║┐p - Bß╗Ö Th╞░ß╗¥ng: 1.300─æ, ├üo Th╞░ß╗¥ng: 800─æ, Bß╗Ö Trß║»ng: 1.500─æ, ├üo Trß║»ng: 1.000─æ",
    phongBan: "to-may", nhom: "dong-goi", laCongNhan: true, module: "dong-goi",
    donGia: 1300, donVi: "c├íi", sdt: "0702501456",
  },
  {
    id: "vy", maNV: "NV004", email: "nvy967300@gmail.com",
    name: "NGUYß╗äN NGß╗îC Cß║¿M VY", role: "admin", chucVu: "Content - Media - L╞░╞íng CB: 8,000,000─æ",
    phongBan: "marketing", nhom: "content", laCongNhan: false, module: "cat",
    donGia: 0, donVi: "c├íi", sdt: "0779182053",
  },
  {
    id: "huyen", maNV: "NV003", email: "dohuyencpr81@gmail.com",
    name: "─Éß╗û THß╗è HUYß╗ÇN", role: "planner", chucVu: "QL Kh├ích h├áng Sß╗ë - L╞░╞íng CB: 7,000,000─æ",
    phongBan: "kinh-doanh", nhom: "ban-si", laCongNhan: false, module: "cat",
    donGia: 0, donVi: "c├íi", sdt: "0376327699",
  },
  {
    id: "thanh", maNV: "NV002", email: "buithanh151199@gmail.com",
    name: "B├ÖI THß╗è THANH", role: "accountant", chucVu: "Kß║┐ to├ín ─æiß╗üu phß╗æi SX - L╞░╞íng CB: 8,000,000─æ",
    phongBan: "ke-toan", nhom: "ke-toan", laCongNhan: false, module: "cat",
    donGia: 0, donVi: "c├íi", sdt: "0911546004",
  },
  {
    id: "be", maNV: "NV019", email: "beekhuong1505@gmail.com",
    name: "NGUYß╗äN THß╗è B├ë", role: "finishing", chucVu: "Gß║Ñp xß║┐p - Bß╗Ö Th╞░ß╗¥ng: 1.300─æ, ├üo Th╞░ß╗¥ng: 800─æ, Bß╗Ö Trß║»ng: 1.500─æ, ├üo Trß║»ng: 1.000─æ",
    phongBan: "to-may", nhom: "dong-goi", laCongNhan: true, module: "dong-goi",
    donGia: 1300, donVi: "c├íi", sdt: "0363073998",
  },
  {
    id: "hoa", maNV: "NV020", email: "xhoa14052004@gmail.com",
    name: "HUß╗▓NH XU├éN H├ÆA", role: "admin", chucVu: "Media - L╞░╞íng CB: 10,000,000─æ",
    phongBan: "marketing", nhom: "content", laCongNhan: false, module: "cat",
    donGia: 0, donVi: "c├íi", sdt: "0334536752",
  },
  {
    id: "duc1", maNV: "NV021", email: "nguyenminhduc199024@gmail.com",
    name: "NGUYß╗äN MINH ─Éß╗¿C", role: "finishing", chucVu: "ß╗ªi - ├üo trß╗Ñ: 800─æ, ├üo tr├▓n: 700─æ, Quß║ºn: 600─æ",
    phongBan: "to-may", nhom: "ui", laCongNhan: true, module: "ui",
    donGia: 800, donVi: "c├íi", sdt: "0365052474",
  },
  {
    id: "dinh", maNV: "NV023", email: "nan499229@gmail.com",
    name: "L├è ─Éß╗èNH", role: "finishing", chucVu: "ß╗ªi - ├üo trß╗Ñ: 800─æ, ├üo tr├▓n: 700─æ, Quß║ºn: 600─æ",
    phongBan: "to-may", nhom: "ui", laCongNhan: true, module: "ui",
    donGia: 800, donVi: "c├íi", sdt: "334047628",
  },
  {
    id: "vinh", maNV: "NV024", email: "duongvinh3102005@gmail.com",
    name: "D╞»╞áNG Tß║ñN V─¿NH", role: "sewing", chucVu: "Cß║»t - ├üo trß╗Ñ: 1.400─æ, ├üo tr├▓n: 1.200─æ, Quß║ºn: 900─æ",
    phongBan: "to-may", nhom: "cat", laCongNhan: true, module: "cat",
    donGia: 1400, donVi: "c├íi", sdt: "0392123831",
  },
  {
    id: "minh1", maNV: "NV025", email: "gs013@mimin-erp.local",
    name: "NGUYß╗äN QUß╗ÉC MINH", role: "sewing", chucVu: "Cß║»t - ├üo trß╗Ñ: 1.400─æ, ├üo tr├▓n: 1.200─æ, Quß║ºn: 900─æ",
    phongBan: "to-may", nhom: "cat", laCongNhan: true, module: "cat",
    donGia: 1400, donVi: "c├íi", sdt: "0332026731",
  },
  {
    id: "hau", maNV: "NV005", email: "beo26032019@gmail.com",
    name: "NGUYß╗äN QUß╗ÉC Hß║¼U", role: "warehouse", chucVu: "Nh├ón vi├¬n Kho - L╞░╞íng CB: 7,000,000─æ",
    phongBan: "kho", nhom: "kho", laCongNhan: false, module: "cat",
    donGia: 0, donVi: "c├íi", sdt: "0386231456",
  },
  {
    id: "phi", maNV: "NV027", email: "fizxnm2251994@mail.com",
    name: "L╞»╞áNG HO├ÇNG PHI", role: "admin", chucVu: "Media",
    phongBan: "marketing", nhom: "content", laCongNhan: false, module: "cat",
    donGia: 0, donVi: "c├íi", sdt: "0938625594",
  },
  {
    id: "ruong", maNV: "NV017", email: "nguyenvanruong14@gmail.com",
    name: "NGUYß╗äN V─éN RUß╗ÿNG", role: "sewing", chucVu: "Khuy n├║t - Chung: 750─æ",
    phongBan: "to-may", nhom: "khuy-nut", laCongNhan: true, module: "khuy-nut",
    donGia: 750, donVi: "c├íi", sdt: "0339724459",
  },
  // C├íc t├ái khoß║ún ß║úo/admin tr├¬n Supabase
  {
    id: "hung", maNV: "NV029", email: "hung@mimin.vn",
    name: "HÙNG", role: "admin", chucVu: "Quản trị viên",
    phongBan: "ban-giam-doc", nhom: "quan-tri", laCongNhan: false,
  },
  {
    id: "admin", maNV: "ADMIN", email: "admin@mimin.com",
    name: "Administrator", role: "admin", chucVu: "Administrator",
    phongBan: "ban-giam-doc", nhom: "quan-tri", laCongNhan: false,
  },
  {
    id: "gs018", maNV: "NV018", email: "gs018@mimin-erp.local",
    name: "MIMIN USER 18", role: "sewing", chucVu: "C├┤ng nh├ón",
    phongBan: "to-may", nhom: "cat", laCongNhan: true, module: "cat",
  },
  {
    id: "gs019", maNV: "NV019-2", email: "gs019@mimin-erp.local",
    name: "MIMIN USER 19", role: "sewing", chucVu: "C├┤ng nh├ón",
    phongBan: "to-may", nhom: "cat", laCongNhan: true, module: "cat",
  },
];
// ============ HELPER FUNCTIONS ============
// Backward-compat: filter c├┤ng nh├ón (nhom === 'cn' hoß║╖c laCongNhan === true)
export const CONG_NHAN_13: UserAccount[] = USERS.filter((u) => u.laCongNhan);
export function findUserByEmail(email: string): UserAccount | undefined {
  return USERS.find((u) => u.email === email);
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
  return USERS.filter((u) => !u.laCongNhan);
}
export const USER_STATS = {
  tong: USERS.length,
  quanLy: getQuanLy().length,
  congNhan: getCongNhan().length,
  mock: USERS.filter((u) => u.isMock).length,
  modules: 4, // cat, khuy-nut, ui, dong-goi
};
