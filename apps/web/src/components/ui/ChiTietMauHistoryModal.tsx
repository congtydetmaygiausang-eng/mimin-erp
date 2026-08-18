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

const STAGE_ORDER = ["cat", "in", "theu", "in_theu", "may_ao", "may_quan", "may", "qc", "khuy_nut", "ui", "dong_goi", "nhap_kho"];

function sortPCsByStage(phanCong: CongDoanItem[] | undefined) {
  return [...(phanCong || [])].sort((a, b) => {
    const aRank = STAGE_ORDER.findIndex(k => a.id.toLowerCase().includes(k));
    const bRank = STAGE_ORDER.findIndex(k => b.id.toLowerCase().includes(k));
    return (aRank >= 0 ? aRank : 999) - (bRank >= 0 ? bRank : 999);
  });
}

function tongSizes(sizes: { size: string; sl: number }[] | undefined) {
  return (sizes || []).reduce((s, x) => s + (x.sl || 0), 0);
}

export function ChiTietMauHistoryModal({ isOpen, onClose, lc, mau, currentPCs, onSave }: Props) {
  // Chi tiết theo size cho các khâu hiện tại (editable)
  const [sizeInputs, setSizeInputs] = useState<Record<string, { size: string; sl: number }[]>>({});
  // SL Nhận (tổng, editable) cho các khâu hiện tại
  const [nhanInputs, setNhanInputs] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen && mau) {
      const sortedPCs = sortPCsByStage(lc.phanCong);
      const newSizeInputs: Record<string, { size: string; sl: number }[]> = {};
      const newNhanInputs: Record<string, number> = {};

      currentPCs.forEach(pc => {
        const existingSizes = mau.tyLeSizeChiTiet?.[pc.id];
        if (existingSizes && existingSizes.length > 0) {
          newSizeInputs[pc.id] = existingSizes.map(s => ({ ...s }));
          newNhanInputs[pc.id] = tongSizes(existingSizes);
          return;
        }

        // Cascade: tìm khâu gần nhất TRƯỚC pc đã có dữ liệu theo size
        const myIdx = sortedPCs.findIndex(p => p.id === pc.id);
        let cascadeSizes: { size: string; sl: number }[] | null = null;
        if (myIdx > 0) {
          for (let i = myIdx - 1; i >= 0; i--) {
            const prevSizes = mau.tyLeSizeChiTiet?.[sortedPCs[i].id];
            if (prevSizes && prevSizes.length > 0) { cascadeSizes = prevSizes; break; }
          }
        }

        const template = cascadeSizes || mau.phanBoSize || [];
        newSizeInputs[pc.id] = template.map(s => ({ size: s.size, sl: s.sl || 0 }));
        newNhanInputs[pc.id] = tongSizes(newSizeInputs[pc.id]);
      });

      setSizeInputs(newSizeInputs);
      setNhanInputs(newNhanInputs);
    }
  }, [isOpen, mau, currentPCs, lc.phanCong]);

  if (!isOpen || !mau) return null;

  // Find history: ALL PCs in the order that have data for this color, EXCLUDING the currentPCs
  // to avoid duplication (since currentPCs are shown as editable at the bottom).
  const currentPCIds = currentPCs.map(c => c.id);
  const sortedAll = sortPCsByStage(lc.phanCong);
  const historyPCs = sortedAll.filter(pc =>
    !currentPCIds.includes(pc.id) &&
    (mau.tyLeSizeChiTiet?.[pc.id]?.length || pc.chiTietMau?.some(c => c.mau === mau.ten))
  );

  const handleSizeChange = (pcId: string, sizeIdx: number, sl: number) => {
    setSizeInputs(prev => {
      const next = { ...prev, [pcId]: [...(prev[pcId] || [])] };
      if (next[pcId][sizeIdx]) next[pcId][sizeIdx] = { ...next[pcId][sizeIdx], sl };
      return next;
    });
  };

  const handleSave = () => {
    currentPCs.forEach(pc => {
      const sizes = sizeInputs[pc.id] || [];
      const tongDat = tongSizes(sizes);
      const soLuongNhan = nhanInputs[pc.id] ?? tongDat;
      const soLuongLoi = Math.max(0, soLuongNhan - tongDat);
      onSave(pc.id, {
        mau: mau.ten,
        soLuongNhan,
        soLuongDat: tongDat,
        soLuongLoi,
        sizes,
      });
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
                  const sizes = mau.tyLeSizeChiTiet?.[pc.id];
                  const data = pc.chiTietMau?.find(c => c.mau === mau.ten);

                  if (sizes && sizes.length > 0) {
                    const tong = tongSizes(sizes);
                    return (
                      <div key={pc.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div>
                            <div className="font-bold text-slate-700">{pc.tenCongDoan}</div>
                            <div className="text-xs text-slate-400">{pc.nguoiTen}</div>
                          </div>
                          <div className="text-sm font-black text-emerald-600">Tổng đạt: {tong.toLocaleString()}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {sizes.map((s, i) => (
                            <span key={i} className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600">
                              {s.size}: <span className="text-slate-800">{s.sl}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }

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

          {/* Form Nhập Liệu cho Khâu Hiện Tại - theo từng size */}
          {currentPCs.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-sky-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                Khâu hiện tại ({currentPCs.map(c => c.tenCongDoan).join(", ")})
              </h3>

              <div className="space-y-4">
                {currentPCs.map(pc => {
                  const sizes = sizeInputs[pc.id] || [];
                  const tongDat = tongSizes(sizes);
                  const soLuongNhan = nhanInputs[pc.id] ?? tongDat;
                  const soLuongLoi = Math.max(0, soLuongNhan - tongDat);

                  return (
                    <div key={pc.id} className="bg-sky-50/50 border border-sky-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3 border-b border-sky-100 pb-2">
                        <div className="font-bold text-sky-900">{pc.tenCongDoan} - {pc.nguoiTen || "Chưa giao"}</div>
                        <div className="text-sm font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-100">
                          Tổng đạt: <span className="text-emerald-600">{tongDat.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Size grid */}
                      {sizes.length > 0 ? (
                        <div className="flex flex-wrap gap-3 mb-3">
                          {sizes.map((sz, sIdx) => (
                            <div key={sIdx} className="flex flex-col items-center bg-white border border-slate-200 rounded-lg p-2 w-20">
                              <span className="text-xs font-black text-slate-600 mb-1">{sz.size}</span>
                              <input
                                type="number"
                                value={sz.sl || ""}
                                onChange={e => handleSizeChange(pc.id, sIdx, parseInt(e.target.value) || 0)}
                                onFocus={e => e.target.select()}
                                className="w-full px-2 py-1.5 text-center border border-emerald-300 bg-emerald-50/30 rounded focus:ring-2 focus:ring-emerald-400/50 outline-none text-sm font-bold text-emerald-700"
                                min="0"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic mb-3">Màu này chưa có phân bổ size ban đầu.</div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">SL Nhận</label>
                          <input
                            type="number"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                            value={soLuongNhan || ""}
                            onChange={e => setNhanInputs(prev => ({ ...prev, [pc.id]: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-rose-600 mb-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> SL Lỗi (tự tính)
                          </label>
                          <div className="w-full bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-rose-700 font-bold">
                            {soLuongLoi.toLocaleString()}
                          </div>
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
