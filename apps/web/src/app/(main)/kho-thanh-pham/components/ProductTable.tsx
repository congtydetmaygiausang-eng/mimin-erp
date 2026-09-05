// ============ PRODUCT TABLE VIEW ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)

import React, { useMemo } from "react";
import { Edit, Truck, Trash2, Image as ImageIcon } from "lucide-react";
import type { SanPhamTP } from "../data";

interface ProductTableProps {
  filtered: SanPhamTP[];
  productImages: Record<string, string>;
  productVariantImages?: Record<string, string>;
  setEditing: (s: SanPhamTP | null) => void;
  handleXuatKho: (id: string) => void;
  handleDelete: (id: string) => void;
}

export function ProductTable({ filtered, productImages, productVariantImages = {}, setEditing, handleXuatKho, handleDelete }: ProductTableProps) {
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
    <div className="card shadow-sm">
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-amber-50 text-amber-900 border-b-2 border-amber-200">
          <tr>
            <th className="p-3 text-left font-semibold">Mã SP</th>
            <th className="p-3 text-center font-semibold w-16">Hình ảnh</th>
            <th className="p-3 text-left font-semibold">Tên SP</th>
            <th className="p-3 text-left font-semibold">Màu/Size</th>
            <th className="p-3 text-left font-semibold">LSX</th>
            <th className="p-3 text-right font-semibold">SL</th>
            <th className="p-3 text-left font-semibold">Vị trí</th>
            <th className="p-3 text-center font-semibold">Trạng thái</th>
            <th className="p-3 text-center font-semibold">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {groupedProducts.map((group) => (
            <React.Fragment key={group[0].maSP}>
              {group.map((s, index) => {
                const isFirst = index === 0;
                const isLast = index === group.length - 1;
                
                const mainImg = productImages[s.maSP] || s.hinhAnh?.[0] || "";
                
                return (
                  <tr 
                    key={s.id} 
                    className={`hover:bg-amber-50/50 transition-colors
                      ${!isLast ? "border-b border-dashed border-slate-200" : "border-b-2 border-solid border-amber-100"}
                    `}
                  >
                    {isFirst && (
                      <td rowSpan={group.length} className="p-3 font-mono font-bold text-amber-700 align-top bg-white border-r border-slate-100 shadow-[inset_-1px_0_0_rgba(0,0,0,0.02)]">
                        {s.maSP}
                      </td>
                    )}
                    {isFirst && (
                      <td rowSpan={group.length} className="p-3 align-top bg-white border-r border-slate-100 shadow-[inset_-1px_0_0_rgba(0,0,0,0.02)]">
                        <div className="group/img relative w-12 h-12 mx-auto">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-400 shadow-sm">
                            {mainImg ? (
                              <img src={mainImg} alt={s.tenSP} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5" />
                            )}
                          </div>
                          {mainImg && (
                            <div className="pointer-events-none absolute left-full ml-3 top-1/2 z-[9999] hidden -translate-y-1/2 rounded-2xl border-[6px] border-white bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] group-hover/img:block">
                              <img src={mainImg} alt={`Xem trước ${s.tenSP}`} className="h-48 w-48 max-w-none rounded-xl object-contain bg-slate-50" />
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {isFirst && (
                      <td rowSpan={group.length} className="p-3 align-top bg-white border-r border-slate-100 shadow-[inset_-1px_0_0_rgba(0,0,0,0.02)]">
                        <div className="font-bold text-slate-800">{s.tenSP}</div>
                        <div className="text-[10px] uppercase font-semibold text-slate-500 mt-0.5 tracking-wider bg-slate-100 inline-block px-1.5 py-0.5 rounded">{s.phanLoai}</div>
                        
                        {/* Interactive Price Chips */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <PriceChip label="Bán lẻ" price={s.giaBanLe} />
                          <PriceChip label="Bán sỉ" price={s.giaBanSi} />
                          <PriceChip label="Bán lô" price={s.giaBanLo} />
                          <PriceChip label="TikTok" price={s.giaTikTok} />
                          <PriceChip label="Shopee" price={s.giaShopee} />
                        </div>
                      </td>
                    )}
                    <td className="p-3 text-xs align-middle">
                      <div className="group/skuimg relative flex items-center gap-2 w-max">
                        {(() => {
                          const variantImg = s.hinhAnh?.[0] || productVariantImages[`${s.maSP}_${s.mau}`] || "";
                          return variantImg ? (
                            <>
                              <div className="w-8 h-8 rounded-md overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                                <img src={variantImg} alt={s.mau} className="w-full h-full object-cover" />
                              </div>
                              <div className="pointer-events-none absolute left-full ml-3 top-1/2 z-[9999] hidden -translate-y-1/2 rounded-2xl border-[6px] border-white bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] group-hover/skuimg:block">
                                <img src={variantImg} alt={`Xem trước màu ${s.mau}`} className="h-48 w-48 max-w-none rounded-xl object-contain bg-slate-50" />
                              </div>
                            </>
                          ) : (
                            <div className="w-8 h-8 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-300">
                              <ImageIcon className="w-3.5 h-3.5" />
                            </div>
                          );
                        })()}
                        <div>
                          <div className="font-semibold text-slate-700">{s.mau}</div>
                          <div className="text-slate-500 mt-0.5">{s.size}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[10px] align-middle text-slate-600">{s.lsx}</td>
                    <td className="p-3 text-right font-bold align-middle text-slate-700">{s.soLuong.toLocaleString()}</td>
                    <td className="p-3 text-xs font-mono text-slate-500 align-middle">
                      <span className="bg-slate-100 px-1.5 py-1 rounded-md border border-slate-200">{s.viTri}</span>
                    </td>
                    <td className="p-3 text-center align-middle">
                      {s.trangThai === "con" && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-bold shadow-sm">Còn</span>}
                      {s.trangThai === "dat-hang" && <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] rounded-full font-bold shadow-sm">Đang SX</span>}
                      {s.trangThai === "xuat-kho" && <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-[10px] rounded-full font-bold shadow-sm">Đã xuất</span>}
                      {s.trangThai === "khong-dat" && <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-[10px] rounded-full font-bold shadow-sm">Không đặt</span>}
                    </td>
                    <td className="p-3 text-center align-middle">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setEditing(s)} className="p-1.5 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-md transition-colors" title="Sửa">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleXuatKho(s.id)} className="p-1.5 hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 rounded-md transition-colors" title="Xuất kho">
                          <Truck className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-md transition-colors" title="Xóa">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden flex flex-col gap-4 p-2">
        {groupedProducts.map((group) => (
          <div key={group[0].maSP} className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
            {/* Header / Main SP */}
            <div className="p-3 bg-amber-50/50 border-b border-amber-100 flex gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0">
                {productImages[group[0].maSP] || group[0].hinhAnh?.[0] ? (
                  <img src={productImages[group[0].maSP] || group[0].hinhAnh?.[0]} alt={group[0].tenSP} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-amber-900 truncate">{group[0].tenSP}</div>
                <div className="text-xs font-mono text-amber-700 mt-0.5">{group[0].maSP}</div>
                <div className="text-[10px] uppercase font-semibold text-slate-500 mt-1 bg-white inline-block px-1.5 py-0.5 rounded border border-slate-100">
                  {group[0].phanLoai}
                </div>
              </div>
            </div>
            
            {/* Variants */}
            <div className="divide-y divide-slate-100">
              {group.map(s => (
                <div key={s.id} className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                        {s.hinhAnh?.[0] ? (
                          <img src={s.hinhAnh[0]} alt={s.mau} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm leading-none">{s.mau}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{s.size}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-700">{s.soLuong.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded">{s.viTri}</span>
                      {s.trangThai === "con" && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] rounded font-bold">Còn</span>}
                      {s.trangThai === "dat-hang" && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] rounded font-bold">Đang SX</span>}
                      {s.trangThai === "xuat-kho" && <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[9px] rounded font-bold">Đã xuất</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(s)} className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleXuatKho(s.id)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                        <Truck className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
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
