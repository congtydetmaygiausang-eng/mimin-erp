"use client";

import { useState, useEffect } from "react";
import { Database, Upload, Download, Check, AlertCircle, ExternalLink, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { isSupabaseEnabled, saveSupabaseConfig, getSupabaseConfig } from "@/lib/supabase/client";
import { pushToSupabase, pullFromSupabase, getLocalStats } from "@/lib/supabase/sync";

export function SupabaseSetupWizard({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<{ key: string; count: number }[]>([]);
  const [lastResult, setLastResult] = useState<{ push?: any[]; pull?: any[]; error?: string } | null>(null);

  useEffect(() => {
    const cfg = getSupabaseConfig();
    if (cfg) {
      setUrl(cfg.url);
      setKey(cfg.key);
    }
    setStats(getLocalStats());
  }, []);

  const handleSave = () => {
    if (!url.startsWith("https://") || !key.startsWith("eyJ")) {
      toast.error("URL phải bắt đầu bằng https://, Key phải bắt đầu bằng eyJ");
      return;
    }
    saveSupabaseConfig(url, key);
    toast.success("Đã lưu config! Đang reload...");
  };

  const handlePush = async () => {
    if (!isSupabaseEnabled) {
      toast.error("Vui lòng cấu hình Supabase trước");
      return;
    }
    setBusy(true);
    try {
      const results = await pushToSupabase();
      setLastResult({ push: results });
      toast.success(`Đã đẩy ${results.reduce((s, r) => s + r.count, 0)} records lên Supabase`);
    } catch (e: any) {
      setLastResult({ error: e.message });
      toast.error(e.message);
    }
    setBusy(false);
  };

  const handlePull = async () => {
    if (!isSupabaseEnabled) {
      toast.error("Vui lòng cấu hình Supabase trước");
      return;
    }
    setBusy(true);
    try {
      const results = await pullFromSupabase();
      setLastResult({ pull: results });
      toast.success(`Đã kéo ${results.reduce((s, r) => s + r.count, 0)} records về localStorage`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      setLastResult({ error: e.message });
      toast.error(e.message);
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-500" />
            Setup Supabase + Migration
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded"><X className="w-5 h-5" /></button>
        </div>

        {/* Status */}
        <div className={`rounded p-3 mb-4 flex items-center gap-2 ${isSupabaseEnabled ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-amber-500/10 border border-amber-500/30"}`}>
          {isSupabaseEnabled ? <Check className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
          <div className="flex-1 text-sm">
            {isSupabaseEnabled ? (
              <><b className="text-emerald-700">Đã kết nối Supabase</b> - App đang sử dụng cloud database</>
            ) : (
              <><b className="text-amber-700">Đang dùng localStorage</b> - Cần cấu hình để lưu data thật</>
            )}
          </div>
        </div>

        {/* Setup */}
        <div className="space-y-3 mb-4">
          <h4 className="font-semibold text-sm">⚙️ Cấu hình Supabase</h4>
          <div>
            <label className="text-xs font-medium block mb-1">Supabase URL</label>
            <input
              className="input w-full text-xs"
              placeholder="https://xxxxx.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Anon Key (public)</label>
            <input
              className="input w-full text-xs"
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <div className="text-[10px] opacity-60 mt-1">
              Lấy tại: Supabase Dashboard → Project Settings → API
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-primary flex-1">💾 Lưu config</button>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener" className="btn-secondary flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Tạo project
            </a>
          </div>
        </div>

        {/* Migration */}
        <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <h4 className="font-semibold text-sm mb-2">📦 Migration (LocalStorage ↔ Supabase)</h4>
          <div className="text-xs opacity-70 mb-2">Data trong localStorage hiện tại:</div>
          <div className="bg-slate-100/40 dark:bg-slate-800/40 rounded p-2 mb-3 text-xs">
            {stats.length === 0 ? (
              <span className="opacity-60">Chưa có data trong localStorage</span>
            ) : (
              stats.map((s) => (
                <div key={s.key} className="flex justify-between">
                  <span>{s.key}:</span>
                  <b>{s.count} records</b>
                </div>
              ))
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handlePush} disabled={busy || !isSupabaseEnabled} className="btn-primary flex items-center justify-center gap-1 disabled:opacity-50">
              <Upload className="w-4 h-4" /> Đẩy lên Supabase
            </button>
            <button onClick={handlePull} disabled={busy || !isSupabaseEnabled} className="btn-secondary flex items-center justify-center gap-1 disabled:opacity-50">
              <Download className="w-4 h-4" /> Kéo về Local
            </button>
          </div>
          {lastResult?.push && (
            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded p-2 text-xs">
              <b className="text-emerald-700">✓ Push thành công:</b>
              <ul className="mt-1 space-y-0.5">
                {lastResult.push.map((r) => (
                  <li key={r.table}>• {r.table}: <b>{r.count}</b> records {r.error && <span className="text-red-600">({r.error})</span>}</li>
                ))}
              </ul>
            </div>
          )}
          {lastResult?.pull && (
            <div className="mt-3 bg-sky-500/10 border border-sky-500/30 rounded p-2 text-xs">
              <b className="text-sky-700">✓ Pull thành công - Reload sau 1.5s</b>
            </div>
          )}
          {lastResult?.error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded p-2 text-xs text-red-700">
              <b>❌ Lỗi:</b> {lastResult.error}
            </div>
          )}
        </div>

        {/* Hướng dẫn */}
        <div className="mt-4 bg-sky-500/10 border border-sky-500/30 rounded p-3 text-xs space-y-2">
          <div className="font-semibold text-sky-700 dark:text-sky-400">📖 Hướng dẫn nhanh (3 bước):</div>
          <ol className="list-decimal list-inside space-y-1 opacity-90">
            <li>Tạo project tại <a href="https://supabase.com" target="_blank" className="underline">supabase.com</a> (miễn phí)</li>
            <li>Vào <b>SQL Editor</b>, paste schema từ file <code className="bg-slate-200/50 dark:bg-slate-700/50 px-1 rounded">lib/supabase/schema.sql</code>, chạy</li>
            <li>Copy <b>URL + anon key</b> từ Settings → API, paste vào form trên</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
