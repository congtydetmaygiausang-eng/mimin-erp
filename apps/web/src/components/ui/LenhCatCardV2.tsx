import React from "react";
import { Calendar, Package, Shirt, Hash, Users, MapPin, ArrowRight } from "lucide-react";
import type { LenhCat, MauVai, CongDoanItem, TrangThaiCongDoan } from "@/lib/data/lenh-cat-store";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import { DateDisplay } from "./DateDisplay";

interface Props {
  lc: LenhCat;
  onColorClick?: (mau: MauVai) => void;
  renderStatus?: React.ReactNode;
  children?: React.ReactNode;
}

export function LenhCatCardV2({ lc, onColorClick, renderStatus, children }: Props) {
  const mainImg = lc.dsMau?.[0]?.img || "";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
      
      {/* LEFT COLUMN: Main Image */}
      <div className="w-full md:w-64 lg:w-80 shrink-0 bg-slate-100 border-r border-slate-200 relative min-h-[300px]">
        {mainImg ? (
          <img src={mainImg} alt={lc.tenSP} className="w-full h-full object-cover absolute inset-0" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <span className="font-bold tracking-widest uppercase">NO IMAGE</span>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Info & Colors */}
      <div className="flex-1 flex flex-col">
        {/* Header Section */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-black text-teal-700 font-mono text-lg">{lc.id}</span>
              {renderStatus}
            </div>
            <h2 className="text-2xl font-black text-slate-800">{lc.tenSP}</h2>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold border border-slate-200">
                Mã SP: {lc.maSP}
              </span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold border border-slate-200">
                {/* loaiSP là "AoTru" | "BoTru" | "PhuKien"... - so sánh với "bo"/"ao"
                    luôn sai nên trước đây mọi lệnh cắt đều hiện "Quần". */}
                Loại: {LOAI_SP_LABELS[lc.loaiSP] || lc.loaiSP}
              </span>
            </div>
          </div>
          
          <div className="flex flex-row sm:flex-col gap-6 sm:gap-2 text-sm text-right">
            <div className="flex flex-col items-end">
              <span className="text-slate-400 flex items-center gap-1 text-xs uppercase font-bold"><Hash className="w-3 h-3" /> Tổng SL</span>
              <span className="font-black text-lg text-slate-800">{lc.tongSL?.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-slate-400 flex items-center gap-1 text-xs uppercase font-bold"><Shirt className="w-3 h-3" /> Tỷ lệ</span>
              <span className="font-black text-lg text-sky-600">{lc.tiLeSize || "-"}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-slate-400 flex items-center gap-1 text-xs uppercase font-bold"><Calendar className="w-3 h-3" /> Hạn giao</span>
              <span className="font-black text-lg text-rose-600"><DateDisplay value={lc.hanHoanThanh} format="dd/MM" /></span>
            </div>
          </div>
        </div>

        {/* Stages & Logo (Hình in thêu & Công đoạn) */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex flex-col gap-3">
          {/* Workflow Stages */}
          {lc.phanCong && lc.phanCong.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Quy trình:</span>
              {[...lc.phanCong].sort((a, b) => {
                const STAGE_ORDER = ["cat", "in", "theu", "in_theu", "may_ao", "may_quan", "may", "qc", "khuy_nut", "ui", "dong_goi", "nhap_kho"];
                const aRank = STAGE_ORDER.findIndex(k => a.id.toLowerCase().includes(k));
                const bRank = STAGE_ORDER.findIndex(k => b.id.toLowerCase().includes(k));
                return (aRank >= 0 ? aRank : 999) - (bRank >= 0 ? bRank : 999);
              }).map((pc, i) => {
                const tt = (pc.trangThaiCD as any) || "cho_giao";
                const ttStyles: any = {
                  cho_giao: "bg-slate-100 text-slate-500 border-slate-200",
                  dang_lam: "bg-sky-100 text-sky-700 border-sky-300",
                  cho_qc: "bg-amber-100 text-amber-700 border-amber-300",
                  hoan_thanh: "bg-emerald-100 text-emerald-700 border-emerald-300",
                  co_loi: "bg-rose-100 text-rose-700 border-rose-300"
                };
                const s = ttStyles[tt] || ttStyles.cho_giao;
                return (
                  <React.Fragment key={pc.id}>
                    <div className={`px-2 py-0.5 rounded border text-[11px] font-bold ${s} whitespace-nowrap`}>
                      {pc.tenCongDoan}
                    </div>
                    {i < lc.phanCong!.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />}
                  </React.Fragment>
                );
              })}
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

        {/* Colors Section */}
        <div className="p-6 bg-slate-50 flex-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Danh sách màu ({lc.dsMau?.length || 0})</div>
          <div className="flex flex-wrap gap-4">
            {lc.dsMau?.map((mau, idx) => (
              <div key={idx} className="flex flex-col w-32 sm:w-40 group">
                {/* Red box (Image) */}
                <div className="w-full aspect-square rounded-t-xl overflow-hidden border-2 border-slate-200 group-hover:border-rose-400 transition-colors bg-white relative flex">
                  <div className={`relative h-full ${lc.loaiSP?.includes("Bo") ? "w-1/2 border-r border-slate-200" : "w-full"}`}>
                    {mau.img ? (
                      <img src={mau.img} alt={mau.ten} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-slate-50">
                        <span className="text-[10px] font-bold text-center">NO IMG{lc.loaiSP?.includes("Bo") ? <br /> : ""} {lc.loaiSP?.includes("Bo") ? "ÁO" : ""}</span>
                      </div>
                    )}
                  </div>
                  {lc.loaiSP?.includes("Bo") && (
                    <div className="relative h-full w-1/2">
                      {(mau as any).imgQuan ? (
                        <img src={(mau as any).imgQuan} alt={mau.ten} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-slate-50">
                          <span className="text-[10px] font-bold text-center">NO IMG<br/>QUẦN</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Green box (Button) */}
                <button 
                  onClick={() => onColorClick?.(mau)}
                  className="w-full bg-white border-x-2 border-b-2 border-slate-200 group-hover:border-emerald-500 group-hover:bg-emerald-50 rounded-b-xl px-2 py-2 text-center transition-colors cursor-pointer"
                >
                  <div className="font-black text-slate-800 text-sm truncate">{mau.ten}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Nhập số lượng</div>
                </button>
              </div>
            ))}
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
