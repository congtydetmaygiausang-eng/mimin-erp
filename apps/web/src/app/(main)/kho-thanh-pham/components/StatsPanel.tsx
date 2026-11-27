// ============ STATS PANEL ============
// Tối ưu giao diện Header Banner cao cấp chuẩn MIMIN ERP
"use client";

import {
  Warehouse, Package, DollarSign, Layers, ShieldCheck,
  AlertTriangle, Plus, FileSpreadsheet, Download, Sparkles, TrendingUp
} from "lucide-react";
import type { SanPhamTP } from "../data";

interface StatsHeaderProps {
  stats: {
    tongSP: number;
    soLoai: number;
    tongGT: number;
    conHang: number;
    daDat: number;
    tongBienThe?: number;
    countManPJ?: number;
    countPolo?: number;
  };
  onThemSP?: () => void;
  onTiLeSize?: () => void;
  onExportCSV?: () => void;
  onAutoSync?: () => void;
}

export function StatsHeader({ stats, onThemSP, onTiLeSize, onExportCSV, onAutoSync }: StatsHeaderProps) {
  const formatGiaTri = (val: number) => {
    if (val >= 1_000_000_000) return { num: (val / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 }), unit: "tỷ đ" };
    if (val >= 1_000_000) return { num: (val / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 }), unit: "tr đ" };
    return { num: val.toLocaleString("vi-VN"), unit: "đ" };
  };
  const gt = formatGiaTri(stats.tongGT);

  return (
    <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 md:p-6 shadow-xl border border-slate-800/80 relative overflow-hidden mb-4">
      {/* Glow décor background */}
      <div className="absolute -top-14 -right-14 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-14 -left-14 w-60 h-60 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* Top row: Title + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Kho & Vận Hành
              </span>
              <span className="text-xs text-slate-400 font-medium">· Tồn kho may mặc chuẩn hóa</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">
              Kho Thành Phẩm & Tồn Kho May Mặc
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Quản lý phân loại sản phẩm ManPJ & Polomimin · Kiểm soát biến thể Màu & Size · Định vị khu kệ lưu kho
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onAutoSync && (
            <button
              type="button"
              onClick={onAutoSync}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Đồng bộ tự động từ dữ liệu quy trình sản xuất"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Đồng bộ</span>
            </button>
          )}

          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Xuất file báo cáo kho thành phẩm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV</span>
            </button>
          )}

          {onTiLeSize && (
            <button
              type="button"
              onClick={onTiLeSize}
              className="px-3 py-2 bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Cài đặt bảng tỉ lệ size"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
              <span>Tỉ lệ size</span>
            </button>
          )}

          {onThemSP && (
            <button
              type="button"
              onClick={onThemSP}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-md shadow-indigo-500/25 cursor-pointer"
              title="Tạo mới sản phẩm vào kho"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm sản phẩm</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: 4 Thẻ KPI Thống Kê Tổng Quan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 relative z-10">
        {/* KPI 1: Tổng tồn kho SP */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-3.5 border border-slate-700/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng Tồn Kho
            </span>
            <div className="text-lg md:text-xl font-black text-white font-mono mt-0.5">
              {stats.tongSP.toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-semibold text-teal-400">SP</span>
            </div>
            <span className="text-[10px] text-slate-400 truncate block">
              {stats.conHang} lô đang còn hàng
            </span>
          </div>
        </div>

        {/* KPI 2: Tổng giá trị tồn */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-3.5 border border-slate-700/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng Giá Trị Tồn
            </span>
            <div className="text-lg md:text-xl font-black text-emerald-400 font-mono mt-0.5">
              {gt.num}{" "}
              <span className="text-xs font-semibold text-slate-300">{gt.unit}</span>
            </div>
            <span className="text-[10px] text-slate-400 truncate block">
              Theo đơn giá xuất nhập kho
            </span>
          </div>
        </div>

        {/* KPI 3: Số mẫu mã / SP */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-3.5 border border-slate-700/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Mẫu Mã / Biến Thể
            </span>
            <div className="text-lg md:text-xl font-black text-white font-mono mt-0.5">
              {stats.soLoai}{" "}
              <span className="text-xs font-semibold text-indigo-300">mã SP</span>
            </div>
            <span className="text-[10px] text-slate-400 truncate block">
              {stats.countManPJ ?? 0} ManPJ · {stats.countPolo ?? 0} Polomimin
            </span>
          </div>
        </div>

        {/* KPI 4: Tình trạng tồn kho */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-3.5 border border-slate-700/60 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Cảnh Báo Tồn Kho
            </span>
            <div className="text-base md:text-lg font-black text-white font-mono mt-0.5 flex items-center gap-1.5">
              <span className="text-emerald-400">{stats.conHang} còn</span>
              <span className="text-slate-500">·</span>
              <span className="text-rose-400">{stats.daDat} xuất</span>
            </div>
            <span className="text-[10px] text-slate-400 truncate block">
              Kiểm soát số lượng theo size & màu
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatsByType({ dsLoai, dsSanPham, onClose }: { dsLoai: string[]; dsSanPham: SanPhamTP[]; onClose: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm mt-4">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          Thống kê chi tiết theo từng mã sản phẩm ({dsLoai.length} mẫu mã)
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold cursor-pointer"
        >
          Ẩn bảng
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {dsLoai.map((ma) => {
          const items = dsSanPham.filter((s) => s.maSP === ma);
          const sl = items.reduce((s, x) => s + x.soLuong, 0);
          const gt = items.reduce((s, x) => s + x.giaTri, 0);
          const sample = items[0];
          return (
            <div key={ma} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300">{ma}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 rounded">
                  {items.length} màu
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate mb-1.5" title={sample?.tenSP}>
                {sample?.tenSP}
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Tồn: <b className="text-slate-900 dark:text-white font-mono">{sl.toLocaleString()}</b></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{(gt / 1000).toLocaleString()}k</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
