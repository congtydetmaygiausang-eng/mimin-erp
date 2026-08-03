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
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  Bot,
  Cpu,
  Zap,
  Server,
  MessageSquare,
  Webhook,
  Sliders,
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { canView, type Module } from "@/lib/permissions";

type SubItem = {
  href: string;
  label: string;
  icon: any;
  permModule: Module;
};

type NavItem = {
  href?: string;
  label: string;
  icon: any;
  permModule?: Module;
  isGroup?: boolean;
  subItems?: SubItem[];
};

const NAV: NavItem[] = [
  {
    label: "📊 Tổng Quan", icon: LayoutDashboard, isGroup: true, subItems: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permModule: "dashboard" },
      { href: "/bang-dieu-hanh-sx", label: "Bảng điều hành SX", icon: Factory, permModule: "bang-dieu-hanh-sx" },
      { href: "/realtime", label: "Real-time Dashboard", icon: BarChart3, permModule: "realtime" },
      { href: "/canh-bao", label: "Cảnh báo real-time", icon: Bell, permModule: "bao-cao" },
    ]
  },
  {
    label: "🏭 Sản Xuất & Kế hoạch", icon: Factory, isGroup: true, subItems: [
      { href: "/ke-hoach-san-xuat", label: "Kế hoạch SX", icon: Calendar, permModule: "ke-hoach-sx" },
      { href: "/lenh-cat", label: "Lệnh cắt", icon: Scissors, permModule: "lenh-cat" },
      { href: "/may", label: "Tổ may", icon: Shirt, permModule: "to-may" },
      { href: "/hoan-thien", label: "Hoàn thiện", icon: ClipboardList, permModule: "hoan-thien" },
      { href: "/qc", label: "Kiểm tra chất lượng", icon: ShieldCheck, permModule: "kiem-tra-chat-luong" },
      { href: "/gia-cong-ngoai", label: "Gia công ngoài", icon: Hammer, permModule: "gia-cong-ngoai" },
      { href: "/trang-chu-gia-cong", label: "Trang chủ gia công", icon: Shirt, permModule: "trang-chu-gia-cong" },
    ]
  },
  {
    label: "📦 Kho & Giao Hàng", icon: Boxes, isGroup: true, subItems: [
      { href: "/kho-vai-tinhmann", label: "Kho vải", icon: Package, permModule: "kho-vai" },
      { href: "/kho-phu-lieu", label: "Kho phụ liệu", icon: Boxes, permModule: "kho-phu-lieu" },
      { href: "/kho-thanh-pham", label: "Kho thành phẩm", icon: Boxes, permModule: "kho-thanh-pham" },
      { href: "/giao-hang", label: "Giao hàng", icon: Truck, permModule: "giao-hang" },
    ]
  },
  {
    label: "💵 Kế Toán & Mua Bán", icon: Wallet, isGroup: true, subItems: [
      { href: "/cham-cong", label: "Chấm công", icon: Calendar, permModule: "cham-cong" },
      { href: "/bang-luong", label: "Bảng lương", icon: Wallet, permModule: "bang-luong" },
      { href: "/doi-soat-tien-cong", label: "Đối soát tiền công", icon: Wallet2, permModule: "doi-soat-tien-cong" },
      { href: "/cong-no", label: "Công nợ công đoạn", icon: Wallet2, permModule: "cong-no-cong-doan" },
      { href: "/don-hang", label: "Đơn hàng", icon: ShoppingCart, permModule: "don-hang" },
    ]
  },
  {
    label: "📁 Danh Mục Dữ Liệu", icon: Building2, isGroup: true, subItems: [
      { href: "/danh-muc-sp", label: "Danh mục sản phẩm", icon: Shirt, permModule: "danh-muc-sp" },
      { href: "/nhan-su", label: "Nhân sự", icon: Users, permModule: "nhan-su" },
      { href: "/khach-hang", label: "Khách hàng", icon: Users, permModule: "khach-hang" },
      { href: "/nha-cung-cap", label: "Nhà cung cấp", icon: Building2, permModule: "nha-cung-cap" },
      { href: "/doi-tac-gia-cong", label: "Đối tác gia công", icon: Users, permModule: "nha-cung-cap" },
      { href: "/master-data", label: "Master Data", icon: Database, permModule: "nha-cung-cap" },
    ]
  },
  {
    label: "⚙️ Hệ Thống (Dev)", icon: Settings, isGroup: true, subItems: [
      { href: "/quan-ly-tai-khoan", label: "Quản lý tài khoản", icon: Users, permModule: "cai-dat" },
      { href: "/phan-quyen-tuy-chinh", label: "Phân quyền tùy chỉnh", icon: Sliders, permModule: "cai-dat" },
      { href: "/ai-assistant", label: "AI Assistant", icon: Bot, permModule: "cai-dat" },
      { href: "/agents", label: "Agents Dashboard", icon: Cpu, permModule: "cai-dat" },
      { href: "/audit-log", label: "Nhật ký hệ thống", icon: Activity, permModule: "cai-dat" },
      { href: "/backup-restore", label: "Sao lưu dữ liệu", icon: Database, permModule: "cai-dat" },
    ]
  }
];

function NavContent({ pathname, onItemClick, isCollapsed, toggleCollapse }: { pathname: string; onItemClick?: () => void; isCollapsed?: boolean; toggleCollapse?: () => void }) {
  const { user } = useSession();
  const role = user?.role;
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenGroups((prev) => {
      const nextOpenGroups = { ...prev };
      NAV.forEach((group) => {
        if (group.isGroup && group.subItems) {
          const shouldOpen = group.subItems.some((sub) => pathname?.startsWith(sub.href));
          if (shouldOpen) {
            nextOpenGroups[group.label] = true;
          }
        }
      });
      return nextOpenGroups;
    });
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const nextOpen = !(prev[label] ?? false);
      return {
        ...prev,
        [label]: nextOpen,
      };
    });

    if (isCollapsed && toggleCollapse) {
      toggleCollapse();
    }
  };

  // Filter menu theo permission
  const visibleNav = useMemo(() => {
    const filtered: NavItem[] = [];
    for (const item of NAV) {
      if (item.isGroup && item.subItems) {
        const visibleSubs = item.subItems.filter(sub => canView(role, sub.permModule));
        if (visibleSubs.length > 0) {
          filtered.push({ ...item, subItems: visibleSubs });
        }
      } else if (item.permModule && canView(role, item.permModule)) {
        filtered.push(item);
      }
    }
    return filtered;
  }, [role]);

  return (
    <>
      <div className={clsx("p-5 border-b flex items-center", isCollapsed ? "justify-center" : "justify-between")} style={{ borderColor: "var(--border)" }}>
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0" onClick={onItemClick}>
          <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold shadow-lg">
            M
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="font-bold text-sm truncate">MIMIN ERP</div>
              <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>Quản lý may mặc</div>
            </div>
          )}
        </Link>

        {toggleCollapse && (
          <button
            onClick={toggleCollapse}
            className="hidden md:inline-flex ml-2 shrink-0 rounded-lg border p-1.5 transition-colors hover:bg-brand-500/10 hover:text-brand-600"
            aria-label={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
            title={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}

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
      <nav className="flex-1 overflow-y-auto p-3 space-y-2">
        {visibleNav.length === 0 ? (
          <div className="p-4 text-center text-xs opacity-60">
            <Lock className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <div>Bạn chưa có quyền truy cập module nào</div>
            <div className="text-[10px] mt-1">Liên hệ admin để cấp quyền</div>
          </div>
        ) : (
          visibleNav.map((item) => {
            const Icon = item.icon;
            
            // Render group
            if (item.isGroup && item.subItems) {
              const isOpen = openGroups[item.label] || false;
              const isGroupActive = item.subItems.some((s) => pathname?.startsWith(s.href));
              
              return (
                <div key={item.label} className="mb-1">
                  <button
                    onClick={() => toggleGroup(item.label)}
                    aria-expanded={isOpen}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-semibold transition-all border border-transparent",
                      isGroupActive && !isOpen
                        ? "bg-brand-500/14 text-brand-700 dark:text-brand-300 border-brand-500/20 shadow-sm"
                        : "hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300",
                      isCollapsed && "justify-center px-2"
                    )}
                    style={(!isGroupActive && !isOpen) ? { color: "var(--text-secondary)" } : undefined}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-50" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                      </>
                    )}
                  </button>
                  
                  {!isCollapsed && (
                    <div
                      className={clsx(
                        "ml-3 mt-1 overflow-hidden rounded-lg border border-slate-200/70 bg-slate-50/70 px-2 py-1 transition-all duration-200 dark:border-slate-700/70 dark:bg-slate-900/30",
                        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      )}
                      style={{ borderColor: "var(--border)" }}
                    >
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = pathname === sub.href || pathname?.startsWith(sub.href + "/");
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={onItemClick}
                            className={clsx(
                              "flex items-center gap-2 px-2.5 py-2 rounded-md text-[14px] font-medium transition-all",
                              subActive
                                ? "bg-brand-500/15 text-brand-700 dark:text-brand-300 shadow-sm"
                                : "hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300"
                            )}
                            style={!subActive ? { color: "var(--text-muted)" } : undefined}
                          >
                            <SubIcon className="w-4 h-4 shrink-0" />
                            <span className="flex-1">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            // Render item đơn lẻ (nếu có)
            const active = pathname?.startsWith(item.href || "");
            return (
              <Link
                key={item.href || item.label}
                href={item.href || "#"}
                onClick={onItemClick}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[17px] font-bold transition-all",
                  active
                    ? "bg-brand-500/20 text-brand-700 dark:text-brand-300"
                    : "hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300",
                  isCollapsed && "justify-center px-0"
                )}
                style={!active ? { color: "var(--text-secondary)" } : undefined}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="flex-1">{item.label}</span>}
              </Link>
            );
          })
        )}
      </nav>
      <div className={clsx("p-4 border-t text-xs opacity-50 flex items-center", isCollapsed ? "justify-center" : "justify-between")} style={{ borderColor: "var(--border)" }}>
        {!isCollapsed && <span>&copy; 2026 Polo Mimin</span>}
        {toggleCollapse && (
          <button 
            onClick={toggleCollapse} 
            className="p-1 hover:text-brand-600 transition-colors"
            title={isCollapsed ? "Mở menu" : "Thu gọn menu"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        )}
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("mimin-sidebar-collapsed");
    if (saved === "true") setIsCollapsed(true);
    if (saved === "false") setIsCollapsed(false);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mimin-sidebar-collapsed", String(isCollapsed));
    }
  }, [isCollapsed]);
  
  // Không render sidebar ở trang login hoặc register
  if (pathname === "/login" || pathname === "/register" || pathname?.startsWith("/lark-login")) {
    return null;
  }

  return (
    <aside className={clsx(
      "hidden md:flex flex-col h-screen sticky top-0 glass border-r z-40 shadow-sm transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )} style={{ borderColor: "var(--border)" }}>
      <NavContent 
        pathname={pathname || ""} 
        isCollapsed={isCollapsed} 
        toggleCollapse={() => setIsCollapsed((prev) => !prev)} 
      />
    </aside>
  );
}

export function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-slide-in-right">
        <NavContent pathname={pathname || ""} onItemClick={onClose} />
      </div>
    </div>
  );
}
