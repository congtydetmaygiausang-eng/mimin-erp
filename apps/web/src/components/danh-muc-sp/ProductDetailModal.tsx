import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { X, Shirt, Flame, Eye, ShoppingCart, Tag, Package, Star, ShieldCheck, MapPin, Maximize2, PlayCircle, Plus, Image as ImageIcon, FileText, ChevronRight } from "lucide-react";
import type { SanPham } from "@/lib/data/danh-muc-sp-store";
import { formatVNDShort } from "@/lib/data/real-data";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import type { TonKhoTheoSize } from "@/lib/data/ton-kho-theo-mau";

interface ProductDetailModalProps {
  sp: SanPham | null;
  tonKhoTheoMau?: Record<string, TonKhoTheoSize>;
  onClose: () => void;
  onAddToCart?: (sp: SanPham) => void;
  onCreateOrder?: (sp: SanPham) => void;
  onProduceOrder?: (sp: SanPham) => void;
  onEdit?: (sp: SanPham) => void;
  onDelete?: (sp: SanPham) => void;
}

const TRANG_THAI_LABELS: Record<string, { label: string; className: string }> = {
  "con-hang": { label: "Sẵn Kho", className: "bg-emerald-500/90 text-white border-emerald-400" },
  "het-hang": { label: "Hết Hàng", className: "bg-rose-500/90 text-white border-rose-400" },
  "sap-ve": { label: "Sắp Về", className: "bg-amber-500/90 text-white border-amber-400" },
  "ngung-kinh-doanh": { label: "Ngừng KD", className: "bg-slate-700/90 text-white border-slate-600" },
};

export default function ProductDetailModal({ sp, tonKhoTheoMau, onClose, onAddToCart, onCreateOrder, onProduceOrder, onEdit, onDelete }: ProductDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tongTonKho = useMemo(() => {
    if (!tonKhoTheoMau) return 0;
    return Object.values(tonKhoTheoMau).reduce((sum, tonMau) => sum + tonMau.reduce((s, row) => s + (row.sl || 0), 0), 0);
  }, [tonKhoTheoMau]);

  const trangThai = useMemo(() => {
    if (!sp) return "con-hang";
    if (tonKhoTheoMau && tongTonKho <= 0) return "het-hang";
    return sp.trangThai || "con-hang";
  }, [tonKhoTheoMau, tongTonKho, sp]);

  if (!sp) return null;

  const soSize = (sp.bangSize?.sizes || []).length;
  const soMau = (sp.dsMau || []).length;
  const trangThaiInfo = TRANG_THAI_LABELS[trangThai] || TRANG_THAI_LABELS["con-hang"];
  const loaiInfoLabel = LOAI_SP_LABELS[sp.loaiSP] || sp.loaiSP;
  const laHot = sp.id.endsWith("3") || sp.id.endsWith("7") || (sp.daBan && sp.daBan > 1000);

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const mainImage = sp.dsMau?.[0]?.img || sp.hinhAnh || "";
  const [selectedImage, setSelectedImage] = useState(mainImage);
  const [selectedVideo, setSelectedVideo] = useState(sp.dsMau?.find(m => m.img === selectedImage)?.video || sp.dsMau?.[0]?.video || "");
  const [viewingMode, setViewingMode] = useState<"video" | "image">(selectedVideo ? "video" : "image");
  const [showFullScreen, setShowFullScreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fsVideoRef = useRef<HTMLVideoElement>(null);
  const selectedColor = sp.dsMau?.[selectedColorIndex];

  if (!mounted) return null;

  return (
    <>
    <ResponsiveModal
      open={true}
      onClose={() => {
        if (videoRef.current) { videoRef.current.pause(); }
        onClose();
      }}
      maxWidth="5xl"
      className="bg-slate-50 overflow-hidden shadow-2xl border-0"
    >
      <div className="w-full flex flex-col md:flex-row min-h-[70vh] md:h-[85vh]">
        
        {/* === TRÁI: KHU VỰC HÌNH ẢNH (CLEAN & SHARP) === */}
        <div className="w-full aspect-[4/5] max-h-[60vh] min-h-[350px] md:aspect-auto md:max-h-none md:h-auto md:w-5/12 relative flex flex-col bg-slate-50 border-r border-slate-100 shrink-0 overflow-hidden">
          
          {/* Main Viewer Area (Full Khung) */}
          <div className="relative w-full flex-1 flex items-center justify-center group overflow-hidden bg-slate-100/50">
            {viewingMode === "video" && selectedVideo ? (
              <video ref={videoRef} src={selectedVideo} autoPlay loop muted playsInline controls className="absolute inset-0 w-full h-full object-cover" />
            ) : selectedImage ? (
              <div className="absolute inset-0 w-full h-full cursor-zoom-in" onClick={() => setShowFullScreen(true)}>
                <img src={selectedImage} alt={sp.tenSP} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                    <Maximize2 className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 drop-shadow-lg" />
                </div>
              </div>
            ) : (
               <Shirt className="w-24 h-24 text-slate-300" />
            )}

            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20 pointer-events-none">
              <span className={`px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-full shadow-md backdrop-blur-md ${trangThaiInfo.className}`}>
                {trangThaiInfo.label}
              </span>
              {!!laHot && (
                <span className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black tracking-widest uppercase rounded-full shadow-md flex items-center gap-1 w-fit">
                  <Flame className="w-3 h-3" /> Bán Chạy
                </span>
              )}
            </div>
            
            {/* Overlay Hết Hàng */}
            {trangThai === "het-hang" && (
              <div className="absolute inset-0 bg-slate-100/60 backdrop-blur-sm z-30 flex items-center justify-center pointer-events-none">
                 <div className="bg-rose-600 text-white font-black text-2xl tracking-[0.2em] px-8 py-2 border-y-4 border-rose-700 -rotate-12 uppercase shadow-xl">
                   Hết Hàng
                 </div>
              </div>
            )}
          </div>

          {/* Media Toggle Button */}
          {selectedVideo && selectedImage && (
             <div className="absolute bottom-[100px] left-0 right-0 flex justify-center z-20 pointer-events-none">
               <button 
                  onClick={(e) => {
                     e.stopPropagation();
                     if (viewingMode === "video" && videoRef.current) videoRef.current.pause();
                     setViewingMode(prev => prev === "video" ? "image" : "video");
                  }}
                  className="px-5 py-2.5 bg-slate-900/80 hover:bg-black backdrop-blur-md text-white rounded-full shadow-xl text-sm font-bold transition-all flex items-center gap-2 pointer-events-auto"
               >
                  {viewingMode === "video" ? <ImageIcon className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                  {viewingMode === "video" ? "Xem Ảnh Chụp" : "Xem Video"}
               </button>
             </div>
          )}

          {/* Color Variants Switcher (Desktop: Floating Circular Thumbnails) */}
          <div className="hidden md:flex absolute bottom-6 left-0 right-0 z-20 pointer-events-none justify-center">
             <div className="flex justify-center gap-3 overflow-x-auto px-4 pb-2 pointer-events-auto scrollbar-hide max-w-full">
                {sp.dsMau?.map((m, i) => (
                   <div 
                     key={i} 
                     onClick={() => {
                       setSelectedColorIndex(i);
                       if (m.img) setSelectedImage(m.img);
                       if (videoRef.current) videoRef.current.pause();
                       setSelectedVideo(m.video || "");
                       setViewingMode(m.video ? "video" : "image");
                     }}
                     className={`w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-full cursor-pointer transition-all overflow-hidden relative flex items-center justify-center bg-white shadow-xl ${selectedColorIndex === i ? "border-[3px] border-white ring-2 ring-black/20 scale-110" : "border-2 border-white/80 hover:scale-110 hover:border-white"}`}
                     title={m.ten}
                   >
                     {m.img ? (
                       <img src={m.img} alt={m.ten} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full" style={{ background: m.ten === "Đen" ? "#1f2937" : m.ten === "Trắng" ? "#f9fafb" : m.ten?.toLowerCase().includes("xanh") ? "#0891b2" : m.ten?.toLowerCase().includes("đỏ") || m.ten?.toLowerCase().includes("hồng") ? "#ec4899" : m.ten?.toLowerCase().includes("vàng") || m.ten?.toLowerCase().includes("be") ? "#f59e0b" : "#9ca3af" }} />
                     )}
                   </div>
                ))}
             </div>
          </div>
          
          {/* Color Variants Switcher (Mobile: Strip Below Image) */}
          <div className="md:hidden flex gap-3 overflow-x-auto px-4 py-3 bg-white border-t border-slate-100 scrollbar-hide shrink-0 z-20 shadow-sm relative">
                {sp.dsMau?.map((m, i) => (
                   <div 
                     key={i} 
                     onClick={() => {
                       setSelectedColorIndex(i);
                       if (m.img) setSelectedImage(m.img);
                       if (videoRef.current) videoRef.current.pause();
                       setSelectedVideo(m.video || "");
                       setViewingMode(m.video ? "video" : "image");
                     }}
                     className={`w-12 h-12 shrink-0 rounded-full cursor-pointer transition-all overflow-hidden relative flex items-center justify-center bg-white shadow-sm ${selectedColorIndex === i ? "border-2 border-cyan-500 ring-2 ring-cyan-500/20 scale-110" : "border border-slate-200"}`}
                     title={m.ten}
                   >
                     {m.img ? (
                       <img src={m.img} alt={m.ten} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full" style={{ background: m.ten === "Đen" ? "#1f2937" : m.ten === "Trắng" ? "#f9fafb" : m.ten?.toLowerCase().includes("xanh") ? "#0891b2" : m.ten?.toLowerCase().includes("đỏ") || m.ten?.toLowerCase().includes("hồng") ? "#ec4899" : m.ten?.toLowerCase().includes("vàng") || m.ten?.toLowerCase().includes("be") ? "#f59e0b" : "#9ca3af" }} />
                     )}
                   </div>
                ))}
          </div>

          {/* Close Button Mobile */}
          <button onClick={() => { if (videoRef.current) videoRef.current.pause(); onClose(); }} className="md:hidden absolute top-4 right-4 z-40 w-9 h-9 bg-white/90 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow border border-slate-200 transition-colors pointer-events-auto">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* === PHẢI: KHU VỰC THÔNG TIN (CLEAN & ELEGANT) === */}
        <div className="w-full md:w-7/12 flex flex-col h-full bg-slate-50 relative overflow-hidden">
          
          {/* Header */}
          <div className="p-6 md:p-8 shrink-0 z-10 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-black tracking-wider text-cyan-700 bg-cyan-100/50 border border-cyan-200 px-3 py-1 rounded-full">{sp.id}</span>
                  <span className="text-xs font-bold text-slate-500 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full uppercase tracking-wider">{loaiInfoLabel}</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-[1.15] tracking-tight">{sp.tenSP}</h2>
              </div>
              <button onClick={() => { if (videoRef.current) videoRef.current.pause(); onClose(); }} className="hidden md:flex p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-colors">
                <X className="w-7 h-7" />
              </button>
            </div>
            
            {/* Stats Row */}
            <div className="flex flex-wrap gap-3 mt-5">
               <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                 <Eye className="w-3.5 h-3.5 text-slate-400" /> {(sp.luotXem || 0).toLocaleString()}
               </div>
               <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                 <ShoppingCart className="w-3.5 h-3.5 text-slate-400" /> {(sp.daBan || 0).toLocaleString()} đã bán
               </div>
               <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                 <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {sp.rating || "5.0"}
               </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-8 bg-slate-50/50">
            
            {/* Price Chips (Glassmorphism inspired) */}
            <div>
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Bảng Giá</div>
              <div className="flex md:flex-wrap gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
                <DetailPriceChip label="Bán lẻ" price={sp.giaBanLe} bgClass="bg-gradient-to-br from-white to-amber-50 border-amber-200 text-amber-700 shadow-sm" icon="🛍️" />
                <DetailPriceChip label="Bán sỉ" price={sp.giaBanSi} bgClass="bg-gradient-to-br from-white to-blue-50 border-blue-200 text-blue-700 shadow-sm" icon="📦" />
                <DetailPriceChip label="Bán lô" price={sp.giaBanLo} bgClass="bg-gradient-to-br from-white to-purple-50 border-purple-200 text-purple-700 shadow-sm" icon="🏭" />
                <DetailPriceChip label="TikTok" price={sp.giaTikTok} bgClass="bg-gradient-to-br from-white to-rose-50 border-rose-200 text-rose-700 shadow-sm" icon="🎵" />
                <DetailPriceChip label="Shopee" price={sp.giaShopee} bgClass="bg-gradient-to-br from-white to-orange-50 border-orange-200 text-orange-700 shadow-sm" icon="🛒" />

                {!sp.giaBanLe && !sp.giaBanSi && !sp.giaBanLo && !sp.giaTikTok && !sp.giaShopee && sp.giaBanDuKien ? (
                  <DetailPriceChip label="Giá dự kiến" price={sp.giaBanDuKien} bgClass="bg-white border-slate-200 text-slate-700 shadow-sm" icon="⏱️" />
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thông số cơ bản */}
              <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200/60 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Chất liệu</div>
                    <div className="font-extrabold text-slate-800">{sp.chatLieu || "Cotton Cao Cấp"}</div>
                  </div>
                </div>
                <div className="h-px bg-slate-100 w-full" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-teal-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kho hàng</div>
                    <div className="font-extrabold text-slate-800">{sp.trangThai === "con-hang" ? "Sẵn sàng giao" : "Cần sản xuất"}</div>
                  </div>
                </div>
                <div className="h-px bg-slate-100 w-full" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nguồn gốc</div>
                    <div className="font-extrabold text-slate-800">{sp.ncc || "Sản xuất Nội bộ"}</div>
                  </div>
                </div>
              </div>

              {/* Thông số Size */}
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-[24px] p-6 shadow-sm border border-slate-200/60 flex flex-col">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">Thông số Size & Tỉ lệ</div>
                <div className="flex flex-wrap gap-4 items-center justify-center flex-1">
                  {sp.bangSize?.sizes.map((s, idx) => (
                    <div key={s} className="flex flex-col items-center group">
                      <div className="w-14 h-14 rounded-[16px] bg-white border-2 border-slate-200 flex items-center justify-center font-black text-xl text-slate-700 shadow-sm transition-all group-hover:border-cyan-400 group-hover:text-cyan-600 group-hover:-translate-y-1 mb-2">
                        {s}
                      </div>
                      <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 group-hover:bg-cyan-50 group-hover:text-cyan-600 group-hover:border-cyan-200 transition-colors">
                        TL: {sp.bangSize?.ratios[idx]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Colors List */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Màu sắc & Phân loại ({soMau})</div>
                {onEdit && (
                  <button onClick={() => onEdit(sp)} className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-full transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Thêm màu
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sp.dsMau?.map((m, idx) => {
                  const isSelected = selectedColorIndex === idx;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => {
                        setSelectedColorIndex(idx);
                        if (m.img) setSelectedImage(m.img);
                        setSelectedVideo(m.video || "");
                      }}
                      className={`group flex gap-4 p-3 rounded-[20px] items-center cursor-pointer transition-all duration-300 border-2 ${
                        isSelected 
                          ? 'bg-cyan-50/50 border-cyan-400 shadow-[0_4px_20px_-4px_rgba(6,182,212,0.25)]' 
                          : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center relative">
                        {m.img ? (
                          <img src={m.img} alt={m.ten} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <Shirt className="w-8 h-8 text-slate-300" />
                        )}
                        {m.video && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <PlayCircle className="w-6 h-6 text-white drop-shadow-md" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <div className={`font-extrabold text-lg truncate ${isSelected ? 'text-cyan-900' : 'text-slate-700'}`}>{m.ten}</div>
                        <div className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">{m.maSKU || "SKU-???"}</div>
                        <div className="text-sm font-semibold text-slate-500 mt-2 flex items-center gap-1.5">
                          Định mức: <span className={isSelected ? 'text-cyan-700 font-bold' : 'text-slate-700'}>{m.dinhMuc || 0} kg</span>
                        </div>
                      </div>
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-100'}`}>
                         <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            {sp.ghiChu && (
              <div className="bg-amber-50 text-amber-800 p-5 rounded-[20px] text-sm border border-amber-200/60 shadow-inner">
                <span className="font-black uppercase tracking-wider text-[11px] block mb-1 opacity-70">Ghi chú sản phẩm</span> 
                <span className="font-medium leading-relaxed">{sp.ghiChu}</span>
              </div>
            )}
            
            <div className="h-6"></div> {/* Bottom Padding */}
          </div>

          {/* Footer CTAs */}
          <div className="p-4 md:p-5 border-t border-slate-200 bg-white shrink-0 z-20 flex flex-col md:flex-row gap-3 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] relative">
            {/* Hàng 1 trên Mobile / Khối trái trên Desktop */}
            <div className="flex gap-2 w-full md:w-auto">
              {onDelete && (
                <button 
                  onClick={() => onDelete(sp)}
                  className="flex-1 md:flex-none px-5 py-3 md:py-4 rounded-[14px] md:rounded-[18px] font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-500 transition-all flex items-center justify-center"
                  title="Xóa sản phẩm"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {onEdit && (
                <button 
                  onClick={() => onEdit(sp)}
                  className="flex-1 md:flex-none px-6 py-3 md:py-4 rounded-[14px] md:rounded-[18px] font-bold text-slate-600 hover:text-white bg-slate-100 hover:bg-slate-800 transition-all flex items-center justify-center"
                >
                  Sửa SP
                </button>
              )}
            </div>
            
            {/* Hàng 2 trên Mobile / Khối phải trên Desktop */}
            <div className="flex-1 grid grid-cols-3 gap-2 md:gap-3 w-full">
              <button 
                onClick={() => onAddToCart && onAddToCart(sp)}
                className="group bg-slate-800 hover:bg-slate-900 text-white py-3 md:py-4 rounded-[14px] md:rounded-[18px] font-extrabold text-[12px] md:text-base shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
              >
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                <span className="leading-tight">Giỏ Hàng</span>
              </button>
              <button 
                onClick={() => onCreateOrder && onCreateOrder(sp)}
                className="group bg-sky-500 hover:bg-sky-600 text-white py-3 md:py-4 rounded-[14px] md:rounded-[18px] font-extrabold text-[12px] md:text-base shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
              >
                <FileText className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                <span className="leading-tight">Tạo Đơn</span>
              </button>
              <button 
                onClick={() => onProduceOrder && onProduceOrder(sp)}
                className="group bg-emerald-500 hover:bg-emerald-600 text-white py-3 md:py-4 rounded-[14px] md:rounded-[18px] font-extrabold text-[12px] md:text-base shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2"
              >
                <Package className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                <span className="leading-tight">Đặt SX</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveModal>
    
    {/* Full Screen Viewer (Premium Minimal) */}
    {showFullScreen && typeof document !== "undefined" && createPortal(
      <div className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in" onClick={() => {
        if (fsVideoRef.current) fsVideoRef.current.pause();
        setShowFullScreen(false);
      }}>
        <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full flex items-center justify-center transition-all z-20 hover:scale-110" onClick={() => {
          if (fsVideoRef.current) fsVideoRef.current.pause();
          setShowFullScreen(false);
        }}>
          <X className="w-6 h-6" />
        </button>
        <div className="w-full h-full max-w-7xl max-h-screen p-4 md:p-12 flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
          {selectedVideo ? (
            <video ref={fsVideoRef} src={selectedVideo} controls autoPlay className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain bg-black ring-1 ring-white/10" />
          ) : (
            <img src={selectedImage} alt="Full view" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain ring-1 ring-white/10" />
          )}
        </div>
      </div>,
      document.body
    )}
    </>
  );
}

function DetailPriceChip({ label, price, bgClass, icon }: { label: string; price?: number; bgClass: string; icon: string }) {
  const [show, setShow] = useState(false);
  
  if (!price) return null;
  
  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        setShow(!show);
      }}
      className={`relative group px-4 py-3 rounded-[16px] min-w-[110px] text-left transition-all duration-300 border cursor-pointer overflow-hidden ${
        show ? bgClass : 'bg-white border-slate-200 hover:border-slate-300 text-slate-500 hover:shadow-md'
      }`}
    >
      {show && <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />}
      <div className="flex items-center gap-1.5 mb-1 relative z-10">
        <span className="text-sm">{icon}</span>
        <div className={`text-[10px] font-black uppercase tracking-wider ${show ? 'opacity-80' : 'text-slate-400'}`}>{label}</div>
      </div>
      <div className={`text-lg font-black tracking-tight relative z-10 ${show ? '' : 'text-slate-300'}`}>
        {show ? `${formatVNDShort(price)}đ` : '*** đ'}
      </div>
    </button>
  );
}

