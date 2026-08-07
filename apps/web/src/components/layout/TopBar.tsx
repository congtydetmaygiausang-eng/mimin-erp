"use client";

import { Sun, Moon, LogOut, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlobalSearch from "@/components/GlobalSearch";
import type { AppUser } from "@/components/session-provider";
import { DemoBanner } from "@/components/DemoBanner";
import { NotificationBell } from "@/components/NotificationBell";
import { RoleSwitcher } from "@/components/RoleSwitcher";

export function TopBar({ user, onSignOut, onMenuClick }: { user: AppUser; onSignOut: () => Promise<void>; onMenuClick?: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 bg-white/70 dark:bg-[#0b0f19]/70 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
      <DemoBanner user={user} />
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 h-14">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        )}
        <div className="md:hidden font-semibold text-lg tracking-tight text-slate-700 dark:text-slate-200">MIMIN</div>
        <GlobalSearch />
        <div className="flex-1 sm:flex-none" />
        <button
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-slate-600 dark:text-slate-400"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Đổi theme"
        >
          {mounted && theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <RoleSwitcher />
        <NotificationBell />
        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 text-sm font-medium border border-slate-200/50 dark:border-slate-700/50">
            {user.name?.charAt(0) || "U"}
          </div>
          <div className="hidden lg:block leading-tight">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{user.title}</div>
          </div>
          <button
            onClick={async () => {
              await onSignOut();
              router.replace("/login");
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 hover:text-red-600 transition-colors ml-1"
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
