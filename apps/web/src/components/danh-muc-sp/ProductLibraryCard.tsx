// ProductLibraryCard - Card compact cho thu vien (grid 3-4 cols)
// 2026-08-07 - redesign theo sep Sang: layout "thu vien the card"
// 2026-08-07 - them thong tin: trang thai, da ban, NCC, chat lieu, rating
import { Shirt, ShoppingCart, FileText, Truck, Star, Heart, Package, TrendingUp, Tag, Building2, Sparkles, Flame, Eye } from "lucide-react";
import type { SanPham } from "@/lib/data/danh-muc-sp-store";
import { formatVNDShort } from "@/lib/data/real-data";

interface ProductLibraryCardProps {
  sp: SanPham;
  onAddToCart?: (sp: SanPham) => void;
  onCreateOrder?: (sp: SanPham) => void;
  onProduceOrder?: (sp: SanPham) => void;
  onFavorite?: (sp: SanPham) => void;
  onClick?: (sp: SanPham) => void;
}

// Helper: render label trang thai
const TRANG_THAI_LABELS: Record<NonNullable<SanPham["trangThai"]>, { label: string; className: string }> = {
  "con-hang": { label: "Còn hàng", className: "bg-emerald-500 text-white" },
  "het-hang": { label: "Hết hàng", className: "bg-rose-500 text-white" },
  "sap-ve": { label: "Sắp về", className: "bg-amber-500 text-white" },
  "ngung-kinh-doanh": { label: "Ngừng KD", className: "bg-slate-500 text-white" },
};

// Helper: loai SP label
const LOAI_SP_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  AoTru: { label: "Áo Trụ", icon: "👕", color: "bg-cyan-500/15 text-cyan-700" },
  AoCoTron: { label: "Áo Cổ Tròn", icon: "👕", color: "bg-cyan-500/15 text-cyan-700" },
  AoPolo: { label: "Polo", icon: "👔", color: "bg-teal-500/15 text-teal-700" },
  BoTru: { label: "Bộ Trụ", icon: "👔", color: "bg-blue-500/15 text-blue-700" },
  BoCoTron: { label: "Bộ Cổ Tròn", icon: "👕", color: "bg-blue-500/15 text-blue-700" },
  PhuKien: { label: "Phụ kiện", icon: "🧢", color: "bg-violet-500/15 text-violet-700" },
};

export default function ProductLibraryCard({
  sp,
  onAddToCart,
  onCreateOrder,
  onDirectOrder,
  onFavorite,
  onClick,
}: ProductLibraryCardProps) {
  const topColors = (sp.dsMau || []).slice(0, 3);
  const soSize = (sp.bangSize?.sizes || []).length;
  const soMau = (sp.dsMau || []).length;
  const trangThai = sp.trangThai || "con-hang";
  const trangThaiInfo = TRANG_THAI_LABELS[trangThai];
  const loaiInfo = LOAI_SP_LABELS[sp.loaiSP] || { label: sp.loaiSP, icon: "📦", color: "bg-slate-500/15 text-slate-700" };
  const rating = sp.rating || 0;
  const daBan = sp.daBan || 0;
  const luotXem = sp.luotXem || 0;
  const laHot = sp.id.endsWith("3") || sp.id.endsWith("7") || daBan > 1000;
  const laMoi = sp.ngayTao >= "2026-08-01";

  // Format so luot xem (1240 -> 1.2k)
  const formatNumber = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  return (
    <div 
      onClick={() => onClick && onClick(sp)}
      className={`group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col ${onClick ? "cursor-pointer" : ""}`}
    >
      {/* === ANH SAN PHAM === */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-cyan-50 via-cyan-100 to-teal-50 overflow-hidden">
        {/* Placeholder icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Shirt className="w-20 h-20 md:w-24 md:h-24 text-cyan-300 group-hover:scale-110 group-hover:text-cyan-500 transition-all duration-500" />
        </div>
        {/* Hình ảnh thật */}
        {sp.hinhAnh && (
          <img
            src={sp.hinhAnh}
            alt={sp.tenSP}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}

        {/* === BADGES GOC TREN TRAI === */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {laHot && (
            <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-extrabold rounded-md shadow-md uppercase tracking-wide flex items-center gap-1">
              <Flame className="w-3 h-3" /> HOT
            </span>
          )}
          {laMoi && !laHot && (
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-extrabold rounded-md shadow-md uppercase tracking-wide">
              MỚI
            </span>
          )}
        </div>

        {/* === TRANG THAI GOC TREN PHAI === */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md shadow-md ${trangThaiInfo.className}`}>
            {trangThaiInfo.label}
          </span>
        </div>

        {/* === FAVORITE HEART (hover only) === */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite?.(sp);
          }}
          className="absolute top-9 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
          aria-label="Yeu thich"
        >
          <Heart className="w-4 h-4" />
        </button>

        {/* Removed VARIANTS THUMBNAILS GOC DUOI TRAI */}

        {/* === SIZE COUNT GOC DUOI PHAI === */}
        {soSize > 0 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-cyan-700 rounded-md shadow-md">
            {soSize} size
          </span>
        )}
      </div>

      {/* === INFO === */}
      <div className="p-3 md:p-4 flex flex-col flex-1">
        {/* Row 1: Ma SP + Loai SP chip */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-wider">
            {sp.id}
          </span>
          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${loaiInfo.color}`}>
            {loaiInfo.icon} {loaiInfo.label}
          </span>
        </div>

        {/* Ten SP - 2 dong max */}
        <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug mb-1.5 min-h-[3rem] md:min-h-[3.5rem]">
          {sp.tenSP}
        </h3>

        {/* Mo ta ngan (ghi chu) */}
        {sp.ghiChu && (
          <p className="text-[11px] text-slate-500 line-clamp-1 mb-2 italic" title={sp.ghiChu}>
            {sp.ghiChu}
          </p>
        )}

        {/* === VARIANTS BLOCKS (HORIZONTAL - EXTRA LARGE) === */}
        {sp.dsMau && sp.dsMau.length > 0 ? (
        {/* === VARIANTS BLOCKS (HORIZONTAL - EXTRA LARGE) === */}
        {sp.dsMau && sp.dsMau.length > 0 ? (
          <div className="flex flex-col gap-3 mb-4">
            {sp.dsMau.slice(0, 4).map((mau, idx) => {
              const sizes = (sp.bangSize?.sizes || []).slice(0, 5);
              const items = sizes.map((s, i) => {
                const ratio = sp.bangSize?.ratios[i] || parseInt(sp.tiLeSize?.split(":")[i] || "0") || 0;
                // Deterministic mock stock so we can sum it up accurately
                const stock = Math.floor(Math.abs(Math.sin((idx + 1) * (i + 1) * 10)) * 50) + 10;
                return { s, ratio, stock };
              });
              const sumRatio = items.reduce((acc, curr) => acc + curr.ratio, 0);
              const sumStock = items.reduce((acc, curr) => acc + curr.stock, 0);

              return (
                <div key={idx} className="flex items-center gap-2 md:gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  
                  {/* Extra Big Variant Image */}
                  <div className="flex flex-col items-center shrink-0 w-[64px] md:w-[80px]">
                    {mau.img ? (
                      <img src={mau.img} alt={mau.ten} className="w-14 h-14 md:w-20 md:h-20 rounded-xl object-cover border border-slate-200 shadow-sm" />
                    ) : (
                      <div 
                        className="w-14 h-14 md:w-20 md:h-20 rounded-xl border border-slate-200 shadow-sm"
                        style={{ background: mau.ten === "Đen" ? "#1f2937" : mau.ten === "Trắng" ? "#f9fafb" : mau.ten?.toLowerCase().includes("xanh") ? "#0891b2" : mau.ten?.toLowerCase().includes("đỏ") || mau.ten?.toLowerCase().includes("hồng") ? "#ec4899" : mau.ten?.toLowerCase().includes("vàng") || mau.ten?.toLowerCase().includes("be") ? "#f59e0b" : "#9ca3af" }}
                      />
                    )}
                    <span className="text-xs md:text-sm font-bold text-slate-700 uppercase mt-1 w-full text-center truncate">
                      {mau.ten}
                    </span>
                  </div>

                  {/* Extra Big Size Grid (Horizontal) */}
                  <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 no-scrollbar flex-1 items-center">
                    {items.map((item, i) => (
                      <div key={i} className="flex flex-col items-center shrink-0 min-w-[32px] md:min-w-[44px]">
                        <span className="w-full px-1 py-1 text-xs md:text-sm font-bold rounded-t bg-slate-100 text-slate-600 border border-b-0 border-slate-200 text-center">
                          {item.s}
                        </span>
                        <span className="w-full px-1 py-1 text-sm md:text-base font-extrabold bg-cyan-50 text-cyan-600 border border-slate-200 text-center">
                          {item.ratio}
                        </span>
                        <span className="w-full px-1 py-1 text-sm md:text-base font-bold bg-emerald-50 text-emerald-600 border border-t-0 border-slate-200 rounded-b text-center">
                          {item.stock}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total Sum Boxes */}
                  <div className="flex flex-col gap-1.5 shrink-0 ml-1 mt-[26px]">
                    <div className="flex items-center justify-center border-2 border-slate-900 rounded px-2 h-[26px] md:h-[30px] text-sm md:text-base font-extrabold text-slate-900 bg-white min-w-[36px] md:min-w-[48px] shadow-sm" title="Tổng tỉ lệ (Ri)">
                      {sumRatio}
                    </div>
                    <div className="flex items-center justify-center border-2 border-slate-900 rounded px-2 h-[26px] md:h-[30px] text-sm md:text-base font-extrabold text-slate-900 bg-white min-w-[36px] md:min-w-[48px] shadow-sm" title="Tổng tồn kho">
                      {sumStock}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {(sp.bangSize?.sizes || []).slice(0, 5).map((s, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="min-w-[32px] px-1 py-1 text-[11px] font-bold rounded-t bg-slate-100 text-slate-600 border border-b-0 border-slate-200 text-center">
                    {s}
                  </span>
                  <span className="min-w-[32px] px-1 py-0.5 text-[11px] font-extrabold bg-cyan-50 text-cyan-600 border border-slate-200 text-center" title="Tỉ lệ">
                    {sp.bangSize?.ratios[i] || sp.tiLeSize?.split(":")[i] || 0}
                  </span>
                  <span className="min-w-[32px] px-1 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-t-0 border-slate-200 rounded-b text-center" title="Tồn kho">
                    {Math.floor(Math.random() * 50) + 10}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === Row: Chat lieu + NCC (2 dong nho) === */}
        <div className="space-y-0.5 mb-2 text-[10px] text-slate-500">
          {sp.chatLieu && (
            <div className="flex items-center gap-1 line-clamp-1" title={sp.chatLieu}>
              <Sparkles className="w-3 h-3 shrink-0" />
              <span className="truncate">{sp.chatLieu}</span>
            </div>
          )}
          {sp.ncc && (
            <div className="flex items-center gap-1 line-clamp-1" title={sp.ncc}>
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="truncate">NCC: {sp.ncc}</span>
            </div>
          )}
        </div>

        {/* === Row: Da ban + Luot xem (social proof) === */}
        {(daBan > 0 || luotXem > 0) && (
          <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-500">
            {daBan > 0 && (
              <div className="flex items-center gap-0.5" title={`Đã bán ${daBan} sản phẩm`}>
                <Package className="w-3 h-3" />
                <span className="font-semibold text-slate-700">{formatNumber(daBan)}</span>
                <span>đã bán</span>
              </div>
            )}
            {luotXem > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center gap-0.5" title={`${luotXem} lượt xem`}>
                  <Eye className="w-3 h-3" />
                  <span className="font-semibold text-slate-700">{formatNumber(luotXem)}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* === Rating (neu co) === */}
        {rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-700">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* === Gia ban + Gia von === */}
        <div className="mt-auto mb-3 pt-2 border-t border-slate-100">
          {sp.giaBanDuKien > 0 ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base md:text-lg font-extrabold text-cyan-700 dark:text-cyan-300">
                  {formatVNDShort(sp.giaBanDuKien)}
                </span>
                <span className="text-[10px] md:text-xs text-slate-400">VNĐ</span>
              </div>
              {sp.giaVonDuKien > 0 && (
                <div className="text-[10px] md:text-xs text-slate-400 line-through opacity-70 mt-0.5">
                  Vốn: {formatVNDShort(sp.giaVonDuKien)}
                  {sp.giaBanDuKien > 0 && sp.giaVonDuKien > 0 && (
                    <span className="ml-1.5 text-emerald-600 font-bold">
                      +{Math.round(((sp.giaBanDuKien - sp.giaVonDuKien) / sp.giaVonDuKien) * 100)}%
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            // Chua co gia - hien thi "Lien he"
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded">
                📞 Liên hệ báo giá
              </span>
            </div>
          )}
        </div>

        {/* === 3 NUT CTA === */}
        <div className="flex gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(sp);
            }}
            disabled={trangThai === "het-hang" || trangThai === "ngung-kinh-doanh"}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
            title={trangThai === "het-hang" ? "Hết hàng" : "Thêm vào giỏ"}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Giỏ Hàng</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateOrder?.(sp);
            }}
            disabled={trangThai === "het-hang" || trangThai === "ngung-kinh-doanh"}
            className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
            title="Tạo đơn hàng mới"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Tạo Đơn</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProduceOrder?.(sp);
            }}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
            title="Đặt hàng sản xuất"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Sản Xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
}
