"use client";

import Link from "next/link";
import { BarChart3, RefreshCw, LayoutDashboard, Factory, ShieldAlert } from "lucide-react";
import { RealtimeDashboard } from "@/components/RealtimeDashboard";

export default function RealtimePage() {
  return (
    <div className="space-y-4">
      {/* Hero Header Card - Đồng bộ phong cách thẻ trắng nổi bật */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Báo cáo tổng hợp (BI) Real-time
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Data
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800">
                Auto-sync 30s
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              Trung tâm phân tích tài chính, sản lượng, công nợ & tiến độ xưởng may MIMIN theo thời gian thực
            </p>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-brand-600" /> Bàn làm việc
          </Link>
          <Link
            href="/bang-dieu-hanh-sx"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Factory className="w-3.5 h-3.5 text-blue-600" /> Bảng điều hành SX
          </Link>
          <Link
            href="/canh-bao"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Cảnh báo
          </Link>
        </div>
      </div>

      <RealtimeDashboard />
    </div>
  );
}

