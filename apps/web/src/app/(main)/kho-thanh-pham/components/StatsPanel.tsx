// ============ STATS PANEL ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)

import { Box, FileSpreadsheet } from "lucide-react";
import type { SanPhamTP } from "../data";

export function StatsHeader({ stats }: { stats: { tongSP: number; soLoai: number; tongGT: number; conHang: number; daDat: number } }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white p-5 md:p-7 shadow-xl">
      <div className="text-xs font-medium opacity-90 mb-1 flex items-center gap-2">
        <Box className="w-3.5 h-3.5" /> MIMIN OS · Kho thành phẩm
      </div>
      <h1 className="text-2xl md:text-3xl font-bold">📦 Kho Thành Phẩm</h1>
      <p className="text-sm opacity-95 mt-1 max-w-3xl">
        Quản lý sản phẩm hoàn thành từ khâu Đóng gói. Tự động đồng bộ từ workflow data, hỗ trợ nhập/xuất kho, thống kê doanh thu tiềm năng.
      </p>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
        <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl md:text-2xl font-bold">{stats.tongSP.toLocaleString()}</div><div className="opacity-90">Tổng SP</div></div>
        <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl md:text-2xl font-bold">{stats.soLoai}</div><div className="opacity-90">Loại SP</div></div>
        <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl md:text-2xl font-bold">{(stats.tongGT/1_000_000).toFixed(1)}tr</div><div className="opacity-90">Giá trị</div></div>
        <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl md:text-2xl font-bold">{stats.conHang}</div><div className="opacity-90">Còn hàng</div></div>
        <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl md:text-2xl font-bold">{stats.daDat}</div><div className="opacity-90">Đã đặt</div></div>
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
