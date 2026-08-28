"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session-provider";
import { can, type Module, type Action } from "@/lib/permissions";
import { Shield, Lock } from "lucide-react";

export function PermissionGuard({
  module,
  action = "view",
  fallback,
  redirect,
  showForbidden = false,
  children,
}: {
  module: Module;
  action?: Action;
  fallback?: ReactNode;
  redirect?: string;
  showForbidden?: boolean;
  children: ReactNode;
}) {
  const { user } = useSession();
  const role = user?.role;
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    setAllowed(can(role, module, action));
  }, [role, module, action]);

  if (allowed === null) return null; // Wait for hydration

  useEffect(() => {
    if (!allowed && redirect) {
      window.location.href = redirect;
    }
  }, [allowed, redirect]);

  if (allowed) return <>{children}</>;

  if (redirect) return null; // Wait for redirect

  if (fallback) return <>{fallback}</>;

  if (showForbidden) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto mt-12 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Không có quyền truy cập</h2>
        <p className="text-sm opacity-70 mb-1">
          Bạn đang đăng nhập với vai trò: <b>{user?.title || role || "Khách"}</b>
        </p>
        <p className="text-sm opacity-70">
          Cần quyền <b className="text-red-600">{action}</b> trên module <b>{module}</b>
        </p>
      </div>
    );
  }

  return null;
}

// Hook: check permission imperatively
export function usePermission() {
  const { user } = useSession();
  const role = user?.role;
  return {
    can: (mod: Module, act: Action) => can(role, mod, act),
    canView: (mod: Module) => can(role, mod, "view"),
    canCreate: (mod: Module) => can(role, mod, "create"),
    canEdit: (mod: Module) => can(role, mod, "edit"),
    canDelete: (mod: Module) => can(role, mod, "delete"),
    role,
  };
}

// Component: hiện thị khi không có quyền
export function DeniedMessage({ module, action }: { module: Module; action: Action }) {
  return (
    <div className="inline-flex items-center gap-1 text-[10px] text-slate-500 opacity-60">
      <Shield className="w-3 h-3" /> Cần quyền {action}
    </div>
  );
}
