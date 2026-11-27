// ============ INVENTORY GRID VIEW (DẠNG THẺ) ============
// Tối ưu nâng cấp Lưới Thẻ Phụ Liệu Chuẩn MIMIN ERP
"use client";

import React, { useState } from "react";
import {
  Boxes, Plus, Minus, Edit2, History, Camera,
  Image as ImageIcon, AlertTriangle, CheckCircle2, Eye, Package
} from "lucide-react";
import { formatVND, type KhoVai } from "@/lib/data/real-data";
import ImageLightbox from "@/components/ui/ImageLightbox";
import { parsePhuLieuGhiChuAndImage } from "./InventoryTable";

interface InventoryGridProps {
  filteredVT: KhoVai[];
  dsTrangThai: {
    maVT: string;
    tonKho: number;
    tonToiThieu: number;
    canhBao: boolean;
    giaTriTon: number;
  }[];
  inventoryImages: Record<string, string>;
  editingVT: string | null;
  editForm: Partial<KhoVai>;
  setEditingVT: (v: string | null) => void;
  setEditForm: (v: Partial<KhoVai>) => void;
  onSaveEdit: (v: KhoVai) => void;
  onUploadImage: (maVT: string) => void;
  onShowNhap: (maVT: string) => void;
  onShowXuat: (maVT: string) => void;
  onShowHistory?: (maVT: string) => void;
}

export function InventoryGrid({
  filteredVT,
  dsTrangThai,
  inventoryImages,
  editingVT,
  editForm,
  setEditingVT,
  setEditForm,
  onSaveEdit,
  onUploadImage,
  onShowNhap,
  onShowXuat,
  onShowHistory,
}: InventoryGridProps) {
  const [zoomImg, setZoomImg] = useState<{ src: string; alt?: string } | null>(null);

  const getLoaiBadgeColor = (loai: string) => {
    const l = (loai || "").toLowerCase();
    if (l.includes("bo")) return "bg-teal-50 text-teal-700 border-teal-200";
    if (l.includes("nút") || l.includes("cúc")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (l.includes("kéo")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (l.includes("chỉ")) return "bg-sky-50 text-sky-700 border-sky-200";
    if (l.includes("thun")) return "bg-violet-50 text-violet-700 border-violet-200";
    if (l.includes("nhãn") || l.includes("tem")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (l.includes("bao") || l.includes("túi")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  if (filteredVT.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-12 text-center text-slate-400">
        <Boxes className="w-12 h-12 mx-auto mb-2 opacity-40 text-slate-400" />
        <div className="text-sm font-bold text-slate-600">Không tìm thấy phụ liệu nào phù hợp</div>
        <div className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm</div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredVT.map((v) => {
          const tt = dsTrangThai.find((t) => t.maVT === v.maVT);
          if (!tt) return null;

          const { note: cleanNote, imageUrl } = parsePhuLieuGhiChuAndImage(
            v.ghiChu,
            v.hinhAnh,
            v.maVT,
            inventoryImages
          );

          const editing = editingVT === v.maVT;
          const isHetHang = tt.tonKho <= 0;
          const isCanhBao = tt.canhBao;

          return (
            <div
              key={v.maVT}
              className={`bg-white rounded-2xl border transition-all relative overflow-hidden group flex flex-col justify-between shadow-sm hover:shadow-md ${
                isCanhBao
                  ? "border-rose-300 hover:border-rose-400"
                  : isHetHang
                  ? "border-slate-300 hover:border-slate-400"
                  : "border-slate-200/90 hover:border-teal-400"
              }`}
            >
              {/* Thẻ Header: Mã VT & Trạng thái */}
              <div className="p-3.5 pb-2 border-b border-slate-100 flex items-center justify-between gap-2">
                <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs">
                  {v.maVT}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getLoaiBadgeColor(v.loai)}`}>
                    {v.loai || "Khác"}
                  </span>
                  {isCanhBao ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Tồn thấp
                    </span>
                  ) : isHetHang ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      Hết hàng
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      OK
                    </span>
                  )}
                </div>
              </div>

              {/* Phần Thân thẻ: Ảnh + Tên + Quy cách */}
              <div className="p-3.5 space-y-3 flex-1 flex flex-col">
                {/* Khối Ảnh Phụ Liệu Lớn */}
                <div className="relative w-full aspect-4/3 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center group/img">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={v.tenVT}
                      className="w-full h-full object-cover cursor-zoom-in group-hover/img:scale-105 transition-transform duration-300"
                      onClick={() => setZoomImg({ src: imageUrl, alt: v.tenVT })}
                    />
                  ) : (
                    <div
                      onClick={() => onUploadImage(v.maVT)}
                      className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-teal-50/50 transition-colors"
                    >
                      <Boxes className="w-10 h-10 text-slate-300 group-hover/img:text-teal-500 transition-colors" />
                      <span className="text-[11px] font-semibold text-slate-400 mt-1 group-hover/img:text-teal-600">
                        + Tải ảnh lên
                      </span>
                    </div>
                  )}

                  {/* Icon zoom xem to */}
                  {imageUrl && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setZoomImg({ src: imageUrl, alt: v.tenVT })}
                        className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white shadow-sm"
                        title="Phóng to ảnh"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUploadImage(v.maVT)}
                        className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white shadow-sm"
                        title="Đổi ảnh mới"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Tên phụ liệu */}
                <div className="flex-1">
                  {editing ? (
                    <input
                      type="text"
                      className="w-full p-1.5 bg-white border border-teal-500 rounded-lg text-xs font-bold text-slate-800 shadow-xs"
                      value={editForm.tenVT ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, tenVT: e.target.value })}
                      placeholder="Tên phụ liệu..."
                    />
                  ) : (
                    <h3
                      className="font-extrabold text-slate-800 text-xs md:text-sm line-clamp-2 leading-tight"
                      title={v.tenVT}
                    >
                      {v.tenVT}
                    </h3>
                  )}

                  {v.mauSac && (
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                      <span className="truncate">{v.mauSac}</span>
                    </div>
                  )}

                  {cleanNote && (
                    <div className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">
                      {cleanNote}
                    </div>
                  )}
                </div>

                {/* Khối Chỉ Số Tồn Kho & Giá Trị */}
                <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-100 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] font-semibold text-slate-500">Tồn kho:</span>
                    {editing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          className="w-16 p-1 text-right bg-white border border-teal-500 rounded text-xs font-bold"
                          value={editForm.tonKho ?? 0}
                          onChange={(e) => setEditForm({ ...editForm, tonKho: Number(e.target.value) })}
                        />
                        <span className="text-[10px] text-slate-500">{v.dvt}</span>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span
                          className={`text-base font-black tabular-nums ${
                            isHetHang
                              ? "text-slate-400"
                              : isCanhBao
                              ? "text-rose-600"
                              : "text-emerald-700"
                          }`}
                        >
                          {tt.tonKho.toLocaleString("vi-VN")}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 ml-1">
                          {v.dvt}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                    <span>Đơn giá:</span>
                    {editing ? (
                      <input
                        type="number"
                        min={0}
                        className="w-20 p-1 text-right bg-white border border-teal-500 rounded text-xs font-bold"
                        value={editForm.donGia ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, donGia: Number(e.target.value) })}
                      />
                    ) : (
                      <span className="font-bold text-slate-700">
                        {v.donGia > 0 ? `${v.donGia.toLocaleString("vi-VN")} đ` : "0 đ"}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Giá trị tồn:</span>
                    <span className="font-extrabold text-emerald-700 tabular-nums">
                      {formatVND(tt.giaTriTon)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thanh Thao Tác Chân Thẻ */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1.5">
                {editing ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => onSaveEdit(v)}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer text-center"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingVT(null)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVT(v.maVT);
                        setEditForm({
                          tenVT: v.tenVT,
                          donGia: v.donGia,
                          tonKho: tt.tonKho,
                          tonToiThieu: tt.tonToiThieu,
                        });
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition"
                      title="Sửa thông tin phụ liệu"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {onShowHistory && (
                      <button
                        type="button"
                        onClick={() => onShowHistory(v.maVT)}
                        className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                        title="Xem lịch sử xuất/nhập"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => onShowXuat(v.maVT)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Xuất kho phụ liệu"
                      >
                        <Minus className="w-3 h-3 text-amber-600" />
                        <span>Xuất</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onShowNhap(v.maVT)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                        title="Nhập kho phụ liệu từ NCC"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Nhập</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox xem ảnh lớn */}
      {zoomImg && (
        <ImageLightbox
          src={zoomImg.src}
          alt={zoomImg.alt}
          onClose={() => setZoomImg(null)}
        />
      )}
    </>
  );
}
