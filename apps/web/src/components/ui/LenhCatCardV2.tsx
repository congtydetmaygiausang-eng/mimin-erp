"use client";

import React, { useState } from "react";
import { Calendar, Package, Shirt, Hash, Users, WalletCards, Maximize2 } from "lucide-react";
import ImageLightbox from "@/components/ui/ImageLightbox";
import type { LenhCat, MauVai, CongDoanItem, TrangThaiCongDoan } from "@/lib/data/lenh-cat-store";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import { useNhanSu } from "@/lib/data/nhan-su-store";
import { DateDisplay } from "./DateDisplay";
import { useKho } from "@/lib/data/kho-store";
import { tinhGiaVonLenhCat } from "@/lib/gia-von-lenh-cat";
import { LenhCatSummaryModal } from "@/app/(main)/lenh-cat/components/LenhCatSummaryModal";

interface Props {
  lc: LenhCat;
  onColorClick?: (mau: MauVai) => void;
  renderStatus?: React.ReactNode;
  bangChungSlot?: React.ReactNode;
  children?: React.ReactNode;
}

export function LenhCatCardV2({ lc, onColorClick, renderStatus, children, bangChungSlot }: Props) {
  const [zoomLogo, setZoomLogo] = useState<string | null>(null);
  const { list: dsNhanSu } = useNhanSu();
  const { giaoDich } = useKho();
  const [summaryView, setSummaryView] = useState<"owners" | "cost" | null>(null);
  const mainImg = lc.dsMau?.[0]?.img || "";
  const ketQuaGiaVon = tinhGiaVonLenhCat(lc, giaoDich);
  const giaVon1SP = ketQuaGiaVon.giaVon1SP;

  // Find Nguoi Phu Trach SX
  const ptCode = lc.phuTrachSX || "";
  const ptInfo = dsNhanSu.find(nv => nv.maNV === ptCode || nv.hoTen === ptCode);
  const ptDisplayName = ptInfo?.hoTen || ptCode || "Chưa phân công";
  const tongNguoiPhuTrach = new Set((lc.phanCong || []).filter((pc) => pc.nguoiMa || pc.nguoiTen).map((pc) => pc.nguoiMa || pc.nguoiTen)).size;
  const ptPhone = ptInfo?.sdt;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
      
      {/* PHẦN ĐẦU CARD: BỐ CỤC HIỂN THỊ RÕ ẢNH BÌA SẢN PHẨM & THÔNG TIN CHUNG */}
      <div className="p-5 md:p-6 bg-white border-b border-slate-100 flex flex-col md:flex-row gap-6 items-start">
        
        {/* ẢNH BÌA SẢN PHẨM (Khung ảnh tỷ lệ chuẩn 3:4, nhìn rõ toàn bộ sản phẩm) */}
        <div 
          onClick={() => mainImg && setZoomLogo(mainImg)}
          className="w-full md:w-[280px] lg:w-[320px] aspect-[3/4] shrink-0 bg-slate-100 rounded-2xl border border-slate-200 relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-all self-center md:self-start"
          title="Nhấp để xem ảnh bìa phóng to"
        >
          {mainImg ? (
            <>
              <img 
                loading="lazy" 
                decoding="async" 
                src={mainImg} 
                alt={lc.tenSP} 
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3.5 text-white">
                <span className="text-xs font-bold flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                  <Maximize2 className="w-3.5 h-3.5" /> Xem phóng to ảnh bìa
                </span>
              </div>
              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-black tracking-wider uppercase bg-black/60 text-white backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-sm flex items-center gap-1">
                  📸 Ảnh bìa
                </span>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
              <Shirt className="w-10 h-10 opacity-40" />
              <span className="font-bold tracking-widest uppercase text-xs">CHƯA CÓ ẢNH BÌA</span>
            </div>
          )}
        </div>

        {/* THÔNG TIN CHI TIẾT & CHỈ SỐ CỦA ĐƠN HÀNG */}
        <div className="flex-1 flex flex-col justify-between gap-5 min-w-0 w-full">
          
          {/* Hàng 1: Mã lệnh cắt, Trạng thái & Phụ trách SX */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-black text-teal-700 font-mono text-sm bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 shadow-sm tracking-wide">
                {lc.id}
              </span>
              {renderStatus}
            </div>
            
            <button
              onClick={() => setSummaryView("owners")}
              className="flex items-center gap-2.5 py-1.5 px-3.5 bg-slate-50 border border-slate-200/80 rounded-full shadow-sm hover:shadow hover:bg-white hover:border-indigo-200 transition-all cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center overflow-hidden shrink-0 border border-indigo-200/50 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-500 transition-colors">Phụ trách:</span>
              <span className="font-black text-slate-800 text-xs group-hover:text-indigo-700 transition-colors">
                {tongNguoiPhuTrach > 0 ? `${tongNguoiPhuTrach} người` : "Chưa phân công"}
              </span>
            </button>
          </div>

          {/* Hàng 2: Tên sản phẩm & Mã/Loại */}
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-2.5 group-hover:text-sky-600 transition-colors drop-shadow-sm">
              {lc.tenSP}
            </h2>
            <div className="flex items-center flex-wrap gap-2.5 text-xs font-bold">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <span className="uppercase text-[9px] text-slate-400 tracking-widest">Mã SP:</span>
                <span className="text-slate-800 font-mono">{lc.maSP || "---"}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <span className="uppercase text-[9px] text-slate-400 tracking-widest">Loại:</span>
                <span className="text-slate-800">{LOAI_SP_LABELS[lc.loaiSP] || lc.loaiSP || "---"}</span>
              </div>
            </div>
          </div>

          {/* Hàng 3: Khối 4 chỉ số KPI chính */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="flex flex-col items-center justify-center bg-sky-50/80 border border-sky-100 rounded-xl py-3 px-3 shadow-sm hover:shadow hover:bg-sky-50 transition-all">
              <span className="text-sky-600/80 flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest mb-1.5">
                <Hash className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Tổng SL</span>
              </span>
              <span className="font-black text-2xl md:text-3xl text-sky-900 leading-none truncate">
                {lc.tongSL?.toLocaleString() || "0"}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200/70 rounded-xl py-3 px-3 shadow-sm hover:shadow hover:bg-slate-100/60 transition-all">
              <span className="text-slate-500 flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest mb-1.5">
                <Shirt className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Tỷ lệ</span>
              </span>
              <span className="font-black text-lg md:text-xl text-slate-800 leading-none truncate">
                {lc.tiLeSize || "-"}
              </span>
            </div>
            <div className={`flex flex-col items-center justify-center rounded-xl border py-3 px-3 shadow-sm ${giaVon1SP > 0 ? "border-amber-200 bg-amber-50/80" : "border-rose-200 bg-rose-50/80"}`}>
              <span className={`flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest mb-1.5 ${giaVon1SP > 0 ? "text-amber-700" : "text-rose-600"}`}>
                <WalletCards className="w-3.5 h-3.5 shrink-0" /> Giá vốn/SP
              </span>
              <span className={`font-black text-base md:text-lg leading-none whitespace-nowrap ${giaVon1SP > 0 ? "text-amber-900" : "text-rose-700"}`}>
                {giaVon1SP > 0 ? `${giaVon1SP.toLocaleString("vi-VN")}đ` : "Thiếu dữ liệu"}
              </span>
              {ketQuaGiaVon.nguon === "tinh-lai" && <span className="mt-1 text-[9px] font-semibold text-amber-700">Tính lại từ kho</span>}
            </div>
            <div className="flex flex-col items-center justify-center bg-rose-50/80 border border-rose-100 rounded-xl py-3 px-3 shadow-sm hover:shadow hover:bg-rose-50 transition-all">
              <span className="text-rose-500 flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest mb-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Hạn giao</span>
              </span>
              <span className="font-black text-lg md:text-xl text-rose-700 leading-none truncate">
                <DateDisplay value={lc.hanHoanThanh} format="dd/MM" />
              </span>
            </div>
          </div>

          {/* Logo In/Thêu (nếu có) */}
          {lc.hinhMauInTheu && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logo In/Thêu:</span>
              <div 
                className="w-11 h-11 rounded-lg border-2 border-slate-200 bg-slate-50 cursor-pointer overflow-hidden shadow-sm hover:border-sky-400 transition-colors shrink-0"
                onClick={() => {
                  try {
                    const fileData = JSON.parse(lc.hinhMauInTheu!);
                    if (fileData.url) {
                      setZoomLogo(fileData.url);
                    }
                  } catch (e) {}
                }}
              >
                <img src={JSON.parse(lc.hinhMauInTheu).url} className="w-full h-full object-cover" alt="Hình in thêu" />
              </div>
              {lc.ghiChuInTheu && (
                <span className="text-[11px] text-slate-600 max-w-sm leading-tight">
                  <strong className="font-bold">Ghi chú in/thêu:</strong> {lc.ghiChuInTheu}
                </span>
              )}
            </div>
          )}

        </div>
      </div>

      {/* TIẾN TRÌNH ĐƠN HÀNG (FULL CHIỀU RỘNG CARD) */}
      {lc.phanCong && lc.phanCong.length > 0 && (
        <div className="px-6 py-5 bg-white border-b border-slate-100 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
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

      {/* DANH SÁCH MÀU (FULL CHIỀU RỘNG CARD) */}
      <div className="p-6 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-4 bg-teal-500 rounded-full"></span>
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
            Danh sách màu ({lc.dsMau?.length || 0})
          </span>
        </div>
        <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-5">
          {lc.dsMau?.map((mau, idx) => {
            const hasAoQuan = lc.loaiSP?.includes("Bo");
            return (
              <div key={idx} className="flex flex-col w-[150px] sm:w-[140px] group cursor-pointer" onClick={(e) => {
                if ((e.target as HTMLElement).closest('button')) return;
                onColorClick?.(mau);
              }}>
                <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 group-hover:border-sky-300 group-hover:shadow-md transition-all duration-300 bg-white relative flex">
                  {hasAoQuan ? (
                    <>
                      <div className="relative h-full w-[55%] skew-x-[-8deg] -ml-[5%] overflow-hidden border-r-[3px] border-white z-10 shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
                        <div className="w-[120%] h-full skew-x-[8deg] ml-[5%]">
                          {mau.img ? (
                            <img loading="lazy" decoding="async" src={mau.img} alt={mau.ten} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 font-bold text-[9px]">ÁO</div>
                          )}
                        </div>
                      </div>
                      <div className="relative h-full w-[55%] skew-x-[-8deg] overflow-hidden -mr-[5%] bg-slate-100">
                        <div className="w-[120%] h-full skew-x-[8deg] -ml-[15%]">
                          {(mau as any).imgQuan ? (
                            <img loading="lazy" decoding="async" src={(mau as any).imgQuan} alt={mau.ten} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-[9px]">QUẦN</div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="relative h-full w-full">
                      {mau.img ? (
                        <img loading="lazy" decoding="async" src={mau.img} alt={mau.ten} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
                
                {/* Button Nhập số lượng */}
                <div className="mt-3 w-full text-center">
                  <button 
                    onClick={() => onColorClick?.(mau)}
                    className="inline-block text-[10px] text-sky-600 font-bold bg-white px-3 py-1.5 rounded-lg group-hover:bg-sky-500 group-hover:text-white transition-colors w-full border border-sky-200 group-hover:border-sky-500 shadow-sm"
                  >
                    Nhập số lượng
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {bangChungSlot && (
          <div className="mt-8 border-t border-slate-200/60 pt-6">
            {bangChungSlot}
          </div>
        )}
      </div>

      {/* TIẾN ĐỘ CHI TIẾT & CÔNG VIỆC CON (CHILDREN) */}
      {children && (
        <div className="px-6 py-5 bg-white">
          {children}
        </div>
      )}

      {zoomLogo && (
        <ImageLightbox src={zoomLogo} onClose={() => setZoomLogo(null)} />
      )}
      {summaryView && <LenhCatSummaryModal lc={lc} view={summaryView} onClose={() => setSummaryView(null)} />}
    </div>
  );
}
