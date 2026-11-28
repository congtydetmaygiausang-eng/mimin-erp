// ============ STATS PANEL ============
// Tối ưu giao diện Header Banner cao cấp chuẩn MIMIN ERP (Đồng bộ chuẩn tông Teal / Cyan như Kho Phụ Liệu)
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
    const num = isNaN(Number(val)) || Number(val) < 0 ? 0 : Number(val);
    if (num >= 1_000_000_000) return { num: (num / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 }), unit: "tỷ đ" };
    if (num >= 1_000_000) return { num: (num / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 }), unit: "tr đ" };
    return { num: num.toLocaleString("vi-VN"), unit: "đ" };
  };
  const gt = formatGiaTri(stats.tongGT);

  return (
    <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-800 rounded-3xl p-5 md:p-6 text-white shadow-lg border border-teal-600/30 relative overflow-hidden mb-5">
      {/* Glow décor background nhẹ nhàng */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />

      {/* Top row: Title + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-teal-600/30 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md border border-white/25 shrink-0">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-900/50 text-teal-200 border border-teal-500/30">
                Kho & Vận Hành
              </span>
              <span className="text-xs text-teal-100/90 font-medium">· Tồn kho may mặc chuẩn hóa</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">
              Kho Thành Phẩm & Tồn Kho May Mặc
            </h1>
            <p className="text-xs text-teal-100/80 mt-0.5 hidden sm:block">
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
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer backdrop-blur-sm"
              title="Đồng bộ tự động từ dữ liệu quy trình sản xuất"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
              <span>Đồng bộ</span>
            </button>
          )}

          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer backdrop-blur-sm"
              title="Xuất file báo cáo kho thành phẩm"
            >
              <Download className="w-3.5 h-3.5 text-teal-200" />
              <span>Xuất CSV</span>
            </button>
          )}

          {onTiLeSize && (
            <button
              type="button"
              onClick={onTiLeSize}
              className="px-3.5 py-2 bg-teal-900/50 hover:bg-teal-900/70 text-teal-200 border border-teal-400/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer backdrop-blur-sm"
              title="Cài đặt bảng tỉ lệ size"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300" />
              <span>Tỉ lệ size</span>
            </button>
          )}

          {onThemSP && (
            <button
              type="button"
              onClick={onThemSP}
              className="px-4 py-2 bg-white hover:bg-teal-50 text-teal-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-lg cursor-pointer"
              title="Tạo mới sản phẩm vào kho"
            >
              <Plus className="w-4 h-4 text-teal-700" />
              <span>Thêm sản phẩm</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: 4 Thẻ KPI Thống Kê Tổng Quan (Chuẩn thẻ mờ kính như Kho Phụ Liệu) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5 relative z-10">
        {/* KPI 1: Tổng tồn kho SP */}
        <div className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-teal-200 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <Package className="w-4 h-4 text-teal-200" /> Tổng tồn kho
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/15 text-white border border-white/20">
              Thành phẩm
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2 tabular-nums">
            {(isNaN(Number(stats.tongSP)) || Number(stats.tongSP) < 0 ? 0 : Number(stats.tongSP)).toLocaleString("vi-VN")}{" "}
            <span className="text-sm font-semibold text-teal-100/90">SP</span>
          </div>
          <div className="text-[11px] text-teal-100/80 mt-1 flex items-center gap-1">
            <span>{stats.conHang} lô đang còn hàng</span>
          </div>
        </div>

        {/* KPI 2: Tổng giá trị tồn */}
        <div className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-teal-200 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-300" /> Tổng giá trị tồn
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              Giá trị kho
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-200 mt-2 tabular-nums">
            {gt.num} <span className="text-sm font-semibold text-emerald-300">{gt.unit}</span>
          </div>
          <div className="text-[11px] text-teal-100/80 mt-1">
            Theo đơn giá xuất nhập kho
          </div>
        </div>

        {/* KPI 3: Số mẫu mã / SP */}
        <div className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-teal-200 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-300" /> Mẫu mã / Biến thể
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
              Biến thể
            </span>
          </div>
          <div className="text-2xl font-black text-cyan-200 mt-2 tabular-nums">
            {stats.soLoai} <span className="text-sm font-semibold text-cyan-300">mã SP</span>
          </div>
          <div className="text-[11px] text-teal-100/80 mt-1">
            {stats.countManPJ ?? 0} ManPJ · {stats.countPolo ?? 0} Polomimin
          </div>
        </div>

        {/* KPI 4: Tình trạng tồn kho */}
        <div className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-teal-200 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-300" /> Cảnh báo tồn kho
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
              Tồn kho
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2 tabular-nums flex items-center gap-1.5">
            <span className="text-emerald-300">{stats.conHang} còn</span>
            <span className="text-white/50">·</span>
            <span className="text-rose-300">{stats.daDat} xuất</span>
          </div>
          <div className="text-[11px] text-teal-100/80 mt-1">
            Kiểm soát số lượng theo size & màu
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
          <FileSpreadsheet className="w-4 h-4 text-teal-600" />
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
          const sl = items.reduce((s, x) => s + (isNaN(Number(x.soLuong)) ? 0 : Number(x.soLuong)), 0);
          const gt = items.reduce((s, x) => {
            let itemGt = Number(x.giaTri);
            if (isNaN(itemGt) || itemGt <= 0) {
              itemGt = (Number(x.soLuong) || 0) * (Number(x.donGia) || Number(x.giaVon) || 0);
            }
            return s + (isNaN(itemGt) ? 0 : itemGt);
          }, 0);
          const sample = items[0];
          return (
            <div key={ma} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-xs text-teal-700 dark:text-teal-300">{ma}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 rounded">
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
