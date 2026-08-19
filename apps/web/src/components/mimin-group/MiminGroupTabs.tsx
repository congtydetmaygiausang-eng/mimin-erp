"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Newspaper, ShoppingBag, Compass, MessageCircle, CircleUserRound } from "lucide-react";

const TABS = [
  { href: "/bang-tin", label: "Bảng tin", icon: Newspaper, bg: "bg-sky-500" },
  { href: "/kho-mau", label: "Kho mẫu", icon: ShoppingBag, bg: "bg-amber-500" },
  { href: "/kham-pha", label: "Khám phá", icon: Compass, bg: "bg-emerald-500" },
  { href: "/tin-nhan", label: "Tin nhắn", icon: MessageCircle, bg: "bg-[#0B4D5D]" },
  { href: "/ca-nhan", label: "Cá nhân", icon: CircleUserRound, bg: "bg-[#0B4D5D]" },
];

export function MiminGroupTabs() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: hàng nút cuộn ngang phía trên nội dung */}
      <div className="hidden md:flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition shrink-0 ${
                active
                  ? "bg-white dark:bg-slate-800 ring-1 ring-black/10 dark:ring-white/10 shadow-sm text-slate-900 dark:text-white"
                  : "bg-white/60 dark:bg-white/5 text-slate-900 dark:text-white opacity-80 hover:opacity-100"
              }`}
            >
              <span className={`w-6 h-6 rounded-full ${tab.bg} flex items-center justify-center shrink-0`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Mobile: thanh điều hướng cố định dưới cùng màn hình, kiểu Zalo */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-black/10 dark:border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center px-1 py-1.5 max-w-3xl mx-auto">
          {TABS.map((tab) => {
            const active = pathname?.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all min-w-[60px] ${active ? "scale-105" : "opacity-70"}`}
              >
                <span className={`w-8 h-8 rounded-full ${tab.bg} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4.5 h-4.5 text-white" />
                </span>
                <span className="text-[11px] font-medium text-slate-900 dark:text-white">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
