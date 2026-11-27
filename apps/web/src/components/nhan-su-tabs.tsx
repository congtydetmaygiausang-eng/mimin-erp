"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users, type LucideIcon } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { canView, type Module } from "@/lib/permissions";
import { usePermissionRevision } from "@/lib/use-permission-revision";

const tabs: ReadonlyArray<{ href: string; label: string; icon: LucideIcon; permModule: Module }> = [
  { href: "/nhan-su/", label: "Hồ sơ nhân sự", icon: Users, permModule: "nhan-su" },
  { href: "/cham-cong/", label: "Chấm công", icon: CalendarDays, permModule: "cham-cong" },
];

export function NhanSuTabs() {
  const pathname = usePathname();
  const { user } = useSession();
  usePermissionRevision();

  const visibleTabs = tabs.filter((tab) => canView(user?.role, tab.permModule));
  if (visibleTabs.length <= 1) return null;

  return (
    <nav aria-label="Quản lý nhân sự" className="card flex w-full sm:w-fit max-w-full gap-1 overflow-x-auto no-scrollbar tab-scroll-mobile p-1">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname.startsWith(tab.href.replace(/\/$/, ""));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 whitespace-nowrap items-center gap-1.5 sm:gap-2 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition ${
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
