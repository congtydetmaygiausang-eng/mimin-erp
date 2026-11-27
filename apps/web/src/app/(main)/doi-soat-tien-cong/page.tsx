"use client";

// ============ ĐỐI SOÁT TIỀN CÔNG (Dashboard tổng hợp) ============
// Dashboard cho Kế toán & Giám đốc theo dõi toàn bộ tiền công:
// - 6 KPI tổng quan (tổng tiền, đã TT, còn nợ, khiếu nại, khóa, nhân sự có công)
// - Biểu đồ 7 trạng thái (CSS bar chart)
// - Tiến độ thanh toán (progress bar với số tiền VNĐ đầy đủ)
// - Bảng tổng hợp theo 7 trạng thái (số lượng + tổng tiền + sản lượng)
// - Top 10 người có tiền công cao nhất
// - Bảng tổng hợp theo công đoạn
// - Filter theo thời gian (hôm nay / 7 ngày / 30 ngày / tất cả)

import { useState, useMemo, useEffect, Suspense } from "react";
import {
  Wallet2, TrendingUp, TrendingDown, AlertTriangle, Lock, Users,
  CheckCircle2, Clock, DollarSign, BarChart3, Package, Calendar,
  ChevronRight, Wallet, FileText, Activity,
} from "lucide-react";
import Link from "next/link";
import { useDoiSoat, TRANG_THAI_DOI_SOAT, TRANG_THAI_STYLE } from "@/lib/data/doi-soat-store";
import { getDoiSoatKPI, topNguoiTienCong } from "@/lib/doi-soat-helper";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";

type TimeFilter = "all" | "today" | "week" | "month";

export default function DoiSoatTienCongPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <DoiSoatTienCongContent />
    </Suspense>
  );
}

function DoiSoatTienCongContent() {
  const { doiSoat, reset } = useDoiSoat();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  // Tự động nạp dữ liệu ban đầu nếu mảng đối soát rỗng
  useEffect(() => {
    if (doiSoat.length === 0) {
      reset();
    }
  }, [doiSoat.length, reset]);

  // Lọc theo thời gian (dựa trên ngayGiao)
  const filtered = useMemo(() => {
    if (timeFilter === "all") return doiSoat;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return doiSoat.filter((d) => {
      const ngay = d.ngayGiao;
      if (!ngay) return false;
      if (timeFilter === "today") return ngay === todayStr;
      if (timeFilter === "week") return new Date(ngay) >= weekAgo;
      if (timeFilter === "month") return new Date(ngay) >= monthAgo;
      return true;
    });
  }, [doiSoat, timeFilter]);

  const kpi = useMemo(() => getDoiSoatKPI(filtered), [filtered]);
  const top10 = useMemo(() => topNguoiTienCong(filtered, 10), [filtered]);

  // Số người có tiền công (unique)
  const soNguoiCoTienCong = useMemo(() => {
    const set = new Set<string>();
    filtered.forEach((d) => set.add(d.nguoiThucHienMa || d.nguoiThucHien));
    return set.size;
  }, [filtered]);

  // Tiến độ thanh toán (% so với tổng thực nhận)
  const tyLeThanhToan = kpi.tongThucNhan > 0
    ? Math.round((kpi.tongDaThanhToan / kpi.tongThucNhan) * 100)
    : 0;

  // Max tiền để normalize bar chart
  const maxTien = Math.max(
    ...TRANG_THAI_DOI_SOAT.map((t) => kpi.theoTrangThai[t].tien),
    1
  );
  const maxCongDoan = Math.max(
    ...Object.values(kpi.theoCongDoan).map((v) => v.tien),
    1
  );

  return (
    <div className="space-y-4 animate-fade-in w-full">
      {/* Header (Teal Emerald Executive Theme - chuẩn Bảng Lương) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 text-white p-5 sm:p-6 shadow-sm border border-teal-800/60 flex flex-wrap items-center justify-between gap-4">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-2">
            <Wallet2 className="w-3.5 h-3.5 text-teal-400" />
            <span>MIMIN ERP · KẾ TOÁN TIỀN CÔNG</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5 text-white">
            <span>Đối Soát Tiền Công</span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30 font-bold">
              Tổng hợp 7 trạng thái
            </span>
          </h1>
          <p className="text-slate-300 mt-1.5 text-xs sm:text-sm">
            Theo dõi tiến độ thanh toán & đối chiếu tiền công theo 7 trạng thái · <b className="text-white">{filtered.length}</b> bản ghi · <b className="text-white">{soNguoiCoTienCong}</b> người thực hiện
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <Link
            href="/doi-soat"
            className="text-xs px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-2 transition font-semibold backdrop-blur-md shadow-xs"
          >
            <FileText className="w-4 h-4 text-teal-300" />
            <span>Mở bảng đối soát chi tiết</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </Link>
        </div>
      </div>

      {/* Time filter toolbar */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold border border-teal-200/60 dark:border-teal-800/60 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>Kỳ đối soát dữ liệu</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200/60 dark:border-teal-800/60">
                Thời gian
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Lọc theo ngày giao nhận công đoạn & đối chiếu công nợ
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          {([
            { v: "all", label: "Tất cả thời gian", icon: <Activity className="w-3.5 h-3.5" /> },
            { v: "today", label: "Hôm nay", icon: <Calendar className="w-3.5 h-3.5" /> },
            { v: "week", label: "7 ngày gần nhất", icon: <Clock className="w-3.5 h-3.5" /> },
            { v: "month", label: "30 ngày gần nhất", icon: <Calendar className="w-3.5 h-3.5" /> },
          ] as { v: TimeFilter; label: string; icon: any }[]).map((t) => {
            const isActive = timeFilter === t.v;
            return (
              <button
                key={t.v}
                onClick={() => setTimeFilter(t.v)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${isActive
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                  }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6 KPI chính */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          label="Tổng tiền công"
          value={formatVND(kpi.tongThucNhan)}
          icon={<Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          valueClass="text-emerald-600 dark:text-emerald-400"
          sub={`${filtered.length} phiếu công đoạn`}
        />
        <KPICard
          label="Đã thanh toán"
          value={formatVND(kpi.tongDaThanhToan)}
          icon={<CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
          iconBg="bg-sky-50 dark:bg-sky-950/40"
          valueClass="text-sky-600 dark:text-sky-400"
          sub={`${tyLeThanhToan}% tiến độ chi trả`}
        />
        <KPICard
          label="Tiền công còn nợ"
          value={formatVND(kpi.tongConNo)}
          icon={<TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          valueClass={kpi.tongConNo > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}
          sub={kpi.tongConNo > 0 ? "Cần thanh toán tiếp" : "Đã thanh toán đủ"}
        />
        <KPICard
          label="Khiếu nại công"
          value={`${kpi.tongKhiieuNai} vụ`}
          icon={<AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
          iconBg="bg-rose-50 dark:bg-rose-950/40"
          valueClass={kpi.tongKhiieuNai > 0 ? "text-rose-600 dark:text-rose-400 font-black" : "text-slate-900 dark:text-white"}
          sub={kpi.tongKhiieuNai > 0 ? "Chờ xử lý giải quyết" : "Không có khiếu nại"}
        />
        <KPICard
          label="Nhân sự nhận công"
          value={`${soNguoiCoTienCong} người`}
          icon={<Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          iconBg="bg-indigo-50 dark:bg-indigo-950/40"
          valueClass="text-slate-900 dark:text-white"
          sub="Nhân viên & đối tác"
        />
        <KPICard
          label="Đã khóa sổ"
          value={`${kpi.tongLocked} phiếu`}
          icon={<Lock className="w-4 h-4 text-slate-500" />}
          iconBg="bg-slate-100 dark:bg-slate-800"
          valueClass="text-slate-900 dark:text-white"
          sub="Đã chốt an toàn"
        />
      </div>

      {/* Tiến độ thanh toán */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase tracking-wide">
            <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Tiến độ thanh toán tiền công</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-black">
              {tyLeThanhToan}%
            </span>
            <span className="text-slate-400 mx-1">·</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
              {formatVND(kpi.tongDaThanhToan)}
            </span>
            <span className="text-slate-400 font-normal">/</span>
            <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
              {formatVND(kpi.tongThucNhan)}
            </span>
          </div>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 rounded-full shadow-2xs"
            style={{ width: `${tyLeThanhToan}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2 font-semibold">
          <span>0% Bắt đầu</span>
          <span>25%</span>
          <span>50% Nửa kỳ</span>
          <span>75%</span>
          <span>100% Hoàn tất</span>
        </div>
      </div>

      {/* Bảng 7 trạng thái */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wide">
          <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Phân bổ theo 7 trạng thái đối soát</span>
        </div>
        <div className="space-y-3.5">
          {TRANG_THAI_DOI_SOAT.map((t) => {
            const data = kpi.theoTrangThai[t];
            const s = TRANG_THAI_STYLE[t];
            const pct = maxTien > 0 ? (data.tien / maxTien) * 100 : 0;
            return (
              <div key={t} className="group">
                <div className="flex items-center justify-between text-xs mb-1.5 gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${s.bg} ${s.color}`}>
                      {t}
                    </span>
                    <span className="text-slate-400 font-medium text-[11px] truncate">
                      · <b className="text-slate-600 dark:text-slate-300 font-semibold">{data.count}</b> bản ghi · <b className="text-slate-600 dark:text-slate-300 font-semibold">{data.soLuong.toLocaleString()}</b> sp
                    </span>
                  </div>
                  <div className="font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 shrink-0 text-right">
                    {formatVND(data.tien)}
                  </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.bg.replace("/15", "")} transition-all duration-500 rounded-full`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid 2 cột: Top 10 + Theo công đoạn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 người có tiền công cao nhất */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3.5 flex items-center gap-2 uppercase tracking-wide">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>Top 10 nhân sự có tiền công cao nhất</span>
          </div>
          {top10.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-8">Chưa có dữ liệu</div>
          ) : (
            <div className="space-y-3">
              {top10.map((p, i) => {
                const maxTopTien = top10[0]?.tongTien || 1;
                const pct = (p.tongTien / maxTopTien) * 100;
                return (
                  <div key={p.ma} className="group">
                    <div className="flex items-center gap-2.5 text-xs mb-1.5">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${i === 0 ? "bg-amber-500 text-white shadow-2xs"
                        : i === 1 ? "bg-slate-400 text-white"
                          : i === 2 ? "bg-amber-700 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{p.ten}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.ma} · {p.tongSL.toLocaleString()} sp · {p.soBanGhi} phiếu
                        </div>
                      </div>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0 text-xs sm:text-sm text-right">
                        {formatVND(p.tongTien)}
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ml-7.5">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Theo công đoạn */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3.5 flex items-center gap-2 uppercase tracking-wide">
            <Package className="w-4 h-4 text-indigo-500" />
            <span>Phân bổ tiền công theo công đoạn</span>
          </div>
          {Object.keys(kpi.theoCongDoan).length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-8">Chưa có dữ liệu</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(kpi.theoCongDoan)
                .sort((a, b) => b[1].tien - a[1].tien)
                .map(([cd, data]) => {
                  const pct = maxCongDoan > 0 ? (data.tien / maxCongDoan) * 100 : 0;
                  return (
                    <div key={cd}>
                      <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{cd}</span>
                          <span className="text-slate-400 text-[10px] truncate">· {data.count} phiếu · {data.soLuong.toLocaleString()} sp</span>
                        </div>
                        <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm shrink-0 text-right">
                          {formatVND(data.tien)}
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Bảng tóm tắt 7 trạng thái (data table) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/40">
          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Bảng tổng hợp số liệu 7 trạng thái
          </span>
        </div>
        <div className="overflow-x-auto p-1 sm:p-2">
          <table className="w-full min-w-[700px] text-xs sm:text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Số bản ghi</th>
                <th className="p-3 text-right">Sản lượng (sp)</th>
                <th className="p-3 text-right">Tổng tiền</th>
                <th className="p-3 text-right">% Tổng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {TRANG_THAI_DOI_SOAT.map((t, i) => {
                const data = kpi.theoTrangThai[t];
                const s = TRANG_THAI_STYLE[t];
                const pct = kpi.tongThucNhan > 0
                  ? ((data.tien / kpi.tongThucNhan) * 100).toFixed(1)
                  : "0";
                return (
                  <tr key={t} className="border-b hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-xs opacity-50 text-center">{i + 1}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${s.bg} ${s.color}`}>
                        {t}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">{data.count}</td>
                    <td className="p-3 text-right font-mono">{data.soLuong.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{formatVND(data.tien)}</td>
                    <td className="p-3 text-right font-mono text-xs opacity-70">{pct}%</td>
                  </tr>
                );
              })}
              {/* Tổng */}
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                <td className="p-3 font-bold" colSpan={2}>Tổng cộng</td>
                <td className="p-3 text-right font-mono font-black">{filtered.length}</td>
                <td className="p-3 text-right font-mono font-black">
                  {TRANG_THAI_DOI_SOAT.reduce((sum, t) => sum + kpi.theoTrangThai[t].soLuong, 0).toLocaleString()}
                </td>
                <td className="p-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">{formatVND(kpi.tongThucNhan)}</td>
                <td className="p-3 text-right font-mono font-black">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <div className="text-[11px] opacity-60 text-center pb-4 text-slate-500">
        💡 Dashboard tổng hợp số liệu tiền công · <Link href="/doi-soat" className="underline hover:text-teal-600">Mở bảng đối soát chi tiết</Link> để thực hiện xác nhận, thanh toán và xử lý khiếu nại.
      </div>
    </div>
  );
}

// ============ Sub Components ============

function KPICard({
  label,
  value,
  icon,
  iconBg = "bg-slate-100 dark:bg-slate-800",
  valueClass = "text-slate-900 dark:text-white",
  sub,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  iconBg?: string;
  valueClass?: string;
  sub?: string;
}) {
  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className={`text-base sm:text-lg xl:text-xl font-black font-mono tracking-tight my-1.5 truncate ${valueClass}`}>{value}</div>
      {sub && <div className="text-[11px] font-medium text-slate-400 truncate">{sub}</div>}
    </div>
  );
}
