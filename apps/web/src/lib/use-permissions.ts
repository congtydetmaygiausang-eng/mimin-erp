// React Hook for Permissions - Mở rộng dễ dùng trong components
"use client";

import { useMemo } from "react";
import { useSession } from "@/components/session-provider";
import {
  can, canSee, canAccessRecord, filterByPermission, getPermissionBreadcrumb,
  type PermissionContext,
} from "./permission-resolver";
import { type Module, type Action, type Role } from "./permissions";
import { type PhongBan, getAccountById, getAccountByEmail } from "./user-accounts";

/**
 * Hook chính - lấy context + helper functions
 */
export function usePermissions() {
  const { user } = useSession();

  const ctx: PermissionContext = useMemo(() => {
    // Lookup full account info
    const acc = user?.email
      ? getAccountByEmail(user.email) || (user?.id ? getAccountById(user.id) : null)
      : null;

    return {
      user: acc || (user as any),
      role: (acc?.role || user?.role || "admin") as Role,
      phongBan: (acc?.phongBan || "khac") as PhongBan,
    };
  }, [user]);

  return {
    ctx,
    // Module + Role
    can: (mod: Module, act: Action) => can(ctx, mod, act),
    canView: (mod: Module) => can(ctx, mod, "view"),
    canCreate: (mod: Module) => can(ctx, mod, "create"),
    canUpdate: (mod: Module) => can(ctx, mod, "u" as any),
    canDelete: (mod: Module) => can(ctx, mod, "delete"),
    canSee: (mod: Module) => canSee(ctx, mod),
    // Record-level
    canAccessRecord: (record: any) => canAccessRecord(ctx, record),
    filterRecords: (records: any[]) => filterByPermission(ctx, records),
    // UI helper
    breadcrumb: (mod: Module) => getPermissionBreadcrumb(ctx, mod),
    // Metadata
    isAdmin: ctx.role === "admin",
    isManager: ["admin", "planner", "accountant"].includes(ctx.role || ""),
    phongBan: ctx.phongBan,
    role: ctx.role,
  };
}

/**
 * Hook đơn giản - chỉ check 1 quyền
 */
export function useCan(module: Module, action: Action = "view"): boolean {
  const perm = usePermissions();
  return perm.can(module, action);
}

/**
 * Hook filter data theo phòng ban
 */
export function useScopedData<T extends any>(records: T[]): T[] {
  const perm = usePermissions();
  return useMemo(() => perm.filterRecords(records), [perm, records]);
}
