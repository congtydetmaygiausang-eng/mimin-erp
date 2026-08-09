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
  iconColor: string;  // per-item icon color
  permModule: Module;
};

type NavItem = {
  href?: string;
  label: string;
  icon: any;
  permModule?: Module;
  isGroup?: boolean;
  color?: string;        // accent border color per group
  iconColor?: string;    // group icon color
  activeBg?: string;     // active group header bg
  activeSubBg?: string;  // active sub-item bg
  subItems?: SubItem[];
};

const NAV: NavItem[] = [
  {
    label: "Tổng Quan", icon: LayoutDashboard, isGroup: true,
    color: "border-cyan-400", iconColor: "text-cyan-300",
    activeBg: "bg-cyan-900/40", activeSubBg: "bg-cyan-400/20 text-white",
    subItems: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, iconColor: "text-cyan-400", permModule: "dashboard" },
      { href: "/bang-dieu-hanh-sx", label: "Bảng điều hành SX", icon: Factory, iconColor: "text-sky-400", permModule: "bang-dieu-hanh-sx" },
      { href: "/realtime", label: "Real-time Dashboard", icon: BarChart3, iconColor: "text-blue-400", permModule: "realtime" },
      { href: "/canh-bao", label: "Cảnh báo real-time", icon: Bell, iconColor: "text-amber-400", permModule: "bao-cao" },
    ]
  },
  {
    label: "Sản Xuất & Kế hoạch", icon: Factory, isGroup: true,
    color: "border-teal-400", iconColor: "text-teal-300",
    activeBg: "bg-teal-900/40", activeSubBg: "bg-teal-400/20 text-white",
    subItems: [
      { href: "/ke-hoach-san-xuat", label: "Kế hoạch SX", icon: Calendar, iconColor: "text-teal-400", permModule: "ke-hoach-sx" },
      { href: "/lenh-cat", label: "Lệnh cắt", icon: Scissors, iconColor: "text-cyan-400", permModule: "lenh-cat" },
      { href: "/to-cat-work", label: "Tổ Cắt – Việc của tôi", icon: Scissors, iconColor: "text-sky-400", permModule: "to-cat" },
      { href: "/ui-intd", label: "In / Thêu – Việc của tôi", icon: Palette, iconColor: "text-violet-400", permModule: "to-in-theu" },
      { href: "/may", label: "Tổ may", icon: Shirt, iconColor: "text-emerald-400", permModule: "to-may" },
      { href: "/to-may-work", label: "Tổ May – Việc của tôi", icon: Shirt, iconColor: "text-green-400", permModule: "to-may" },
      { href: "/to-qc-work", label: "QC – Kiểm tra chất lượng", icon: ShieldCheck, iconColor: "text-blue-400", permModule: "kiem-tra-chat-luong" },
      { href: "/ui-khuy-nut", label: "Khuy nút – Việc của tôi", icon: ClipboardList, iconColor: "text-amber-400", permModule: "to-khuy-nut" },
      { href: "/ui-ui", label: "Tổ Ủi – Việc của tôi", icon: ClipboardList, iconColor: "text-orange-400", permModule: "to-ui" },
      { href: "/ui-dong-goi", label: "Đóng gói nhập kho – Việc của tôi", icon: Package, iconColor: "text-pink-400", permModule: "to-dong-goi" },
      { href: "/to-ht-work", label: "Hoàn Thiện (Tổng hợp)", icon: CheckCircle2, iconColor: "text-teal-300", permModule: "hoan-thien" },
      { href: "/qc", label: "QC (cũ)", icon: ShieldCheck, iconColor: "text-slate-400", permModule: "kiem-tra-chat-luong" },
      { href: "/gia-cong-ngoai", label: "Gia công ngoài", icon: Hammer, iconColor: "text-rose-400", permModule: "gia-cong-ngoai" },
      { href: "/trang-chu-gia-cong", label: "Trang chủ gia công", icon: Shirt, iconColor: "text-indigo-400", permModule: "trang-chu-gia-cong" },
    ]
  },
  {
    label: "Kho & Giao Hàng", icon: Boxes, isGroup: true,
    color: "border-emerald-400", iconColor: "text-emerald-300",
    activeBg: "bg-emerald-900/40", activeSubBg: "bg-emerald-400/20 text-white",
    subItems: [
      { href: "/kho-vai-tinhmann", label: "Kho vải", icon: Package, iconColor: "text-emerald-400", permModule: "kho-vai" },
      { href: "/kho-phu-lieu", label: "Kho phụ liệu", icon: Boxes, iconColor: "text-orange-400", permModule: "kho-phu-lieu" },
      { href: "/kho-thanh-pham", label: "Kho thành phẩm", icon: Boxes, iconColor: "text-violet-400", permModule: "kho-thanh-pham" },
      { href: "/giao-hang", label: "Giao hàng", icon: Truck, iconColor: "text-sky-400", permModule: "giao-hang" },
    ]
  },
  {
    label: "Kế Toán & Mua Bán", icon: Wallet, isGroup: true,
    color: "border-amber-400", iconColor: "text-amber-300",
    activeBg: "bg-amber-900/30", activeSubBg: "bg-amber-400/20 text-white",
    subItems: [
      { href: "/cham-cong", label: "Chấm công", icon: Calendar, iconColor: "text-amber-400", permModule: "cham-cong" },
      { href: "/bang-luong", label: "Bảng lương", icon: Wallet, iconColor: "text-yellow-400", permModule: "bang-luong" },
      { href: "/doi-soat-tien-cong", label: "Đối soát tiền công", icon: Wallet2, iconColor: "text-orange-400", permModule: "doi-soat-tien-cong" },
      { href: "/cong-no", label: "Công nợ công đoạn", icon: Wallet2, iconColor: "text-red-400", permModule: "cong-no-cong-doan" },
      { href: "/don-hang", label: "Đơn hàng", icon: ShoppingCart, iconColor: "text-pink-400", permModule: "don-hang" },
    ]
  },
  {
    label: "Danh Mục Dữ Liệu", icon: Building2, isGroup: true,
    color: "border-violet-400", iconColor: "text-violet-300",
    activeBg: "bg-violet-900/40", activeSubBg: "bg-violet-400/20 text-white",
    subItems: [
      { href: "/danh-muc-sp", label: "Danh mục sản phẩm", icon: Shirt, iconColor: "text-violet-400", permModule: "danh-muc-sp" },
      { href: "/nhan-su", label: "Nhân sự", icon: Users, iconColor: "text-blue-400", permModule: "nhan-su" },
      { href: "/khach-hang", label: "Khách hàng", icon: Users, iconColor: "text-emerald-400", permModule: "khach-hang" },
      { href: "/nha-cung-cap", label: "Nhà cung cấp", icon: Building2, iconColor: "text-amber-400", permModule: "nha-cung-cap" },
      { href: "/doi-tac-gia-cong", label: "Đối tác gia công", icon: Users, iconColor: "text-cyan-400", permModule: "nha-cung-cap" },
      { href: "/cong-nhan-gia-cong", label: "Công nhân gia công dự phòng", icon: Hammer, iconColor: "text-orange-400", permModule: "nha-cung-cap" },
      { href: "/master-data", label: "Master Data", icon: Database, iconColor: "text-slate-400", permModule: "nha-cung-cap" },
    ]
  },
  {
    label: "Hệ Thống (Dev)", icon: Settings, isGroup: true,
    color: "border-rose-400", iconColor: "text-rose-300",
    activeBg: "bg-rose-900/40", activeSubBg: "bg-rose-400/20 text-white",
    subItems: [
      { href: "/quan-ly-tai-khoan", label: "Quản lý tài khoản", icon: Users, iconColor: "text-rose-400", permModule: "cai-dat" },
      { href: "/phan-quyen-tuy-chinh", label: "Phân quyền tùy chỉnh", icon: Sliders, iconColor: "text-orange-400", permModule: "cai-dat" },
      { href: "/ai-assistant", label: "AI Assistant", icon: Bot, iconColor: "text-violet-400", permModule: "cai-dat" },
      { href: "/agents", label: "Agents Dashboard", icon: Cpu, iconColor: "text-blue-400", permModule: "cai-dat" },
      { href: "/audit-log", label: "Nhật ký hệ thống", icon: Activity, iconColor: "text-amber-400", permModule: "cai-dat" },
      { href: "/backup-restore", label: "Sao lưu dữ liệu", icon: Database, iconColor: "text-slate-400", permModule: "cai-dat" },
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

  const visibleNav = useMemo(() => {
    if (user?.laCongNhan) {
      if (user.module === "cat") {
        return [{ href: "/to-cat-work", label: "✂️ Việc của tôi (Cắt)", icon: Scissors }];
      } else if (user.module === "may") {
        return [{ href: "/to-may-work", label: "👕 Việc của tôi (May)", icon: Shirt }];
      } else if (user.module === "ui" || user.module === "dong-goi") {
        return [{ href: "/to-ht-work", label: "🦺 Việc của tôi (Hoàn thiện)", icon: ClipboardList }];
      } else if (user.module === "khuy-nut") {
        return [{ href: "/ui-khuy-nut", label: "🔘 Việc của tôi (Khuy nút)", icon: CheckCircle2 }]; 
      } else if (user.module === "intd") {
        return [{ href: "/ui-intd", label: "🎨 Việc của tôi (In/Thêu)", icon: Palette }];
      }
      return [];
    }

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
  }, [role, user]);

  return (
    <>
      <div className={clsx("p-4 border-b border-white/10 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0" onClick={onItemClick}>
          <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-teal-900/40">
            M
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="font-black text-sm truncate text-white tracking-wide">MIMIN ERP</div>
              <div className="text-[10px] truncate text-slate-400">Quản lý may mặc</div>
            </div>
          )}
        </Link>

        {toggleCollapse && (
          <button
            onClick={toggleCollapse}
            className="hidden md:inline-flex ml-2 shrink-0 rounded-lg border border-white/10 p-1.5 transition-colors hover:bg-white/10 text-slate-400 hover:text-white"
            aria-label={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
            title={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}

        {onItemClick && (
          <button
            onClick={onItemClick}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/20 text-white"
            aria-label="Đóng menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {visibleNav.length === 0 ? (
          <div className="p-4 text-center text-xs opacity-60">
            <Lock className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <div>Bạn chưa có quyền truy cập module nào</div>
            <div className="text-[10px] mt-1">Liên hệ admin để cấp quyền</div>
          </div>
        ) : (
          visibleNav.map((item) => {
            const Icon = item.icon;
            const groupIconColor = item.iconColor || "text-slate-300";
            const groupBorderColor = item.color || "border-slate-500";
            const activeSubBg = item.activeSubBg || "bg-white/15 text-white";
            const activeBg = item.activeBg || "bg-white/8";
            
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
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-150 border-l-2",
                      isGroupActive || isOpen
                        ? `${groupBorderColor} ${activeBg} text-white`
                        : `border-transparent hover:bg-white/5 text-slate-200 hover:text-white`,
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={clsx("w-[18px] h-[18px] shrink-0 transition-colors", isGroupActive || isOpen ? groupIconColor : "text-slate-400")} />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left tracking-wide">{item.label}</span>
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-50" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                      </>
                    )}
                  </button>
                  
                  {!isCollapsed && (
                    <div
                      className={clsx(
                        "overflow-hidden transition-all duration-200",
                        isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      {/* Dark card container for sub-items - matching reference design */}
                      <div className="mt-1 mx-1 rounded-xl bg-black/20 px-2 py-1.5 space-y-0.5">
                        {item.subItems.map((sub) => {
                          const SubIcon = sub.icon;
                          const subActive = pathname === sub.href || pathname?.startsWith(sub.href + "/");
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={onItemClick}
                              className={clsx(
                                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                                subActive
                                  ? activeSubBg + " shadow-sm font-semibold"
                                  : "hover:bg-white/8 text-slate-200 hover:text-white"
                              )}
                            >
                              <SubIcon className={clsx("w-4 h-4 shrink-0", sub.iconColor || "text-slate-400")} />
                              <span className="flex-1 leading-tight">{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            
            // Render item đơn lẻ
            const active = pathname?.startsWith(item.href || "");
            return (
              <Link
                key={item.href || item.label}
                href={item.href || "#"}
                onClick={onItemClick}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all border-l-2",
                  active
                    ? `${groupBorderColor} bg-white/10 text-white`
                    : "border-transparent hover:bg-white/8 text-slate-200 hover:text-white",
                  isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={clsx("w-[18px] h-[18px] shrink-0", active ? groupIconColor : "text-slate-300")} />
                {!isCollapsed && <span className="flex-1">{item.label}</span>}
              </Link>
            );
          })
        )}
      </nav>
      <div className={clsx("p-4 border-t border-white/10 text-xs text-slate-500 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && <span>© 2026 Polo Mimin</span>}
        {toggleCollapse && (
          <button 
            onClick={toggleCollapse} 
            className="p-1 hover:text-slate-300 transition-colors"
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
      "hidden md:flex flex-col h-screen sticky top-0 bg-[#0B4D5D] text-white border-r border-white/10 z-40 shadow-sm transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
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
      <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-[#0B4D5D] text-white shadow-2xl flex flex-col animate-slide-in-right">
        <NavContent pathname={pathname || ""} onItemClick={onClose} />
      </div>
    </div>
  );
}
