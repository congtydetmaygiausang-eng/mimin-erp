"use client";

// ============================================
// HorizontalNav - Top Navigation 2 HÀNG
// Redesign 2026-08-06: thay the Sidebar doc
// Hàng 1: Logo + 5 nhom menu lon + Search + User
// Hàng 2: Sub-menu ngang cua nhom dang active
// ============================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Factory, Boxes, Wallet, Database,
  Search, LogOut, Bell, Sun, Moon, ChevronRight
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session-provider";
import GlobalSearch from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { DemoBanner } from "@/components/DemoBanner";

type SubItem = { href: string; label: string; icon?: any };
type NavGroup = {
  id: string;
  label: string;
  icon: any;
  color: string; // gradient
  iconColor: string; // icon color
  items: SubItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "tong-quan",
    label: "Tổng Quan",
    icon: LayoutDashboard,
    color: "from-cyan-500 to-blue-600",
    iconColor: "text-blue-400",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/bang-dieu-hanh-sx", label: "Bảng điều hành SX" },
      { href: "/realtime", label: "Real-time" },
      { href: "/canh-bao", label: "Cảnh báo" },
    ],
  },
  {
    id: "san-xuat",
    label: "Sản Xuất & Kế hoạch",
    icon: Factory,
    color: "from-teal-500 to-emerald-600",
    iconColor: "text-teal-400",
    items: [
      { href: "/ke-hoach-san-xuat", label: "Kế hoạch SX" },
      { href: "/lenh-cat", label: "Lệnh cắt" },
      { href: "/hoan-thien", label: "Hoàn thiện" },
      { href: "/gia-cong-ngoai", label: "Gia công ngoài" },
      { href: "/trang-chu-gia-cong", label: "Trang chủ gia công" },
    ],
  },
  {
    id: "kho",
    label: "Kho & Giao Hàng",
    icon: Boxes,
    color: "from-sky-500 to-cyan-600",
    iconColor: "text-sky-400",
    items: [
      { href: "/kho-vai-tinhmann", label: "Kho vải" },
      { href: "/kho-phu-lieu", label: "Kho phụ liệu" },
      { href: "/kho-thanh-pham", label: "Kho thành phẩm" },
      { href: "/giao-hang", label: "Giao hàng" },
      { href: "/van-chuyen", label: "Vận chuyển" },
    ],
  },
  {
    id: "ke-toan",
    label: "Kế Toán & Mua Bán",
    icon: Wallet,
    color: "from-emerald-500 to-green-600",
    iconColor: "text-emerald-400",
    items: [
      { href: "/cham-cong", label: "Chấm công" },
      { href: "/bang-luong", label: "Bảng lương" },
      { href: "/doi-soat-tien-cong", label: "Đối soát tiền công" },
      { href: "/cong-no", label: "Công nợ công đoạn" },
      { href: "/don-hang", label: "Đơn hàng" },
      { href: "/bang-gia", label: "Bảng giá bán" },
    ],
  },
  {
    id: "danh-muc",
    label: "Danh Mục Dữ Liệu",
    icon: Database,
    color: "from-blue-500 to-indigo-600",
    iconColor: "text-indigo-400",
    items: [
      { href: "/danh-muc-sp", label: "Danh mục sản phẩm" },
      { href: "/nhan-su", label: "Nhân sự" },
      { href: "/khach-hang", label: "Khách hàng" },
      { href: "/nha-cung-cap", label: "Nhà cung cấp" },
      { href: "/doi-tac-gia-cong", label: "Đối tác gia công" },
      { href: "/cong-nhan-gia-cong", label: "Công nhân gia công" },
      { href: "/master-data", label: "Master Data" },
    ],
  },
  {
    id: "he-thong",
    label: "Hệ Thống (Dev)",
    icon: Boxes,
    color: "from-slate-500 to-slate-700",
    iconColor: "text-slate-400",
    items: [
      { href: "/quan-ly-tai-khoan", label: "Quản lý tài khoản" },
      { href: "/phan-quyen-tuy-chinh", label: "Phân quyền tùy chỉnh" },
      { href: "/ai-assistant", label: "AI Assistant" },
      { href: "/agents", label: "Agents Dashboard" },
      { href: "/audit-log", label: "Nhật ký hệ thống" },
      { href: "/backup-restore", label: "Sao lưu dữ liệu" },
    ],
  },
];

export function HorizontalNav() {
  const pathname = usePathname();
  const { user, signOut } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Auto-detect active group tu pathname
  const activeGroupId = (() => {
    for (const g of NAV_GROUPS) {
      if (g.items.some((it) => pathname?.startsWith(it.href))) return g.id;
    }
    return "tong-quan"; // default
  })();

  const activeGroup = NAV_GROUPS.find((g) => g.id === activeGroupId) || NAV_GROUPS[0];

  return (
    <header className="sticky top-0 z-30 shadow-md bg-[#0a3a46] border-b border-[#0d4a59] flex flex-col">
      {user && <DemoBanner user={user} />}

      {/* === HÀNG 1: Tìm kiếm, Thông báo, Theme, Avatar === */}
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 h-14 border-b border-[#0d4a59]">
        <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white font-extrabold text-sm shadow-sm border border-white/20 overflow-hidden">
            <img src="/logo.png" alt="MIMIN" className="w-full h-full object-cover p-0.5" />
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-base font-black text-white drop-shadow-sm">MIMIN ERP</div>
            <div className="text-xs text-white/80 font-medium">Quản lý may mặc</div>
          </div>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          <button
            className="p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Đổi theme"
          >
            {mounted && theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <RoleSwitcher />
          <NotificationBell />
          {user && (
            <div className="flex items-center gap-2 pl-3 border-l border-[#0d4a59]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {user.name?.charAt(0) || "U"}
              </div>
              <div className="hidden xl:block leading-tight">
                <div className="text-sm font-bold text-white">{user.name}</div>
                <div className="text-xs text-white/70">{user.title}</div>
              </div>
              <button
                onClick={async () => {
                  await signOut();
                  router.replace("/login");
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-red-400 hover:text-red-300 transition ml-1"
                aria-label="Đăng xuất"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === HÀNG 2: MODULES === */}
      <div className="flex items-center gap-2 px-3 sm:px-4 md:px-6 h-14 overflow-x-auto border-b border-[#0d4a59] bg-[#0a3a46]">
        {NAV_GROUPS.map((g) => {
          const Icon = g.icon;
          const active = g.id === activeGroupId;
          return (
            <button
              key={g.id}
              onClick={() => {
                if (g.items[0]) router.push(g.items[0].href);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition shrink-0 border ${
                active
                  ? `bg-gradient-to-r ${g.color} text-white shadow-md border-transparent`
                  : "bg-white/5 text-white/80 border-white/10 hover:bg-white/15 hover:text-white"
              }`}
              title={g.label}
            >
              <Icon className={`w-4 h-4 ${active ? "" : g.iconColor}`} />
              <span>{g.label}</span>
            </button>
          );
        })}
      </div>

      {/* === HÀNG 3: TABS CỦA MODULE === */}
      <div className="bg-[#072f38] border-b border-[#0d4a59]">
        <div className="max-w-full px-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-2 h-12 overflow-x-auto">
            {activeGroup.items.map((it) => {
              const active = pathname === it.href || pathname === `${it.href}/` || pathname?.startsWith(`${it.href}/`);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition shrink-0 flex items-center gap-1 border ${
                    active
                      ? `bg-gradient-to-r ${activeGroup.color} text-white shadow-sm border-transparent border-b-4 border-b-white`
                      : "bg-transparent text-white/70 border-transparent hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {it.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
