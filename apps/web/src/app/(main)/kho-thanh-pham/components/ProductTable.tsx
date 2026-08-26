// ============ PRODUCT TABLE VIEW ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)

import { Edit, Truck, Trash2, Image as ImageIcon } from "lucide-react";
import type { SanPhamTP } from "../data";

interface ProductTableProps {
  filtered: SanPhamTP[];
  setEditing: (s: SanPhamTP | null) => void;
  handleXuatKho: (id: string) => void;
  handleDelete: (id: string) => void;
}

export function ProductTable({ filtered, setEditing, handleXuatKho, handleDelete }: ProductTableProps) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-amber-50 text-amber-900">
          <tr>
            <th className="p-2 text-left">Mã SP</th>
            <th className="p-2 text-center w-16">Hình ảnh</th>
            <th className="p-2 text-left">Tên SP</th>
            <th className="p-2 text-left">Màu/Size</th>
            <th className="p-2 text-left">LSX</th>
            <th className="p-2 text-right">SL</th>
            <th className="p-2 text-right">Đơn giá</th>
            <th className="p-2 text-right">Giá trị</th>
            <th className="p-2 text-left">Vị trí</th>
            <th className="p-2 text-center">Trạng thái</th>
            <th className="p-2 text-center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <tr key={s.id} className="border-t hover:bg-amber-50/30">
              <td className="p-2 font-mono font-bold text-amber-700">{s.maSP}</td>
              <td className="p-2">
                <div className="group relative w-12 h-12">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 text-slate-400">
                    {s.hinhAnh?.[0] ? (
                      <img src={s.hinhAnh[0]} alt={s.tenSP} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </div>
                  {s.hinhAnh?.[0] && (
                    <div className="pointer-events-none absolute left-14 top-1/2 z-50 hidden -translate-y-1/2 rounded-xl border-2 border-white bg-white p-1 shadow-2xl group-hover:block">
                      <img src={s.hinhAnh[0]} alt={`Xem trước ${s.tenSP}`} className="h-48 w-48 max-w-none rounded-lg object-contain" />
                    </div>
                  )}
                </div>
              </td>
              <td className="p-2">
                <div className="font-semibold">{s.tenSP}</div>
                <div className="text-[10px] text-slate-500">{s.phanLoai}</div>
              </td>
              <td className="p-2 text-xs">
                <div>{s.mau}</div>
                <div className="text-slate-500">{s.size}</div>
              </td>
              <td className="p-2 font-mono text-[10px]">{s.lsx}</td>
              <td className="p-2 text-right font-bold">{s.soLuong.toLocaleString()}</td>
              <td className="p-2 text-right text-xs">{s.donGia.toLocaleString()}đ</td>
              <td className="p-2 text-right font-mono font-bold text-emerald-600">{(s.giaTri/1000).toFixed(0)}K</td>
              <td className="p-2 text-xs font-mono text-slate-500">{s.viTri}</td>
              <td className="p-2 text-center">
                {s.trangThai === "con" && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-bold">Còn</span>}
                {s.trangThai === "dat-hang" && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full font-bold">Đang sản xuất</span>}
                {s.trangThai === "xuat-kho" && <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded-full font-bold">Đã xuất</span>}
                {s.trangThai === "khong-dat" && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] rounded-full font-bold">Không đặt</span>}
              </td>
              <td className="p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => setEditing(s)} className="p-1 hover:bg-blue-100 rounded" title="Sửa">
                    <Edit className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                  <button onClick={() => handleXuatKho(s.id)} className="p-1 hover:bg-emerald-100 rounded" title="Xuất kho">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1 hover:bg-rose-100 rounded" title="Xóa">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
