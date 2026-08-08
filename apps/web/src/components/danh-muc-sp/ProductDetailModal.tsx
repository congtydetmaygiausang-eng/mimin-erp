import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Shirt, Flame, Eye, ShoppingCart, Tag, Package, Star, ShieldCheck, MapPin, Maximize2, PlayCircle, Plus, Image as ImageIcon } from "lucide-react";
import type { SanPham } from "@/lib/data/danh-muc-sp-store";
import { formatVNDShort } from "@/lib/data/real-data";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";

interface ProductDetailModalProps {
  sp: SanPham | null;
  onClose: () => void;
  onAddToCart?: (sp: SanPham) => void;
  onEdit?: (sp: SanPham) => void;
  onDelete?: (sp: SanPham) => void;
}

const TRANG_THAI_LABELS: Record<string, { label: string; className: string }> = {
  "con-hang": { label: "Còn hàng", className: "bg-emerald-500 text-white" },
  "het-hang": { label: "Hết hàng", className: "bg-rose-500 text-white" },
  "sap-ve": { label: "Sắp về", className: "bg-amber-500 text-white" },
  "ngung-kinh-doanh": { label: "Ngừng KD", className: "bg-slate-500 text-white" },
};

export default function ProductDetailModal({ sp, onClose, onAddToCart, onEdit, onDelete }: ProductDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!sp) return null;

  const soSize = (sp.bangSize?.sizes || []).length;
  const soMau = (sp.dsMau || []).length;
  const trangThaiInfo = TRANG_THAI_LABELS[sp.trangThai || "con-hang"] || TRANG_THAI_LABELS["con-hang"];
  const loaiInfoLabel = LOAI_SP_LABELS[sp.loaiSP] || sp.loaiSP;
  const laHot = sp.id.endsWith("3") || sp.id.endsWith("7") || (sp.daBan && sp.daBan > 1000);

  const [selectedImage, setSelectedImage] = useState(sp.hinhAnh || sp.dsMau?.[0]?.img || "");
  const [selectedVideo, setSelectedVideo] = useState(sp.dsMau?.find(m => m.img === selectedImage)?.video || sp.dsMau?.[0]?.video || "");
  const [viewingMode, setViewingMode] = useState<"video" | "image">(selectedVideo ? "video" : "image");
  const [showFullScreen, setShowFullScreen] = useState(false);

  if (!mounted) return null;

  return createPortal(
    <>
    <div className="fixed inset-0 z-[120] flex items-start justify-center p-4 pt-16 md:p-8 md:pt-20 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col md:flex-row animate-slide-up my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Left: Image Panel */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-cyan-50 to-teal-50 relative flex flex-col justify-center items-center min-h-[300px] border-b md:border-b-0 md:border-r border-slate-200">
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            <span className={`px-3 py-1 text-xs font-bold rounded-lg shadow ${trangThaiInfo.className}`}>
              {trangThaiInfo.label}
            </span>
            {laHot && (
              <span className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg shadow uppercase flex items-center gap-1 w-fit">
                <Flame className="w-4 h-4" /> Bán chạy
              </span>
            )}
          </div>
          
          {viewingMode === "video" && selectedVideo ? (
            <div className="w-full h-full flex-1 group relative overflow-hidden bg-black flex items-center justify-center">
              <video src={selectedVideo} autoPlay loop muted playsInline controls className="w-full h-full object-contain absolute inset-0" />
            </div>
          ) : selectedImage ? (
            <div className="w-full h-full flex-1 group relative cursor-pointer overflow-hidden bg-slate-100" onClick={() => setShowFullScreen(true)}>
              <img src={selectedImage} alt={sp.tenSP} className="w-full h-full object-cover object-top absolute inset-0" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <Maximize2 className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg transition-opacity" />
              </div>
            </div>
          ) : (
            <Shirt className="w-40 h-40 text-cyan-200" />
          )}

          {/* Toggle Button if both exist */}
          {selectedVideo && selectedImage && (
             <button 
                onClick={(e) => {
                   e.stopPropagation();
                   setViewingMode(prev => prev === "video" ? "image" : "video");
                }}
                className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow hover:bg-white text-sm font-semibold flex items-center gap-1.5 text-cyan-700 transition-colors"
             >
                {viewingMode === "video" ? <ImageIcon className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                {viewingMode === "video" ? "Xem Ảnh" : "Xem Video"}
             </button>
          )}

          <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 px-4 z-10">
             {sp.dsMau?.map((m, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    if (m.img) setSelectedImage(m.img);
                    setSelectedVideo(m.video || "");
                    setViewingMode(m.video ? "video" : "image");
                  }}
                  className={`w-6 h-6 rounded-full border-2 ${selectedImage === m.img ? "border-emerald-500 scale-125" : "border-white"} shadow-md cursor-pointer hover:scale-110 transition-transform`}
                  style={{ background: m.ten === "Đen" ? "#1f2937" : m.ten === "Trắng" ? "#f9fafb" : m.ten?.toLowerCase().includes("xanh") ? "#0891b2" : m.ten?.toLowerCase().includes("đỏ") || m.ten?.toLowerCase().includes("hồng") ? "#ec4899" : m.ten?.toLowerCase().includes("vàng") || m.ten?.toLowerCase().includes("be") ? "#f59e0b" : "#9ca3af" }}
                  title={m.ten}
                />
             ))}
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="w-full md:w-7/12 flex flex-col h-full md:max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-white shrink-0 z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">{sp.id}</span>
                <span className="text-xs font-semibold text-slate-500 px-2 py-0.5 bg-slate-100 rounded">{loaiInfoLabel}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 leading-tight">{sp.tenSP}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 flex-1 space-y-6 overflow-y-auto min-h-0">
            
            {/* Price & Stats Row */}
            <div className="flex flex-wrap gap-6 items-end">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Giá bán dự kiến</div>
                <div className="text-3xl font-extrabold text-cyan-600">
                  {formatVNDShort(sp.giaBanDuKien)}<span className="text-base text-cyan-700 font-bold ml-1">VNĐ</span>
                </div>
              </div>
              <div className="flex gap-4 pb-1">
                 <div className="flex items-center gap-1 text-sm font-semibold text-slate-600">
                   <Eye className="w-4 h-4 text-slate-400" /> {(sp.luotXem || 0).toLocaleString()}
                 </div>
                 <div className="flex items-center gap-1 text-sm font-semibold text-slate-600">
                   <ShoppingCart className="w-4 h-4 text-slate-400" /> {(sp.daBan || 0).toLocaleString()} đã bán
                 </div>
                 <div className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                   <Star className="w-4 h-4 fill-amber-500" /> {sp.rating || "5.0"}
                 </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full shrink-0" />

            {/* Spec Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm shrink-0">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 w-24 shrink-0">Phân loại:</span>
                <span className="font-semibold text-slate-800 truncate">{loaiInfoLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 w-24 shrink-0">Chất liệu:</span>
                <span className="font-semibold text-slate-800 truncate">{sp.chatLieu || "Cotton cao cấp"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 w-24 shrink-0">Nhà cung cấp:</span>
                <span className="font-semibold text-slate-800 truncate">{sp.ncc || "Nội bộ"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 w-24 shrink-0">Kho hàng:</span>
                <span className="font-semibold text-slate-800 truncate">{sp.trangThai === "con-hang" ? "Sẵn kho" : "Hết"}</span>
              </div>
            </div>

            {/* Sizes & Ratio */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shrink-0">
              <div className="text-xs font-bold text-slate-500 uppercase mb-3">Thông số Size & Tỉ lệ cắt</div>
              <div className="flex items-center gap-4 flex-wrap">
                {sp.bangSize?.sizes.map((s, idx) => (
                  <div key={s} className="flex flex-col items-center">
                    <span className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 shadow-sm mb-1">{s}</span>
                    <span className="text-xs font-bold text-cyan-600">{sp.bangSize?.ratios[idx]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="shrink-0">
              <div className="text-xs font-bold text-slate-500 uppercase mb-3">Màu sắc tiêu chuẩn ({soMau})</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sp.dsMau?.map((m, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      if (m.img) setSelectedImage(m.img);
                      setSelectedVideo(m.video || "");
                    }}
                    className={`flex gap-4 p-3 border rounded-xl items-center shadow-sm cursor-pointer transition-colors ${selectedImage === m.img ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                  >
                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                      {m.img ? (
                        <img src={m.img} className="w-full h-full object-cover" />
                      ) : (
                        <Shirt className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-700 truncate">{m.ten}</div>
                      <div className="text-xs font-mono text-cyan-600 mt-0.5">{m.maSKU || "-"}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Định mức: <span className="font-bold">{m.dinhMuc || 0} kg</span>
                      </div>
                    </div>
                    {m.video && (
                      <div className="shrink-0 text-emerald-600" title="Có Video">
                        <PlayCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Nút thêm ô hình ảnh / màu sắc mới */}
                {onEdit && (
                  <div 
                    onClick={() => onEdit(sp)}
                    className="flex gap-4 p-3 border-2 border-dashed border-slate-200 rounded-xl items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer transition-colors h-full min-h-[5.5rem]"
                  >
                    <Plus className="w-6 h-6 mb-0.5" />
                    <span className="font-bold text-sm">Thêm ô hình ảnh</span>
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            {sp.ghiChu && (
              <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm border border-amber-200 shrink-0">
                <span className="font-bold">Ghi chú: </span> {sp.ghiChu}
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0 z-10 mt-auto">
            {onDelete && (
              <button 
                onClick={() => onDelete(sp)}
                className="px-4 py-3 rounded-xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 border border-rose-200"
              >
                Xóa
              </button>
            )}
            {onEdit && (
              <button 
                onClick={() => onEdit(sp)}
                className="px-4 py-3 rounded-xl font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 border border-blue-200"
              >
                Sửa
              </button>
            )}
            <button 
              onClick={() => onAddToCart && onAddToCart(sp)}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-xl font-bold shadow-md shadow-cyan-600/20 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" /> Thêm vào Đơn Đặt Hàng
            </button>
          </div>
        </div>
      </div>
    </div>
    
    {/* Full Screen Viewer */}
    {showFullScreen && (
      <div className="fixed inset-0 z-[80] bg-black/95 flex flex-col items-center justify-center animate-fade-in" onClick={() => setShowFullScreen(false)}>
        <button className="absolute top-6 right-6 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10" onClick={() => setShowFullScreen(false)}>
          <X className="w-8 h-8" />
        </button>
        <div className="w-full h-full max-w-6xl max-h-screen p-8 flex flex-col items-center justify-center gap-4" onClick={e => e.stopPropagation()}>
          {selectedVideo ? (
            <video src={selectedVideo} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain bg-black" />
          ) : (
            <img src={selectedImage} alt="Full view" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" />
          )}
          {selectedVideo && (
             <div className="text-white/70 text-sm mt-4">Video chất lượng cao</div>
          )}
        </div>
      </div>
    )}
    </>,
    document.body
  );
}
