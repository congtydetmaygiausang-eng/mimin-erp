"use client";

import { Sun, Moon, LogOut, Menu, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import GlobalSearch from "@/components/GlobalSearch";
import type { AppUser } from "@/components/session-provider";
import { DemoBanner } from "@/components/DemoBanner";
import { NotificationBell } from "@/components/NotificationBell";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { InstallPWAButton } from "@/components/InstallPWAButton";
import { NotificationToggle } from "@/components/notification/NotificationToggle";

export function TopBar({ user, onSignOut, onMenuClick }: { user: AppUser; onSignOut: () => Promise<void>; onMenuClick?: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 bg-[#0B4D5D] text-white border-b border-white/10 shadow-sm">
      <DemoBanner user={user} />
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 h-14">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Mở menu"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
        )}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 border border-white/20 shadow-lg shadow-white/5 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="MIMIN" className="w-full h-full object-cover p-0.5" />
          </div>
          <div className="font-black text-2xl tracking-widest text-white drop-shadow-md bg-gradient-to-r from-white to-cyan-200 text-transparent bg-clip-text">MIMIN</div>
        </div>
        
        <GlobalSearch />
        
        {/* Đẩy các nút sang phải */}
        <div className="flex-1" />
        
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Nút Tạo Nhanh (Quick Create) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                const event = new KeyboardEvent("keydown", { ctrlKey: true, key: "k" });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 hover:text-white border border-teal-400/30 text-xs font-semibold transition-all shadow-sm active:scale-95"
              title="Tìm kiếm nhanh & Lệnh (Ctrl + K)"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>Tìm nhanh</span>
              <kbd className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-mono text-teal-200 ml-1">⌘K</kbd>
            </button>
          </div>

          <InstallPWAButton />
          
          <button
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-200 hover:text-white"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Đổi theme"
            title={mounted && theme === "dark" ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
          >
            {mounted && theme === "dark" ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>
          
          <NotificationToggle />
          
          <NotificationBell />
          
          {/* User Menu Dropdown */}
          <UserMenu user={user} onSignOut={onSignOut} />
        </div>
      </div>
    </header>
  );
}

function UserMenu({ user, onSignOut }: { user: AppUser; onSignOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleClose = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#user-menu-container")) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("click", handleClose);
      return () => document.removeEventListener("click", handleClose);
    }
  }, [open]);

  return (
    <div className="relative pl-1 sm:pl-2 border-l border-white/10 shrink-0" id="user-menu-container">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-all text-left"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-full bg-teal-600/60 border border-teal-400/40 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-1 ring-white/20 shrink-0">
          {user.name?.charAt(0) || "U"}
        </div>
        <div className="hidden lg:block leading-tight pr-1">
          <div className="text-xs font-bold text-white truncate max-w-[120px]">{user.name}</div>
          <div className="text-[10px] text-teal-200 truncate max-w-[120px]">{user.title || "Quản trị viên"}</div>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-fade-in text-slate-700 dark:text-slate-200">
          <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email || user.username}</div>
            <div className="mt-1 inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              {user.title || "Thành viên"}
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false);
                router.push("/profile");
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
            >
              <span>Hồ sơ cá nhân</span>
            </button>
            <button
              onClick={() => {
                setOpen(false);
                router.push("/cai-dat");
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
            >
              <span>Cài đặt hệ thống</span>
            </button>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
            <button
              onClick={async () => {
                setOpen(false);
                await onSignOut();
                router.replace("/login");
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
