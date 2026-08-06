"use client";
// Helper component: chi admin moi xem duoc
// Su dung cho cac trang test/internal
// Redirect ve /dashboard neu khong phai admin

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session-provider";
import { ShieldAlert } from "lucide-react";

// 3 admin email (theo login page + AI tools)
const ADMIN_EMAILS = ["sang@mimin.vn", "hoa@mimin.vn", "phi@mimin.vn"];

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !isAdmin(user.email)) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-slate-400">Đang kiểm tra quyền...</div>
      </div>
    );
  }

  if (!isAdmin(user?.email)) {
    return (
      fallback || (
        <div className="card p-8 text-center max-w-md mx-auto mt-12">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-amber-500" />
          <h2 className="text-lg font-bold mb-1">Không có quyền truy cập</h2>
          <p className="text-sm text-slate-500">
            Trang này chỉ dành cho admin. Đang chuyển về Dashboard...
          </p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
