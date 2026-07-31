"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, CheckSquare, Wallet, User } from "lucide-react";

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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 px-2 py-1 shadow-lg">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs transition-colors ${
                isActive ? "text-sky-600 font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
