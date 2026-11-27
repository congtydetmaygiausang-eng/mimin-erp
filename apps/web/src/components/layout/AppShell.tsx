"use client";

import { useSession } from "@/components/session-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar, MobileMenu as MobileSidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { FloatingAI } from "@/components/FloatingAI";

export function AppShell({ children, moduleClass = "bg-module-default" }: { children: React.ReactNode; moduleClass?: string }) {
  const { user, loading, signOut } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-pulse text-muted-foreground flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
          Đang tải dữ liệu MIMIN ERP…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-pulse text-muted-foreground font-medium text-sm">
          Đang xác thực tài khoản…
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[100dvh] w-full overflow-hidden flex ${moduleClass}`}>
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex print:hidden">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar */}
      <div className="print:hidden">
        <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden print:overflow-visible print:h-auto print:block">
        <div className="print:hidden">
          <TopBar user={user} onSignOut={signOut} onMenuClick={() => setMobileOpen(true)} />
        </div>
        
        <main className="relative flex-1 p-2.5 sm:p-4 md:p-6 lg:p-8 pb-24 md:pb-10 overflow-x-hidden overflow-y-auto animate-page-entry bg-transparent w-full print:p-0 print:overflow-visible print:h-auto print:block print:bg-white">
          {children}
        </main>

        <div className="print:hidden">
          <BottomNav onMenuClick={() => setMobileOpen(true)} />
        </div>
      </div>

      <div className="print:hidden">
        <FloatingAI />
      </div>
    </div>
  );
}
