"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Scissors,
  ClipboardList,
  Boxes,
  Menu,
  Bell,
  Shirt,
  CheckCircle2,
  Palette
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { canView } from "@/lib/permissions";
import clsx from "clsx";
import { useMemo } from "react";

export function BottomNav({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { user } = useSession();
  const role = user?.role;

  // Xử lý link "Công việc" cho công nhân
  const workLink = useMemo(() => {
    if (user?.laCongNhan) {
      const boPhan = user.phongBan?.toLowerCase() || "";
      if (boPhan.includes("cắt")) return { href: "/to-cat-work", label: "Cắt", icon: Scissors };
      if (boPhan.includes("may")) return { href: "/to-may-work", label: "May", icon: Shirt };
      if (boPhan.includes("ủi") || boPhan.includes("gấp xếp") || boPhan.includes("hoàn thiện") || boPhan.includes("đóng gói")) 
        return { href: "/to-ht-work", label: "Hoàn thiện", icon: ClipboardList };
      if (boPhan.includes("khuy nút")) return { href: "/ui-khuy-nut", label: "Khuy nút", icon: CheckCircle2 };
      if (boPhan.includes("in") || boPhan.includes("thêu")) return { href: "/ui-intd", label: "In/Thêu", icon: Palette };
    }
    // Mặc định cho vai trò khác
    if (canView(role, "lenh-cat")) return { href: "/lenh-cat", label: "Lệnh cắt", icon: Scissors };
    return null;
  }, [user, role]);

  const navItems = [
    { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard, perm: "dashboard" },
    ...(workLink ? [workLink] : []),
    { href: "/kho-thanh-pham", label: "Kho", icon: Boxes, perm: "kho-thanh-pham" },
    { href: "/canh-bao", label: "Cảnh báo", icon: Bell, perm: "bao-cao" }
  ];

  // Lọc theo quyền
  const visibleItems = navItems.filter(item => {
    if (!item.perm) return true; // Các item như workLink đã được check quyền ở trên
    return canView(role, item.perm);
  }).slice(0, 4); // Chỉ lấy tối đa 4 nút để dành nút thứ 5 cho Menu

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-t border-slate-700/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item, index) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={index}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon className={clsx("w-5 h-5", isActive && "scale-110")} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Nút Menu luôn hiển thị */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">Menu</span>
        </button>
      </div>
    </div>
  );
}
