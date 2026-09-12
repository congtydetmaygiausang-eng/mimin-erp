// ============ PREMIUM HEADER + STATS ============
// Tach tu page.tsx (2026-08-05 - toi uu B.7)

import { Scissors, Plus, Clock, CheckCircle2, Wallet, Package } from "lucide-react";
import { formatVNDShort } from "@/lib/data/real-data";
import { StatCard } from "./LCard";

interface HeaderProps {
  stats: { tongLC: number; tongSL: number; nhap: number; dangCat: number; daTao: number; hoanThanh: number; tongGiaVon: number; giaVonTBSP: number };
  onReset: () => void;
  onCreate: () => void;
}

export function PremiumHeader({ stats, onReset, onCreate }: HeaderProps) {
  return (
    <div className="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-3xl p-5 mb-5 space-y-4">
      {/* Top: Title & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-slate-800 drop-shadow-sm">
            <Scissors className="w-7 h-7 text-sky-600" /> Tổng Quan Sản Xuất
          </h1>
          <p className="text-sm font-bold text-slate-600 mt-1 max-w-xl">
            Quản lý toàn bộ vòng đời lệnh cắt: phân bổ size, theo dõi tiến độ các khâu gia công và kiểm soát giá vốn tự động.
          </p>
        </div>

        <div className="flex items-stretch sm:items-center gap-3 w-full md:w-auto mt-2 md:mt-0 flex-col sm:flex-row">
          <button onClick={onReset} className="flex-1 md:flex-none justify-center px-5 py-2.5 rounded-xl bg-white/50 hover:bg-white/80 border border-white text-slate-700 font-bold text-sm transition-all shadow-sm flex items-center">
            Làm mới
          </button>
          <button
            onClick={onCreate}
            className="flex-1 md:flex-none justify-center group px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span className="uppercase tracking-wide">Tạo lệnh cắt</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DashboardStat
          icon={<Package className="w-3.5 h-3.5" />}
          label="Tổng Lệnh Đang Chạy"
          value={stats.tongLC.toString()}
          sub={`${stats.tongSL.toLocaleString()} sản phẩm`}
          colorClass="text-sky-600"
        />
        <DashboardStat
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Chờ Xử Lý & Đang Cắt"
          value={(stats.nhap + stats.dangCat).toString()}
          sub={`${stats.nhap} nháp · ${stats.dangCat} đang cắt`}
          colorClass="text-amber-600"
        />
        <DashboardStat
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          label="Đã Tạo & Hoàn Thành"
          value={(stats.daTao + stats.hoanThanh).toString()}
          sub={`${stats.daTao} đã tạo · ${stats.hoanThanh} hoàn thành`}
          colorClass="text-emerald-700"
        />
        <DashboardStat
          icon={<Wallet className="w-3.5 h-3.5" />}
          label="Tổng Giá Vốn Tạm Tính"
          value={formatVNDShort(stats.tongGiaVon)}
          sub={`Bình quân: ${formatVNDShort(stats.giaVonTBSP)}/sp`}
          colorClass="text-purple-700"
        />
      </div>
    </div>
  );
}

function DashboardStat({ icon, label, value, sub, colorClass }: { icon: React.ReactNode; label: string; value: string; sub: string; colorClass: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-4 shadow-sm transition hover:scale-[1.02]">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="mt-1 flex flex-col">
        <span className={`text-2xl font-black ${colorClass}`}>{value}</span>
        <span className="text-[11px] font-bold text-slate-400 mt-0.5">{sub}</span>
      </div>
    </div>
  );
}
