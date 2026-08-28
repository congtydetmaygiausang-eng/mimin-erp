"use client";

// ============ BANG SIZE MANAGER MODAL ============
// Quan ly bang size cua tat ca SP trong danh muc
// Cho phep edit ratio nhanh (M/L/XL/2XL/3XL)
// 2026-08-04 - Mavis
//
// Features:
//   - List tat ca SP voi bang size hien thi
//   - Edit ratio inline (5 o M/L/XL/2XL/3XL)
//   - Auto-update RiSo
//   - Save vao DanhMucSPStore (localStorage)

import { useState, useEffect } from "react";
import { X, Ruler, Save, RotateCcw, Shirt, Search } from "lucide-react";
import { toast } from "sonner";
import { useDanhMucSP, type SanPham, type BangSize } from "@/lib/data/danh-muc-sp-store";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import { Portal } from "@/components/ui/Portal";

interface Props {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_BANGSIZE: BangSize = {
  sizes: ["M", "L", "XL", "2XL", "3XL"],
  ratios: [1, 2, 2, 2, 1],
  riSo: 8,
};

export default function BangSizeManagerModal({ open, onClose }: Props) {
  const { dsSanPham, suaSP } = useDanhMucSP();
  const [search, setSearch] = useState("");
  const [edits, setEdits] = useState<Record<string, BangSize>>({});
  const [dirty, setDirty] = useState(false);

  // Load edits khi mo modal hoac dsSanPham thay doi
  useEffect(() => {
    if (open) {
      const init: Record<string, BangSize> = {};
      (dsSanPham || []).forEach((sp) => {
        init[sp.id] = sp.bangSize || DEFAULT_BANGSIZE;
      });
      setEdits(init);
      setDirty(false);
    }
  }, [open, dsSanPham]);

  if (!open) return null;

  const filtered = (dsSanPham || []).filter(
    (sp) =>
      (sp?.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (sp?.tenSP || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdate = (spId: string, idx: number, val: number) => {
    setEdits((prev) => {
      const cur = prev[spId] || DEFAULT_BANGSIZE;
      const ratios = [...cur.ratios] as [number, number, number, number, number];
      ratios[idx] = Math.max(0, val);
      const riSo = ratios.reduce((a, b) => a + b, 0);
      return { ...prev, [spId]: { ...cur, ratios, riSo } };
    });
    setDirty(true);
  };

  const handleReset = (spId: string, sp: SanPham) => {
    setEdits((prev) => ({ ...prev, [spId]: sp.bangSize || DEFAULT_BANGSIZE }));
    setDirty(true);
  };

  const handleSaveAll = () => {
    let count = 0;
    Object.entries(edits).forEach(([spId, bangSize]) => {
      const sp = dsSanPham.find((s) => s.id === spId);
      if (sp) {
        const tiLeSize = bangSize.ratios.join(":");
        suaSP(spId, { ...sp, bangSize, tiLeSize });
        count++;
      }
    });
    toast.success(`✅ Đã lưu ${count} bảng size`);
    setDirty(false);
  };

  const handleApplyDefault = (spId: string) => {
    setEdits((prev) => ({ ...prev, [spId]: { ...DEFAULT_BANGSIZE } }));
    setDirty(true);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2B4C3E]/80 backdrop-blur-sm p-4 animate-fade-in">
        <div
          className="bg-[#F4F1EA] rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border-4 border-[#2B4C3E]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shrink-0">
            <h2 className="font-bold ml-2 text-lg flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              QUẢN LÝ BẢNG SIZE ({dsSanPham?.length || 0} SP)
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="p-4 bg-white border-b flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm Mã SP hoặc Tên SP..."
                className="w-full pl-10 pr-3 py-2 min-h-[44px] border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={handleSaveAll}
              disabled={!dirty}
              className={`w-full sm:w-auto px-5 py-2 min-h-[44px] rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-md ${
                dirty
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Save className="w-5 h-5" />
              {dirty ? "Lưu tất cả" : "Đã lưu"}
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Shirt className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>Chưa có sản phẩm nào trong danh mục</p>
              </div>
            ) : (
              filtered.map((sp) => {
                const bangSize = edits[sp.id] || sp.bangSize || DEFAULT_BANGSIZE;
                return (
                  <div
                    key={sp.id}
                    className="bg-white rounded-lg border-2 border-slate-200 p-4 hover:border-blue-300 transition-colors shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-1 bg-slate-100 rounded-md text-slate-700 font-bold border border-slate-200">
                            {sp.id}
                          </span>
                          <h3 className="font-bold text-slate-800 text-base">{sp.tenSP}</h3>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                          {LOAI_SP_LABELS[sp.loaiSP] || sp.loaiSP}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleApplyDefault(sp.id)}
                          className="text-xs px-3 py-2 min-h-[36px] bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-semibold transition-colors border border-slate-200"
                          title="Áp dụng ratio mặc định 1:2:2:2:1"
                        >
                          Mặc định
                        </button>
                        <button
                          onClick={() => handleReset(sp.id, sp)}
                          className="text-xs px-3 py-2 min-h-[36px] bg-amber-50 hover:bg-amber-100 rounded-lg text-amber-700 font-semibold flex items-center gap-1 transition-colors border border-amber-200"
                          title="Reset về giá trị gốc"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-4">
                      {bangSize.sizes.map((size, idx) => {
                        const r = bangSize.ratios[idx];
                        const isActive = r > 0;
                        return (
                          <div key={size} className="text-center">
                            <label className="text-[11px] font-black text-slate-500 uppercase block mb-1">
                              {size}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={r}
                              onChange={(e) => handleUpdate(sp.id, idx, Number(e.target.value))}
                              onFocus={(e) => e.target.select()}
                              className={`w-full px-1 sm:px-2 py-2 min-h-[44px] border-2 rounded-lg text-center font-black text-lg focus:outline-none transition-colors ${
                                isActive
                                  ? "border-blue-400 focus:ring-2 focus:ring-blue-500 bg-blue-50 text-blue-900"
                                  : "border-slate-200 focus:ring-2 focus:ring-slate-400 bg-slate-50 text-slate-400"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 text-xs">
                      <div className="flex gap-2 w-full sm:w-auto">
                        <div className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center gap-1">
                          <span className="font-semibold text-blue-700">Tỉ lệ: </span>
                          <span className="font-mono font-black text-blue-900">{bangSize.ratios.join(":")}</span>
                        </div>
                        <div className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center gap-1">
                          <span className="font-semibold text-emerald-700">Rì: </span>
                          <span className="font-mono font-black text-emerald-900">{bangSize.riSo} SP</span>
                        </div>
                      </div>
                      {bangSize.riSo > 0 && (
                        <div className="w-full sm:w-auto px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="text-amber-700 font-semibold">VD 100 SP = {Math.floor(100 / bangSize.riSo)} rì </span>
                          <span className="text-[10px] text-amber-600 font-medium">
                            (M:{Math.floor((100 / bangSize.riSo) * bangSize.ratios[0])}, L:{Math.floor((100 / bangSize.riSo) * bangSize.ratios[1])}, XL:{Math.floor((100 / bangSize.riSo) * bangSize.ratios[2])}, 2XL:{Math.floor((100 / bangSize.riSo) * bangSize.ratios[3])}, 3XL:{Math.floor((100 / bangSize.riSo) * bangSize.ratios[4])})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-100 p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs font-semibold text-slate-500 text-center sm:text-left w-full sm:w-auto">
              💡 Chỉnh ratio → tự tính Rì. Click "Lưu tất cả" khi xong.
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2 min-h-[44px] bg-slate-600 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors shadow-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
