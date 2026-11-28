"use client";

import { useMemo } from "react";
import { 
  Calendar, 
  Building2, 
  Scissors, 
  Edit3, 
  Trash2, 
  Maximize2, 
  AlertCircle, 
  Package,
  Layers,
  Shirt,
  ArrowRight
} from "lucide-react";
import type { KHSX, TrangThaiKHSX } from "@/lib/data/khsx-store";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import { isChuyenNhietOrder } from "@/components/ui/LenhCatTableView";

interface KeHoachSXTableViewProps {
  list: KHSX[];
  dsLenhCat: any[];
  dsSanPham: any[];
  activeEditors: Record<string, string[]>;
  onEdit: (item: KHSX) => void;
  onDelete: (item: KHSX) => void;
  onViewLenhCat: (lenhCatId: string) => void;
  onTaoLenhCat: (item: KHSX) => void;
  onZoomImg: (url: string, alt?: string, badge?: string) => void;
}

const TRANG_THAI_BADGE: Record<TrangThaiKHSX, { bg: string; text: string; dot: string; label: string }> = {
  "Lên kế hoạch": { 
    bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700", 
    text: "text-slate-700", 
    dot: "bg-slate-400",
    label: "Lên kế hoạch"
  },
  "Đang SX": { 
    bg: "bg-amber-50 text-amber-800 border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60", 
    text: "text-amber-800", 
    dot: "bg-amber-500 animate-pulse",
    label: "Đang sản xuất"
  },
  "Hoàn thành": { 
    bg: "bg-emerald-50 text-emerald-800 border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60", 
    text: "text-emerald-800", 
    dot: "bg-emerald-500",
    label: "Hoàn thành"
  },
  "Trễ hạn": { 
    bg: "bg-rose-50 text-rose-800 border-rose-200/90 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60", 
    text: "text-rose-800", 
    dot: "bg-rose-500 animate-pulse",
    label: "Trễ hạn"
  },
};

// Helper format ngày DD/MM/YYYY
function formatDateVN(dateStr?: string): string {
  if (!dateStr) return "---";
  const str = String(dateStr).trim();
  if (str.includes("-")) {
    const parts = str.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return str;
}

export function KeHoachSXTableView({
  list,
  dsLenhCat,
  dsSanPham,
  activeEditors,
  onEdit,
  onDelete,
  onViewLenhCat,
  onTaoLenhCat,
  onZoomImg,
}: KeHoachSXTableViewProps) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Helper lấy mã sản phẩm chuẩn (ưu tiên item.maSP, sau đó dò từ KHSX, Lệnh Cắt hoặc Danh mục SP)
  const getSPCode = (item: KHSX) => {
    if (item.maSP) return item.maSP.trim();
    if (item.maKHSX) {
      const match = item.maKHSX.match(/M\d+/i);
      if (match) return match[0].toUpperCase();
    }
    const matchedLC = dsLenhCat.find(
      (lc: any) =>
        (item.lenhCatId && lc.id === item.lenhCatId) ||
        (item.id && lc.id.includes(item.id.replace("KHSX-2026-", ""))) ||
        (item.sanPham && (lc.tenSP === item.sanPham || lc.id === item.sanPham))
    );
    if (matchedLC?.maSP) return matchedLC.maSP.trim();
    const sp = dsSanPham.find(
      (s: any) =>
        (item.sanPham && (s.tenSP === item.sanPham || s.ten_sp === item.sanPham)) ||
        (item.tenSP && s.tenSP === item.tenSP)
    );
    if (sp?.maSP || sp?.ma_sp) return (sp.maSP || sp.ma_sp).trim();
    return "";
  };

  // Helper lấy ảnh đại diện tối ưu
  const getDisplayImage = (item: KHSX) => {
    const spCode = getSPCode(item);
    const matchedLC = dsLenhCat.find(
      (lc: any) =>
        (item.lenhCatId && lc.id === item.lenhCatId) ||
        (spCode && (lc.maSP === spCode || lc.id.endsWith(spCode))) ||
        (item.id && lc.id.includes(item.id.replace("KHSX-2026-", ""))) ||
        (item.sanPham && (lc.tenSP === item.sanPham || lc.id === item.sanPham))
    );

    if (matchedLC?.dsMau && matchedLC.dsMau.length > 0) {
      const realImg = matchedLC.dsMau.find((m: any) => m.img && !m.img.includes("Phieu_Giao_Nhan"));
      if (realImg?.img) return realImg.img;
      if (matchedLC.dsMau[0]?.img) return matchedLC.dsMau[0].img;
    }
    if (matchedLC?.hinhMauInTheu) return matchedLC.hinhMauInTheu;

    if (item.dsMau && item.dsMau.length > 0) {
      const realImg = item.dsMau.find((m: any) => m.img && !m.img.includes("Phieu_Giao_Nhan"));
      if (realImg?.img) return realImg.img;
      if (item.dsMau[0]?.img) return item.dsMau[0].img;
    }

    if (spCode) {
      return `/product-models/${spCode}.png`;
    }

    const sp = dsSanPham.find(
      (s: any) => (item.maSP && (s.id === item.maSP || s.ma_sp === item.maSP)) || ((item.tenSP || item.sanPham) && s.tenSP === (item.tenSP || item.sanPham))
    );
    if (sp?.dsMau && sp.dsMau.length > 0 && sp.dsMau[0]?.img) {
      return sp.dsMau[0].img;
    }

    return null;
  };

  // Tổng hợp số liệu thống kê
  const summary = useMemo(() => {
    let tongSL = 0;
    let tongXong = 0;
    list.forEach((item) => {
      tongSL += item.soLuong || 0;
      tongXong += item.daHoanThanh || 0;
    });
    const tienDo = tongSL > 0 ? Math.round((tongXong / tongSL) * 100) : 0;
    return { tongSL, tongXong, tienDo };
  }, [list]);

  if (list.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-12 text-center text-slate-400">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-600" />
        <p className="font-bold text-slate-700 dark:text-slate-200 text-base">Không tìm thấy kế hoạch sản xuất phù hợp</p>
        <p className="text-xs text-slate-400 mt-1">Vui lòng thử điều chỉnh lại từ khóa hoặc bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden w-full max-w-full">
      {/* ===== GIAO DIỆN COMPACT CHO MOBILE (< md) ===== */}
      <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {list.map((item, index) => {
          const imgUrl = getDisplayImage(item);
          const spCode = getSPCode(item);
          const matchedLC = dsLenhCat.find(
            (lc) =>
              (item.lenhCatId && lc.id === item.lenhCatId) ||
              (spCode && (lc.maSP === spCode || lc.id.endsWith(spCode))) ||
              (item.maKHSX && lc.tenSP && lc.tenSP.includes(item.maKHSX))
          );
          const isChuyenNhiet = isChuyenNhietOrder(matchedLC, spCode);
          const st = TRANG_THAI_BADGE[item.trangThai] || TRANG_THAI_BADGE["Lên kế hoạch"];
          const isOverdue = item.denNgay && item.denNgay < todayStr && item.trangThai !== "Hoàn thành";
          const hasEditor = item.lenhCatId && activeEditors[item.lenhCatId] && activeEditors[item.lenhCatId].length > 0;
          const tongSL = item.soLuong || 0;
          const daXong = item.daHoanThanh || 0;
          const pct = tongSL > 0 ? Math.min(100, Math.round((daXong / tongSL) * 100)) : 0;

          return (
            <div key={item.id} className="p-3.5 space-y-2.5 bg-white dark:bg-slate-900">
              {/* Row 1: STT, Mã KHSX, Mã SP, Trạng thái */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                  <span className="font-mono font-bold text-teal-800 dark:text-emerald-400 bg-teal-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-xs border border-teal-200/70 dark:border-emerald-800/60">
                    {item.maKHSX}
                  </span>
                  {spCode && (
                    <span className="font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200/70 dark:border-indigo-800/60">
                      {spCode}
                    </span>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full shrink-0 border ${st.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
              </div>

              {/* Row 2: Ảnh + Tên sản phẩm + Thời gian + Xưởng */}
              <div className="flex items-start gap-3">
                <div
                  onClick={() => imgUrl && onZoomImg(imgUrl, item.sanPham, isChuyenNhiet ? undefined : spCode)}
                  style={{ width: "52px", height: "68px", minWidth: "52px", maxWidth: "52px" }}
                  className="rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 cursor-zoom-in shadow-2xs relative group"
                  title="Nhấp để xem ảnh to"
                >
                  {imgUrl ? (
                    <>
                      <img
                        src={imgUrl}
                        alt={item.sanPham}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          if (spCode && !e.currentTarget.src.includes(`/product-models/${spCode}.png`)) {
                            e.currentTarget.src = `/product-models/${spCode}.png`;
                          }
                        }}
                      />

                      {/* ĐÓNG DẤU GHI MÃ SẢN PHẨM Ở DƯỚI ĐÁY TẤM HÌNH NHƯ LỆNH CẮT (trừ 13 mã in chuyển nhiệt) */}
                      {spCode && !isChuyenNhiet && (
                        <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-[1px] py-0.5 px-0.5 text-center pointer-events-none z-10 border-t border-amber-400/40">
                          <span className="font-mono font-black text-[9px] text-amber-300 tracking-tight block truncate leading-tight drop-shadow-xs">
                            {spCode}
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white z-20">
                        <Maximize2 className="w-3.5 h-3.5 drop-shadow" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <Shirt className="w-4 h-4 opacity-40 text-teal-600" />
                      <span className="text-[8px] font-bold mt-0.5">Chờ ảnh</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-1" title={item.sanPham}>
                    {item.sanPham}
                  </div>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-2 flex-wrap">
                    <span className={`flex items-center gap-1 ${isOverdue ? "text-rose-600 font-bold" : "text-slate-600 dark:text-slate-400"}`}>
                      <Calendar className={`w-3.5 h-3.5 ${isOverdue ? "text-rose-500" : "text-slate-400"} shrink-0`} />
                      {formatDateVN(item.tuNgay)} → {formatDateVN(item.denNgay)}
                      {isOverdue && <span className="text-[9px] bg-rose-50 text-rose-600 px-1 rounded border border-rose-200 font-bold">Trễ</span>}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Xưởng: <b className="text-slate-700 dark:text-slate-300">{item.xuongPhuTrach || "---"}</b></span>
                  </div>
                </div>
              </div>

              {/* Row 3: Tiến độ & Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs">
                  <span className="text-slate-400">SL: </span>
                  <b className="text-slate-900 dark:text-white font-mono text-sm">{tongSL.toLocaleString("vi-VN")} SP</b>
                  <span className="text-slate-400 ml-1">({pct}%)</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.lenhCatId ? (
                    <button
                      type="button"
                      onClick={() => onViewLenhCat(item.lenhCatId!)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#133E32] hover:bg-[#1b4b3d] text-white font-bold text-xs shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <Scissors className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{item.lenhCatId}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onTaoLenhCat(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Tạo LC</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== GIAO DIỆN BẢNG CHUẨN ERP CHO DESKTOP (>= md) ===== */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th className="py-3 px-3 text-center w-10">#</th>
              <th className="py-3 px-2 text-center w-14">Ảnh</th>
              <th className="py-3 px-3 w-32">Mã KHSX</th>
              <th className="py-3 px-2.5 text-center w-24">Mã SP</th>
              <th className="py-3 px-3 min-w-[200px]">Sản Phẩm & Phân Loại</th>
              <th className="py-3 px-3 text-right w-28">Kế Hoạch</th>
              <th className="py-3 px-3 text-right w-36">Đã Xong / Tiến Độ</th>
              <th className="py-3 px-3 w-40">Thời Gian</th>
              <th className="py-3 px-3 w-36">Xưởng Phụ Trách</th>
              <th className="py-3 px-3 text-center w-36">Lệnh Cắt</th>
              <th className="py-3 px-3 text-center w-28">Trạng Thái</th>
              <th className="py-3 px-3 text-right w-24">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
            {list.map((item, index) => {
              const imgUrl = getDisplayImage(item);
              const spCode = getSPCode(item);
              const matchedLC = dsLenhCat.find(
                (lc) =>
                  (item.lenhCatId && lc.id === item.lenhCatId) ||
                  (spCode && (lc.maSP === spCode || lc.id.endsWith(spCode))) ||
                  (item.maKHSX && lc.tenSP && lc.tenSP.includes(item.maKHSX))
              );
              const isChuyenNhiet = isChuyenNhietOrder(matchedLC, spCode);
              const st = TRANG_THAI_BADGE[item.trangThai] || TRANG_THAI_BADGE["Lên kế hoạch"];
              const isOverdue = item.denNgay && item.denNgay < todayStr && item.trangThai !== "Hoàn thành";
              const hasEditor = item.lenhCatId && activeEditors[item.lenhCatId] && activeEditors[item.lenhCatId].length > 0;
              const tongSL = item.soLuong || 0;
              const daXong = item.daHoanThanh || 0;
              const pct = tongSL > 0 ? Math.min(100, Math.round((daXong / tongSL) * 100)) : 0;

              return (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                  {/* 1. STT */}
                  <td className="py-3 px-3 text-center text-slate-400 font-bold">
                    {index + 1}
                  </td>

                  {/* 2. Ảnh Thumbnail chữ nhật đứng (44px x 58px) */}
                  <td className="py-2 px-2 text-center">
                    <div
                      onClick={() => imgUrl && onZoomImg(imgUrl, item.sanPham, isChuyenNhiet ? undefined : spCode)}
                      style={{ width: "44px", height: "58px" }}
                      className="mx-auto rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 overflow-hidden cursor-zoom-in shadow-2xs relative group/img shrink-0"
                      title="Nhấp để xem ảnh to"
                    >
                      {imgUrl ? (
                        <>
                          <img
                            src={imgUrl}
                            alt={item.sanPham}
                            className="w-full h-full object-cover object-top group-hover/img:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              if (spCode && !e.currentTarget.src.includes(`/product-models/${spCode}.png`)) {
                                e.currentTarget.src = `/product-models/${spCode}.png`;
                              } else {
                                e.currentTarget.style.display = 'none';
                              }
                            }}
                          />

                          {/* ĐÓNG DẤU GHI MÃ SẢN PHẨM Ở DƯỚI ĐÁY TẤM HÌNH NHƯ LỆNH CẮT (trừ 13 mã in chuyển nhiệt) */}
                          {spCode && !isChuyenNhiet && (
                            <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-[1px] py-0.5 px-0.5 text-center pointer-events-none z-10 border-t border-amber-400/40">
                              <span className="font-mono font-black text-[9px] text-amber-300 tracking-tight block truncate leading-tight drop-shadow-xs">
                                {spCode}
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white z-20">
                            <Maximize2 className="w-3.5 h-3.5 drop-shadow" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <Shirt className="w-4 h-4 opacity-40 text-teal-600" />
                          <span className="text-[8px] font-bold mt-0.5">Chờ</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 3. Mã KHSX */}
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-xs text-teal-800 dark:text-emerald-400 bg-teal-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-teal-200/80 dark:border-emerald-800/60 shadow-2xs inline-block">
                      {item.maKHSX}
                    </span>
                  </td>

                  {/* 4. Mã Sản Phẩm */}
                  <td className="py-3 px-2.5 text-center">
                    {spCode ? (
                      <span className="font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs inline-block">
                        {spCode}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono text-xs">---</span>
                    )}
                  </td>

                  {/* 5. Tên Sản Phẩm & Phân Loại */}
                  <td className="py-3 px-3">
                    <div className="min-w-0 pr-1 space-y-0.5">
                      <div 
                        className="font-bold text-slate-900 dark:text-white text-sm hover:text-teal-700 dark:hover:text-emerald-400 transition-colors leading-snug cursor-pointer line-clamp-1" 
                        onClick={() => onEdit(item)} 
                        title={item.sanPham}
                      >
                        {item.sanPham}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-1.5 py-0.2 rounded border border-slate-200/70 dark:border-slate-700 font-semibold inline-flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5 text-teal-600" />
                          {LOAI_SP_LABELS[item.loaiSP as any] || item.loai || "Sản phẩm"}
                        </span>
                        {item.ghiChu && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[160px]" title={item.ghiChu}>
                            • {item.ghiChu}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 6. Kế Hoạch (Số lượng) */}
                  <td className="py-3 px-3 text-right">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {tongSL.toLocaleString("vi-VN")}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">SP</span>
                  </td>

                  {/* 7. Đã Xong & Tiến Độ (Kèm Progress bar) */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800/60">
                        {daXong.toLocaleString("vi-VN")} SP ({pct}%)
                      </span>
                      <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-teal-500" : "bg-transparent"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* 8. Thời Gian Thực Hiện */}
                  <td className="py-3 px-3">
                    <div className={`font-medium text-xs flex items-center gap-1.5 ${isOverdue ? "text-rose-600 font-bold" : "text-slate-700 dark:text-slate-300"}`}>
                      <Calendar className={`w-3.5 h-3.5 ${isOverdue ? "text-rose-500" : "text-slate-400"} shrink-0`} />
                      <span>{formatDateVN(item.tuNgay)} → {formatDateVN(item.denNgay)}</span>
                    </div>
                    {isOverdue && (
                      <span className="inline-block mt-0.5 text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-200">
                        Quá hạn
                      </span>
                    )}
                  </td>

                  {/* 9. Xưởng Phụ Trách */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium truncate" title={item.xuongPhuTrach}>
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.xuongPhuTrach || "---"}</span>
                    </div>
                  </td>

                  {/* 10. Lệnh Cắt Liên Kết */}
                  <td className="py-3 px-3 text-center">
                    {item.lenhCatId ? (
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewLenhCat(item.lenhCatId!)}
                          className="px-2.5 py-1 rounded-lg bg-[#133E32] hover:bg-[#1b4b3d] text-white font-mono font-bold text-xs shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                          title="Xem chi tiết Lệnh Cắt"
                        >
                          <Scissors className="w-3 h-3 text-emerald-300" />
                          <span>{item.lenhCatId}</span>
                        </button>
                        {hasEditor && (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 animate-pulse">
                            Đang sửa
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onTaoLenhCat(item)}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-2xs transition-all flex items-center gap-1 mx-auto active:scale-95 cursor-pointer"
                        title="Tạo Lệnh Cắt từ kế hoạch này"
                      >
                        <Scissors className="w-3 h-3" />
                        <span>Tạo LC</span>
                      </button>
                    )}
                  </td>

                  {/* 11. Trạng Thái */}
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-bold border shadow-2xs ${st.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </td>

                  {/* 12. Thao Tác (Sửa / Xóa) */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Chỉnh sửa kế hoạch"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                        title="Xóa kế hoạch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* DÒNG TỔNG KẾT (SUMMARY FOOTER) */}
          <tfoot>
            <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
              <td colSpan={5} className="py-3.5 px-3 text-right text-slate-500 uppercase tracking-wider text-[11px]">
                Tổng cộng ({list.length} kế hoạch):
              </td>
              <td className="py-3.5 px-3 text-right font-mono text-sm text-teal-800 dark:text-emerald-400">
                {summary.tongSL.toLocaleString("vi-VN")} SP
              </td>
              <td className="py-3.5 px-3 text-right font-mono text-sm text-emerald-800 dark:text-emerald-400">
                {summary.tongXong.toLocaleString("vi-VN")} SP
              </td>
              <td colSpan={5} className="py-3.5 px-3 text-left text-slate-500 font-medium">
                Tiến độ chung: <b className="text-teal-700 dark:text-emerald-400 font-mono">{summary.tienDo}%</b>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
