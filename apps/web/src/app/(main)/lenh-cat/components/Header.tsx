// ============ PREMIUM HEADER + STATS ============
// Tach tu page.tsx (2026-08-05 - toi uu B.7)

import { Scissors, Plus, Clock, CheckCircle2, Wallet } from "lucide-react";
import { formatVNDShort } from "@/lib/data/real-data";
import { StatCard } from "./LCard";

interface HeaderProps {
  stats: { tongLC: number; tongSL: number; nhap: number; dangCat: number; daTao: number; hoanThanh: number; tongGiaVon: number; giaVonTBSP: number };
  onReset: () => void;
  onCreate: () => void;
}

export function PremiumHeader({ stats, onReset, onCreate }: HeaderProps) {
  return (
    <>
      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl shadow-teal-900/20 mb-8 bg-gradient-to-br from-teal-900 via-teal-700 to-sky-800">

        <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="text-white drop-shadow-md">
            <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3 tracking-tight">
              <Scissors className="w-9 h-9 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              Lệnh Cắt Sản Xuất
            </h1>
            <p className="mt-3 text-cyan-50 opacity-90 max-w-lg text-sm md:text-base leading-relaxed font-medium">
              Tạo lệnh cắt mới, phân bổ size, tự động tính toán định mức vải và giá vốn dự kiến (COGS).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={onReset} className="px-5 py-3 rounded-xl bg-black/20 hover:bg-black/40 border border-white/20 backdrop-blur-md text-white font-semibold text-sm transition-all flex items-center gap-2">
              Reset
            </button>
            <button
              onClick={onCreate}
              className="group relative px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/40 backdrop-blur-lg text-white font-bold text-base shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] transition-all overflow-hidden flex items-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-400 opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300 drop-shadow-md relative z-10" />
              <span className="relative z-10 drop-shadow-lg tracking-wide uppercase">Tạo lệnh cắt</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Scissors className="w-4 h-4" />} label="Tổng lệnh" value={stats.tongLC.toString()} sub={`${stats.tongSL.toLocaleString()} sp`} color="violet" />
        <StatCard icon={<Clock className="w-4 h-4" />} label="Nháp + Đang cắt" value={(stats.nhap + stats.dangCat).toString()} sub={`${stats.nhap} nháp · ${stats.dangCat} đang cắt`} color="amber" />
        <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Đã tạo + Hoàn thành" value={(stats.daTao + stats.hoanThanh).toString()} sub={`${stats.daTao} đã tạo · ${stats.hoanThanh} xong`} color="emerald" />
        <StatCard icon={<Wallet className="w-4 h-4" />} label="Tổng giá vốn lô" value={formatVNDShort(stats.tongGiaVon)} sub={`BQ: ${formatVNDShort(stats.giaVonTBSP)}/sp`} color="sky" />
      </div>
    </>
  );
}
