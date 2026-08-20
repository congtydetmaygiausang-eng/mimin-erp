"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/components/session-provider";
import { canView, type Module } from "@/lib/permissions";
import { logAudit } from "@/lib/audit-log";
import { Lock, ShieldCheck, Loader2 } from "lucide-react";

// Map tất cả 50+ routes -> module (mở rộng để fix lỗ hổng)
const ROUTE_TO_MODULE: { match: string; module: Module }[] = [
  // Core
  { match: "/dashboard",       module: "dashboard" },
  { match: "/lenh-cat",        module: "lenh-cat" },
  { match: "/khach-hang",      module: "khach-hang" },
  { match: "/ke-hoach-san-xuat", module: "ke-hoach-sx" },
  { match: "/nhan-su",         module: "nhan-su" },
  // Kho
  { match: "/kho-vai-tinhmann", module: "kho-vai" },
  { match: "/kho-phu-lieu",    module: "kho-phu-lieu" },
  { match: "/kho-thanh-pham",  module: "kho-thanh-pham" },
  { match: "/kho-soi-day-chuyen", module: "kho-vai" },
  { match: "/kho",             module: "kho-vai" },
  // Sản xuất
  { match: "/may",             module: "to-may" },
  { match: "/hoan-thien",      module: "hoan-thien" },
  { match: "/qc",              module: "kiem-tra-chat-luong" },
  { match: "/workflow",        module: "lenh-cat" },
  { match: "/tong-hop-cong-doan", module: "bao-cao" },
  { match: "/lenh-tong",       module: "ke-hoach-sx" },
  { match: "/san-xuat-erp",    module: "ke-hoach-sx" },
  { match: "/so-det-nhuom",    module: "kho-vai" },
  { match: "/soi-det-nhuom-erp", module: "kho-vai" },
  { match: "/mini-soi-det",    module: "kho-vai" },
  { match: "/det-nhuom-flow",  module: "kho-vai" },
  { match: "/flow-tong-quan",  module: "kho-vai" },
  { match: "/lsx-m758-demo",   module: "ke-hoach-sx" },
  { match: "/role-workspaces", module: "nhan-su" },
  // Bán hàng
  { match: "/don-hang",        module: "don-hang" },
  { match: "/khach-hang",      module: "khach-hang" },
  // Kho + giao
  { match: "/giao-hang",       module: "giao-hang" },
  { match: "/nha-cung-cap",    module: "nha-cung-cap" },
  { match: "/master-data",     module: "nha-cung-cap" },
  { match: "/doi-tac-gia-cong", module: "nha-cung-cap" },
  { match: "/gia-cong-ngoai",  module: "gia-cong-ngoai" },
  // Tài chính
  { match: "/cong-no",         module: "cong-no-cong-doan" },
  { match: "/bang-luong",      module: "bang-luong" },
  { match: "/bang-luong-auto", module: "bang-luong" },
  { match: "/cham-cong",       module: "cham-cong" },
  // Cài đặt + Admin
  { match: "/bao-cao",         module: "bao-cao" },
  { match: "/realtime",        module: "realtime" },
  { match: "/audit-log",       module: "cai-dat" },
  { match: "/phan-quen-cua-toi", module: "cai-dat" },
  { match: "/quan-ly-tai-khoan", module: "cai-dat" },
  { match: "/mohinh-phan-quyen-chuan", module: "cai-dat" },
  { match: "/kien-truc-phan-quyen", module: "cai-dat" },
  { match: "/seed-data",       module: "cai-dat" },
  { match: "/test-kiem-thu",   module: "cai-dat" },
  { match: "/backup-restore",  module: "cai-dat" },
  { match: "/supabase-status", module: "cai-dat" },
  { match: "/canh-bao",        module: "bao-cao" },
  { match: "/cai-dat",         module: "cai-dat" },
  // 3 route thiếu mapping - trước đây không route nào match nên PageGuard render
  // thẳng, KHÔNG kiểm tra quyền gì cả. Cả 3 đều là trang tài chính/điều hành nhạy
  // cảm (duyệt/khoá/thanh toán) - dữ liệu quyền cho các module này đã có sẵn đúng
  // trong permissions.ts (PERMISSIONS), chỉ thiếu chỗ nối URL -> module.
  { match: "/bang-dieu-hanh-sx", module: "bang-dieu-hanh-sx" },
  { match: "/doi-soat-tien-cong", module: "doi-soat-tien-cong" },
  { match: "/doi-soat",        module: "doi-soat-tien-cong" },
  { match: "/profile",         module: "dashboard" },
  { match: "/test-phan-quyen", module: "cai-dat" },
  { match: "/test-real-data",  module: "cai-dat" },
  // Lark
  { match: "/lark-settings",   module: "cai-dat" },
  { match: "/lark-login",      module: "cai-dat" },
  { match: "/lark-base-manager", module: "cai-dat" },
  { match: "/lark-auto-setup", module: "cai-dat" },
  { match: "/lark-sync-engine", module: "cai-dat" },
  { match: "/lark-sync-overview", module: "cai-dat" },
  { match: "/lark-sheet-import", module: "cai-dat" },
  { match: "/lark-callback",   module: "cai-dat" },
];

// /test-phan-quyen và /test-real-data đã có mapping module "cai-dat" (chỉ admin) ở
// trên - trước đây bị liệt kê thêm ở đây nên PUBLIC_ROUTES bypass luôn, mọi role
// đăng nhập đều xem được. Bỏ khỏi danh sách public để module check phía trên có hiệu lực.
const PUBLIC_ROUTES = ["/login", "/ui-cat", "/ui-khuy-nut", "/ui-ui", "/ui-dong-goi"];

function findRouteModule(pathname: string) {
  return ROUTE_TO_MODULE.find((r) => pathname === r.match || pathname.startsWith(r.match + "/"));
}

export default function PageGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || loading) return;
    if (!user) return; // AppShell handles redirect to /login
    const route = findRouteModule(pathname);
    if (route && user.role) {
      // Throttle audit log
      try {
        const lastKey = `last_view_${route.module}`;
        const last = Number(sessionStorage.getItem(lastKey) || "0");
        const now = Date.now();
        if (now - last > 30_000) {
          sessionStorage.setItem(lastKey, String(now));
          logAudit({ user, action: "view", module: route.module as any, description: `View ${pathname}`, }).catch(() => {});
        }
      } catch {}
    }
  }, [user, loading, pathname, mounted]);

  if (loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-slate-500">Đang tải…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="card p-6 max-w-md text-center">
          <Lock className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <h2 className="text-lg font-bold mb-1">Cần đăng nhập</h2>
          <p className="text-sm text-slate-500 mb-3">Vui lòng đăng nhập để tiếp tục.</p>
          <button onClick={() => router.replace("/login")} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold">Đăng nhập</button>
        </div>
      </div>
    );
  }

  // Public routes - bypass
  if (PUBLIC_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return <>{children}</>;
  }

  const route = findRouteModule(pathname);
  if (!route) {
    // Không match → render (page chưa map)
    return <>{children}</>;
  }

  if (!canView(user.role, route.module)) {
    logAudit({ user, action: "permission_denied", module: route.module as any, description: `Denied ${pathname}`, }).catch(() => {});
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="card p-6 max-w-md text-center">
          <ShieldCheck className="w-12 h-12 mx-auto text-rose-500 mb-3" />
          <h2 className="text-lg font-bold mb-1">Không có quyền truy cập</h2>
          <p className="text-sm text-slate-500 mb-1">Module: <b>{route.module}</b></p>
          <p className="text-xs text-slate-400 mb-3">Role hiện tại: {user.role}</p>
          <button onClick={() => router.replace("/dashboard")} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold">Về Dashboard</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
