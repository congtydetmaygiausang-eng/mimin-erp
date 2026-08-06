"use client";

import { useState, useEffect, useMemo } from "react";
import { useDanhMucSP, type SanPham } from "@/lib/data/danh-muc-sp-store";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import { Plus, Search, Shirt, Edit2, Trash2, Ruler, Tag, Package } from "lucide-react";
import { formatVND } from "@/lib/data/real-data";
import DanhMucSPModal from "@/components/DanhMucSPModal";
import BangSizeManagerModal from "@/components/BangSizeManagerModal";
import ImageLightbox from "@/components/ui/ImageLightbox";
import VariantCard from "@/components/danh-muc-sp/VariantCard";
import { generateVariants, groupVariantsByMau } from "@/lib/data/product-variants";
import { toast } from "sonner";

export default function DanhMucSanPhamPage() {
  const { dsSanPham, xoaSP, loading } = useDanhMucSP();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showBangSize, setShowBangSize] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Lightbox state
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxGallery, setLightboxGallery] = useState<string[]>([]);
  const [lightboxAlt, setLightboxAlt] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const filtered = (dsSanPham || []).filter(
    (sp) =>
      (sp?.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (sp?.tenSP || "").toLowerCase().includes(search.toLowerCase())
  );

  // Helper: mo lightbox voi gallery (cac anh cua cung 1 SP)
  const openLightbox = (src: string, alt: string, gallery: string[]) => {
    setLightboxSrc(src);
    setLightboxAlt(alt);
    setLightboxGallery(gallery);
  };
  const closeLightbox = () => {
    setLightboxSrc(null);
    setLightboxGallery([]);
    setLightboxAlt("");
  };
  const onLightboxChange = (newSrc: string) => {
    setLightboxSrc(newSrc);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Premium Header Banner */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl mb-8 border border-white/20">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{ backgroundImage: "url('/bg/sky-soft.jpg')" }}
        ></div>
        
        {/* Overlay / Glassmorphism */}
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-teal-900/70 via-teal-800/40 to-transparent"></div>

        {/* Content */}
        <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="text-white drop-shadow-md">
            <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3 tracking-tight">
              <Shirt className="w-9 h-9 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              Danh mục Sản phẩm
            </h1>
            <p className="mt-3 text-cyan-50 opacity-90 max-w-lg text-sm md:text-base leading-relaxed font-medium">
              Quản lý Master Data (Thông tin gốc) của các sản phẩm. Thêm mẫu mới, cấu hình bảng size và định mức màu sắc.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowBangSize(true)}
              className="px-5 py-3 rounded-xl bg-black/20 hover:bg-black/40 border border-white/20 backdrop-blur-md text-white font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Ruler className="w-4 h-4" />
              Bảng Size ({dsSanPham?.length || 0})
            </button>
            <button
              onClick={() => {
                setEditId(null);
                setShowModal(true);
              }}
              className="group relative px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/40 backdrop-blur-lg text-white font-bold text-base shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] transition-all overflow-hidden flex items-center gap-2"
            >
              {/* Animated Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-400 opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300 drop-shadow-md relative z-10" />
              <span className="relative z-10 drop-shadow-lg tracking-wide uppercase">Thêm Mẫu Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo Mã SP hoặc Tên SP..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2B4C3E] outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-2xl border border-white/20 shadow-sm backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
          <div className="text-slate-500 font-medium">Đang đồng bộ dữ liệu từ Supabase...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((sp) => {
          // Auto-generate variants tu dsMau x bangSize
          const variants = generateVariants(sp.id, sp.dsMau, sp.bangSize);
          const mauGroups = groupVariantsByMau(variants);
          // Gallery cho lightbox - cac anh variants (loc URL khong rong)
          const variantGallery = variants.map((v) => v.img).filter((url) => !!url);

          return (
          <div key={sp.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-2xl transition-all flex flex-col">
            {/* HEADER CARD - anh to + ten + gia + bang size + actions */}
            <div className="relative h-56 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 overflow-hidden group">
              {sp.dsMau[0]?.img ? (
                <img
                  src={sp.dsMau[0].img}
                  alt={sp.tenSP}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                  onClick={() => {
                    if (variantGallery.length > 0) {
                      openLightbox(variantGallery[0], `${sp.tenSP} - ${sp.dsMau[0].ten}`, variantGallery);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                  <Shirt className="w-16 h-16 opacity-50" />
                  <span className="text-xs font-semibold mt-2">Chưa có ảnh</span>
                </div>
              )}

              {/* MaSP badge */}
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg text-xs font-bold text-emerald-700 dark:text-cyan-300 border border-white/40 dark:border-slate-700/40">
                {sp.id}
              </div>

              {/* So luong variants badge */}
              {variants.length > 0 && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white backdrop-blur-sm rounded-lg text-xs font-bold flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {variants.length} biến thể
                </div>
              )}

              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditId(sp.id); setShowModal(true); }}
                  className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full shadow hover:text-blue-600 transition"
                  title="Sửa"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { if(confirm("Xóa mẫu này?")) { xoaSP(sp.id); toast.success("Đã xóa"); } }}
                  className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full shadow hover:text-rose-600 transition"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom gradient + ten + gia */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-8">
                <h3 className="font-bold text-lg text-white line-clamp-1 drop-shadow-md">{sp.tenSP}</h3>
                <p className="text-xs text-cyan-100 mt-0.5">{LOAI_SP_LABELS[sp.loaiSP] || sp.loaiSP}</p>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <div className="text-[10px] text-cyan-200 uppercase">Giá bán DK</div>
                    <div className="font-bold text-emerald-300 text-sm">{formatVND(sp.giaBanDuKien)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-cyan-200 uppercase">Giá vốn DK</div>
                    <div className="font-semibold text-rose-300 text-xs">{formatVND(sp.giaVonDuKien)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* BANG SIZE MINI */}
            {sp.bangSize && (
              <div className="m-3 p-2.5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-900/40 dark:to-slate-800/40 rounded-xl border border-blue-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[10px] font-bold text-blue-700 dark:text-cyan-300 uppercase flex items-center gap-1">
                    📐 Bảng Size
                  </div>
                  <div className="text-[10px] font-mono font-bold text-blue-900 dark:text-cyan-200">
                    Ri {sp.bangSize.riSo}
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {sp.bangSize.sizes.map((size, idx) => {
                    const r = sp.bangSize!.ratios[idx];
                    const isActive = r > 0;
                    return (
                      <div
                        key={size}
                        className={`text-center rounded py-1 ${
                          isActive
                            ? "bg-blue-600 dark:bg-cyan-600 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 line-through"
                        }`}
                        title={`${size}: ${r} phần`}
                      >
                        <div className="text-[8px] font-semibold uppercase leading-none">{size}</div>
                        <div className="text-xs font-bold leading-tight">{r}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GRID VARIANTS - cac card nho ben trong card lon */}
            {variants.length > 0 && (
              <div className="px-3 pb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Package className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    Tất cả biến thể ({mauGroups.length} màu × {sp.bangSize?.sizes.filter((_, i) => (sp.bangSize?.ratios[i] || 0) > 0).length || 0} size)
                  </span>
                </div>
                {/* Group theo mau - moi mau = 1 row cac card nho */}
                <div className="space-y-2">
                  {mauGroups.map((group) => {
                    // Lay anh mau (neu co)
                    const mauImg = group.variants[0]?.img;
                    return (
                      <div key={group.mauCode} className="flex gap-2 items-start">
                        {/* Mau label (ben trai) */}
                        <div className="flex flex-col items-center min-w-[60px] pt-1">
                          <div
                            className="w-10 h-10 rounded-lg border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden cursor-zoom-in hover:scale-110 transition-transform"
                            onClick={() => {
                              if (mauImg) openLightbox(mauImg, `${sp.tenSP} - ${group.mauTen}`, variantGallery);
                            }}
                            title={mauImg ? "Click để phóng to" : "Chưa có ảnh"}
                          >
                            {mauImg ? (
                              <img src={mauImg} alt={group.mauTen} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                {group.mauCode.slice(0, 3)}
                              </div>
                            )}
                          </div>
                          <div className="text-[9px] font-bold text-slate-700 dark:text-slate-300 mt-1 text-center max-w-[60px] truncate">
                            {group.mauTen}
                          </div>
                        </div>
                        {/* Grid cards size ben phai */}
                        <div className="flex-1 grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                          {group.variants.map((v) => (
                            <VariantCard
                              key={v.id}
                              variant={v}
                              giaBan={sp.giaBanDuKien}
                              compact
                              onImageClick={(src, alt) => openLightbox(src, alt, variantGallery)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state neu chua co variants */}
            {variants.length === 0 && sp.dsMau.length > 0 && (
              <div className="px-3 pb-3">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                  Màu có sẵn
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {sp.dsMau.map((m) => (
                    <span key={m.maSKU} className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                      {m.ten}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <Shirt className="w-16 h-16 mx-auto opacity-20 mb-4" />
          <p>Không tìm thấy sản phẩm nào</p>
        </div>
      )}

      {showModal && (
        <DanhMucSPModal
          open={showModal}
          onClose={() => setShowModal(false)}
          editId={editId}
        />
      )}

      {/* Lightbox xem anh lon (click vao anh variant de phong to) */}
      <ImageLightbox
        src={lightboxSrc}
        alt={lightboxAlt}
        onClose={closeLightbox}
        gallery={lightboxGallery}
        onChange={onLightboxChange}
      />
    </div>
  );
}
