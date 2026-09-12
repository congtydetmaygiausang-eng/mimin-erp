"use client";

import React from "react";
import { Calendar, Package, Shirt, Hash, Users, MapPin, ArrowRight, Image as ImageIcon } from "lucide-react";
import type { LenhCat, MauVai, CongDoanItem, TrangThaiCongDoan } from "@/lib/data/lenh-cat-store";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import { useNhanSu } from "@/lib/data/nhan-su-store";
import { DateDisplay } from "./DateDisplay";

interface Props {
  lc: LenhCat;
  onColorClick?: (mau: MauVai) => void;
  renderStatus?: React.ReactNode;
  bangChungSlot?: React.ReactNode;
  children?: React.ReactNode;
}

export function LenhCatCardV2({ lc, onColorClick, renderStatus, children, bangChungSlot }: Props) {
  const { list: dsNhanSu } = useNhanSu();
  const mainImg = lc.dsMau?.[0]?.img || "";

  // Find Nguoi Phu Trach SX
  const ptCode = lc.phuTrachSX || "";
  const ptInfo = dsNhanSu.find(nv => nv.maNV === ptCode || nv.hoTen === ptCode);
  const ptDisplayName = ptInfo?.hoTen || ptCode || "Chưa phân công";
  const ptPhone = ptInfo?.sdt;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
      
      {/* LEFT COLUMN: Main Image */}
      <div className="w-full md:w-64 lg:w-[320px] xl:w-[360px] shrink-0 bg-slate-100 border-b md:border-b-0 md:border-r border-slate-200 relative min-h-[250px] md:min-h-full overflow-hidden group">
        {mainImg ? (
          <img src={mainImg} alt={lc.tenSP} className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <span className="font-bold tracking-widest uppercase text-sm">NO IMAGE</span>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Info & Colors */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Section */}
        <div className="px-6 py-6 border-b border-slate-100 flex flex-col gap-5 bg-white relative z-10">
          
          {/* Top row: Tags and Phụ trách SX */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-black text-teal-700 font-mono text-sm bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100/80 shadow-sm tracking-wide">{lc.id}</span>
              {renderStatus}
            </div>
            
            <div className="flex items-center gap-2.5 py-1.5 px-3.5 bg-slate-50 border border-slate-200/60 rounded-full shadow-sm hover:shadow transition-shadow">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center overflow-hidden shrink-0 border border-indigo-200/50">
                {ptInfo?.avatar ? <img src={ptInfo.avatar} className="w-full h-full object-cover" /> : <Users className="w-3.5 h-3.5" />}
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phụ trách:</span>
              <span className="font-black text-slate-800 text-xs">{ptDisplayName}</span>
              {ptPhone && (
                <a href={`https://zalo.me/${ptPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="ml-1 w-5 h-5 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" alt="Zalo" className="w-full h-full" />
                </a>
              )}
            </div>
          </div>

          {/* Title and Stats Row */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 sm:gap-6">
            <div className="flex-1 min-w-0 w-full">
              <h2 className="text-[26px] md:text-[30px] font-black text-slate-900 leading-[1.1] mb-3 group-hover:text-sky-600 transition-colors drop-shadow-sm">{lc.tenSP}</h2>
              <div className="flex items-center flex-wrap gap-3 text-xs font-bold">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <span className="uppercase text-[9px] text-slate-400 tracking-widest">Mã SP:</span>
                  <span className="text-slate-800">{lc.maSP || "---"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <span className="uppercase text-[9px] text-slate-400 tracking-widest">Loại:</span>
                  <span className="text-slate-800">{LOAI_SP_LABELS[lc.loaiSP] || lc.loaiSP || "---"}</span>
                </div>
              </div>
            </div>

            {/* Stats Blocks */}
            <div className="flex items-center gap-2 w-full lg:w-auto overflow-hidden pb-1 lg:pb-0">
              <div className="flex-1 lg:flex-none flex flex-col items-center justify-center bg-sky-50/70 border border-sky-100 rounded-xl py-3 px-2 sm:px-5 min-w-0 sm:min-w-[110px] shadow-sm hover:shadow hover:bg-sky-50 transition-all">
                <span className="text-sky-600/80 flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest mb-1.5"><Hash className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Tổng SL</span></span>
                <span className="font-black text-2xl sm:text-3xl text-sky-900 leading-none truncate">{lc.tongSL?.toLocaleString() || "0"}</span>
              </div>
              <div className="flex-1 lg:flex-none flex flex-col items-center justify-center bg-slate-50/70 border border-slate-200/60 rounded-xl py-3 px-2 sm:px-5 min-w-0 sm:min-w-[90px] shadow-sm hover:shadow hover:bg-slate-50 transition-all">
                <span className="text-slate-500 flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest mb-1.5"><Shirt className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Tỷ lệ</span></span>
                <span className="font-black text-lg sm:text-xl text-slate-800 leading-none truncate">{lc.tiLeSize || "-"}</span>
              </div>
              <div className="flex-1 lg:flex-none flex flex-col items-center justify-center bg-rose-50/70 border border-rose-100 rounded-xl py-3 px-2 sm:px-5 min-w-0 sm:min-w-[110px] shadow-sm hover:shadow hover:bg-rose-50 transition-all">
                <span className="text-rose-500 flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest mb-1.5"><Calendar className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Hạn giao</span></span>
                <span className="font-black text-lg sm:text-xl text-rose-700 leading-none truncate"><DateDisplay value={lc.hanHoanThanh} format="dd/MM" /></span>
              </div>
            </div>
          </div>
        </div>

        {/* Stages & Logo (Hình in thêu & Công đoạn) */}
        <div className="px-6 py-5 bg-white border-b border-slate-100 flex flex-col gap-4">
          {/* Workflow Stages */}
          {lc.phanCong && lc.phanCong.length > 0 && (
            <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-1.5 h-4 bg-teal-500 rounded-full"></span>
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Tiến trình đơn hàng</span>
              </div>
              <div className="flex items-start min-w-full relative px-2 sm:px-4">
                <div className="flex items-start justify-between w-full relative z-10">
                  {[...lc.phanCong].sort((a, b) => {
                    const STAGE_ORDER = ["cat", "in", "theu", "in_theu", "may_ao", "may_quan", "may", "qc", "khuy_nut", "ui", "dong_goi", "nhap_kho"];
                    const aRank = STAGE_ORDER.findIndex(k => (a.id || "").toLowerCase().includes(k));
                    const bRank = STAGE_ORDER.findIndex(k => (b.id || "").toLowerCase().includes(k));
                    return (aRank >= 0 ? aRank : 999) - (bRank >= 0 ? bRank : 999);
                  }).map((pc, i, arr) => {
                    const tt = (pc.trangThaiCD as any) || "cho_giao";
                    const isCompleted = tt === "hoan_thanh" || tt === "cho_qc";
                    const isWorking = tt === "dang_lam";
                    const isError = tt === "co_loi";
                    
                    let dotColor = "bg-slate-200 border-white";
                    let textColor = "text-slate-400";
                    let lineColor = "bg-slate-100";
                    
                    if (isCompleted) { dotColor = "bg-emerald-500 border-emerald-100 text-white"; textColor = "text-emerald-700 font-bold"; lineColor = "bg-emerald-500"; }
                    else if (isWorking) { dotColor = "bg-teal-500 border-teal-100 text-white shadow-[0_0_12px_rgba(20,184,166,0.4)]"; textColor = "text-teal-700 font-black"; lineColor = "bg-slate-200 bg-gradient-to-r from-teal-500 to-slate-200"; }
                    else if (isError) { dotColor = "bg-rose-500 border-rose-100 text-white"; textColor = "text-rose-600 font-bold"; }

                    return (
                      <div key={pc.id} className="flex-1 flex flex-col items-center relative group min-w-0 sm:min-w-[70px]">
                        {/* Connecting Line */}
                        {i < arr.length - 1 && (
                          <div className={`absolute top-[11px] left-[50%] w-full h-[4px] rounded-full z-0 ${lineColor} transition-colors duration-500`} />
                        )}
                        
                        <div className="relative flex items-center justify-center mb-2.5 h-[26px]">
                          {isWorking && <div className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-30" style={{ transform: 'scale(2.2)' }} />}
                          <div className={`w-[22px] h-[22px] rounded-full border-[3px] box-content z-10 transition-all duration-300 flex items-center justify-center ${dotColor}`}>
                            {isCompleted && <svg className="w-3.5 h-3.5 stroke-current stroke-[3]" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                          </div>
                        </div>
                        
                        <div className={`text-center leading-tight text-[9px] sm:text-[10px] max-w-[60px] sm:max-w-none transition-all duration-300 ${textColor} ${isWorking ? 'scale-110 -translate-y-0.5' : ''} flex flex-col items-center gap-1`}>
                          <span>{pc.tenCongDoan}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Logo In/Thêu */}
          {lc.hinhMauInTheu && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logo In/Thêu:</span>
              <div 
                className="w-12 h-12 rounded-lg border-2 border-slate-200 bg-slate-50 cursor-pointer overflow-hidden shadow-sm hover:border-sky-400 transition-colors shrink-0"
                onClick={() => {
                  try {
                    const fileData = JSON.parse(lc.hinhMauInTheu!);
                    if (fileData.url) {
                      const w = window.open();
                      if (w) w.document.write(`<img src="${fileData.url}" style="max-width:100%; max-height:100vh; object-fit:contain;"/>`);
                    }
                  } catch (e) {}
                }}
              >
                <img src={JSON.parse(lc.hinhMauInTheu).url} className="w-full h-full object-cover" alt="Hình in thêu" />
              </div>
              {lc.ghiChuInTheu && (
                <span className="text-[11px] text-slate-600 max-w-sm leading-tight"><strong className="font-bold">Ghi chú in/thêu:</strong><br/>{lc.ghiChuInTheu}</span>
              )}
            </div>
          )}
        </div>

        {/* Middle Section: Colors & Right Slot */}
        <div className="p-6 bg-slate-50 flex-1 flex flex-col xl:flex-row gap-6">
          {/* Colors Section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-4 bg-teal-500 rounded-full"></span>
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Danh sách màu ({lc.dsMau?.length || 0})</span>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-5">
              {lc.dsMau?.map((mau, idx) => {
                const hasAoQuan = lc.loaiSP?.includes("Bo");
                return (
                <div key={idx} className="flex flex-col w-[150px] sm:w-[140px] group cursor-pointer" onClick={(e) => {
                  // Prevent bubble up if clicking the button directly
                  if ((e.target as HTMLElement).closest('button')) return;
                  onColorClick?.(mau);
                }}>
                  {/* Red box (Image) */}
                  <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 group-hover:border-sky-300 group-hover:shadow-md transition-all duration-300 bg-white relative flex">
                    {hasAoQuan ? (
                      <>
                        <div className="relative h-full w-[55%] skew-x-[-8deg] -ml-[5%] overflow-hidden border-r-[3px] border-white z-10 shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
                          <div className="w-[120%] h-full skew-x-[8deg] ml-[5%]">
                            {mau.img ? (
                              <img src={mau.img} alt={mau.ten} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 font-bold text-[9px]">ÁO</div>
                            )}
                          </div>
                        </div>
                        <div className="relative h-full w-[55%] skew-x-[-8deg] overflow-hidden -mr-[5%] bg-slate-100">
                          <div className="w-[120%] h-full skew-x-[8deg] -ml-[15%]">
                            {(mau as any).imgQuan ? (
                              <img src={(mau as any).imgQuan} alt={mau.ten} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-[9px]">QUẦN</div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="relative h-full w-full">
                        {mau.img ? (
                          <img src={mau.img} alt={mau.ten} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-slate-50">
                            <span className="text-[10px] font-bold tracking-wider">NO IMG</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Floating badge for Color Name */}
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-3.5 py-1 rounded-full shadow-sm font-black text-slate-800 text-xs border border-white whitespace-nowrap z-20 transition-all group-hover:-translate-y-1 group-hover:shadow-md">
                      {mau.ten}
                    </div>
                  </div>
                  
                  {/* Green box (Button) */}
                  <div className="mt-3 w-full text-center">
                    <button 
                      onClick={() => onColorClick?.(mau)}
                      className="inline-block text-[10px] text-sky-600 font-bold bg-white px-3 py-1.5 rounded-lg group-hover:bg-sky-500 group-hover:text-white transition-colors w-full border border-sky-200 group-hover:border-sky-500 shadow-sm"
                    >
                      Nhập số lượng
                    </button>
                  </div>
                </div>
              )})}
            </div>
            
            {bangChungSlot && (
              <div className="mt-8 border-t border-slate-200/60 pt-6">
                {bangChungSlot}
              </div>
            )}
          </div>
        </div>

        {/* Children (Assigned Tasks & Actions) */}
        {children && (
          <div className="px-6 py-4 border-t border-slate-200 bg-white">
            {children}
          </div>
        )}
        
      </div>
    </div>
  );
}
