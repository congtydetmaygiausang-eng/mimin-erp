"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Activity, Search, Filter, Download, Trash2, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle, Edit2, Trash, Plus,
  Eye, LogIn, LogOut, KeyRound, Shield, UserCog, ChevronDown,
  Clock, Calendar, User, Laptop, Database, Undo2, ArrowUpDown,
  RotateCcw, Radio, Sparkles, ChevronLeft, ChevronRight, Layers,
  ExternalLink, Check, Copy, X
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { usePermission } from "@/components/PermissionGuard";
import {
  logAudit,
  getAuditLogs,
  filterAuditLogs,
  getAuditStats,
  clearAuditLogs,
  humanizeAuditAction,
  humanizeAuditDescription,
  formatAuditDateTime,
  getUserActivitySummaries,
  type AuditLog,
  type AuditAction,
  type AuditModule,
  type UserActivitySummary
} from "@/lib/audit-log";
import {
  ALL_MODULES,
  ALL_ROLES,
  MODULE_LABELS,
  ROLE_LABELS,
  ROLE_COLORS,
  type Module,
  type Role
} from "@/lib/permissions";
import { Avatar } from "@/components/Avatar";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import { toast } from "sonner";
import { USERS } from "@/lib/users";
import { NHAN_SU } from "@/lib/data/real-data";

const ACTION_ICONS: Record<string, any> = {
  create: Plus,
  update: Edit2,
  delete: Trash,
  view: Eye,
  login: LogIn,
  logout: LogOut,
  login_failed: XCircle,
  permission_denied: Shield,
  password_change: KeyRound,
  role_change: UserCog,
  "2fa_enable": Shield,
  "2fa_disable": Shield,
  payment: CheckCircle2,
  approve: CheckCircle2,
  reject: XCircle,
  import: Download,
  export: Download,
  assign: UserCog,
};

const ACTION_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  create: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  update: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  delete: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
  view: { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800" },
  login: { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800" },
  logout: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", border: "border-slate-200 dark:border-slate-700" },
  login_failed: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800" },
  permission_denied: { bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
  payment: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  approve: { bg: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800" },
  reject: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
  import: { bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800" },
  export: { bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800" },
  assign: { bg: "bg-pink-50 dark:bg-pink-950/40", text: "text-pink-700 dark:text-pink-300", border: "border-pink-200 dark:border-pink-800" },
};

export default function AuditLogPage() {
  const { user } = useSession();
  const perm = usePermission();

  // State chính
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Tabs & Views
  const [activeTab, setActiveTab] = useState<"history" | "active-users" | "trash">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("mimin_audit_tab") as any) || "history";
    }
    return "history";
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("mimin_view_mode") as ViewMode) || "list";
    }
    return "list";
  });

  // Bộ lọc nâng cao
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("ALL");
  const [filterModule, setFilterModule] = useState<AuditModule | "all">("all");
  const [filterAction, setFilterAction] = useState<AuditAction | "all">("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [timePreset, setTimePreset] = useState<"all" | "today" | "yesterday" | "7d" | "30d">("all");
  const [onlyFailed, setOnlyFailed] = useState(false);
  const [sortBy, setSortBy] = useState<"time_desc" | "time_asc" | "user_asc">("time_desc");

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Modal chi tiết
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Bộ điều khiển Bảng theo dõi người dùng (Live User Tracker)
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [trackerSearch, setTrackerSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "online" | "today" | "offline">("all");

  useEffect(() => {
    localStorage.setItem("mimin_audit_tab", activeTab);
  }, [activeTab]);

  // Tải dữ liệu ban đầu từ LocalStorage và Supabase
  const fetchAllLogs = useCallback(async () => {
    setLoading(true);
    const localLogs = getAuditLogs();

    try {
      const { supabase, isSupabaseEnabled } = await import("@/lib/supabase/client");
      if (isSupabaseEnabled && supabase) {
        const { data, error } = await supabase
          .from("audit_logs")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(2000);

        if (!error && data && data.length > 0) {
          const { snakeToCamel } = await import("@/lib/supabase/sync-helper");
          const remoteLogs: AuditLog[] = data.map((d: any) => ({
            id: d.id,
            timestamp: d.timestamp,
            userId: d.user_id || "anonymous",
            userName: d.user_name || "Khách",
            userEmail: d.user_email || "—",
            userRole: d.user_role || "user",
            action: d.action as AuditAction,
            module: d.module as AuditModule,
            resourceId: d.resource_id,
            resourceName: d.resource_name,
            description: d.description || "",
            ip: d.ip_address,
            userAgent: d.user_agent,
            success: d.success !== false,
            errorMessage: d.error_message,
            oldValue: d.old_value ? snakeToCamel(d.old_value) : undefined,
            newValue: d.new_value ? snakeToCamel(d.new_value) : undefined,
          }));

          // Gộp thông minh LocalStorage và Remote Supabase (khử trùng ID)
          const mergedMap = new Map<string, AuditLog>();
          localLogs.forEach((l) => mergedMap.set(l.id, l));
          remoteLogs.forEach((r) => mergedMap.set(r.id, r));

          const mergedList = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          setLogs(mergedList);
          setLastSyncTime(new Date());
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("[AuditLog] Không thể tải dữ liệu remote, dùng local logs:", err);
    }

    setLogs(localLogs);
    setLastSyncTime(new Date());
    setLoading(false);
  }, []);

  // Khởi tạo và thiết lập Supabase Realtime channel
  useEffect(() => {
    fetchAllLogs();

    let channel: any;
    (async () => {
      try {
        const { supabase, isSupabaseEnabled } = await import("@/lib/supabase/client");
        if (isSupabaseEnabled && supabase) {
          channel = supabase
            .channel("audit_logs_realtime_stream")
            .on(
              "postgres_changes",
              { event: "INSERT", schema: "public", table: "audit_logs" },
              async (payload) => {
                const { snakeToCamel } = await import("@/lib/supabase/sync-helper");
                const newRow: any = payload.new;
                if (!newRow) return;

                const newLog: AuditLog = {
                  id: newRow.id,
                  timestamp: newRow.timestamp,
                  userId: newRow.user_id || "anonymous",
                  userName: newRow.user_name || "Khách",
                  userEmail: newRow.user_email || "—",
                  userRole: newRow.user_role || "user",
                  action: newRow.action as AuditAction,
                  module: newRow.module as AuditModule,
                  resourceId: newRow.resource_id,
                  resourceName: newRow.resource_name,
                  description: newRow.description || "",
                  ip: newRow.ip_address,
                  userAgent: newRow.user_agent,
                  success: newRow.success !== false,
                  errorMessage: newRow.error_message,
                  oldValue: newRow.old_value ? snakeToCamel(newRow.old_value) : undefined,
                  newValue: newRow.new_value ? snakeToCamel(newRow.new_value) : undefined,
                };

                setLogs((prev) => {
                  if (prev.some((l) => l.id === newLog.id)) return prev;
                  return [newLog, ...prev];
                });
                setLastSyncTime(new Date());
              }
            )
            .subscribe((status) => {
              if (status === "SUBSCRIBED") {
                setIsRealtimeConnected(true);
              }
            });
        }
      } catch (e) {
        console.warn("[AuditLog] Realtime subscription notice:", e);
      }
    })();

    return () => {
      if (channel) {
        import("@/lib/supabase/client").then(({ supabase }) => {
          supabase?.removeChannel(channel);
        });
      }
    };
  }, [fetchAllLogs]);

  // Thống kê logs
  const stats = useMemo(() => getAuditStats(logs), [logs]);

  // Danh sách toàn bộ tài khoản nhân sự & quản trị viên chính thức trong hệ thống
  const systemAccounts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; role: string; chucVu?: string }>();
    USERS.forEach((u) => {
      if (u.email && !u.isMock) {
        map.set(u.email.toLowerCase().trim(), {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          chucVu: u.chucVu,
        });
      }
    });
    NHAN_SU.forEach((ns) => {
      if (ns.email) {
        const em = ns.email.toLowerCase().trim();
        if (!map.has(em)) {
          map.set(em, {
            id: ns.maNV,
            name: ns.hoTen,
            email: ns.email,
            role: ns.chucVu?.toLowerCase().includes("quản lý") || ns.chucVu?.toLowerCase().includes("giám đốc") ? "admin" : "attendance",
            chucVu: ns.chucVu,
          });
        }
      }
    });
    return Array.from(map.values());
  }, []);

  // Tổng hợp hoạt động người dùng toàn diện (kết hợp logs + systemAccounts để luôn hiển thị đủ mọi user như mrhung@mimin.vn)
  const userActivities = useMemo(() => getUserActivitySummaries(logs, systemAccounts), [logs, systemAccounts]);

  // Danh sách các User có trong hệ thống để chọn trong bộ lọc dropdown
  const userList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; role: string; count: number }>();
    // 1. Thêm toàn bộ system accounts
    systemAccounts.forEach((sa) => {
      map.set(sa.email.toLowerCase(), {
        id: sa.id,
        name: sa.name,
        email: sa.email,
        role: sa.role,
        count: 0,
      });
    });
    // 2. Tính số lượng thao tác từ logs
    for (const log of logs) {
      const emailKey = log.userEmail && log.userEmail !== "—" ? log.userEmail.toLowerCase().trim() : null;
      const key = emailKey || (log.userId && log.userId !== "anonymous" ? log.userId : log.userName || "Khách");
      if (!map.has(key)) {
        map.set(key, {
          id: log.userId,
          name: log.userName || "Khách",
          email: log.userEmail || "",
          role: log.userRole || "user",
          count: 1,
        });
      } else {
        map.get(key)!.count += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [logs, systemAccounts]);

  // Số lượng user đang Online (thao tác trong 15 phút)
  const onlineUsersCount = useMemo(() => {
    return userActivities.filter((u) => u.isOnline).length;
  }, [userActivities]);

  // Lọc logs
  const filteredLogs = useMemo(() => {
    let filterUserId: string | undefined;
    let filterUserName: string | undefined;
    let filterUserEmail: string | undefined;

    if (selectedUser !== "ALL") {
      if (selectedUser.startsWith("id:")) {
        filterUserId = selectedUser.replace("id:", "");
      } else if (selectedUser.startsWith("email:")) {
        filterUserEmail = selectedUser.replace("email:", "");
      } else if (selectedUser.includes("@")) {
        filterUserEmail = selectedUser;
      } else {
        filterUserName = selectedUser;
      }
    }

    let result = filterAuditLogs(logs, {
      search,
      userId: filterUserId,
      userName: filterUserName,
      userEmail: filterUserEmail,
      userRole: filterRole,
      module: filterModule,
      action: filterAction,
      timePreset,
      onlyFailed,
    });

    // Sắp xếp
    if (sortBy === "time_desc") {
      result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === "time_asc") {
      result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else if (sortBy === "user_asc") {
      result.sort((a, b) => a.userName.localeCompare(b.userName));
    }

    return result;
  }, [logs, search, selectedUser, filterRole, filterModule, filterAction, timePreset, onlyFailed, sortBy]);

  // Reset page khi thay đổi filter
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedUser, filterRole, filterModule, filterAction, timePreset, onlyFailed, sortBy]);

  // Danh sách logs theo trang hiện tại (Pagination)
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Thùng rác (Trash Logs)
  const trashLogs = useMemo(() => {
    const latestActionByResource = new Map<string, AuditLog>();
    const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (const l of sortedLogs) {
      if (l.resourceId) {
        const key = `${l.module}_${l.resourceId}`;
        latestActionByResource.set(key, l);
      }
    }

    return Array.from(latestActionByResource.values())
      .filter((l) => l.action === "delete" && l.oldValue != null)
      .reverse();
  }, [logs]);

  // Kiểm tra xem có filter nào đang áp dụng không
  const hasActiveFilters = useMemo(() => {
    return (
      search !== "" ||
      selectedUser !== "ALL" ||
      filterModule !== "all" ||
      filterAction !== "all" ||
      filterRole !== "all" ||
      timePreset !== "all" ||
      onlyFailed ||
      sortBy !== "time_desc"
    );
  }, [search, selectedUser, filterModule, filterAction, filterRole, timePreset, onlyFailed, sortBy]);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedUser("ALL");
    setFilterModule("all");
    setFilterAction("all");
    setFilterRole("all");
    setTimePreset("all");
    setOnlyFailed(false);
    setSortBy("time_desc");
    toast.info("Đã đặt lại bộ lọc");
  };

  // Xuất file CSV
  const handleExportCSV = () => {
    const csvHeader = ["ID", "Thời gian", "Người dùng", "Email", "Vai trò", "Hành động", "Phân hệ", "Tài nguyên", "Mô tả chi tiết", "Trạng thái"];
    const csvRows = filteredLogs.map((l) => [
      l.id,
      `"${formatAuditDateTime(l.timestamp).full}"`,
      `"${(l.userName || "").replace(/"/g, '""')}"`,
      `"${l.userEmail || ""}"`,
      `"${l.userRole || ""}"`,
      `"${humanizeAuditAction(l.action)}"`,
      `"${MODULE_LABELS[l.module as Module] || l.module}"`,
      `"${(l.resourceName || "").replace(/"/g, '""')}"`,
      `"${(l.description || "").replace(/"/g, '""')}"`,
      l.success ? "Thành công" : "Lỗi",
    ]);

    const csvContent = "\uFEFF" + [csvHeader.join(","), ...csvRows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nhat-ky-he-thong-mimin-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${filteredLogs.length} dòng nhật ký ra file CSV`);
  };

  // Xoá lịch sử (Chỉ dành cho Admin)
  const handleClear = () => {
    if (confirm("Anh có chắc chắn muốn xoá toàn bộ nhật ký hệ thống không? Hành động này không thể hoàn tác.")) {
      clearAuditLogs();
      setLogs([]);
      toast.success("Đã xoá sạch lịch sử nhật ký hệ thống");
      logAudit({ user, action: "delete", module: "audit-log", description: "Xoá toàn bộ nhật ký hệ thống" });
    }
  };

  // Khôi phục dữ liệu từ thùng rác
  const handleRestore = async (log: AuditLog) => {
    if (!log.oldValue) return;
    if (!confirm(`Anh có chắc chắn muốn khôi phục dữ liệu: "${log.resourceName || log.description}" không?`)) return;

    try {
      const { supabaseUpsertRaw, camelToSnake } = await import("@/lib/supabase/sync-helper");

      let tableName = "";
      let payload: any = {};

      if (log.module === "lenh-cat") {
        tableName = "lenh_cat";
        const lenh: any = log.oldValue;
        payload = {
          id: lenh.id, loai_lenh: lenh.loaiLenh, khach_hang: lenh.khachHang, loai_sp: lenh.loaiSP, ma_sp: lenh.maSP,
          ten_sp: lenh.tenSP, tong_sl: lenh.tongSL, tong_sl_thuc_te: lenh.tongSLThucTe,
          han_hoan_thanh: lenh.hanHoanThanh, ti_le_size: lenh.tiLeSize, ds_mau: lenh.dsMau, ds_phu_lieu: lenh.dsPhuLieu,
          mau_cong_doan: lenh.mauCongDoan, phan_cong: lenh.phanCong, mau_chi_phi: lenh.mauChiPhi,
          chi_phi_co_dinh: lenh.chiPhiCoDinh, bang_cogs: lenh.bangCOGS, phu_trach_cat: lenh.phuTrachCat,
          phu_trach_sx: lenh.phuTrachSX, ghi_chu: lenh.ghiChu, trang_thai: lenh.trangThai,
          phien_ban_dinh_muc: lenh.phienBanDinhMuc, ngay_tao: lenh.ngayTao, nguoi_tao: lenh.nguoiTao
        };
      } else if (log.module === ("danh-muc-sp" as any)) {
        tableName = "san_pham";
        payload = camelToSnake(log.oldValue);
        payload.ma_sp = (log.oldValue as any).id;
        delete payload.id;
      } else if (log.module === "kho-thanh-pham") {
        tableName = "kho_thanh_pham";
        payload = camelToSnake(log.oldValue);
      } else {
        toast.error("Chưa hỗ trợ khôi phục tự động cho phân hệ này");
        return;
      }

      await supabaseUpsertRaw(tableName, payload);
      toast.success("Khôi phục thành công! Đã đồng bộ lại hệ thống.");

      const newLog: AuditLog = {
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        userName: user?.name || "Unknown",
        userId: user?.id || "",
        userEmail: user?.email || "",
        success: true,
        userRole: user?.role || "user",
        action: "create",
        module: log.module,
        description: `[Khôi phục từ thùng rác] ${log.resourceName || log.resourceId || ""}`,
        resourceId: log.resourceId,
        resourceName: log.resourceName
      };

      setLogs((prev) => [newLog, ...prev]);
      logAudit({
        user,
        action: "create",
        module: log.module,
        description: `[Khôi phục từ thùng rác] ${log.resourceName || log.resourceId || ""}`,
        resourceId: log.resourceId,
        resourceName: log.resourceName
      });
    } catch (e: any) {
      console.error(e);
      toast.error(`Khôi phục thất bại: ${e.message || "Lỗi không xác định"}`);
    }
  };

  // Lọc danh sách user trong bảng theo dõi
  const filteredUserActivities = useMemo(() => {
    return userActivities.filter((u) => {
      // 1. Lọc theo trạng thái
      if (userStatusFilter === "online" && !u.isOnline) return false;
      if (userStatusFilter === "today" && !u.isActiveToday) return false;
      if (userStatusFilter === "offline" && (u.isOnline || u.isActiveToday)) return false;

      // 2. Tìm kiếm theo tên / email / role
      if (trackerSearch) {
        const s = trackerSearch.toLowerCase().trim();
        const match =
          u.userName.toLowerCase().includes(s) ||
          u.userEmail.toLowerCase().includes(s) ||
          u.userRole.toLowerCase().includes(s);
        if (!match) return false;
      }
      return true;
    });
  }, [userActivities, userStatusFilter, trackerSearch]);

  const displayedUserActivities = useMemo(() => {
    if (showAllUsers || trackerSearch.trim() || userStatusFilter !== "all") {
      return filteredUserActivities;
    }
    return filteredUserActivities.slice(0, 8);
  }, [filteredUserActivities, showAllUsers, trackerSearch, userStatusFilter]);

  if (!perm.canView("cai-dat")) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto mt-12">
        <Shield className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Quyền Quản Trị Hệ Thống</h2>
        <p className="text-sm opacity-70">Trang Nhật Ký Hệ Thống (Audit Log) chỉ dành cho Giám đốc và Quản trị viên.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in pb-12 max-w-7xl mx-auto">
      {/* ============ HEADER TỔNG QUAN (PREMIUM BANNER) ============ */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-cyan-900 rounded-3xl p-5 md:p-6 text-white shadow-lg border border-teal-600/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-teal-200/90 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> MIMIN ERP · HỆ THỐNG & BẢO MẬT
            </div>
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2.5 drop-shadow-sm">
              <Activity className="w-7 h-7 text-teal-200" /> Nhật Ký Hệ Thống (Audit Log)
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-2xl font-medium">
              Giám sát hoạt động thời gian thực của toàn bộ User · Đang làm gì, thao tác ở đâu, thời gian cụ thể
            </p>
          </div>

          {/* Quick Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            {/* Realtime Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-sm">
              <span className={`w-2.5 h-2.5 rounded-full ${isRealtimeConnected ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-amber-400"}`} />
              <span className="text-teal-100">{isRealtimeConnected ? "Realtime Trực tiếp" : "Đồng bộ cục bộ"}</span>
            </div>

            <button
              type="button"
              onClick={fetchAllLogs}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 backdrop-blur-sm cursor-pointer shadow-xs"
              title="Đồng bộ lại từ cơ sở dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Tải lại
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Xuất dữ liệu đang lọc ra file CSV"
            >
              <Download className="w-4 h-4" /> Xuất CSV
            </button>
            {user?.role === "admin" && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Xóa toàn bộ lịch sử log"
              >
                <Trash2 className="w-4 h-4" /> Xoá
              </button>
            )}
          </div>
        </div>

        {/* 4 THẺ KPI TỔNG QUAN */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {/* Card 1: Tổng logs */}
          <div className="bg-white/10 hover:bg-white/15 transition backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
            <div className="text-xs font-semibold text-teal-200 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> Tổng Lượt Thao Tác
            </div>
            <div className="text-xl md:text-2xl font-black mt-1 font-mono">
              {stats.total.toLocaleString()} <span className="text-xs font-medium opacity-80">logs</span>
            </div>
            <div className="text-[11px] text-teal-100/80 font-medium mt-0.5">
              Toàn bộ lịch sử từ mọi người dùng
            </div>
          </div>

          {/* Card 2: Hoạt động hôm nay */}
          <div className="bg-white/10 hover:bg-white/15 transition backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
            <div className="text-xs font-semibold text-teal-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Thao Tác Hôm Nay
            </div>
            <div className="text-xl md:text-2xl font-black mt-1 font-mono text-emerald-200">
              {stats.today.toLocaleString()}
            </div>
            <div className="text-[11px] text-teal-100/80 font-medium mt-0.5">
              {stats.today > 0 ? "Hệ thống đang hoạt động nhộn nhịp" : "Chưa có lượt thao tác hôm nay"}
            </div>
          </div>

          {/* Card 3: User Active */}
          <div className="bg-white/10 hover:bg-white/15 transition backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
            <div className="text-xs font-semibold text-teal-200 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Người Dùng Hoạt Động
            </div>
            <div className="text-xl md:text-2xl font-black mt-1 flex items-baseline gap-2 font-mono">
              <span className="text-amber-200">{onlineUsersCount} online</span>
              <span className="text-xs opacity-70">/ {userList.length} user</span>
            </div>
            <div className="text-[11px] text-teal-100/80 font-medium mt-0.5">
              {onlineUsersCount > 0 ? `${onlineUsersCount} user đang thao tác trong 15p qua` : "Không có user online lúc này"}
            </div>
          </div>

          {/* Card 4: Thao tác lỗi */}
          <div className="bg-white/10 hover:bg-white/15 transition backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
            <div className="text-xs font-semibold text-teal-200 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-300" /> Lỗi / Cảnh Báo
            </div>
            <div className={`text-xl md:text-2xl font-black mt-1 font-mono ${stats.failedToday > 0 ? "text-rose-300" : "text-teal-100"}`}>
              {stats.failedToday} <span className="text-xs font-medium opacity-80">hôm nay</span>
            </div>
            <div className="text-[11px] text-teal-100/80 font-medium mt-0.5">
              {stats.failedToday > 0 ? "Phát hiện thao tác thất bại / bị từ chối" : "An toàn, không có lỗi hôm nay"}
            </div>
          </div>
        </div>
      </div>

      {/* ============ BẢNG THEO DÕI TOÀN BỘ USER ĐANG LÀM GÌ (LIVE USER ACTIVITY TRACKER) ============ */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600" /> Bảng Theo Dõi Người Dùng: Đang Làm Gì, Thao Tác Gì & Thời Gian
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Status Filter Pills */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setUserStatusFilter("all")}
                className={`px-2 py-1 rounded-md font-semibold transition ${
                  userStatusFilter === "all"
                    ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Tất cả ({userActivities.length})
              </button>
              <button
                onClick={() => setUserStatusFilter("online")}
                className={`px-2 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                  userStatusFilter === "online"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-2xs"
                    : "text-slate-500 hover:text-emerald-600"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online ({onlineUsersCount})
              </button>
              <button
                onClick={() => setUserStatusFilter("today")}
                className={`px-2 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                  userStatusFilter === "today"
                    ? "bg-white dark:bg-slate-700 text-amber-600 shadow-2xs"
                    : "text-slate-500 hover:text-amber-600"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Hôm nay ({userActivities.filter((u) => u.isActiveToday).length})
              </button>
              <button
                onClick={() => setUserStatusFilter("offline")}
                className={`px-2 py-1 rounded-md font-semibold transition ${
                  userStatusFilter === "offline"
                    ? "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Ngoại tuyến ({userActivities.filter((u) => !u.isOnline && !u.isActiveToday).length})
              </button>
            </div>

            {/* Quick Search User */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={trackerSearch}
                onChange={(e) => setTrackerSearch(e.target.value)}
                placeholder="Tìm user, email..."
                className="pl-8 pr-7 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-36 sm:w-44 font-medium"
              />
              {trackerSearch && (
                <button
                  onClick={() => setTrackerSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Toggle View All */}
            {userActivities.length > 8 && !trackerSearch && userStatusFilter === "all" && (
              <button
                onClick={() => setShowAllUsers(!showAllUsers)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200/80 dark:border-teal-800 transition"
              >
                {showAllUsers ? "Thu gọn (8)" : `Xem tất cả (${userActivities.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Lưới các Card User */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
          {displayedUserActivities.map((u) => {
            const hasActivity = !!u.lastActive;
            const timeInfo = hasActivity ? formatAuditDateTime(u.lastActive) : null;
            const isSelected =
              selectedUser === u.userName ||
              (u.userEmail && u.userEmail !== "—" && (selectedUser === u.userEmail || selectedUser === `email:${u.userEmail}`)) ||
              (u.userId && u.userId !== "anonymous" && selectedUser === `id:${u.userId}`);
            const humanDesc = hasActivity
              ? humanizeAuditDescription({
                  id: "",
                  timestamp: u.lastActive,
                  userId: u.userId,
                  userName: u.userName,
                  userEmail: u.userEmail,
                  userRole: u.userRole,
                  action: u.lastAction as AuditAction,
                  module: u.lastModule as AuditModule,
                  description: u.lastDescription,
                  success: true,
                })
              : { title: "Chưa có thao tác trong kỳ theo dõi", detail: "" };

            return (
              <div
                key={u.userId + u.userName + u.userEmail}
                onClick={() => {
                  if (isSelected) {
                    setSelectedUser("ALL");
                  } else {
                    if (u.userEmail && u.userEmail !== "—" && u.userEmail.includes("@")) {
                      setSelectedUser(u.userEmail);
                    } else if (u.userId && u.userId !== "anonymous") {
                      setSelectedUser(`id:${u.userId}`);
                    } else {
                      setSelectedUser(u.userName);
                    }
                  }
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? "bg-teal-50 dark:bg-teal-950/40 border-teal-500 shadow-sm ring-2 ring-teal-500/20"
                    : "bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-teal-300"
                }`}
                title={`Bấm để lọc toàn bộ nhật ký theo user ${u.userName} (${u.userEmail})`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="relative shrink-0">
                    <Avatar name={u.userName} size="md" />
                    {u.isOnline ? (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs" title="Đang online trong 15p" />
                    ) : u.isActiveToday ? (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900 shadow-xs" title="Hoạt động hôm nay" />
                    ) : (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 border border-white dark:border-slate-900" title="Ngoại tuyến" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate" title={u.userName}>
                        {u.userName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                        {ROLE_LABELS[u.userRole as Role] || u.userRole}
                      </span>
                    </div>

                    {u.userEmail && u.userEmail !== "—" && (
                      <div className="text-[10px] text-teal-600 dark:text-teal-400 font-mono truncate font-medium">
                        {u.userEmail}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                      {humanDesc.title}
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        {hasActivity && timeInfo ? (
                          <>
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{timeInfo.time} ({timeInfo.relative})</span>
                          </>
                        ) : (
                          <span className="italic text-slate-400">Chưa có thao tác</span>
                        )}
                      </span>
                      <span className={`font-bold ${u.totalLogs > 0 ? "text-teal-700 dark:text-teal-400" : "text-slate-400"}`}>
                        {u.totalLogs} logs
                      </span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-600" />
                )}
              </div>
            );
          })}
        </div>

        {/* Nút Xem thêm khi đang ở chế độ thu gọn 8 người */}
        {!showAllUsers && !trackerSearch && userStatusFilter === "all" && userActivities.length > 8 && (
          <div className="pt-1 text-center">
            <button
              onClick={() => setShowAllUsers(true)}
              className="text-xs font-semibold px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition inline-flex items-center gap-1.5"
            >
              <span>Xem thêm {userActivities.length - 8} tài khoản khác (bao gồm Mr Hùng...)</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ============ BỘ LỌC TÌM KIẾM NÂNG CAO (CHUẨN CÁC KHÂU) ============ */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
        {/* HÀNG 1: TABS PHÂN LOẠI & PRESETS THỜI GIAN */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Segmented Control Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Lịch sử hệ thống</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === "history" ? "bg-teal-50 text-teal-700 font-mono font-bold" : "bg-slate-200 text-slate-500 font-mono"}`}>
                {filteredLogs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("trash")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === "trash"
                  ? "bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Thùng rác đã xóa</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === "trash" ? "bg-rose-50 text-rose-700 font-mono font-bold" : "bg-slate-200 text-slate-500 font-mono"}`}>
                {trashLogs.length}
              </span>
            </button>
          </div>

          {/* Time Presets (Lọc thời gian nhanh) */}
          <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Thời gian:
            </span>
            {[
              { id: "all", label: "Tất cả" },
              { id: "today", label: "Hôm nay", dot: "bg-emerald-500" },
              { id: "yesterday", label: "Hôm qua", dot: "bg-amber-500" },
              { id: "7d", label: "7 ngày qua", dot: "bg-sky-500" },
              { id: "30d", label: "30 ngày qua", dot: "bg-indigo-500" },
            ].map((p) => {
              const active = timePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTimePreset(p.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition border ${
                    active
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {p.dot && <span className={`w-2 h-2 rounded-full ${p.dot}`} />}
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* HÀNG 2: TÌM KIẾM ĐA NĂNG, CHỌN USER, MODULE, ACTION, ROLE, RESET */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          {/* Ô tìm kiếm thông minh */}
          <div className="lg:col-span-4 relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo user, email, mã lệnh, đối tượng, mô tả..."
                className="w-full pl-9 pr-8 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium placeholder:text-slate-400 text-slate-800 dark:text-slate-100 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Ô TÌM KIẾM & CHỌN USER (GIỐNG CÁC KHÂU) */}
          <div className="lg:col-span-3">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full py-2 px-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">👤 -- Tất cả Người dùng ({userList.length}) --</option>
              {userList.map((u) => (
                <option key={u.id + u.name} value={u.id && u.id !== "anonymous" ? `id:${u.id}` : u.name}>
                  {u.name} ({ROLE_LABELS[u.role as Role] || u.role}) - {u.count} thao tác
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Phân hệ / Module */}
          <div className="lg:col-span-2">
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value as any)}
              className="w-full py-2 px-2.5 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">📦 Tất cả module</option>
              {ALL_MODULES.map((m) => (
                <option key={m} value={m}>
                  {MODULE_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Hành động (Action) */}
          <div className="lg:col-span-2">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value as any)}
              className="w-full py-2 px-2.5 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">⚡ Tất cả action</option>
              <option value="create">➕ Tạo mới (Create)</option>
              <option value="update">✏️ Chỉnh sửa (Update)</option>
              <option value="delete">🗑️ Xoá (Delete)</option>
              <option value="view">👁️ Xem trang (View)</option>
              <option value="login">🔑 Đăng nhập (Login)</option>
              <option value="logout">🚪 Đăng xuất (Logout)</option>
              <option value="payment">💳 Thanh toán (Payment)</option>
              <option value="export">📥 Xuất file (Export)</option>
              <option value="permission_denied">🛡️ Bị từ chối (Denied)</option>
            </select>
          </div>

          {/* Reset Filters button */}
          <div className="lg:col-span-1 flex items-center">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-2 px-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                title="Đặt lại tất cả bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="sm:inline">Xóa</span>
              </button>
            ) : (
              <div className="w-full text-center text-[11px] text-slate-400 font-medium py-2">
                Mặc định
              </div>
            )}
          </div>
        </div>

        {/* HÀNG 3: BỘ LỌC ROLE, CHECKBOX CHỈ LỖI, SẮP XẾP VÀ CHẾ ĐỘ XEM */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            {/* Vai trò */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">Tất cả vai trò ({ALL_ROLES.length})</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>

            {/* Checkbox Chỉ Lỗi */}
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={onlyFailed}
                onChange={(e) => setOnlyFailed(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Chỉ xem thao tác lỗi
              </span>
            </label>

            {/* Sắp xếp */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="time_desc">Mới nhất trước (Gần đây nhất)</option>
              <option value="time_asc">Cũ nhất trước</option>
              <option value="user_asc">Theo tên User (A - Z)</option>
            </select>
          </div>

          {/* TOGGLE CHẾ ĐỘ XEM: DANH SÁCH / DẠNG THẺ */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:inline">
              Chế độ xem:
            </span>
            <DataViewToggle value={viewMode} onChange={setViewMode} modes={["list", "card"]} />
          </div>
        </div>
      </div>

      {/* ============ NỘI DUNG TAB: LỊCH SỬ HỆ THỐNG ============ */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {/* Header kết quả đếm */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Hiển thị: <b className="text-teal-700 dark:text-teal-400 font-mono text-sm">{paginatedLogs.length}</b> / {filteredLogs.length} logs
              {filteredLogs.length !== logs.length && ` (Lọc từ tổng ${logs.length} logs)`}
            </div>
            <div className="flex items-center gap-2">
              <span>Hiển thị mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="py-1 px-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
              >
                <option value={25}>25 dòng</option>
                <option value={50}>50 dòng</option>
                <option value={100}>100 dòng</option>
              </select>
            </div>
          </div>

          {/* VIEW: DẠNG DANH SÁCH (TABLE VIEW) */}
          {viewMode === "list" ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3.5 w-48">THỜI GIAN CỤ THỂ</th>
                      <th className="py-3 px-3.5 w-52">NGƯỜI DÙNG & VAI TRÒ</th>
                      <th className="py-3 px-3.5 w-36">HÀNH ĐỘNG</th>
                      <th className="py-3 px-3.5 w-40">PHÂN HỆ (MODULE)</th>
                      <th className="py-3 px-3.5">MÔ TẢ THAO TÁC / ĐỐI TƯỢNG</th>
                      <th className="py-3 px-3 w-28 text-center">TRẠNG THÁI</th>
                      <th className="py-3 px-3.5 w-24 text-right">CHI TIẾT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-200">
                    {paginatedLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400">
                          <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          Không tìm thấy nhật ký phù hợp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    ) : (
                      paginatedLogs.map((log) => {
                        const Icon = ACTION_ICONS[log.action] || Activity;
                        const style = ACTION_STYLES[log.action] || { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
                        const timeInfo = formatAuditDateTime(log.timestamp);
                        const humanDesc = humanizeAuditDescription(log);

                        return (
                          <tr
                            key={log.id}
                            onClick={() => setSelectedLog(log)}
                            className="hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-colors cursor-pointer group"
                          >
                            {/* Cột 1: Thời gian */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="font-bold font-mono text-slate-900 dark:text-slate-100">
                                {timeInfo.time}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                                <span>{timeInfo.date}</span>
                                <span>•</span>
                                <span className="text-teal-600 dark:text-teal-400 font-sans">{timeInfo.relative}</span>
                              </div>
                            </td>

                            {/* Cột 2: Người dùng */}
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={log.userName} size="sm" />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {log.userName}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-brand-500/10 text-brand-700 dark:text-brand-300">
                                      {ROLE_LABELS[log.userRole as Role] || log.userRole}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Cột 3: Hành động */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}>
                                <Icon className="w-3.5 h-3.5 shrink-0" />
                                <span>{humanizeAuditAction(log.action)}</span>
                              </span>
                            </td>

                            {/* Cột 4: Phân hệ */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {MODULE_LABELS[log.module as Module] || log.module}
                              </span>
                            </td>

                            {/* Cột 5: Mô tả thao tác */}
                            <td className="py-3 px-3.5">
                              <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                                {humanDesc.title}
                              </div>
                              {log.resourceName && (
                                <div className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold mt-0.5 flex items-center gap-1">
                                  <span className="opacity-70">Đối tượng:</span> {log.resourceName}
                                </div>
                              )}
                              {log.errorMessage && (
                                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                                  Lỗi: {log.errorMessage}
                                </div>
                              )}
                            </td>

                            {/* Cột 6: Trạng thái */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {log.success ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                  <Check className="w-3 h-3" /> Thành công
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                                  <X className="w-3 h-3" /> Lỗi
                                </span>
                              )}
                            </td>

                            {/* Cột 7: Thao tác */}
                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLog(log);
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 transition"
                              >
                                Chi tiết
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* VIEW: DẠNG THẺ (CARD VIEW / ACTIVITY FEED) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {paginatedLogs.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Không có nhật ký nào phù hợp với bộ lọc.
                </div>
              ) : (
                paginatedLogs.map((log) => {
                  const Icon = ACTION_ICONS[log.action] || Activity;
                  const style = ACTION_STYLES[log.action] || { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
                  const timeInfo = formatAuditDateTime(log.timestamp);
                  const humanDesc = humanizeAuditDescription(log);

                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-400 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        {/* Header card: User info & Action badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={log.userName} size="md" />
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                {log.userName}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {ROLE_LABELS[log.userRole as Role] || log.userRole}
                              </div>
                            </div>
                          </div>

                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${style.bg} ${style.text} ${style.border}`}>
                            <Icon className="w-3.5 h-3.5" />
                            <span>{humanizeAuditAction(log.action)}</span>
                          </span>
                        </div>

                        {/* Description & Module */}
                        <div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                            {humanDesc.title}
                          </div>
                          {log.resourceName && (
                            <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-1">
                              Đối tượng: <b>{log.resourceName}</b>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer card: Timestamp & Module */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{timeInfo.time}</span>
                          <span>•</span>
                          <span className="text-teal-600 font-sans">{timeInfo.relative}</span>
                        </div>
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          {MODULE_LABELS[log.module as Module] || log.module}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* PHÂN TRANG (PAGINATION) */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
              <div className="text-xs text-slate-500 font-medium">
                Trang <b className="text-slate-800 dark:text-slate-200">{currentPage}</b> / {totalPages}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-xs font-mono font-bold px-2">
                  {currentPage} / {totalPages}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Trang tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ NỘI DUNG TAB: THÙNG RÁC ĐÃ XOÁ ============ */}
      {activeTab === "trash" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-500" /> Dữ Liệu Đã Xóa Có Thể Khôi Phục
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Lưu trữ các đối tượng (Lệnh cắt, Sản phẩm, Kho thành phẩm) đã bị xóa cùng toàn bộ giá trị cũ để khôi phục
              </p>
            </div>
            <div className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {trashLogs.length} mục
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[700px] overflow-y-auto">
            {trashLogs.length === 0 ? (
              <div className="p-16 text-center text-slate-400">
                <Trash2 className="w-10 h-10 mx-auto mb-2 opacity-30 text-rose-500" />
                Thùng rác đang trống. Không có dữ liệu nào vừa bị xóa.
              </div>
            ) : (
              trashLogs.map((log) => {
                const timeInfo = formatAuditDateTime(log.timestamp);
                const isSupported = ["lenh-cat", "danh-muc-sp", "kho-thanh-pham"].includes(log.module);

                return (
                  <div
                    key={log.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0 text-rose-600">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {log.description}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                          <span className="font-mono">{timeInfo.full} ({timeInfo.relative})</span>
                          <span>•</span>
                          <span>Người xóa: <b className="text-slate-700 dark:text-slate-300">{log.userName}</b></span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                            {MODULE_LABELS[log.module as Module] || log.module}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                      >
                        Xem dữ liệu cũ
                      </button>
                      {isSupported && (
                        <button
                          type="button"
                          onClick={() => handleRestore(log)}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                        >
                          <Undo2 className="w-3.5 h-3.5" /> Khôi phục
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============ MODAL CHI TIẾT LOG (LOG DETAIL MODAL) ============ */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 text-teal-700 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Chi Tiết Nhật Ký Hoạt Động</h3>
                  <code className="text-[11px] font-mono text-slate-400">{selectedLog.id}</code>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin chi tiết */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div>
                <span className="text-slate-400 block mb-0.5">Thời gian thực thi:</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-100">
                  {formatAuditDateTime(selectedLog.timestamp).full} ({formatAuditDateTime(selectedLog.timestamp).relative})
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Người thực hiện:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {selectedLog.userName} ({selectedLog.userEmail || "—"})
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Vai trò hệ thống:</span>
                <span className="font-bold text-teal-700 dark:text-teal-300">
                  {ROLE_LABELS[selectedLog.userRole as Role] || selectedLog.userRole}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Hành động & Phân hệ:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {humanizeAuditAction(selectedLog.action)} · {MODULE_LABELS[selectedLog.module as Module] || selectedLog.module}
                </span>
              </div>

              {selectedLog.resourceName && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block mb-0.5">Đối tượng tác động:</span>
                  <span className="font-bold text-teal-800 dark:text-teal-200">
                    {selectedLog.resourceName} {selectedLog.resourceId && `(Mã: ${selectedLog.resourceId})`}
                  </span>
                </div>
              )}

              <div className="sm:col-span-2">
                <span className="text-slate-400 block mb-0.5">Mô tả chi tiết:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {humanizeAuditDescription(selectedLog).title}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-400 block mb-0.5">Trạng thái:</span>
                {selectedLog.success ? (
                  <span className="font-bold text-emerald-600">✅ Thành công</span>
                ) : (
                  <span className="font-bold text-rose-600">❌ Lỗi: {selectedLog.errorMessage || "Thất bại"}</span>
                )}
              </div>

              {selectedLog.userAgent && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block mb-0.5">Thiết bị & Trình duyệt (User Agent):</span>
                  <span className="font-mono text-[11px] text-slate-500 break-all">{selectedLog.userAgent}</span>
                </div>
              )}
            </div>

            {/* Dữ liệu cũ và mới */}
            {selectedLog.oldValue !== undefined && (
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Dữ liệu cũ trước khi sửa / xóa:
                </div>
                <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.oldValue, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.newValue !== undefined && (
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Dữ liệu mới cập nhật:
                </div>
                <pre className="text-[11px] font-mono bg-slate-900 text-emerald-400 p-3 rounded-xl overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.newValue, null, 2)}
                </pre>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(selectedLog.userName);
                  setSelectedLog(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition"
              >
                Lọc toàn bộ log của user này
              </button>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
