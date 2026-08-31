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
          <InstallPWAButton />
          
          <button
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white hidden sm:block"
            onClick={() => {
              localStorage.removeItem("mimin_hide_ai");
              window.dispatchEvent(new Event("mimin_restore_ai"));
              toast.success("Đã bật lại MIMIN AI!");
            }}
            title="Bật lại MIMIN AI (nếu đã ẩn)"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white hidden sm:block"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Đổi theme"
          >
            {mounted && theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <NotificationBell />
          
          {/* <RoleSwitcher /> - Đã ẩn theo yêu cầu bố cục mới */}
          
          <div className="flex items-center gap-1 sm:gap-3 pl-1.5 sm:pl-3 border-l border-white/10 shrink-0">
            <div className="hidden sm:flex w-9 h-9 rounded-full bg-white/20 items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-white/10 shrink-0">
              {user.name?.charAt(0) || "U"}
            </div>
            <div className="hidden lg:block leading-tight">
            <div className="text-sm font-bold text-white">{user.name}</div>
            <div className="text-xs font-medium text-slate-300">{user.title}</div>
          </div>
          <button
            onClick={async () => {
              await onSignOut();
              router.replace("/login");
            }}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-red-500/20 text-red-300 transition-colors shrink-0"
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
