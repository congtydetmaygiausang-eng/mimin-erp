"use client";

// ============ TIỀN CÔNG HOÀN THIỆN (Đợt 6) ============
// Thống kê tiền công Hoàn thiện theo NV, công đoạn

import { useMemo, Suspense } from "react";
import { Wallet, TrendingUp, Award, Wind, Scissors, Box } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { useHoanThien, TRANG_THAI_HT_STYLE } from "@/lib/data/hoan-thien-store";
import { getHoanThienKPI, topNVHoanThien, filterByNguoiThucHien } from "@/lib/hoan-thien-helper";
import { formatVNDShort } from "@/components/ui";

export default function TienCongHoanThienPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <TienCongHoanThienContent />
    </Suspense>
  );
}

function TienCongHoanThienContent() {
  const { user } = useSession();
  const { banGhi } = useHoanThien();

  const maNV = user?.id;
  // Nếu là NV, chỉ xem của mình; nếu là lead/admin, xem tất cả
  const isLeadOrAdmin = user?.role && ["PHU_TRACH_DONG_GOI", "PHU_TRACH_KHUY_NUT", "PHU_TRACH_UI", "GIAM_DOC", "QUAN_TRI_HE_THONG"].includes(user.role);
  const data = isLeadOrAdmin ? banGhi : filterByNguoiThucHien(banGhi, maNV);
  const kpi = useMemo(() => getHoanThienKPI(data), [data]);
  const topNV = useMemo(() => topNVHoanThien(data, 10), [data]);
  const maxTien = topNV[0]?.tongTien || 1;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Wallet className="w-7 h-7 text-emerald-500" />
          Tiền công Hoàn thiện
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          {isLeadOrAdmin ? "Tổng hợp tất cả NV" : "Cá nhân"} · {data.length} phiếu · {formatVNDShort(kpi.tongThanhTien)} tổng
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-3 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-700">
          <div className="text-xs opacity-80 mb-1">Tổng tiền công</div>
          <div className="text-xl font-bold">{formatVNDShort(kpi.tongThanhTien)}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-sky-500/10 to-sky-500/5 text-sky-700">
          <div className="text-xs opacity-80 mb-1">SL đạt</div>
          <div className="text-xl font-bold">{kpi.tongSLDat.toLocaleString()}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-700">
          <div className="text-xs opacity-80 mb-1">SL lỗi</div>
          <div className="text-xl font-bold">{kpi.tongSLLoi.toLocaleString()}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-700">
          <div className="text-xs opacity-80 mb-1">Đơn giá TB</div>
          <div className="text-xl font-bold">
            {kpi.tongSLDat > 0 ? formatVNDShort(Math.round(kpi.tongThanhTien / kpi.tongSLDat)) : "—"}
          </div>
        </div>
      </div>

      {/* Top NV */}
      <div className="card p-4">
        <div className="text-sm font-bold mb-3 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" />
          Top NV theo tiền công
        </div>
        {topNV.length === 0 ? (
          <div className="text-xs opacity-50 text-center py-8">Chưa có dữ liệu</div>
        ) : (
          <div className="space-y-2">
            {topNV.map((p, i) => {
              const pct = (p.tongTien / maxTien) * 100;
              return (
                <div key={p.ma} className="group">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-white" : i === 2 ? "bg-orange-500 text-white" : "bg-white/30"
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{p.ten}</div>
                      <div className="text-[10px] opacity-60 font-mono">{p.ma} · {p.soPhieu} phiếu</div>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 shrink-0">{formatVNDShort(p.tongTien)}</span>
                  </div>
                  <div className="h-2 bg-white/30 dark:bg-white/5 rounded-full overflow-hidden ml-8">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${pct}%` }} />
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
          <TrendingUp className="w-4 h-4 text-violet-500" />
          Tiền công theo công đoạn
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(kpi.theoCongDoan)
            .sort((a, b) => b[1].tien - a[1].tien)
            .map(([cd, data]) => {
              const Icon = cd === "Khuy nút" ? Scissors : cd === "Ủi" ? Wind : Box;
              return (
                <div key={cd} className="card p-3 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-semibold">{cd}</span>
                  </div>
                  <div className="text-2xl font-bold text-violet-600">{formatVNDShort(data.tien)}</div>
                  <div className="text-[10px] opacity-60">{data.count} phiếu · {data.soLuong.toLocaleString()} sp</div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
