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
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <DemoBanner user={user} />
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 h-14">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5 text-slate-800 dark:text-slate-200" />
          </button>
        )}
        <div className="md:hidden font-black text-xl tracking-tight text-brand-700 dark:text-brand-400">MIMIN</div>
        <GlobalSearch />
        
        {/* Đẩy các nút sang phải */}
        <div className="flex-1" />
        
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Đổi theme"
          >
            {mounted && theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <NotificationBell />
          
          {/* <RoleSwitcher /> - Đã ẩn theo yêu cầu bố cục mới */}
          
          <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-700">
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-brand-100 dark:ring-brand-900">
              {user.name?.charAt(0) || "U"}
            </div>
            <div className="hidden lg:block leading-tight">
            <div className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{user.title}</div>
          </div>
          <button
            onClick={async () => {
              await onSignOut();
              router.replace("/login");
            }}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors ml-1"
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        </div>
      </div>
    </header>
  );
}
