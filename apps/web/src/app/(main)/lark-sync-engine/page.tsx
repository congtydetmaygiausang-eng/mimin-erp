"use client";

import { useState, useEffect, useRef } from "react";
import {
  RefreshCw, Upload, Download, Database, CheckCircle2, XCircle,
  Loader2, AlertCircle, Clock, Activity, Sparkles, Users, FileText,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { hasUserToken } from "@/lib/lark-user-token";
import { getLarkConfig } from "@/lib/lark";
import {
  autoPushPhieu, bulkPushPhieus, pushAllNhanVien, pullFromLarkAll,
  startPolling, onPollingUpdate,
  getHistory, clearHistory, getLastPull, getPollStatus,
  type SyncRecord
} from "@/lib/lark-sync-engine";
import { ALL_REAL_PHIEU, REAL_NHAN_VIEN } from "@/lib/real-workflow-data";
import { logAudit } from "@/lib/audit-log";

const POLL_INTERVAL_LABEL = "5 phút";

export default function LarkSyncEnginePage() {
  const { user } = useSession();
  const [hasUser, setHasUser] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [history, setHistory] = useState<SyncRecord[]>([]);
  const [polling, setPolling] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [lastPull, setLastPull] = useState(0);
  const [pollStatus, setPollStatus] = useState<{ lastRun: number; records: number } | null>(null);
  const pullRecords = useRef<any[]>([]);

  useEffect(() => {
    setHasUser(hasUserToken());
    setHasConfig(!!getLarkConfig());
    setHistory(getHistory());
    setLastPull(getLastPull());
    setPollStatus(getPollStatus());

    // Auto start polling
    if (hasUser && hasConfig) {
      startSync();
    }

    const unsub = onPollingUpdate((records) => {
      pullRecords.current = records;
      setPollStatus({ lastRun: Date.now(), records: records.length });
      setLastPull(Date.now());
    });
    return () => {
      unsub();
    };
  }, [hasUser, hasConfig]);

  const startSync = () => {
    if (polling) return;
    setPolling(true);
    startPolling(user, (records) => {
      pullRecords.current = records;
    });
    toast.success(`🚀 Đã bật auto-sync (pull mỗi ${POLL_INTERVAL_LABEL})`);
  };

  const stopSync = () => {
    setPolling(false);
    toast.info("Đã tắt polling");
  };

  const pushOne = async (phieuId: string) => {
    const p = ALL_REAL_PHIEU.find((p) => p.id === phieuId);
    if (!p) return;
    setPushing(true);
    const r = await autoPushPhieu(p, user);
    setHistory(getHistory());
    if (r.status === "success") toast.success(`✅ ${p.id} → Lark`);
    else if (r.status === "error") toast.error(`❌ ${p.id}: ${r.message}`);
    else toast.warning(`⚠️ ${p.id}: ${r.message}`);
    setPushing(false);
  };

  const pushAll = async () => {
    if (!confirm(`Push tất cả ${ALL_REAL_PHIEU.length} phiếu lên Lark?`)) return;
    setPushing(true);
    setProgress({ done: 0, total: ALL_REAL_PHIEU.length });
    const records = await bulkPushPhieus(ALL_REAL_PHIEU, user, (done, total) => {
      setProgress({ done, total });
    });
    setHistory(getHistory());
    const success = records.filter((r) => r.status === "success").length;
    toast.success(`✅ Push xong: ${success}/${ALL_REAL_PHIEU.length}`);
    setPushing(false);
  };

  const pushNVs = async () => {
    if (!confirm(`Push ${REAL_NHAN_VIEN.length} NV lên bảng NV?`)) return;
    setPushing(true);
    const records = await pushAllNhanVien(user);
    setHistory(getHistory());
    const success = records.filter((r) => r.status === "success").length;
    toast.success(`✅ Push NV: ${success}/${REAL_NHAN_VIEN.length}`);
    setPushing(false);
  };

  const pullNow = async () => {
    setPulling(true);
    try {
      const result = await pullFromLarkAll(user);
      pullRecords.current = result.records;
      setLastPull(Date.now());
      setPollStatus({ lastRun: Date.now(), records: result.phieus });
      toast.success(`✅ Pull: ${result.phieus} records từ Lark`);
      setHistory(getHistory());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPulling(false);
    }
  };

  const stats = {
    total: history.length,
    success: history.filter((h) => h.status === "success").length,
    error: history.filter((h) => h.status === "error").length,
    skipped: history.filter((h) => h.status === "skipped").length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Activity className="w-7 h-7 text-blue-500" /> Lark Sync Engine
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          Auto-push (ERP → Lark) + Auto-pull (Lark → ERP, mỗi {POLL_INTERVAL_LABEL}) - 2 chiều real-time
        </p>
      </div>

      {!hasUser && (
        <div className="card p-4 bg-amber-500/10 border-amber-500/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            <div className="flex-1">
              <div className="font-semibold">Cần Login Lark OAuth</div>
              <a href="/lark-login" className="text-blue-500 underline text-sm">Login ngay →</a>
            </div>
          </div>
        </div>
      )}

      {!hasConfig && (
        <div className="card p-4 bg-amber-500/10 border-amber-500/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            <div className="flex-1">
              <div className="font-semibold">Chưa config Lark</div>
              <a href="/lark-settings" className="text-blue-500 underline text-sm">Cấu hình →</a>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<Database className="w-4 h-4" />} label="Tổng sync" value={stats.total} color="blue" />
        <Stat icon={<CheckCircle2 className="w-4 h-4" />} label="Thành công" value={stats.success} color="emerald" />
        <Stat icon={<XCircle className="w-4 h-4" />} label="Lỗi" value={stats.error} color="rose" />
        <Stat icon={<AlertCircle className="w-4 h-4" />} label="Bỏ qua" value={stats.skipped} color="amber" />
      </div>

      {/* Auto-push + Polling controls */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" /> Sync Engine Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={polling ? stopSync : startSync}
            className={`p-3 rounded-lg flex items-center gap-2 font-semibold ${
              polling
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
            }`}
          >
            <Activity className={`w-4 h-4 ${polling ? "animate-pulse" : ""}`} />
            {polling ? "Đang chạy polling" : "Bật Auto-Pull"}
          </button>
          <button
            onClick={pullNow}
            disabled={pulling || !hasUser || !hasConfig}
            className="btn-primary flex items-center gap-2"
          >
            {pulling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Pull ngay (5 bảng)
          </button>
        </div>
        {pollStatus && (
          <div className="text-xs opacity-70 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Last pull: {new Date(pollStatus.lastRun).toLocaleString("vi-VN")} | {pollStatus.records} records
          </div>
        )}
      </div>

      {/* Bulk push */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Upload className="w-5 h-5 text-emerald-500" /> Bulk Push (ERP → Lark)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={pushNVs}
            disabled={pushing || !hasUser || !hasConfig}
            className="btn-secondary flex items-center gap-2"
          >
            {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Push 17 NV lên bảng "Công việc từng người"
          </button>
          <button
            onClick={pushAll}
            disabled={pushing || !hasUser || !hasConfig}
            className="btn-primary flex items-center gap-2"
          >
            {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Push {ALL_REAL_PHIEU.length} phiếu workflow
          </button>
        </div>
        {pushing && progress.total > 0 && (
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        )}
        {pushing && (
          <div className="text-xs opacity-70 text-center">
            Đang push {progress.done}/{progress.total}...
          </div>
        )}
      </div>

      {/* Push 1 phiếu test */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" /> Test push 1 phiếu
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ALL_REAL_PHIEU.slice(0, 8).map((p) => (
            <button
              key={p.id}
              onClick={() => pushOne(p.id)}
              disabled={pushing}
              className="text-xs p-2 rounded bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-500/10 flex items-center gap-1"
            >
              <span className="font-mono font-bold">{p.id}</span>
              <span className="opacity-60">→ Lark</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pull records (cached) */}
      {pullRecords.current.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" /> Records đã pull từ Lark ({pullRecords.current.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="p-2 text-left">Stage</th>
                  <th className="p-2 text-left">Record ID</th>
                  <th className="p-2 text-left">Mã phiếu</th>
                  <th className="p-2 text-left">Mã LSX</th>
                  <th className="p-2 text-right">SL đạt</th>
                  <th className="p-2 text-right">Đơn giá</th>
                </tr>
              </thead>
              <tbody>
                {pullRecords.current.slice(0, 20).map((r, i) => {
                  const f = r.fields || {};
                  return (
                    <tr key={i} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="p-2 font-mono text-xs">{r.stage}</td>
                      <td className="p-2 font-mono text-[10px]">{r.record_id?.slice(0, 12)}...</td>
                      <td className="p-2 font-mono">{f["Mã phiếu"] || "?"}</td>
                      <td className="p-2 font-mono">{f["Mã LSX"] || "?"}</td>
                      <td className="p-2 text-right text-emerald-600 font-bold">{f["SL đạt"] || 0}</td>
                      <td className="p-2 text-right">{(f["Đơn giá"] || 0).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" /> Lịch sử sync ({history.length})
          </h3>
          {history.length > 0 && (
            <button onClick={() => { clearHistory(); setHistory([]); }} className="text-xs text-rose-500 underline">
              Xóa lịch sử
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <div className="text-center py-8 opacity-50 text-sm">Chưa có sync nào</div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {history.slice(0, 50).map((h) => (
              <div key={h.id} className="flex items-center gap-2 text-xs p-2 rounded bg-slate-50 dark:bg-slate-800/30">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  h.status === "success" ? "bg-emerald-500" :
                  h.status === "error" ? "bg-rose-500" :
                  h.status === "syncing" ? "bg-blue-500 animate-pulse" :
                  h.status === "skipped" ? "bg-amber-500" : "bg-slate-400"
                }`} />
                <span className="opacity-50">{new Date(h.timestamp).toLocaleTimeString("vi-VN")}</span>
                <span className={`px-1.5 rounded ${
                  h.direction === "push" ? "bg-emerald-500/20 text-emerald-700" : "bg-blue-500/20 text-blue-700"
                }`}>{h.direction === "push" ? "↑" : "↓"}</span>
                <span className="font-mono">{h.phieuId}</span>
                <span className="opacity-70 truncate flex-1">{h.message}</span>
                {h.recordId && <span className="text-[10px] opacity-50 font-mono">{h.recordId.slice(0, 8)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-600",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-600",
    rose: "from-rose-500/10 to-red-500/10 text-rose-600",
    amber: "from-amber-500/10 to-yellow-500/10 text-amber-600",
  };
  return (
    <div className={`card p-3 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-center gap-1.5 opacity-80 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
