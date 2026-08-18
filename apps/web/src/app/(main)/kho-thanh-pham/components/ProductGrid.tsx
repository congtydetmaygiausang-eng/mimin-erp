// ============ PRODUCT GRID VIEW ============
// Giao diện mới: card biến thể là ảnh phủ full, thông tin overlay ở đáy -
// giống lưới sản phẩm e-commerce. Tông màu trắng/slate/emerald khớp phần còn lại của app.

import type { RefObject } from "react";
import { Box, Edit, Trash2, Truck, Eye, Plus, Camera, Package, Tag, Hash, DollarSign, MapPin } from "lucide-react";
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
    <div className="flex flex-col gap-6">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={() => {}} />
      {groups.map(group => {
        const totalQty = group.items.reduce((s, x) => s + x.soLuong, 0);
        const totalValue = group.items.reduce((s, x) => s + x.giaTri, 0);
        const priceRange = Array.from(new Set(group.items.map(x => x.giaBanLe || x.donGia).filter(Boolean)));
        const priceDisplay = priceRange.length === 0 ? null
          : priceRange.length === 1 ? priceRange[0].toLocaleString()
          : `${Math.min(...priceRange).toLocaleString()} - ${Math.max(...priceRange).toLocaleString()}`;

        return (
          <div key={group.maSP} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-3">
              <div>
                <span className="font-black text-teal-700 font-mono text-base">{group.maSP || "CHƯA CÓ MÃ"}</span>
                <h2 className="text-xl font-black text-slate-800">{group.tenSP || "Sản phẩm mới"}</h2>
              </div>
              <div className="flex items-center gap-5 text-sm text-right shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px] uppercase font-bold"><Hash className="w-3 h-3" /> Tổng SL</span>
                  <span className="font-black text-base text-slate-800">{totalQty.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px] uppercase font-bold"><DollarSign className="w-3 h-3" /> Giá bán</span>
                  <span className="font-black text-base text-emerald-600">{priceDisplay ? `${priceDisplay}đ` : "Chưa có"}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 text-[11px] uppercase font-bold">Giá trị</span>
                  <span className="font-black text-base text-sky-600">{(totalValue / 1000).toFixed(0)}K</span>
                </div>
              </div>
            </div>

            {/* Lưới biến thể - ảnh phủ full card */}
            <div className="p-5 bg-slate-50">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
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
        );
      })}
    </div>
  );
}

const TRANG_THAI_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  "con": { label: "Còn hàng", bg: "bg-emerald-500", text: "text-white" },
  "dat-hang": { label: "Đang SX", bg: "bg-sky-500", text: "text-white" },
  "xuat-kho": { label: "Đã xuất", bg: "bg-slate-500", text: "text-white" },
  "khong-dat": { label: "Không đạt", bg: "bg-rose-500", text: "text-white" },
};

function VariantCard({ sp, image, onOpen, onEdit, onXuatKho }: { sp: SanPhamTP; image?: string; onOpen: () => void; onEdit: () => void; onXuatKho: () => void }) {
  const trangThai = TRANG_THAI_STYLE[sp.trangThai] || TRANG_THAI_STYLE["con"];

  return (
    <div
      className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200 shadow-sm group cursor-pointer bg-slate-100"
      onClick={onOpen}
      title="Xem chi tiết màu"
    >
      {/* Ảnh phủ full */}
      {image ? (
        <img src={image} alt={sp.mau} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-300">
          <Camera className="w-10 h-10" />
        </div>
      )}

      {/* Badge trạng thái - góc trên trái */}
      <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${trangThai.bg} ${trangThai.text}`}>
        {trangThai.label}
      </span>

      {/* Nút sửa/xuất kho - hiện khi hover */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 bg-black/50 hover:bg-black/75 backdrop-blur rounded-lg text-white" title="Sửa">
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onXuatKho(); }} className="p-1.5 bg-black/50 hover:bg-black/75 backdrop-blur rounded-lg text-white" title="Xuất kho">
          <Truck className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Overlay thông tin - đáy card, gradient tối dần */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent pt-10 pb-3 px-3">
        <div className="font-black text-white text-base leading-tight truncate drop-shadow-sm">{sp.mau}</div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-white/90 text-xs font-bold flex items-center gap-1">
            <Box className="w-3 h-3" /> {sp.soLuong.toLocaleString()} sp
          </span>
          {sp.giaBanLe ? (
            <span className="text-emerald-300 text-sm font-black">{sp.giaBanLe.toLocaleString()}đ</span>
          ) : null}
        </div>
        {sp.viTri && (
          <div className="text-white/70 text-[10px] font-semibold flex items-center gap-0.5 mt-1">
            <MapPin className="w-2.5 h-2.5" /> {sp.viTri}
          </div>
        )}
      </div>
    </div>
  );
}
