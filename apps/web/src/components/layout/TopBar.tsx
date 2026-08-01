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
    <header className="sticky top-0 z-30 mobile-nav-gradient shadow-[0_2px_12px_rgba(14,165,233,0.06)] md:glass md:border-b" style={{ borderColor: "var(--border)" }}>
      <DemoBanner user={user} />
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 h-14">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-1 rounded-lg hover:bg-white/40 dark:hover:bg-white/10 transition"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
        )}
        <div className="md:hidden mobile-nav-text text-sky-700">MIMIN</div>
        <GlobalSearch />
        <div className="flex-1 sm:flex-none" />
        <button
          className="p-2 rounded-lg hover:bg-white/30 dark:hover:bg-white/5 transition"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Đổi theme"
        >
          {mounted && theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <RoleSwitcher />
        <NotificationBell />
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l" style={{ borderColor: "var(--border)" }}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-sm font-semibold">
            {user.name?.charAt(0) || "U"}
          </div>
          <div className="hidden lg:block leading-tight">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{user.title}</div>
          </div>
          <button
            onClick={async () => {
              await onSignOut();
              router.replace("/login");
            }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-600 transition"
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
