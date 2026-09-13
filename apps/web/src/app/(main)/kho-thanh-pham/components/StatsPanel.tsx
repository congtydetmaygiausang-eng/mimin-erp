// ============ STATS PANEL ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)

import { Box, FileSpreadsheet } from "lucide-react";
import type { SanPhamTP } from "../data";

export function StatsHeader({ stats }: { stats: { tongSP: number; soLoai: number; tongGT: number; conHang: number; daDat: number } }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white p-4 md:p-7 shadow-lg relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5" /> MIMIN OS
          </div>
          <h1 className="text-xl md:text-3xl font-black tracking-tight flex items-center gap-2">Kho Thành Phẩm</h1>
        </div>
        
        <div className="grid grid-cols-3 md:flex gap-2 text-center text-xs w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/20 shadow-sm flex-1">
            <div className="text-lg md:text-2xl font-black">{stats.tongSP.toLocaleString()}</div>
            <div className="opacity-80 text-[10px] uppercase font-bold mt-0.5">Tổng SP</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/20 shadow-sm flex-1">
            <div className="text-lg md:text-2xl font-black">{stats.soLoai}</div>
            <div className="opacity-80 text-[10px] uppercase font-bold mt-0.5">Loại SP</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/20 shadow-sm flex-1">
            <div className="text-lg md:text-2xl font-black">{(stats.tongGT/1_000_000).toFixed(1)}<span className="text-[10px] ml-0.5">tr</span></div>
            <div className="opacity-80 text-[10px] uppercase font-bold mt-0.5">Giá trị</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatsByType({ dsLoai, dsSanPham, onClose }: { dsLoai: string[]; dsSanPham: SanPhamTP[]; onClose: () => void }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-amber-500" /> Thống kê theo loại SP</h3>
        <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-700">Ẩn</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {dsLoai.map((ma) => {
          const items = dsSanPham.filter((s) => s.maSP === ma);
          const sl = items.reduce((s, x) => s + x.soLuong, 0);
          const gt = items.reduce((s, x) => s + x.giaTri, 0);
          const sample = items[0];
          return (
            <div key={ma} className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-amber-700">{ma}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded">{items.length} lô</span>
              </div>
              <div className="text-xs text-slate-600 truncate mb-1">{sample?.tenSP}</div>
              <div className="flex justify-between text-[10px]">
                <span>SL: <b>{sl.toLocaleString()}</b></span>
                <span className="text-emerald-600 font-bold">{(gt/1000).toFixed(0)}K</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
