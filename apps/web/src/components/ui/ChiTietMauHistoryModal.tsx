import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertTriangle, Save, Clock, ArrowRight } from "lucide-react";
import type { LenhCat, MauVai, CongDoanItem } from "@/lib/data/lenh-cat-store";
import type { ChiTietMauInput } from "./KhaiBaoSoLuongTheoMau";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lc: LenhCat;
  mau: MauVai | null;
  currentPCs: CongDoanItem[]; // The PCs that the user is currently working on (can edit)
  onSave: (pcId: string, data: ChiTietMauInput) => void;
  onNextColor?: (nextMau: MauVai) => void;
}

const STAGE_ORDER = ["cat", "in", "theu", "in_theu", "may_ao", "may_quan", "may", "qc", "khuy_nut", "ui", "dong_goi", "nhap_kho"];

function sortPCsByStage(phanCong: CongDoanItem[] | undefined) {
  return [...(phanCong || [])].sort((a, b) => {
    const aRank = STAGE_ORDER.findIndex(k => a.id?.toLowerCase().includes(k));
    const bRank = STAGE_ORDER.findIndex(k => b.id?.toLowerCase().includes(k));
    return (aRank >= 0 ? aRank : 999) - (bRank >= 0 ? bRank : 999);
  });
}

function tongSizes(sizes: { size: string; sl: number }[] | undefined) {
  return (sizes || []).reduce((s, x) => s + (x.sl || 0), 0);
}

export function ChiTietMauHistoryModal({ isOpen, onClose, lc, mau, currentPCs, onSave, onNextColor }: Props) {
  // Chi tiết theo size cho các khâu hiện tại (editable)
  const [sizeInputs, setSizeInputs] = useState<Record<string, { size: string; sl: number }[]>>({});
  // SL Nhận (tổng, editable) cho các khâu hiện tại
  const [nhanInputs, setNhanInputs] = useState<Record<string, number>>({});
  // Cinema mode image zoom
  const [zoomedImg, setZoomedImg] = useState<{ src1: string; src2?: string } | null>(null);

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

        // SL Nhận (số nhận vào khâu này) = số ĐẠT thật của khâu liền TRƯỚC -
        // đây là thông tin hợp lệ (không phải giả định). Khâu đầu tiên (Cắt)
        // thì SL nhận = SL dự kiến ban đầu.
        const myIdx = sortedPCs.findIndex(p => p.id === pc.id);
        let slNhan = 0;
        if (myIdx > 0) {
          for (let i = myIdx - 1; i >= 0; i--) {
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

  const currentMauIndex = lc.dsMau?.findIndex(m => m.ten === mau.ten) ?? -1;
  const isLastMau = currentMauIndex === (lc.dsMau?.length || 1) - 1;
  const nextMau = (!isLastMau && currentMauIndex >= 0) ? lc.dsMau?.[currentMauIndex + 1] : null;

  const handleSaveAll = () => {
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
  };

  const handleSaveAndClose = () => {
    handleSaveAll();
    onClose();
  };

  const handleSaveAndNext = () => {
    if (nextMau && onNextColor) {
      handleSaveAll();
      onNextColor(nextMau);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-xl overflow-hidden border-2 border-slate-200 shrink-0 bg-white flex cursor-pointer group relative"
              onClick={() => {
                const src1 = mau.img || "";
                const src2 = lc.loaiSP?.includes("Bo") && (mau as any).imgQuan ? (mau as any).imgQuan : undefined;
                if (src1 || src2) setZoomedImg({ src1, src2 });
              }}
              title="Bấm để xem ảnh lớn"
            >
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                <span className="text-white text-[10px] font-bold">ZOOM</span>
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
              <div className="flex items-center gap-3 mb-4 mt-2">
                <h3 className="text-sm font-bold text-sky-600 uppercase tracking-widest flex items-center gap-2">
                  Khâu hiện tại
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-sky-200 to-transparent"></div>
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

              <div className="space-y-4">
                {currentPCs.map(pc => {
                  const sizes = sizeInputs[pc.id] || [];
                  const tongDat = tongSizes(sizes);
                  const soLuongNhan = nhanInputs[pc.id] ?? tongDat;
                  const soLuongLoi = Math.max(0, soLuongNhan - tongDat);

                  return (
                    <div key={pc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-md transition-all duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5 border-b border-slate-100 pb-4">
                        <div 
                          className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-200 shadow-sm relative cursor-pointer group"
                          onClick={() => {
                            const imgSrc = pc.id.includes("quan") && lc.loaiSP?.includes("Bo") ? (mau as any).imgQuan : mau.img;
                            if (imgSrc) setZoomedImg({ src1: imgSrc });
                          }}
                          title="Bấm để xem ảnh lớn"
                        >
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                            <span className="text-white text-[10px] font-bold">ZOOM</span>
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
                          <div className="text-lg font-black text-slate-800">{pc.tenCongDoan}</div>
                          <div className="text-sm text-slate-500 font-medium">{pc.nguoiTen || "Chưa giao"}</div>
                          <div className="mt-1.5 flex items-center">
                            <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[11px] font-bold border border-teal-100 shadow-sm uppercase tracking-wider">
                              MÀU: {mau.ten}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-sm">
                            Tổng đạt: <span className="text-emerald-600 text-base ml-1">{tongDat.toLocaleString()}</span>
                          </div>
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
                                className="w-full px-2 py-2 text-center border border-emerald-300 bg-emerald-50/30 rounded-lg focus:ring-2 focus:ring-emerald-400/50 outline-none text-base font-bold text-emerald-700 transition-shadow"
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
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">SL Nhận</label>
                          <input
                            type="number"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-bold focus:ring-2 focus:ring-sky-500 outline-none transition-shadow shadow-sm"
                            value={soLuongNhan || ""}
                            onChange={e => setNhanInputs(prev => ({ ...prev, [pc.id]: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-rose-600 mb-1.5 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> SL Lỗi (tự tính)
                          </label>
                          <div className="w-full bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 text-rose-700 font-bold shadow-sm">
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
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition">
              Hủy
            </button>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSaveAndClose}
                className="px-6 py-2.5 bg-white border border-teal-600 text-teal-600 hover:bg-teal-50 rounded-xl font-bold flex items-center justify-center gap-2 transition"
              >
                <Save className="w-4 h-4" /> Lưu & Đóng
              </button>
              
              {onNextColor && nextMau ? (
                <button
                  onClick={handleSaveAndNext}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-md shadow-teal-500/20"
                >
                  <ArrowRight className="w-4 h-4" /> Lưu & Tiếp ({nextMau.ten})
                </button>
              ) : onNextColor && isLastMau ? (
                <button
                  onClick={handleSaveAndClose}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-md shadow-teal-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Hoàn tất màu cuối
                </button>
              ) : (
                <button
                  onClick={handleSaveAndClose}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-md shadow-teal-500/20"
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
