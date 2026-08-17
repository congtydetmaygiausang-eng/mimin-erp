import { useState } from "react";
import { Save, X } from "lucide-react";
import type { LenhCat, MauVai } from "@/lib/data/lenh-cat-store";

interface Props {
  lc: LenhCat;
  onSave: (newDsMau: MauVai[], totalThucTe: number) => void;
  onCancel: () => void;
}

export function CatThucTeInput({ lc, onSave, onCancel }: Props) {
  const [dsMau, setDsMau] = useState<MauVai[]>(
    lc.dsMau?.map(mau => ({
      ...mau,
      slThucTe: mau.slThucTe || mau.slDuKien,
      kgThucTe: mau.kgThucTe || 0,
      haoHut: mau.haoHut || 0,
      phanBoSize: mau.phanBoSize ? mau.phanBoSize.map(s => ({ ...s })) : []
    })) || []
  );

  const handleMauChange = (idx: number, field: keyof MauVai, value: any) => {
    const newDs = [...dsMau];
    newDs[idx] = { ...newDs[idx], [field]: value };
    setDsMau(newDs);
  };

  const handleSizeChange = (mauIdx: number, sizeIdx: number, sl: number) => {
    const newDs = [...dsMau];
    const newSizes = [...newDs[mauIdx].phanBoSize];
    newSizes[sizeIdx] = { ...newSizes[sizeIdx], sl };
    newDs[mauIdx].phanBoSize = newSizes;
    
    // Auto-update slThucTe based on sum of sizes
    const sum = newSizes.reduce((acc, curr) => acc + (curr.sl || 0), 0);
    newDs[mauIdx].slThucTe = sum;
    
    setDsMau(newDs);
  };

  const handleSave = () => {
    const total = dsMau.reduce((acc, mau) => acc + (mau.slThucTe || 0), 0);
    onSave(dsMau, total);
  };

  return (
    <div className="bg-slate-50 border border-emerald-200 rounded-xl p-4 mt-4 shadow-sm animate-fade-in">
      <div className="text-sm font-black text-emerald-800 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Nhập Thông Số Thực Tế Sau Cắt
      </div>
      
      <div className="space-y-6">
        {dsMau.map((mau, mIdx) => (
          <div key={mIdx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
              {mau.img && <img src={mau.img} alt={mau.ten} className="w-6 h-6 rounded object-cover border" />}
              {mau.ten} (Dự kiến: {mau.slDuKien} SP)
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">SL Cắt Thực (SP)</label>
                <input 
                  type="number"
                  value={mau.slThucTe || ""}
                  onChange={e => handleMauChange(mIdx, "slThucTe", Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500/50 outline-none text-sm font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Vải tiêu hao (Kg)</label>
                <input 
                  type="number"
                  value={mau.kgThucTe || ""}
                  onChange={e => handleMauChange(mIdx, "kgThucTe", Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500/50 outline-none text-sm font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Hao hụt (Kg)</label>
                <input 
                  type="number"
                  value={mau.haoHut || ""}
                  onChange={e => handleMauChange(mIdx, "haoHut", Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500/50 outline-none text-sm font-bold text-slate-700"
                />
              </div>
            </div>

            {mau.phanBoSize && mau.phanBoSize.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2">Số lượng chi tiết theo Size</label>
                <div className="flex flex-wrap gap-2">
                  {mau.phanBoSize.map((sz, sIdx) => (
                    <div key={sIdx} className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded p-1.5 w-16">
                      <span className="text-[10px] font-black text-slate-600">{sz.size}</span>
                      <input 
                        type="number"
                        value={sz.sl || ""}
                        onChange={e => handleSizeChange(mIdx, sIdx, Number(e.target.value))}
                        className="w-full mt-1 px-1 py-1 text-center border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500/50 outline-none text-xs font-bold text-slate-800"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 mt-5">
        <button 
          onClick={onCancel}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <X className="w-4 h-4" /> Hủy
        </button>
        <button 
          onClick={handleSave}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" /> Lưu thông số
        </button>
      </div>
    </div>
  );
}
