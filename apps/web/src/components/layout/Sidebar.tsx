"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Scissors,
  Users,
  Calendar,
  Package,
  ShoppingCart,
  ShieldCheck,
  Shirt,
  Boxes,
  Truck,
  FileText,
  BarChart3,
  ClipboardList,
  Wallet,
  Settings,
  Bell,
  Building2,
  Hammer,
  Wallet2,
  Activity,
  User,
  Grid3x3,
  Link2,
  Sparkles,
  ScanLine,
  Factory,
  Palette,
  Database,
  LogIn,
  RefreshCw,
  X,
  Lock,
  CheckCircle2,
  Bot,
  Cpu,
  Zap,
  Server,
  MessageSquare,
  Webhook,
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { canView, type Module } from "@/lib/permissions";

type SubItem = {
  href: string;
  label: string;
  icon: any;
};

type NavItem = {
  href?: string;
  label: string;
  icon: any;
  permModule: Module;
  bgModule?: string;
  isGroup?: boolean;
  subItems?: SubItem[];
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permModule: "dashboard" },
  { href: "/trang-chu-gia-cong", label: "🪡 Trang chủ gia công", icon: Shirt, permModule: "trang-chu-gia-cong" },
  { href: "/bang-dieu-hanh-sx", label: "🏭 Bảng điều hành SX", icon: Factory, permModule: "bang-dieu-hanh-sx" },
  { href: "/doi-soat-tien-cong", label: "💰 Đối soát tiền công", icon: Wallet2, permModule: "doi-soat-tien-cong" },
  { href: "/ai-assistant", label: "🤖 AI Assistant", icon: Bot, permModule: "cai-dat" },
  { href: "/agents-chat", label: "💬 Chat 9 Nhân viên AI", icon: MessageSquare, permModule: "cai-dat" },
  { href: "/agents", label: "🎛️ Agents Dashboard", icon: Cpu, permModule: "cai-dat" },
  { href: "/lenh-cat", label: "Lệnh cắt", icon: Scissors, permModule: "lenh-cat" },
  { href: "/khach-hang", label: "Khách hàng", icon: Users, permModule: "khach-hang" },
  { href: "/ke-hoach-san-xuat", label: "Kế hoạch SX", icon: Calendar, permModule: "ke-hoach-sx" },
  { href: "/nhan-su", label: "Nhân sự", icon: Users, permModule: "nhan-su" },
  { href: "/master-data", label: "📋 Master Data (NCC/KH/Xưởng)", icon: Building2, permModule: "nha-cung-cap" },
  { href: "/lsx-m758-demo", label: "📦 LSX M758 (Demo workflow)", icon: Package, permModule: "ke-hoach-sx" },
  { href: "/kho-vai-tinhmann", label: "Kho vải", icon: Package, permModule: "kho-vai" },
  { href: "/kho-phu-lieu", label: "Kho phụ liệu", icon: Boxes, permModule: "kho-phu-lieu" },
  { href: "/kho-thanh-pham", label: "Kho thành phẩm", icon: Boxes, permModule: "kho-thanh-pham" },
  { href: "/don-hang", label: "Đơn hàng", icon: ShoppingCart, permModule: "don-hang" },
  { href: "/cong-no", label: "Công nợ công đoạn", icon: Wallet2, permModule: "cong-no-cong-doan" },
  { href: "/qc", label: "Kiểm tra chất lượng", icon: ShieldCheck, permModule: "kiem-tra-chat-luong" },
  { href: "/may", label: "Tổ may", icon: Shirt, permModule: "to-may" },
  { href: "/hoan-thien", label: "Hoàn thiện", icon: ClipboardList, permModule: "hoan-thien" },
  { href: "/giao-hang", label: "Giao hàng", icon: Truck, permModule: "giao-hang" },
  { href: "/cham-cong", label: "Chấm công", icon: Calendar, permModule: "cham-cong" },
  { href: "/bang-luong", label: "Bảng lương", icon: Wallet, permModule: "bang-luong" },
  { href: "/nha-cung-cap", label: "Nhà cung cấp", icon: Building2, permModule: "nha-cung-cap" },
  { href: "/gia-cong-ngoai", label: "Gia công ngoài", icon: Hammer, permModule: "gia-cong-ngoai" },
  { href: "/bao-cao", label: "Báo cáo", icon: FileText, permModule: "bao-cao" },
  { href: "/realtime", label: "Real-time Dashboard", icon: BarChart3, permModule: "realtime" },
  { href: "/audit-log", label: "Audit Log", icon: Activity, permModule: "cai-dat" },
  { href: "/ai-assistant", label: "🤖 AI Assistant", icon: Bot, permModule: "cai-dat" },
  { href: "/agents", label: "🎛️ Agents Dashboard", icon: Cpu, permModule: "cai-dat" },
  { href: "/workflow", label: "Workflow Công đoạn", icon: Scissors, permModule: "lenh-cat" },
  { href: "/tong-hop-cong-doan", label: "Tổng hợp công đoạn", icon: Grid3x3, permModule: "bao-cao" },
  { href: "/so-det-nhuom", label: "Sợi - Dệt - Nhuộm", icon: Factory, permModule: "kho-vai" },
  { href: "/mini-soi-det", label: "Mini: Sợi & Dệt", icon: ScanLine, permModule: "kho-vai" },
  { href: "/kho-soi-day-chuyen", label: "Kho sợi - Chuẩn ERP", icon: Boxes, permModule: "kho-vai" },
  { href: "/soi-det-nhuom-erp", label: "Sợi-Dệt-Nhuộm ERP", icon: Factory, permModule: "kho-vai" },
  { href: "/role-workspaces", label: "Workspaces theo Role", icon: Users, permModule: "kho-vai" },
  { href: "/flow-tong-quan", label: "Flow Tổng Quan (Timeline)", icon: ChevronRight, permModule: "kho-vai" },
  { href: "/det-nhuom-flow", label: "Dệt-Nhuộm Flow 11 MH", icon: Factory, permModule: "kho-vai" },
  { href: "/lenh-tong", label: "⭐ Lệnh Dệt-Nhuộm TỔNG", icon: Sparkles, permModule: "kho-vai" },
  { href: "/san-xuat-erp", label: "🏭 Sản Xuất ERP (Tổng hợp)", icon: Factory, permModule: "kho-vai" },
  { href: "/phan-quen-cua-toi", label: "🛡️ Phân quyền của tôi", icon: ShieldCheck, permModule: "cai-dat" },
  { href: "/quan-ly-tai-khoan", label: "👤 Quản lý tài khoản", icon: Users, permModule: "cai-dat" },
  { href: "/test-phan-quyen", label: "🧪 Test nhanh 32 User", icon: ShieldCheck, permModule: "cai-dat" },
  { href: "/seed-data", label: "🌱 Seed Data (1 click)", icon: Database, permModule: "cai-dat" },
  { href: "/test-kiem-thu", label: "🧪 Test 54 modules", icon: CheckCircle2, permModule: "cai-dat" },
  { href: "/backup-restore", label: "💾 Backup & Restore", icon: Database, permModule: "cai-dat" },
  { href: "/supabase-status", label: "☁️ Supabase Status", icon: Database, permModule: "cai-dat" },
  { href: "/bang-luong-auto", label: "💰 Bảng lương tự động", icon: Wallet, permModule: "bang-luong" },
  { href: "/canh-bao", label: "🔔 Cảnh báo real-time", icon: Bell, permModule: "bao-cao" },
  { href: "/kien-truc-phan-quyen", label: "🏗️ Kiến trúc phân quyền", icon: ShieldCheck, permModule: "cai-dat" },
  { href: "/mohinh-phan-quyen-chuan", label: "🎯 Mô hình chuẩn MIMIN OS", icon: Palette, permModule: "cai-dat" },
  { href: "/doi-tac-gia-cong", label: "🤝 Đối tác gia công (35)", icon: Users, permModule: "nha-cung-cap" },
  // Nhóm Lark (gộp chung 1 menu cha)
  { label: "Lark (Tích hợp)", icon: Link2, permModule: "cai-dat", isGroup: true, subItems: [
    { href: "/lark-settings", label: "Kết nối Lark", icon: Settings },
    { href: "/lark-login", label: "Lark Login (OAuth)", icon: LogIn },
    { href: "/lark-base-manager", label: "Lark Base Manager", icon: Database },
    { href: "/lark-setup", label: "⚡ Lark Setup Wizard", icon: Zap },
    { href: "/lark-control-center", label: "🎛️ Lark Control Center", icon: Server },
    { href: "/lark-card-builder", label: "💬 Lark Card Builder", icon: MessageSquare },
    { href: "/lark-webhook-docs", label: "📡 Webhook & Bot Docs", icon: Webhook },
  { href: "/lark-auto-setup", label: "Lark Auto Setup", icon: Sparkles },
    { href: "/lark-sync-engine", label: "Lark Sync Engine", icon: Activity },
    { href: "/lark-sync-overview", label: "Lark Sync Overview", icon: RefreshCw },
    { href: "/lark-sheet-import", label: "Lark Sheet Import", icon: FileText },
    { href: "/test-real-data", label: "Test Data Thật", icon: Database },
  ]},
  { href: "/cai-dat", label: "Cài đặt", icon: Settings, permModule: "cai-dat" },
  { href: "/profile", label: "Hồ sơ cá nhân", icon: User, permModule: "dashboard" },
];

function NavContent({ pathname, onItemClick }: { pathname: string; onItemClick?: () => void }) {
  const { user } = useSession();
  const role = user?.role;
  const [larkOpen, setLarkOpen] = useState(false);

  // Tự động mở nếu đang ở trang Lark
  useEffect(() => {
    if (pathname?.startsWith("/lark-") || pathname === "/test-real-data") {
      setLarkOpen(true);
    }
  }, [pathname]);

  // Filter menu theo permission
  const visibleNav = useMemo(() => {
    return NAV.filter((item) => canView(role, item.permModule));
  }, [role]);

  return (
    <>
      <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onItemClick}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold shadow-lg">
            M
          </div>
          <div>
            <div className="font-bold text-sm">MIMIN ERP</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Quản lý may mặc</div>
          </div>
        </Link>
        {onItemClick && (
          <button
            onClick={onItemClick}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/30"
            aria-label="Đóng menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {visibleNav.length === 0 ? (
          <div className="p-4 text-center text-xs opacity-60">
            <Lock className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <div>Bạn chưa có quyền truy cập module nào</div>
            <div className="text-[10px] mt-1">Liên hệ admin để cấp quyền</div>
          </div>
        ) : (
          visibleNav.map((item) => {
            const Icon = item.icon;
            // Render group với submenu
            if (item.isGroup && item.subItems) {
              const isGroupActive = item.subItems.some((s) => pathname?.startsWith(s.href));
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setLarkOpen(!larkOpen)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                      isGroupActive
                        ? "bg-brand-500/20 text-brand-700 dark:text-brand-300 font-medium"
                        : "hover:bg-white/30 dark:hover:bg-white/5"
                    )}
                    style={!isGroupActive ? { color: "var(--text-secondary)" } : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {larkOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {larkOpen && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 pl-2" style={{ borderColor: "var(--border)" }}>
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = pathname === sub.href || pathname?.startsWith(sub.href + "/");
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={onItemClick}
                            className={clsx(
                              "flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-all",
                              subActive
                                ? "bg-brand-500/15 text-brand-700 dark:text-brand-300 font-medium"
                                : "hover:bg-white/30 dark:hover:bg-white/5"
                            )}
                            style={!subActive ? { color: "var(--text-muted)" } : undefined}
                          >
                            <SubIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="flex-1">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            const active = pathname?.startsWith(item.href || "");
            return (
              <Link
                key={item.href || item.label}
                href={item.href || "#"}
                onClick={onItemClick}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  active
                    ? "bg-brand-500/20 text-brand-700 dark:text-brand-300 font-medium"
                    : "hover:bg-white/30 dark:hover:bg-white/5"
                )}
                style={!active ? { color: "var(--text-secondary)" } : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })
        )}
      </nav>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname() || "";
  return (
    <aside className="hidden md:flex w-64 flex-col glass border-r shrink-0" style={{ borderColor: "var(--border)" }}>
      <NavContent pathname={pathname} />
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname() || "";

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col glass border-r shadow-2xl transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderColor: "var(--border)" }}
      >
        <NavContent pathname={pathname} onItemClick={onClose} />
      </aside>
    </>
  );
}
