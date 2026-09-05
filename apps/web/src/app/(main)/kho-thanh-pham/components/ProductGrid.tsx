// ============ PRODUCT GRID VIEW ============
// Giao diện mới: card biến thể là ảnh phủ full, thông tin overlay ở đáy -
// giống lưới sản phẩm e-commerce. Tông màu trắng/slate/emerald khớp phần còn lại của app.

import type { RefObject } from "react";
import { Box, Edit, Trash2, Truck, Eye, Plus, Camera, Package, Tag, Hash, DollarSign, MapPin, RefreshCw } from "lucide-react";
import { DS_KENH_BAN, type SanPhamTP } from "../data";

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
  onRebuildFromLC: (group: ProductGroup) => void;
  dsLenhCat: any[];
}

export function ProductGrid({ groups, productImages, setUploadingSP, setUploadType, fileInputRef, setShowAdd, setShowMasterDetails, setEditing, handleXuatKho, update, dsSanPham, onDangBan, onOpenVariant, onRebuildFromLC, dsLenhCat }: ProductGridProps) {
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

        const lsx = group.items[0]?.lsx || group.maSP;
        const lc = dsLenhCat.find((l) => l.id === lsx);
        const soMauThat = lc?.dsMau?.length || 0;
        const maSPSai = !!lc?.maSP && lc.maSP !== group.maSP;
        // Hiện nút tách khi: đang gộp ít card hơn số màu thật, HOẶC mã SP đang dùng nhầm mã lệnh cắt thay vì mã sản phẩm thật
        const canRebuild = soMauThat > 0 && (group.items.length < soMauThat || maSPSai);

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
              </div>
            </div>

            {/* Lưới biến thể - mỗi màu 1 card, 2 ảnh cạnh nhau lấy nguyên từ lệnh cắt gốc */}
            <div className="p-5 bg-slate-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {group.items.map(s => (
                  <VariantCard
                    key={s.id}
                    sp={s}
                    image={s.hinhAnh?.[0] || productImages[s.id]}
                    imageQuan={s.imgQuan || s.hinhAnh?.[1]}
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
              {canRebuild && (
                <button
                  onClick={() => onRebuildFromLC(group)}
                  className="px-3 py-2 bg-sky-100 hover:bg-sky-200 rounded-xl text-sky-700 transition-all text-sm font-bold flex items-center gap-1.5"
                  title={
                    maSPSai
                      ? `Đang dùng nhầm mã lệnh cắt "${group.maSP}" - mã sản phẩm thật là "${lc.maSP}". Bấm để đồng bộ lại.`
                      : `Đang gộp ${group.items.length}/${soMauThat} màu - tách lại thành ${soMauThat} card riêng theo màu từ lệnh cắt gốc`
                  }
                >
                  <RefreshCw className="w-4 h-4" /> {maSPSai ? `Sửa mã SP → ${lc.maSP}` : `Tách theo màu (${group.items.length}/${soMauThat})`}
                </button>
              )}
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

function VariantCard({ sp, image, imageQuan, onOpen, onEdit, onXuatKho }: { sp: SanPhamTP; image?: string; imageQuan?: string; onOpen: () => void; onEdit: () => void; onXuatKho: () => void }) {
  const trangThai = TRANG_THAI_STYLE[sp.trangThai] || TRANG_THAI_STYLE["con"];

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
      onClick={onOpen}
      title="Xem chi tiết màu"
    >
      {/* 2 ảnh cạnh nhau - lấy nguyên từ lệnh cắt gốc, không chỉnh sửa */}
      <div className="relative flex bg-slate-100 aspect-[16/11]">
        {image ? (
          <div className={`flex-1 overflow-hidden ${imageQuan ? "border-r border-slate-200" : ""}`}>
            <img src={image} alt={sp.mau} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-300 border-r border-slate-200">
            <Camera className="w-8 h-8" />
          </div>
        )}
        {imageQuan && (
          <div className="flex-1 overflow-hidden">
            <img src={imageQuan} alt={`${sp.mau} - ảnh 2`} className="w-full h-full object-cover" />
          </div>
        )}

        <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${trangThai.bg} ${trangThai.text}`}>
          {trangThai.label}
        </span>
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 bg-black/50 hover:bg-black/75 backdrop-blur rounded-lg text-white" title="Sửa">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onXuatKho(); }} className="p-1.5 bg-black/50 hover:bg-black/75 backdrop-blur rounded-lg text-white" title="Xuất kho">
            <Truck className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Thông tin màu */}
      <div className="p-3.5">
        <div className="font-black text-slate-800 text-lg leading-tight mb-2 truncate">{sp.mau}</div>

        {sp.chiTietSize && sp.chiTietSize.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {sp.chiTietSize.map((s) => (
              <span key={s.size} className="px-2 py-0.5 rounded-md shadow-sm border bg-sky-50 border-sky-200 text-sky-800 text-xs">
                <strong className="text-sky-900">{s.size}:</strong> {s.sl.toLocaleString()}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1 mb-2">
          {(sp.kenhBan?.length ? sp.kenhBan : ["ban-le"]).map((value) => (
            <span key={value} className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 border border-violet-100">
              {DS_KENH_BAN.find((kenh) => kenh.value === value)?.label ?? value}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
          <span className="text-slate-600 text-xs font-bold flex items-center gap-1">
            <Box className="w-3.5 h-3.5" /> {sp.soLuong.toLocaleString()} sp
          </span>
        </div>
        {sp.viTri && (
          <div className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 mt-1.5">
            <MapPin className="w-3 h-3" /> {sp.viTri}
          </div>
        )}
      </div>
    </div>
  );
}
