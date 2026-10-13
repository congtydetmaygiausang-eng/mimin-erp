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
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  Shirt,
  Heart,
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
  ReceiptText,
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
  Calculator,
  Search,
  Wind,
  Tag,
  History,
  GitBranch,
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { canView, type Module } from "@/lib/permissions";
import { usePermissionRevision } from "@/lib/use-permission-revision";

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
  // === Ghi đè màu cho group dùng tông SÁNG trên nền sidebar tối ===
  // Mặc định mọi group là tông tối (chữ trắng, khối con nền đen mờ). Group nào
  // muốn nền xám/trắng phải khai báo thêm màu chữ tối, nếu không chữ trắng sẽ
  // nằm trên nền sáng và không đọc được.
  activeText?: string;   // màu chữ header khi group đang mở/active (mặc định text-white)
  idleBg?: string;       // nền header khi group đang đóng (mặc định trong suốt)
  idleText?: string;     // màu chữ header khi đóng
  idleIcon?: string;     // màu icon header khi đóng
  subBg?: string;        // nền khối chứa các mục con (mặc định bg-black/20)
  subIdleText?: string;  // class chữ/hover của mục con khi chưa active
  iconChip?: string;     // bọc icon header trong 1 "chip" bo tròn (điểm nhấn màu)
  noAccentBar?: boolean; // bỏ thanh viền trái - dùng cho group kiểu thẻ card
};

// Kiểu "thẻ kính mờ" (glassmorphism) dùng chung cho mọi nhóm - trong suốt +
// backdrop-blur để thấy mờ mờ nền tối phía sau, chỉ đổi màu chip icon + màu
// mục con đang active theo từng nhóm.
function cardStyle(chipFrom: string, chipTo: string, subFrom: string, subTo: string, subText: string): Partial<NavItem> {
  return {
    noAccentBar: true,
    iconChip: `w-7 h-7 bg-gradient-to-br ${chipFrom} ${chipTo} text-white shadow-sm`,
    idleBg: "bg-white/15 backdrop-blur-md ring-1 ring-white/25 shadow-lg shadow-black/20 hover:bg-white/25",
    idleText: "text-white",
    activeBg: "bg-white/30 backdrop-blur-md ring-1 ring-white/40 shadow-xl shadow-black/25",
    activeText: "text-white",
    subBg: "bg-black/25 backdrop-blur-md ring-1 ring-white/15 shadow-lg shadow-black/30",
    subIdleText: "text-slate-100 hover:bg-white/15 hover:text-white",
    activeSubBg: `bg-gradient-to-r ${subFrom} ${subTo} ${subText} ring-1 ring-black/5`,
  };
}

const NAV: NavItem[] = [
  {
    label: "Tổng Quan", icon: LayoutDashboard, isGroup: true,
    color: "border-cyan-400", iconColor: "text-cyan-300",
    ...cardStyle("from-cyan-500", "to-blue-600", "from-cyan-50", "to-blue-50", "text-cyan-900"),
    subItems: [
      { href: "/dashboard", label: "Bàn làm việc", icon: LayoutDashboard, iconColor: "text-cyan-400", permModule: "dashboard" },
      { href: "/bang-dieu-hanh-sx", label: "Bảng điều hành SX", icon: Factory, iconColor: "text-sky-400", permModule: "bang-dieu-hanh-sx" },
      { href: "/realtime", label: "Báo cáo tổng hợp (BI)", icon: BarChart3, iconColor: "text-blue-400", permModule: "realtime" },
      { href: "/canh-bao", label: "Trung tâm cảnh báo", icon: Bell, iconColor: "text-amber-400", permModule: "bao-cao" },
    ]
  },
  {
    label: "Sản Xuất Sợi · Dệt · Nhuộm", icon: Factory, isGroup: true,
    color: "border-orange-400", iconColor: "text-orange-300",
    ...cardStyle("from-orange-500", "to-amber-600", "from-orange-50", "to-amber-50", "text-orange-900"),
    subItems: [
      { href: "/san-xuat-erp?tab=dashboard", label: "Tổng quan điều hành", icon: BarChart3, iconColor: "text-blue-400", permModule: "bang-dieu-hanh-sx" },
      { href: "/san-xuat-erp?tab=lenhtong", label: "Lệnh SX vải (Mộc/Màu)", icon: FileText, iconColor: "text-emerald-400", permModule: "bang-dieu-hanh-sx" },
      { href: "/san-xuat-erp?tab=flow", label: "Quy trình Sợi - Dệt - Nhuộm", icon: GitBranch, iconColor: "text-violet-400", permModule: "bang-dieu-hanh-sx" },
      { href: "/san-xuat-erp?tab=congno", label: "Công nợ gia công vải", icon: CreditCard, iconColor: "text-rose-400", permModule: "bang-dieu-hanh-sx" },
      { href: "/san-xuat-erp?tab=baocao", label: "Báo cáo sản lượng & lỗi", icon: BarChart3, iconColor: "text-amber-400", permModule: "bang-dieu-hanh-sx" },
      { href: "/san-xuat-erp?tab=master", label: "Danh bạ NCC & xưởng", icon: Users, iconColor: "text-slate-400", permModule: "bang-dieu-hanh-sx" },
    ]
  },
  {
    label: "Sản Xuất & Kế hoạch", icon: Factory, isGroup: true,
    color: "border-teal-400", iconColor: "text-teal-300",
    ...cardStyle("from-teal-500", "to-emerald-600", "from-teal-50", "to-emerald-50", "text-teal-900"),
    subItems: [
      { href: "/ke-hoach-san-xuat", label: "Kế hoạch SX", icon: Calendar, iconColor: "text-teal-400", permModule: "ke-hoach-sx" },
      { href: "/lenh-cat", label: "Lệnh cắt", icon: Scissors, iconColor: "text-cyan-400", permModule: "lenh-cat" },
      { href: "/to-cat-work", label: "Tổ Cắt – Việc của tôi", icon: Scissors, iconColor: "text-sky-400", permModule: "to-cat" },
      { href: "/ui-intd", label: "In / Thêu – Việc của tôi", icon: Palette, iconColor: "text-violet-400", permModule: "to-in-theu" },
      { href: "/to-may-work", label: "Tổ May – Việc của tôi", icon: Shirt, iconColor: "text-green-400", permModule: "to-may" },
      { href: "/to-qc-work", label: "QC – Kiểm tra chất lượng", icon: ShieldCheck, iconColor: "text-blue-400", permModule: "kiem-tra-chat-luong" },
      { href: "/ui-khuy-nut", label: "Khuy nút – Việc của tôi", icon: ClipboardList, iconColor: "text-amber-400", permModule: "to-khuy-nut" },
      { href: "/ui-ui", label: "Tổ Ủi – Việc của tôi", icon: Wind, iconColor: "text-orange-400", permModule: "to-ui" },
      { href: "/ui-dong-goi", label: "Đóng gói nhập kho – Việc của tôi", icon: Package, iconColor: "text-pink-400", permModule: "to-dong-goi" },
      { href: "/to-ht-work", label: "Hoàn Thiện (Tổng hợp)", icon: CheckCircle2, iconColor: "text-teal-300", permModule: "hoan-thien" },
    ]
  },
  {
    label: "Kho & Giao Hàng", icon: Boxes, isGroup: true,
    color: "border-emerald-400", iconColor: "text-emerald-300",
    ...cardStyle("from-emerald-500", "to-green-600", "from-emerald-50", "to-green-50", "text-emerald-900"),
    subItems: [
      { href: "/kho-vai-tinhmann", label: "Vải thành phẩm", icon: Package, iconColor: "text-emerald-400", permModule: "kho-vai" },
      { href: "/kho-phu-lieu", label: "Kho phụ liệu", icon: Boxes, iconColor: "text-orange-400", permModule: "kho-phu-lieu" },
      { href: "/kho-thanh-pham", label: "Kho thành phẩm", icon: Boxes, iconColor: "text-violet-400", permModule: "kho-thanh-pham" },
      { href: "/giao-hang", label: "Giao hàng", icon: Truck, iconColor: "text-sky-400", permModule: "giao-hang" },
    ]
  },
  {
    label: "Kế Toán & Mua Bán", icon: Wallet, isGroup: true,
    color: "border-amber-400", iconColor: "text-amber-300",
    ...cardStyle("from-amber-500", "to-orange-600", "from-amber-50", "to-orange-50", "text-amber-900"),
    subItems: [
      { href: "/cham-cong", label: "Chấm công", icon: Calendar, iconColor: "text-amber-400", permModule: "cham-cong" },
      { href: "/bang-luong", label: "Bảng lương", icon: Wallet, iconColor: "text-yellow-400", permModule: "bang-luong" },
      { href: "/doi-soat-tien-cong", label: "Đối soát tiền công", icon: Wallet2, iconColor: "text-orange-400", permModule: "doi-soat-tien-cong" },
      { href: "/cong-no", label: "Công nợ công đoạn", icon: Wallet2, iconColor: "text-red-400", permModule: "cong-no-cong-doan" },
      { href: "/thu-chi", label: "Thu chi nội bộ", icon: ReceiptText, iconColor: "text-emerald-400", permModule: "thu-chi" },
      { href: "/don-hang", label: "Đơn hàng", icon: ShoppingCart, iconColor: "text-pink-400", permModule: "don-hang" },
      { href: "/phieu-dat-ncc-phu-lieu", label: "Đặt NCC phụ liệu", icon: ShoppingBag, iconColor: "text-emerald-400", permModule: "dat-ncc-phu-lieu" },
      { href: "/danh-muc-vat-tu-san-xuat", label: "Mẫu vật tư sản xuất", icon: Package, iconColor: "text-teal-400", permModule: "dat-ncc-phu-lieu" },
      { href: "/bang-gia", label: "Bảng giá bán", icon: Tag, iconColor: "text-amber-400", permModule: "don-hang" },
    ]
  },
  {
    // @codex Phân hệ mới dùng quyền NCC sẵn có để không sửa permission matrix của Mavis.
    label: "MIMIN GROUP", icon: Link2, isGroup: true,
    color: "border-cyan-400", iconColor: "text-cyan-300",
    ...cardStyle("from-sky-500", "to-indigo-600", "from-sky-50", "to-indigo-50", "text-sky-900"),
    subItems: [
      { href: "/mang-luoi-san-xuat", label: "Tổng quan", icon: Factory, iconColor: "text-cyan-400", permModule: "nha-cung-cap" },
      { href: "/mang-luoi-san-xuat/tim-doi-tac", label: "Tìm đối tác AI", icon: Search, iconColor: "text-violet-400", permModule: "nha-cung-cap" },
      { href: "/mang-luoi-san-xuat/danh-ba-doi-tac", label: "Danh bạ đối tác", icon: Building2, iconColor: "text-emerald-400", permModule: "nha-cung-cap" },
      { href: "/mang-luoi-san-xuat/co-hoi-hop-tac", label: "Cơ hội hợp tác", icon: Link2, iconColor: "text-indigo-400", permModule: "nha-cung-cap" },
    ]
  },
  {
    label: "Danh Mục Dữ Liệu", icon: Building2, isGroup: true,
    color: "border-violet-400", iconColor: "text-violet-300",
    ...cardStyle("from-violet-500", "to-purple-600", "from-violet-50", "to-purple-50", "text-violet-900"),
    subItems: [
      { href: "/danh-muc-sp", label: "Danh mục sản phẩm", icon: Shirt, iconColor: "text-violet-400", permModule: "danh-muc-sp" },
      { href: "/nhan-su", label: "Nhân sự", icon: Users, iconColor: "text-blue-400", permModule: "nhan-su" },
      { href: "/khach-hang", label: "Khách hàng", icon: Users, iconColor: "text-emerald-400", permModule: "khach-hang" },
      { href: "/nha-cung-cap", label: "Nhà cung cấp", icon: Building2, iconColor: "text-amber-400", permModule: "nha-cung-cap" },
      { href: "/nha-cung-cap/hop-dong", label: "Hợp đồng", icon: FileText, iconColor: "text-sky-400", permModule: "nha-cung-cap" },
      { href: "/nha-cung-cap/giao-dich-mua", label: "Giao dịch mua NCC", icon: ShoppingBag, iconColor: "text-emerald-400", permModule: "nha-cung-cap" },
      { href: "/nha-cung-cap/cong-no-tong", label: "Công nợ tổng", icon: Wallet, iconColor: "text-amber-400", permModule: "nha-cung-cap" },
      { href: "/nha-cung-cap/thanh-toan", label: "Thanh toán", icon: CreditCard, iconColor: "text-teal-400", permModule: "nha-cung-cap" },
      { href: "/nha-cung-cap/lich-su", label: "Lịch sử hoạt động", icon: History, iconColor: "text-slate-300", permModule: "nha-cung-cap" },
      { href: "/doi-tac-gia-cong", label: "Đối tác gia công", icon: Users, iconColor: "text-cyan-400", permModule: "nha-cung-cap" },
      { href: "/cong-nhan-gia-cong", label: "Công nhân gia công dự phòng", icon: Hammer, iconColor: "text-orange-400", permModule: "nha-cung-cap" },
      { href: "/master-data", label: "Master Data", icon: Database, iconColor: "text-slate-400", permModule: "nha-cung-cap" },
    ]
  },
  {
    // === Công Cụ Nội Bộ - nhóm tính năng hướng dẫn/chiến lược nội bộ ===
    // Đổi tên từ "MIMIN Group" để nhường tên đó cho phân hệ Mạng lưới đối tác (MIMIN GROUP).
    // Dùng chung kiểu "thẻ kính mờ" (glassmorphism) với các nhóm khác qua cardStyle().
    label: "Công Cụ Nội Bộ", icon: Sparkles, isGroup: true,
    color: "border-teal-400",
    ...cardStyle("from-teal-500", "to-cyan-600", "from-teal-50", "to-cyan-50", "text-teal-900"),
    // 2 mục tạm gỡ khỏi bản deploy này vì repo GitHub đang CÔNG KHAI:
    //  - "AI Tính Giá Vốn" (kèm tab Kho Mẫu Hot): chứa 28 tên xưởng gia công
    //    thật + toàn bộ đơn giá đã thoả thuận -> lộ cơ cấu giá vốn cho đối thủ.
    //  - "Khách Hàng Tiềm Năng": chứa 461 số điện thoại + tên khách hàng thật.
    // Cả 2 sẽ làm lại bằng cách đọc dữ liệu từ Supabase có phân quyền, thay vì
    // nhúng thẳng vào code frontend (cách cũ dù repo private thì dữ liệu vẫn
    // được đóng gói vào JS gửi xuống trình duyệt người dùng).
    subItems: [
      { href: "/huong-dan-vai-tro", label: "Sơ đồ HD sử dụng", icon: Users, iconColor: "text-amber-500", permModule: "so-do-chien-luoc" },
      { href: "/so-do-chien-luoc", label: "Sơ Đồ Chiến Lược", icon: Palette, iconColor: "text-sky-600", permModule: "so-do-chien-luoc" },
      { href: "/cong-thuc-dinh-muc", label: "Công thức định mức", icon: Calculator, iconColor: "text-teal-600", permModule: "lenh-cat" },
      { href: "/mau-da-thich", label: "Mẫu đã thích", icon: Heart, iconColor: "text-rose-400", permModule: "so-do-chien-luoc" },
      { href: "/bang-tin", label: "Bảng tin", icon: MessageSquare, iconColor: "text-pink-500", permModule: "so-do-chien-luoc" },
    ]
  },
  {
    label: "Hệ Thống (Dev)", icon: Settings, isGroup: true,
    color: "border-rose-400", iconColor: "text-rose-300",
    ...cardStyle("from-rose-500", "to-pink-600", "from-rose-50", "to-pink-50", "text-rose-900"),
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
  const permissionRevision = usePermissionRevision();
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [currentSearch, setCurrentSearch] = useState("");

  useEffect(() => {
    const updateSearch = () => {
      if (typeof window !== "undefined") {
        setCurrentSearch(window.location.search.replace(/^\?/, ""));
      }
    };
    updateSearch();
    window.addEventListener("popstate", updateSearch);
    return () => window.removeEventListener("popstate", updateSearch);
  }, [pathname]);

  const isMatchHref = (targetHref: string) => {
    if (targetHref.includes("?")) {
      const full = currentSearch ? `${pathname}?${currentSearch}` : pathname;
      return full === targetHref;
    }
    return pathname === targetHref || pathname?.startsWith(targetHref + "/");
  };

  useEffect(() => {
    setOpenGroups((prev) => {
      const nextOpenGroups = { ...prev };
      NAV.forEach((group) => {
        if (group.isGroup && group.subItems) {
          const shouldOpen = group.subItems.some((sub) => {
            if (sub.href.includes("?")) {
              const full = currentSearch ? `${pathname}?${currentSearch}` : pathname;
              return full === sub.href;
            }
            return pathname?.startsWith(sub.href);
          });
          if (shouldOpen) {
            nextOpenGroups[group.label] = true;
          }
        }
      });
      return nextOpenGroups;
    });
  }, [pathname, currentSearch]);

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
      const boPhan = user.phongBan?.toLowerCase() || "";
      if (boPhan.includes("cắt") && canView(role, "to-cat")) {
        return [{ href: "/to-cat-work", label: "✂️ Việc của tôi (Cắt)", icon: Scissors }];
      } else if (boPhan.includes("may") && canView(role, "to-may")) {
        return [{ href: "/to-may-work", label: "👕 Việc của tôi (May)", icon: Shirt }];
      } else if ((boPhan.includes("ủi") || boPhan.includes("gấp xếp") || boPhan.includes("hoàn thiện") || boPhan.includes("đóng gói")) && canView(role, "hoan-thien")) {
        return [{ href: "/to-ht-work", label: "🦺 Việc của tôi (Hoàn thiện)", icon: ClipboardList }];
      } else if (boPhan.includes("khuy nút") && canView(role, "to-khuy-nut")) {
        return [{ href: "/ui-khuy-nut", label: "🔘 Việc của tôi (Khuy nút)", icon: CheckCircle2 }]; 
      } else if ((boPhan.includes("in") || boPhan.includes("thêu")) && canView(role, "to-in-theu")) {
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
  }, [role, user, permissionRevision]);

  // Quản lý nhóm đang active popover khi ở chế độ Dock (hỗ trợ cả click iPad/touch)
  const [activePopover, setActivePopover] = useState<string | null>(null);

  // Đóng popover khi click ra ngoài
  useEffect(() => {
    if (!isCollapsed) return;
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dock-item]")) {
        setActivePopover(null);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [isCollapsed]);

  return (
    <>
      {/* Header Sidebar / Dock */}
      <div className={clsx("p-3 border-b border-white/10 flex items-center transition-all duration-200", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-3 min-w-0 flex-1 group" onClick={onItemClick}>
              <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center overflow-hidden bg-white/10 border border-white/20 shadow-lg shadow-black/20 group-hover:scale-105 transition-transform">
                <img src="/logo.png" alt="MIMIN" className="w-full h-full object-cover p-0.5" />
              </div>
              <div className="min-w-0">
                <div className="font-black text-lg truncate text-white tracking-wider drop-shadow-md">MIMIN ERP</div>
                <div className="text-xs truncate text-cyan-200 font-medium">Quản lý may mặc</div>
              </div>
            </Link>
            {toggleCollapse && (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}
                className="hidden md:flex p-2 hover:bg-white/15 rounded-xl text-slate-300 hover:text-white transition-all shrink-0 hover:scale-105 active:scale-95"
                title="Thu gọn menu (Chế độ Icon Dock)"
                aria-label="Thu gọn menu"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            )}
          </>
        ) : (
          <div className="relative group">
            <Link 
              href="/dashboard" 
              className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center overflow-hidden bg-white/15 border border-white/25 shadow-md hover:scale-105 transition-transform"
              title="Về Bàn làm việc"
            >
              <img src="/logo.png" alt="MIMIN" className="w-full h-full object-cover p-0.5" />
            </Link>
            {/* Tooltip logo khi hover */}
            <div className="absolute left-[52px] top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl text-xs font-semibold text-white whitespace-nowrap invisible opacity-0 -translate-x-1.5 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 pointer-events-none">
              MIMIN ERP • Trang chủ
            </div>
          </div>
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

      {/* Nav Content */}
      <nav className={clsx(
        "flex-1 p-2 space-y-1.5 transition-all duration-200",
        isCollapsed ? "overflow-visible flex flex-col items-center py-3" : "overflow-y-auto"
      )}>
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
            const activeText = item.activeText || "text-white";
            const idleHeaderClasses = item.idleBg
              ? `${groupBorderColor} ${item.idleBg} ${item.idleText || "text-slate-800"}`
              : "border-transparent hover:bg-white/5 text-slate-200 hover:text-white";
            
            // XỬ LÝ NHÓM CÓ SUB-ITEMS
            if (item.isGroup && item.subItems) {
              const isOpen = openGroups[item.label] || false;
              const isGroupActive = item.subItems.some((s) => isMatchHref(s.href));
              const isPopoverOpen = activePopover === item.label;
              
              // Chế độ Icon Dock (Thu gọn - iPad / macOS style)
              if (isCollapsed) {
                return (
                  <div key={item.label} className="relative group" data-dock-item>
                    {/* Chấm chỉ báo trạng thái Active (Active dot indicator) */}
                    {isGroupActive && (
                      <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] z-20 pointer-events-none" />
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePopover((prev) => (prev === item.label ? null : item.label));
                      }}
                      className={clsx(
                        "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 relative shadow-sm",
                        isGroupActive
                          ? "bg-white/25 ring-2 ring-cyan-400/80 text-white shadow-lg shadow-cyan-950/40 scale-105"
                          : "bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white hover:scale-105 hover:shadow-md"
                      )}
                      aria-label={item.label}
                    >
                      {item.iconChip ? (
                        <span className={clsx("w-7 h-7 rounded-xl flex items-center justify-center shadow-inner", item.iconChip)}>
                          <Icon className="w-4 h-4" />
                        </span>
                      ) : (
                        <Icon className={clsx("w-5 h-5", isGroupActive ? "text-cyan-300 drop-shadow" : groupIconColor)} />
                      )}
                    </button>

                    {/* Flyout Popover Menu nổi bên phải (Glassmorphism macOS App Menu) */}
                    <div
                      className={clsx(
                        "absolute left-[48px] top-0 ml-3 w-64 bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-2.5 z-50 text-white transition-all duration-150 origin-top-left",
                        isPopoverOpen
                          ? "visible opacity-100 translate-x-0 pointer-events-auto"
                          : "invisible opacity-0 -translate-x-2 pointer-events-none group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto"
                      )}
                    >
                      {/* Tiêu đề nhóm trong Popover */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className={clsx("w-4 h-4", groupIconColor)} />
                          <span className="font-bold text-xs tracking-wide text-white">{item.label}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-cyan-300 border border-white/10">
                          {item.subItems.length}
                        </span>
                      </div>

                      <div className="border-t border-white/10 my-1" />

                      {/* Danh sách module con */}
                      <div className="space-y-0.5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {item.subItems.map((sub) => {
                          const SubIcon = sub.icon;
                          const subActive = isMatchHref(sub.href);
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => {
                                setActivePopover(null);
                                onItemClick?.();
                              }}
                              className={clsx(
                                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group/sub",
                                subActive
                                  ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-semibold shadow-sm"
                                  : "text-slate-200 hover:bg-white/15 hover:text-white"
                              )}
                            >
                              <SubIcon className={clsx("w-4 h-4 shrink-0 transition-transform group-hover/sub:scale-110", sub.iconColor || "text-slate-400")} />
                              <span className="flex-1 truncate leading-tight">{sub.label}</span>
                              {subActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] shrink-0" />}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              // Chế độ Full Sidebar (Bung to)
              return (
                <div key={item.label} className="mb-1">
                  <button
                    onClick={() => toggleGroup(item.label)}
                    aria-expanded={isOpen}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-150",
                      !item.noAccentBar && "border-l-2",
                      isGroupActive || isOpen
                        ? `${groupBorderColor} ${activeBg} ${activeText}`
                        : idleHeaderClasses
                    )}
                  >
                    {item.iconChip ? (
                      <span className={clsx("shrink-0 flex items-center justify-center rounded-lg transition-transform duration-150", item.iconChip)}>
                        <Icon className="w-[15px] h-[15px]" />
                      </span>
                    ) : (
                      <Icon className={clsx("w-[18px] h-[18px] shrink-0 transition-colors", isGroupActive || isOpen ? groupIconColor : (item.idleIcon || "text-slate-400"))} />
                    )}
                    <span className="flex-1 text-left tracking-wide">{item.label}</span>
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-50" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                  </button>
                  
                  <div
                    className={clsx(
                      "overflow-hidden transition-all duration-200",
                      isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className={clsx("mt-1 mx-1 rounded-xl px-2 py-1.5 space-y-0.5", item.subBg || "bg-black/20")}>
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = isMatchHref(sub.href);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={onItemClick}
                            className={clsx(
                              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                              subActive
                                ? activeSubBg + " shadow-sm font-semibold"
                                : (item.subIdleText || "hover:bg-white/8 text-slate-200 hover:text-white")
                            )}
                          >
                            <SubIcon className={clsx("w-4 h-4 shrink-0", sub.iconColor || "text-slate-400")} />
                            <span className="flex-1 leading-tight">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }
            
            // XỬ LÝ ITEM ĐƠN LẺ (KHÔNG CÓ SUB-ITEMS)
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const singleIdleClasses = item.idleBg
              ? `${groupBorderColor} ${item.idleBg} ${item.idleText || "text-slate-800"}`
              : "border-transparent hover:bg-white/5 text-slate-200 hover:text-white";
              
            // Chế độ Icon Dock cho Item đơn lẻ
            if (isCollapsed) {
              return (
                <div key={item.label} className="relative group" data-dock-item>
                  {active && (
                    <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] z-20 pointer-events-none" />
                  )}

                  <Link
                    href={item.href || "#"}
                    onClick={onItemClick}
                    className={clsx(
                      "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 relative shadow-sm",
                      active
                        ? "bg-white/25 ring-2 ring-cyan-400/80 text-white shadow-lg shadow-cyan-950/40 scale-105"
                        : "bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white hover:scale-105 hover:shadow-md"
                    )}
                    aria-label={item.label}
                  >
                    {item.iconChip ? (
                      <span className={clsx("w-7 h-7 rounded-xl flex items-center justify-center shadow-inner", item.iconChip)}>
                        <Icon className="w-4 h-4" />
                      </span>
                    ) : (
                      <Icon className={clsx("w-5 h-5", active ? "text-cyan-300 drop-shadow" : groupIconColor)} />
                    )}
                  </Link>

                  {/* Tooltip nổi khi hover */}
                  <div className="absolute left-[48px] top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl text-xs font-semibold text-white whitespace-nowrap invisible opacity-0 -translate-x-2 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 pointer-events-none">
                    {item.label}
                  </div>
                </div>
              );
            }

            // Chế độ Full Sidebar cho Item đơn lẻ
            return (
              <div key={item.label} className="mb-1">
                <Link
                  href={item.href || "#"}
                  onClick={onItemClick}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-150",
                    !item.noAccentBar && "border-l-2",
                    active
                      ? `${groupBorderColor} ${activeBg} ${activeText}`
                      : singleIdleClasses
                  )}
                >
                  {item.iconChip ? (
                    <span className={clsx("shrink-0 flex items-center justify-center rounded-lg transition-transform duration-150", item.iconChip)}>
                      <Icon className="w-[15px] h-[15px]" />
                    </span>
                  ) : (
                    <Icon className={clsx("w-[18px] h-[18px] shrink-0 transition-colors", active ? groupIconColor : (item.idleIcon || "text-slate-400"))} />
                  )}
                  <span className="flex-1 tracking-wide">{item.label}</span>
                </Link>
              </div>
            );
          })
        )}
      </nav>

      {/* Footer Sidebar / Dock */}
      <div className={clsx("p-2 border-t border-white/10 flex items-center", isCollapsed ? "justify-center" : "justify-between px-3 py-2.5")}>
        {!isCollapsed ? (
          <>
            <span className="text-[11px] font-medium text-slate-300">© 2026 Polo Mimin</span>
            {toggleCollapse && (
              <button
                onClick={toggleCollapse}
                className="hidden md:flex p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Thu gọn Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          toggleCollapse && (
            <button
              onClick={toggleCollapse}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="Mở rộng Sidebar (Chế độ đầy đủ)"
              aria-label="Mở rộng Sidebar"
            >
              <PanelLeftOpen className="w-5 h-5 text-cyan-300" />
            </button>
          )
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
    else if (saved === "false") setIsCollapsed(false);
    else if (window.innerWidth < 1280) setIsCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mimin-sidebar-collapsed", String(isCollapsed));
    }
  }, [isCollapsed]);

  // Auto-collapse when clicking outside the sidebar (on the main content)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!isCollapsed && target && !target.closest("aside")) {
        // Tự động đóng sidebar khi click ra ngoài trên các màn hình vừa (iPad)
        if (window.innerWidth >= 768 && window.innerWidth < 1280) {
          setIsCollapsed(true);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCollapsed]);
  
  // Không render sidebar ở trang login hoặc register
  if (pathname === "/login" || pathname === "/register" || pathname?.startsWith("/lark-login")) {
    return null;
  }

  return (
    <aside 
      className={clsx(
        "hidden md:flex flex-col h-screen sticky top-0 bg-[#0B4D5D] text-white border-r border-white/10 z-40 shadow-sm transition-all duration-300 select-none",
        isCollapsed ? "w-[68px]" : "w-64"
      )}
    >
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
