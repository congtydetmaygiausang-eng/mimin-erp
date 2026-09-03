import React, { useState, useEffect } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { X, Save, Factory, Users } from "lucide-react";
import type { LenhCat, PhanCongGiaCong } from "@/lib/data/lenh-cat-store";
import { DOI_TAC_GIA_CONG } from "@/lib/doi-tac-gia-cong";
import { Portal } from "@/components/ui/Portal";

interface Props {
  lc: LenhCat;
  type: "ao" | "quan";
  onClose: () => void;
  onSave: (slThucTe: number, dsPhanCongMoi: PhanCongGiaCong, newDsMau?: any[]) => void;
}

export function GiaCongModal({ lc, type, onClose, onSave }: Props) {
  const isAo = type === "ao";
  const title = isAo ? "Gia Công Áo" : "Gia Công Quần";

  // Lọc đối tác phù hợp theo áo/quần
  const dsDoiTac = DOI_TAC_GIA_CONG.filter(dt => {
    if (isAo) return dt.ma.startsWith("GC-TRU") || dt.ma.startsWith("GC-TRON");
    return dt.ma.startsWith("GC-QUAN");
  });

  // Phân công gia công
  const [phanCong, setPhanCong] = useState<PhanCongGiaCong>(lc.phanCong ? JSON.parse(JSON.stringify(lc.phanCong)) : []);

  // Lấy các khâu may áo hoặc quần từ phân công hiện tại
  const khauList = phanCong.filter(pc => {
    const ten = pc.tenCongDoan.toLowerCase();
    if (isAo) return ten.includes("may áo");
    return ten.includes("may quần");
  });
  
  // Quản lý size cho các màu
  const [dsMauState, setDsMauState] = useState<any[]>(lc.dsMau ? JSON.parse(JSON.stringify(lc.dsMau)) : []);

  // Tổng số lượng cắt thực tế được tính bằng tổng các size nhập vào
  const calculateTotal = () => {
    let total = 0;
    dsMauState.forEach(mau => {
      khauList.forEach(khau => {
        if (mau.tyLeSizeChiTiet && mau.tyLeSizeChiTiet[khau.id]) {
          mau.tyLeSizeChiTiet[khau.id].forEach((s: any) => {
            total += s.sl || 0;
          });
        }
      });
    });
    return total;
  };
  
  const defaultSL = isAo ? lc.tongSLThucTeAo || lc.tongSLThucTe || lc.tongSL : lc.tongSLThucTeQuan || lc.tongSLThucTe || lc.tongSL;
  const [slThucTe, setSlThucTe] = useState<number>(defaultSL);
  
  useEffect(() => {
    const calc = calculateTotal();
    if (calc > 0) setSlThucTe(calc);
  }, [dsMauState, phanCong]);

  const handleUpdateNguoiGiaCong = (khauId: string, nguoiMa: string) => {
    const doiTac = dsDoiTac.find(dt => dt.ma === nguoiMa);
    setPhanCong(prev => prev.map(pc => {
      if (pc.id === khauId) {
        return { ...pc, nguoiMa: nguoiMa, nguoiTen: doiTac ? doiTac.tenDonVi : "" };
      }
      return pc;
    }));
  };
  
  const handleSizeChange = (mauIdx: number, khauId: string, sizeIdx: number, val: number) => {
    setDsMauState(prev => {
      const next = [...prev];
      if (!next[mauIdx].tyLeSizeChiTiet) next[mauIdx].tyLeSizeChiTiet = {};
      if (!next[mauIdx].tyLeSizeChiTiet[khauId]) {
        // Khởi tạo từ phanBoSize
        const phanBoGoc = next[mauIdx].phanBoSize ? JSON.parse(JSON.stringify(next[mauIdx].phanBoSize)) : [];
        next[mauIdx].tyLeSizeChiTiet[khauId] = phanBoGoc.map((s: any) => ({ ...s, sl: 0 }));
      }
      if (next[mauIdx].tyLeSizeChiTiet[khauId][sizeIdx]) {
        next[mauIdx].tyLeSizeChiTiet[khauId][sizeIdx].sl = val;
      }
      return next;
    });
  };

  const handleSave = () => {
    onSave(slThucTe, phanCong, dsMauState);
    onClose();
  };

  return (
    <ResponsiveModal
      open={true}
      onClose={onClose}
      maxWidth="4xl"
      fullScreenMobile={true}
      title={
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isAo ? "bg-violet-500" : "bg-emerald-500"}`} />
          Giao Việc & Nhập Size {title}
        </div>
      }
    >
      {/* Body */}
      <div className="p-4 md:p-6 space-y-6 flex-1">
        {/* SL Thực tế */}
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-sm font-bold text-slate-600">Tổng số lượng ({isAo ? 'Áo' : 'Quần'})</div>
          <div className="text-2xl font-black text-sky-600">{slThucTe.toLocaleString()} <span className="text-sm text-slate-400">SP</span></div>
        </div>

        {/* Giao việc cho Khâu may */}
        {khauList.length > 0 ? (
          <div className="space-y-6">
            {khauList.map(khau => (
              <div key={khau.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* Khâu Header */}
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="font-black text-slate-700 flex items-center gap-2">
                    <Factory className="w-5 h-5 text-slate-400" /> {khau.tenCongDoan}
                  </div>
                  <select
                    value={khau.nguoiMa || ""}
                    onChange={(e) => handleUpdateNguoiGiaCong(khau.id, e.target.value)}
                    className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-lg min-h-[44px] text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- Chọn đơn vị gia công --</option>
                    {dsDoiTac.map(dt => (
                      <option key={dt.ma} value={dt.ma}>{dt.tenDonVi}</option>
                    ))}
                  </select>
                </div>
                
                {/* Bảng nhập size cho từng màu */}
                <div className="p-4 space-y-4">
                  {dsMauState.map((mau, mauIdx) => {
                    const chiTiet = mau.tyLeSizeChiTiet?.[khau.id] || (mau.phanBoSize ? JSON.parse(JSON.stringify(mau.phanBoSize)).map((s:any) => ({ ...s, sl: 0 })) : []);
                    const isVatTu = mau.ten.includes("Bo Cổ") || mau.ten.includes("Chỉ");
                    if (isVatTu || chiTiet.length === 0) return null;
                    
                    const totalMau = chiTiet.reduce((sum: number, s: any) => sum + (s.sl || 0), 0);
                    
                    return (
                      <div key={mauIdx} className="flex flex-col md:flex-row md:items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                        <div className="w-full md:w-48 font-bold text-slate-700 flex flex-col">
                          <span className="text-sm">{mau.ten}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{mau.maVai}</span>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-4 sm:flex sm:flex-wrap gap-3">
                          {chiTiet.map((sz: any, sIdx: number) => (
                            <div key={sIdx} className="w-full sm:w-16">
                              <label className="block text-center text-[10px] font-black text-slate-400 mb-1">{sz.size}</label>
                              <input
                                type="number"
                                min="0"
                                value={sz.sl || ""}
                                onChange={e => handleSizeChange(mauIdx, khau.id, sIdx, Number(e.target.value))}
                                onFocus={e => e.target.select()}
                                className="w-full text-center min-h-[44px] py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-500/50 outline-none"
                              />
                            </div>
                          ))}
                        </div>
                        
                        <div className="w-full md:w-24 text-right pt-4 md:pt-0 border-t md:border-0 border-slate-100 mt-2 md:mt-0 flex justify-between md:block items-center">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Tổng màu</div>
                          <div className="text-lg md:text-sm font-black text-emerald-600">{totalMau}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold text-center">
            Không tìm thấy khâu <b>May {isAo ? "Áo" : "Quần"}</b> trong lệnh cắt này.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0 rounded-b-xl">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl min-h-[44px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl min-h-[44px] font-bold text-white bg-sky-500 hover:bg-sky-600 flex items-center gap-2 transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" /> Xác nhận & Giao Việc
        </button>
      </div>
    </ResponsiveModal>
  );
}
