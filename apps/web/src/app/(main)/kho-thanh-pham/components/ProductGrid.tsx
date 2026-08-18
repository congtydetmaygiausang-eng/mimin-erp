// ============ PRODUCT GRID VIEW ============
// Bố cục theo kiểu LenhCatCardV2: ảnh lớn bên trái, thông tin + biến thể bên phải.

import type { RefObject } from "react";
import { Box, Edit, Trash2, Truck, Eye, Plus, Camera, Package, Tag, Hash, DollarSign } from "lucide-react";
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
  onDangBan: (group: ProductGroup) => void;
  onOpenVariant: (sp: SanPhamTP) => void;
}

export function ProductGrid({ groups, productImages, setUploadingSP, setUploadType, fileInputRef, setShowAdd, setShowMasterDetails, setEditing, handleXuatKho, update, dsSanPham, onDangBan, onOpenVariant }: ProductGridProps) {
  return (
    <div className="flex flex-col gap-5">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={() => {}} />
      {groups.map(group => {
        const totalQty = group.items.reduce((s, x) => s + x.soLuong, 0);
        const totalValue = group.items.reduce((s, x) => s + x.giaTri, 0);
        const priceRange = Array.from(new Set(group.items.map(x => x.donGia)));
        const priceDisplay = priceRange.length === 1 ? priceRange[0].toLocaleString() : `${Math.min(...priceRange).toLocaleString()} - ${Math.max(...priceRange).toLocaleString()}`;
        const coverImg = productImages[group.maSP];

        return (
          <div key={group.maSP} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">

            {/* LEFT COLUMN: Ảnh bìa chính */}
            <div
              className="w-full md:w-64 lg:w-80 shrink-0 bg-slate-100 border-r border-slate-200 relative min-h-[260px] group cursor-pointer"
              onClick={() => setShowMasterDetails(group.maSP || "NO_CODE")}
              title="Xem chi tiết sản phẩm"
            >
              {coverImg ? (
                <img src={coverImg} alt={group.tenSP} className="w-full h-full object-cover absolute inset-0" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                  <Camera className="w-10 h-10 mb-2" />
                  <span className="font-bold tracking-widest uppercase text-xs text-center">Ảnh bìa<br />chính</span>
                </div>
              )}
              <button
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                onClick={(e) => { e.stopPropagation(); setUploadingSP(group.maSP); setUploadType("image"); fileInputRef.current?.click(); }}
                title="Đổi ảnh bìa"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* RIGHT COLUMN: Info & Biến thể */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
                <div className="cursor-pointer" onClick={() => setShowMasterDetails(group.maSP || "NO_CODE")}>
                  <span className="font-black text-teal-700 font-mono text-lg">{group.maSP || "CHƯA CÓ MÃ"}</span>
                  <h2 className="text-2xl font-black text-slate-800 hover:text-emerald-600 transition-colors">{group.tenSP || "Sản phẩm mới"}</h2>
                </div>

                <div className="flex flex-row sm:flex-col gap-6 sm:gap-2 text-sm text-right shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 flex items-center gap-1 text-xs uppercase font-bold"><Hash className="w-3 h-3" /> Tổng SL</span>
                    <span className="font-black text-lg text-slate-800">{totalQty.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 flex items-center gap-1 text-xs uppercase font-bold"><DollarSign className="w-3 h-3" /> Giá bán</span>
                    <span className="font-black text-lg text-emerald-600">{priceDisplay}đ</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-xs uppercase font-bold">Giá trị</span>
                    <span className="font-black text-lg text-sky-600">{(totalValue / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              </div>

              {/* Biến thể (màu/size) */}
              <div className="p-6 bg-slate-50 flex-1">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Chi tiết biến thể ({group.items.length})
                </div>
                <div className="flex flex-wrap gap-4">
                  {group.items.map(s => (
                    <VariantCard
                      key={s.id}
                      sp={s}
                      image={s.hinhAnh?.[0] || productImages[s.id]}
                      onOpen={() => onOpenVariant(s)}
                      onEdit={() => setEditing(s)}
                      onXuatKho={() => handleXuatKho(s.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-slate-200 bg-white flex gap-2 flex-wrap">
                <button onClick={() => setShowMasterDetails(group.maSP || "NO_CODE")} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-all text-sm font-bold flex items-center gap-1.5" title="Xem chi tiết">
                  <Eye className="w-4 h-4" /> Chi tiết
                </button>
                <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-all text-sm font-bold flex items-center gap-1.5" title="Thêm đơn hàng">
                  <Plus className="w-4 h-4" /> Thêm đơn
                </button>
                <button onClick={() => onDangBan(group)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all text-sm font-bold flex items-center gap-1.5 shadow-sm" title="Đăng bán vào Danh mục sản phẩm">
                  <Tag className="w-4 h-4" /> Đăng bán
                </button>
                <button onClick={() => alert('Chức năng sửa tổng')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-xl text-white transition-all text-sm font-bold flex items-center gap-1.5 shadow-sm" title="Sửa tổng">
                  <Edit className="w-4 h-4" /> Sửa tổng
                </button>
                <button onClick={() => { if (confirm('Xóa toàn bộ sản phẩm này?')) update(dsSanPham.filter(s => s.maSP !== group.maSP)); }} className="p-2.5 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-600 transition-all border border-rose-200 ml-auto" title="Xóa toàn bộ sản phẩm">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VariantCard({ sp, image, onOpen, onEdit, onXuatKho }: { sp: SanPhamTP; image?: string; onOpen: () => void; onEdit: () => void; onXuatKho: () => void }) {
  return (
    <div className="flex flex-col w-44 sm:w-52 group cursor-pointer" onClick={onOpen} title="Xem chi tiết màu">
      <div className="w-full aspect-square rounded-t-xl overflow-hidden border-2 border-slate-200 group-hover:border-emerald-400 transition-colors bg-white relative">
        {image ? (
          <img src={image} alt={sp.mau} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-slate-50">
            <Camera className="w-8 h-8 opacity-60" />
          </div>
        )}
      </div>
      <div className="w-full bg-white border-x-2 border-b-2 border-slate-200 group-hover:border-emerald-400 rounded-b-xl px-3 py-2.5">
        <div className="font-black text-slate-800 text-base truncate">{sp.mau}</div>
        <div className="text-xs text-slate-500 font-bold uppercase mt-0.5">{sp.size}</div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-black text-amber-600 text-lg">{sp.soLuong.toLocaleString()}</span>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 hover:bg-amber-100 text-amber-600 rounded" title="Sửa">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onXuatKho(); }} className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded" title="Xuất kho">
              <Truck className="w-4 h-4" />
            </button>
          </div>
        </div>
        {sp.giaBanLe ? (
          <div className="text-sm font-black text-emerald-600 mt-1">{sp.giaBanLe.toLocaleString()}đ</div>
        ) : null}
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {sp.trangThai === "con" && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded font-bold">Còn</span>}
          {sp.trangThai === "dat-hang" && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-bold">Đang SX</span>}
          {sp.trangThai === "xuat-kho" && <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded font-bold">Đã xuất</span>}
          {sp.trangThai === "khong-dat" && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] rounded font-bold">Không đặt</span>}
        </div>
        <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5 mt-1.5">
          <Box className="w-3 h-3" /> {sp.viTri}
        </div>
      </div>
    </div>
  );
}
