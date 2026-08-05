// Audit Log system - ghi lại mọi action của user
// Lưu localStorage + sẵn sàng sync lên Supabase khi a share URL+key

import { supabase, isSupabaseEnabled } from "./supabase/client";
import type { AppUser } from "@/components/session-provider";

export type AuditAction =
  | "create" | "update" | "delete" | "view" | "export"
  | "login" | "logout" | "login_failed" | "permission_denied"
  | "password_change" | "role_change" | "2fa_enable" | "2fa_disable"
  | "import" | "approve" | "reject" | "payment" | "assign";

export type AuditModule =
  | "auth" | "nhan-su" | "khach-hang" | "lenh-cat" | "ke-hoach-sx"
  | "kho-vai" | "kho-phu-lieu" | "kho-thanh-pham" | "don-hang"
  | "cong-no-cong-doan" | "kiem-tra-chat-luong" | "to-may" | "hoan-thien"
  | "giao-hang" | "cham-cong" | "bang-luong" | "nha-cung-cap"
  | "gia-cong-ngoai" | "bao-cao" | "realtime" | "cai-dat" | "audit-log"
  | "phan-quyen-tuy-chinh"
  | "2fa" | "role-management" | "session" | "kho-soi" | "ai-agent";

export type AuditLog = {
  id: string;
  timestamp: string; // ISO 8601
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  module: AuditModule;
  resourceId?: string;
  resourceName?: string;
  description: string;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
};

const STORAGE_KEY = "mimin_audit_log_v1";
const MAX_LOGS = 1000; // Giữ tối đa 1000 log trong localStorage

// Lấy danh sách logs
export function getAuditLogs(): AuditLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuditLog[];
  } catch {
    return [];
  }
}

function saveLogs(logs: AuditLog[]) {
  if (typeof window === "undefined") return;
  try {
    // Giữ chỉ MAX_LOGS gần nhất
    const trimmed = logs.slice(-MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // localStorage full → xoá bớt log cũ
    if (e instanceof Error && e.name === "QuotaExceededError") {
      const trimmed = logs.slice(-200);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  }
}

// Ghi log - main function
export async function logAudit(params: {
  user: AppUser | null;
  action: AuditAction;
  module: AuditModule;
  description: string;
  resourceId?: string;
  resourceName?: string;
  oldValue?: unknown;
  newValue?: unknown;
  success?: boolean;
  errorMessage?: string;
}): Promise<void> {
  const log: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    userId: params.user?.id || "anonymous",
    userName: params.user?.name || "Khách",
    userEmail: params.user?.email || "—",
    userRole: params.user?.role || "guest",
    action: params.action,
    module: params.module,
    resourceId: params.resourceId,
    resourceName: params.resourceName,
    description: params.description,
    oldValue: params.oldValue,
    newValue: params.newValue,
    success: params.success !== false,
    errorMessage: params.errorMessage,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 100) : undefined,
  };

  // Lưu localStorage
  const logs = getAuditLogs();
  logs.push(log);
  saveLogs(logs);

  // Nếu có Supabase, sync lên DB
  if (isSupabaseEnabled && supabase) {
    try {
      await supabase.from("audit_logs").insert({
        id: log.id,
        timestamp: log.timestamp,
        user_id: log.userId,
        user_name: log.userName,
        user_email: log.userEmail,
        user_role: log.userRole,
        action: log.action,
        module: log.module,
        resource_id: log.resourceId,
        resource_name: log.resourceName,
        description: log.description,
        old_value: log.oldValue,
        new_value: log.newValue,
        success: log.success,
        error_message: log.errorMessage,
        user_agent: log.userAgent,
      });
    } catch {
      // Silent fail - log đã lưu local
    }
  }

  // Log ra console cho dev
  if (typeof window !== "undefined" && (window as any).MIMIN_DEBUG) {
    console.log("[AUDIT]", log);
  }
}

// Helper: log thao tác CRUD nhanh
export function logCRUD(
  user: AppUser | null,
  module: AuditModule,
  action: "create" | "update" | "delete",
  resourceName: string,
  resourceId?: string,
  extra?: { oldValue?: unknown; newValue?: unknown }
) {
  const actionLabel = { create: "Tạo", update: "Sửa", delete: "Xoá" }[action];
  return logAudit({
    user,
    action,
    module,
    description: `${actionLabel} ${module}: ${resourceName}`,
    resourceId,
    resourceName,
    oldValue: extra?.oldValue,
    newValue: extra?.newValue,
  });
}

// Helper: log workflow actions (gồm 15 action mới: receive, start, report_progress, handover, confirm, approve, reject, rework, lock, report_issue, request_support, payment...)
// Mặc định module = "lenh-cat" (workflow SX) - có thể override
export function logWorkflow(
  user: AppUser | null,
  action: AuditAction | string,
  description: string,
  resourceId?: string,
  extra?: { module?: AuditModule; oldValue?: unknown; newValue?: unknown }
) {
  return logAudit({
    user,
    action: action as AuditAction,
    module: extra?.module || "lenh-cat",
    description,
    resourceId,
    oldValue: extra?.oldValue,
    newValue: extra?.newValue,
  });
}

// Filter & search logs
export function filterAuditLogs(logs: AuditLog[], filters: {
  search?: string;
  userId?: string;
  module?: AuditModule | "all";
  action?: AuditAction | "all";
  fromDate?: string;
  toDate?: string;
  onlyFailed?: boolean;
}): AuditLog[] {
  return logs.filter((log) => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const matches = [log.userName, log.userEmail, log.description, log.resourceName]
        .some((x) => (x || "").toLowerCase().includes(s));
      if (!matches) return false;
    }
    if (filters.userId && log.userId !== filters.userId) return false;
    if (filters.module && filters.module !== "all" && log.module !== filters.module) return false;
    if (filters.action && filters.action !== "all" && log.action !== filters.action) return false;
    if (filters.fromDate && log.timestamp < filters.fromDate) return false;
    if (filters.toDate && log.timestamp > filters.toDate) return false;
    if (filters.onlyFailed && log.success) return false;
    return true;
  });
}

// Thống kê nhanh
export function getAuditStats(logs: AuditLog[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const todayLogs = logs.filter((l) => l.timestamp >= todayISO);
  const failedToday = todayLogs.filter((l) => !l.success);

  const byAction: Record<string, number> = {};
  const byModule: Record<string, number> = {};
  const byUser: Record<string, number> = {};

  for (const log of logs) {
    byAction[log.action] = (byAction[log.action] || 0) + 1;
    byModule[log.module] = (byModule[log.module] || 0) + 1;
    byUser[log.userName] = (byUser[log.userName] || 0) + 1;
  }

  return {
    total: logs.length,
    today: todayLogs.length,
    failedToday: failedToday.length,
    byAction,
    byModule,
    byUser,
  };
}

// Xoá tất cả logs (admin only)
export function clearAuditLogs(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
