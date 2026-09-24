"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Eye,
  Plus,
  Edit,
  Trash2,
  Save,
  RotateCcw,
  Download,
  Upload,
  Shield,
  Lock,
  Check,
  X,
  AlertTriangle,
  Search,
  FileJson,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { usePermission } from "@/components/PermissionGuard";
import {
  getFullMatrix,
  saveCustomMatrix,
  getLegacyPermissionMatrix,
  resetCustomMatrix,
  getEffectivePermissions,
  loadSharedPermissionMatrix,
  subscribeSharedPermissionMatrix,
  ROLE_LABELS,
  MODULE_LABELS,
  ROLE_COLORS,
  ALL_ROLES,
  ALL_MODULES,
  type Role,
  type Module,
} from "@/lib/permissions";
import { logAudit } from "@/lib/audit-log";
import { authFetch } from "@/lib/auth-fetch";
import { supabase, supabaseUpsert, isSupabaseEnabled } from "@/lib/supabase/client";
import { useState as useReactState } from "react";
type Matrix = Record<Role, Record<Module, string>>;
interface PermissionUser { id: string; email: string; name: string; role: Role; phongBan: string; chucVu?: string; }
const ACTION_META = {
  r: { label: "Xem", icon: Eye, color: "blue", letter: "X" },
  c: { label: "Tạo", icon: Plus, color: "emerald", letter: "T" },
  u: { label: "Sửa", icon: Edit, color: "amber", letter: "S" },
  d: { label: "Xóa", icon: Trash2, color: "rose", letter: "X" },
} as const;
const ACTIONS: ("r" | "c" | "u" | "d")[] = ["r", "c", "u", "d"];
export default function PhanQuyenTuyChinhPage() {
  const { user } = useSession();
  const perm = usePermission();
  const [matrix, setMatrix] = useState<Matrix>(() => getFullMatrix() as Matrix);
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"matrix" | "users" | "accounts">("matrix");
  const [users, setUsers] = useState<PermissionUser[]>([]);
  const [savingUser, setSavingUser] = useState<string | null>(null);
  useEffect(() => {
    const fetchUsers = async () => {
      if (isSupabaseEnabled && supabase) {
        try {
          const response = await authFetch("/api/admin/users", { cache: "no-store" });
          const result = await response.json();
          if (!response.ok || result.error || !Array.isArray(result.users)) throw new Error(result.error || "Không tải được tài khoản");
          const data = result.users as PermissionUser[];
          const error = null;
          if (!error && data) {
            // Map data from DB to match the structure expected by the UI
            const formattedUsers = data.map((u) => ({
              id: u.id,
              email: u.email,
              name: u.name,
              role: u.role as Role,
              phongBan: u.phongBan || "khac",
              chucVu: u.chucVu || "",
            }));
            setUsers(formattedUsers);
          }
        } catch (e) {
          console.error("Lỗi khi tải danh sách users:", e);
          toast.error("Không tải được tài khoản. Vui lòng tải lại trang.");
        }
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);
  useEffect(() => {
    let active = true;
    void loadSharedPermissionMatrix().then((shared) => {
      if (active) setMatrix(shared as Matrix);
    });
    const unsubscribe = subscribeSharedPermissionMatrix((shared) => {
      if (active) {
        setMatrix(shared as Matrix);
        setDirty(false);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, []);
  // Reload matrix khi user click refresh
  const reload = () => {
    setMatrix(getFullMatrix() as Matrix);
    setDirty(false);
  };
  // Toggle 1 action cho 1 role-module cell
  const toggle = (role: Role, mod: Module, action: "r" | "c" | "u" | "d") => {
    if (role === "admin") return;
    setMatrix((prev) => {
      const current = prev[role]?.[mod] || "";
      const has = current.includes(action);
      const next = has ? current.replace(action, "") : (current + action).split("").sort().join(""); // sort để r-c-u-d
      return {
        ...prev,
        [role]: { ...prev[role], [mod]: next },
      };
    });
    setDirty(true);
  };
  // Toggle all 4 actions cho 1 cell
  const toggleAll = (role: Role, mod: Module) => {
    if (role === "admin") return;
    setMatrix((prev) => {
      const current = prev[role]?.[mod] || "";
      const next = current === "rcud" ? "" : "rcud";
      return {
        ...prev,
        [role]: { ...prev[role], [mod]: next },
      };
    });
    setDirty(true);
  };
  // Toggle 1 action cho tất cả module của 1 role (cột)
  const toggleColumn = (role: Role, action: "r" | "c" | "u" | "d") => {
    if (role === "admin") return;
    setMatrix((prev) => {
      const allHave = ALL_MODULES.every((m) => (prev[role]?.[m] || "").includes(action));
      return {
        ...prev,
        [role]: Object.fromEntries(
          ALL_MODULES.map((m) => {
            const cur = prev[role]?.[m] || "";
            const has = cur.includes(action);
            const next = allHave
              ? cur.replace(action, "")
              : (cur + action).split("").sort().join("");
            return [m, next];
          })
        ) as Record<Module, string>,
      };
    });
    setDirty(true);
  };
  // Save matrix
  const handleSave = async () => {
    try {
      await saveCustomMatrix(matrix);
      setDirty(false);
    logAudit({
      user,
      action: "update",
      module: "phan-quyen-tuy-chinh",
      description: `Cập nhật permission matrix (7 role × ${ALL_MODULES.length} module)`,
      success: true,
    });
      toast.success("✅ Đã lưu và đồng bộ ma trận phân quyền");
    } catch (error) {
      toast.error(`Không đồng bộ được phân quyền: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
    }
  };
  const handleRestoreLegacy = () => {
    try {
      const previous = getLegacyPermissionMatrix();
      if (!previous) {
        toast.error("Không tìm thấy bản cũ. Hãy mở đúng trình duyệt và địa chỉ web anh đã dùng để chỉnh quyền, hoặc Import bản JSON đã xuất.");
        return;
      }
      setMatrix(previous as Matrix);
      setDirty(true);
      toast.success("Đã lấy lại bản quyền cũ. Kiểm tra bảng rồi bấm Lưu để áp dụng và đồng bộ.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không đọc được bản quyền cũ");
    }
  };
  // Reset về mặc định
  const handleReset = async () => {
    resetCustomMatrix();
    const defaults = getFullMatrix() as Matrix;
    setMatrix(defaults);
    try {
      await saveCustomMatrix(defaults);
    } catch (error) {
      toast.error(`Không đồng bộ được quyền mặc định: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
      return;
    }
    setDirty(false);
    setShowConfirmReset(false);
    logAudit({
      user,
      action: "update",
      module: "phan-quyen-tuy-chinh",
      description: "Reset permission matrix về mặc định",
      success: true,
    });
    toast.success("Đã reset về ma trận mặc định");
  };
  // Export JSON
  const handleExport = () => {
    const json = JSON.stringify(matrix, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `permission-matrix-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã tải file JSON");
  };
  // Import JSON
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string) as Matrix;
          // Validate cơ bản
          const isValid = ALL_ROLES.every((r) => imported[r] && typeof imported[r] === "object");
          if (!isValid) throw new Error("Format JSON không hợp lệ");
          setMatrix(imported);
          setDirty(true);
          toast.success(`Đã import ${ALL_ROLES.length} role`);
        } catch (err: any) {
          toast.error(`Import lỗi: ${err.message}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  // Filter modules theo search
  const filteredModules = useMemo(() => {
    if (!search) return ALL_MODULES;
    const s = search.toLowerCase();
    return ALL_MODULES.filter((m) => {
      const label = (MODULE_LABELS[m] || m).toLowerCase();
      return label.includes(s) || m.toLowerCase().includes(s);
    });
  }, [search]);
  // Thống kê
  const stats = useMemo(() => {
    return ALL_ROLES.map((role) => {
      const total = ALL_MODULES.reduce((sum, m) => {
        return sum + (matrix[role]?.[m] || "").length;
      }, 0);
      return { role, total, max: ALL_MODULES.length * 4 };
    });
  }, [matrix]);
  // Guard: chỉ admin mới vào được
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse opacity-60">Đang kiểm tra quyền...</div>
      </div>
    );
  }
  if (!perm.canView("phan-quyen-tuy-chinh")) {
    return (
      <div className="max-w-md mx-auto p-6 animate-fade-in">
        <div className="card p-6 text-center bg-gradient-to-br from-rose-500/10 to-amber-500/10 border-rose-500/30">
          <Lock className="w-12 h-12 mx-auto mb-3 text-rose-500" />
          <h2 className="text-xl font-bold mb-2">🚫 Không có quyền truy cập</h2>
          <p className="text-sm opacity-70 mb-4">
            Trang này chỉ dành cho <b>Quản trị viên (Admin)</b>.
          </p>
          <a href="/dashboard" className="btn-primary inline-block">
            ← Về Dashboard
          </a>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-[1600px] mx-auto space-y-3 animate-fade-in p-3">
      {/* Header */}
      <div className="card p-4 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-emerald-500/10">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Shield className="w-7 h-7 text-rose-500" /> Phân quyền tùy chỉnh
            </h1>
            <p className="opacity-70 text-sm mt-1">
              Ma trận{" "}
              <b>
                {ALL_ROLES.length} role × {ALL_MODULES.length} module × 4 action
              </b>{" "}
              · Click toggle r/c/u/d · Lưu để áp dụng
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {dirty && (
              <span className="text-xs px-2 py-1 bg-amber-500/15 text-amber-700 rounded-full font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Chưa lưu
              </span>
            )}
            <button
              onClick={handleRestoreLegacy}
              className="btn-secondary text-xs flex items-center gap-1"
              title="Lấy lại phân quyền đã chỉnh trước bản cập nhật"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Khôi phục bản cũ
            </button>
            <button
              onClick={handleImport}
              className="btn-secondary text-xs flex items-center gap-1"
              title="Import JSON"
            >
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
            <button
              onClick={handleExport}
              className="btn-secondary text-xs flex items-center gap-1"
              title="Export JSON"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button
              onClick={() => setShowConfirmReset(true)}
              className="btn-secondary text-xs flex items-center gap-1 text-rose-600"
              title="Reset về mặc định"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!dirty}
              className="btn-primary text-xs flex items-center gap-1 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {dirty ? "Lưu" : "Đã lưu"}
            </button>
          </div>
        </div>
      </div>
      {/* Confirm Reset Modal */}
      {showConfirmReset && (
        <div className="card p-4 bg-rose-500/10 border-rose-500/30 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Reset về ma trận mặc định?</p>
            <p className="text-xs opacity-70">Toàn bộ tùy chỉnh sẽ bị xoá. Không thể hoàn tác.</p>
          </div>
          <button onClick={() => setShowConfirmReset(false)} className="btn-secondary text-xs">
            Huỷ
          </button>
          <button onClick={handleReset} className="btn-primary text-xs bg-rose-500">
            Reset
          </button>
        </div>
      )}
      {/* Stats per role */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {stats.map(({ role, total, max }) => {
          const pct = Math.round((total / max) * 100);
          return (
            <div
              key={role}
              className={`card p-2 bg-gradient-to-br ${ROLE_COLORS[role] || "from-slate-500 to-slate-700"} text-white`}
            >
              <div className="text-[10px] opacity-80 uppercase font-semibold">{role}</div>
              <div className="text-lg font-bold">
                {total}/{max}
              </div>
              <div className="text-[10px] opacity-80">{pct}% quyền</div>
            </div>
          );
        })}
      </div>
      {/* Tabs: Matrix | Users */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        {[
          { key: "matrix", label: "🛡️ Ma trận 9×30", count: 30 },
          { key: "users", label: "👥 Gán user cho role", count: users.length },
          { key: "accounts", label: "📋 Bảng tài khoản", count: users.length },
        ].map((t: any) => (
          <button
            key={t.key}
            onClick={() => setView(t.key as any)}
            className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
              view === t.key ? "bg-white dark:bg-slate-700 shadow" : "opacity-60"
            }`}
          >
            {t.label} <span className="text-[10px] opacity-60">({t.count})</span>
          </button>
        ))}
      </div>
      {view === "users" && (
        <UserRoleManager
          users={users}
          setUsers={setUsers}
          savingUser={savingUser}
          setSavingUser={setSavingUser}
        />
      )}
      {view === "accounts" && (
        <UserPermissionTable users={users} matrix={matrix} />
      )}
      {view === "matrix" && (
        <>
          {/* Search */}
          <div className="card p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm module..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          {/* Matrix */}
          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
                  <th className="p-2 text-left sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 min-w-[180px]">
                    Module
                  </th>
                  {ALL_ROLES.map((role) => (
                    <th
                      key={role}
                      className="p-1.5 text-center min-w-[100px]"
                      title={ROLE_LABELS[role]}
                    >
                      <div
                        className={`text-[10px] font-bold bg-gradient-to-br ${ROLE_COLORS[role] || "from-slate-500 to-slate-700"} bg-clip-text text-transparent`}
                      >
                        {ROLE_LABELS[role]}
                      </div>
                      <div className="text-[8px] opacity-60 font-normal mt-0.5">X T S X</div>
                      {/* Header buttons: toggle all per action cho cột */}
                      <div className="flex gap-0.5 mt-1 justify-center">
                        {ACTIONS.map((act) => (
                          <button
                            key={act}
                            onClick={() => toggleColumn(role, act)}
                            className={`w-4 h-4 rounded text-[8px] font-bold transition-all hover:scale-110 ${
                              ACTION_META[act].color === "blue"
                                ? "bg-blue-500/20 text-blue-700 hover:bg-blue-500/40"
                                : ACTION_META[act].color === "emerald"
                                  ? "bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/40"
                                  : ACTION_META[act].color === "amber"
                                    ? "bg-amber-500/20 text-amber-700 hover:bg-amber-500/40"
                                    : "bg-rose-500/20 text-rose-700 hover:bg-rose-500/40"
                            }`}
                            title={`Toggle ${ACTION_META[act].label} cho tất cả module của role ${role}`}
                          >
                            {ACTION_META[act].letter}
                          </button>
                        ))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredModules.map((mod) => (
                  <tr
                    key={mod}
                    className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="p-2 font-semibold sticky left-0 bg-white dark:bg-slate-900 z-10 min-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <span className="opacity-50">•</span>
                        <span>{MODULE_LABELS[mod] || mod}</span>
                      </div>
                    </td>
                    {ALL_ROLES.map((role) => {
                      const perms = matrix[role]?.[mod] || "";
                      return (
                        <td key={role} className="p-1 text-center">
                          <div className="flex gap-0.5 justify-center">
                            {ACTIONS.map((act) => {
                              const has = perms.includes(act);
                              const meta = ACTION_META[act];
                              return (
                                <button
                                  key={act}
                                  onClick={() => toggle(role, mod, act)}
                                  className={`w-5 h-5 rounded text-[9px] font-bold transition-all ${
                                    has
                                      ? `bg-${meta.color}-500 text-white shadow-sm`
                                      : `bg-slate-100 dark:bg-slate-800 text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700`
                                  }`}
                                  title={`${meta.label} (${act})`}
                                >
                                  {has ? meta.letter : "·"}
                                </button>
                              );
                            })}
                            {/* Quick toggle all */}
                            <button
                              onClick={() => toggleAll(role, mod)}
                              className={`w-5 h-5 rounded text-[9px] font-bold transition-all ${
                                perms === "rcud"
                                  ? "bg-violet-500 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-violet-500/20 hover:text-violet-600"
                              }`}
                              title="Toggle tất cả (rcud)"
                            >
                              {perms === "rcud" ? "✓" : "✦"}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Legend */}
          <div className="card p-3">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
              <FileJson className="w-4 h-4" /> Chú thích
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {ACTIONS.map((act) => {
                const meta = ACTION_META[act];
                return (
                  <div key={act} className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center bg-${meta.color}-500 text-white`}
                    >
                      {meta.letter}
                    </span>
                    <span>
                      <b>{meta.label}</b> -{" "}
                      {act === "r"
                        ? "Xem dữ liệu"
                        : act === "c"
                          ? "Tạo mới"
                          : act === "u"
                            ? "Cập nhật"
                            : "Xoá"}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center bg-violet-500 text-white">
                  ✓
                </span>
                <span>
                  <b>Tất cả</b> - Click để bật/tắt cả 4
                </span>
              </div>
            </div>
            <p className="text-[10px] opacity-60 mt-2">
              💡 Click <b>X/T/S/X</b> ở header cột để toggle action đó cho <b>tất cả module</b> của
              1 role · Click <b>✦</b> ở cuối row để toggle tất cả action cho 1 cell
            </p>
          </div>
        </>
      )}
    </div>
  );
}
// ============== USER PERMISSION TABLE ==============
function UserPermissionTable({
  users,
  matrix,
}: {
  users: PermissionUser[];
  matrix: Matrix;
}) {
  const [filterRole, setFilterRole] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<PermissionUser | null>(null);

  const filtered = users.filter((u) => {
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!u.name.toLowerCase().includes(s) && !u.email.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const getUserPerms = (u: PermissionUser) => matrix[u.role] || {};

  // Chỉ hiện các module mà ít nhất 1 user trong danh sách có quyền
  const activeModules = ALL_MODULES.filter((m) =>
    filtered.some((u) => (getUserPerms(u)[m] || "") !== "")
  );

  if (selectedUser) {
    const perms = getUserPerms(selectedUser);
    return (
      <div className="space-y-3">
        <div className="card p-3 flex items-center gap-3">
          <button
            onClick={() => setSelectedUser(null)}
            className="btn-secondary text-xs"
          >
            ← Quay lại
          </button>
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${ROLE_COLORS[selectedUser.role]} text-white flex items-center justify-center font-bold text-sm shrink-0`}
          >
            {selectedUser.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-sm">{selectedUser.name}</div>
            <div className="text-[11px] opacity-60">{selectedUser.email} · <span className={`px-1.5 py-0.5 rounded text-white text-[10px] font-bold bg-gradient-to-r ${ROLE_COLORS[selectedUser.role]}`}>{ROLE_LABELS[selectedUser.role]}</span></div>
          </div>
        </div>
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="p-2 text-left sticky left-0 bg-slate-100 dark:bg-slate-800 min-w-[180px]">Module</th>
                {ACTIONS.map((act) => (
                  <th key={act} className="p-2 text-center w-16">
                    <span className={`px-2 py-0.5 rounded text-white text-[10px] font-bold ${
                      act === "r" ? "bg-blue-500" : act === "c" ? "bg-emerald-500" : act === "u" ? "bg-amber-500" : "bg-rose-500"
                    }`}>{ACTION_META[act].label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_MODULES.map((mod) => {
                const p = perms[mod] || "";
                const hasAny = p.length > 0;
                return (
                  <tr key={mod} className={`border-t border-slate-200 dark:border-slate-700 ${
                    hasAny ? "" : "opacity-30"
                  }`}>
                    <td className="p-2 font-medium sticky left-0 bg-white dark:bg-slate-900">{MODULE_LABELS[mod] || mod}</td>
                    {ACTIONS.map((act) => (
                      <td key={act} className="p-2 text-center">
                        {p.includes(act) ? (
                          <span className={`inline-flex w-5 h-5 rounded items-center justify-center text-white text-[10px] font-bold ${
                            act === "r" ? "bg-blue-500" : act === "c" ? "bg-emerald-500" : act === "u" ? "bg-amber-500" : "bg-rose-500"
                          }`}>✓</span>
                        ) : (
                          <span className="inline-flex w-5 h-5 rounded items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-300 text-[10px]">·</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="card p-3">
        <h3 className="font-bold text-sm mb-2">📋 Bảng phân quyền theo tài khoản</h3>
        <p className="text-xs opacity-70 mb-3">Xem quyền thực tế của từng tài khoản (kế thừa từ vai trò). Click vào tên để xem chi tiết.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1">🔍 Tìm tên / email</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên hoặc email..."
              className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">🎭 Lọc vai trò</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="all">Tất cả vai trò</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]} ({users.filter((u) => u.role === r).length})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-2 text-[10px] opacity-60">Hiển thị: {filtered.length} / {users.length} tài khoản</div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
              <th className="p-2 text-left sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 min-w-[200px]">
                Tài khoản
              </th>
              <th className="p-2 text-center min-w-[90px]">Vai trò</th>
              {activeModules.map((m) => (
                <th key={m} className="p-1 text-center min-w-[80px]">
                  <div className="text-[9px] font-semibold leading-tight">{MODULE_LABELS[m] || m}</div>
                  <div className="text-[8px] opacity-50 mt-0.5">X T S X</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const perms = getUserPerms(u);
              return (
                <tr
                  key={u.id}
                  className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer"
                  onClick={() => setSelectedUser(u)}
                >
                  <td className="p-2 sticky left-0 bg-white dark:bg-slate-900 z-10">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${ROLE_COLORS[u.role]} text-white flex items-center justify-center font-bold text-[10px] shrink-0`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-xs">{u.name}</div>
                        <div className="text-[9px] opacity-50 truncate max-w-[130px]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-1 text-center">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded text-white font-bold bg-gradient-to-r ${ROLE_COLORS[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  {activeModules.map((m) => {
                    const p = perms[m] || "";
                    return (
                      <td key={m} className="p-1 text-center">
                        <div className="flex gap-0.5 justify-center">
                          {ACTIONS.map((act) => (
                            <span
                              key={act}
                              className={`inline-flex w-4 h-4 rounded items-center justify-center text-[8px] font-bold ${
                                p.includes(act)
                                  ? act === "r" ? "bg-blue-500 text-white" : act === "c" ? "bg-emerald-500 text-white" : act === "u" ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-300"
                              }`}
                            >
                              {p.includes(act) ? ACTION_META[act].letter : "·"}
                            </span>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center opacity-60 text-sm">Không tìm thấy tài khoản nào</div>
        )}
      </div>

      <div className="card p-3 bg-blue-500/5 border-blue-500/20 text-xs">
        💡 <b>Lưu ý:</b> Quyền hiển thị ở đây kế thừa từ vai trò (role) của từng tài khoản. Để thay đổi quyền, hãy chỉnh ma trận ở tab <b>"Ma trận"</b> hoặc đổi vai trò ở tab <b>"Gán user cho role"</b>.
      </div>
    </div>
  );
}

// ============== USER ROLE MANAGER ==============
function UserRoleManager({
  users,
  setUsers,
  savingUser,
  setSavingUser,
}: {
  users: PermissionUser[];
  setUsers: (u: PermissionUser[]) => void;
  savingUser: string | null;
  setSavingUser: (s: string | null) => void;
}) {
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterPB, setFilterPB] = useState<string>("all");
  const [search, setSearch] = useState("");
  const filtered = users.filter((u) => {
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (filterPB !== "all" && u.phongBan !== filterPB) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!u.name.toLowerCase().includes(s) && !u.email.toLowerCase().includes(s)) return false;
    }
    return true;
  });
  // Group theo role
  const byRole: Record<string, typeof users> = {};
  filtered.forEach((u) => {
    if (!byRole[u.role]) byRole[u.role] = [];
    byRole[u.role].push(u);
  });
  // Lay unique phong ban
  const allPB = Array.from(new Set(users.map((u) => u.phongBan))).sort();
  const handleChangeRole = async (email: string, newRole: Role) => {
    setSavingUser(email);
    try {
      if (isSupabaseEnabled && supabase) {
        const existing = users.find(account => account.email === email);
        if (existing) {
          const response = await authFetch(`/api/admin/users/${encodeURIComponent(existing.id)}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }),
          });
          const result = await response.json();
          if (!response.ok || result.error) throw new Error(result.error || "Không lưu được vai trò");
        } else {
          throw new Error("Không tìm thấy tài khoản");
        }
      } else {
        throw new Error("Chưa kết nối dữ liệu tài khoản");
      }
      setUsers(users.map((u) => (u.email === email ? { ...u, role: newRole } : u)));
      toast.success(`Đã đổi role ${email} → ${newRole}`);
    } catch (e) {
      toast.error(`Lỗi: ${(e as Error).message}`);
    } finally {
      setSavingUser(null);
    }
  };
  return (
    <div className="space-y-3">
      <div className="card p-3">
        <h3 className="font-bold text-sm mb-2">👥 Gán role cho {users.length} user</h3>
        <p className="text-xs opacity-70 mb-3">
          Chỉnh role bằng dropdown → tự động lưu vào bảng <code>users</code> trong Supabase.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1">🔍 Tìm</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tên hoặc email..."
              className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">🎭 Lọc role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="all">Tất cả role</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]} ({users.filter((u) => u.role === r).length})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">🏢 Lọc phòng ban</label>
            <select
              value={filterPB}
              onChange={(e) => setFilterPB(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="all">Tất cả phòng ban</option>
              {allPB.map((pb) => (
                <option key={pb} value={pb}>
                  {pb} ({users.filter((u) => u.phongBan === pb).length})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-2 text-[10px] opacity-60">
          Hiển thị: {filtered.length} / {users.length} user
        </div>
      </div>
      {Object.entries(byRole).map(([role, list]) => (
        <div key={role} className="card p-3">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full text-white font-bold uppercase bg-gradient-to-r ${ROLE_COLORS[role as Role]}`}
            >
              {role}
            </span>
            <span className="text-xs opacity-70">
              {ROLE_LABELS[role as Role]} · {list.length} user
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {list.map((u) => (
              <div
                key={u.email}
                className="flex items-center gap-2 p-2 rounded border border-slate-100 dark:border-slate-700 hover:border-blue-400 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${ROLE_COLORS[u.role]} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                >
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{u.name}</div>
                  <div className="text-[10px] opacity-60 truncate">{u.email}</div>
                  <div className="text-[10px] opacity-50">🏢 {u.phongBan}</div>
                </div>
                <select
                  value={u.role}
                  onChange={(e) => handleChangeRole(u.email, e.target.value as Role)}
                  disabled={savingUser === u.email}
                  className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                {savingUser === u.email && <span className="text-[10px] opacity-60">💾</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="card p-6 text-center opacity-60 text-sm">
          Không tìm thấy user nào khớp bộ lọc
        </div>
      )}
      <div className="card p-3 bg-amber-500/5 border-amber-500/20 text-xs">
        <b>💡 Lưu ý:</b> Thay đổi role sẽ:
        <ul className="list-disc ml-5 mt-1 space-y-0.5 opacity-80">
          <li>
            Cập nhật bảng <code>users</code> trong Supabase (cột <code>role</code>)
          </li>
          <li>
            User cần <b>đăng xuất + đăng nhập lại</b> để áp dụng quyền mới
          </li>
          <li>
            Nếu user NCC (partner) → redirect sang <code>/trang-chu-gia-cong</code> thay vì{" "}
            <code>/dashboard</code>
          </li>
          <li>
            Permission matrix lưu localStorage (client-side), KHÔNG liên quan đến thay đổi role ở
            đây
          </li>
        </ul>
      </div>
    </div>
  );
}
