"use client";

import { useEffect, useState } from "react";
import { Database, FileText, RefreshCw, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ALL_REAL_PHIEU } from "@/lib/real-workflow-data";

const BASE = "NNKRbEQcYak0Ees0v61j2iXypEc";

const TABLES = [
  { key: "INTD", name: "In / Thêu / Dập", color: "from-violet-500 to-purple-500", larkId: "?", exists: false },
  { key: "MAY", name: "May", color: "from-rose-500 to-pink-500", larkId: "?", exists: false },
  { key: "KN", name: "Khuy nút", color: "from-blue-500 to-cyan-500", larkId: "tbl3Et3KsXVcJGbw", exists: true },
  { key: "UI", name: "Ủi", color: "from-amber-500 to-orange-500", larkId: "tbl5wlqkV34wjz22", exists: true },
  { key: "DG", name: "Gấp xếp – Đóng gói", color: "from-emerald-500 to-green-500", larkId: "tbl71L2HWDwAgtNa", exists: true },
];

export default function LarkSyncOverviewPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string>("");

  useEffect(() => {
    const ls = localStorage.getItem("mimin_lark_last_sync");
    if (ls) setLastSync(ls);
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    setLoading(true);
    // Mock - lấy từ localStorage data
    const data = JSON.parse(localStorage.getItem("mimin_lark_pushed") || "{}");
    setCounts(data);
    setLoading(false);
  };

  const simPush = (tableKey: string) => {
    const phieus = ALL_REAL_PHIEU.filter((p) => p.id.startsWith(tableKey));
    const data = JSON.parse(localStorage.getItem("mimin_lark_pushed") || "{}");
    data[tableKey] = (data[tableKey] || 0) + phieus.length;
    localStorage.setItem("mimin_lark_pushed", JSON.stringify(data));
    setCounts({ ...data });
    setLastSync(new Date().toLocaleString("vi-VN"));
    localStorage.setItem("mimin_lark_last_sync", lastSync);
    toast.success(`✅ Mô phỏng push ${phieus.length} phiếu lên ${tableKey}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <RefreshCw className="w-7 h-7 text-blue-500" /> Lark Sync Overview
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          Tổng quan 5 bảng Lark chị Giàu + số record sẽ sync từ ERP
        </p>
        {lastSync && (
          <p className="text-xs opacity-50 mt-1">Lần sync cuối: {lastSync}</p>
        )}
      </div>

      <div className="card p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="opacity-60">Base Token</div>
            <div className="font-mono text-xs">{BASE.slice(0, 16)}...</div>
          </div>
          <div>
            <div className="opacity-60">Phiếu trong ERP</div>
            <div className="font-bold text-blue-500 text-lg">{ALL_REAL_PHIEU.length}</div>
          </div>
          <div>
            <div className="opacity-60">Bảng có sẵn</div>
            <div className="font-bold text-emerald-500 text-lg">3 / 5</div>
          </div>
          <div>
            <div className="opacity-60">Bảng cần tạo</div>
            <div className="font-bold text-amber-500 text-lg">2</div>
          </div>
        </div>
      </div>

      {/* 5 tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TABLES.map((t) => {
          const phieus = ALL_REAL_PHIEU.filter((p) => p.id.startsWith(t.key));
          const count = counts[t.key] || 0;
          return (
            <div key={t.key} className="card p-4 hover:shadow-lg transition">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                  {t.key}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-[10px] font-mono opacity-60 truncate">
                    {t.exists ? t.larkId : "Chưa tạo trên Lark"}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    {t.exists ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        ✓ Có sẵn
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        Cần tạo
                      </span>
                    )}
                    {count > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300">
                        {count} pushed
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-xs mb-2">
                  <span>Phiếu ERP sẽ sync:</span>
                  <span className="font-bold">{phieus.length}</span>
                </div>
                {phieus.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {phieus.map((p) => (
                      <span key={p.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                        {p.id}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => simPush(t.key)}
                  disabled={phieus.length === 0}
                  className="btn-primary w-full text-xs py-1.5 flex items-center justify-center gap-1"
                >
                  <ArrowRight className="w-3 h-3" />
                  {t.exists ? "Push lên Lark" : "Tạo bảng + Push"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workflow diagram */}
      <div className="card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" /> Workflow 5 khâu (M758)
        </h3>
        <div className="flex items-center gap-1 text-xs overflow-x-auto pb-2">
          {[
            { key: "INTD", name: "In/Thêu/Dập", ppl: "Bảo Ngân, Hạnh" },
            { key: "MAY", name: "May", ppl: "Liễu, Hương" },
            { key: "KN", name: "Khuy nút", ppl: "Ruộng" },
            { key: "UI", name: "Ủi", ppl: "Đức/Định/Tâm" },
            { key: "DG", name: "Đóng gói", ppl: "Mỹ Nhi/Phương/Bé" },
          ].map((s, i, arr) => (
            <div key={s.key} className="flex items-center gap-1 shrink-0">
              <div className="px-3 py-2 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800 text-center">
                <div className="font-bold text-brand-700 dark:text-brand-300">{s.key}</div>
                <div className="text-[10px] opacity-70">{s.name}</div>
                <div className="text-[9px] opacity-60">{s.ppl}</div>
              </div>
              {i < arr.length - 1 && <ArrowRight className="w-4 h-4 opacity-50" />}
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <a href="/test-real-data" className="card p-4 hover:shadow-md transition group">
          <Database className="w-8 h-8 text-emerald-500 mb-2 group-hover:scale-110 transition" />
          <div className="font-semibold text-sm">Test Data Thật</div>
          <div className="text-xs opacity-60">12 phiếu M758 + M873</div>
        </a>
        <a href="/lark-settings" className="card p-4 hover:shadow-md transition group">
          <FileText className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition" />
          <div className="font-semibold text-sm">Kết nối Lark</div>
          <div className="text-xs opacity-60">Config App ID/Secret</div>
        </a>
        <a href="/lark-auto-setup" className="card p-4 hover:shadow-md transition group">
          <Sparkles className="w-8 h-8 text-violet-500 mb-2 group-hover:scale-110 transition" />
          <div className="font-semibold text-sm">Lark Auto Setup</div>
          <div className="text-xs opacity-60">Tạo bảng + 100 fields</div>
        </a>
      </div>
    </div>
  );
}
