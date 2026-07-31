"use client";

// ============ SẢN LƯỢNG HOÀN THIỆN (Đợt 6) ============
// Thống kê sản lượng Hoàn thiện theo NV, công đoạn, thời gian

import { useMemo, Suspense } from "react";
import { BarChart3, Package, TrendingUp, Award, Wind, Scissors, Box } from "lucide-react";
import { useHoanThien } from "@/lib/data/hoan-thien-store";
import { getHoanThienKPI, topNVHoanThien } from "@/lib/hoan-thien-helper";
import { formatVNDShort } from "@/components/ui";

export default function SanLuongHoanThienPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <SanLuongHoanThienContent />
    </Suspense>
  );
}

function SanLuongHoanThienContent() {
  const { banGhi } = useHoanThien();
  const kpi = useMemo(() => getHoanThienKPI(banGhi), [banGhi]);
  const topNV = useMemo(() => topNVHoanThien(banGhi, 10), [banGhi]);

  const maxTienCD = Math.max(...Object.values(kpi.theoCongDoan).map((v) => v.tien), 1);
  const maxTienNV = topNV[0]?.tongTien || 1;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-violet-500" />
          Sản lượng Hoàn thiện
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          {kpi.tongPhieu} phiếu · SL đạt: <b className="text-emerald-600">{kpi.tongSLDat.toLocaleString()}</b> · SL lỗi: <b className="text-rose-600">{kpi.tongSLLoi.toLocaleString()}</b>
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-3 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-700">
          <div className="text-xs opacity-80 mb-1">SL đạt</div>
          <div className="text-xl font-bold">{kpi.tongSLDat.toLocaleString()}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-rose-500/10 to-rose-500/5 text-rose-700">
          <div className="text-xs opacity-80 mb-1">SL lỗi</div>
          <div className="text-xl font-bold">{kpi.tongSLLoi.toLocaleString()}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-sky-500/10 to-sky-500/5 text-sky-700">
          <div className="text-xs opacity-80 mb-1">Tỷ lệ đạt</div>
          <div className="text-xl font-bold">
            {kpi.tongSLDat + kpi.tongSLLoi > 0
              ? `${((kpi.tongSLDat / (kpi.tongSLDat + kpi.tongSLLoi)) * 100).toFixed(1)}%`
              : "—"}
          </div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-700">
          <div className="text-xs opacity-80 mb-1">Tổng tiền</div>
          <div className="text-xl font-bold">{formatVNDShort(kpi.tongThanhTien)}</div>
        </div>
      </div>

      {/* Theo công đoạn */}
      <div className="card p-4">
        <div className="text-sm font-bold mb-3 flex items-center gap-1.5">
          <Package className="w-4 h-4 text-violet-500" />
          Theo công đoạn
        </div>
        <div className="space-y-2.5">
          {Object.entries(kpi.theoCongDoan)
            .sort((a, b) => b[1].tien - a[1].tien)
            .map(([cd, data]) => {
              const pct = (data.tien / maxTienCD) * 100;
              const Icon = cd === "Khuy nút" ? Scissors : cd === "Ủi" ? Wind : Box;
              return (
                <div key={cd}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-violet-600" />
                      <span className="font-semibold">{cd}</span>
                      <span className="opacity-60 text-[10px]">· {data.count} phiếu · {data.soLuong.toLocaleString()} sp</span>
                    </div>
                    <span className="font-mono font-bold text-violet-600">{formatVNDShort(data.tien)}</span>
                  </div>
                  <div className="h-2 bg-white/30 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Top NV */}
      <div className="card p-4">
        <div className="text-sm font-bold mb-3 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" />
          Top NV Hoàn thiện
        </div>
        {topNV.length === 0 ? (
          <div className="text-xs opacity-50 text-center py-8">Chưa có dữ liệu</div>
        ) : (
          <div className="space-y-1.5">
            {topNV.map((p, i) => {
              const pct = (p.tongTien / maxTienNV) * 100;
              return (
                <div key={p.ma} className="group">
                  <div className="flex items-center gap-2 text-xs mb-0.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-white" : i === 2 ? "bg-orange-500 text-white" : "bg-white/30"
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{p.ten}</div>
                      <div className="text-[10px] opacity-60 font-mono">{p.ma} · {p.tongDat.toLocaleString()} sp đạt · {p.tongLoi} lỗi</div>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 shrink-0">{formatVNDShort(p.tongTien)}</span>
                  </div>
                  <div className="h-1.5 bg-white/30 dark:bg-white/5 rounded-full overflow-hidden ml-7">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
