"use client";
import { useState, useEffect } from "react";
import { Database, Download, Upload, Trash2, AlertTriangle, CheckCircle2, FileJson, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const STORAGE_GROUPS = {
  "🔥 Critical (mất là chết)": [
    "mimin_erp_session", "polomimin_erp_session",
    "mimin_phanCong_v1", "polomimin_phanCong_v1",
    "polomimin_phieu_workflow_v1", "mimin_phieu_workflow_v1",
    "mimin_kho_v1", "polomimin_kho_v1",
    "mimin_kho_vai", "polomimin_kho_vai",
    "mimin_lo_soi", "polomimin_lo_soi",
    "mimin_lo_moc", "polomimin_lo_moc",
    "mimin_qc_me_soi", "polomimin_qc_me_soi",
    "mimin_lenh_tong", "polomimin_lenh_tong",
    "mimin_audit_log_v1", "polomimin_audit_log_v1",
    "mimin_notifications_v1", "polomimin_notifications_v1",
  ],
  "📦 Medium (quan trọng)": [
    "mimin_users_v2", "polomimin_user_accounts",
    "mimin_kho_vai_v2", "polomimin_kho_v1",
    "mimin_ncc_v2", "polomimin_master_ncc",
    "mimin_custom_roles_v1", "polomimin_custom_roles_v1",
    "mimin_time_bounds_v1", "polomimin_time_bounds_v1",
    "mimin_2fa_v1", "polomimin_2fa_v1",
    "mimin_view_mode", "polomimin_view_mode",
    "mimin_lark_config_v1", "polomimin_lark_config_v1",
    "mimin_lark_user_token_v1", "polomimin_lark_user_token_v1",
    "mimin_lark_mock_data_v1", "polomimin_lark_mock_data_v1",
    "mimin_lark_new_base", "polomimin_lark_new_base",
    "mimin_lark_sheet_import", "polomimin_lark_sheet_import",
    "mimin_lark_last_sync", "polomimin_lark_last_sync",
    "mimin_lark_pushed", "polomimin_lark_pushed",
  ],
  "⚙️ Cache (có thể xóa)": [
    "pwa-install-dismissed",
    "mimin_supabase_config", "polomimin_supabase_config",
  ],
};

export default function BackupRestorePage() {
  const [stats, setStats] = useState<{ [k: string]: { keys: string[]; size: number } }>({});

  const refresh = () => {
    const s: any = {};
    for (const [group, keys] of Object.entries(STORAGE_GROUPS)) {
      const existing = keys.filter((k) => localStorage.getItem(k) !== null);
      const size = existing.reduce((sum, k) => sum + (localStorage.getItem(k)?.length || 0), 0);
      s[group] = { keys: existing, size };
    }
    setStats(s);
  };

  useEffect(() => { refresh(); }, []);

  const handleBackup = () => {
    const data: any = { timestamp: new Date().toISOString(), version: "v89.6", keys: {} };
    for (const keys of Object.values(STORAGE_GROUPS)) {
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v !== null) data.keys[k] = v;
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mimin-erp-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`✅ Đã backup ${Object.keys(data.keys).length} keys (${(JSON.stringify(data).length / 1024).toFixed(1)}KB)`);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("⚠️ Restore sẽ GHI ĐÈ lên toàn bộ dữ liệu hiện tại. Tiếp tục?")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        let count = 0;
        for (const [k, v] of Object.entries(data.keys || {})) {
          localStorage.setItem(k, v as string);
          count++;
        }
        toast.success(`✅ Đã restore ${count} keys`);
        refresh();
      } catch {
        toast.error("File backup không hợp lệ!");
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (!confirm("⚠️ Xóa TẤT CẢ localStorage? Mất hết data!")) return;
    localStorage.clear();
    toast.warning("🗑️ Đã xóa tất cả");
    refresh();
  };

  const totalKeys = Object.values(stats).reduce((s, g) => s + g.keys.length, 0);
  const totalSize = Object.values(stats).reduce((s, g) => s + g.size, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 p-3 md:p-5">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-5 md:p-7 shadow-xl">
          <div className="text-xs font-medium opacity-90 mb-1 flex items-center gap-2"><Database className="w-3.5 h-3.5" /> MIMIN OS · Quản lý dữ liệu</div>
          <h1 className="text-2xl md:text-3xl font-bold">💾 Backup & Restore</h1>
          <p className="text-sm opacity-95 mt-1">Backup toàn bộ localStorage ra file JSON. Restore bất cứ lúc nào. <b className="text-amber-200">Quan trọng</b>: Nên backup mỗi ngày trước khi refresh.</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold">{totalKeys}</div><div className="opacity-90">Tổng keys</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold">{(totalSize / 1024).toFixed(1)}KB</div><div className="opacity-90">Dung lượng</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold">{Object.keys(STORAGE_GROUPS).length}</div><div className="opacity-90">Nhóm</div></div>
          </div>
        </div>

        <div className="card p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <button onClick={handleBackup} className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-xl font-bold flex flex-col items-center gap-1 hover:shadow-lg">
            <Download className="w-6 h-6" />Backup ra JSON
          </button>
          <label className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-xl font-bold flex flex-col items-center gap-1 cursor-pointer hover:shadow-lg">
            <Upload className="w-6 h-6" />Restore từ file
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>
          <button onClick={handleClear} className="p-4 bg-gradient-to-br from-rose-500 to-red-500 text-white rounded-xl font-bold flex flex-col items-center gap-1 hover:shadow-lg">
            <Trash2 className="w-6 h-6" />Xóa tất cả
          </button>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">📊 Thống kê localStorage</h2>
            <button onClick={refresh} className="p-1.5 hover:bg-slate-100 rounded"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>
          <div className="space-y-2">
            {Object.entries(STORAGE_GROUPS).map(([group, keys]) => {
              const s = stats[group] || { keys: [], size: 0 };
              return (
                <div key={group} className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="text-sm font-semibold">{group}</div>
                    <div className="text-xs text-slate-500">{s.keys.length} keys • {(s.size/1024).toFixed(1)}KB</div>
                  </div>
                  {s.keys.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">Chưa có data</div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {s.keys.map((k) => (
                        <span key={k} className="text-[10px] px-2 py-0.5 bg-white border rounded text-slate-600">{k}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
