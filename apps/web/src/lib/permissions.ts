// Permission Matrix cho MIMIN ERP
// 9 role × 30 module × 4 action (view/create/edit/delete)
// 2026-08-05: thêm 2 role content + partner (cho 44 user @mimin.vn)
// 2026-08-05: thêm 4 module gia-cong-mobile (trang-chu-gia-cong, cong-viec, san-luong, tien-cong)

export type Role = "admin" | "planner" | "warehouse" | "sewing" | "qc" | "finishing" | "accountant" | "content" | "partner" | "cutting" | "printing" | "buttoning" | "ironing" | "packaging";
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
  | "ai-tinh-gia"
  | "khach-hang-tiem-nang"
  | "so-do-chien-luoc"
  | "realtime"
  | "cai-dat"
  | "trang-chu-gia-cong"
  | "bang-dieu-hanh-sx"
  | "doi-soat-tien-cong"
  | "audit-log"
  | "phan-quyen-tuy-chinh"
  | "danh-muc-sp"
  // Modules gia cong mobile (cho NCC + cong nhan)
  | "cong-viec-gia-cong"
  | "ban-giao-gia-cong"
  | "san-luong-gia-cong"
  | "tien-cong-gia-cong"
  // Modules chi tiết sản xuất
  | "to-cat"
  | "to-in-theu"
  | "to-khuy-nut"
  | "to-ui"
  | "to-dong-goi";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Quản trị viên",
  planner: "Chuyên viên kế hoạch",
  warehouse: "Quản lý kho",
  sewing: "Tổ trưởng may",
  qc: "Kiểm tra chất lượng",
  finishing: "Tổ trưởng hoàn thiện",
  accountant: "Kế toán",
  content: "Content / Media",
  partner: "Đối tác gia công",
  cutting: "Tổ trưởng cắt",
  printing: "Tổ trưởng in thêu",
  buttoning: "Tổ trưởng khuy nút",
  ironing: "Tổ trưởng ủi",
  packaging: "Tổ trưởng đóng gói",
};

export const ROLE_COLORS: Record<Role, string> = {
  admin: "from-rose-500 to-pink-500",
  planner: "from-violet-500 to-purple-500",
  warehouse: "from-amber-500 to-orange-500",
  sewing: "from-sky-500 to-cyan-500",
  qc: "from-emerald-500 to-green-500",
  finishing: "from-fuchsia-500 to-pink-500",
  accountant: "from-blue-500 to-indigo-500",
  content: "from-pink-500 to-rose-500",
  partner: "from-purple-500 to-fuchsia-500",
  cutting: "from-red-500 to-orange-500",
  printing: "from-indigo-500 to-blue-500",
  buttoning: "from-teal-500 to-emerald-500",
  ironing: "from-orange-500 to-yellow-500",
  packaging: "from-stone-500 to-neutral-500",
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
  "ai-tinh-gia": "AI Tính Giá Vốn",
  "khach-hang-tiem-nang": "Khách Hàng Tiềm Năng",
  "so-do-chien-luoc": "Sơ Đồ Chiến Lược",
  "realtime": "Real-time Dashboard",
  "cai-dat": "Cài đặt",
  "trang-chu-gia-cong": "Trang chủ gia công",
  "bang-dieu-hanh-sx": "Bảng điều hành SX",
  "doi-soat-tien-cong": "Đối soát tiền công",
  "audit-log": "Audit log (lịch sử thao tác)",
  "phan-quyen-tuy-chinh": "Phân quyền tùy chỉnh",
  "danh-muc-sp": "Danh mục sản phẩm",
  "cong-viec-gia-cong": "Công việc gia công",
  "ban-giao-gia-cong": "Bàn giao gia công",
  "san-luong-gia-cong": "Sản lượng gia công",
  "tien-cong-gia-cong": "Tiền công gia công",
  "to-cat": "Tổ Cắt",
  "to-in-theu": "Tổ In/Thêu",
  "to-khuy-nut": "Tổ Khuy Nút",
  "to-ui": "Tổ Ủi",
  "to-dong-goi": "Tổ Đóng Gói",
};

// Permission Matrix: 7 role × 21 module × 4 action
// 'r' = view, 'c' = create, 'u' = edit (update), 'd' = delete
// Empty string = no access
const PERMISSIONS: Record<Role, Partial<Record<Module, string>>> = {
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
    "ai-tinh-gia": "rcud",
    "khach-hang-tiem-nang": "rcud",
    "so-do-chien-luoc": "rcud",
    "realtime": "rcud",
    "cai-dat": "rcud",
    "trang-chu-gia-cong": "rcud",
    "bang-dieu-hanh-sx": "rcud",
    "doi-soat-tien-cong": "rcud",
    "audit-log": "rcud",
    "phan-quyen-tuy-chinh": "rcud",
    "danh-muc-sp": "rcud",
    "cong-viec-gia-cong": "rcud",
    "ban-giao-gia-cong": "rcud",
    "san-luong-gia-cong": "rcud",
    "tien-cong-gia-cong": "rcud",
    "to-cat": "rcud",
    "to-in-theu": "rcud",
    "to-khuy-nut": "rcud",
    "to-ui": "rcud",
    "to-dong-goi": "rcud",
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
    "nha-cung-cap": "rcu",
    "gia-cong-ngoai": "rcu",
    "bao-cao": "r",
    "ai-tinh-gia": "r",
    "khach-hang-tiem-nang": "ru",
    "so-do-chien-luoc": "rcu",
    "realtime": "r",
    "cai-dat": "",
    "trang-chu-gia-cong": "r",
    "bang-dieu-hanh-sx": "rcu",
    "doi-soat-tien-cong": "r",
    "audit-log": "",
    "phan-quyen-tuy-chinh": "",
    "danh-muc-sp": "rcu",
    "cong-viec-gia-cong": "r",
    "ban-giao-gia-cong": "r",
    "san-luong-gia-cong": "r",
    "tien-cong-gia-cong": "r",
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
    "nha-cung-cap": "rcu",
    "gia-cong-ngoai": "r",
    "bao-cao": "r",
    "realtime": "r",
    "cai-dat": "",
    "trang-chu-gia-cong": "r",
    "bang-dieu-hanh-sx": "r",
    "doi-soat-tien-cong": "",
    "audit-log": "",
    "phan-quyen-tuy-chinh": "",
    "danh-muc-sp": "r",
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
    "audit-log": "",
    "phan-quyen-tuy-chinh": "",
    "danh-muc-sp": "r",
    "cong-viec-gia-cong": "rcu",
    "ban-giao-gia-cong": "rcu",
    "san-luong-gia-cong": "r",
    "tien-cong-gia-cong": "r",
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
    "audit-log": "",
    "phan-quyen-tuy-chinh": "",
    "danh-muc-sp": "r",
    "cong-viec-gia-cong": "r",
    "ban-giao-gia-cong": "r",
    "san-luong-gia-cong": "r",
    "tien-cong-gia-cong": "r",
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
    "audit-log": "",
    "phan-quyen-tuy-chinh": "",
    "danh-muc-sp": "r",
    "cong-viec-gia-cong": "rcu",
    "ban-giao-gia-cong": "rcu",
    "san-luong-gia-cong": "r",
    "tien-cong-gia-cong": "r",
  },
  // Các role sản xuất chi tiết mới thêm
  cutting: {
    "dashboard": "r",
    "lenh-cat": "r",
    "to-cat": "rcud",
  },
  printing: {
    "dashboard": "r",
    "lenh-cat": "r",
    "to-in-theu": "rcud",
  },
  buttoning: {
    "dashboard": "r",
    "lenh-cat": "r",
    "to-khuy-nut": "rcud",
  },
  ironing: {
    "dashboard": "r",
    "lenh-cat": "r",
    "to-ui": "rcud",
  },
  packaging: {
    "dashboard": "r",
    "lenh-cat": "r",
    "to-dong-goi": "rcud",
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
    "ai-tinh-gia": "r",
    "realtime": "r",
    "cai-dat": "",
    "trang-chu-gia-cong": "r",
    "bang-dieu-hanh-sx": "r",
    "doi-soat-tien-cong": "rcud",
    "audit-log": "",
    "phan-quyen-tuy-chinh": "",
    "danh-muc-sp": "r",
    "cong-viec-gia-cong": "r",
    "ban-giao-gia-cong": "r",
    "san-luong-gia-cong": "r",
    "tien-cong-gia-cong": "r",
  },
  // Content (Content / Media): CRUD danh mục SP, xem đơn hàng + sản xuất để chụp ảnh, báo cáo marketing
  content: {
    "dashboard": "r",
    "lenh-cat": "r",
    "khach-hang": "r",
    "ke-hoach-sx": "r",
    "nhan-su": "",
    "kho-vai": "",
    "kho-phu-lieu": "",
    "kho-thanh-pham": "r",
    "don-hang": "r",
    "cong-no-cong-doan": "",
    "kiem-tra-chat-luong": "",
    "to-may": "",
    "hoan-thien": "",
    "giao-hang": "",
    "cham-cong": "",
    "bang-luong": "",
    "nha-cung-cap": "r",
    "gia-cong-ngoai": "",
    "bao-cao": "r",
    "khach-hang-tiem-nang": "ru",
    "so-do-chien-luoc": "ru",
    "realtime": "",
    "cai-dat": "",
    "trang-chu-gia-cong": "",
    "bang-dieu-hanh-sx": "",
    "doi-soat-tien-cong": "",
    "audit-log": "",
    "phan-quyen-tuy-chinh": "",
    "danh-muc-sp": "rcud",
    "cong-viec-gia-cong": "",
    "ban-giao-gia-cong": "",
    "san-luong-gia-cong": "",
    "tien-cong-gia-cong": "",
  },
  // Partner (đối tác gia công may): CHỈ thấy phiếu giao cho mình - dùng cho 20 NCC
  partner: {
    "dashboard": "",
    "lenh-cat": "",
    "khach-hang": "",
    "ke-hoach-sx": "",
    "nhan-su": "",
    "kho-vai": "",
    "kho-phu-lieu": "",
    "kho-thanh-pham": "",
    "don-hang": "",
    "cong-no-cong-doan": "",
    "kiem-tra-chat-luong": "",
    "to-may": "",
    "hoan-thien": "",
    "giao-hang": "",
    "cham-cong": "",
    "bang-luong": "",
    "nha-cung-cap": "r",
    "gia-cong-ngoai": "ru",
    "bao-cao": "",
    "realtime": "",
    "cai-dat": "",
    "trang-chu-gia-cong": "rcud",
    "bang-dieu-hanh-sx": "",
    "doi-soat-tien-cong": "",
    "audit-log": "",
    "phan-quyen-tuy-chinh": "",
    "danh-muc-sp": "",
    "cong-viec-gia-cong": "rcu",
    "ban-giao-gia-cong": "rcu",
    "san-luong-gia-cong": "r",
    "tien-cong-gia-cong": "r",
  },
};

// ============================================
// CUSTOM PERMISSION MATRIX (admin có thể tùy chỉnh)
// Lưu localStorage - ưu tiên dùng khi có
// ============================================
const CUSTOM_MATRIX_KEY = "mimin_permission_matrix_v2";

/** Load matrix hiệu lực: ưu tiên localStorage (admin tùy chỉnh), fallback PERMISSIONS mặc định */
export function getEffectivePermissions(): Record<Role, Partial<Record<Module, string>>> {
  if (typeof window === "undefined") return PERMISSIONS;
  try {
    const raw = localStorage.getItem(CUSTOM_MATRIX_KEY);
    if (raw) {
      const custom = JSON.parse(raw) as Record<Role, Partial<Record<Module, string>>>;
      // Merge: ưu tiên custom nhưng fallback PERMISSIONS nếu thiếu key
      const merged: any = { ...PERMISSIONS };
      (Object.keys(PERMISSIONS) as Role[]).forEach((role) => {
        if (custom[role]) {
          merged[role] = { ...PERMISSIONS[role], ...custom[role] };
        }
      });
      return merged;
    }
  } catch {}
  return PERMISSIONS;
}

/** Lưu matrix tùy chỉnh vào localStorage */
export function saveCustomMatrix(matrix: Record<Role, Partial<Record<Module, string>>>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_MATRIX_KEY, JSON.stringify(matrix));
  } catch (err) {
    console.error("[permissions] Không lưu được custom matrix:", err);
  }
}

/** Reset về mặc định */
export function resetCustomMatrix(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CUSTOM_MATRIX_KEY);
}

export function can(role: Role | string | undefined, module: Module, action: Action): boolean {
  if (!role) return false;
  const matrix = getEffectivePermissions();
  const r = matrix[role as Role];
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
  const matrix = getEffectivePermissions();
  const r = matrix[role as Role];
  if (!r) return [];
  return (Object.keys(r) as Module[]).filter((m) => can(role, m, "view"));
}

export function getFullMatrix(): Record<Role, Partial<Record<Module, string>>> {
  return getEffectivePermissions();
}

export const ALL_ROLES: Role[] = [
  "admin", "planner", "warehouse", "sewing", "qc", "finishing", "accountant", "content", "partner",
  "cutting", "printing", "buttoning", "ironing", "packaging"
];

export const ALL_MODULES: Module[] = [
  "dashboard", "lenh-cat", "khach-hang", "ke-hoach-sx", "nhan-su",
  "kho-vai", "kho-phu-lieu", "kho-thanh-pham", "don-hang",
  "cong-no-cong-doan", "kiem-tra-chat-luong", "to-may", "hoan-thien",
  "giao-hang", "cham-cong", "bang-luong", "nha-cung-cap",
  "gia-cong-ngoai", "bao-cao", "ai-tinh-gia", "khach-hang-tiem-nang",
  "so-do-chien-luoc", "realtime", "cai-dat",
  "trang-chu-gia-cong", "bang-dieu-hanh-sx", "doi-soat-tien-cong",
  "audit-log", "phan-quyen-tuy-chinh", "danh-muc-sp",
  "cong-viec-gia-cong", "ban-giao-gia-cong", "san-luong-gia-cong", "tien-cong-gia-cong",
  "to-cat", "to-in-theu", "to-khuy-nut", "to-ui", "to-dong-goi"
];
