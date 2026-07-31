// Permission Matrix cho MIMIN ERP
// 7 role × 21 module × 4 action (view/create/edit/delete)

export type Role = "admin" | "planner" | "warehouse" | "sewing" | "qc" | "finishing" | "accountant";
export type Action = "view" | "create" | "edit" | "delete";

export type Module =
  | "dashboard"
  | "lenh-cat"
  | "khach-hang"
  | "ke-hoach-sx"
  | "nhan-su"
  | "kho-vai"
  | "kho-phu-lieu"
  | "kho-thanh-pham"
  | "don-hang"
  | "cong-no-cong-doan"
  | "kiem-tra-chat-luong"
  | "to-may"
  | "hoan-thien"
  | "giao-hang"
  | "cham-cong"
  | "bang-luong"
  | "nha-cung-cap"
  | "gia-cong-ngoai"
  | "bao-cao"
  | "realtime"
  | "cai-dat"
  | "trang-chu-gia-cong"
  | "bang-dieu-hanh-sx"
  | "doi-soat-tien-cong";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Quản trị viên",
  planner: "Chuyên viên kế hoạch",
  warehouse: "Quản lý kho",
  sewing: "Tổ trưởng may",
  qc: "Kiểm tra chất lượng",
  finishing: "Tổ trưởng hoàn thiện",
  accountant: "Kế toán",
};

export const ROLE_COLORS: Record<Role, string> = {
  admin: "from-rose-500 to-pink-500",
  planner: "from-violet-500 to-purple-500",
  warehouse: "from-amber-500 to-orange-500",
  sewing: "from-sky-500 to-cyan-500",
  qc: "from-emerald-500 to-green-500",
  finishing: "from-fuchsia-500 to-pink-500",
  accountant: "from-blue-500 to-indigo-500",
};

export const MODULE_LABELS: Record<Module, string> = {
  "dashboard": "Dashboard",
  "lenh-cat": "Lệnh cắt",
  "khach-hang": "Khách hàng",
  "ke-hoach-sx": "Kế hoạch SX",
  "nhan-su": "Nhân sự",
  "kho-vai": "Kho vải",
  "kho-phu-lieu": "Kho phụ liệu",
  "kho-thanh-pham": "Kho thành phẩm",
  "don-hang": "Đơn hàng",
  "cong-no-cong-doan": "Công nợ công đoạn",
  "kiem-tra-chat-luong": "Kiểm tra chất lượng",
  "to-may": "Tổ may",
  "hoan-thien": "Hoàn thiện",
  "giao-hang": "Giao hàng",
  "cham-cong": "Chấm công",
  "bang-luong": "Bảng lương",
  "nha-cung-cap": "Nhà cung cấp",
  "gia-cong-ngoai": "Gia công ngoài",
  "bao-cao": "Báo cáo",
  "realtime": "Real-time Dashboard",
  "cai-dat": "Cài đặt",
  "trang-chu-gia-cong": "Trang chủ gia công",
  "bang-dieu-hanh-sx": "Bảng điều hành SX",
  "doi-soat-tien-cong": "Đối soát tiền công",
};

// Permission Matrix: 7 role × 21 module × 4 action
// 'r' = view, 'c' = create, 'u' = edit (update), 'd' = delete
// Empty string = no access
const PERMISSIONS: Record<Role, Record<Module, string>> = {
  // Admin: toàn quyền tất cả
  admin: {
    "dashboard": "rcud",
    "lenh-cat": "rcud",
    "khach-hang": "rcud",
    "ke-hoach-sx": "rcud",
    "nhan-su": "rcud",
    "kho-vai": "rcud",
    "kho-phu-lieu": "rcud",
    "kho-thanh-pham": "rcud",
    "don-hang": "rcud",
    "cong-no-cong-doan": "rcud",
    "kiem-tra-chat-luong": "rcud",
    "to-may": "rcud",
    "hoan-thien": "rcud",
    "giao-hang": "rcud",
    "cham-cong": "rcud",
    "bang-luong": "rcud",
    "nha-cung-cap": "rcud",
    "gia-cong-ngoai": "rcud",
    "bao-cao": "rcud",
    "realtime": "rcud",
    "cai-dat": "rcud",
    "trang-chu-gia-cong": "rcud",
    "bang-dieu-hanh-sx": "rcud",
    "doi-soat-tien-cong": "rcud",
  },
  // Planner (chuyên viên kế hoạch): tạo lệnh cắt, KH, đơn hàng, KHSX. Xem các phần liên quan
  planner: {
    "dashboard": "r",
    "lenh-cat": "rcu",
    "khach-hang": "rcu",
    "ke-hoach-sx": "rcu",
    "nhan-su": "r",
    "kho-vai": "r",
    "kho-phu-lieu": "r",
    "kho-thanh-pham": "r",
    "don-hang": "rcu",
    "cong-no-cong-doan": "r",
    "kiem-tra-chat-luong": "r",
    "to-may": "r",
    "hoan-thien": "r",
    "giao-hang": "r",
    "cham-cong": "r",
    "bang-luong": "",
    "nha-cung-cap": "r",
    "gia-cong-ngoai": "r",
    "bao-cao": "r",
    "realtime": "r",
    "cai-dat": "",
    "trang-chu-gia-cong": "r",
    "bang-dieu-hanh-sx": "rcu",
    "doi-soat-tien-cong": "r",
  },
  // Warehouse (quản lý kho): CRUD kho, xem các phần liên quan
  warehouse: {
    "dashboard": "r",
    "lenh-cat": "r",
    "khach-hang": "",
    "ke-hoach-sx": "r",
    "nhan-su": "r",
    "kho-vai": "rcud",
    "kho-phu-lieu": "rcud",
    "kho-thanh-pham": "rcud",
    "don-hang": "r",
    "cong-no-cong-doan": "",
    "kiem-tra-chat-luong": "r",
    "to-may": "",
    "hoan-thien": "r",
    "giao-hang": "r",
    "cham-cong": "",
    "bang-luong": "",
    "nha-cung-cap": "ru",
    "gia-cong-ngoai": "r",
    "bao-cao": "r",
    "realtime": "r",
    "cai-dat": "",
    "trang-chu-gia-cong": "r",
    "bang-dieu-hanh-sx": "r",
    "doi-soat-tien-cong": "",
  },
  // Sewing (tổ trưởng may): quản lý tổ may, chấm công, xem lệnh cắt
  sewing: {
    "dashboard": "r",
    "lenh-cat": "ru",
    "khach-hang": "",
    "ke-hoach-sx": "r",
    "nhan-su": "r",
    "kho-vai": "r",
    "kho-phu-lieu": "r",
    "kho-thanh-pham": "r",
    "don-hang": "r",
    "cong-no-cong-doan": "r",
    "kiem-tra-chat-luong": "r",
    "to-may": "rcud",
    "hoan-thien": "r",
    "giao-hang": "",
    "cham-cong": "rcu",
    "bang-luong": "",
    "nha-cung-cap": "",
    "gia-cong-ngoai": "r",
    "bao-cao": "r",
    "realtime": "r",
    "cai-dat": "",
    "trang-chu-gia-cong": "rcu",
    "bang-dieu-hanh-sx": "r",
    "doi-soat-tien-cong": "r",
  },
  // QC (kiểm tra chất lượng): CRUD QC, xem các phần liên quan SX
  qc: {
    "dashboard": "r",
    "lenh-cat": "r",
    "khach-hang": "",
    "ke-hoach-sx": "r",
    "nhan-su": "r",
    "kho-vai": "r",
    "kho-phu-lieu": "r",
    "kho-thanh-pham": "r",
    "don-hang": "r",
    "cong-no-cong-doan": "",
    "kiem-tra-chat-luong": "rcud",
    "to-may": "r",
    "hoan-thien": "r",
    "giao-hang": "r",
    "cham-cong": "",
    "bang-luong": "",
    "nha-cung-cap": "",
    "gia-cong-ngoai": "r",
    "bao-cao": "r",
    "realtime": "r",
    "cai-dat": "",
    "trang-chu-gia-cong": "r",
    "bang-dieu-hanh-sx": "r",
    "doi-soat-tien-cong": "",
  },
  // Finishing (tổ trưởng hoàn thiện): CRUD hoàn thiện, giao hàng
  finishing: {
    "dashboard": "r",
    "lenh-cat": "r",
    "khach-hang": "",
    "ke-hoach-sx": "r",
    "nhan-su": "r",
    "kho-vai": "r",
    "kho-phu-lieu": "r",
    "kho-thanh-pham": "rcu",
    "don-hang": "r",
    "cong-no-cong-doan": "r",
    "kiem-tra-chat-luong": "r",
    "to-may": "r",
    "hoan-thien": "rcud",
    "giao-hang": "rcu",
    "cham-cong": "r",
    "bang-luong": "",
    "nha-cung-cap": "",
    "gia-cong-ngoai": "r",
    "bao-cao": "r",
    "realtime": "r",
    "cai-dat": "",
    "trang-chu-gia-cong": "rcu",
    "bang-dieu-hanh-sx": "r",
    "doi-soat-tien-cong": "r",
  },
  // Accountant (kế toán): CRUD bảng lương, công nợ, NCC, xem báo cáo
  accountant: {
    "dashboard": "r",
    "lenh-cat": "r",
    "khach-hang": "r",
    "ke-hoach-sx": "r",
    "nhan-su": "r",
    "kho-vai": "r",
    "kho-phu-lieu": "r",
    "kho-thanh-pham": "r",
    "don-hang": "r",
    "cong-no-cong-doan": "rcud",
    "kiem-tra-chat-luong": "r",
    "to-may": "",
    "hoan-thien": "r",
    "giao-hang": "r",
    "cham-cong": "r",
    "bang-luong": "rcud",
    "nha-cung-cap": "rcud",
    "gia-cong-ngoai": "ru",
    "bao-cao": "r",
    "realtime": "r",
    "cai-dat": "",
    "trang-chu-gia-cong": "r",
    "bang-dieu-hanh-sx": "r",
    "doi-soat-tien-cong": "rcud",
  },
};

export function can(role: Role | string | undefined, module: Module, action: Action): boolean {
  if (!role) return false;
  const r = PERMISSIONS[role as Role];
  if (!r) return false;
  const perms = r[module] || "";
  switch (action) {
    case "view": return perms.includes("r");
    case "create": return perms.includes("c");
    case "edit": return perms.includes("u");
    case "delete": return perms.includes("d");
    default: return false;
  }
}

export const canView = (role: Role | string | undefined, mod: Module) => can(role, mod, "view");
export const canCreate = (role: Role | string | undefined, mod: Module) => can(role, mod, "create");
export const canEdit = (role: Role | string | undefined, mod: Module) => can(role, mod, "edit");
export const canDelete = (role: Role | string | undefined, mod: Module) => can(role, mod, "delete");

export function getAccessibleModules(role: Role | string | undefined): Module[] {
  if (!role) return [];
  const r = PERMISSIONS[role as Role];
  if (!r) return [];
  return (Object.keys(r) as Module[]).filter((m) => can(role, m, "view"));
}

export function getFullMatrix(): Record<Role, Record<Module, string>> {
  return PERMISSIONS;
}

export const ALL_ROLES: Role[] = ["admin", "planner", "warehouse", "sewing", "qc", "finishing", "accountant"];
export const ALL_MODULES: Module[] = [
  "dashboard", "lenh-cat", "khach-hang", "ke-hoach-sx", "nhan-su",
  "kho-vai", "kho-phu-lieu", "kho-thanh-pham", "don-hang",
  "cong-no-cong-doan", "kiem-tra-chat-luong", "to-may", "hoan-thien",
  "giao-hang", "cham-cong", "bang-luong", "nha-cung-cap",
  "gia-cong-ngoai", "bao-cao", "realtime", "cai-dat"
];
