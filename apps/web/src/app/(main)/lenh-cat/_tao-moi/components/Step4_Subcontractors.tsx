"use client";

import { useEffect, useWizard } from "../WizardContext";
import { Users, Briefcase } from "lucide-react";
import { DOI_TAC_GIA_CONG } from "@/lib/doi-tac-gia-cong";
import { useNhanSu } from "@/lib/data/nhan-su-store";

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
  const { list: nhanSuList } = useNhanSu();
  
  // Initialize if empty
  const phanCong = state.phanCong.length > 0 ? state.phanCong : DEFAULT_GIA_CONG;
  const isBo = state.loaiSP.toLowerCase().includes("bo");
  const visiblePhanCong = phanCong
    .map((pc, idx) => ({ pc, idx }))
    .filter(({ pc }) => isBo || !pc.tenCongDoan.toLowerCase().includes("quần"));

  useEffect(() => {
    if (state.phanCong.length > 0 && !isBo) {
      const filtered = state.phanCong.filter(pc => !pc.tenCongDoan.toLowerCase().includes("quần"));
      if (filtered.length !== state.phanCong.length) updateState({ phanCong: filtered });
    }
  }, [isBo, state.phanCong, updateState]);

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
        const nv = nhanSuList.find(n => n.maNV === value);
        if (nv) updated[index].nguoiTen = nv.hoTen;
      }
    }
    
    updateState({ phanCong: updated });
  };

  const getDoiTuongOptions = () => {
    return [
      { label: "Nội bộ", items: nhanSuList.map(nv => ({ ma: nv.maNV, ten: `${nv.maNV} - ${nv.hoTen}` })) },
      { label: "Gia công ngoài", items: DOI_TAC_GIA_CONG.map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi}` })) }
    ];
  };

  const options = getDoiTuongOptions();

  // Calculate total labor cost
  const totalLaborCost = visiblePhanCong.reduce((acc, { pc }) => acc + (pc.donGia || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Phân Công Gia Công
        </h2>
        <p className="text-sm text-slate-500">Chỉ định đối tác/nhân viên thực hiện từng công đoạn</p>
      </div>

      {/* Card Grid Layout - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visiblePhanCong.map(({ pc, idx }) => {
          const selectedDT = options
            .flatMap(g => g.items)
            .find(item => item.ma === pc.nguoiMa);
          
          const isSubcontractor = pc.nguoiMa?.startsWith("GC-");
          const displayName = pc.nguoiTen || (selectedDT ? selectedDT.ten.split(" - ")[1] : "Chưa chỉ định");

          return (
            <div 
              key={pc.id} 
              className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 shadow-sm hover:shadow-md transition-all p-6 space-y-4"
            >
              {/* Header - Công Đoạn */}
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{pc.tenCongDoan}</h3>
                  <p className="text-xs text-slate-400">Công đoạn {idx + 1}/7</p>
                </div>
              </div>

              {/* Người Phụ Trách */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  👤 Người / Đơn vị phụ trách
                </label>
                <div className="space-y-2">
                  <select 
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors"
                    value={pc.nguoiMa} 
                    onChange={(e) => handleUpdate(idx, "nguoiMa", e.target.value)}
                  >
                    <option value="">-- Chọn người / đơn vị --</option>
                    {options.map(group => (
                      <optgroup key={group.label} label={group.label}>
                        {group.items.map(item => (
                          <option key={item.ma} value={item.ma}>{item.ten}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  
                  {pc.nguoiTen && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                      <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                        {displayName}
                      </span>
                      {isSubcontractor && (
                        <span className="ml-auto text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">
                          Gia công ngoài
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Đơn Giá */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  💰 Đơn giá (đ/sp)
                </label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors"
                  value={pc.donGia || ""} 
                  onChange={(e) => handleUpdate(idx, "donGia", Number(e.target.value))} 
                />
                {pc.donGia > 0 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
                    = {formatCurrency(pc.donGia)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-violet-200 dark:border-violet-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">💵 Tổng Chi Phí Gia Công (1 sản phẩm)</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tổng cộng từ tất cả 7 công đoạn</p>
          </div>
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-bold text-violet-600 dark:text-violet-400">
              {formatCurrency(totalLaborCost)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
