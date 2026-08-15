"use client";

import { useWizard } from "../WizardContext";
import { Users } from "lucide-react";
import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";
import { DOI_TAC_GIA_CONG } from "@/lib/doi-tac-gia-cong";

const DEFAULT_GIA_CONG: any[] = [
  { id: "cat", tenCongDoan: "Cắt", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "mayAo", tenCongDoan: "May Áo", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "mayQuan", tenCongDoan: "May Quần", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "in", tenCongDoan: "In", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "theu", tenCongDoan: "Thêu", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "dongGoi", tenCongDoan: "Đóng Gói", nguoiMa: "", nguoiTen: "", donGia: 0 }
];

export function Step4Subcontractors() {
  const { state, updateState } = useWizard();
  
  // Initialize if empty
  const phanCong = state.phanCong.length > 0 ? state.phanCong : DEFAULT_GIA_CONG;

  const handleUpdate = (index: number, field: string, value: any) => {
    const updated = [...phanCong];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto fill name
    if (field === "nguoiMa") {
      const isDoiTac = value.startsWith("GC-");
      if (isDoiTac) {
        const dt = DOI_TAC_GIA_CONG.find(d => d.ma === value);
        if (dt) updated[index].nguoiTen = dt.tenDonVi;
      } else {
        const nv = REAL_NHAN_VIEN.find(n => n.ma === value);
        if (nv) updated[index].nguoiTen = nv.ten;
      }
    }
    
    updateState({ phanCong: updated });
  };

  const getDoiTuongOptions = () => {
    return [
      { label: "Nội bộ", items: REAL_NHAN_VIEN.map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten}` })) },
      { label: "Gia công ngoài", items: DOI_TAC_GIA_CONG.map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi}` })) }
    ];
  };

  const options = getDoiTuongOptions();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Phân Công Gia Công
        </h2>
        <p className="text-sm text-slate-500">Chỉ định đối tác/nhân viên thực hiện từng công đoạn</p>
      </div>

      <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700/50">
        <div className="space-y-4">
          {phanCong.map((pc, idx) => (
            <div key={pc.id} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 shadow-sm">
              <div className="w-full md:w-48 font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                {pc.tenCongDoan}
              </div>
              
              <div className="flex-1 w-full space-y-1">
                <label className="text-xs text-slate-500 block">Đơn vị / Người thực hiện</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={pc.nguoiMa} 
                  onChange={(e) => handleUpdate(idx, "nguoiMa", e.target.value)}
                >
                  <option value="none">-- Không chỉ định --</option>
                  {options.map(group => (
                    <optgroup key={group.label} label={group.label}>
                      {group.items.map(item => (
                        <option key={item.ma} value={item.ma}>{item.ten}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-48 space-y-1">
                <label className="text-xs text-slate-500 block">Đơn giá (đ/sp)</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={pc.donGia || ""} 
                  onChange={(e) => handleUpdate(idx, "donGia", Number(e.target.value))} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
