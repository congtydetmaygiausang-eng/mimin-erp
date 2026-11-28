// ============ INVENTORY TABLE VIEW (DẠNG DANH SÁCH GỌN GÀNG - KHÔNG CUỘN NGANG) ============
// Tối ưu chuẩn ERP: Tinh gọn 6 cột thông minh, vừa vặn 100% màn hình, không cần kéo chuột
"use client";

import React, { useState } from "react";
import {
  Boxes, Minus, Plus, Edit2, History, Camera,
  AlertTriangle, CheckCircle2, Eye
} from "lucide-react";
import { formatVND, type KhoVai } from "@/lib/data/real-data";
import ImageLightbox from "@/components/ui/ImageLightbox";
import { getFabricSwatchImage } from "@/lib/fabric-swatches";

export function parsePhuLieuGhiChuAndImage(
  ghiChu: string | null | undefined,
  hinhAnh: string | null | undefined,
  maVT: string,
  inventoryImages: Record<string, string>,
  mauSac?: string,
  tenVT?: string
): { note: string; imageUrl: string } {
  let note = "";
  let imageUrl = hinhAnh || inventoryImages[maVT] || "";

  if (ghiChu) {
    const trimmed = ghiChu.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed) {
          if (typeof parsed.note === "string") note = parsed.note;
          if (!imageUrl && typeof parsed.imageUrl === "string") {
            imageUrl = parsed.imageUrl;
          }
        }
      } catch {
        const matchNote = trimmed.match(/"note"\s*:\s*"([^"]*)"/);
        if (matchNote) note = matchNote[1];
        const matchImg = trimmed.match(/"imageUrl"\s*:\s*"([^"]+)"/);
        if (!imageUrl && matchImg) imageUrl = matchImg[1];
      }
    } else {
      const matchTag = trimmed.match(/\[IMG:(https?:\/\/[^\]]+)\]/);
      if (matchTag) {
        if (!imageUrl) imageUrl = matchTag[1];
        note = trimmed.replace(matchTag[0], "").trim();
      } else {
        note = trimmed;
      }
    }
  }

  // Loại bỏ hoàn toàn nếu vô tình còn dính chuỗi JSON
  if (note.includes('{"note"') || note.includes('"imageUrl"')) {
    note = "";
  }

  if (!imageUrl) {
    imageUrl = getFabricSwatchImage(mauSac || tenVT, maVT);
  }

  return { note: note.trim(), imageUrl };
}

interface InventoryTableProps {
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
  setEditingVT: (value: string | null) => void;
  setEditForm: (value: Partial<KhoVai>) => void;
  onSaveEdit: (value: KhoVai) => void;
  onUploadImage: (maVT: string) => void;
  onShowNhap: (maVT: string) => void;
  onShowXuat: (maVT: string) => void;
  onShowHistory?: (maVT: string) => void;
}

export function InventoryTable({
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
}: InventoryTableProps) {
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

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
        {/* Bảng tinh gọn 6 cột, tự động vừa khít 100% chiều rộng màn hình, không cần cuộn ngang */}
        <div className="w-full">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-3 text-center w-24 whitespace-nowrap">Mã VT</th>
                <th className="py-3 px-3.5">Phụ Liệu & Quy Cách</th>
                <th className="py-3 px-3 text-right w-36 whitespace-nowrap">Tồn Kho</th>
                <th className="py-3 px-3 text-right w-36 whitespace-nowrap">Giá Trị Tồn</th>
                <th className="py-3 px-2.5 text-center w-28 whitespace-nowrap">Trạng Thái</th>
                <th className="py-3 px-3 text-center w-40 whitespace-nowrap">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVT.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <div className="text-sm font-semibold text-slate-600">Không tìm thấy phụ liệu nào</div>
                    <div className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm</div>
                  </td>
                </tr>
              ) : (
                filteredVT.map((item, idx) => {
                  const status = dsTrangThai.find((v) => v.maVT === item.maVT);
                  if (!status) return null;

                  const { note: cleanNote, imageUrl } = parsePhuLieuGhiChuAndImage(
                    item.ghiChu,
                    item.hinhAnh,
                    item.maVT,
                    inventoryImages
                  );

                  const editing = editingVT === item.maVT;
                  const isHetHang = status.tonKho <= 0;
                  const isCanhBao = status.canhBao;

                  return (
                    <tr
                      key={item.maVT}
                      className="hover:bg-teal-50/30 transition-colors group"
                    >
                      {/* Cột 1: Mã VT */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs">
                            {item.maVT}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            #{idx + 1}
                          </span>
                        </div>
                      </td>

                      {/* Cột 2: Phụ Liệu & Quy Cách (Thông tin tổng hợp) */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail ảnh */}
                          <div className="relative shrink-0 group/img">
                            <div
                              onClick={() => {
                                if (imageUrl) setZoomImg({ src: imageUrl, alt: item.tenVT });
                                else onUploadImage(item.maVT);
                              }}
                              className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center cursor-pointer shadow-2xs group-hover/img:border-teal-400 transition-all relative"
                              title={imageUrl ? "Bấm để phóng to xem ảnh" : "Bấm để tải ảnh lên"}
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.tenVT}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Boxes className="w-5 h-5 text-slate-300 group-hover/img:text-teal-500 transition-colors" />
                              )}

                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                {imageUrl ? <Eye className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                              </div>
                            </div>

                            {imageUrl && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUploadImage(item.maVT);
                                }}
                                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-300 text-slate-600 hover:text-teal-600 shadow-sm flex items-center justify-center text-[9px]"
                                title="Thay đổi ảnh"
                              >
                                <Camera className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>

                          {/* Thông tin: Tên + Loại + Quy cách + Note */}
                          <div className="min-w-0 flex-1">
                            {editing ? (
                              <input
                                type="text"
                                className="w-full p-1.5 bg-white border border-teal-500 rounded-lg text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-teal-100"
                                value={editForm.tenVT ?? ""}
                                onChange={(e) => setEditForm({ ...editForm, tenVT: e.target.value })}
                                placeholder="Tên phụ liệu..."
                              />
                            ) : (
                              <div className="font-extrabold text-slate-800 text-xs sm:text-sm line-clamp-1">
                                {item.tenVT}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${getLoaiBadgeColor(item.loai)}`}>
                                {item.loai || "Khác"}
                              </span>
                              {item.mauSac && (
                                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {item.mauSac}
                                </span>
                              )}
                              {cleanNote && (
                                <span className="text-[11px] text-slate-400 italic truncate max-w-xs" title={cleanNote}>
                                  · {cleanNote}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Tồn Kho & Tối Thiểu */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {editing ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                className="w-16 p-1 text-right bg-white border border-teal-500 rounded text-xs font-bold"
                                value={editForm.tonKho ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, tonKho: Number(e.target.value) })}
                              />
                              <span className="text-xs text-slate-400">{item.dvt}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <span>Tối thiểu:</span>
                              <input
                                type="number"
                                min={0}
                                className="w-12 p-0.5 text-right bg-white border rounded text-[10px]"
                                value={editForm.tonToiThieu ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, tonToiThieu: Number(e.target.value) })}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <div className="inline-flex items-baseline gap-1">
                              <span
                                className={`text-sm font-black tabular-nums ${
                                  isCanhBao
                                    ? "text-rose-600 font-mono"
                                    : isHetHang
                                    ? "text-slate-400 font-mono"
                                    : "text-emerald-700 font-mono"
                                }`}
                              >
                                {status.tonKho.toLocaleString("vi-VN")}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400">
                                {item.dvt}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Tối thiểu: {status.tonToiThieu > 0 ? status.tonToiThieu.toLocaleString("vi-VN") : "0"} {item.dvt}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Cột 4: Đơn Giá & Trị Giá Tồn */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {editing ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                className="w-20 p-1 text-right bg-white border border-teal-500 rounded text-xs font-bold"
                                value={editForm.donGia ?? 0}
                                onChange={(e) => setEditForm({ ...editForm, donGia: Number(e.target.value) })}
                              />
                              <span className="text-[10px] text-slate-400">đ</span>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-700">
                              {formatVND((editForm.tonKho ?? status.tonKho) * (editForm.donGia ?? item.donGia))}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-emerald-800 tabular-nums">
                              {formatVND(status.giaTriTon)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                              Đơn giá: {item.donGia > 0 ? `${item.donGia.toLocaleString("vi-VN")}đ` : "0đ"}/{item.dvt}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Cột 5: Trạng Thái */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        {isCanhBao ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            Tồn thấp
                          </span>
                        ) : isHetHang ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Hết hàng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Đạt chuẩn
                          </span>
                        )}
                      </td>

                      {/* Cột 6: Thao Tác */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          {editing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onSaveEdit(item)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                              >
                                Lưu
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingVT(null)}
                                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Hủy
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingVT(item.maVT);
                                  setEditForm({
                                    tenVT: item.tenVT,
                                    donGia: item.donGia,
                                    tonKho: status.tonKho,
                                    tonToiThieu: status.tonToiThieu,
                                  });
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                                title="Sửa nhanh phụ liệu"
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => onShowXuat(item.maVT)}
                                className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition cursor-pointer"
                                title="Xuất kho phụ liệu"
                              >
                                <Minus className="w-3 h-3 text-amber-600" />
                                <span>Xuất</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onShowNhap(item.maVT)}
                                className="flex items-center gap-1 px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                                title="Nhập kho phụ liệu từ NCC"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Nhập</span>
                              </button>
                              {onShowHistory && (
                                <button
                                  type="button"
                                  onClick={() => onShowHistory(item.maVT)}
                                  className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                                  title="Xem lịch sử xuất/nhập"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
