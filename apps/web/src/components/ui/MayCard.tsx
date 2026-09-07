import React from "react";
import { Calendar, Package, Shirt, Hash, ArrowRight, Image as ImageIcon, ChevronRight, Check } from "lucide-react";
import type { LenhCat, MauVai, TrangThaiCongDoan } from "@/lib/data/lenh-cat-store";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import { DateDisplay } from "./DateDisplay";

interface Props {
  lc: LenhCat;
  onColorClick?: (mau: MauVai) => void;
  renderStatus?: React.ReactNode;
  children?: React.ReactNode;
}

export function MayCard({ lc, onColorClick, renderStatus, children }: Props) {
  const mainImg = lc.dsMau?.[0]?.img || "";

  // Sắp xếp các khâu
  const sortedPhanCong = lc.phanCong ? [...lc.phanCong].sort((a, b) => {
    const STAGE_ORDER = ["cat", "in", "theu", "in_theu", "may_ao", "may_quan", "may", "qc", "khuy_nut", "ui", "dong_goi", "nhap_kho"];
    const aRank = STAGE_ORDER.findIndex(k => (a.id || "").toLowerCase().includes(k));
    const bRank = STAGE_ORDER.findIndex(k => (b.id || "").toLowerCase().includes(k));
    return (aRank >= 0 ? aRank : 999) - (bRank >= 0 ? bRank : 999);
  }) : [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row mb-8 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      {/* LEFT COLUMN: Large Premium Product Summary */}
      <div className="w-full md:w-80 shrink-0 bg-gradient-to-b from-slate-50 to-white border-r border-slate-100 p-6 flex flex-col relative z-10">
        <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden border border-slate-200/60 bg-white relative mb-5 shadow-sm group flex">
          <div className={`relative h-full overflow-hidden ${lc.loaiSP?.includes("Bo") ? "w-1/2 border-r border-slate-200/50" : "w-full"}`}>
            {mainImg ? (
              <img 
                src={mainImg} 
                alt={lc.tenSP} 
                className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110 origin-left" 
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                <span className="font-bold tracking-widest text-[10px] uppercase">NO IMAGE</span>
              </div>
            )}
          </div>
          {lc.loaiSP?.includes("Bo") && (
            <div className="relative h-full w-1/2 overflow-hidden">
              {(lc.dsMau?.[0] as any)?.imgQuan ? (
                <img 
                  src={(lc.dsMau?.[0] as any)?.imgQuan} 
                  alt={`${lc.tenSP} quần`} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110 origin-right" 
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-slate-50">
                  <span className="font-bold tracking-widest text-[10px] uppercase">NO PANTS</span>
                </div>
              )}
            </div>
          )}
          {/* Subtle overlay gradient on image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
        
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-black text-teal-700 font-mono text-base tracking-tight">{lc.id}</span>
            {renderStatus}
          </div>
          <h2 className="text-xl font-black text-slate-800 leading-tight tracking-tight">{lc.tenSP}</h2>
          
          <div className="flex gap-2 items-center mt-1">
            <div className="text-xs font-bold text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/60">
              {LOAI_SP_LABELS[lc.loaiSP] || lc.loaiSP}
            </div>
          </div>
          
          <div className="mt-auto pt-5 border-t border-slate-100 flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Tổng SL</span>
              <span className="font-black text-slate-800 text-base">{lc.tongSL?.toLocaleString()} <span className="text-xs text-slate-400 font-normal">SP</span></span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Hạn giao</span>
              <span className="font-black text-rose-600 flex items-center gap-1.5 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                <Calendar className="w-3.5 h-3.5" />
                <DateDisplay value={lc.hanHoanThanh} format="dd/MM/yyyy" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Progress, Colors, Tasks */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        
        {/* Top: Modern Progress Bar */}
        <div className="px-6 py-5 border-b border-slate-100 bg-white z-10 relative">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Tiến trình đơn hàng</div>
          
          <div className="flex items-center w-full relative">
            {/* Background track line */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-slate-100 -translate-y-1/2 z-0" />
            
            <div className="flex items-center justify-between w-full relative z-10">
              {sortedPhanCong.map((pc, i, arr) => {
                const tt = (pc.trangThaiCD as any) || "cho_giao";
                
                const isCompleted = tt === "hoan_thanh";
                const isWorking = tt === "dang_lam";
                const isWaiting = tt === "cho_giao";
                const isQCWaiting = tt === "cho_qc";
                const isError = tt === "co_loi";

                let dotColor = "bg-slate-200 border-slate-300";
                let textColor = "text-slate-400";
                
                if (isCompleted) {
                  dotColor = "bg-emerald-500 border-emerald-600";
                  textColor = "text-emerald-700 font-bold";
                } else if (isWorking) {
                  dotColor = "bg-teal-500 border-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.6)]";
                  textColor = "text-teal-700 font-black";
                } else if (isQCWaiting) {
                  dotColor = "bg-amber-400 border-amber-500";
                  textColor = "text-amber-600 font-bold";
                } else if (isError) {
                  dotColor = "bg-rose-500 border-rose-600";
                  textColor = "text-rose-600 font-bold";
                }

                return (
                  <div key={pc.id} className="flex flex-col items-center relative group" style={{ width: `${100 / arr.length}%` }}>
                    {/* The Dot */}
                    <div className="relative flex items-center justify-center">
                      {isWorking && (
                        <div className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-30" style={{ transform: 'scale(2.5)' }} />
                      )}
                      <div className={`w-3.5 h-3.5 rounded-full border-2 z-10 transition-colors duration-300 ${dotColor}`}></div>
                    </div>
                    
                    {/* The Label */}
                    <div className={`absolute top-6 whitespace-nowrap text-[10px] transition-all duration-300 ${textColor} ${isWorking ? 'scale-110' : ''}`}>
                      {pc.tenCongDoan}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="h-4" /> {/* spacing for labels */}
        </div>

        {/* Middle: Premium Colors */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/40 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Danh sách màu ({lc.dsMau?.length || 0})</div>
            <div className="text-[10px] text-slate-400">Bấm vào để xem / nhập size</div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {lc.dsMau?.map((mau, idx) => (
              <button 
                key={idx} 
                onClick={() => onColorClick?.(mau)}
                className="flex items-center gap-3 bg-white border border-slate-200/80 hover:border-teal-400 hover:shadow-lg hover:-translate-y-1 rounded-2xl pr-5 p-2 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl shrink-0 bg-slate-100 overflow-hidden relative shadow-sm flex">
                  <div className={`relative h-full overflow-hidden ${lc.loaiSP?.includes("Bo") ? "w-1/2 border-r border-slate-200/50" : "w-full"}`}>
                    {mau.img ? (
                      <img src={mau.img} alt={mau.ten} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 origin-left" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <span className="text-[8px] font-bold">NO IMG</span>
                      </div>
                    )}
                  </div>
                  {lc.loaiSP?.includes("Bo") && (
                    <div className="relative h-full w-1/2 overflow-hidden">
                      {(mau as any).imgQuan ? (
                        <img src={(mau as any).imgQuan} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 origin-right" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-slate-50">
                          <span className="text-[8px] font-bold text-center leading-none">NO<br/>IMG</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-left flex flex-col justify-center">
                  <div className="font-black text-slate-800 text-base group-hover:text-teal-700 transition-colors">{mau.ten}</div>
                  <div className="text-[11px] text-slate-400 font-medium tracking-wide">Nhập chi tiết →</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom: Children (Tasks) */}
        <div className="p-6 bg-slate-50/20 flex-1 relative z-0">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
