"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, FileText, ShoppingBag, Wallet, CreditCard, History } from "lucide-react";

const TABS = [
  { href: "/nha-cung-cap", label: "Tổng quan", icon: Building2 },
  { href: "/nha-cung-cap/hop-dong", label: "Hợp đồng", icon: FileText },
  { href: "/nha-cung-cap/giao-dich-mua", label: "Giao dịch mua NCC", icon: ShoppingBag },
  { href: "/nha-cung-cap/cong-no-tong", label: "Công nợ tổng", icon: Wallet },
  { href: "/nha-cung-cap/thanh-toan", label: "Thanh toán", icon: CreditCard },
  { href: "/nha-cung-cap/lich-su", label: "Lịch sử hoạt động", icon: History },
];

export default function NhaCungCapLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4 animate-fade-in">
      <nav className="card p-1.5 sticky top-0 z-30 overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = href === "/nha-cung-cap" ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active ? "bg-brand-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"}`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
      {children}
    </div>
  );
}
