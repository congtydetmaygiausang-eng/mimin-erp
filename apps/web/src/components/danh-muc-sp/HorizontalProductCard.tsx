"use client";

// ============================================
// HorizontalProductCard - card layout NGANG
// Redesign 2026-08-06 theo reference POLOMIMIN
// - Anh to ben trai (vuong, full card height)
// - 3 thumbnail mau ben phai (click de phong to)
// - Badge ten SP + meta + size grid + 3 button
// ============================================

import { useState } from "react";
import { Package, ShoppingCart, FileText, Truck, TrendingUp, Sparkles, Star } from "lucide-react";
import { formatVNDShort, formatVND } from "@/lib/data/real-data";
import { generateVariants, type ProductVariant } from "@/lib/data/product-variants";
import type { SanPham, MauTieuChuan, BangSize } from "@/lib/data/danh-muc-sp-store";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import ImageLightbox from "@/components/ui/ImageLightbox";

interface Props {
  sp: SanPham;
  onImageClick?: (url: string, alt: string, gallery: string[]) => void;
}

export default function HorizontalProductCard({ sp, onImageClick }: Props) {
  // Lay 3 mau dau (uu tien) + 1 anh chinh
  const dsMau = (sp.dsMau || []).slice(0, 3);
  const hasImage = dsMau.some((m) => !!m.img);
  const mainImage = dsMau[0]?.img || "";
  const gallery = dsMau.map((m) => m.img).filter((u) => !!u);

  // Sinh variants (size + mau) de hien thi size grid
  const variants = generateVariants(sp.id, sp.dsMau, sp.bangSize);
  const activeSizes = (sp.bangSize?.sizes || []).filter((_, i) => (sp.bangSize?.ratios[i] || 0) > 0);

  // Lightbox state
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState("");
  const [lightboxGallery, setLightboxGallery] = useState<string[]>([]);

  // Tong ton kho (gia su moi size = 100)
  const totalQty = activeSizes.length * 100;

  return (
    <>
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-white/20 hover:shadow-2xl transition-all">
        <div className="flex flex-col md:flex-row">
          {/* === BEN TRAI: Anh to + 3 thumbnail === */}
          <div className="md:w-[55%] relative bg-gradient-to-br from-slate-50 to-slate-100 p-3 md:p-4">
            <div className="flex gap-2 md:gap-3 h-full">
              {/* 3 thumbnail nho ben trai (doc) */}
              <div className="flex flex-col gap-2 w-16 md:w-20 shrink-0">
                {dsMau.length > 0 ? dsMau.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (m.img) {
                        setLightboxSrc(m.img);
                        setLightboxAlt(`${sp.tenSP} - ${m.ten}`);
                        setLightboxGallery(gallery);
                      }
                    }}
                    className="aspect-square w-full rounded-lg overflow-hidden border-2 border-white shadow-sm hover:border-cyan-500 hover:scale-105 transition-all bg-white cursor-zoom-in"
                    title={m.img ? "Click để phóng to" : "Chưa có ảnh"}
                  >
                    {m.img ? (
                      <img src={m.img} alt={m.ten} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                )) : (
                  <div className="aspect-square w-full rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                    <Package className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Anh to ben phai thumbnail */}
              <div
                className="flex-1 aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white cursor-zoom-in relative group"
                onClick={() => {
                  if (mainImage) {
                    setLightboxSrc(mainImage);
                    setLightboxAlt(`${sp.tenSP} - ${dsMau[0]?.ten || ""}`);
                    setLightboxGallery(gallery);
                  }
                }}
                title="Click để phóng to"
              >
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={sp.tenSP}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                    <Package className="w-16 h-16 mb-2" />
                    <span className="text-xs font-semibold">Chưa có ảnh</span>
                  </div>
                )}
                {/* Badge góc phải */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {totalQty > 0 && (
                    <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-md shadow-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" />
                      HOT
                    </span>
                  )}
                  <span className="px-2 py-1 bg-black/60 backdrop-blur text-white text-[10px] font-mono font-bold rounded-md">
                    {sp.id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* === BEN PHAI: Thong tin + buttons === */}
          <div className="md:w-[45%] p-4 md:p-5 flex flex-col gap-3">
            {/* Badge ten SP */}
            <div>
              <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-md shadow-md">
                {sp.tenSP}
              </span>
            </div>

            {/* Meta tags */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2 py-1 bg-slate-100 rounded font-semibold text-slate-700">
                Size: {activeSizes.length}-{activeSizes.length}-{activeSizes.length}-{activeSizes.length}
              </span>
              <span className="px-2 py-1 bg-slate-100 rounded font-mono font-semibold text-slate-700">
                MIN {sp.id.slice(0, 3).toUpperCase()}{sp.id.slice(3) || "000"}
              </span>
              <span className="px-2 py-1 bg-slate-100 rounded font-semibold text-slate-700">
                {LOAI_SP_LABELS[sp.loaiSP] || sp.loaiSP}
              </span>
              <span className="px-2 py-1 bg-slate-100 rounded font-mono font-semibold text-slate-700">
                SL: {totalQty}
              </span>
            </div>

            {/* Badge ban chay nhat */}
            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] leading-tight">
                <div className="font-bold text-slate-700">BÁN CHẬY NHẤT:</div>
                <div className="text-slate-500">Hơn 10.000+ khách hàng đã tin dùng.</div>
              </div>
            </div>

            {/* Size grid - 4 o size */}
            <div className="grid grid-cols-4 gap-1.5">
              {activeSizes.slice(0, 4).map((s) => {
                const stock = 100; // mock - có thể lấy từ data thật
                return (
                  <div
                    key={s}
                    className="text-center p-1.5 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-md"
                  >
                    <div className="text-[10px] font-bold text-emerald-700">Size {s}</div>
                    <div className="text-[10px] text-emerald-600">Còn {stock}</div>
                  </div>
                );
              })}
            </div>

            {/* Gia */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Giá bán</div>
                <div className="font-bold text-lg text-cyan-700">{formatVNDShort(sp.giaBanDuKien)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase">Giá vốn</div>
                <div className="font-semibold text-xs text-rose-600">{formatVNDShort(sp.giaVonDuKien)}</div>
              </div>
            </div>

            {/* 3 button */}
            <div className="grid grid-cols-3 gap-2 mt-auto">
              <button
                onClick={() => alert(`Thêm "${sp.tenSP}" vào giỏ hàng`)}
                className="px-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md transition active:scale-95"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>THÊM VÀO GIỎ</span>
              </button>
              <button
                onClick={() => alert(`Tạo đơn hàng cho "${sp.tenSP}"`)}
                className="px-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md transition active:scale-95"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>TẠO ĐƠN</span>
              </button>
              <button
                onClick={() => alert(`Đặt hàng nhanh "${sp.tenSP}"`)}
                className="px-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md transition active:scale-95"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>ĐẶT HÀNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <ImageLightbox
        src={lightboxSrc}
        alt={lightboxAlt}
        onClose={() => setLightboxSrc(null)}
        gallery={lightboxGallery}
        onChange={(s) => setLightboxSrc(s)}
      />
    </>
  );
}
