"use client";

// @codex MIMIN GROUP - shell 7 tab ngang, dùng chung cho toàn bộ phân hệ Mạng lưới đối tác.

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  Boxes,
  ShieldCheck,
  Sparkles,
  Link2,
  Search,
  Building2,
} from "lucide-react";

const TABS: { href: string; label: string; icon: typeof LayoutDashboard }[] = [
  { href: "/mang-luoi-san-xuat", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/mang-luoi-san-xuat/tim-doi-tac", label: "Tìm đối tác AI", icon: Search },
  { href: "/mang-luoi-san-xuat/danh-ba-doi-tac", label: "Danh bạ đối tác", icon: Building2 },
  { href: "/mang-luoi-san-xuat/co-hoi-hop-tac", label: "Cơ hội hợp tác", icon: Link2 },
];

export default function MiminGroupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card p-1.5 sticky top-0 z-30">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = tab.href === "/mang-luoi-san-xuat"
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
