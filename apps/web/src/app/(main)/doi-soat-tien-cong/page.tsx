"use client";

// ============ ĐỐI SOÁT TIỀN CÔNG (Đợt 5 - Dashboard tổng hợp) ============
// Dashboard cho Kế toán & Giám đốc theo dõi toàn bộ tiền công:
// - 6 KPI tổng quan (tổng tiền, đã TT, còn nợ, khiếu nại, khóa, NV có tiền)
// - Biểu đồ 7 trạng thái (CSS bar chart không cần thư viện)
// - Tiến độ thanh toán (progress bar)
// - Bảng tổng hợp theo 7 trạng thái (số lượng + tổng tiền + sản lượng)
// - Top 10 người có tiền công cao nhất
// - Bảng tổng hợp theo công đoạn
// - Filter theo thời gian (hôm nay/tuần/tháng/tất cả)

import { useState, useMemo, Suspense } from "react";
import {
  Wallet2, TrendingUp, TrendingDown, AlertTriangle, Lock, Users,
  CheckCircle2, Clock, DollarSign, BarChart3, Package, Calendar,
  ChevronRight, Wallet, FileText, Activity,
} from "lucide-react";
import Link from "next/link";
import { useDoiSoat, TRANG_THAI_DOI_SOAT, TRANG_THAI_STYLE } from "@/lib/data/doi-soat-store";
import { getDoiSoatKPI, topNguoiTienCong } from "@/lib/doi-soat-helper";
import { formatVNDShort } from "@/components/ui";

type TimeFilter = "all" | "today" | "week" | "month";

export default function DoiSoatTienCongPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <DoiSoatTienCongContent />
    </Suspense>
  );
}

function DoiSoatTienCongContent() {
  const { doiSoat } = useDoiSoat();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

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
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Wallet2 className="w-7 h-7 text-emerald-500" />
            Đối soát tiền công
            <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold">
              Tổng hợp
            </span>
          </h1>
          <p className="opacity-70 mt-1 text-sm">
            Dashboard tiền công theo 7 trạng thái · {filtered.length} bản ghi · {soNguoiCoTienCong} người thực hiện
          </p>
        </div>
        <Link
          href="/doi-soat"
          className="text-xs px-3 py-1.5 rounded-full bg-white/40 dark:bg-white/5 hover:bg-white/60 flex items-center gap-1"
        >
          <FileText className="w-3.5 h-3.5" /> Mở bảng đối soát <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Time filter */}
      <div className="flex flex-wrap gap-1.5">
        {([
          { v: "all", label: "Tất cả", icon: <Activity className="w-3 h-3" /> },
          { v: "today", label: "Hôm nay", icon: <Calendar className="w-3 h-3" /> },
          { v: "week", label: "7 ngày qua", icon: <Clock className="w-3 h-3" /> },
          { v: "month", label: "30 ngày qua", icon: <Calendar className="w-3 h-3" /> },
        ] as { v: TimeFilter; label: string; icon: any }[]).map((t) => (
          <button
            key={t.v}
            onClick={() => setTimeFilter(t.v)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
              timeFilter === t.v ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* 6 KPI chính */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          label="Tổng thực nhận"
          value={formatVNDShort(kpi.tongThucNhan)}
          icon={<Wallet className="w-4 h-4" />}
          color="emerald"
          sub={`${filtered.length} bản ghi`}
        />
        <KPICard
          label="Đã thanh toán"
          value={formatVNDShort(kpi.tongDaThanhToan)}
          icon={<CheckCircle2 className="w-4 h-4" />}
          color="sky"
          sub={`${tyLeThanhToan}% tổng`}
        />
        <KPICard
          label="Còn nợ"
          value={formatVNDShort(kpi.tongConNo)}
          icon={<TrendingDown className="w-4 h-4" />}
          color="amber"
          highlight={kpi.tongConNo > 0}
          sub={kpi.tongConNo > 0 ? "Cần thanh toán" : "OK"}
        />
        <KPICard
          label="Khiếu nại"
          value={kpi.tongKhiieuNai}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="rose"
          highlight={kpi.tongKhiieuNai > 0}
          sub="Chưa giải quyết"
        />
        <KPICard
          label="NV có tiền"
          value={soNguoiCoTienCong}
          icon={<Users className="w-4 h-4" />}
          color="violet"
          sub="Unique"
        />
        <KPICard
          label="Đã khóa"
          value={kpi.tongLocked}
          icon={<Lock className="w-4 h-4" />}
          color="slate"
          sub="Bản ghi chốt"
        />
      </div>

      {/* Tiến độ thanh toán */}
      <div className="card p-4 bg-gradient-to-br from-emerald-500/5 to-sky-500/5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold opacity-70 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Tiến độ thanh toán tổng thể
          </div>
          <div className="text-sm font-bold">
            <span className="text-emerald-600">{tyLeThanhToan}%</span>
            <span className="opacity-50 mx-1">·</span>
            <span className="font-mono">{formatVNDShort(kpi.tongDaThanhToan)} / {formatVNDShort(kpi.tongThucNhan)}</span>
          </div>
        </div>
        <div className="h-3 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            style={{ width: `${tyLeThanhToan}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] opacity-60 mt-1.5">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Bảng 7 trạng thái */}
      <div className="card p-4">
        <div className="text-sm font-bold mb-3 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-brand-500" />
          Phân bổ theo 7 trạng thái
        </div>
        <div className="space-y-2.5">
          {TRANG_THAI_DOI_SOAT.map((t) => {
            const data = kpi.theoTrangThai[t];
            const s = TRANG_THAI_STYLE[t];
            const pct = maxTien > 0 ? (data.tien / maxTien) * 100 : 0;
            return (
              <div key={t} className="group">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${s.bg} ${s.color}`}>
                      {t}
                    </span>
                    <span className="opacity-60">· {data.count} bản ghi · {data.soLuong.toLocaleString()} sp</span>
                  </div>
                  <div className="font-mono font-bold text-sm">
                    {formatVNDShort(data.tien)}
                  </div>
                </div>
                <div className="h-2 bg-white/30 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.bg.replace("/15", "")} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid 2 cột: Top 10 + Theo công đoạn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top 10 người có tiền công cao nhất */}
        <div className="card p-4">
          <div className="text-sm font-bold mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            Top 10 người có tiền công cao nhất
          </div>
          {top10.length === 0 ? (
            <div className="text-xs opacity-50 text-center py-8">Chưa có dữ liệu</div>
          ) : (
            <div className="space-y-1.5">
              {top10.map((p, i) => {
                const maxTopTien = top10[0]?.tongTien || 1;
                const pct = (p.tongTien / maxTopTien) * 100;
                return (
                  <div key={p.ma} className="group">
                    <div className="flex items-center gap-2 text-xs mb-0.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        i === 0 ? "bg-amber-500 text-white"
                          : i === 1 ? "bg-slate-400 text-white"
                          : i === 2 ? "bg-orange-500 text-white"
                          : "bg-white/30 text-current"
                      }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{p.ten}</div>
                        <div className="text-[10px] opacity-60 font-mono">
                          {p.ma} · {p.tongSL.toLocaleString()} sp · {p.soBanGhi} phiếu
                        </div>
                      </div>
                      <div className="font-mono font-bold text-emerald-600 shrink-0 text-xs">
                        {formatVNDShort(p.tongTien)}
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/30 dark:bg-white/5 rounded-full overflow-hidden ml-7">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
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
        <div className="card p-4">
          <div className="text-sm font-bold mb-3 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-violet-500" />
            Phân bổ theo công đoạn
          </div>
          {Object.keys(kpi.theoCongDoan).length === 0 ? (
            <div className="text-xs opacity-50 text-center py-8">Chưa có dữ liệu</div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(kpi.theoCongDoan)
                .sort((a, b) => b[1].tien - a[1].tien)
                .map(([cd, data]) => {
                  const pct = maxCongDoan > 0 ? (data.tien / maxCongDoan) * 100 : 0;
                  return (
                    <div key={cd}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{cd}</span>
                          <span className="opacity-60 text-[10px]">· {data.count} phiếu · {data.soLuong.toLocaleString()} sp</span>
                        </div>
                        <div className="font-mono font-bold text-violet-600">
                          {formatVNDShort(data.tien)}
                        </div>
                      </div>
                      <div className="h-2 bg-white/30 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
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
      <div className="card overflow-hidden">
        <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold">Bảng tổng hợp 7 trạng thái</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-slate-50/50 dark:bg-white/5" style={{ borderColor: "var(--border)" }}>
                <th className="p-3">#</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Số bản ghi</th>
                <th className="p-3 text-right">Sản lượng (sp)</th>
                <th className="p-3 text-right">Tổng tiền</th>
                <th className="p-3 text-right">% Tổng</th>
              </tr>
            </thead>
            <tbody>
              {TRANG_THAI_DOI_SOAT.map((t, i) => {
                const data = kpi.theoTrangThai[t];
                const s = TRANG_THAI_STYLE[t];
                const pct = kpi.tongThucNhan > 0
                  ? ((data.tien / kpi.tongThucNhan) * 100).toFixed(1)
                  : "0";
                return (
                  <tr key={t} className="border-b hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 text-xs opacity-50">{i + 1}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${s.bg} ${s.color}`}>
                        {t}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">{data.count}</td>
                    <td className="p-3 text-right font-mono">{data.soLuong.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-semibold">{formatVNDShort(data.tien)}</td>
                    <td className="p-3 text-right font-mono text-xs opacity-70">{pct}%</td>
                  </tr>
                );
              })}
              {/* Tổng */}
              <tr className="bg-slate-50/70 dark:bg-white/5 font-bold border-t-2" style={{ borderColor: "var(--border)" }}>
                <td className="p-3" colSpan={2}>Tổng cộng</td>
                <td className="p-3 text-right font-mono">{filtered.length}</td>
                <td className="p-3 text-right font-mono">
                  {TRANG_THAI_DOI_SOAT.reduce((sum, t) => sum + kpi.theoTrangThai[t].soLuong, 0).toLocaleString()}
                </td>
                <td className="p-3 text-right font-mono text-emerald-600">{formatVNDShort(kpi.tongThucNhan)}</td>
                <td className="p-3 text-right font-mono">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <div className="text-[10px] opacity-50 text-center pb-4">
        💡 Dashboard tổng hợp từ <Link href="/doi-soat" className="underline">bảng đối soát</Link> ·
        dùng data thật từ <code>ALL_REAL_PHIEU</code> + localStorage <code>mimin_doi_soat_v1</code>
      </div>
    </div>
  );
}

// ============ Sub Components ============

function KPICard({ label, value, icon, color, highlight = false, sub }: any) {
  const colorMap: Record<string, string> = {
    slate: "from-slate-500/10 to-slate-500/5 text-slate-700",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-700",
    sky: "from-sky-500/10 to-sky-500/5 text-sky-700",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-700",
    rose: "from-rose-500/10 to-rose-500/5 text-rose-700",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-700",
  };
  return (
    <div className={`card p-3 bg-gradient-to-br ${colorMap[color]} ${highlight ? "ring-2 ring-amber-500/40" : ""}`}>
      <div className="flex items-center gap-1.5 text-xs opacity-80 mb-1">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-lg md:text-2xl font-bold tabular-nums truncate">{value}</div>
      {sub && <div className="text-[10px] opacity-60 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}
