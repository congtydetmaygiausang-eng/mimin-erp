// ============ PRODUCT TABLE VIEW ============
// Tối ưu nâng cấp Bảng Danh Sách Chuẩn ERP cho Kho Thành Phẩm
"use client";

import React, { useMemo, useState } from "react";
import {
  Edit, Truck, Trash2, Image as ImageIcon, Eye,
  ChevronDown, ChevronUp, Package, MapPin, Tag,
  Layers, ShoppingBag, ArrowUpRight, CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { layMaLoTonKho, type SanPhamTP } from "../data";
import { LOAI_SP_LABELS, type LoaiSP, detectLoaiSP } from "@/lib/data/lenh-cat-store";
import { formatVND } from "@/lib/data/real-data";
import ImageLightbox from "@/components/ui/ImageLightbox";

const getPhanLoaiLabel = (phanLoai: string, tenSP: string) => {
  const isValidKey = Object.keys(LOAI_SP_LABELS).includes(phanLoai);
  const detectedKey = isValidKey ? (phanLoai as LoaiSP) : detectLoaiSP((tenSP || "") + " " + (phanLoai || ""));
  return LOAI_SP_LABELS[detectedKey] || detectedKey;
};

interface ProductTableProps {
  filtered: SanPhamTP[];
  productImages: Record<string, string>;
  productVariantImages?: Record<string, string>;
  setEditing: (s: SanPhamTP | null) => void;
  handleXuatKho: (id: string) => void;
  handleDelete: (id: string) => void;
  onSuaTong?: (group: { maSP: string; tenSP: string; items: SanPhamTP[] }) => void;
  onXoaTong?: (group: { maSP: string; tenSP: string; items: SanPhamTP[] }) => void;
  onDangBan?: (group: { maSP: string; tenSP: string; items: SanPhamTP[] }) => void;
  onOpenVariant?: (s: SanPhamTP) => void;
  highlightedMaSP?: string | null;
}

export function ProductTable({
  filtered,
  productImages,
  productVariantImages = {},
  setEditing,
  handleXuatKho,
  handleDelete,
  onSuaTong,
  onXoaTong,
  onDangBan,
  onOpenVariant,
  highlightedMaSP,
}: ProductTableProps) {
  const [zoomImg, setZoomImg] = useState<{ src: string; alt?: string } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleCollapse = (maSP: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [maSP]: !prev[maSP] }));
  };

  // Nhóm sản phẩm theo Mã SP
  const groupedProducts = useMemo(() => {
    const groups: Record<string, SanPhamTP[]> = {};
    (filtered || []).forEach((s) => {
      if (!s || !s.maSP) return;
      if (!groups[s.maSP]) groups[s.maSP] = [];
      groups[s.maSP].push(s);
    });
    return Object.values(groups);
  }, [filtered]);

  const [displayLimit, setDisplayLimit] = useState(25);

  React.useEffect(() => {
    if (highlightedMaSP) {
      const idx = groupedProducts.findIndex((g) => g?.[0]?.maSP === highlightedMaSP);
      if (idx >= 0 && idx >= displayLimit) {
        setDisplayLimit(idx + 10);
      }
    }
  }, [highlightedMaSP, groupedProducts, displayLimit]);

  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 500) {
      setDisplayLimit((prev) => prev + 25);
    }
  };

  React.useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {zoomImg && (
        <ImageLightbox
          src={zoomImg.src}
          alt={zoomImg.alt || "Ảnh sản phẩm"}
          onClose={() => setZoomImg(null)}
        />
      )}

      {groupedProducts.slice(0, displayLimit).map((group, groupIndex) => {
        if (!group || group.length === 0 || !group[0]) return null;
        const mainSP = group[0];
        const totalQty = group.reduce((sum, x) => sum + (Number(x?.soLuong) || 0), 0);
        const totalValue = group.reduce((sum, x) => sum + (Number(x?.giaTri) || 0), 0);
        const isCollapsed = collapsedGroups[mainSP.maSP] === true;
        const isManPJ =
          (mainSP.maSP || "").toUpperCase().includes("TPJ") ||
          (mainSP.tenSP || "").toUpperCase().includes("MANPJ") ||
          (mainSP.thuongHieu || "").toLowerCase().includes("man");

        const mainImg =
          productImages[mainSP.maSP] ||
          productImages[mainSP.id] ||
          mainSP.hinhAnh?.[0] ||
          group.find((x) => x.hinhAnh?.[0])?.hinhAnh?.[0];

        return (
          <div
            key={mainSP.maSP}
            id={`product-group-${mainSP.maSP}`}
            className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden ${
              highlightedMaSP === mainSP.maSP
                ? "border-emerald-500 ring-4 ring-emerald-300 dark:ring-emerald-900 shadow-lg bg-emerald-50/10"
                : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
            }`}
          >
            {/* ============ HEADER CỦA NHÓM SẢN PHẨM ============ */}
            <div className="p-4 md:p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-800/60 dark:via-slate-800/30 dark:to-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Ảnh đại diện sản phẩm */}
                <div
                  className="w-16 h-20 md:w-20 md:h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 shadow-xs cursor-pointer relative group/thumb flex items-center justify-center"
                  onClick={() => {
                    if (mainImg) setZoomImg({ src: mainImg, alt: mainSP.tenSP });
                  }}
                  title="Bấm để xem ảnh lớn"
                >
                  {mainImg ? (
                    <img
                      src={mainImg}
                      alt={mainSP.tenSP}
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <ImageIcon className="w-6 h-6 opacity-40" />
                      <span className="text-[10px] font-bold mt-1">Chưa có</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center text-white">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>

                {/* Thông tin sản phẩm */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono font-black text-xs md:text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                      {mainSP.maSP}
                    </span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      {getPhanLoaiLabel(mainSP.phanLoai, mainSP.tenSP)}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                        isManPJ
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300"
                          : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300"
                      }`}
                    >
                      {isManPJ ? "👔 Hàng ManPJ" : "👕 Hàng Polomimin"}
                    </span>
                  </div>

                  <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight line-clamp-1" title={mainSP.tenSP}>
                    {mainSP.tenSP}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{group.length} màu</span>
                    </span>
                    <span>•</span>
                    <span className="font-semibold">
                      Tổng tồn:{" "}
                      <b className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm">
                        {totalQty.toLocaleString()} SP
                      </b>
                    </span>
                    {totalValue > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-semibold">
                          Trị giá: <b className="text-slate-800 dark:text-slate-200 font-mono font-bold">{formatVND(totalValue)}</b>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Các nút hành động của nhóm */}
              <div className="flex items-center gap-1.5 flex-wrap self-end md:self-center shrink-0">
                {onDangBan && (
                  <button
                    type="button"
                    onClick={() => onDangBan({ maSP: mainSP.maSP, tenSP: mainSP.tenSP, items: group })}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs cursor-pointer whitespace-nowrap"
                    title="Đăng bán sản phẩm này sang Danh Mục Sản Phẩm"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Đăng bán</span>
                  </button>
                )}

                {onSuaTong && (
                  <button
                    type="button"
                    onClick={() => onSuaTong({ maSP: mainSP.maSP, tenSP: mainSP.tenSP, items: group })}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-bold text-xs flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                    title="Sửa đồng loạt tên, giá, loại sản phẩm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sửa Nhóm</span>
                  </button>
                )}

                {onXoaTong && (
                  <button
                    type="button"
                    onClick={() => onXoaTong({ maSP: mainSP.maSP, tenSP: mainSP.tenSP, items: group })}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 transition cursor-pointer"
                    title="Xóa toàn bộ nhóm sản phẩm này khỏi kho"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleCollapse(mainSP.maSP)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                  title={isCollapsed ? "Mở rộng bảng chi tiết màu" : "Thu gọn bảng chi tiết"}
                >
                  {isCollapsed ? (
                    <>
                      <span>Mở rộng</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Thu gọn</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ============ BẢNG CHI TIẾT TỪNG MÀU & SIZE ============ */}
            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[980px]">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12 whitespace-nowrap">#</th>
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[180px]">Biến Thể Màu Sắc</th>
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[170px]">Chi Tiết Size</th>
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[110px]">Vị Trí Kho</th>
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[180px]">Mã Lô Tồn Kho</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[110px]">Đơn Giá / Giá Vốn</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[110px]">Tồn Kho (SP)</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[110px]">Tình Trạng</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[130px]">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium bg-white dark:bg-slate-900">
                    {group.map((s, colorIndex) => {
                      if (!s) return null;
                      const sQty = Number(s.soLuong) || 0;
                      const sImg =
                        s.hinhAnh?.[0] ||
                        productVariantImages[`${s.maSP}_${s.mau}`] ||
                        productImages[s.maSP];
                      const maLo = layMaLoTonKho(s);

                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                        >
                          {/* STT */}
                          <td className="py-3 px-3 text-center text-slate-400 font-bold whitespace-nowrap">
                            {colorIndex + 1}
                          </td>

                          {/* Màu sắc & Ảnh biến thể */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0 cursor-pointer shadow-2xs relative group/varimg flex items-center justify-center"
                                onClick={() => {
                                  if (sImg) setZoomImg({ src: sImg, alt: `${s.tenSP} - ${s.mau}` });
                                }}
                                title="Bấm xem ảnh lớn biến thể màu"
                              >
                                {sImg ? (
                                  <img src={sImg} alt={s.mau} className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white text-xs block">
                                  {s.mau || "Mặc định"}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {s.maSKU || s.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Chi tiết size */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {s.chiTietSize && s.chiTietSize.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                                {s.chiTietSize.map((sz, szIdx) => (
                                  <span
                                    key={szIdx}
                                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300 font-bold"
                                  >
                                    {sz.size}: <b>{sz.sl}</b>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-600 dark:text-slate-400 text-xs">
                                {s.size || "Free Size"}
                              </span>
                            )}
                          </td>

                          {/* Vị trí kho */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 text-[11px] font-semibold">
                              <MapPin className="w-3 h-3" />
                              {s.viTri || "Khu A1"}
                            </span>
                          </td>

                          {/* Mã Lô Tồn Kho */}
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-400">
                            {maLo}
                          </td>

                          {/* Đơn giá / Giá vốn */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {formatVND(s.donGia || s.giaVon || 0)}
                            </span>
                          </td>

                          {/* Tồn kho */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span
                              className={`font-mono font-black text-sm ${
                                sQty === 0
                                  ? "text-rose-600 dark:text-rose-400"
                                  : sQty < 50
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {sQty.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 ml-1">SP</span>
                          </td>

                          {/* Tình trạng */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {sQty === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                Hết hàng
                              </span>
                            ) : sQty < 50 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Sắp hết ({sQty})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Còn hàng
                              </span>
                            )}
                          </td>

                          {/* Thao tác */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onOpenVariant) onOpenVariant(s);
                                  else setEditing(s);
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition cursor-pointer"
                                title="Chỉnh sửa biến thể màu này"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleXuatKho(s.id)}
                                className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-300 transition cursor-pointer"
                                title="Xuất kho biến thể này"
                              >
                                <Truck className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(s.id)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 transition cursor-pointer"
                                title="Xóa dòng biến thể này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
