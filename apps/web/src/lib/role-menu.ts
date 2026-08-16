// ============ ROLE-BASED MENU CONFIG — MIMIN ERP v89.6.8 (Đợt 1) ============
// Thay thế hard-code 30+ nav items trong Sidebar.tsx
// Mỗi item khai báo allowedRoles (VaiTroChuan[]) — undefined = "all"
//
// Dùng kèm permission-matrix.ts để filter theo vai trò

import type { VaiTroChuan } from "./vai-tro-chuan";
import type { Scope } from "./permission-matrix";
import {
  LayoutDashboard, Scissors, Users, Calendar, Package, ShoppingCart, ShieldCheck,
  Shirt, Boxes, Truck, FileText, BarChart3, ClipboardList, Wallet, Settings, Bell,
  Building2, Hammer, Wallet2, Activity, Grid3x3, Link2, Sparkles, ScanLine,
  Factory, Palette, Database, LogIn, RefreshCw, Lock, CheckCircle2,
  Briefcase, Send,
  type LucideIcon,
} from "lucide-react";

export type IconName =
  | "LayoutDashboard" | "Scissors" | "Users" | "Calendar" | "Package" | "ShoppingCart"
  | "ShieldCheck" | "Shirt" | "Boxes" | "Truck" | "FileText" | "BarChart3"
  | "ClipboardList" | "Wallet" | "Settings" | "Bell" | "Building2" | "Hammer"
  | "Wallet2" | "Activity" | "Grid3x3" | "Link2" | "Sparkles" | "ScanLine"
  | "Factory" | "Palette" | "Database" | "LogIn" | "RefreshCw" | "Lock" | "CheckCircle2"
  | "Briefcase" | "Send";

export const ICON_MAP: Record<IconName, LucideIcon> = {
  LayoutDashboard, Scissors, Users, Calendar, Package, ShoppingCart,
  ShieldCheck, Shirt, Boxes, Truck, FileText, BarChart3,
  ClipboardList, Wallet, Settings, Bell, Building2, Hammer,
  Wallet2, Activity, Grid3x3, Link2, Sparkles, ScanLine,
  Factory, Palette, Database, LogIn, RefreshCw, Lock, CheckCircle2,
  Briefcase, Send,
};

export type SubMenuItem = {
  href: string;
  label: string;
  iconName: IconName;
  /** Nếu khai báo: chỉ role trong list mới thấy */
  allowedRoles?: VaiTroChuan[];
};

export type MenuItem = {
  href?: string;
  label: string;
  iconName: IconName;
  /** Module tương ứng (để check permission từ permission-matrix.ts) */
  module?: import("./permission-matrix").Module;
  /** Nếu khai báo: chỉ role trong list mới thấy */
  allowedRoles?: VaiTroChuan[];
  /** Data scope gợi ý cho route này */
  dataScope?: Scope;
  /** Group menu cha (Lark, Lark, Cài đặt) */
  isGroup?: boolean;
  subItems?: SubMenuItem[];
};

// ============ 30+ MENU ITEMS (giữ nguyên từ Sidebar.tsx cũ) ============

export const MENU_ITEMS: MenuItem[] = [
  // === Core ===
  { href: "/dashboard", label: "Dashboard", iconName: "LayoutDashboard", module: "dashboard" },

  // === Sản xuất ===
  { href: "/lenh-cat", label: "Lệnh cắt", iconName: "Scissors", module: "lenh-cat" },
  { href: "/khach-hang", label: "Khách hàng", iconName: "Users", module: "khach-hang" },
  { href: "/ke-hoach-san-xuat", label: "Kế hoạch SX", iconName: "Calendar", module: "ke-hoach-sx" },
  { href: "/nhan-su", label: "Nhân sự", iconName: "Users", module: "nhan-su" },
  {
    href: "/master-data", label: "📋 Master Data (NCC/KH/Xưởng)", iconName: "Building2", module: "nha-cung-cap",
  },
  {
    href: "/lsx-m758-demo", label: "📦 LSX M758 (Demo workflow)", iconName: "Package", module: "ke-hoach-sx",
  },

  // === Kho ===
  { href: "/kho-vai-tinhmann", label: "Kho vải", iconName: "Package", module: "kho-vai" },
  { href: "/kho-phu-lieu", label: "Kho phụ liệu", iconName: "Boxes", module: "kho-phu-lieu" },
  { href: "/kho-thanh-pham", label: "Kho thành phẩm", iconName: "Boxes", module: "kho-thanh-pham" },

  // === Bán hàng ===
  { href: "/don-hang", label: "Đơn hàng", iconName: "ShoppingCart", module: "don-hang" },
  { href: "/cong-no", label: "Công nợ công đoạn", iconName: "Wallet2", module: "cong-no-cong-doan" },
  { href: "/qc", label: "Kiểm tra chất lượng", iconName: "ShieldCheck", module: "kiem-tra-chat-luong" },
  { href: "/may", label: "Tổ may", iconName: "Shirt", module: "to-may" },
  { href: "/hoan-thien", label: "Hoàn thiện", iconName: "ClipboardList", module: "hoan-thien" },
  { href: "/giao-hang", label: "Giao hàng", iconName: "Truck", module: "giao-hang" },

  // === Nhân sự & Kho ===
  { href: "/cham-cong", label: "Chấm công", iconName: "Calendar", module: "cham-cong" },
  { href: "/bang-luong", label: "Bảng lương", iconName: "Wallet", module: "bang-luong" },
  { href: "/nha-cung-cap", label: "Nhà cung cấp", iconName: "Building2", module: "nha-cung-cap" },
  // Gia công ngoài (legacy) removed as requested

  // === Báo cáo ===
  { href: "/bao-cao", label: "Báo cáo", iconName: "FileText", module: "bao-cao" },
  { href: "/ai-tinh-gia", label: "✨ AI Tính Giá Vốn", iconName: "Sparkles", module: "ai-tinh-gia" },
  { href: "/khach-hang-tiem-nang", label: "✨ Khách Hàng Tiềm Năng", iconName: "Users", module: "khach-hang-tiem-nang" },
  { href: "/realtime", label: "Real-time Dashboard", iconName: "BarChart3", module: "realtime" },
  { href: "/audit-log", label: "Audit Log", iconName: "Activity", module: "cai-dat", allowedRoles: ["GIAM_DOC", "QUAN_TRI_HE_THONG", "KE_TOAN"] },
  { href: "/workflow", label: "Workflow Công đoạn", iconName: "Scissors", module: "lenh-cat" },
  { href: "/tong-hop-cong-doan", label: "Tổng hợp công đoạn", iconName: "Grid3x3", module: "bao-cao" },
  { href: "/so-do-chien-luoc", label: "🗺️ Sơ đồ chiến lược", iconName: "Palette", module: "so-do-chien-luoc" },

  // === Kho + Sợi/Dệt ===
  { href: "/so-det-nhuom", label: "Sợi - Dệt - Nhuộm", iconName: "Factory", module: "kho-vai" },
  { href: "/mini-soi-det", label: "Mini: Sợi & Dệt", iconName: "ScanLine", module: "kho-vai" },
  { href: "/kho-soi-day-chuyen", label: "Kho sợi - Chuẩn ERP", iconName: "Boxes", module: "kho-vai" },
  { href: "/soi-det-nhuom-erp", label: "Sợi-Dệt-Nhuộm ERP", iconName: "Factory", module: "kho-vai" },
  { href: "/role-workspaces", label: "Workspaces theo Role", iconName: "Users", module: "nhan-su" },
  { href: "/flow-tong-quan", label: "Flow Tổng Quan (Timeline)", iconName: "Activity", module: "kho-vai" },
  { href: "/det-nhuom-flow", label: "Dệt-Nhuộm Flow 11 MH", iconName: "Factory", module: "kho-vai" },
  { href: "/lenh-tong", label: "⭐ Lệnh Dệt-Nhuộm TỔNG", iconName: "Sparkles", module: "ke-hoach-sx" },
  { href: "/san-xuat-erp", label: "🏭 Sản Xuất ERP (Tổng hợp)", iconName: "Factory", module: "ke-hoach-sx" },

  // === Phân quyền ===
  { href: "/phan-quen-cua-toi", label: "🛡️ Phân quyền của tôi", iconName: "ShieldCheck", module: "cai-dat" },

  // === BỘ 2: QUẢN LÝ SẢN XUẤT (Đợt 3 - QLSX dashboard) ===
  { href: "/bang-dieu-hanh-sx", label: "🏭 Bảng điều hành SX", iconName: "Factory", module: "ke-hoach-sx", allowedRoles: ["DIEU_PHOI_SX", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/quan-ly-tai-khoan", label: "👤 Quản lý tài khoản", iconName: "Users", module: "cai-dat", allowedRoles: ["GIAM_DOC", "QUAN_TRI_HE_THONG"] },

  // === Cài đặt nâng cao (chỉ Admin) ===
  { href: "/test-phan-quyen", label: "🧪 Test nhanh 32 User", iconName: "ShieldCheck", module: "cai-dat", allowedRoles: ["GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/seed-data", label: "🌱 Seed Data (1 click)", iconName: "Database", module: "cai-dat", allowedRoles: ["GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/test-kiem-thu", label: "🧪 Test 54 modules", iconName: "CheckCircle2", module: "cai-dat", allowedRoles: ["GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/backup-restore", label: "💾 Backup & Restore", iconName: "Database", module: "cai-dat", allowedRoles: ["GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/supabase-status", label: "☁️ Supabase Status", iconName: "Database", module: "cai-dat", allowedRoles: ["GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/bang-luong-auto", label: "💰 Bảng lương tự động", iconName: "Wallet", module: "bang-luong" },
  { href: "/canh-bao", label: "🔔 Cảnh báo real-time", iconName: "Bell", module: "bao-cao" },
  { href: "/kien-truc-phan-quyen", label: "🏗️ Kiến trúc phân quyền", iconName: "ShieldCheck", module: "cai-dat", allowedRoles: ["GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/mohinh-phan-quyen-chuan", label: "🎯 Mô hình chuẩn MIMIN OS", iconName: "Palette", module: "cai-dat", allowedRoles: ["GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/doi-tac-gia-cong", label: "🤝 Đối tác gia công (35)", iconName: "Users", module: "nha-cung-cap" },

  // === Lark group (Lark integrations) ===
  {
    label: "Lark (Tích hợp)", iconName: "Link2", module: "cai-dat", allowedRoles: ["GIAM_DOC", "QUAN_TRI_HE_THONG", "DIEU_PHOI_SX"],
    isGroup: true, subItems: [
      { href: "/lark-settings", label: "Kết nối Lark", iconName: "Settings" },
      { href: "/lark-login", label: "Lark Login (OAuth)", iconName: "LogIn" },
      { href: "/lark-base-manager", label: "Lark Base Manager", iconName: "Database" },
      { href: "/lark-auto-setup", label: "Lark Auto Setup", iconName: "Sparkles" },
      { href: "/lark-sync-engine", label: "Lark Sync Engine", iconName: "Activity" },
      { href: "/lark-sync-overview", label: "Lark Sync Overview", iconName: "RefreshCw" },
      { href: "/lark-sheet-import", label: "Lark Sheet Import", iconName: "FileText" },
      { href: "/test-real-data", label: "Test Data Thật", iconName: "Database" },
    ],
  },

  { href: "/cai-dat", label: "Cài đặt", iconName: "Settings", module: "cai-dat" },
  { href: "/profile", label: "Hồ sơ cá nhân", iconName: "Users", module: "dashboard" },

  // === BỘ 5: NGƯỜI GIA CÔNG (Đợt 2 - mobile-first) ===
  // Hiển thị cho mọi vai trò - filter theo user thật (maNV) ở mỗi page
  { href: "/trang-chu-gia-cong", label: "🏠 Trang chủ gia công", iconName: "LayoutDashboard", module: "lenh-cat" },
  { href: "/cong-viec", label: "📋 Công việc của tôi", iconName: "Briefcase", module: "lenh-cat" },
  { href: "/ban-giao", label: "🤝 Bàn giao", iconName: "Send", module: "lenh-cat" },
  { href: "/san-luong", label: "📊 Sản lượng", iconName: "BarChart3", module: "lenh-cat" },
  { href: "/tien-cong", label: "💵 Tiền công", iconName: "Wallet", module: "lenh-cat" },

  // === BỘ 3: KẾ TOÁN & ĐỐI SOÁT (Đợt 5 - chỉ KT/GĐ/Admin) ===
  { href: "/doi-soat", label: "💰 Đối soát sản lượng", iconName: "Wallet", module: "cong-no-cong-doan", allowedRoles: ["KE_TOAN", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/doi-soat-tien-cong", label: "💵 Đối soát tiền công", iconName: "Wallet2", module: "bang-luong", allowedRoles: ["KE_TOAN", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },

  // === BỘ 6: HOÀN THIỆN (Đợt 6 - NV Khuy nút / Ủi / Gấp xếp / Đóng gói) ===
  { href: "/trang-chu-hoan-thien", label: "🏠 Trang chủ Hoàn thiện", iconName: "LayoutDashboard", module: "hoan-thien", allowedRoles: ["PHU_TRACH_KHUY_NUT", "PHU_TRACH_UI", "PHU_TRACH_DONG_GOI", "NHAN_VIEN_KHUY_NUT", "NHAN_VIEN_UI", "NHAN_VIEN_DONG_GOI", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/cong-viec-hoan-thien", label: "📋 Công việc Hoàn thiện", iconName: "Briefcase", module: "hoan-thien", allowedRoles: ["PHU_TRACH_KHUY_NUT", "PHU_TRACH_UI", "PHU_TRACH_DONG_GOI", "NHAN_VIEN_KHUY_NUT", "NHAN_VIEN_UI", "NHAN_VIEN_DONG_GOI", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/ban-giao-hoan-thien", label: "🤝 Bàn giao Hoàn thiện", iconName: "Send", module: "hoan-thien", allowedRoles: ["PHU_TRACH_KHUY_NUT", "PHU_TRACH_UI", "PHU_TRACH_DONG_GOI", "NHAN_VIEN_KHUY_NUT", "NHAN_VIEN_UI", "NHAN_VIEN_DONG_GOI", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/san-luong-hoan-thien", label: "📊 Sản lượng Hoàn thiện", iconName: "BarChart3", module: "hoan-thien", allowedRoles: ["PHU_TRACH_KHUY_NUT", "PHU_TRACH_UI", "PHU_TRACH_DONG_GOI", "NHAN_VIEN_KHUY_NUT", "NHAN_VIEN_UI", "NHAN_VIEN_DONG_GOI", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/tien-cong-hoan-thien", label: "💵 Tiền công Hoàn thiện", iconName: "Wallet", module: "hoan-thien", allowedRoles: ["PHU_TRACH_KHUY_NUT", "PHU_TRACH_UI", "PHU_TRACH_DONG_GOI", "NHAN_VIEN_KHUY_NUT", "NHAN_VIEN_UI", "NHAN_VIEN_DONG_GOI", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },

  // === BỘ 7: KHO (Đợt 7 - Mobile-first) ===
  { href: "/trang-chu-kho", label: "🏠 Trang chủ Kho", iconName: "Boxes", module: "kho-vai", allowedRoles: ["THU_KHO_VAI", "THU_KHO_TP", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/nhap-kho-mobile", label: "📥 Nhập kho", iconName: "Boxes", module: "kho-vai", allowedRoles: ["THU_KHO_VAI", "THU_KHO_TP", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/xuat-kho-mobile", label: "📤 Xuất kho", iconName: "Truck", module: "kho-vai", allowedRoles: ["THU_KHO_VAI", "THU_KHO_TP", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/kiem-ke-mobile", label: "📋 Kiểm kê", iconName: "ClipboardList", module: "kho-vai", allowedRoles: ["THU_KHO_VAI", "THU_KHO_TP", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/lo-hang-mobile", label: "📦 Lô hàng", iconName: "Boxes", module: "kho-vai", allowedRoles: ["THU_KHO_VAI", "THU_KHO_TP", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },

  // === BỘ 8: QC (Đợt 8 - Kiểm tra chất lượng) ===
  { href: "/trang-chu-qc", label: "🛡️ Trang chủ QC", iconName: "ShieldCheck", module: "kiem-tra-chat-luong", allowedRoles: ["PHU_TRACH_QC", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },
  { href: "/kiem-tra-cl", label: "🔍 Kiểm tra CL", iconName: "ShieldCheck", module: "kiem-tra-chat-luong", allowedRoles: ["PHU_TRACH_QC", "GIAM_DOC", "QUAN_TRI_HE_THONG"] },
];

// ============ HELPER ============

/** Lấy icon component theo tên */
export function getIcon(name: IconName): LucideIcon {
  return ICON_MAP[name] || LayoutDashboard;
}

/** Filter menu theo role hiện tại */
export function filterMenuByRole(role: string | undefined | null): MenuItem[] {
  // Map legacy role → vai trò chuẩn
  let vaiTro: VaiTroChuan | null = null;
  if (role === "admin") vaiTro = "QUAN_TRI_HE_THONG";
  else if (role === "planner") vaiTro = "DIEU_PHOI_SX";
  else if (role === "warehouse") vaiTro = "THU_KHO_VAI";
  else if (role === "sewing") vaiTro = "PHU_TRACH_MAY";
  else if (role === "qc") vaiTro = "PHU_TRACH_QC";
  else if (role === "finishing") vaiTro = "PHU_TRACH_DONG_GOI";
  else if (role === "accountant") vaiTro = "KE_TOAN";
  else if (role) vaiTro = role as VaiTroChuan;

  if (!vaiTro) return []; // Chưa đăng nhập → rỗng

  return MENU_ITEMS.filter((item) => {
    // Nếu không khai báo allowedRoles → tất cả role thấy
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(vaiTro!);
  }).map((item) => {
    // Filter sub-items nếu là group
    if (item.isGroup && item.subItems) {
      return {
        ...item,
        subItems: item.subItems.filter((sub) => {
          if (!sub.allowedRoles) return true;
          return sub.allowedRoles.includes(vaiTro!);
        }),
      };
    }
    return item;
  });
}
