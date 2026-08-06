"use client";

import { useSession } from "@/components/session-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MobileMenu as MobileSidebar } from "./Sidebar";
import { HorizontalNav } from "./HorizontalNav";
import { FloatingAI } from "@/components/FloatingAI";

export function AppShell({ children, moduleClass = "bg-module-default" }: { children: React.ReactNode; moduleClass?: string }) {
  const { user, loading } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Đang tải…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`min-h-screen ${moduleClass}`}>
      {/* Mobile menu (chỉ hiện trên mobile) */}
      <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Top Navigation 2 hàng - thay thế Sidebar */}
      <HorizontalNav />

      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-8 overflow-x-hidden animate-page-entry md:bg-transparent bg-gradient-to-b from-cyan-50/40 via-white/60 to-sky-50/30">
        {children}
      </main>

      <FloatingAI />
    </div>
  );
}
