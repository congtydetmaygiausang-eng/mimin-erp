// ============ PRODUCT GRID VIEW ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)

import type { RefObject } from "react";
import { Box, Edit, Trash2, Truck, Eye, Plus, Camera, Video, Package } from "lucide-react";
import type { SanPhamTP } from "../data";

interface ProductGroup {
  maSP: string;
  tenSP: string;
  items: SanPhamTP[];
}

interface ProductGridProps {
  groups: ProductGroup[];
  productImages: Record<string, string>;
  productVideos: Record<string, string>;
  setUploadingSP: (id: string | null) => void;
  setUploadType: (t: "image" | "video") => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  setViewingImage: (s: string | null) => void;
  setShowAdd: (v: boolean) => void;
  setShowMasterDetails: (maSP: string | null) => void;
  setEditing: (s: SanPhamTP | null) => void;
  handleXuatKho: (id: string) => void;
  update: (newDs: SanPhamTP[]) => void;
  dsSanPham: SanPhamTP[];
}

export function ProductGrid({ groups, productImages, productVideos, setUploadingSP, setUploadType, fileInputRef, setViewingImage, setShowAdd, setShowMasterDetails, setEditing, handleXuatKho, update, dsSanPham }: ProductGridProps) {
  return (
    <div className="flex flex-col gap-8">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={() => {}} />
      {groups.map(group => {
        const totalQty = group.items.reduce((s, x) => s + x.soLuong, 0);
        const totalValue = group.items.reduce((s, x) => s + x.giaTri, 0);
        const priceRange = Array.from(new Set(group.items.map(x => x.donGia)));
        const priceDisplay = priceRange.length === 1 ? priceRange[0].toLocaleString() : `${Math.min(...priceRange).toLocaleString()} - ${Math.max(...priceRange).toLocaleString()}`;

        return (
          <div key={group.maSP} className="bg-white rounded-2xl shadow-sm border-2 border-emerald-500 overflow-hidden flex flex-col">
            {/* Header: Khung vùng xanh lá */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-4 md:p-6 text-white flex flex-col md:flex-row gap-6 items-stretch rounded-t-2xl">

              {/* Left: Big Cover Image & Video */}
              <div className="flex gap-3 flex-shrink-0 w-full md:w-[420px] h-[240px] md:h-auto">

                {/* ẢNH BÌA */}
                <div
                  className="flex-1 bg-black/20 rounded-xl relative overflow-hidden group border border-white/20 shadow-inner"
                  onClick={() => {
                    if (productImages[group.maSP]) {
                      setViewingImage(productImages[group.maSP]);
                    } else {
                      setUploadingSP(group.maSP); setUploadType("image"); fileInputRef.current?.click();
                    }
                  }}
                  title={productImages[group.maSP] ? "Nhấn để tải ảnh về" : "Nhấn để tải ảnh lên"}
                >
                  {productImages[group.maSP] && (
                    <button
                      className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/90 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110 shadow-lg"
                      onClick={(e) => { e.stopPropagation(); setUploadingSP(group.maSP); setUploadType("image"); fileInputRef.current?.click(); }}
                      title="Thay đổi ảnh bìa"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}

                  {productImages[group.maSP] ? (
                    <img src={productImages[group.maSP]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer" alt={group.tenSP} />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                      <Camera className="w-10 h-10 mb-3 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                      <span className="text-sm font-bold uppercase tracking-widest opacity-80 text-center leading-tight">Ảnh bìa<br/>chính</span>
                    </div>
                  )}
                </div>

                {/* VIDEO */}
                <div
                  className="w-[35%] bg-black/20 rounded-xl relative overflow-hidden group border border-white/20 shadow-inner flex-shrink-0"
                  onClick={() => {
                    if (!productVideos[group.maSP]) {
                      setUploadingSP(group.maSP); setUploadType("video"); fileInputRef.current?.click();
                    }
                  }}
                  title={productVideos[group.maSP] ? "Nhấn để xem hoặc tải video về" : "Nhấn để tải video lên"}
                >
                  {productVideos[group.maSP] && (
                    <button
                      className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/90 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110 shadow-lg"
                      onClick={(e) => { e.stopPropagation(); setUploadingSP(group.maSP); setUploadType("video"); fileInputRef.current?.click(); }}
                      title="Thay đổi video"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  )}

                  {productVideos[group.maSP] ? (
                    <video src={productVideos[group.maSP]} className="w-full h-full object-contain bg-black/40" controls playsInline />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                      <Video className="w-8 h-8 mb-3 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 text-center leading-tight">Video<br/>SP</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle & Right: Info, Stats, Buttons */}
              <div className="flex-1 flex flex-col justify-between py-1">
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                  {/* Title */}
                  <div>
                    <div className="inline-flex items-center justify-center px-3 py-1 bg-white/20 rounded-md text-[11px] font-bold uppercase tracking-wider mb-2 backdrop-blur border border-white/10 shadow-sm">{group.maSP || "CHƯA CÓ MÃ"}</div>
                    <h2 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight drop-shadow-sm">{group.tenSP || "Sản phẩm mới"}</h2>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 flex-wrap xl:justify-end shrink-0">
                    <button onClick={() => setShowMasterDetails(group.maSP || "NO_CODE")} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur text-white transition-all text-sm font-semibold flex items-center gap-2 shadow-sm border border-white/10 hover:scale-105" title="Xem chi tiết">
                      <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Chi tiết</span>
                    </button>
                    <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur text-white transition-all text-sm font-semibold flex items-center gap-2 shadow-sm border border-white/10 hover:scale-105" title="Thêm đơn hàng">
                      <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Thêm đơn</span>
                    </button>
                    <button onClick={() => alert('Chức năng sửa tổng')} className="px-4 py-2 bg-amber-500/90 hover:bg-amber-500 rounded-xl backdrop-blur text-white transition-all text-sm font-bold flex items-center gap-2 shadow-md border border-amber-400/50 hover:scale-105" title="Sửa tổng">
                      <Edit className="w-4 h-4" /> <span className="hidden sm:inline">Sửa tổng</span>
                    </button>
                    <button onClick={() => { if(confirm('Xóa toàn bộ sản phẩm này?')) update(dsSanPham.filter(s => s.maSP !== group.maSP)); }} className="p-2 bg-rose-500/80 hover:bg-rose-500 rounded-xl backdrop-blur text-white transition-all shadow-md hover:scale-105" title="Xóa toàn bộ sản phẩm">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                  <div className="bg-black/15 rounded-xl p-4 backdrop-blur border border-white/10 shadow-inner hover:bg-black/20 transition-colors">
                    <div className="text-xs text-emerald-100 uppercase font-bold tracking-wider mb-1.5 opacity-90">Tổng số lượng</div>
                    <div className="text-3xl font-black drop-shadow-sm">{totalQty.toLocaleString()}</div>
                  </div>
                  <div className="bg-black/15 rounded-xl p-4 backdrop-blur border border-white/10 shadow-inner hover:bg-black/20 transition-colors">
                    <div className="text-xs text-emerald-100 uppercase font-bold tracking-wider mb-1.5 opacity-90">Giá bán</div>
                    <div className="text-3xl font-bold drop-shadow-sm">{priceDisplay}đ</div>
                  </div>
                  <div className="bg-black/15 rounded-xl p-4 backdrop-blur border border-white/10 shadow-inner hover:bg-black/20 transition-colors">
                    <div className="text-xs text-emerald-100 uppercase font-bold tracking-wider mb-1.5 opacity-90">Tổng giá trị</div>
                    <div className="text-3xl font-bold drop-shadow-sm">{(totalValue/1000).toFixed(0)}K</div>
                  </div>
                  <div className="bg-black/15 rounded-xl p-4 backdrop-blur border border-white/10 shadow-inner hover:bg-black/20 transition-colors">
                    <div className="text-xs text-emerald-100 uppercase font-bold tracking-wider mb-1.5 opacity-90">Kiện biến thể</div>
                    <div className="text-3xl font-bold drop-shadow-sm">{group.items.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Body: Danh sách biến thể */}
            <div className="p-4 md:p-5 bg-slate-50 flex-1">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Chi tiết biến thể
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {group.items.map(s => (
                  <VariantCard
                    key={s.id}
                    sp={s}
                    image={productImages[s.id]}
                    onUploadImage={() => { setUploadingSP(s.id); setUploadType("image"); fileInputRef.current?.click(); }}
                    onEdit={() => setEditing(s)}
                    onXuatKho={() => handleXuatKho(s.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VariantCard({ sp, image, onUploadImage, onEdit, onXuatKho }: { sp: SanPhamTP; image?: string; onUploadImage: () => void; onEdit: () => void; onXuatKho: () => void }) {
  return (
    <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm relative group hover:border-amber-400 hover:shadow-md transition-all flex gap-3">
      <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-slate-200" onClick={(e) => { e.stopPropagation(); onUploadImage(); }}>
        {image ? (
          <img src={image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 group-hover:text-amber-500 transition-colors">
            <Camera className="w-5 h-5 opacity-60" />
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-1">
          <div>
            <div className="font-bold text-sm text-slate-800">{sp.mau}</div>
            <div className="text-xs text-slate-500 font-semibold">{sp.size}</div>
          </div>
          <div className="text-right">
            <div className="font-black text-amber-600 text-lg leading-none">{sp.soLuong.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">{sp.lsx}</div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            {sp.trangThai === "con" && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] rounded font-bold w-fit">Còn</span>}
            {sp.trangThai === "dat-hang" && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] rounded font-bold w-fit">Đang sản xuất</span>}
            {sp.trangThai === "xuat-kho" && <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[9px] rounded font-bold w-fit">Đã xuất</span>}
            {sp.trangThai === "khong-dat" && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] rounded font-bold w-fit">Không đặt</span>}
            <span className="text-[9px] font-semibold text-slate-500 flex items-center gap-0.5"><Box className="w-2.5 h-2.5" /> {sp.viTri}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 hover:bg-amber-100 text-amber-600 rounded" title="Sửa">
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onXuatKho(); }} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded" title="Xuất kho">
              <Truck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
