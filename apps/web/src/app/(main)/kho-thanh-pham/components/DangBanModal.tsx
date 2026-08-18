// ============ MODAL ĐĂNG BÁN (chuyển từ Kho thành phẩm sang Danh mục sản phẩm) ============

import { useState } from "react";
import { X, Tag, Image as ImageIcon } from "lucide-react";
import type { SanPhamTP } from "../data";

interface Props {
  group: { maSP: string; tenSP: string; items: SanPhamTP[] };
  soMauCoAnh: number;
  tongSoMau: number;
  daCoTrongDanhMuc: boolean;
  giaBanMacDinh?: number;
  giaVonMacDinh?: number;
  onClose: () => void;
  onConfirm: (giaBan: number, giaVon: number) => void;
}

export function DangBanModal({ group, soMauCoAnh, tongSoMau, daCoTrongDanhMuc, giaBanMacDinh, giaVonMacDinh, onClose, onConfirm }: Props) {
  const [giaBan, setGiaBan] = useState(giaBanMacDinh || 0);
  const [giaVon, setGiaVon] = useState(giaVonMacDinh || 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            {daCoTrongDanhMuc ? "Cập nhật giá bán" : "Đăng bán"}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <div className="font-bold text-slate-800">{group.maSP} - {group.tenSP}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              {soMauCoAnh}/{tongSoMau} màu có ảnh (lấy từ lệnh cắt gốc)
            </div>
            {daCoTrongDanhMuc && (
              <div className="text-xs text-amber-600 font-bold mt-1">Sản phẩm đã có trong Danh mục - sẽ cập nhật giá & ảnh mới nhất.</div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Giá bán *</label>
            <input
              type="number"
              value={giaBan || ""}
              onChange={e => setGiaBan(Number(e.target.value))}
              onFocus={e => e.target.select()}
              placeholder="VD: 185000"
              className="w-full px-3 py-2.5 border border-emerald-300 bg-emerald-50/30 rounded-lg text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Giá vốn (tùy chọn)</label>
            <input
              type="number"
              value={giaVon || ""}
              onChange={e => setGiaVon(Number(e.target.value))}
              onFocus={e => e.target.select()}
              placeholder="VD: 78000"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            />
          </div>

          <p className="text-[11px] text-slate-400">Video theo từng màu có thể thêm sau tại trang Danh mục sản phẩm.</p>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
            Hủy
          </button>
          <button
            onClick={() => {
              if (!giaBan || giaBan <= 0) return;
              onConfirm(giaBan, giaVon);
            }}
            disabled={!giaBan || giaBan <= 0}
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
          >
            <Tag className="w-4 h-4" /> {daCoTrongDanhMuc ? "Cập nhật" : "Đăng bán"}
          </button>
        </div>
      </div>
    </div>
  );
}
