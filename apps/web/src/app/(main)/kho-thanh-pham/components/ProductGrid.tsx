// ============ PRODUCT GRID VIEW ============
// Giao diện mới: card biến thể là ảnh phủ full, thông tin overlay ở đáy -
// giống lưới sản phẩm e-commerce. Tông màu trắng/slate/emerald khớp phần còn lại của app.

import React, { type RefObject, useState } from "react";
import { Box, Edit, Trash2, Truck, Eye, Plus, Camera, Package, Tag, Hash, DollarSign, MapPin, RefreshCw, Maximize2 } from "lucide-react";
import { DS_KENH_BAN, type SanPhamTP } from "../data";

function getColorHex(colorName?: string): string {
  const c = (colorName || "").toLowerCase().trim();
  if (c.includes("đen") || c.includes("black")) return "#0f172a";
  if (c.includes("trắng") || c.includes("white")) return "#f8fafc";
  if (c.includes("xám nhạt") || c.includes("tiêu nhạt")) return "#cbd5e1";
  if (c.includes("xám") || c.includes("grey") || c.includes("gray")) return "#64748b";
  if (c.includes("xanh nhớt") || c.includes("rêu") || c.includes("cỏ úa")) return "#3f6212";
  if (c.includes("xanh đen") || c.includes("navy")) return "#172554";
  if (c.includes("xanh dạ quang")) return "#84cc16";
  if (c.includes("xanh dương") || c.includes("blue") || c.includes("bích") || c.includes("xanh")) return "#2563eb";
  if (c.includes("da") || c.includes("kem") || c.includes("be") || c.includes("begi") || c.includes("beige")) return "#fde68a";
  if (c.includes("nâu") || c.includes("brown") || c.includes("cà phê")) return "#78350f";
  if (c.includes("vàng bò") || c.includes("bò")) return "#d97706";
  if (c.includes("vàng")) return "#eab308";
  if (c.includes("đỏ")) return "#dc2626";
  return "#94a3b8";
}

interface ProductGroup {
  maSP: string;
  tenSP: string;
  items: SanPhamTP[];
}

interface ProductGridProps {
  groups: ProductGroup[];
  productImages: Record<string, string>;
  productVariantImages: Record<string, string>;
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
  onSuaTong?: (group: ProductGroup) => void;
  onXoaTong?: (group: ProductGroup) => void;
  onDeleteVariant?: (id: string) => void;
  dsLenhCat: any[];
  highlightedMaSP?: string | null;
}

export function ProductGrid({ 
  groups, productImages, productVariantImages, productVideos, setUploadingSP, setUploadType, fileInputRef, setViewingImage, 
  setShowAdd, setShowMasterDetails, setEditing, handleXuatKho, update, dsSanPham, onDangBan, 
  onOpenVariant, onRebuildFromLC, onSuaTong, onXoaTong, onDeleteVariant, dsLenhCat, highlightedMaSP 
}: ProductGridProps) {
  return (
    <div className="flex flex-col gap-6">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={() => {}} />
      {groups.map(group => {
        if (!group || !group.items || group.items.length === 0) return null;
        const totalQty = group.items.reduce((s, x) => s + (Number(x?.soLuong) || 0), 0);
        const totalValue = group.items.reduce((s, x) => s + (Number(x?.giaTri) || 0), 0);
        const priceRange = Array.from(new Set(group.items.map(x => x?.giaBanLe || x?.donGia).filter(Boolean)));
        const priceDisplay = priceRange.length === 0 ? null
          : priceRange.length === 1 ? (Number(priceRange[0]) || 0).toLocaleString()
          : `${(Number(Math.min(...priceRange)) || 0).toLocaleString()} - ${(Number(Math.max(...priceRange)) || 0).toLocaleString()}`;

        const lsx = group.items[0]?.maLenhCat || group.maSP;
        const lc = dsLenhCat.find((l) => l.id === lsx);
        const soMauThat = lc?.dsMau?.length || 0;
        const maSPSai = !!lc?.maSP && lc.maSP !== group.maSP;
        // Hiện nút tách khi: đang gộp ít card hơn số màu thật, HOẶC mã SP đang dùng nhầm mã lệnh cắt thay vì mã sản phẩm thật
        const canRebuild = soMauThat > 0 && (group.items.length < soMauThat || maSPSai);

        return (
          <div 
            key={group.maSP} 
            id={`product-group-${group.maSP}`}
            className={`bg-white rounded-2xl border ${
              highlightedMaSP === group.maSP 
                ? "border-emerald-500 ring-4 ring-emerald-300 shadow-xl bg-emerald-50/10" 
                : "border-slate-200 shadow-sm"
            } overflow-hidden transition-all duration-500`}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-3">
              <div>
                <span className="font-black text-teal-700 font-mono text-base">{group.maSP || "CHƯA CÓ MÃ"}</span>
                <h2 className="text-xl font-black text-slate-800">{group.tenSP || "Sản phẩm mới"}</h2>
                {/* Interactive Price Chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <PriceChip label="Bán lẻ" price={group.items[0]?.giaBanLe} />
                  <PriceChip label="Bán sỉ" price={group.items[0]?.giaBanSi} />
                  <PriceChip label="Bán lô" price={group.items[0]?.giaBanLo} />
                  <PriceChip label="TikTok" price={group.items[0]?.giaTikTok} />
                  <PriceChip label="Shopee" price={group.items[0]?.giaShopee} />
                </div>
              </div>
              <div className="flex items-center gap-5 text-sm text-right shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px] uppercase font-bold"><Hash className="w-3 h-3" /> Tổng SL</span>
                  <span className="font-black text-base text-slate-800">{totalQty.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Lưới biến thể - Bố cục tỉ lệ 3:4 chuẩn thời trang, hiển thị trọn vẹn sản phẩm */}
            <div className="p-4 sm:p-5 bg-slate-50/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
                {group.items.map(s => (
                  <VariantCard
                    key={s.id}
                    sp={s}
                    image={s.hinhAnh?.[0] || productVariantImages[`${s.maSP}_${s.mau}`] || productImages[s.maSP]}
                    imageQuan={s.imgQuan || s.hinhAnh?.[1]}
                    onOpen={() => onOpenVariant(s)}
                    onEdit={() => setEditing(s)}
                    onXuatKho={() => handleXuatKho(s.id)}
                    onDelete={onDeleteVariant ? () => onDeleteVariant(s.id) : undefined}
                    onZoom={(url) => setViewingImage(url)}
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
              <button onClick={() => { if (onSuaTong) onSuaTong(group); }} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-xl text-white transition-all text-sm font-bold flex items-center gap-1.5 shadow-sm" title="Sửa tổng">
                <Edit className="w-4 h-4" /> Sửa tổng
              </button>
              {onXoaTong && (
                <button onClick={() => onXoaTong(group)} className="p-2.5 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-600 transition-all border border-rose-200 ml-auto" title="Xóa toàn bộ nhóm sản phẩm">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
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

function VariantCard({
  sp,
  image,
  imageQuan,
  onOpen,
  onEdit,
  onXuatKho,
  onDelete,
  onZoom,
}: {
  sp: SanPhamTP;
  image?: string;
  imageQuan?: string;
  onOpen: () => void;
  onEdit: () => void;
  onXuatKho: () => void;
  onDelete?: () => void;
  onZoom?: (imgUrl: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"ao" | "quan">("ao");
  const trangThai = TRANG_THAI_STYLE[sp.trangThai] || TRANG_THAI_STYLE["con"];

  // Kiểm tra ảnh quần riêng biệt (khác ảnh áo và không phải ảnh sơ đồ cắt)
  const hasSeparateQuan = Boolean(
    imageQuan &&
    imageQuan !== image &&
    !imageQuan.includes("/phieu-cat/")
  );

  const currentDisplayImg = (hasSeparateQuan && activeTab === "quan") ? imageQuan : image;
  const isOutOfStock = (Number(sp.soLuong) || 0) <= 0;
  const isLowStock = !isOutOfStock && (Number(sp.soLuong) || 0) < 10;
  const colorHex = getColorHex(sp.mau);

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 transition-all duration-300 flex flex-col"
      onClick={onOpen}
      title="Bấm để xem & chỉnh sửa chi tiết màu"
    >
      {/* Container Ảnh - Tỉ lệ 3:4 chuẩn thời trang thương mại điện tử, không bị cắt cụt */}
      <div className="relative w-full aspect-[3/4] bg-slate-100 overflow-hidden select-none">
        {currentDisplayImg ? (
          <img
            src={currentDisplayImg}
            alt={sp.mau}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2 bg-gradient-to-b from-slate-50 to-slate-100">
            <Camera className="w-10 h-10 stroke-[1.5]" />
            <span className="text-xs font-semibold text-slate-400">Chưa có ảnh</span>
          </div>
        )}

        {/* Nút Tab chuyển đổi xem Áo / Quần (nếu có 2 ảnh riêng) */}
        {hasSeparateQuan && (
          <div
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center bg-slate-900/75 backdrop-blur-md p-0.5 rounded-full border border-white/20 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveTab("ao")}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                activeTab === "ao"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Áo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("quan")}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                activeTab === "quan"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Quần
            </button>
          </div>
        )}

        {/* Badge Trạng Thái Tồn Kho (Góc trên bên trái - Thanh lịch, không che ngực người mẫu) */}
        <div className="absolute top-2.5 left-2.5 z-20">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide uppercase bg-rose-600/95 text-white shadow-md backdrop-blur-sm border border-rose-400/40">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Hết hàng
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide uppercase bg-amber-500/95 text-white shadow-md backdrop-blur-sm border border-amber-300/40">
              Sắp hết
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide uppercase bg-emerald-600/95 text-white shadow-md backdrop-blur-sm border border-emerald-400/40">
              Còn hàng
            </span>
          )}
        </div>

        {/* Floating Quick Action Bar (Góc trên bên phải khi hover) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
          {currentDisplayImg && onZoom && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onZoom(currentDisplayImg);
              }}
              className="p-2 bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md rounded-xl shadow-md transition-all hover:scale-105"
              title="Phóng to ảnh"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md rounded-xl shadow-md transition-all hover:scale-105"
            title="Chỉnh sửa biến thể"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onXuatKho();
            }}
            className="p-2 bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md rounded-xl shadow-md transition-all hover:scale-105"
            title="Xuất kho"
          >
            <Truck className="w-3.5 h-3.5" />
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 bg-rose-600/80 hover:bg-rose-600 text-white backdrop-blur-md rounded-xl shadow-md transition-all hover:scale-105"
              title="Xóa biến thể"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Thông tin chi tiết biến thể */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Tên Màu & Tổng Số Lượng */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs flex-shrink-0"
                style={{ backgroundColor: colorHex }}
                title={`Màu ${sp.mau}`}
              />
              <span className="font-black text-slate-800 text-base leading-tight truncate">
                {sp.mau}
              </span>
            </div>
            <span className={`text-xs font-black px-2 py-0.5 rounded-md flex-shrink-0 ${
              isOutOfStock 
                ? "bg-rose-50 text-rose-700 border border-rose-200" 
                : "bg-slate-100 text-slate-800 border border-slate-200"
            }`}>
              {(Number(sp.soLuong) || 0).toLocaleString()} SP
            </span>
          </div>

          {/* Ma Trận Chi Tiết Size (Grid 4 cột vuông vắn, rõ ràng) */}
          {sp.chiTietSize && sp.chiTietSize.length > 0 ? (
            <div className="grid grid-cols-4 gap-1 mb-2.5">
              {sp.chiTietSize.map((s) => {
                const qty = Number(s.sl) || 0;
                return (
                  <div
                    key={s.size}
                    className={`rounded-lg py-1 px-0.5 text-center border transition-all ${
                      qty > 0
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                        : "bg-slate-50 border-slate-100 text-slate-400"
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {s.size}
                    </div>
                    <div className={`text-xs font-black leading-tight ${qty > 0 ? "text-emerald-700" : "text-slate-300"}`}>
                      {qty}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 italic mb-2.5">Chưa phân bổ size</div>
          )}

          {/* Kênh Bán */}
          <div className="flex flex-wrap gap-1 mb-2">
            {(sp.kenhBan?.length ? sp.kenhBan : ["ban-le"]).map((value) => (
              <span
                key={value}
                className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 border border-violet-100"
              >
                {DS_KENH_BAN.find((kenh) => kenh.value === value)?.label ?? value}
              </span>
            ))}
          </div>
        </div>

        {/* Footer: Vị trí kho */}
        {sp.viTri && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[11px] font-medium">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="truncate">{sp.viTri}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function PriceChip({ label, price }: { label: string; price?: number }) {
  const [show, setShow] = useState(false);
  
  if (price == null || price === 0) return null; // Only show channels that have a price configured
  
  return (
    <button 
      onClick={() => setShow(!show)} 
      className={`text-[10px] font-bold px-2 py-1 rounded border transition-all duration-200 shadow-sm ${
        show 
          ? 'bg-amber-100 border-amber-300 text-amber-800' 
          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700'
      }`}
    >
      {label}{show ? `: ${(Number(price) || 0).toLocaleString()}đ` : ''}
    </button>
  );
}
