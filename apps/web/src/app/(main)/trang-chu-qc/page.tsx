"use client";

// ============ TRANG CHỦ QC (Đợt 8 - Bộ 8) ============
// Dashboard cho QC - thống kê kiểm tra chất lượng

import {
  ShieldCheck, ClipboardList, AlertTriangle, CheckCircle2,
  Activity, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useQC, TRANG_THAI_QC_STYLE } from "@/lib/data/qc-store";
import { getQCKPI } from "@/lib/qc-helper";
import { MobileCard } from "@/components/ui";

export default function TrangChuQCPage() {
  const { banGhi } = useQC();
  const kpi = getQCKPI(banGhi);

  // 5 lỗi gần nhất
  const loiGanDay = banGhi.filter((b) => b.trangThai === "Có lỗi" || b.trangThai === "Đã xử lý lỗi").slice(0, 5);
  const choKiem = banGhi.filter((b) => b.trangThai === "Chờ kiểm").slice(0, 5);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="card p-4 bg-gradient-to-br from-rose-500/10 to-orange-500/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-70 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Trang chủ QC
            </div>
            <h1 className="text-xl md:text-2xl font-bold mt-1">Kiểm tra chất lượng 🛡️</h1>
            <p className="text-xs opacity-70 mt-1">
              {kpi.tongPhieu} phiếu · Tỷ lệ đạt: <b className="text-emerald-600">{kpi.tyLeDat}%</b>
            </p>
          </div>
        </div>
      </div>

      {/* 6 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card p-3 bg-gradient-to-br from-sky-500/10 to-sky-500/5 text-sky-700">
          <div className="text-xs opacity-80 mb-1">Chờ kiểm</div>
          <div className="text-xl font-bold">{kpi.theoTrangThai["Chờ kiểm"].count}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-700">
          <div className="text-xs opacity-80 mb-1">Đang kiểm</div>
          <div className="text-xl font-bold">{kpi.theoTrangThai["Đang kiểm"].count}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-700">
          <div className="text-xs opacity-80 mb-1">Đạt</div>
          <div className="text-xl font-bold">{kpi.theoTrangThai["Đạt"].count}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-rose-500/10 to-rose-500/5 text-rose-700">
          <div className="text-xs opacity-80 mb-1">Có lỗi</div>
          <div className="text-xl font-bold">{kpi.theoTrangThai["Có lỗi"].count}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-700">
          <div className="text-xs opacity-80 mb-1">SL đạt</div>
          <div className="text-xl font-bold">{kpi.tongDat.toLocaleString()}</div>
        </div>
        <div className="card p-3 bg-gradient-to-br from-amber-500/10 to-amber-500/5 text-amber-700">
          <div className="text-xs opacity-80 mb-1">Tỷ lệ đạt</div>
          <div className="text-xl font-bold">{kpi.tyLeDat}%</div>
        </div>
      </div>

      {/* Theo công đoạn */}
      <div className="card p-4">
        <div className="text-sm font-bold mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-rose-500" />
          Tỷ lệ lỗi theo công đoạn
        </div>
        <div className="space-y-2.5">
          {Object.entries(kpi.theoCongDoan).sort((a, b) => b[1].count - a[1].count).map(([cd, d]) => {
            const max = Math.max(...Object.values(kpi.theoCongDoan).map((v) => v.count), 1);
            const pct = (d.count / max) * 100;
            return (
              <div key={cd}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold">{cd}</span>
                  <span className="font-mono opacity-70">{d.count} phiếu · {d.soLuong.toLocaleString()} sp</span>
                </div>
                <div className="h-2 bg-white/30 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-500 to-orange-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lỗi gần đây */}
      {loiGanDay.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5 text-rose-700">
            <AlertTriangle className="w-4 h-4" /> Lỗi gần đây ({loiGanDay.length})
          </h2>
          <div className="space-y-2">
            {loiGanDay.map((b) => {
              const s = TRANG_THAI_QC_STYLE[b.trangThai];
              return (
                <MobileCard
                  key={b.id}
                  title={b.id}
                  subtitle={`${b.congDoan} · ${b.nguoiThucHien}`}
                  badge={<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.color}`}>{b.trangThai}</span>}
                  fields={[
                    { label: "Mã SP", value: b.maSP },
                    { label: "SL đạt", value: <span className="font-mono text-emerald-600 font-semibold">{b.soLuongDat.toLocaleString()}</span> },
                    { label: "SL lỗi", value: <span className="font-mono text-rose-600">{b.soLuongLoi.toLocaleString()}</span> },
                    { label: "Tỷ lệ đạt", value: <span className="font-mono">{b.tiLeDat}%</span>, highlight: true },
                  ]}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Chờ kiểm */}
      {choKiem.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-sky-500" /> Chờ kiểm ({choKiem.length})
          </h2>
          <div className="space-y-2">
            {choKiem.slice(0, 3).map((b) => (
              <MobileCard
                key={b.id}
                title={b.id}
                subtitle={`${b.congDoan} · ${b.nguoiThucHien}`}
                fields={[
                  { label: "SL", value: <span className="font-mono">{b.soLuongGiao.toLocaleString()}</span> },
                  { label: "NV giao", value: b.nguoiThucHien },
                ]}
              />
            ))}
            <Link href="/kiem-tra-cl" className="text-xs text-brand-600 block text-center py-2">
              Mở trang kiểm tra →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
