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
  userName?: string;
  userEmail?: string;
  userRole?: string;
  module?: AuditModule | "all";
  action?: AuditAction | "all" | string;
  fromDate?: string;
  toDate?: string;
  timePreset?: "all" | "today" | "yesterday" | "7d" | "30d";
  onlyFailed?: boolean;
}): AuditLog[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

  return logs.filter((log) => {
    if (filters.search) {
      const s = filters.search.toLowerCase().trim();
      const matches = [
        log.userName,
        log.userEmail,
        log.description,
        log.resourceName,
        log.resourceId,
        log.module,
        log.action,
        log.userRole
      ].some((x) => (x || "").toLowerCase().includes(s));
      if (!matches) return false;
    }
    if (filters.userId && log.userId !== filters.userId) return false;
    if (filters.userName && log.userName !== filters.userName) return false;
    if (filters.userEmail && (log.userEmail || "").toLowerCase().trim() !== filters.userEmail.toLowerCase().trim()) return false;
    if (filters.userRole && filters.userRole !== "all" && log.userRole !== filters.userRole) return false;
    if (filters.module && filters.module !== "all" && log.module !== filters.module) return false;
    if (filters.action && filters.action !== "all" && log.action !== filters.action) return false;
    
    // Time preset filter
    if (filters.timePreset && filters.timePreset !== "all") {
      const logTime = new Date(log.timestamp).getTime();
      if (filters.timePreset === "today" && logTime < todayStart) return false;
      if (filters.timePreset === "yesterday" && (logTime < yesterdayStart || logTime >= todayStart)) return false;
      if (filters.timePreset === "7d" && logTime < sevenDaysAgo) return false;
      if (filters.timePreset === "30d" && logTime < thirtyDaysAgo) return false;
    }

    if (filters.fromDate && log.timestamp < filters.fromDate) return false;
    if (filters.toDate && log.timestamp > filters.toDate) return false;
    if (filters.onlyFailed && log.success) return false;
    return true;
  });
}

// Route mapping cho tiếng Việt rõ ràng, thân thiện
export const ROUTE_TITLE_MAP: Record<string, string> = {
  "/dashboard/": "Bảng Điều Khiển Tổng Quan",
  "/dashboard": "Bảng Điều Khiển Tổng Quan",
  "/kho-vai-tinhmann/": "Kho Vải Thành Phẩm & Định Mức",
  "/kho-vai-tinhmann": "Kho Vải Thành Phẩm & Định Mức",
  "/kho-phu-lieu/": "Quản Lý Kho Phụ Liệu",
  "/kho-phu-lieu": "Quản Lý Kho Phụ Liệu",
  "/kho-thanh-pham/": "Quản Lý Kho Thành Phẩm",
  "/kho-thanh-pham": "Quản Lý Kho Thành Phẩm",
  "/lenh-cat/": "Quản Lý Lệnh Cắt May",
  "/lenh-cat": "Quản Lý Lệnh Cắt May",
  "/ke-hoach-sx/": "Kế Hoạch Sản Xuất",
  "/ke-hoach-san-xuat/": "Kế Hoạch Sản Xuất",
  "/ke-hoach-san-xuat": "Kế Hoạch Sản Xuất",
  "/nhan-su/": "Danh Mục Nhân Sự",
  "/nhan-su": "Danh Mục Nhân Sự",
  "/cham-cong/": "Bảng Chấm Công",
  "/cham-cong": "Bảng Chấm Công",
  "/bang-luong/": "Bảng Lương Sản Phẩm",
  "/bang-luong": "Bảng Lương Sản Phẩm",
  "/bang-luong-auto/": "Bảng Lương Tự Động",
  "/cong-no/": "Sổ Quản Lý Công Nợ",
  "/cong-no": "Sổ Quản Lý Công Nợ",
  "/don-hang/": "Danh Sách Đơn Hàng",
  "/don-hang": "Danh Sách Đơn Hàng",
  "/kiem-tra-chat-luong/": "QC - Kiểm Tra Chất Lượng",
  "/to-may/": "Khâu Tổ May Sản Xuất",
  "/ui-dong-goi/": "Khâu Ủi & Đóng Gói",
  "/audit-log/": "Nhật Ký Hệ Thống (Audit Log)",
  "/audit-log": "Nhật Ký Hệ Thống (Audit Log)",
  "/quan-ly-tai-khoan/": "Quản Trị Tài Khoản",
  "/phan-quyen-tuy-chinh/": "Phân Quyền Tùy Chỉnh",
  "/nha-cung-cap/": "Danh Bạ Nhà Cung Cấp",
  "/nha-cung-cap": "Danh Bạ Nhà Cung Cấp",
  "/gia-cong-ngoai/": "Quản Lý Gia Công Ngoài",
  "/danh-muc-sp/": "Danh Mục Sản Phẩm Mẫu",
  "/bao-cao/": "Báo Cáo Tổng Hợp Doanh Thu",
  "/ai-tinh-gia/": "AI Tính Giá Vốn",
  "/cai-dat/": "Cài Đặt Hệ Thống",
  "/login/": "Trang Đăng Nhập",
  "/login": "Trang Đăng Nhập",
};

// Diễn giải hành động bằng tiếng Việt chuẩn
export function humanizeAuditAction(action: string): string {
  const map: Record<string, string> = {
    create: "Tạo mới",
    update: "Cập nhật",
    delete: "Xoá",
    view: "Xem trang",
    login: "Đăng nhập",
    logout: "Đăng xuất",
    login_failed: "Đăng nhập thất bại",
    permission_denied: "Bị từ chối quyền",
    password_change: "Đổi mật khẩu",
    role_change: "Thay đổi vai trò",
    "2fa_enable": "Bật bảo mật 2FA",
    "2fa_disable": "Tắt bảo mật 2FA",
    payment: "Thanh toán",
    approve: "Phê duyệt",
    reject: "Từ chối",
    import: "Nhập dữ liệu",
    export: "Xuất dữ liệu",
    assign: "Phân công",
  };
  return map[action] || action;
}

// Diễn giải mô tả thao tác thân thiện cho anh Cường
export function humanizeAuditDescription(log: AuditLog): {
  title: string;
  badge?: string;
  isView: boolean;
} {
  const desc = log.description || "";
  
  if (desc.startsWith("View ")) {
    const route = desc.replace(/^View\s+/, "").trim();
    const cleanRoute = route.split("?")[0];
    const pageTitle = ROUTE_TITLE_MAP[cleanRoute] || ROUTE_TITLE_MAP[cleanRoute + "/"] || cleanRoute;
    return {
      title: `Xem trang ${pageTitle}`,
      badge: cleanRoute,
      isView: true,
    };
  }

  if (desc.startsWith("Đăng nhập nhanh:")) {
    return {
      title: desc.replace("Đăng nhập nhanh:", "Đăng nhập nhanh quản trị:"),
      badge: "Auth",
      isView: false,
    };
  }

  if (desc.startsWith("Tạo ") || desc.startsWith("Sửa ") || desc.startsWith("Xoá ")) {
    return {
      title: desc,
      badge: log.module,
      isView: false,
    };
  }

  return {
    title: desc || `${humanizeAuditAction(log.action)} ${log.module}`,
    badge: log.module,
    isView: false,
  };
}

// Định dạng thời gian chi tiết và tương đối
export function formatAuditDateTime(timestamp: string): {
  time: string;
  date: string;
  full: string;
  relative: string;
} {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) {
    return { time: "--:--:--", date: "--/--/----", full: timestamp, relative: "Không xác định" };
  }

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const time = `${hours}:${minutes}:${seconds}`;
  const date = `${day}/${month}/${year}`;
  const full = `${time} ${date}`;

  // Relative time
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  let relative = "Vừa xong";
  if (diffSec < 45) {
    relative = "Vừa xong";
  } else if (diffMin < 60) {
    relative = `${diffMin} phút trước`;
  } else if (diffHour < 24) {
    relative = `${diffHour} giờ trước`;
  } else if (diffDay === 1) {
    relative = "Hôm qua";
  } else if (diffDay < 7) {
    relative = `${diffDay} ngày trước`;
  } else {
    relative = date;
  }

  return { time, date, full, relative };
}

export type UserActivitySummary = {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  lastActive: string; // ISO
  lastAction: string;
  lastDescription: string;
  lastModule: string;
  totalLogs: number;
  todayLogs: number;
  isOnline: boolean; // trong vòng 15 phút
  isActiveToday: boolean;
};

// Tổng hợp hoạt động người dùng theo thời gian thực (kết hợp danh bạ người dùng hệ thống)
export function getUserActivitySummaries(
  logs: AuditLog[],
  systemUsers?: Array<{ id: string; name: string; email: string; role: string; chucVu?: string }>
): UserActivitySummary[] {
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const userMap = new Map<string, UserActivitySummary>();

  // 1. Duyệt qua logs và gom nhóm chuẩn theo email / userId / userName
  for (const log of logs) {
    const rawEmail = (log.userEmail || "").trim().toLowerCase();
    const hasValidEmail = rawEmail && rawEmail !== "—" && rawEmail.includes("@");
    const key = hasValidEmail
      ? rawEmail
      : (log.userId && log.userId !== "anonymous" ? log.userId.trim() : (log.userName || "unknown").trim());

    const logTime = new Date(log.timestamp).getTime();
    const isToday = logTime >= todayMs;

    if (!userMap.has(key)) {
      userMap.set(key, {
        userId: log.userId,
        userName: log.userName || (hasValidEmail ? rawEmail.split("@")[0] : "Khách"),
        userEmail: hasValidEmail ? rawEmail : "—",
        userRole: log.userRole || "user",
        lastActive: log.timestamp,
        lastAction: log.action,
        lastDescription: log.description,
        lastModule: log.module,
        totalLogs: 1,
        todayLogs: isToday ? 1 : 0,
        isOnline: now - logTime <= 15 * 60 * 1000,
        isActiveToday: isToday,
      });
    } else {
      const existing = userMap.get(key)!;
      existing.totalLogs += 1;
      if (isToday) existing.todayLogs += 1;

      // Cập nhật tên và email nếu log này đầy đủ hơn
      if (existing.userName === "Khách" && log.userName && log.userName !== "Khách") {
        existing.userName = log.userName;
      }
      if (existing.userEmail === "—" && hasValidEmail) {
        existing.userEmail = rawEmail;
      }

      // Cập nhật hoạt động mới nhất nếu log này mới hơn
      const existingTime = existing.lastActive ? new Date(existing.lastActive).getTime() : 0;
      if (logTime > existingTime) {
        existing.lastActive = log.timestamp;
        existing.lastAction = log.action;
        existing.lastDescription = log.description;
        existing.lastModule = log.module;
        existing.isOnline = now - logTime <= 15 * 60 * 1000;
        if (isToday) existing.isActiveToday = true;
      }
    }
  }

  // 2. Tích hợp danh sách Người dùng Hệ thống (System Users) để không bỏ sót bất kỳ ai (như mrhung@mimin.vn)
  if (systemUsers && Array.isArray(systemUsers)) {
    for (const sys of systemUsers) {
      if (!sys.email) continue;
      const sysEmail = sys.email.trim().toLowerCase();

      // Tìm xem user đã có trong map chưa (qua email hoặc id hoặc name)
      let matchedKey: string | null = null;
      if (userMap.has(sysEmail)) {
        matchedKey = sysEmail;
      } else {
        for (const [k, v] of userMap.entries()) {
          if (
            (v.userEmail && v.userEmail.toLowerCase() === sysEmail) ||
            (v.userId && v.userId === sys.id) ||
            (v.userName && v.userName.toLowerCase() === sys.name.toLowerCase())
          ) {
            matchedKey = k;
            break;
          }
        }
      }

      if (matchedKey) {
        const item = userMap.get(matchedKey)!;
        // Bổ sung thông tin chuẩn xác từ hệ thống
        if (item.userName === "Khách" || item.userName === item.userEmail || item.userName.length < sys.name.length) {
          item.userName = sys.name;
        }
        if (sys.role && (!item.userRole || item.userRole === "user" || item.userRole === "guest")) {
          item.userRole = sys.role;
        }
        if (item.userEmail === "—" && sysEmail) {
          item.userEmail = sysEmail;
        }
      } else {
        // Tài khoản chưa phát sinh log trong đợt này -> Vẫn hiển thị trên bảng theo dõi
        userMap.set(sysEmail, {
          userId: sys.id || sysEmail,
          userName: sys.name,
          userEmail: sysEmail,
          userRole: sys.role || "admin",
          lastActive: "",
          lastAction: "none",
          lastDescription: "Chưa phát sinh thao tác trong kỳ theo dõi",
          lastModule: "cai-dat",
          totalLogs: 0,
          todayLogs: 0,
          isOnline: false,
          isActiveToday: false,
        });
      }
    }
  }

  // 3. Sắp xếp: Đang online trước -> Có hoạt động hôm nay -> Hoạt động gần nhất -> Chưa thao tác
  return Array.from(userMap.values()).sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    if (a.isActiveToday && !b.isActiveToday) return -1;
    if (!a.isActiveToday && b.isActiveToday) return 1;
    const timeA = a.lastActive ? new Date(a.lastActive).getTime() : 0;
    const timeB = b.lastActive ? new Date(b.lastActive).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return a.userName.localeCompare(b.userName);
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
