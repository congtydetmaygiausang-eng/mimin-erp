// ProductLibraryCard - Card compact cho thu vien (grid 3-4 cols)
// 2026-08-07 - redesign theo sep Sang: layout "thu vien the card"
import { Shirt, ShoppingCart, FileText, Truck, Star, Heart } from "lucide-react";
import type { SanPham } from "@/lib/data/danh-muc-sp-store";
import { formatVNDShort } from "@/lib/data/real-data";

interface ProductLibraryCardProps {
  sp: SanPham;
  onAddToCart?: (sp: SanPham) => void;
  onCreateOrder?: (sp: SanPham) => void;
  onDirectOrder?: (sp: SanPham) => void;
  onFavorite?: (sp: SanPham) => void;
}

export default function ProductLibraryCard({
  sp,
  onAddToCart,
  onCreateOrder,
  onDirectOrder,
  onFavorite,
}: ProductLibraryCardProps) {
  // Lay 3 mau dau de hien thi thumbnail
  const topColors = (sp.dsMau || []).slice(0, 3);
  const soSize = (sp.bangSize?.sizes || []).length;
  const soMau = (sp.dsMau || []).length;

  // Random badge (gia su)
  const isHot = sp.id.endsWith("3") || sp.id.endsWith("7");
  const isNew = sp.id.endsWith("1") || sp.id.endsWith("9");

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* === ANH SAN PHAM === */}
      <div className="relative aspect-square bg-gradient-to-br from-cyan-50 via-cyan-100 to-teal-50 overflow-hidden">
        {/* Placeholder icon - trong tuong lai se thay bang imageUrl */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Shirt className="w-20 h-20 md:w-24 md:h-24 text-cyan-300 group-hover:scale-110 group-hover:text-cyan-500 transition-all duration-500" />
        </div>

        {/* Badge HOT / NEW goc tren trai */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isHot && (
            <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-extrabold rounded-md shadow-md uppercase tracking-wide flex items-center gap-1">
              <span className="text-xs">★</span> HOT
            </span>
          )}
          {isNew && (
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-extrabold rounded-md shadow-md uppercase tracking-wide">
              MỚI
            </span>
          )}
        </div>

        {/* Favorite button goc tren phai */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite?.(sp);
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
          aria-label="Yeu thich"
        >
          <Heart className="w-4 h-4" />
        </button>

        {/* Color dots goc duoi trai */}
        {topColors.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {topColors.map((m, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                style={{ background: m.ten === "Đen" ? "#1f2937" : m.ten === "Trắng" ? "#f9fafb" : m.ten?.toLowerCase().includes("xanh") ? "#0891b2" : "#9ca3af" }}
                title={m.ten}
              />
            ))}
            {soMau > 3 && (
              <span className="w-4 h-4 rounded-full bg-white/90 backdrop-blur-sm border border-white text-[8px] font-bold text-slate-700 flex items-center justify-center shadow-md">
                +{soMau - 3}
              </span>
            )}
          </div>
        )}

        {/* Size count goc duoi phai */}
        {soSize > 0 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-cyan-700 rounded-md shadow-md">
            {soSize} size
          </span>
        )}
      </div>

      {/* === INFO === */}
      <div className="p-3 md:p-4 flex flex-col flex-1">
        {/* Ma SP */}
        <div className="text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-wider mb-1">
          {sp.id}
        </div>

        {/* Ten SP - 2 dong max */}
        <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug mb-2 min-h-[2.5rem] md:min-h-[3rem]">
          {sp.tenSP}
        </h3>

        {/* Bang size mini */}
        <div className="flex flex-wrap gap-1 mb-2">
          {(sp.bangSize?.sizes || []).slice(0, 5).map((s, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              {s}
            </span>
          ))}
        </div>

        {/* Gia - 2 dong: Gia ban (to) + Gia von (nho) */}
        <div className="mt-auto mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base md:text-lg font-extrabold text-cyan-700 dark:text-cyan-300">
              {formatVNDShort(sp.giaBanDuKien || 0)}
            </span>
            <span className="text-[10px] text-slate-400">VNĐ</span>
          </div>
          <div className="text-[10px] text-slate-400 line-through opacity-70">
            Gia von: {formatVNDShort(sp.giaVonDuKien || 0)}
          </div>
        </div>

        {/* === 3 NUT CTA === */}
        <div className="flex gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(sp);
            }}
            className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] md:text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
            title="Them vao gio"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gio</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateOrder?.(sp);
            }}
            className="flex-1 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-[10px] md:text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
            title="Tao don hang"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Don</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDirectOrder?.(sp);
            }}
            className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] md:text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
            title="Dat hang truc tiep"
          >
            <Truck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dat</span>
          </button>
        </div>
      </div>

      {/* Rating overlay khi hover */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
        <div className="bg-amber-400/95 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xl">
          <Star className="w-3.5 h-3.5 fill-white" />
          4.8
        </div>
      </div>
    </div>
  );
}
