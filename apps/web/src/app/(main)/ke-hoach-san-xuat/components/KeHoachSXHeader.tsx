"use client";

import { Calendar, Target, Scissors, CheckCircle2, AlertCircle, Plus, Layers, Sparkles, TrendingUp, Clock } from "lucide-react";
import type { KHSX } from "@/lib/data/khsx-store";

interface KeHoachSXHeaderProps {
  khsx: KHSX[];
  onOpenCreate: () => void;
  activeTab?: "khsx" | "tong_hop";
  onChangeTab?: (tab: "khsx" | "tong_hop") => void;
  soLenhCanDieuPhoi?: number;
}

export function KeHoachSXHeader({
  khsx,
  onOpenCreate,
  activeTab = "khsx",
  onChangeTab,
  soLenhCanDieuPhoi = 0,
}: KeHoachSXHeaderProps) {
  const tongSL = khsx.reduce((sum, item) => sum + (item.soLuong || 0), 0);
  const tongXong = khsx.reduce((sum, item) => sum + (item.daHoanThanh || 0), 0);
  const tienDo = tongSL > 0 ? (tongXong / tongSL) * 100 : 0;

  const dangSXCount = khsx.filter((x) => x.trangThai === "Đang SX").length;
  const hoanThanhCount = khsx.filter((x) => x.trangThai === "Hoàn thành").length;
  const treHanCount = khsx.filter((x) => x.trangThai === "Trễ hạn").length;
  const lenKHCount = khsx.filter((x) => x.trangThai === "Lên kế hoạch").length;

  return (
    <div className="space-y-3.5">
      {/* 1. BANNER TỔNG QUAN CHUYÊN NGHIỆP - TONE XANH NGỌC DARK ERP */}
      <section className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#133E32] via-[#1b4b3d] to-[#0f2e25] border border-teal-500/20 p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        {/* Glow hiệu ứng tinh tế */}
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-60 h-60 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="min-w-0 flex-1 w-full">
            {/* Tag hệ thống */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/20 mb-2.5 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/80" />
              <span>
                {activeTab === "tong_hop"
                  ? "MIMIN ERP · ĐIỀU PHỐI SẢN XUẤT TỔNG HỢP"
                  : "MIMIN ERP · KẾ HOẠCH SẢN XUẤT & ĐIỀU HÀNH"}
              </span>
            </div>

            {/* Tiêu đề chính */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-600/30 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
                {activeTab === "tong_hop" ? <Layers className="w-5 h-5" /> : <Scissors className="w-5 h-5" />}
              </div>
              <span>{activeTab === "tong_hop" ? "Kế Hoạch Sản Xuất Tổng Hợp" : "Kế Hoạch Sản Xuất"}</span>
            </h1>

            {/* Phụ đề & Thông số tóm tắt */}
            <p className="mt-2 text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-2xl">
              {activeTab === "tong_hop"
                ? `Lập kế hoạch tháng & Điều phối bóc tách định mức Vải, Bo, Phụ liệu (MRP) cho ${soLenhCanDieuPhoi} lệnh cắt đang chuẩn bị.`
                : `Quản lý ${khsx.length} kế hoạch sản xuất · Tổng dự kiến: ${tongSL.toLocaleString("vi-VN")} SP · Đã hoàn thành: ${tongXong.toLocaleString("vi-VN")} SP.`}
            </p>

            {/* Progress Bar tiến độ tổng quan */}
            {activeTab === "khsx" && (
              <div className="mt-3.5 flex items-center gap-3 max-w-lg">
                <div className="flex-1 h-2.5 rounded-full bg-black/25 p-0.5 border border-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.min(tienDo, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-emerald-300 whitespace-nowrap flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {tienDo.toFixed(1)}% tiến độ
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons bên phải banner */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto shrink-0">
            {onChangeTab && (
              <button
                type="button"
                onClick={() => onChangeTab(activeTab === "tong_hop" ? "khsx" : "tong_hop")}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer ${
                  activeTab === "tong_hop"
                    ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 hover:bg-emerald-500/35"
                    : "bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 backdrop-blur-md"
                }`}
              >
                {activeTab === "tong_hop" ? <Calendar className="w-4 h-4 text-emerald-300" /> : <Layers className="w-4 h-4 text-emerald-300" />}
                <span>{activeTab === "tong_hop" ? "Xem Kế Hoạch Theo Mã" : "Kế Hoạch Tổng Hợp"}</span>
                {soLenhCanDieuPhoi > 0 && activeTab === "khsx" && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-slate-950">
                    {soLenhCanDieuPhoi}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={onOpenCreate}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-5 py-2.5 sm:py-3 font-bold text-xs sm:text-sm shadow-md shadow-emerald-900/40 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tạo KHSX Mới</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SUB-TAB ĐIỀU HƯỚNG HIỆN ĐẠI (CHỈ HIỂN THỊ KHI CẦN CHUYỂN TAB) */}
      {onChangeTab && (
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <button
            type="button"
            onClick={() => onChangeTab("khsx")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "khsx"
                ? "bg-[#133E32] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800"
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeTab === "khsx" ? "text-emerald-300" : "text-teal-600"}`} />
            <span>Kế Hoạch Sản Xuất Theo Mã</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                activeTab === "khsx"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600"
              }`}
            >
              {khsx.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab("tong_hop")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "tong_hop"
                ? "bg-[#133E32] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800"
            }`}
          >
            <Layers className={`w-4 h-4 ${activeTab === "tong_hop" ? "text-emerald-300" : "text-teal-600"}`} />
            <span>Kế Hoạch SX Tổng Hợp (Điều Phối Lệnh Cắt)</span>
            {soLenhCanDieuPhoi > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  activeTab === "tong_hop"
                    ? "bg-white/20 text-white"
                    : "bg-teal-50 text-teal-700 border border-teal-200"
                }`}
              >
                {soLenhCanDieuPhoi} lệnh
              </span>
            )}
          </button>
        </div>
      )}

      {/* 3. BẢNG 4 THẺ KPI METRICS CAO CẤP */}
      {activeTab === "khsx" && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Tổng Kế Hoạch */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng kế hoạch</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                {khsx.length}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200/60">
                {tongSL.toLocaleString("vi-VN")} SP
              </span>
            </div>
          </div>

          {/* Card 2: Đang Sản Xuất */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 p-4 shadow-2xs hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Đang sản xuất</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center group-hover:scale-105 transition-transform border border-amber-200/60">
                <Scissors className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                {dangSXCount}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Đang làm
              </span>
            </div>
          </div>

          {/* Card 3: Hoàn Thành */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 p-4 shadow-2xs hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Hoàn thành</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-200/60">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {hoanThanhCount}
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/70">
                {tongXong.toLocaleString("vi-VN")} SP đã xong
              </span>
            </div>
          </div>

          {/* Card 4: Trễ Hạn */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 p-4 shadow-2xs hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Trễ hạn</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center group-hover:scale-105 transition-transform border border-rose-200/60">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span className={`text-2xl sm:text-3xl font-black font-mono ${treHanCount > 0 ? "text-rose-600" : "text-slate-400"}`}>
                {treHanCount}
              </span>
              {treHanCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200/80 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Cần xử lý
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/70">
                  100% đúng hạn
                </span>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
