"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session-provider";
import { getDefaultLandingRoute } from "@/lib/permissions";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    // 1. Kiểm tra nhanh localStorage để điều hướng ngay lập tức không cần đợi nạp toàn bộ context
    try {
      const sessRaw = localStorage.getItem("mimin_erp_session_ttl") || localStorage.getItem("mimin_erp_session");
      if (sessRaw) {
        const parsed = JSON.parse(sessRaw);
        const u = parsed.user || parsed;
        if (u?.role) {
          const target = getDefaultLandingRoute(u.role);
          const withSlash = target.endsWith("/") ? target : `${target}/`;
          router.replace(withSlash);
          return;
        }
      }
    } catch {}

    if (loading) return;
    if (!user) {
      router.replace("/login/");
      return;
    }
    const target = getDefaultLandingRoute(user.role);
    const withSlash = target.endsWith("/") ? target : `${target}/`;
    router.replace(withSlash);
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-semibold text-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping" />
        Đang tải hệ thống MIMIN ERP…
      </div>
    </div>
  );
}
