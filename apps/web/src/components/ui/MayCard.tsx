import React from "react";
import { Calendar, Package, Shirt, Hash, ArrowRight, Image as ImageIcon, ChevronRight } from "lucide-react";
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row mb-6 overflow-hidden">
      {/* LEFT COLUMN: Compact Product Summary */}
      <div className="w-full md:w-56 shrink-0 bg-slate-50 border-r border-slate-200 p-4 flex flex-col">
        <div className="w-full aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white relative mb-3">
          {mainImg ? (
            <img src={mainImg} alt={lc.tenSP} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-300">
              <span className="font-bold tracking-widest text-[10px] uppercase">NO IMAGE</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-black text-teal-700 font-mono text-sm">{lc.id}</span>
            {renderStatus}
          </div>
          <h2 className="text-base font-black text-slate-800 leading-tight">{lc.tenSP}</h2>
          <div className="text-[11px] font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 self-start">
            {LOAI_SP_LABELS[lc.loaiSP] || lc.loaiSP}
          </div>
          
          <div className="mt-auto pt-3 border-t border-slate-200/60 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase">Tổng SL</span>
              <span className="font-black text-slate-800">{lc.tongSL?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase">Hạn giao</span>
              <span className="font-black text-rose-600"><DateDisplay value={lc.hanHoanThanh} format="dd/MM" /></span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Progress, Colors, Tasks */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        
        {/* Top: Progress Bar */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-2">Quy trình:</span>
          {lc.phanCong && [...lc.phanCong].sort((a, b) => {
            const STAGE_ORDER = ["cat", "in", "theu", "in_theu", "may_ao", "may_quan", "may", "qc", "khuy_nut", "ui", "dong_goi", "nhap_kho"];
            const aRank = STAGE_ORDER.findIndex(k => (a.id || "").toLowerCase().includes(k));
            const bRank = STAGE_ORDER.findIndex(k => (b.id || "").toLowerCase().includes(k));
            return (aRank >= 0 ? aRank : 999) - (bRank >= 0 ? bRank : 999);
          }).map((pc, i, arr) => {
            const tt = (pc.trangThaiCD as any) || "cho_giao";
            const ttStyles: any = {
              cho_giao: "text-slate-400",
              dang_lam: "text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full",
              cho_qc: "text-amber-600 font-bold",
              hoan_thanh: "text-emerald-600 font-bold opacity-60",
              co_loi: "text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full"
            };
            return (
              <React.Fragment key={pc.id}>
                <div className={`text-xs whitespace-nowrap flex items-center gap-1 ${ttStyles[tt] || ttStyles.cho_giao}`}>
                  {pc.tenCongDoan}
                  {tt === "hoan_thanh" && <span className="ml-1 text-[10px]">✓</span>}
                </div>
                {i < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mx-0.5" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Middle: Compact Colors */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Danh sách màu ({lc.dsMau?.length || 0})</div>
          <div className="flex flex-wrap gap-2">
            {lc.dsMau?.map((mau, idx) => (
              <button 
                key={idx} 
                onClick={() => onColorClick?.(mau)}
                className="flex items-center gap-2 bg-white border border-slate-200 hover:border-teal-400 rounded-lg pr-3 p-1 transition-all group shadow-sm"
              >
                <div className="w-8 h-8 rounded shrink-0 bg-slate-100 overflow-hidden relative">
                  {mau.img ? (
                    <img src={mau.img} alt={mau.ten} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <span className="text-[8px] font-bold">NO IMG</span>
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-700 text-xs group-hover:text-teal-700 transition-colors">{mau.ten}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom: Children (Tasks) */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
