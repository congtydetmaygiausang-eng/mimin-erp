"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Eye, Plus, Edit, Trash2, Save, RotateCcw, Download, Upload,
  Shield, Lock, Check, X, AlertTriangle, Search, FileJson
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { usePermission } from "@/components/PermissionGuard";
import {
  getFullMatrix, saveCustomMatrix, resetCustomMatrix, getEffectivePermissions,
  ROLE_LABELS, MODULE_LABELS, ROLE_COLORS, ALL_ROLES, ALL_MODULES,
  type Role, type Module,
} from "@/lib/permissions";
import { logAudit } from "@/lib/audit-log";

type Matrix = Record<Role, Record<Module, string>>;

const ACTION_META = {
  r: { label: "Xem", icon: Eye, color: "blue", letter: "R" },
  c: { label: "Tạo", icon: Plus, color: "emerald", letter: "C" },
  u: { label: "Sửa", icon: Edit, color: "amber", letter: "U" },
  d: { label: "Xóa", icon: Trash2, color: "rose", letter: "D" },
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

  useEffect(() => {
    setLoading(false);
  }, []);

  // Reload matrix khi user click refresh
  const reload = () => {
    setMatrix(getFullMatrix() as Matrix);
    setDirty(false);
  };

  // Toggle 1 action cho 1 role-module cell
  const toggle = (role: Role, mod: Module, action: "r" | "c" | "u" | "d") => {
    setMatrix((prev) => {
      const current = prev[role]?.[mod] || "";
      const has = current.includes(action);
      const next = has
        ? current.replace(action, "")
        : (current + action).split("").sort().join(""); // sort để r-c-u-d
      return {
        ...prev,
        [role]: { ...prev[role], [mod]: next },
      };
    });
    setDirty(true);
  };

  // Toggle all 4 actions cho 1 cell
  const toggleAll = (role: Role, mod: Module) => {
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
    setMatrix((prev) => {
      const allHave = ALL_MODULES.every((m) => (prev[role]?.[m] || "").includes(action));
      return {
        ...prev,
        [role]: Object.fromEntries(
          ALL_MODULES.map((m) => {
            const cur = prev[role]?.[m] || "";
            const has = cur.includes(action);
            const next = allHave ? cur.replace(action, "") : (cur + action).split("").sort().join("");
            return [m, next];
          })
        ) as Record<Module, string>,
      };
    });
    setDirty(true);
  };

  // Save matrix
  const handleSave = () => {
    saveCustomMatrix(matrix);
    setDirty(false);
    logAudit({
      user,
      action: "update",
      module: "phan-quyen-tuy-chinh",
      description: `Cập nhật permission matrix (7 role × ${ALL_MODULES.length} module)`,
      success: true,
    });
    toast.success("✅ Đã lưu ma trận phân quyền");
  };

  // Reset về mặc định
  const handleReset = () => {
    resetCustomMatrix();
    reload();
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
          <a href="/dashboard" className="btn-primary inline-block">← Về Dashboard</a>
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
              Ma trận <b>{ALL_ROLES.length} role × {ALL_MODULES.length} module × 4 action</b> · Click toggle r/c/u/d · Lưu để áp dụng
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {dirty && (
              <span className="text-xs px-2 py-1 bg-amber-500/15 text-amber-700 rounded-full font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Chưa lưu
              </span>
            )}
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
          <button onClick={() => setShowConfirmReset(false)} className="btn-secondary text-xs">Huỷ</button>
          <button onClick={handleReset} className="btn-primary text-xs bg-rose-500">Reset</button>
        </div>
      )}

      {/* Stats per role */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {stats.map(({ role, total, max }) => {
          const pct = Math.round((total / max) * 100);
          return (
            <div key={role} className={`card p-2 bg-gradient-to-br ${ROLE_COLORS[role] || "from-slate-500 to-slate-700"} text-white`}>
              <div className="text-[10px] opacity-80 uppercase font-semibold">{role}</div>
              <div className="text-lg font-bold">{total}/{max}</div>
              <div className="text-[10px] opacity-80">{pct}% quyền</div>
            </div>
          );
        })}
      </div>

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
                <th key={role} className="p-1.5 text-center min-w-[100px]" title={ROLE_LABELS[role]}>
                  <div className={`text-[10px] font-bold bg-gradient-to-br ${ROLE_COLORS[role] || "from-slate-500 to-slate-700"} bg-clip-text text-transparent`}>
                    {role}
                  </div>
                  <div className="text-[8px] opacity-60 font-normal mt-0.5">R C U D</div>
                  {/* Header buttons: toggle all per action cho cột */}
                  <div className="flex gap-0.5 mt-1 justify-center">
                    {ACTIONS.map((act) => (
                      <button
                        key={act}
                        onClick={() => toggleColumn(role, act)}
                        className={`w-4 h-4 rounded text-[8px] font-bold transition-all hover:scale-110 ${
                          ACTION_META[act].color === "blue" ? "bg-blue-500/20 text-blue-700 hover:bg-blue-500/40" :
                          ACTION_META[act].color === "emerald" ? "bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/40" :
                          ACTION_META[act].color === "amber" ? "bg-amber-500/20 text-amber-700 hover:bg-amber-500/40" :
                          "bg-rose-500/20 text-rose-700 hover:bg-rose-500/40"
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
              <tr key={mod} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30">
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
                <span className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center bg-${meta.color}-500 text-white`}>
                  {meta.letter}
                </span>
                <span><b>{meta.label}</b> - {act === "r" ? "Xem dữ liệu" : act === "c" ? "Tạo mới" : act === "u" ? "Cập nhật" : "Xoá"}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center bg-violet-500 text-white">✓</span>
            <span><b>Tất cả</b> - Click để bật/tắt cả 4</span>
          </div>
        </div>
        <p className="text-[10px] opacity-60 mt-2">
          💡 Click <b>R/C/U/D</b> ở header cột để toggle action đó cho <b>tất cả module</b> của 1 role · Click <b>✦</b> ở cuối row để toggle tất cả action cho 1 cell
        </p>
      </div>
    </div>
  );
}
