// ============ HEADER + 4 KPIs + TABS CHO KHO PHỤ LIỆU ============
// Tối ưu giao diện Header Banner cao cấp chuẩn MIMIN ERP (Tông màu Teal chuẩn nhận diện)
"use client";

import {
  Boxes, Plus, Minus, History, Box, DollarSign,
  TrendingUp, AlertTriangle, Download, Package, RefreshCw
} from "lucide-react";
import { formatVND } from "@/lib/data/real-data";
import type { Tab } from "../data";

interface HeaderProps {
  inventoryCount: number;
  tongGiaTri: number;
  dsCanhBao: any[];
  dsCanhBaoDetails: string;
  tongNhap: number;
  onAdd: () => void;
  onExportCSV?: () => void;
  onSyncBo?: () => void;
  isSyncingBo?: boolean;
  tab: Tab;
  setTab: (v: Tab) => void;
}

export function Header({
  inventoryCount,
  tongGiaTri,
  dsCanhBao,
  dsCanhBaoDetails,
  tongNhap,
  onAdd,
  onExportCSV,
  onSyncBo,
  isSyncingBo,
  tab,
  setTab,
}: HeaderProps) {
  const formatGiaTri = (val: number) => {
    if (val >= 1_000_000_000) return { num: (val / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 }), unit: "tỷ đ" };
    if (val >= 1_000_000) return { num: (val / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 }), unit: "tr đ" };
    return { num: val.toLocaleString("vi-VN"), unit: "đ" };
  };

  const gt = formatGiaTri(tongGiaTri);
  const tn = formatGiaTri(tongNhap);

  return (
    <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-800 rounded-3xl p-5 md:p-6 text-white shadow-lg border border-teal-600/30 relative overflow-hidden mb-5">
      {/* Glow décor background nhẹ nhàng */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />

      {/* Top row: Title + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-teal-600/30 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md border border-white/25 shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-900/50 text-teal-200 border border-teal-500/30">
                Kho & Giao Hàng
              </span>
              <span className="text-xs text-teal-100/90 font-medium">· Nguyên phụ liệu may mặc</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">
              Kho Phụ Liệu May Mặc
            </h1>
            <p className="text-xs text-teal-100/80 mt-0.5 hidden sm:block">
              Quản lý định mức & tồn kho Bo cổ, Nút cúc, Chỉ may, Dây kéo, Nhãn mác, Bao bì đóng gói
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onSyncBo && (
            <button
              type="button"
              onClick={onSyncBo}
              disabled={isSyncingBo}
              className="px-3.5 py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white border border-emerald-400/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer backdrop-blur-sm disabled:opacity-50"
              title="Đồng bộ 28 màu bo cổ và 28 màu nút chuẩn theo 28 màu vải thành phẩm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-100 ${isSyncingBo ? "animate-spin" : ""}`} />
              <span>{isSyncingBo ? "Đang đồng bộ..." : "Đồng bộ Bo & Nút từ Vải TP"}</span>
            </button>
          )}

          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer backdrop-blur-sm"
              title="Xuất file CSV phụ liệu"
            >
              <Download className="w-3.5 h-3.5 text-teal-200" />
              <span>Xuất CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={onAdd}
            className="px-4 py-2 bg-white hover:bg-teal-50 text-teal-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-700" />
            <span>Thêm phụ liệu</span>
          </button>
        </div>
      </div>

      {/* 4 Thẻ KPI động */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5 relative z-10">
        {/* KPI 1: Tổng tồn kho */}
        <div className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-teal-200 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <Package className="w-4 h-4 text-teal-200" /> Tổng mã phụ liệu
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/15 text-white border border-white/20">
              Đang quản lý
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2 tabular-nums">
            {inventoryCount} <span className="text-sm font-semibold text-teal-100/90">mã VT</span>
          </div>
          <div className="text-[11px] text-teal-100/80 mt-1 flex items-center gap-1">
            <span>Sẵn sàng cấp cho xưởng sản xuất</span>
          </div>
        </div>

        {/* KPI 2: Tổng giá trị tồn */}
        <div className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-teal-200 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-300" /> Tổng giá trị tồn
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              Giá trị kho
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-200 mt-2 tabular-nums">
            {gt.num} <span className="text-sm font-semibold text-emerald-300">{gt.unit}</span>
          </div>
          <div className="text-[11px] text-teal-100/80 mt-1">
            {formatVND(tongGiaTri)}
          </div>
        </div>

        {/* KPI 3: Tổng nhập luỹ kế */}
        <div className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-teal-200 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-300" /> Tổng nhập từ NCC
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
              Luỹ kế
            </span>
          </div>
          <div className="text-2xl font-black text-cyan-200 mt-2 tabular-nums">
            {tn.num} <span className="text-sm font-semibold text-cyan-300">{tn.unit}</span>
          </div>
          <div className="text-[11px] text-teal-100/80 mt-1">
            {formatVND(tongNhap)}
          </div>
        </div>

        {/* KPI 4: Cảnh báo tồn kho */}
        <div className={`p-4 rounded-2xl border backdrop-blur-md transition-all shadow-sm ${
          dsCanhBao.length > 0 
            ? "bg-rose-500/25 border-rose-400/40 text-rose-100" 
            : "bg-white/10 hover:bg-white/15 border-white/15 text-white"
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className={`w-4 h-4 ${dsCanhBao.length > 0 ? "text-rose-300" : "text-teal-200"}`} /> 
              Cảnh báo tồn kho
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              dsCanhBao.length > 0 
                ? "bg-rose-500/30 text-rose-200 border border-rose-400/40" 
                : "bg-white/15 text-white border border-white/20"
            }`}>
              {dsCanhBao.length > 0 ? "Cần nhập gấp" : "An toàn"}
            </span>
          </div>
          <div className={`text-2xl font-black mt-2 tabular-nums ${dsCanhBao.length > 0 ? "text-rose-200" : "text-white"}`}>
            {dsCanhBao.length} <span className="text-sm font-semibold opacity-80">mã</span>
          </div>
          <div className="text-[11px] text-teal-100/80 mt-1 truncate" title={dsCanhBaoDetails}>
            {dsCanhBao.length > 0 ? dsCanhBaoDetails : "Tất cả phụ liệu đều trên mức tối thiểu"}
          </div>
        </div>
      </div>

      {/* Dải thông báo cảnh báo tồn kho nếu có */}
      {dsCanhBao.length > 0 && (
        <div className="mt-4 p-3 rounded-xl flex items-start gap-3 bg-rose-500/25 border border-rose-400/40 text-rose-100 backdrop-blur-sm text-xs relative z-10">
          <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <b className="text-white">Cảnh báo tồn kho thấp ({dsCanhBao.length} mã):</b>{" "}
            <span className="text-rose-100/90">{dsCanhBaoDetails}</span>
          </div>
        </div>
      )}

      {/* Tabs thanh điều hướng */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 bg-black/20 p-1.5 rounded-2xl w-full sm:w-fit mt-5 border border-white/20 relative z-10 backdrop-blur-sm">
        {([
          { id: "tongquan" as Tab, label: `Tổng quan danh mục (${inventoryCount})`, icon: <Boxes className="w-4 h-4 shrink-0" /> },
          { id: "nhap" as Tab, label: `Lịch sử Nhập kho`, icon: <Plus className="w-4 h-4 shrink-0" /> },
          { id: "xuat" as Tab, label: `Lịch sử Xuất kho`, icon: <Minus className="w-4 h-4 shrink-0" /> },
          { id: "lichsu" as Tab, label: "Toàn bộ Giao dịch", icon: <History className="w-4 h-4 shrink-0" /> },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 whitespace-nowrap px-3.5 py-2 text-xs rounded-xl flex items-center gap-1.5 transition-all font-bold cursor-pointer ${
              tab === t.id
                ? "bg-white text-teal-800 shadow-md"
                : "text-white/80 hover:text-white hover:bg-white/15"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
