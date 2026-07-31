"use client";
import { useState, useEffect } from "react";
import { Database, CheckCircle2, XCircle, Loader2, RefreshCw, Cloud, CloudOff, Copy, ExternalLink, AlertTriangle, FileText } from "lucide-react";
import { supabase, isSupabaseEnabled, DEMO_USERS } from "@/lib/supabase/client";
import { SupabaseAdapter } from "@/lib/supabase/adapter";

export default function SupabaseStatusPage() {
  const [status, setStatus] = useState<{
    url: string;
    enabled: boolean;
    usersCount: number;
    tasksCount: number;
    khoCount: number;
    congNoCount: number;
    nccCount: number;
    khCount: number;
    xuongCount: number;
    realtime: boolean;
    error?: string;
  }>({
    url: "",
    enabled: false,
    usersCount: 0, tasksCount: 0, khoCount: 0, congNoCount: 0,
    nccCount: 0, khCount: 0, xuongCount: 0, realtime: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setLoading(true);
    const newStatus: any = {
      url: "https://nftlwdcsmlpeiazhuoho.supabase.co",
      enabled: isSupabaseEnabled,
    };

    if (!isSupabaseEnabled || !supabase) {
      newStatus.error = "Chưa cấu hình NEXT_PUBLIC_SUPABASE_ANON_KEY";
      setStatus(newStatus);
      setLoading(false);
      return;
    }
    const sb = supabase;

    try {
      // Check từng bảng
      const checks = [
        { key: "usersCount", table: "users" },
        { key: "tasksCount", table: "tasks" },
        { key: "khoCount", table: "kho" },
        { key: "congNoCount", table: "cong_no" },
        { key: "nccCount", table: "nha_cung_cap" },
        { key: "khCount", table: "khach_hang_si" },
        { key: "xuongCount", table: "xuong_gia_cong" },
      ];

      for (const c of checks) {
        const { count, error } = await sb.from(c.table).select("*", { count: "exact", head: true });
        if (error) {
          newStatus[c.key] = -1;
          newStatus.error = newStatus.error || `${c.table}: ${error.message}`;
        } else {
          newStatus[c.key] = count || 0;
        }
      }

      // Test realtime
      try {
        const testChan = sb.channel("test-rt");
        let rtOk = false;
        testChan.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            rtOk = true;
            newStatus.realtime = true;
            setStatus({ ...newStatus });
            sb.removeChannel(testChan);
          }
        });
        setTimeout(() => {
          if (!rtOk) {
            newStatus.realtime = false;
            setStatus({ ...newStatus });
          }
        }, 3000);
      } catch (e) {
        newStatus.realtime = false;
      }
    } catch (e: any) {
      newStatus.error = e?.message || "Unknown error";
    }

    setStatus(newStatus);
    setLoading(false);
  }

  const isAllOk = status.usersCount > 0 && status.tasksCount > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-cyan-50/30 p-3 md:p-5">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className={`rounded-2xl p-5 md:p-7 shadow-xl text-white ${
          isAllOk
            ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700"
            : "bg-gradient-to-br from-amber-600 via-orange-600 to-red-700"
        }`}>
          <div className="text-xs font-medium opacity-90 mb-1">☁️ MIMIN OS · Supabase Cloud Status</div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            {isAllOk ? <Cloud className="w-7 h-7" /> : <CloudOff className="w-7 h-7" />}
            {isAllOk ? "Supabase đã kết nối" : "Chưa kết nối Supabase"}
          </h1>
          <p className="text-sm opacity-95 mt-2">
            URL: <code className="bg-white/20 px-2 py-0.5 rounded">{status.url}</code>
          </p>
          <div className="mt-3 flex gap-2">
            <button onClick={checkStatus} disabled={loading} className="text-xs px-3 py-1.5 bg-white/20 rounded-lg flex items-center gap-1.5">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {loading ? "Đang check..." : "Refresh"}
            </button>
            <a href="https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho" target="_blank" className="text-xs px-3 py-1.5 bg-white/20 rounded-lg flex items-center gap-1.5">
              Mở Dashboard <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Setup guide if not enabled */}
        {!status.enabled && (
          <div className="card p-5 bg-amber-50 border-2 border-amber-300">
            <h2 className="font-bold text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Chưa cấu hình Supabase - 3 bước setup
            </h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-700">
              <li><b>Bước 1:</b> Vào <a href="https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/settings/api-keys" target="_blank" className="text-blue-600 underline">Settings → API Keys</a> → Copy <b>anon public key</b></li>
              <li><b>Bước 2:</b> Chạy SQL migrations:
                <ul className="ml-4 mt-1 list-disc text-xs space-y-0.5">
                  <li>Mở <a href="https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/sql/new" target="_blank" className="text-blue-600 underline">SQL Editor</a></li>
                  <li>Copy nội dung file <code>supabase-migrations/001_init_schema.sql</code> → Run</li>
                  <li>Tạo query mới → Copy <code>002_seed_data.sql</code> → Run</li>
                </ul>
              </li>
              <li><b>Bước 3:</b> Tạo file <code>.env.local</code> trong <code>apps/web/</code>:
                <pre className="mt-1 bg-slate-800 text-emerald-300 p-2 rounded text-[11px] overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://nftlwdcsmlpeiazhuoho.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...`}
                </pre>
                </li>
            </ol>
          </div>
        )}

        {/* Tables status */}
        {status.enabled && (
          <div className="card p-4">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" /> Trạng thái các bảng
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { key: "usersCount", label: "Users", expected: 26 },
                { key: "tasksCount", label: "Tasks (LSX)", expected: 16 },
                { key: "khoCount", label: "Kho (SKU)", expected: 5 },
                { key: "congNoCount", label: "Công nợ", expected: 4 },
                { key: "nccCount", label: "NCC", expected: 16 },
                { key: "khCount", label: "KH sỉ", expected: 12 },
                { key: "xuongCount", label: "Xưởng", expected: 5 },
              ].map((c) => {
                const v = (status as any)[c.key];
                const ok = v >= c.expected;
                const empty = v === 0;
                return (
                  <div key={c.key} className={`p-3 rounded-lg border ${
                    ok ? "bg-emerald-50 border-emerald-300" :
                    empty ? "bg-slate-50 border-slate-200" :
                    "bg-rose-50 border-rose-300"
                  }`}>
                    <div className="text-[10px] text-slate-500">{c.label}</div>
                    <div className="flex items-center gap-1.5">
                      {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                       empty ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                       <XCircle className="w-4 h-4 text-rose-500" />}
                      <span className="text-lg font-bold">{v === -1 ? "❌" : v}</span>
                      <span className="text-[10px] text-slate-400">/{c.expected}</span>
                    </div>
                  </div>
                );
              })}
              <div className="p-3 rounded-lg border bg-blue-50 border-blue-300">
                <div className="text-[10px] text-slate-500">Realtime</div>
                <div className="flex items-center gap-1.5">
                  {status.realtime ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                  <span className="text-sm font-bold">{status.realtime ? "Hoạt động" : "Chưa bật"}</span>
                </div>
              </div>
            </div>
            {status.error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-700">
                ❌ Lỗi: {status.error}
              </div>
            )}
          </div>
        )}

        {/* SQL files reference */}
        <div className="card p-4">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> File SQL cần chạy
          </h2>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded border">
              <div className="font-mono text-slate-700">supabase-migrations/001_init_schema.sql</div>
              <div className="text-slate-500 mt-1">Tạo 10 bảng + RLS policies + indexes + Realtime triggers (320 dòng)</div>
            </div>
            <div className="p-3 bg-slate-50 rounded border">
              <div className="font-mono text-slate-700">supabase-migrations/002_seed_data.sql</div>
              <div className="text-slate-500 mt-1">26 user + 16 task + 5 SKU + 4 công nợ + 16 NCC + 12 KH + 5 xưởng (162 dòng)</div>
            </div>
            <a href="https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/sql/new" target="_blank" className="block p-3 bg-indigo-50 rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-100">
              → Mở SQL Editor để chạy 2 file trên
            </a>
          </div>
        </div>

        {/* Realtime test */}
        {status.enabled && (
          <div className="card p-4">
            <h2 className="font-bold text-sm mb-3">🧪 Test Realtime</h2>
            <RealtimeTest />
          </div>
        )}
      </div>
    </div>
  );
}

function RealtimeTest() {
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) return;
    const sb = supabase;
    const channel = sb
      .channel("tasks-test")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (payload) => {
        setLog((l) => [`${new Date().toLocaleTimeString()} ${payload.eventType}: ${(payload.new as any)?.id || ""}`, ...l].slice(0, 10));
      })
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  async function testUpdate() {
    if (!isSupabaseEnabled || !supabase) return;
    const sb = supabase;
    const { data: tasks } = await sb.from("tasks").select("id").limit(1);
    if (tasks && tasks[0]) {
      await sb.from("tasks").update({ ghi_chu: `Test realtime @ ${new Date().toLocaleTimeString()}` }).eq("id", tasks[0].id);
    }
  }

  return (
    <div>
      <button onClick={testUpdate} className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg">
        Test update (xem log bên dưới)
      </button>
      <div className="mt-3 space-y-1 max-h-40 overflow-y-auto bg-slate-900 text-emerald-300 p-2 rounded font-mono text-[10px]">
        {log.length === 0 ? <div className="opacity-50">Chưa có event nào. Click "Test update" để kích hoạt.</div> :
          log.map((l, i) => <div key={i}>→ {l}</div>)}
      </div>
    </div>
  );
}
