"use client";

import { useState, useMemo } from "react";
import {
  Activity, Search, Filter, Download, Trash2, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle, Edit2, Trash, Plus,
  Eye, LogIn, LogOut, KeyRound, Shield, UserCog, ChevronDown
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { usePermission } from "@/components/PermissionGuard";
import { logAudit, getAuditLogs, filterAuditLogs, getAuditStats, clearAuditLogs, type AuditLog, type AuditAction, type AuditModule } from "@/lib/audit-log";
import { ALL_MODULES, ALL_ROLES, MODULE_LABELS, ROLE_LABELS, ROLE_COLORS, type Module, type Role } from "@/lib/permissions";
import { Avatar } from "@/components/Avatar";
import { toast } from "sonner";

const ACTION_ICONS: Record<string, any> = {
  create: Plus, update: Edit2, delete: Trash, view: Eye,
  login: LogIn, logout: LogOut, login_failed: XCircle,
  permission_denied: Shield, password_change: KeyRound,
  role_change: UserCog, "2fa_enable": Shield, "2fa_disable": Shield,
  payment: CheckCircle2, approve: CheckCircle2, reject: XCircle,
  import: Download, export: Download, assign: UserCog,
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-500/15 text-emerald-700",
  update: "bg-amber-500/15 text-amber-700",
  delete: "bg-red-500/15 text-red-700",
  view: "bg-sky-500/15 text-sky-700",
  login: "bg-violet-500/15 text-violet-700",
  logout: "bg-slate-500/15 text-slate-700",
  login_failed: "bg-red-500/15 text-red-700",
  permission_denied: "bg-orange-500/15 text-orange-700",
  payment: "bg-emerald-500/15 text-emerald-700",
  approve: "bg-emerald-500/15 text-emerald-700",
  reject: "bg-red-500/15 text-red-700",
  import: "bg-cyan-500/15 text-cyan-700",
  export: "bg-cyan-500/15 text-cyan-700",
  assign: "bg-pink-500/15 text-pink-700",
};

export default function AuditLogPage() {
  const { user } = useSession();
  const perm = usePermission();
  const [logs, setLogs] = useState<AuditLog[]>(getAuditLogs());
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState<AuditModule | "all">("all");
  const [filterAction, setFilterAction] = useState<AuditAction | "all">("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [onlyFailed, setOnlyFailed] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "trash">("history");

  const stats = useMemo(() => getAuditStats(logs), [logs]);

  const filtered = useMemo(() => {
    return filterAuditLogs(logs, {
      search,
      module: filterModule,
      action: filterAction,
      onlyFailed,
    }).filter((l) => filterRole === "all" || l.userRole === filterRole)
      .reverse(); // Mới nhất trước
  }, [logs, search, filterModule, filterAction, filterRole, onlyFailed]);

  const trashLogs = useMemo(() => {
    return logs.filter((l) => l.action === "delete" && l.oldValue != null).reverse();
  }, [logs]);

  if (!perm.canView("cai-dat")) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto mt-12">
        <Shield className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Quyền quản trị</h2>
        <p className="text-sm opacity-70">Trang Audit Log chỉ dành cho Quản trị viên.</p>
      </div>
    );
  }

  const refresh = () => setLogs(getAuditLogs());

  const handleClear = () => {
    if (confirm("Xoá toàn bộ lịch sử? Hành động này không thể hoàn tác.")) {
      clearAuditLogs();
      setLogs([]);
      toast.success("Đã xoá lịch sử");
      logAudit({ user, action: "delete", module: "audit-log", description: "Xoá toàn bộ audit log" });
    }
  };

  const handleExport = () => {
    const csv = [
      ["ID", "Timestamp", "User", "Email", "Role", "Action", "Module", "Resource", "Description", "Success"].join(","),
      ...filtered.map((l) => [
        l.id, l.timestamp, l.userName, l.userEmail, l.userRole,
        l.action, l.module, l.resourceName || "", `"${l.description.replace(/"/g, "'")}"`,
        l.success,
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${filtered.length} logs`);
  };

  const handleRestore = async (log: AuditLog) => {
    if (!log.oldValue) return;
    if (!confirm("Bạn có chắc chắn muốn khôi phục dữ liệu này không?")) return;

    try {
      const { supabaseUpsertRaw, camelToSnake } = await import("@/lib/supabase/sync-helper");
      
      let tableName = "";
      let payload: any = {};
      
      if (log.module === "lenh-cat") {
        tableName = "lenh_cat";
        payload = camelToSnake(log.oldValue);
      } else if (log.module === "danh-muc-sp") {
        tableName = "san_pham";
        payload = camelToSnake(log.oldValue);
        payload.ma_sp = (log.oldValue as any).id;
        delete payload.id;
      } else if (log.module === "kho-thanh-pham") {
        tableName = "kho_thanh_pham";
        const { toSupabaseRow } = await import("../kho-thanh-pham/data");
        payload = toSupabaseRow(log.oldValue as any);
      } else {
        toast.error("Không hỗ trợ khôi phục module này");
        return;
      }

      await supabaseUpsertRaw(tableName, payload);
      toast.success("Khôi phục thành công! Đã đồng bộ lên hệ thống.");
      
      logAudit({ user, action: "create", module: log.module, description: `[Khôi phục từ thùng rác] ${log.resourceName || log.resourceId || ""}` });
      refresh();
    } catch (e) {
      console.error(e);
      toast.error("Khôi phục thất bại");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Activity className="w-7 h-7 text-violet-500" /> Audit Log
          </h1>
          <p className="opacity-70 mt-1 text-sm">Lịch sử thao tác · {stats.total} logs · {stats.today} hôm nay</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="btn-secondary flex items-center gap-1"><RefreshCw className="w-4 h-4" /> Tải lại</button>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-1"><Download className="w-4 h-4" /> Xuất CSV</button>
          <button onClick={handleClear} className="btn-secondary flex items-center gap-1 text-red-600"><Trash2 className="w-4 h-4" /> Xoá</button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "history" ? "border-violet-500 text-violet-500" : "border-transparent opacity-60 hover:opacity-100"}`}
        >
          Lịch sử hệ thống
        </button>
        <button
          onClick={() => setActiveTab("trash")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "trash" ? "border-violet-500 text-violet-500" : "border-transparent opacity-60 hover:opacity-100"}`}
        >
          Thùng rác ({trashLogs.length})
        </button>
      </div>

      {activeTab === "history" ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-xs opacity-70 flex items-center gap-1"><Activity className="w-3 h-3" /> Tổng logs</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs opacity-70 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Hôm nay</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{stats.today}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs opacity-70 flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> Lỗi hôm nay</div>
          <div className="text-2xl font-bold mt-1 text-red-600">{stats.failedToday}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs opacity-70 flex items-center gap-1"><UserCog className="w-3 h-3" /> User active</div>
          <div className="text-2xl font-bold mt-1">{Object.keys(stats.byUser).length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input className="input pl-9" placeholder="Tìm user, action, mô tả…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input max-w-[160px]" value={filterModule} onChange={(e) => setFilterModule(e.target.value as any)}>
            <option value="all">Tất cả module</option>
            {ALL_MODULES.map((m) => <option key={m} value={m}>{MODULE_LABELS[m]}</option>)}
          </select>
          <select className="input max-w-[160px]" value={filterAction} onChange={(e) => setFilterAction(e.target.value as any)}>
            <option value="all">Tất cả action</option>
            <option value="create">Tạo</option>
            <option value="update">Sửa</option>
            <option value="delete">Xoá</option>
            <option value="view">Xem</option>
            <option value="login">Đăng nhập</option>
            <option value="logout">Đăng xuất</option>
            <option value="permission_denied">Bị chặn</option>
            <option value="payment">Thanh toán</option>
            <option value="export">Xuất</option>
          </select>
          <select className="input max-w-[160px]" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">Tất cả role</option>
            {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <label className="flex items-center gap-2 px-3 py-2 rounded bg-white/40 text-sm cursor-pointer">
            <input type="checkbox" checked={onlyFailed} onChange={(e) => setOnlyFailed(e.target.checked)} />
            Chỉ lỗi
          </label>
        </div>
      </div>

      {/* Logs list */}
      <div className="card overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <div className="text-xs opacity-70">Hiển thị {filtered.length} / {logs.length} logs</div>
        </div>
        <div className="divide-y max-h-[700px] overflow-y-auto" style={{ borderColor: "var(--border)" }}>
          {filtered.length === 0 ? (
            <div className="p-12 text-center opacity-60 text-sm">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Chưa có log nào. Hãy thao tác trong app để tạo log.
            </div>
          ) : (
            filtered.map((log) => {
              const Icon = ACTION_ICONS[log.action] || Activity;
              const colorClass = ACTION_COLORS[log.action] || "bg-slate-500/15 text-slate-700";
              return (
                <div
                  key={log.id}
                  className="p-3 flex items-start gap-3 hover:bg-white/30 dark:hover:bg-white/5 cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Avatar name={log.userName} size="sm" />
                      <span className="font-semibold text-sm">{log.userName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-700">{log.userRole}</span>
                      <span className="text-[10px] opacity-60">·</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${colorClass}`}>{log.action}</span>
                      {!log.success && <AlertTriangle className="w-3 h-3 text-red-500" />}
                    </div>
                    <div className="text-sm">{log.description}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">
                      {new Date(log.timestamp).toLocaleString("vi-VN")} · {MODULE_LABELS[log.module as Module] || log.module}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
        </>
      ) : (
        <div className="card overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <div className="text-sm font-medium">Danh sách dữ liệu đã xoá</div>
            <div className="text-xs opacity-70">{trashLogs.length} mục có thể khôi phục</div>
          </div>
          <div className="divide-y max-h-[700px] overflow-y-auto" style={{ borderColor: "var(--border)" }}>
            {trashLogs.length === 0 ? (
              <div className="p-12 text-center opacity-60 text-sm">
                <Trash2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Thùng rác trống.
              </div>
            ) : (
              trashLogs.map((log) => {
                const Icon = Trash2;
                const colorClass = "bg-rose-500/15 text-rose-500";
                const isSupported = ["lenh-cat", "danh-muc-sp", "kho-thanh-pham"].includes(log.module);
                return (
                  <div key={log.id} className="p-3 flex items-center gap-3 hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{log.description}</div>
                      <div className="text-xs opacity-60 mt-0.5 flex gap-2">
                        <span>{new Date(log.timestamp).toLocaleString("vi-VN")}</span>
                        <span>·</span>
                        <span>User: {log.userName}</span>
                        <span>·</span>
                        <span>Module: {MODULE_LABELS[log.module as Module] || log.module}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <button 
                        className="btn-secondary text-xs px-3 py-1"
                        onClick={() => setSelectedLog(log)}
                      >
                        Chi tiết
                      </button>
                      {isSupported && (
                        <button 
                          className="btn-primary text-xs px-3 py-1 flex items-center gap-1"
                          onClick={() => handleRestore(log)}
                        >
                          <RefreshCw className="w-3 h-3" /> Khôi phục
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

      {/* Log detail modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedLog(null)}>
          <div className="card max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold text-lg">Chi tiết log</h3>
              <code className="text-[10px] opacity-60 ml-auto">{selectedLog.id}</code>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Thời gian" value={new Date(selectedLog.timestamp).toLocaleString("vi-VN")} />
              <Row label="User" value={`${selectedLog.userName} (${selectedLog.userEmail})`} />
              <Row label="Role" value={selectedLog.userRole} />
              <Row label="Action" value={selectedLog.action} />
              <Row label="Module" value={MODULE_LABELS[selectedLog.module as Module] || selectedLog.module} />
              {selectedLog.resourceName && <Row label="Resource" value={selectedLog.resourceName} />}
              <Row label="Mô tả" value={selectedLog.description} />
              <Row label="Trạng thái" value={selectedLog.success ? "✅ Thành công" : `❌ Lỗi: ${selectedLog.errorMessage || ""}`} />
              {selectedLog.userAgent && <Row label="User Agent" value={selectedLog.userAgent} />}
              {selectedLog.oldValue !== undefined && (
                <div>
                  <div className="text-xs opacity-70 mb-1">Giá trị cũ:</div>
                  <pre className="text-[10px] bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-x-auto">{JSON.stringify(selectedLog.oldValue, null, 2)}</pre>
                </div>
              )}
              {selectedLog.newValue !== undefined && (
                <div>
                  <div className="text-xs opacity-70 mb-1">Giá trị mới:</div>
                  <pre className="text-[10px] bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-x-auto">{JSON.stringify(selectedLog.newValue, null, 2)}</pre>
                </div>
              )}
            </div>
            <button onClick={() => setSelectedLog(null)} className="btn-primary w-full mt-4">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs opacity-70 w-28 shrink-0">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
