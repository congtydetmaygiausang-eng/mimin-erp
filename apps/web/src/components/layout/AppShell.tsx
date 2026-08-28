"use client";

import { useSession } from "@/components/session-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar, MobileMenu as MobileSidebar } from "./Sidebar";
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
    <div className={`min-h-screen flex ${moduleClass}`}>
      {/* Sidebar for Desktop */}
      <Sidebar />
      
      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        <TopBar user={user} onSignOut={signOut} onMenuClick={() => setMobileOpen(true)} />
        
        <main className="flex-1 p-4 sm:p-5 md:p-6 lg:p-8 pb-24 md:pb-10 overflow-x-hidden overflow-y-auto animate-page-entry bg-transparent w-full">
          {children}
        </main>
      </div>

      <FloatingAI />
    </div>
  );
}
