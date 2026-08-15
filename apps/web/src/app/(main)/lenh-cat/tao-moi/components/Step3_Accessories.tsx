"use client";

import { useWizard } from "../WizardContext";
import { Plus, Trash2, Package } from "lucide-react";
import { KHO_VAT_TU } from "@/lib/data/real-data";

export function Step3Accessories() {
  const { state, updateState } = useWizard();
  const dsPhuLieu = state.dsPhuLieu || [];

  const handleAddPL = () => {
    const newId = `pl_${Date.now()}`;
    const updated = [
      ...dsPhuLieu,
      {
        maPL: "",
        tenPL: "",
        soLuong: state.tongSL ? Number(state.tongSL) : 0,
        donGia: 0,
        dvt: "cái",
        ghiChu: "",
      }
    ];
    updateState({ dsPhuLieu: updated });
  };

  const handleRemovePL = (index: number) => {
    const updated = [...dsPhuLieu];
    updated.splice(index, 1);
    updateState({ dsPhuLieu: updated });
  };

  const handleUpdatePL = (index: number, field: string, value: any) => {
    const updated = [...dsPhuLieu];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto fill
    if (field === "maPL") {
      const vt = KHO_VAT_TU.find(v => v.maVT === value);
      if (vt) {
        updated[index].tenPL = vt.tenVT;
        updated[index].donGia = vt.donGia;
        updated[index].dvt = vt.dvt || "cái";
      }
    }
    
    updateState({ dsPhuLieu: updated });
  };

  // Group KHO_VAT_TU by Loai for better select UI
  const groupedVatTu = KHO_VAT_TU.reduce((acc: any, curr) => {
    const loai = curr.loai || "Khác";
    if (!acc[loai]) acc[loai] = [];
    acc[loai].push(curr);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Tính Toán Phụ Liệu
        </h2>
        <p className="text-sm text-slate-500">Bo cổ, cúc, chỉ, tem nhãn, bao bì (Nilon, PE...)</p>
      </div>

      <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">Danh sách Phụ Liệu / Vật Tư</h3>
          <button 
            type="button"
            onClick={handleAddPL} 
            className="flex items-center px-3 py-1.5 text-sm font-medium text-violet-600 bg-white border border-violet-200 rounded-md hover:bg-violet-50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm Phụ Liệu
          </button>
        </div>

        <div className="space-y-4">
          {dsPhuLieu.map((pl, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 shadow-sm">
              <div className="col-span-5 space-y-2">
                <label className="text-xs text-slate-500 block">Loại Vật Tư</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={pl.maPL} 
                  onChange={(e) => handleUpdatePL(idx, "maPL", e.target.value)}
                >
                  <option value="">Chọn phụ liệu...</option>
                  {Object.entries(groupedVatTu).map(([loai, list]: [string, any]) => (
                    <optgroup key={loai} label={loai}>
                      {list.map((v: any) => (
                        <option key={v.maVT} value={v.maVT}>{v.tenVT}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              
              <div className="col-span-3 space-y-2">
                <label className="text-xs text-slate-500 block">Số lượng ({pl.dvt})</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={pl.soLuong || ""} 
                  onChange={(e) => handleUpdatePL(idx, "soLuong", Number(e.target.value))} 
                />
              </div>

              <div className="col-span-3 space-y-2">
                <label className="text-xs text-slate-500 block">Đơn giá (đ)</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={pl.donGia || ""} 
                  onChange={(e) => handleUpdatePL(idx, "donGia", Number(e.target.value))} 
                />
              </div>

              <div className="col-span-1 flex items-end justify-end pb-1">
                <button 
                  type="button"
                  onClick={() => handleRemovePL(idx)} 
                  className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {dsPhuLieu.length === 0 && (
            <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-slate-300" />
              </div>
              <p>Chưa có phụ liệu. Thường thì một Lệnh cắt sẽ cần Chỉ, Tem cổ, Tem sườn, Bao PE.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
