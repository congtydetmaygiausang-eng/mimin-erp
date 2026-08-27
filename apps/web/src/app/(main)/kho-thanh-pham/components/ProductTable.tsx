// ============ PRODUCT TABLE VIEW ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)

import React, { useMemo } from "react";
import { Edit, Truck, Trash2, Image as ImageIcon } from "lucide-react";
import type { SanPhamTP } from "../data";

interface ProductTableProps {
  filtered: SanPhamTP[];
  setEditing: (s: SanPhamTP | null) => void;
  handleXuatKho: (id: string) => void;
  handleDelete: (id: string) => void;
}

export function ProductTable({ filtered, setEditing, handleXuatKho, handleDelete }: ProductTableProps) {
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
    <div className="card overflow-x-auto shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-amber-50 text-amber-900 border-b-2 border-amber-200">
          <tr>
            <th className="p-3 text-left font-semibold">Mã SP</th>
            <th className="p-3 text-center font-semibold w-16">Hình ảnh</th>
            <th className="p-3 text-left font-semibold">Tên SP</th>
            <th className="p-3 text-left font-semibold">Màu/Size</th>
            <th className="p-3 text-left font-semibold">LSX</th>
            <th className="p-3 text-right font-semibold">SL</th>
            <th className="p-3 text-right font-semibold">Đơn giá</th>
            <th className="p-3 text-right font-semibold">Giá trị</th>
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
                            {s.hinhAnh?.[0] ? (
                              <img src={s.hinhAnh[0]} alt={s.tenSP} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5" />
                            )}
                          </div>
                          {s.hinhAnh?.[0] && (
                            <div className="pointer-events-none absolute left-14 top-1/2 z-50 hidden -translate-y-1/2 rounded-xl border-4 border-white bg-white p-1 shadow-2xl group-hover/img:block">
                              <img src={s.hinhAnh[0]} alt={`Xem trước ${s.tenSP}`} className="h-48 w-48 max-w-none rounded-lg object-contain bg-slate-50" />
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {isFirst && (
                      <td rowSpan={group.length} className="p-3 align-top bg-white border-r border-slate-100 shadow-[inset_-1px_0_0_rgba(0,0,0,0.02)]">
                        <div className="font-bold text-slate-800">{s.tenSP}</div>
                        <div className="text-[10px] uppercase font-semibold text-slate-500 mt-0.5 tracking-wider bg-slate-100 inline-block px-1.5 py-0.5 rounded">{s.phanLoai}</div>
                      </td>
                    )}
                    <td className="p-3 text-xs align-middle">
                      <div className="font-semibold text-slate-700">{s.mau}</div>
                      <div className="text-slate-500 mt-0.5">{s.size}</div>
                    </td>
                    <td className="p-3 font-mono text-[10px] align-middle text-slate-600">{s.lsx}</td>
                    <td className="p-3 text-right font-bold align-middle text-slate-700">{s.soLuong.toLocaleString()}</td>
                    <td className="p-3 text-right text-xs align-middle text-slate-500">{s.donGia.toLocaleString()}đ</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 align-middle">{(s.giaTri/1000).toFixed(0)}K</td>
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
  );
}
