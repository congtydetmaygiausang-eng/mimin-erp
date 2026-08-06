"use client";

// ============================================
// VariantCard - card nho cho moi variant (mau+size)
// Phase 1: danh-muc-sp redesign
// 2026-08-06
// ============================================
//
// Hien thi 1 variant (mau+size combo) trong card nho.
// Click vao anh -> mo ImageLightbox phong to.

import { Package } from "lucide-react";
import type { ProductVariant } from "@/lib/data/product-variants";

interface Props {
  variant: ProductVariant;
  /** Callback khi click vao anh -> phong to */
  onImageClick?: (url: string, alt: string) => void;
  /** Custom gia hien thi (optional - mac dinh lay tu SanPham) */
  giaBan?: number;
  /** Compact mode (card nho hon) */
  compact?: boolean;
}

export default function VariantCard({ variant, onImageClick, giaBan, compact = false }: Props) {
  const hasImage = !!variant.img;

  return (
    <div
      className={`group relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-md transition-all overflow-hidden ${
        compact ? "p-1.5" : "p-2"
      }`}
    >
      {/* Image */}
      <div
        className={`relative w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-md overflow-hidden cursor-zoom-in ${
          compact ? "aspect-square" : "aspect-square"
        }`}
        onClick={() => {
          if (hasImage && onImageClick) {
            onImageClick(variant.img, `${variant.maSKU} - ${variant.mauTen} ${variant.size}`);
          }
        }}
        title={hasImage ? "Click để phóng to" : "Chưa có ảnh"}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={variant.img}
            alt={variant.maSKU}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Package className={compact ? "w-6 h-6" : "w-8 h-8"} />
          </div>
        )}
        {/* Size badge overlay */}
        <span
          className={`absolute top-1 right-1 bg-black/70 text-white font-bold rounded ${
            compact ? "text-[9px] px-1 py-0.5" : "text-[10px] px-1.5 py-0.5"
          }`}
        >
          {variant.size}
        </span>
      </div>

      {/* Info */}
      <div className={`${compact ? "mt-1" : "mt-1.5"} text-center`}>
        <div className={`font-semibold text-slate-700 dark:text-slate-200 truncate ${compact ? "text-[10px]" : "text-xs"}`}>
          {variant.mauTen}
        </div>
        {!compact && (
          <>
            <div className="text-[10px] text-slate-400 truncate">{variant.maSKU}</div>
            {giaBan !== undefined && giaBan > 0 && (
              <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold mt-0.5">
                {new Intl.NumberFormat("vi-VN").format(giaBan)}đ
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
