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
  items: SubItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "tong-quan",
    label: "Tổng Quan",
    icon: LayoutDashboard,
    color: "from-cyan-500 to-blue-600",
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
    color: "from-violet-500 to-purple-600",
    items: [
      { href: "/ke-hoach-san-xuat", label: "Kế hoạch SX" },
      { href: "/lenh-cat", label: "Lệnh cắt" },
      { href: "/may", label: "Tổ may" },
      { href: "/hoan-thien", label: "Hoàn thiện" },
      { href: "/qc", label: "Kiểm tra CL" },
      { href: "/gia-cong-ngoai", label: "Gia công ngoài" },
      { href: "/trang-chu-gia-cong", label: "Trang chủ gia công" },
    ],
  },
  {
    id: "kho",
    label: "Kho & Giao Hàng",
    icon: Boxes,
    color: "from-amber-500 to-orange-600",
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
    items: [
      { href: "/cham-cong", label: "Chấm công" },
      { href: "/bang-luong", label: "Bảng lương" },
      { href: "/doi-soat-tien-cong", label: "Đối soát tiền công" },
      { href: "/cong-no", label: "Công nợ công đoạn" },
      { href: "/don-hang", label: "Đơn hàng" },
    ],
  },
  {
    id: "danh-muc",
    label: "Danh Mục Dữ Liệu",
    icon: Database,
    color: "from-rose-500 to-pink-600",
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
    <header className="sticky top-0 z-30 shadow-md bg-white/95 backdrop-blur-md border-b border-slate-200">
      {user && <DemoBanner user={user} />}

      {/* === HANG 1: Logo + Nhom menu + Search + User === */}
      <div className="flex items-center gap-2 px-3 sm:px-4 md:px-6 h-14">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
            M
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-extrabold text-slate-800">MIMIN ERP</div>
            <div className="text-[10px] text-slate-500">Quản lý may mặc</div>
          </div>
        </Link>

        {/* 6 nhom menu chinh - ngang, scrollable */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1">
          {NAV_GROUPS.map((g) => {
            const Icon = g.icon;
            const active = g.id === activeGroupId;
            return (
              <button
                key={g.id}
                onClick={() => {
                  // Click vao group -> navigate den item dau tien
                  if (g.items[0]) router.push(g.items[0].href);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition shrink-0 ${
                  active
                    ? `bg-gradient-to-r ${g.color} text-white shadow-md`
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                title={g.label}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{g.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Search + Theme + Role + Notif + User */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          <button
            className="p-2 rounded-lg hover:bg-slate-100 transition"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Đổi theme"
          >
            {mounted && theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <RoleSwitcher />
          <NotificationBell />
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {user.name?.charAt(0) || "U"}
              </div>
              <div className="hidden xl:block leading-tight">
                <div className="text-xs font-semibold text-slate-800">{user.name}</div>
                <div className="text-[10px] text-slate-500">{user.title}</div>
              </div>
              <button
                onClick={async () => {
                  await signOut();
                  router.replace("/login");
                }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition"
                aria-label="Đăng xuất"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === HANG 2: Sub-menu cua nhom active === */}
      <div className={`bg-gradient-to-r ${activeGroup.color} text-white`}>
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-2 h-10 overflow-x-auto">
            <span className="text-[11px] uppercase font-extrabold opacity-80 mr-1 shrink-0">
              {activeGroup.label}:
            </span>
            {activeGroup.items.map((it) => {
              const active = pathname === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition shrink-0 flex items-center gap-1 ${
                    active
                      ? "bg-white text-slate-800 shadow-md"
                      : "text-white/90 hover:bg-white/20"
                  }`}
                >
                  {active && <ChevronRight className="w-3 h-3" />}
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
