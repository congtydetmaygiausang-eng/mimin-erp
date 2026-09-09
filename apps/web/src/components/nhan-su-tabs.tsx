"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users } from "lucide-react";

const tabs = [
  { href: "/nhan-su/", label: "Hồ sơ nhân sự", icon: Users },
  { href: "/cham-cong/", label: "Chấm công", icon: CalendarDays },
];

export function NhanSuTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Quản lý nhân sự" className="card flex w-fit max-w-full gap-1 overflow-x-auto p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname.startsWith(tab.href.replace(/\/$/, ""));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-teal-600 text-white shadow-sm"
                : "hover:bg-white/50 dark:hover:bg-white/10"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
