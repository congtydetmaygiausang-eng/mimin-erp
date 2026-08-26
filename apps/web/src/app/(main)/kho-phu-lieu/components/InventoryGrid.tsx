// ============ INVENTORY GRID (TONG QUAN TAB) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.8)

import { useState } from "react";
import { Boxes, Plus, Minus } from "lucide-react";
import { formatVNDShort } from "@/lib/data/real-data";
import type { KhoVai } from "@/lib/data/real-data";

interface InventoryGridProps {
  filteredVT: KhoVai[];
  dsTrangThai: any[];
  inventoryImages: Record<string, string>;
  editingVT: string | null;
  editForm: Partial<KhoVai>;
  setEditingVT: (v: string | null) => void;
  setEditForm: (v: Partial<KhoVai>) => void;
  onSaveEdit: (v: KhoVai) => void;
  onUploadImage: (maVT: string) => void;
  onShowNhap: (maVT: string) => void;
  onShowXuat: (maVT: string) => void;
}

export function InventoryGrid({ filteredVT, dsTrangThai, inventoryImages, editingVT, editForm, setEditingVT, setEditForm, onSaveEdit, onUploadImage, onShowNhap, onShowXuat }: InventoryGridProps) {
  const getTonKhoColor = (tonKho: number, tonToiThieu: number) => {
    if (tonKho < tonToiThieu) return "text-red-600 dark:text-red-500";
    if (tonKho > tonToiThieu * 3) return "text-emerald-600 dark:text-emerald-500";
    if (tonKho > tonToiThieu * 2) return "text-amber-500 dark:text-amber-400";
    return "text-violet-600 dark:text-violet-400";
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
      {filteredVT.map((v) => {
        const tt = dsTrangThai.find((t) => t.maVT === v.maVT);
        if (!tt) return null;

        return (
          <div key={v.maVT} className={`bg-white dark:bg-slate-900 border ${tt.canhBao ? 'border-red-300 dark:border-red-700/50 shadow-sm' : 'border-slate-200 dark:border-slate-800'} rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all relative overflow-hidden group`}>
            <div className="flex justify-between items-start mb-3">
              <div className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wider">
                {v.maVT}
              </div>
              <div className="flex gap-2">
                {tt.canhBao ? (
                  <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider">Thấp</span>
                ) : (
                  <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider">OK</span>
                )}
              </div>
            </div>

            <div className="flex gap-4 items-center mb-4">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden flex-shrink-0 cursor-pointer relative group/img flex items-center justify-center bg-violet-50 dark:bg-violet-900/20 transition-transform hover:scale-105"
                onClick={() => onUploadImage(v.maVT)}
                title="Bấm để tải ảnh lên"
              >
                {v.ghiChu?.includes("[IMG:") ? (
                  <img src={v.ghiChu.match(/\[IMG:(https?:\/\/[^\]]+)\]/)?.[1] || inventoryImages[v.maVT]} alt={v.tenVT} className="w-full h-full object-cover" />
                ) : inventoryImages[v.maVT] ? (
                  <img src={inventoryImages[v.maVT]} alt={v.tenVT} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Boxes className="w-8 h-8 sm:w-10 sm:h-10 text-violet-400 opacity-80 group-hover/img:opacity-0 transition-opacity" />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-violet-600 bg-violet-100/80 opacity-0 group-hover/img:opacity-100 transition-opacity">
                      + Tải ảnh
                    </span>
                  </>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {editingVT === v.maVT ? (
                  <input
                    type="text"
                    className="w-full text-sm font-bold text-slate-800 p-1 border rounded"
                    value={editForm.tenVT || ''}
                    onChange={(e) => setEditForm({ ...editForm, tenVT: e.target.value })}
                    placeholder="Tên phụ liệu"
                  />
                ) : (
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight truncate" title={v.tenVT}>{v.tenVT}</h3>
                )}
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 truncate">
                  <span className="w-3 h-3 rounded-full shadow-inner border border-slate-200 dark:border-slate-700 bg-violet-400"></span>
                  {v.loai}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Tồn kho</div>
                <div className={`font-black text-xl ${getTonKhoColor(tt.tonKho, v.tonToiThieu)}`}>{tt.tonKho.toFixed(0)} <span className="text-sm font-semibold opacity-70">{v.dvt}</span></div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Giá trị</div>
                <div className="flex flex-col gap-1 mt-0.5">
                  <span className="text-[13px] font-black text-slate-700 dark:text-slate-200 bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.5 rounded shadow-sm border border-slate-200/50 dark:border-slate-700/50">{formatVNDShort(tt.giaTriTon)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Đơn giá</div>
                {editingVT === v.maVT ? (
                  <input
                    type="number"
                    className="w-20 text-sm font-bold text-slate-700 p-0.5 border rounded"
                    value={editForm.donGia || 0}
                    onChange={(e) => setEditForm({ ...editForm, donGia: Number(e.target.value) })}
                  />
                ) : (
                  <div className="font-bold text-slate-700 dark:text-slate-300">{v.donGia.toLocaleString()} ₫</div>
                )}
              </div>
              <div className="flex gap-1.5">
                {editingVT === v.maVT ? (
                  <>
                    <button onClick={() => onSaveEdit(v)} className="bg-green-500 hover:bg-green-600 text-white text-xs py-1.5 px-3 shadow-sm rounded-lg font-bold">Lưu</button>
                    <button onClick={() => setEditingVT(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs py-1.5 px-2 shadow-sm rounded-lg font-bold">Huỷ</button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingVT(v.maVT);
                        setEditForm({ tenVT: v.tenVT, donGia: v.donGia });
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs py-1.5 px-2 shadow-sm font-semibold rounded-lg"
                    >Sửa</button>
                    <button onClick={() => onShowXuat(v.maVT)} className="bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs py-1.5 px-3 shadow-sm font-semibold rounded-lg flex items-center gap-1">
                      <Minus className="w-3 h-3" /> Xuất
                    </button>
                    <button onClick={() => onShowNhap(v.maVT)} className="bg-sky-500 hover:bg-sky-600 text-white text-xs py-1.5 px-3 shadow-sm hover:shadow-md font-semibold rounded-lg flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Nhập
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
