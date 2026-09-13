// ============ PRODUCT TABLE VIEW ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)

import React, { useMemo } from "react";
import { Edit, Truck, Trash2, Image as ImageIcon } from "lucide-react";
import type { SanPhamTP } from "../data";
import { LOAI_SP_LABELS, type LoaiSP, detectLoaiSP } from "@/lib/data/lenh-cat-store";

const getPhanLoaiLabel = (phanLoai: string, tenSP: string) => {
  const isValidKey = Object.keys(LOAI_SP_LABELS).includes(phanLoai);
  const detectedKey = isValidKey ? (phanLoai as LoaiSP) : detectLoaiSP((tenSP || "") + " " + (phanLoai || ""));
  return LOAI_SP_LABELS[detectedKey] || detectedKey;
};

interface ProductTableProps {
  filtered: SanPhamTP[];
  productImages: Record<string, string>;
  productVariantImages?: Record<string, string>;
  setEditing: (s: SanPhamTP | null) => void;
  handleXuatKho: (id: string) => void;
  handleDelete: (id: string) => void;
  onSuaTong?: (group: { maSP: string; tenSP: string; items: SanPhamTP[] }) => void;
}

export function ProductTable({ filtered, productImages, productVariantImages = {}, setEditing, handleXuatKho, handleDelete, onSuaTong }: ProductTableProps) {
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  // Nhóm sản phẩm theo Mã SP
  const groupedProducts = useMemo(() => {
    const groups: Record<string, SanPhamTP[]> = {};
    filtered.forEach((s) => {
      if (!groups[s.maSP]) groups[s.maSP] = [];
      groups[s.maSP].push(s);
    });
    return Object.values(groups);
  }, [filtered]);

  return (
    <div className="flex flex-col gap-4">
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out transition-opacity"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}
      
      {groupedProducts.map((group) => {
        const totalQty = group.reduce((s, x) => s + x.soLuong, 0);
        return (
        <div key={group[0].maSP} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          {/* Header / Main SP */}
          <div className="p-4 md:px-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex gap-4 relative">
             {onSuaTong && (
               <button onClick={() => onSuaTong({ maSP: group[0].maSP, tenSP: group[0].tenSP, items: group })} className="absolute top-4 right-4 md:right-6 p-2 text-slate-400 hover:bg-slate-200 hover:text-indigo-600 rounded-lg transition-colors bg-white/80 border border-slate-200 shadow-sm z-10 flex items-center gap-1.5" title="Sửa tổng thể sản phẩm">
                  <Edit className="w-4 h-4" /> <span className="hidden md:inline text-xs font-bold">Sửa Nhóm</span>
               </button>
             )}
            <div 
              className="w-20 h-28 md:w-24 md:h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0 shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
              onClick={() => {
                const img = productImages[group[0].maSP] || group[0].hinhAnh?.[0];
                if (img) setPreviewImage(img);
              }}
            >
              {productImages[group[0].maSP] || group[0].hinhAnh?.[0] ? (
                <img src={productImages[group[0].maSP] || group[0].hinhAnh?.[0]} alt={group[0].tenSP} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center pr-6 py-1">
              <div className="font-bold text-slate-800 text-[15px] md:text-lg leading-tight line-clamp-2 mb-1.5">{group[0].tenSP}</div>
              <div className="text-xs md:text-sm font-mono font-extrabold text-indigo-600 mb-3">{group[0].maSP}</div>
              <div className="flex flex-wrap items-center gap-2">
                 <div className="text-[10px] md:text-xs uppercase font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 shadow-sm">
                   {getPhanLoaiLabel(group[0].phanLoai, group[0].tenSP)}
                 </div>
                 <div className="text-[10px] md:text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 shadow-sm">
                   Tổng: <span className="text-emerald-900 font-black">{totalQty.toLocaleString()}</span> sp
                 </div>
                 <div className="hidden md:flex gap-1.5 ml-2">
                    <PriceChip label="Bán lẻ" price={group[0].giaBanLe} />
                    <PriceChip label="Bán sỉ" price={group[0].giaBanSi} />
                 </div>
              </div>
            </div>
          </div>
          
          {/* Variants */}
          <div className="divide-y divide-slate-100 bg-white">
            {group.map(s => (
              <div key={s.id} className="p-4 md:px-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0 relative cursor-zoom-in hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (s.hinhAnh?.[0]) setPreviewImage(s.hinhAnh[0]);
                    }}
                  >
                    {s.hinhAnh?.[0] ? (
                      <img src={s.hinhAnh[0]} alt={s.mau} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-lg pointer-events-none"></div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm md:text-base mb-0.5">{s.mau}</div>
                    <div className="text-xs md:text-sm text-slate-500 font-medium">{s.size}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                  <div className="flex flex-col md:items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="font-black text-slate-800 text-[16px] md:text-lg">{s.soLuong.toLocaleString()}</div>
                      {s.soLuong <= 0 ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] md:text-xs rounded font-bold shadow-sm">Hết hàng</span>
                      ) : (
                        <>
                          {s.trangThai === "con" && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] md:text-xs rounded font-bold shadow-sm">Còn</span>}
                          {s.trangThai === "dat-hang" && <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-[10px] md:text-xs rounded font-bold shadow-sm">Đang SX</span>}
                          {s.trangThai === "xuat-kho" && <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] md:text-xs rounded font-bold shadow-sm">Đã xuất</span>}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs md:text-sm font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-md border border-violet-200 shadow-sm">{s.viTri || 'Chưa xếp'}</span>
                      <span className="text-[10px] md:text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-dashed border-slate-300">{s.lsx}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setEditing(s)} className="p-2 bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg transition-colors border border-slate-200 shadow-sm" title="Sửa">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleXuatKho(s.id)} className="p-2 bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 rounded-lg transition-colors border border-slate-200 shadow-sm" title="Xuất kho">
                      <Truck className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors border border-slate-200 shadow-sm" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        );
      })}
    </div>
  );
}

function PriceChip({ label, price }: { label: string; price?: number }) {
  const [show, setShow] = React.useState(false);
  
  if (price == null || price === 0) return null; // Only show channels that have a price configured
  
  return (
    <button 
      onClick={() => setShow(!show)} 
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-all duration-200 shadow-sm ${
        show 
          ? 'bg-amber-100 border-amber-300 text-amber-800' 
          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700'
      }`}
    >
      {label}{show ? `: ${price.toLocaleString()}đ` : ''}
    </button>
  );
}
