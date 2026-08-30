"use client";

import { useRef, useState, useEffect } from "react";
import { useWizard } from "../WizardContext";
import { getAllInventory } from "@/lib/inventory-engine";
import type { KhoVai } from "@/lib/data/real-data";
import { Plus, Trash2, Layers, UploadCloud, Download, X, Eye, CheckCircle2, Wand2 } from "lucide-react";
import { AIMockupModal } from "@/components/AIMockupModal";

export const formatVND = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

export function Step2Fabric() {
  const { state, updateState } = useWizard();
  const [khoVaiList, setKhoVaiList] = useState<KhoVai[]>([]);

  useEffect(() => {
    setKhoVaiList(getAllInventory());
  }, []);
  
  // Sơ đồ Marker refs
  const fileChinhRef = useRef<HTMLInputElement>(null);
  const filePdfChinhRef = useRef<HTMLInputElement>(null);
  const filePhoiRef = useRef<HTMLInputElement>(null);
  const filePdfPhoiRef = useRef<HTMLInputElement>(null);

  // In / Thêu refs
  const imgInTheuRef = useRef<HTMLInputElement>(null);
  const fileInTheuRef = useRef<HTMLInputElement>(null);

  // Modal
  const [aiMockupIdx, setAiMockupIdx] = useState<number | null>(null);

  // Thêm mới mockup UI State (Giả lập In/Thêu)
  const [imgInTheu, setImgInTheu] = useState<string>("");
  const [fileInTheu, setFileInTheu] = useState<string>("");
  const [ghiChuInTheu, setGhiChuInTheu] = useState<string>("");

  const handleUploadSoDo = (e: any, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const mockStr = JSON.stringify({ name: file.name, url: "mock-url" });
      if (type === "chinh") updateState({ soDoChinh: mockStr });
      if (type === "pdf-chinh") updateState({ pdfSoDoChinh: mockStr });
      if (type === "phoi") updateState({ soDoPhoi: mockStr });
      if (type === "pdf-phoi") updateState({ pdfSoDoPhoi: mockStr });
    }
  };

  const handleColorImageUpload = (idx: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const next = [...state.dsMau];
          next[idx] = { ...next[idx], img: ev.target?.result as string };
          updateState({ dsMau: next });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const openAiMockup = (idx: number) => setAiMockupIdx(idx);
  
  const applyAIMockup = (url: string) => {
    if (aiMockupIdx === null) return;
    const next = [...state.dsMau];
    next[aiMockupIdx] = { ...next[aiMockupIdx], img: url };
    updateState({ dsMau: next });
  };

  const buildAiPrompt = (idx: number): string => {
    const loaiText = state.loaiSP === "BoTru" ? "bộ trụ" : "áo polo";
    const colorText = state.dsMau[idx]?.ten || "";
    if (state.tenSP) {
      return `${state.tenSP} ${loaiText} màu ${colorText}, may mặc Việt Nam, chất liệu cotton, studio lighting, nền trắng`;
    }
    return `mockup sản phẩm may mặc ${loaiText} màu ${colorText}, studio lighting, nền trắng`;
  };

  const dsMau = state.dsMau;
  const isBo = state.loaiSP?.toLowerCase().includes("bo");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Vải & Sơ Đồ Cắt
        </h2>
        <p className="text-sm text-slate-500">Chi tiết sơ đồ, màu sắc, vải và chia size cho lệnh cắt.</p>
      </div>

      {/* TÀI LIỆU IN/THÊU */}
      <div className="bg-[#FFF8E6] p-5 rounded-lg border border-amber-200/80 shadow-sm">
        <h2 className="text-lg font-bold text-[#8A6A1E] uppercase tracking-wide mb-4">Tài liệu In/Thêu (Mẫu)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">🖼️ Hình ảnh mẫu In/Thêu</label>
             <input type="file" className="hidden" accept="image/*" ref={imgInTheuRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setImgInTheu(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }
             }} />
             <div 
               className="w-full h-32 bg-amber-50/50 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer overflow-hidden group hover:border-amber-500 transition-colors flex items-center justify-center"
               onClick={() => !imgInTheu && imgInTheuRef.current?.click()}
             >
               {imgInTheu ? (
                 <div className="relative w-full h-full">
                    <img src={imgInTheu} className="w-full h-full object-contain" />
                    <button onClick={(e) => { e.stopPropagation(); setImgInTheu(""); imgInTheuRef.current && (imgInTheuRef.current.value = ""); }} className="absolute top-2 right-2 bg-red-100 text-red-600 p-1 rounded hover:bg-red-200"><X size={14}/></button>
                 </div>
               ) : (
                 <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-amber-700">
                   <UploadCloud className="w-8 h-8 mb-1" />
                   <span className="text-xs font-medium text-center">Tải lên ảnh<br/>(.jpg, .png)</span>
                 </div>
               )}
             </div>
          </div>
          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">📄 File gốc In/Thêu</label>
             <input type="file" className="hidden" ref={fileInTheuRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setFileInTheu(file.name);
             }} />
             <div 
               className="w-full h-32 bg-amber-50/50 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer overflow-hidden group hover:border-amber-500 transition-colors flex items-center justify-center"
               onClick={() => !fileInTheu && fileInTheuRef.current?.click()}
             >
               {fileInTheu ? (
                 <div className="flex flex-col items-center gap-2">
                   <div className="flex items-center gap-2">
                     <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                     <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{fileInTheu}</span>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); setFileInTheu(""); fileInTheuRef.current && (fileInTheuRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded"><X size={14} /> Xóa</button>
                 </div>
               ) : (
                 <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-amber-700">
                   <UploadCloud className="w-8 h-8 mb-1" />
                   <span className="text-xs font-medium text-center">Tải lên file<br/>(.pdf, .ai)</span>
                 </div>
               )}
             </div>
          </div>
        </div>
        <div className="mt-4">
          <input 
            type="text" 
            placeholder="Nhập ghi chú cho bên in/thêu (vd: kích thước, vị trí in, màu in, chất liệu)..." 
            className="w-full px-3 py-2 bg-white border border-amber-200 rounded text-sm focus:ring-1 focus:ring-amber-500 outline-none"
            value={ghiChuInTheu} onChange={e => setGhiChuInTheu(e.target.value)}
          />
        </div>
      </div>

      {/* SƠ ĐỒ CẮT (MARKER) */}
      <div className="bg-[#F0F7FF] p-5 rounded-lg border border-blue-200/80 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#1E3A8A] uppercase tracking-wide">SƠ ĐỒ CẮT (MARKER)</h2>
          <div className="flex items-center gap-2 bg-blue-100/50 px-3 py-1.5 rounded-full">
            <input type="checkbox" id="daCoSoDo" className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={state.daCoSoDo} onChange={e => updateState({daCoSoDo: e.target.checked})} />
            <label htmlFor="daCoSoDo" className="text-sm font-bold text-[#1E3A8A] cursor-pointer">Đã có sơ đồ</label>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sơ đồ chính */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
              <label className="text-sm font-bold text-slate-700">Sơ đồ vải chính / Áo</label>
              <div className="flex gap-2">
                <input type="text" placeholder="Khổ..." className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500" value={state.khoSoDoChinh} onChange={e => updateState({khoSoDoChinh: e.target.value})} />
                <input type="text" placeholder="Dài..." className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500" value={state.daiSoDoChinh} onChange={e => updateState({daiSoDoChinh: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <input type="file" className="hidden" ref={fileChinhRef} onChange={(e) => handleUploadSoDo(e, "chinh")} />
                <div 
                  className="relative w-full h-24 bg-white border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-blue-500 transition-colors flex items-center justify-center"
                  onClick={() => !state.soDoChinh && fileChinhRef.current?.click()}
                >
                  {state.soDoChinh ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                          {(() => { try { return JSON.parse(state.soDoChinh).name; } catch { return "Sơ đồ"; } })()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); updateState({soDoChinh: ""}); fileChinhRef.current && (fileChinhRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                          <X size={14} /> Xóa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-slate-500">
                      <UploadCloud className="w-8 h-8 mb-1" />
                      <span className="text-xs font-medium text-center">Tải lên file sơ đồ<br/>(PLT/ZIP)</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <input type="file" accept=".pdf" className="hidden" ref={filePdfChinhRef} onChange={(e) => handleUploadSoDo(e, "pdf-chinh")} />
                <div 
                  className="relative w-full h-24 bg-white border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-blue-500 transition-colors flex items-center justify-center"
                  onClick={() => !state.pdfSoDoChinh && filePdfChinhRef.current?.click()}
                >
                  {state.pdfSoDoChinh ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-red-500" />
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                          {(() => { try { return JSON.parse(state.pdfSoDoChinh).name; } catch { return "File PDF"; } })()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); updateState({pdfSoDoChinh: ""}); filePdfChinhRef.current && (filePdfChinhRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                          <X size={14} /> Xóa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-slate-500">
                      <UploadCloud className="w-8 h-8 mb-1" />
                      <span className="text-xs font-medium text-center">Upload PDF<br/>xem trước</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2">
              <textarea rows={2} placeholder="Ghi chú sơ đồ chính (dành cho cắt may)..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y" value={state.ghiChuSoDoChinh} onChange={e => updateState({ghiChuSoDoChinh: e.target.value})} />
            </div>
          </div>
          
          {/* Sơ đồ phối */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
              <label className="text-sm font-bold text-slate-700">Sơ đồ phối / Quần (nếu có)</label>
              <div className="flex gap-2">
                <input type="text" placeholder="Khổ..." className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500" value={state.khoSoDoPhoi} onChange={e => updateState({khoSoDoPhoi: e.target.value})} />
                <input type="text" placeholder="Dài..." className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500" value={state.daiSoDoPhoi} onChange={e => updateState({daiSoDoPhoi: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <input type="file" className="hidden" ref={filePhoiRef} onChange={(e) => handleUploadSoDo(e, "phoi")} />
                <div 
                  className="relative w-full h-24 bg-white border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-blue-500 transition-colors flex items-center justify-center"
                  onClick={() => !state.soDoPhoi && filePhoiRef.current?.click()}
                >
                  {state.soDoPhoi ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                          {(() => { try { return JSON.parse(state.soDoPhoi).name; } catch { return "Sơ đồ phối"; } })()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); updateState({soDoPhoi: ""}); filePhoiRef.current && (filePhoiRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                          <X size={14} /> Xóa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-slate-500">
                      <UploadCloud className="w-8 h-8 mb-1" />
                      <span className="text-xs font-medium text-center">Tải lên file sơ đồ<br/>(PLT/ZIP)</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <input type="file" accept=".pdf" className="hidden" ref={filePdfPhoiRef} onChange={(e) => handleUploadSoDo(e, "pdf-phoi")} />
                <div 
                  className="relative w-full h-24 bg-white border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-blue-500 transition-colors flex items-center justify-center"
                  onClick={() => !state.pdfSoDoPhoi && filePdfPhoiRef.current?.click()}
                >
                  {state.pdfSoDoPhoi ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-red-500" />
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                          {(() => { try { return JSON.parse(state.pdfSoDoPhoi).name; } catch { return "File PDF"; } })()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); updateState({pdfSoDoPhoi: ""}); filePdfPhoiRef.current && (filePdfPhoiRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                          <X size={14} /> Xóa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-slate-500">
                      <UploadCloud className="w-8 h-8 mb-1" />
                      <span className="text-xs font-medium text-center">Upload PDF<br/>xem trước</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2">
              <textarea rows={2} placeholder="Ghi chú sơ đồ phối (dành cho cắt may)..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y" value={state.ghiChuSoDoPhoi} onChange={e => updateState({ghiChuSoDoPhoi: e.target.value})} />
            </div>
          </div>
        </div>
      </div>

      {/* MÀU SẮC, VẢI & CHIA SIZE */}
      <div className="bg-[#E6F3EE] p-5 rounded-lg border border-emerald-200/80 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#2B4C3E] uppercase tracking-wide">MÀU SẮC, VẢI & CHIA SIZE</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-[#2B4C3E]">Số màu vải cắt:</label>
            <input 
              type="number" 
              className="w-16 px-2 py-1 text-center rounded border border-white focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              value={state.soMau} 
              onChange={e => {
                const count = Math.max(1, parseInt(e.target.value) || 1);
                updateState({ soMau: count });
                const currentMau = [...dsMau];
                if (count > currentMau.length) {
                  for (let i = currentMau.length; i < count; i++) {
                    currentMau.push({ ten: `Màu ${i+1}`, maSKU: "", maVai: "", dinhMuc: 0, slDuKien: 0, img: "", ghiChu: "", phanBoSize: [] });
                  }
                } else if (count < currentMau.length) {
                  currentMau.splice(count);
                }
                updateState({ dsMau: currentMau });
              }} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {dsMau.map((mau, idx) => (
            <div key={idx} className={`bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row gap-4 ${isBo ? "md:col-span-2" : ""}`}>
              {/* Left: Image */}
              <div className="w-full sm:w-1/3 flex flex-col gap-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Màu {idx + 1}</div>
                <input 
                  type="text"
                  className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded font-bold" 
                  placeholder="Tên màu..."
                  value={mau.ten}
                  onChange={(e) => {
                    const next = [...dsMau]; next[idx].ten = e.target.value; updateState({ dsMau: next });
                  }}
                />
                <div 
                  className="relative w-full aspect-square bg-slate-100 border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-[#2B4C3E] transition-colors flex items-center justify-center"
                  onClick={() => handleColorImageUpload(idx)}
                >
                  {mau.img ? (
                    <img src={mau.img} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center opacity-50 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-8 h-8 text-[#2B4C3E]" />
                      <span className="text-xs mt-2 text-slate-600 font-medium">Tải ảnh</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openAiMockup(idx); }}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold rounded hover:from-violet-600 hover:to-fuchsia-600 transition-all shadow-sm"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Tạo mockup bằng AI
                </button>
              </div>

              {/* Right: Details & Sizes */}
              <div className="w-full sm:w-2/3 flex flex-col gap-3 justify-center">
                <div className="flex gap-2">
                  <div className="w-full">
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">Mã SKU Biến Thể</label>
                    <input 
                      type="text"
                      className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded font-bold text-emerald-700" 
                      placeholder="VD: SP001-DEN"
                      value={mau.maSKU || ""}
                      onChange={(e) => {
                        const next = [...dsMau]; next[idx].maSKU = e.target.value; updateState({ dsMau: next });
                      }}
                    />
                  </div>
                </div>

                {isBo ? (
                  <div className="flex flex-col lg:flex-row gap-2">
                    <div className="w-full lg:w-1/2 p-2 bg-blue-50/50 rounded border border-blue-100 flex flex-col gap-2">
                      <div>
                        <div className="text-[10px] font-bold text-blue-700 mb-1">ÁO - Kho Vải</div>
                        <select 
                          className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                          value={mau.maVai}
                          onChange={(e) => {
                            const next = [...dsMau]; next[idx].maVai = e.target.value; updateState({ dsMau: next });
                          }}
                        >
                          <option value="">-- Chọn vải --</option>
                          {khoVaiList.map((kv) => (
                            <option key={kv.maVT} value={kv.maVT}>{kv.maVT} - {kv.tenVT}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 block mb-1">Định mức (kg/áo):</div>
                        <input 
                          type="number" step="0.01"
                          className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                          value={mau.dinhMuc || ""}
                          onChange={(e) => {
                            const next = [...dsMau]; next[idx].dinhMuc = parseFloat(e.target.value) || 0; updateState({ dsMau: next });
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-full lg:w-1/2 p-2 bg-rose-50/50 rounded border border-rose-100 flex flex-col gap-2">
                      <div>
                        <div className="text-[10px] font-bold text-rose-700 mb-1">QUẦN - Kho Vải</div>
                        <select 
                          className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                          value={mau.maVaiQuan || ""}
                          onChange={(e) => {
                            const next = [...dsMau]; next[idx].maVaiQuan = e.target.value; updateState({ dsMau: next });
                          }}
                        >
                          <option value="">-- Chọn vải --</option>
                          {khoVaiList.map((kv) => (
                            <option key={kv.maVT} value={kv.maVT}>{kv.maVT} - {kv.tenVT}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 block mb-1">Định mức (kg/quần):</div>
                        <input 
                          type="number" step="0.01"
                          className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                          value={mau.dinhMucQuan || ""}
                          onChange={(e) => {
                            const next = [...dsMau]; next[idx].dinhMucQuan = parseFloat(e.target.value) || 0; updateState({ dsMau: next });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="w-2/3">
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">Kho Vải Chính</label>
                      <select 
                        className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                        value={mau.maVai}
                        onChange={(e) => {
                          const next = [...dsMau]; next[idx].maVai = e.target.value; updateState({ dsMau: next });
                        }}
                      >
                        <option value="">-- Chọn vải --</option>
                        {KHO_VAI.map((kv) => (
                          <option key={kv.maVT} value={kv.maVT}>{kv.maVT} - {kv.tenVT}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Định mức (kg/sp):</label>
                      <input 
                        type="number" step="0.01"
                        className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                        value={mau.dinhMuc || ""}
                        onChange={(e) => {
                          const next = [...dsMau]; next[idx].dinhMuc = parseFloat(e.target.value) || 0; updateState({ dsMau: next });
                        }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-blue-700 block mb-1">SL Dự kiến cắt (Màu này):</label>
                  <input 
                    type="number" 
                    className="w-full px-2 py-1.5 border-2 border-blue-400 text-sm rounded font-bold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={mau.slDuKien || ""}
                    placeholder="VD: 125"
                    onChange={(e) => {
                      const next = [...dsMau]; next[idx].slDuKien = parseInt(e.target.value) || 0; updateState({ dsMau: next });
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-2">
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 mb-2">Tự động bung size theo tỉ lệ {state.tiLeSize}:</div>
                    <div className="flex flex-wrap gap-2">
                      {mau.phanBoSize && mau.phanBoSize.length > 0 ? mau.phanBoSize.map(pb => (
                         <div key={pb.size} className="flex flex-col items-center bg-white border rounded p-1 w-12 shadow-sm">
                           <span className="text-[10px] font-bold text-slate-400">{pb.size}</span>
                           <span className="text-sm font-bold text-slate-700">{pb.sl}</span>
                         </div>
                      )) : <span className="text-xs text-slate-400">Nhập SL Dự kiến để chia size...</span>}
                    </div>
                  </div>

                  <div className="flex flex-col bg-amber-50/50 p-2 rounded border border-amber-200/50">
                    <label className="text-[10px] font-bold text-amber-700 mb-1">Ghi chú (Phối, kỹ thuật):</label>
                    <textarea 
                      className="w-full flex-1 px-2 py-1.5 border border-amber-200 rounded text-sm focus:outline-none focus:border-amber-400 resize-none bg-white"
                      placeholder="Ghi chú kỹ thuật riêng..."
                      value={mau.ghiChu || ""}
                      onChange={(e) => {
                        const next = [...dsMau]; next[idx].ghiChu = e.target.value; updateState({ dsMau: next });
                      }}
                    />
                  </div>
                </div>

                {/* TÍNH TOÁN TỒN KHO & GIÁ */}
                {(() => {
                  const v = khoVaiList.find(x => x.maVT === mau.maVai);
                  const donGia = v ? (v.donGia || 0) : 0;
                  const tonKho = v ? (v.tonKho || 0) : 0;
                  let tienVai1SP = mau.dinhMuc * donGia;
                  let kgCan = mau.dinhMuc * (mau.slDuKien || 0);
                  
                  let vQuan = null;
                  let tonKhoQuan = 0;
                  let kgCanQuan = 0;
                  if (isBo && mau.maVaiQuan) {
                    vQuan = khoVaiList.find(x => x.maVT === mau.maVaiQuan);
                    tonKhoQuan = vQuan ? (vQuan.tonKho || 0) : 0;
                    kgCanQuan = (mau.dinhMucQuan || 0) * (mau.slDuKien || 0);
                    tienVai1SP += (mau.dinhMucQuan || 0) * (vQuan?.donGia || 0);
                  }
                  
                  const tongTienVaiMau = tienVai1SP * (mau.slDuKien || 0);
                  
                  return (
                    <div className="flex flex-col gap-2 mt-1">
                      {/* Cảnh báo tồn kho */}
                      {(mau.maVai || mau.maVaiQuan) && (
                        <div className="flex flex-wrap gap-2">
                          {mau.maVai && (
                            <div className={`flex-1 p-2 rounded border text-xs ${kgCan > tonKho ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                              <div className="font-bold mb-1">{isBo ? 'ÁO' : 'VẢI CHÍNH'}</div>
                              <div>Cần: <span className="font-bold">{kgCan.toFixed(1)} kg</span></div>
                              <div>Tồn kho: <span className="font-bold">{tonKho.toFixed(1)} kg</span></div>
                            </div>
                          )}
                          {isBo && mau.maVaiQuan && (
                            <div className={`flex-1 p-2 rounded border text-xs ${kgCanQuan > tonKhoQuan ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                              <div className="font-bold mb-1">QUẦN</div>
                              <div>Cần: <span className="font-bold">{kgCanQuan.toFixed(1)} kg</span></div>
                              <div>Tồn kho: <span className="font-bold">{tonKhoQuan.toFixed(1)} kg</span></div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <div className="w-1/2 bg-slate-50 p-2 rounded border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500">Giá vải / 1 SP</div>
                          <div className="text-sm font-bold text-slate-700">{formatVND(tienVai1SP)}</div>
                        </div>
                        <div className="w-1/2 bg-slate-50 p-2 rounded border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500">Tổng tiền vải màu này</div>
                          <div className="text-sm font-bold text-slate-700">{formatVND(tongTienVaiMau)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AIMockupModal 
        open={aiMockupIdx !== null}
        onClose={() => setAiMockupIdx(null)}
        onApply={applyAIMockup}
        colorIndex={aiMockupIdx || 0}
        colorName={aiMockupIdx !== null ? state.dsMau[aiMockupIdx]?.ten || "" : ""}
        defaultPrompt={aiMockupIdx !== null ? buildAiPrompt(aiMockupIdx) : ""}
        productName={state.tenSP}
      />
    </div>
  );
}
