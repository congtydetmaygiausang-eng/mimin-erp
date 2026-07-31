"use client";

import { useSession } from "@/components/session-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { FloatingAI } from "@/components/FloatingAI";

export function AppShell({ children, moduleClass = "bg-module-default" }: { children: React.ReactNode; moduleClass?: string }) {
  const { user, loading, signOut } = useSession();
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
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <TopBar user={user} onSignOut={signOut} onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden animate-page-entry">{children}</main>
        </div>
      </div>
      <FloatingAI />
    </div>
  );
}
