"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertTriangle, Save, Clock, ArrowRight } from "lucide-react";
import type { LenhCat, MauVai, CongDoanItem } from "@/lib/data/lenh-cat-store";
import { productionStageRank, previousProductionStages } from "@/lib/production-stage-order";
import type { ChiTietMauInput } from "./KhaiBaoSoLuongTheoMau";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lc: LenhCat;
  mau: MauVai | null;
  currentPCs: CongDoanItem[]; // The PCs that the user is currently working on (can edit)
  onSave: (pcId: string, data: ChiTietMauInput) => void;
  onSaveBatch?: (entries: { pcId: string; data: ChiTietMauInput }[]) => Promise<boolean>;
  historyStage?: string;
  onNextColor?: (nextMau: MauVai) => void;
}

function sortPCsByStage(phanCong: CongDoanItem[] | undefined) {
  return [...(phanCong || [])].sort((a, b) => productionStageRank(a) - productionStageRank(b));
}

function tongSizes(sizes: { size: string; sl: number }[] | undefined) {
  return (sizes || []).reduce((s, x) => s + (x.sl || 0), 0);
}

export function ChiTietMauHistoryModal({ isOpen, onClose, lc, mau, currentPCs, onSave, onSaveBatch, historyStage, onNextColor }: Props) {
  const [saving, setSaving] = useState(false);
  // Chi tiết theo size cho các khâu hiện tại (editable)
  const [sizeInputs, setSizeInputs] = useState<Record<string, { size: string; sl: number }[]>>({});
  // SL Nhận (tổng, editable) cho các khâu hiện tại
  const [nhanInputs, setNhanInputs] = useState<Record<string, number>>({});
  // Cinema mode image zoom
  const [zoomedImg, setZoomedImg] = useState<{ src1: string; src2?: string } | null>(null);
  // Realtime can replace lc/mau/currentPCs while the user is typing. Only a
  // different color or editable stage selection should initialize the draft.
  const currentPCKey = currentPCs.map(pc => pc.id).join("|");

  useEffect(() => {
    if (isOpen && mau) {
      const sortedPCs = sortPCsByStage(lc.phanCong);
      const newSizeInputs: Record<string, { size: string; sl: number }[]> = {};
      const newNhanInputs: Record<string, number> = {};

      currentPCs.forEach(pc => {
        const existingSizes = mau.tyLeSizeChiTiet?.[pc.id];
        if (existingSizes && existingSizes.length > 0) {
          newSizeInputs[pc.id] = existingSizes.map(s => ({ ...s }));
          newNhanInputs[pc.id] = pc.chiTietMau?.find(color => color.mau === mau.ten)?.soLuongNhan ?? tongSizes(existingSizes);
          return;
        }

        // SL Nhận (số nhận vào khâu này) = số ĐẠT thật của khâu liền TRƯỚC -
        // đây là thông tin hợp lệ (không phải giả định). Khâu đầu tiên (Cắt)
        // thì SL nhận = SL dự kiến ban đầu.
        const myIdx = sortedPCs.findIndex(p => p.id === pc.id);
        let slNhan = 0;
        if (myIdx > 0) {
          for (let i = myIdx - 1; i >= 0; i--) {
            if (productionStageRank(sortedPCs[i]) >= productionStageRank(pc)) continue;
            const prevSizes = mau.tyLeSizeChiTiet?.[sortedPCs[i].id];
            if (prevSizes && prevSizes.length > 0) { slNhan = tongSizes(prevSizes); break; }
          }
        } else {
          slNhan = tongSizes(mau.phanBoSize);
        }

        // SL ĐẠT (số size nhập ở khâu này) KHÔNG được mặc định = số nhận -
        // từng khâu gia công đều có thể phát sinh lỗi/rớt số lượng, không có
        // căn cứ gì để giả định "y nguyên số nhận". Chỉ khâu Cắt (đầu tiên)
        // mới mặc định = SL dự kiến; các khâu sau để 0, bắt nhập số thực tế -
        // tránh lặp lại lỗi từng xảy ra: Cắt chỉ ra 488 mà May áo/Ủi/Đóng gói
        // lại tự hiện 496 (cao hơn cả số cắt được).
        const template = mau.phanBoSize || [];
        newSizeInputs[pc.id] = template.map(s => ({ size: s.size, sl: myIdx === 0 ? (s.sl || 0) : 0 }));
        newNhanInputs[pc.id] = slNhan;
      });

      setSizeInputs(newSizeInputs);
      setNhanInputs(newNhanInputs);
    }
  }, [isOpen, lc.id, mau?.ten, currentPCKey]);

  if (!isOpen || !mau) return null;

  const historyPCs = previousProductionStages(lc.phanCong || [],
    historyStage ? [{ id: historyStage, tenCongDoan: "" }] : currentPCs, mau)
    .filter(pc => !currentPCs.some(current => current.id === pc.id));

  const handleSizeChange = (pcId: string, sizeIdx: number, sl: number) => {
    setSizeInputs(prev => {
      const next = { ...prev, [pcId]: [...(prev[pcId] || [])] };
      if (next[pcId][sizeIdx]) next[pcId][sizeIdx] = { ...next[pcId][sizeIdx], sl };
      return next;
    });
  };

  const currentMauIndex = lc.dsMau?.findIndex(m => m.ten === mau.ten) ?? -1;
  const isLastMau = currentMauIndex === (lc.dsMau?.length || 1) - 1;
  const nextMau = (!isLastMau && currentMauIndex >= 0) ? lc.dsMau?.[currentMauIndex + 1] : null;

  const handleSaveAll = async (): Promise<boolean> => {
    const entries = currentPCs.map(pc => {
      const sizes = sizeInputs[pc.id] || [];
      const soLuongDat = tongSizes(sizes);
      const soLuongNhan = nhanInputs[pc.id] ?? soLuongDat;
      return { pcId: pc.id, data: {
        mau: mau.ten, soLuongNhan, soLuongDat,
        soLuongLoi: Math.max(0, soLuongNhan - soLuongDat), sizes,
      } };
    });
    if (entries.some(({ data }) => data.soLuongNhan < 0 || data.sizes.some(size => size.sl < 0)
      || data.soLuongDat > data.soLuongNhan)) {
      window.alert("Số lượng phải không âm và tổng Đạt không được lớn hơn SL Nhận.");
      return false;
    }
    if (entries.some(({ data }) => data.soLuongNhan > 0 && data.soLuongDat === 0)
      && !window.confirm("Tổng Đạt đang bằng 0. Toàn bộ SL Nhận của khâu này sẽ được ghi là LỖI. Anh có chắc muốn lưu không?")) {
      return false;
    }
    if (onSaveBatch) return onSaveBatch(entries);
    entries.forEach(({ pcId, data }) => onSave(pcId, data));
    return true;
  };

  const saveAndNavigate = async (next: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      if (!await handleSaveAll()) return;
      if (next && nextMau && onNextColor) onNextColor(nextMau);
      else onClose();
    } finally {
      setSaving(false);
    }
  };
  const handleSaveAndClose = () => saveAndNavigate(false);
  const handleSaveAndNext = () => saveAndNavigate(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white relative z-10">
          <div className="flex items-center gap-5">
            <div 
              className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50 flex cursor-pointer group relative shadow-sm"
              onClick={() => {
                const src1 = mau.img || "";
                const src2 = lc.loaiSP?.includes("Bo") && (mau as any).imgQuan ? (mau as any).imgQuan : undefined;
                if (src1 || src2) setZoomedImg({ src1, src2 });
              }}
              title="Bấm để xem ảnh lớn"
            >
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                <span className="text-white text-[10px] font-bold tracking-widest">ZOOM</span>
              </div>
              <div className={`relative h-full ${lc.loaiSP?.includes("Bo") ? "w-1/2 border-r border-slate-200" : "w-full"}`}>
                {mau.img ? (
                  <img src={mau.img} alt={mau.ten} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-300 text-center bg-slate-50">NO IMG{lc.loaiSP?.includes("Bo") ? <br/> : ""} {lc.loaiSP?.includes("Bo") ? "ÁO" : ""}</div>
                )}
              </div>
              {lc.loaiSP?.includes("Bo") && (
                <div className="relative h-full w-1/2">
                  {(mau as any).imgQuan ? (
                    <img src={(mau as any).imgQuan} alt={mau.ten} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-300 text-center bg-slate-50">NO IMG<br/>QUẦN</div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Chi tiết màu</span>
              <h2 className="text-[22px] md:text-2xl font-black text-slate-800 leading-none mb-2">
                <span className="bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent drop-shadow-sm">{mau.ten}</span>
              </h2>
              <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold tracking-wide">
                <span className="bg-slate-50 text-slate-600 px-2.5 py-0.5 rounded border border-slate-200 shadow-sm">Mã vải: <span className="text-slate-800">{mau.maVai || "---"}</span></span>
                <span className="bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded border border-sky-100 shadow-sm">Lệnh: {lc.id}</span>
              </div>
            </div>
          </div>
          <button disabled={saving} onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors border border-slate-200/60 shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Lịch sử */}
          {historyPCs.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-4 bg-teal-500 rounded-full"></span>
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Lịch sử các khâu trước</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {historyPCs.map(pc => {
                  const sizes = mau.tyLeSizeChiTiet?.[pc.id];
                  const data = pc.chiTietMau?.find(c => c.mau === mau.ten);

                  if (sizes && sizes.length > 0) {
                    const tong = tongSizes(sizes);
                    return (
                      <div key={pc.id} className="min-w-[240px] bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow transition-shadow">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div>
                            <div className="font-black text-sm text-slate-800 leading-tight">{pc.tenCongDoan}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{pc.nguoiTen}</div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Đạt</span>
                            <span className="text-lg font-black text-emerald-600 leading-none">{tong.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {sizes.map((s, i) => (
                            <span key={i} className="text-[10px] font-black bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5 text-slate-500">
                              {s.size}: <span className="text-slate-800">{s.sl}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (!data) return null;
                  return (
                    <div key={pc.id} className="min-w-[240px] bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
                      <div className="mb-3">
                        <div className="font-black text-sm text-slate-800 leading-tight">{pc.tenCongDoan}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{pc.nguoiTen}</div>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold bg-slate-50 p-2 rounded-xl">
                        <div className="flex flex-col flex-1 items-center justify-center">
                          <span className="text-[9px] uppercase text-slate-400">Nhận</span>
                          <span className="text-slate-700">{data.soLuongNhan.toLocaleString()}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-200"></div>
                        <div className="flex flex-col flex-1 items-center justify-center">
                          <span className="text-[9px] uppercase text-emerald-500">Đạt</span>
                          <span className="text-emerald-600">{data.soLuongDat.toLocaleString()}</span>
                        </div>
                        {data.soLuongLoi > 0 && (
                          <>
                            <div className="w-px h-6 bg-slate-200"></div>
                            <div className="flex flex-col flex-1 items-center justify-center">
                              <span className="text-[9px] uppercase text-rose-400">Lỗi</span>
                              <span className="text-rose-600">{data.soLuongLoi.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-4 bg-teal-500 rounded-full"></span>
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Lịch sử các khâu trước</span>
              </div>
              <div className="text-sm font-medium text-slate-400 bg-slate-50 p-4 rounded-2xl border border-slate-200 border-dashed text-center">
                Chưa có khâu nào nhập liệu cho màu này.
              </div>
            </div>
          )}

          <hr className="border-slate-100" />

          {/* Form Nhập Liệu cho Khâu Hiện Tại - theo từng size */}
          {currentPCs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4 mt-2">
                <span className="w-1.5 h-4 bg-teal-500 rounded-full"></span>
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Khâu hiện tại</span>
              </div>

              {/* Hướng dẫn nhập liệu */}
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100/60 rounded-2xl p-4 shadow-[0_2px_10px_rgb(59,130,246,0.05)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-indigo-500"></div>
                <h4 className="text-sm font-black text-indigo-800 mb-2 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs">💡</span> 
                  Hướng dẫn nhập số liệu
                </h4>
                <ul className="text-[13px] text-indigo-900/80 space-y-1.5 pl-7 list-disc font-medium leading-relaxed">
                  <li>Vui lòng kiểm đếm và nhập chính xác <strong className="text-indigo-700 bg-indigo-100/50 px-1 rounded">số lượng ĐẠT</strong> vào từng ô Size tương ứng.</li>
                  <li><strong className="text-indigo-700 bg-indigo-100/50 px-1 rounded">SL Nhận</strong> là số hàng thực tế xưởng nhận được từ khâu trước.</li>
                  <li>Nếu tổng số Đạt ít hơn SL Nhận, hệ thống sẽ <strong className="text-rose-600 bg-rose-50 px-1 rounded">tự động tính ra SL Lỗi</strong>.</li>
                </ul>
              </div>

              <div className="space-y-5">
                {currentPCs.map(pc => {
                  const sizes = sizeInputs[pc.id] || [];
                  const tongDat = tongSizes(sizes);
                  const soLuongNhan = nhanInputs[pc.id] ?? tongDat;
                  const soLuongLoi = Math.max(0, soLuongNhan - tongDat);

                  return (
                    <div key={pc.id} className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                      {/* Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 border-b border-slate-100 pb-5">
                        <div 
                          className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-200 shadow-sm relative cursor-pointer group"
                          onClick={() => {
                            const imgSrc = pc.id.includes("quan") && lc.loaiSP?.includes("Bo") ? (mau as any).imgQuan : mau.img;
                            if (imgSrc) setZoomedImg({ src1: imgSrc });
                          }}
                          title="Bấm để xem ảnh lớn"
                        >
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                            <span className="text-white text-[10px] font-bold tracking-widest">ZOOM</span>
                          </div>
                          {pc.id.includes("quan") && lc.loaiSP?.includes("Bo") ? (
                            (mau as any).imgQuan ? (
                              <img src={(mau as any).imgQuan} alt="quần" className="w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 bg-slate-50">NO IMG</div>
                            )
                          ) : (
                            mau.img ? (
                              <img src={mau.img} alt="áo" className="w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400 bg-slate-50">NO IMG</div>
                            )
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="text-xl font-black text-slate-800 leading-none mb-1.5">{pc.tenCongDoan}</div>
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{pc.nguoiTen || "Chưa giao"}</div>
                          <div className="mt-2 flex items-center">
                            <span className="px-2.5 py-0.5 rounded border border-teal-200/60 bg-teal-50 text-teal-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
                              Màu: {mau.ten}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-start sm:items-end bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                          <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Tổng đạt</span>
                          <span className="text-emerald-600 text-3xl font-black leading-none">{tongDat.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Size grid */}
                      {sizes.length > 0 ? (
                        <div className="flex flex-wrap gap-3 mb-6">
                          {sizes.map((sz, sIdx) => (
                            <div key={sIdx} className="flex flex-col items-center flex-1 min-w-[70px] max-w-[90px]">
                              <span className="text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-wide">{sz.size}</span>
                              <input
                                disabled={saving}
                                type="number"
                                value={sz.sl || ""}
                                onChange={e => handleSizeChange(pc.id, sIdx, parseInt(e.target.value) || 0)}
                                onFocus={e => e.target.select()}
                                className="w-full px-1 py-3 text-center border-[3px] border-emerald-100 bg-emerald-50/30 rounded-xl focus:ring-0 focus:border-emerald-400 outline-none text-xl font-black text-emerald-700 transition-colors shadow-sm"
                                min="0"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic mb-6">Màu này chưa có phân bổ size ban đầu.</div>
                      )}

                      {/* KPI Blocks for Nhận & Lỗi */}
                      <div className="flex gap-4 items-stretch flex-col sm:flex-row">
                        <div className="flex-1 bg-sky-50/50 border border-sky-100 rounded-2xl p-4 flex flex-col justify-center">
                          <label className="block text-[10px] uppercase font-black tracking-widest text-sky-600/70 mb-2">SL Nhận</label>
                          <input
                            disabled={saving}
                            type="number"
                            className="w-full bg-white border border-sky-200 rounded-xl px-4 py-2 text-sky-900 font-black text-2xl focus:ring-2 focus:ring-sky-500/30 outline-none transition-shadow shadow-sm"
                            value={soLuongNhan || ""}
                            onChange={e => setNhanInputs(prev => ({ ...prev, [pc.id]: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="flex-1 bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex flex-col justify-center">
                          <label className="block text-[10px] uppercase font-black tracking-widest text-rose-500/80 mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> SL Lỗi (Tự tính)
                          </label>
                          <div className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 text-rose-700 font-black text-2xl shadow-sm flex items-center">
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
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3 rounded-b-3xl">
            <button disabled={saving} onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-200 transition">
              Hủy
            </button>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                disabled={saving} onClick={handleSaveAndClose}
                className="px-6 py-3 bg-white border-2 border-teal-600 text-teal-700 hover:bg-teal-50 rounded-2xl font-black flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Save className="w-4 h-4" /> Lưu & Đóng
              </button>
              
              {onNextColor && nextMau ? (
                <button
                  disabled={saving} onClick={handleSaveAndNext}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition shadow-lg shadow-teal-500/30"
                >
                  <ArrowRight className="w-4 h-4" /> Lưu & Tiếp ({nextMau.ten})
                </button>
              ) : onNextColor && isLastMau ? (
                <button
                  disabled={saving} onClick={handleSaveAndClose}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition shadow-lg shadow-teal-500/30"
                >
                  <CheckCircle2 className="w-4 h-4" /> Hoàn tất màu cuối
                </button>
              ) : (
                <button
                  disabled={saving} onClick={handleSaveAndClose}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition shadow-lg shadow-teal-500/30"
                >
                  <Save className="w-4 h-4" /> Lưu thông tin
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Cinema Mode Image Zoom */}
      {zoomedImg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 md:p-8 animate-fade-in backdrop-blur-sm" onClick={() => setZoomedImg(null)}>
          <button 
            className="absolute top-4 right-4 md:top-8 md:right-8 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); setZoomedImg(null); }}
          >
            <X className="w-6 h-6" />
          </button>
          
          <div 
            className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 max-w-full max-h-full"
            onClick={e => e.stopPropagation()}
          >
            {zoomedImg.src1 && (
              <img src={zoomedImg.src1} alt="Preview" className="max-w-full md:max-w-[45vw] max-h-[40vh] md:max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            )}
            {zoomedImg.src2 && (
              <img src={zoomedImg.src2} alt="Preview 2" className="max-w-full md:max-w-[45vw] max-h-[40vh] md:max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
