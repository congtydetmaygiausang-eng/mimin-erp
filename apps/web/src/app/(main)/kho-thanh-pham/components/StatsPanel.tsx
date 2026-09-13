// ============ STATS PANEL ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)

import { Box, FileSpreadsheet } from "lucide-react";
import type { SanPhamTP } from "../data";

export function StatsHeader({ stats }: { stats: { tongSP: number; soLoai: number; tongGT: number; conHang: number; daDat: number } }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white p-5 md:p-8 shadow-lg relative overflow-hidden mb-4">
      {/* Decorative background element */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white opacity-5 blur-3xl pointer-events-none"></div>
      <div className="absolute top-10 right-20 w-32 h-32 rounded-full bg-indigo-400 opacity-20 blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2 flex items-center gap-2 text-indigo-100">
            <Box className="w-4 h-4" /> BẢNG ĐIỀU KHIỂN
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight flex items-center gap-2">Kho Thành Phẩm</h1>
          <div className="mt-2 text-indigo-100 text-sm font-medium opacity-90 hidden md:block">Quản lý không gian lưu trữ và sản phẩm xuất/nhập kho</div>
        </div>
        
        <div className="grid grid-cols-3 md:flex gap-3 text-center text-xs w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-sm flex-1 md:w-32 hover:bg-white/20 transition-colors cursor-default">
            <div className="text-xl md:text-3xl font-black mb-1">{stats.tongSP.toLocaleString("vi-VN")}</div>
            <div className="opacity-70 text-[10px] md:text-xs uppercase font-bold tracking-wider">Tổng SP</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-sm flex-1 md:w-32 hover:bg-white/20 transition-colors cursor-default">
            <div className="text-xl md:text-3xl font-black mb-1">{stats.soLoai}</div>
            <div className="opacity-70 text-[10px] md:text-xs uppercase font-bold tracking-wider">Loại SP</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-sm flex-1 md:w-auto min-w-[120px] hover:bg-white/20 transition-colors cursor-default">
            <div className="text-xl md:text-2xl font-black mb-1">{stats.tongGT.toLocaleString("vi-VN")}<span className="text-[12px] md:text-sm ml-1 opacity-80">đ</span></div>
            <div className="opacity-70 text-[10px] md:text-xs uppercase font-bold tracking-wider">Giá trị</div>
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
