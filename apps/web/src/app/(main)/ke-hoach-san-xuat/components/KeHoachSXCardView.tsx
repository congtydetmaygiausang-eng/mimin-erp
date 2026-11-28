"use client";

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
  CheckCircle2,
  Clock,
  Shirt,
  Sparkles,
  ArrowRight
} from "lucide-react";
import type { KHSX, TrangThaiKHSX } from "@/lib/data/khsx-store";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import { isChuyenNhietOrder } from "@/components/ui/LenhCatTableView";

interface KeHoachSXCardViewProps {
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
    label: "Đã hoàn thành"
  },
  "Trễ hạn": {
    bg: "bg-rose-50 text-rose-800 border-rose-200/90 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60",
    text: "text-rose-800",
    dot: "bg-rose-500 animate-pulse",
    label: "Trễ tiến độ"
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

export function KeHoachSXCardView({
  list,
  dsLenhCat,
  dsSanPham,
  activeEditors,
  onEdit,
  onDelete,
  onViewLenhCat,
  onTaoLenhCat,
  onZoomImg,
}: KeHoachSXCardViewProps) {
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

  if (list.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-12 text-center text-slate-400">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-600" />
        <p className="font-bold text-slate-700 dark:text-slate-200 text-base">Không tìm thấy kế hoạch sản xuất phù hợp</p>
        <p className="text-xs text-slate-400 mt-1">Vui lòng thử điều chỉnh lại từ khóa tìm kiếm hoặc các tiêu chí bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3.5 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
      {list.map((item) => {
        const imageToDisplay = getDisplayImage(item);
        const spCode = getSPCode(item);
        const st = TRANG_THAI_BADGE[item.trangThai] || TRANG_THAI_BADGE["Lên kế hoạch"];
        const isOverdue = item.denNgay && item.denNgay < todayStr && item.trangThai !== "Hoàn thành";
        const hasEditor = item.lenhCatId && activeEditors[item.lenhCatId] && activeEditors[item.lenhCatId].length > 0;

        const matchedLC = dsLenhCat.find(
          (lc: any) =>
            (item.lenhCatId && lc.id === item.lenhCatId) ||
            (spCode && (lc.maSP === spCode || lc.id.endsWith(spCode))) ||
            (item.id && lc.id.includes(item.id.replace("KHSX-2026-", "")))
        );

        const isChuyenNhiet = isChuyenNhietOrder(matchedLC, spCode);

        const activeDsMau = (matchedLC?.dsMau && matchedLC.dsMau.length > 0) ? matchedLC.dsMau : (item.dsMau || []);
        const tongSL = item.soLuong || 0;
        const daXong = item.daHoanThanh || 0;
        const pct = tongSL > 0 ? Math.min(100, Math.round((daXong / tongSL) * 100)) : 0;

        return (
          <article
            key={item.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs hover:shadow-lg hover:border-teal-500/30 dark:hover:border-teal-600/40 transition-all flex flex-col justify-between group/card relative"
          >
            {/* 1. HEADER CARD: Mã KHSX + Mã SP + Badge Trạng Thái */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  {/* Mã KHSX */}
                  <span className="font-mono font-bold text-xs sm:text-sm text-teal-800 dark:text-emerald-400 bg-teal-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-teal-200/70 dark:border-emerald-800/60 shadow-2xs">
                    {item.maKHSX}
                  </span>

                  {/* Mã SP */}
                  {spCode && (
                    <span className="font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/70 dark:border-indigo-800/60">
                      Mã: {spCode}
                    </span>
                  )}
                </div>

                {/* Badge Trạng thái */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full border shrink-0 shadow-2xs ${st.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
              </div>

              {/* 2. THÂN CARD: Ảnh tỷ lệ 3:4 chuẩn Lookbook + Tên SP + Phân Loại + Màu */}
              <div className="flex items-start gap-3.5">
                {/* Thumbnail ảnh sản phẩm */}
                {imageToDisplay ? (
                  <div
                    onClick={() => onZoomImg(imageToDisplay, item.sanPham, isChuyenNhiet ? undefined : spCode)}
                    style={{ width: "80px", height: "106px", minWidth: "80px", maxWidth: "80px" }}
                    className="rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0 overflow-hidden shadow-2xs cursor-pointer hover:border-teal-500 hover:shadow-md transition-all relative group/img"
                    title="Nhấp để xem ảnh lớn"
                  >
                    <img
                      src={imageToDisplay}
                      alt={item.sanPham}
                      className="w-full h-full object-cover object-top group-hover/img:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        if (spCode && !e.currentTarget.src.includes(`/product-models/${spCode}.png`)) {
                          e.currentTarget.src = `/product-models/${spCode}.png`;
                        }
                      }}
                    />

                    {/* ĐÓNG DẤU GHI MÃ SẢN PHẨM Ở DƯỚI ĐÁY TẤM HÌNH (trừ 13 mã in chuyển nhiệt) */}
                    {spCode && !isChuyenNhiet && (
                      <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-[1px] py-1 px-0.5 text-center pointer-events-none z-10 border-t border-amber-400/40">
                        <span className="font-mono font-black text-[10px] text-amber-300 tracking-tight block truncate leading-tight drop-shadow-xs">
                          {spCode}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-2xs z-20">
                      <Maximize2 className="w-4 h-4 drop-shadow" />
                    </div>
                  </div>
                ) : (
                  <div
                    style={{ width: "80px", height: "106px", minWidth: "80px", maxWidth: "80px" }}
                    className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0 flex flex-col items-center justify-center text-slate-400 p-2 text-center"
                  >
                    <Shirt className="w-5 h-5 mb-1 opacity-40 text-teal-600" />
                    <span className="text-[10px] font-bold leading-tight">Chờ ảnh</span>
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Tag Loại SP */}
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700">
                      <Layers className="w-3 h-3 text-teal-600 dark:text-emerald-400" />
                      {LOAI_SP_LABELS[item.loaiSP as any] || item.loai || "Sản phẩm"}
                    </span>
                  </div>

                  {/* Tên sản phẩm */}
                  <h3
                    className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 hover:text-teal-700 dark:hover:text-emerald-400 cursor-pointer transition-colors"
                    onClick={() => onEdit(item)}
                    title={item.sanPham}
                  >
                    {item.sanPham}
                  </h3>

                  {/* Danh sách Màu sắc & Logo gọn gàng */}
                  {(activeDsMau.length > 0 || matchedLC?.hinhMauInTheu) && (
                    <div className="pt-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {activeDsMau.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Màu:</span>
                        )}
                        {activeDsMau.slice(0, 3).map((mau: any, mIdx: number) => (
                          <div
                            key={mIdx}
                            onClick={() => mau.img && onZoomImg(mau.img, `${item.sanPham} - ${mau.ten}`, spCode)}
                            className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700 text-[10px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                            title={`${mau.ten}${mau.slThucTe ? ` - ${mau.slThucTe} SP` : ''} (Bấm xem ảnh màu)`}
                          >
                            {mau.img ? (
                              <div className="w-3.5 h-3.5 rounded overflow-hidden border border-slate-300 dark:border-slate-600 shrink-0">
                                <img src={mau.img} alt={mau.ten} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            )}
                            <span className="max-w-[70px] truncate">{mau.ten}</span>
                          </div>
                        ))}
                        {activeDsMau.length > 3 && (
                          <span className="text-[10px] font-bold text-teal-700 dark:text-emerald-400 bg-teal-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-teal-200/60 dark:border-emerald-800">
                            +{activeDsMau.length - 3}
                          </span>
                        )}

                        {/* Logo In/Thêu nếu có */}
                        {matchedLC?.hinhMauInTheu && (
                          <div
                            onClick={() => onZoomImg(matchedLC.hinhMauInTheu, `Logo In/Thêu - ${item.sanPham}`, spCode || "LOGO")}
                            className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 px-1.5 py-0.5 rounded-md border border-purple-200/80 dark:border-purple-800/80 text-[10px] font-bold text-purple-700 dark:text-purple-300 cursor-pointer transition-colors"
                            title="Logo In/Thêu - Bấm xem to rõ nét"
                          >
                            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span>Logo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. KHỐI THÔNG SỐ: Kế hoạch & Thời gian & Tiến độ */}
              <div className="rounded-xl bg-slate-50/90 dark:bg-slate-800/50 p-3 text-xs border border-slate-200/70 dark:border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      Số Lượng Cắt
                    </span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                      {tongSL.toLocaleString("vi-VN")} <span className="text-[10px] text-slate-400 font-normal">SP</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      Hạn Hoàn Thành
                    </span>
                    <p className={`font-medium text-xs mt-0.5 flex items-center gap-1 ${isOverdue ? "text-rose-600 font-bold" : "text-slate-700 dark:text-slate-300"}`}>
                      <Calendar className={`w-3.5 h-3.5 shrink-0 ${isOverdue ? "text-rose-500" : "text-slate-400"}`} />
                      <span>{formatDateVN(item.denNgay)}</span>
                      {isOverdue && (
                        <span className="text-[9px] bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 px-1 rounded border border-rose-200 font-bold">
                          Trễ
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Thanh tiến độ đơn hàng */}
                <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Tiến độ gia công:</span>
                    <span className="font-mono font-bold text-teal-800 dark:text-emerald-400">
                      {daXong.toLocaleString("vi-VN")}/{tongSL.toLocaleString("vi-VN")} SP ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-teal-500" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Xưởng phụ trách */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-400">Xưởng:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {item.xuongPhuTrach || "Chưa gán xưởng"}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. CHÂN CARD: Hành Động Nổi Bật (Xem/Tạo Lệnh Cắt + Sửa + Xóa) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 mt-3">
              {item.lenhCatId ? (
                <div>
                  <button
                    type="button"
                    onClick={() => onViewLenhCat(item.lenhCatId!)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#133E32] hover:bg-[#1b4b3d] text-white px-4 py-2.5 font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Scissors className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Xem Lệnh Cắt ({item.lenhCatId})</span>
                    <ArrowRight className="w-3 h-3 text-emerald-300/70" />
                  </button>

                  {hasEditor && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 text-center bg-rose-50 dark:bg-rose-950/40 py-1 rounded-md border border-rose-200/70 dark:border-rose-900/40 animate-pulse flex items-center justify-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{activeEditors[item.lenhCatId].join(", ")} đang chỉnh sửa...</span>
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onTaoLenhCat(item)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2.5 font-bold text-xs shadow-md shadow-violet-900/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Tạo Lệnh Cắt Sản Xuất</span>
                </button>
              )}

              {/* Hàng nút phụ Sửa / Xóa */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 text-xs font-bold border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Chỉnh sửa</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="flex items-center justify-center gap-1 px-3 rounded-xl bg-rose-50 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 py-2 text-xs font-bold border border-rose-200/80 dark:border-rose-900/50 transition-colors cursor-pointer"
                  title="Xóa kế hoạch sản xuất"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
