import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertTriangle, Save, Clock } from "lucide-react";
import type { LenhCat, MauVai, CongDoanItem } from "@/lib/data/lenh-cat-store";
import type { ChiTietMauInput } from "./KhaiBaoSoLuongTheoMau";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lc: LenhCat;
  mau: MauVai | null;
  currentPCs: CongDoanItem[]; // The PCs that the user is currently working on (can edit)
  onSave: (pcId: string, data: ChiTietMauInput) => void;
}

export function ChiTietMauHistoryModal({ isOpen, onClose, lc, mau, currentPCs, onSave }: Props) {
  // Local state for the inputs of currentPCs
  const [inputs, setInputs] = useState<Record<string, ChiTietMauInput>>({});

  useEffect(() => {
    if (isOpen && mau) {
      // Lấy danh sách các khâu từ phân công và sắp xếp theo quy trình chuẩn
      const STAGE_ORDER = ["cat", "in", "theu", "in_theu", "may_ao", "may_quan", "may", "qc", "khuy_nut", "ui", "dong_goi", "nhap_kho"];
      const sortedPCs = [...(lc.phanCong || [])].sort((a, b) => {
        const aRank = STAGE_ORDER.findIndex(k => a.id.toLowerCase().includes(k));
        const bRank = STAGE_ORDER.findIndex(k => b.id.toLowerCase().includes(k));
        return (aRank >= 0 ? aRank : 999) - (bRank >= 0 ? bRank : 999);
      });

      const initial: Record<string, ChiTietMauInput> = {};
      currentPCs.forEach(pc => {
        const existing = pc.chiTietMau?.find(c => c.mau === mau.ten);
        if (existing) {
          initial[pc.id] = { ...existing };
        } else {
          // Tìm số lượng đạt của khâu liền trước để gán làm số lượng nhận
          let prevDat = mau.slThucTe || mau.slDuKien || 0;
          const myIdx = sortedPCs.findIndex(p => p.id === pc.id);
          
          if (myIdx > 0) {
            for (let i = myIdx - 1; i >= 0; i--) {
              const prevData = sortedPCs[i].chiTietMau?.find(c => c.mau === mau.ten);
              if (prevData && typeof prevData.soLuongDat === 'number') {
                prevDat = prevData.soLuongDat;
                break; // Tìm được khâu gần nhất có dữ liệu thì dừng
              }
            }
          }

          initial[pc.id] = {
            mau: mau.ten,
            soLuongNhan: prevDat,
            soLuongDat: prevDat,
            soLuongLoi: 0,
          };
        }
      });
      setInputs(initial);
    }
  }, [isOpen, mau, currentPCs]);

  if (!isOpen || !mau) return null;

  // Find history: ALL PCs in the order that have data for this color, EXCLUDING the currentPCs
  // to avoid duplication (since currentPCs are shown as editable at the bottom).
  const currentPCIds = currentPCs.map(c => c.id);
  const historyPCs = (lc.phanCong || []).filter(pc => 
    !currentPCIds.includes(pc.id) && pc.chiTietMau?.some(c => c.mau === mau.ten)
  );

  const handleInputChange = (pcId: string, field: keyof ChiTietMauInput, val: number) => {
    setInputs(prev => ({
      ...prev,
      [pcId]: {
        ...prev[pcId],
        [field]: val
      }
    }));
  };

  const handleSave = () => {
    // Call onSave for each currentPC
    currentPCs.forEach(pc => {
      if (inputs[pc.id]) {
        onSave(pc.id, inputs[pc.id]);
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-slate-200 shrink-0 bg-white">
              {mau.img ? (
                <img src={mau.img} alt={mau.ten} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-300">NO IMG</div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Chi tiết màu: <span className="text-teal-600">{mau.ten}</span></h2>
              <p className="text-sm font-bold text-slate-500">Mã vải: {mau.maVai} • Lệnh: {lc.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white hover:bg-slate-200 flex items-center justify-center text-slate-500 transition border border-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Lịch sử */}
          {historyPCs.length > 0 ? (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Lịch sử các khâu trước
              </h3>
              <div className="space-y-3">
                {historyPCs.map(pc => {
                  const data = pc.chiTietMau?.find(c => c.mau === mau.ten);
                  if (!data) return null;
                  return (
                    <div key={pc.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-700">{pc.tenCongDoan}</div>
                        <div className="text-xs text-slate-400">{pc.nguoiTen}</div>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-bold">
                        <div className="text-slate-600">Nhận: {data.soLuongNhan.toLocaleString()}</div>
                        <div className="text-emerald-600">Đạt: {data.soLuongDat.toLocaleString()}</div>
                        {data.soLuongLoi > 0 && (
                          <div className="text-rose-600">Lỗi: {data.soLuongLoi.toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Lịch sử các khâu trước
              </h3>
              <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                Chưa có khâu nào nhập liệu cho màu này.
              </div>
            </div>
          )}

          <hr className="border-slate-100" />

          {/* Form Nhập Liệu cho Khâu Hiện Tại */}
          {currentPCs.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-sky-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                Khâu hiện tại ({currentPCs.map(c => c.tenCongDoan).join(", ")})
              </h3>
              
              <div className="space-y-4">
                {currentPCs.map(pc => {
                  const val = inputs[pc.id];
                  if (!val) return null;

                  return (
                    <div key={pc.id} className="bg-sky-50/50 border border-sky-100 rounded-xl p-4">
                      <div className="font-bold text-sky-900 mb-3 border-b border-sky-100 pb-2">{pc.tenCongDoan} - {pc.nguoiTen || "Chưa giao"}</div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">SL Nhận</label>
                          <input 
                            type="number" 
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                            value={val.soLuongNhan || ""}
                            onChange={e => handleInputChange(pc.id, "soLuongNhan", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-emerald-600 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> SL Đạt
                          </label>
                          <input 
                            type="number" 
                            className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-700 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={val.soLuongDat || ""}
                            onChange={e => handleInputChange(pc.id, "soLuongDat", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-rose-600 mb-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> SL Lỗi
                          </label>
                          <input 
                            type="number" 
                            className="w-full bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-rose-700 font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                            value={val.soLuongLoi || ""}
                            onChange={e => handleInputChange(pc.id, "soLuongLoi", parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
        </div>

        {/* Footer */}
        {currentPCs.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition">
              Hủy
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-2 transition shadow-md shadow-teal-500/20"
            >
              <Save className="w-4 h-4" /> Lưu thông tin
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
