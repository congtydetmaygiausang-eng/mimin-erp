"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, CheckSquare, Wallet, User } from "lucide-react";

/**
 * Mobile Bottom Navigation - dùng cho các trang gia công mobile
 * Style: gradient xanh-trắng, text to + bold (mobile-friendly)
 */
export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/trang-chu-gia-cong", label: "Trang chủ", icon: Home },
    { href: "/cong-viec", label: "Công việc", icon: ClipboardList },
    { href: "/ban-giao", label: "Bàn giao", icon: CheckSquare },
    { href: "/tien-cong", label: "Tiền công", icon: Wallet },
    { href: "/profile", label: "Cá nhân", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav-gradient-bottom shadow-[0_-4px_20px_rgba(14,165,233,0.08)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center px-1 py-1.5 max-w-3xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition-all min-w-[60px] ${
                isActive
                  ? "text-sky-700 bg-white/60 shadow-sm scale-105"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
              <span className={`mobile-nav-text-sm ${isActive ? "text-sky-700" : "text-slate-600"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
