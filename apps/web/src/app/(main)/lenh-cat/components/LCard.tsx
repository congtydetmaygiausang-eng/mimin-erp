// ============ LENH CAT CARD + STAT CARD ============
// Tach tu page.tsx (2026-08-05 - toi uu B.7)

import React, { ReactNode } from "react";
import { Package, Shirt, Calendar, Calculator, AlertCircle, Edit3, Trash2, CheckCircle2, ArrowRight, UsersRound } from "lucide-react";
import { formatVND } from "@/lib/data/real-data";
import { DateDisplay } from "@/components/ui";
import { TRANG_THAI_LC_LABELS, TRANG_THAI_LC_STYLE, LOAI_SP_LABELS, type LenhCat, type TrangThaiLenhCat } from "@/lib/data/lenh-cat-store";
import { LenhCatColorCards } from "@/components/ui/LenhCatColorCards";
import { GiaCongModal } from "@/components/modals/GiaCongModal";
import { TyLeSizeModal } from "@/components/modals/TyLeSizeModal";
import { useState } from "react";
import { LenhCatSummaryModal, type LenhCatSummaryView } from "./LenhCatSummaryModal";

// ============ STAT CARD ============
export function StatCard({ icon, label, value, sub, color }: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: "violet" | "amber" | "emerald" | "sky";
}) {
  const colorMap: Record<string, { bg: string, text: string, icon: string, iconBg: string, value: string }> = {
    violet: { bg: "bg-white", text: "text-slate-500", icon: "text-violet-600", iconBg: "bg-violet-100", value: "text-slate-800" },
    amber: { bg: "bg-white", text: "text-slate-500", icon: "text-amber-600", iconBg: "bg-amber-100", value: "text-slate-800" },
    emerald: { bg: "bg-white", text: "text-slate-500", icon: "text-emerald-600", iconBg: "bg-emerald-100", value: "text-emerald-700" },
    sky: { bg: "bg-white", text: "text-slate-500", icon: "text-sky-600", iconBg: "bg-sky-100", value: "text-sky-700" },
  };
  const config = colorMap[color] || colorMap.sky;
  
  return (
    <div className={`rounded-xl p-3 py-2.5 shadow-sm border border-slate-200/60 ${config.bg} flex items-center gap-2.5 transition-all hover:shadow-md hover:border-slate-300`}>
      <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${config.iconBg} ${config.icon}`}>
        {/* We assume the icon passed has w-4 h-4, but we can style the container to make it pop */}
        <div className="[&>svg]:w-4 [&>svg]:h-4">
          {icon}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-[9px] font-bold uppercase tracking-wider ${config.text} mb-0.5 truncate`}>
          {label}
        </div>
        <div className={`text-lg xl:text-xl font-black tabular-nums ${config.value} leading-none`}>
          {value}
        </div>
        {sub && (
          <div className="text-[9px] text-slate-400 mt-0.5 font-medium truncate">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export function LenhCatCard({ lc, onEdit, onDelete, onChangeStatus, onSaveGiaCong, onSaveTyLe }: {
  lc: LenhCat;
  onEdit?: () => void;
  onDelete?: () => void;
  onChangeStatus?: (tt: TrangThaiLenhCat) => void;
  // newDsMau: GiaCongModal có gửi kèm dsMau đã sửa (chi tiết size theo màu).
  // Trước đây prop này chỉ khai 2 tham số và callback bên dưới cũng chỉ truyền 2,
  // nên dsMau bị rơi mất -> tongSLThucTeAo/Quan không bao giờ được cập nhật.
  onSaveGiaCong?: (slThucTe: number, dsPhanCong: any, newDsMau?: any[]) => void;
  onSaveTyLe?: (mauIdx: number, newTyLe: any, tongDuCat?: number, fixedPhanCong?: any) => void;
}) {
  const s = TRANG_THAI_LC_STYLE[lc.trangThai] || { bg: "bg-slate-100", color: "text-slate-600" };
  const isLate = lc.hanHoanThanh < new Date().toISOString().split("T")[0] && lc.trangThai !== "HoanThanh";
  const isBo = lc.loaiSP?.toLowerCase().includes("bo");
  const isAo = lc.loaiSP?.toLowerCase().includes("ao") || isBo;
  const isTransferred = lc.trangThai === "ChuyenTiep";
  // isQuan chỉ đúng khi là hàng Bộ (BoTru, BoCoTron) - Áo đơn KHÔNG có quần
  const isQuan = !!isBo;

  const [modalGiaCong, setModalGiaCong] = useState<"ao" | "quan" | null>(null);
  const [modalTyLeMauIdx, setModalTyLeMauIdx] = useState<number | null>(null);
  const [summaryView, setSummaryView] = useState<LenhCatSummaryView | null>(null);

  // Kiểm tra khâu Cắt đã có số liệu chưa (dựa vào tyLeSizeChiTiet của tất cả màu)
  // Nếu cắt chưa nhập: khoá nút Gia Công và TyLeSize các khâu sau
  const catDaNhap = (lc.dsMau || []).some(mau => {
    const catKey = Object.keys(mau.tyLeSizeChiTiet || {}).find(k => k.toLowerCase().includes("cat") || (lc.phanCong?.find(p => p.id === k)?.tenCongDoan || "").toLowerCase().includes("cắt"));
    if (!catKey) return false;
    return (mau.tyLeSizeChiTiet![catKey] || []).reduce((s, sz) => s + (sz.sl || 0), 0) > 0;
  });

  // Helper tìm người phụ trách cắt
  const pcCat = lc.phanCong?.find(p => p.tenCongDoan?.toLowerCase().includes("cắt"));
  const thoCat = pcCat?.nguoiTen || <span className="italic text-slate-400">Chưa giao</span>;
  const tongNguoiPhuTrach = new Set((lc.phanCong || []).filter((pc) => pc.nguoiMa || pc.nguoiTen).map((pc) => pc.nguoiMa || pc.nguoiTen)).size;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col md:flex-row transition-all duration-200 ${isLate ? "border-rose-300 ring-2 ring-rose-200" : "border-slate-200 hover:shadow-lg"}`}>
      
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

      {/* RIGHT COLUMN */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Section */}
        <div className="px-6 py-6 border-b border-slate-100 flex flex-col gap-5 bg-white relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-black text-teal-700 font-mono text-sm bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100/80 shadow-sm tracking-wide">{lc.id}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.bg} ${s.color} border border-current/20`}>
                {TRANG_THAI_LC_LABELS[lc.trangThai]}
              </span>
              {isLate && <AlertCircle className="w-4 h-4 text-rose-500" />}
            </div>
            
            <div className="flex items-center gap-2">
              {isAo && (
                <button
                  onClick={() => catDaNhap && setModalGiaCong("ao")}
                  disabled={!catDaNhap}
                  title={!catDaNhap ? "Khâu Cắt chưa nhập số liệu - hãy nhập tỷ lệ size khâu Cắt trước" : undefined}
                  className={`px-3 py-1 border rounded-lg text-xs font-bold transition-colors shadow-sm ${
                    catDaNhap
                      ? "bg-white border-violet-200 text-violet-700 hover:bg-violet-50"
                      : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {!catDaNhap && "🔒 "}Gia công áo
                </button>
              )}
              {isQuan && (
                <button
                  onClick={() => catDaNhap && setModalGiaCong("quan")}
                  disabled={!catDaNhap}
                  title={!catDaNhap ? "Khâu Cắt chưa nhập số liệu - hãy nhập tỷ lệ size khâu Cắt trước" : undefined}
                  className={`px-3 py-1 border rounded-lg text-xs font-bold transition-colors shadow-sm ${
                    catDaNhap
                      ? "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {!catDaNhap && "🔒 "}Gia công quần
                </button>
              )}
            </div>
          </div>

          {/* Title and Stats Row */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div className="flex-1 min-w-0 w-full">
              <h2 className="text-[26px] md:text-[30px] font-black text-slate-900 leading-[1.1] mb-3 group-hover:text-sky-600 transition-colors drop-shadow-sm cursor-pointer" onClick={onEdit}>
                {lc.tenSP}
              </h2>
              <div className="flex items-center flex-wrap gap-3 text-xs font-bold">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <span className="uppercase text-[9px] text-slate-400 tracking-widest">Mã SP:</span>
                  <span className="text-slate-800">{lc.maSP || "---"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <span className="uppercase text-[9px] text-slate-400 tracking-widest">Loại:</span>
                  <span className="text-slate-800">{LOAI_SP_LABELS[lc.loaiSP] || lc.loaiSP || "---"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <span className="uppercase text-[9px] text-slate-400 tracking-widest">Thợ cắt:</span>
                  <span className="text-slate-800">{thoCat}</span>
                </div>
              </div>
            </div>

            {/* Stats Blocks */}
            <div className="flex items-center gap-2.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
              <div className="flex-1 lg:flex-none flex flex-col items-center justify-center bg-sky-50/70 border border-sky-100 rounded-xl py-3 px-5 min-w-[110px] shadow-sm hover:shadow hover:bg-sky-50 transition-all">
                <span className="text-sky-600/80 flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest mb-1.5">Tổng SL</span>
                <span className="font-black text-3xl text-sky-900 leading-none">{lc.tongSL?.toLocaleString() || "0"}</span>
              </div>
              <div className="flex-1 lg:flex-none flex flex-col items-center justify-center bg-slate-50/70 border border-slate-200/60 rounded-xl py-3 px-5 min-w-[90px] shadow-sm hover:shadow hover:bg-slate-50 transition-all">
                <span className="text-slate-500 flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest mb-1.5">Tỷ lệ</span>
                <span className="font-black text-xl text-slate-800 leading-none">{lc.tiLeSize || "-"}</span>
              </div>
              <div className="flex-1 lg:flex-none flex flex-col items-center justify-center bg-rose-50/70 border border-rose-100 rounded-xl py-3 px-5 min-w-[110px] shadow-sm hover:shadow hover:bg-rose-50 transition-all">
                <span className="text-rose-500 flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest mb-1.5"><Calendar className="w-3.5 h-3.5" /> Hạn giao</span>
                <span className="font-black text-xl text-rose-700 leading-none"><DateDisplay value={lc.hanHoanThanh} format="dd/MM" /></span>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Stages */}
        <div className="px-6 py-5 bg-white border-b border-slate-100 flex flex-col gap-4">
          {lc.phanCong && lc.phanCong.length > 0 && (
            <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-1.5 h-4 bg-teal-500 rounded-full"></span>
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Tiến trình đơn hàng</span>
              </div>
              <div className="flex items-start min-w-max relative px-4">
                <div className="flex items-center justify-between w-full relative z-10 gap-2">
                  {[...lc.phanCong].sort((a, b) => {
                    const STAGE_ORDER = ["cat", "in", "theu", "in_theu", "may_ao", "may_quan", "may", "qc", "khuy_nut", "ui", "dong_goi", "nhap_kho"];
                    const aRank = STAGE_ORDER.findIndex(k => (a.id || "").toLowerCase().includes(k));
                    const bRank = STAGE_ORDER.findIndex(k => (b.id || "").toLowerCase().includes(k));
                    return (aRank >= 0 ? aRank : 999) - (bRank >= 0 ? bRank : 999);
                  }).map((pc, i, arr) => {
                    const tt = (pc.trangThaiCD as any) || "cho_giao";
                    const isCompleted = tt === "hoan_thanh";
                    const isWorking = tt === "dang_lam";
                    const isQCWaiting = tt === "cho_qc";
                    const isError = tt === "co_loi";
                    
                    let dotColor = "bg-slate-200 border-white";
                    let textColor = "text-slate-400";
                    let lineColor = "bg-slate-100";
                    
                    if (isCompleted) { dotColor = "bg-emerald-500 border-emerald-100 text-white"; textColor = "text-emerald-700 font-bold"; lineColor = "bg-emerald-500"; }
                    else if (isWorking) { dotColor = "bg-teal-500 border-teal-100 text-white shadow-[0_0_12px_rgba(20,184,166,0.4)]"; textColor = "text-teal-700 font-black"; lineColor = "bg-slate-200 bg-gradient-to-r from-teal-500 to-slate-200"; }
                    else if (isQCWaiting) { dotColor = "bg-amber-400 border-amber-100 text-white"; textColor = "text-amber-600 font-bold"; }
                    else if (isError) { dotColor = "bg-rose-500 border-rose-100 text-white"; textColor = "text-rose-600 font-bold"; }

                    return (
                      <div key={pc.id} className="flex-1 flex flex-col items-center relative group min-w-[70px]">
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
                        
                        <div className={`whitespace-nowrap text-[10px] transition-all duration-300 ${textColor} ${isWorking ? 'scale-110 -translate-y-0.5' : ''} flex flex-col items-center gap-1`}>
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

        {/* Colors Section */}
        <div className="p-6 bg-slate-50 flex-1">
          <LenhCatColorCards lc={lc} onClickColor={(idx) => setModalTyLeMauIdx(idx)} />
        </div>

        {/* Footer Actions */}
        {(onEdit || onDelete || onChangeStatus) && (
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={() => setSummaryView("cost")} className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-bold flex items-center gap-1.5 transition-all text-xs">
              <Calculator className="w-3.5 h-3.5" /> Tổng giá vốn
            </button>
            <button type="button" onClick={() => setSummaryView("owners")} className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 font-bold flex items-center gap-1.5 transition-all text-xs">
              <UsersRound className="w-3.5 h-3.5" /> Người phụ trách ({tongNguoiPhuTrach})
            </button>
            {onEdit && (
              <button onClick={onEdit} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-1.5 transition-all text-xs">
                <Edit3 className="w-3.5 h-3.5" /> {isTransferred ? "Xem" : "Xem/Sửa"}
              </button>
            )}
            {onChangeStatus && (
              <select
                value={lc.trangThai}
                onChange={(e) => onChangeStatus(e.target.value as TrangThaiLenhCat)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-700 text-xs focus:ring-2 focus:ring-sky-500/30 outline-none"
              >
                {(["Nhap", "DaTao", "DangCat", "HoanThanh", "ChuyenTiep"] as TrangThaiLenhCat[]).map((tt) => (
                  <option key={tt} value={tt}>{TRANG_THAI_LC_LABELS[tt]}</option>
                ))}
              </select>
            )}
            {onDelete && !isTransferred && (
              <button onClick={onDelete} className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold transition-all flex items-center gap-1.5 text-xs">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

      </div>

      {/* Modals */}
      {modalGiaCong && (
        <GiaCongModal
          lc={lc}
          type={modalGiaCong}
          onClose={() => setModalGiaCong(null)}
          onSave={(slThucTe, dsPhanCong, newDsMau) => {
            if (onSaveGiaCong) onSaveGiaCong(slThucTe, dsPhanCong, newDsMau);
          }}
        />
      )}

      {modalTyLeMauIdx !== null && (
        <TyLeSizeModal
          lc={lc}
          mauIdx={modalTyLeMauIdx}
          onClose={() => setModalTyLeMauIdx(null)}
          onSave={(mauIdx, newTyLe, tongDuCat, fixedPhanCong) => {
            if (onSaveTyLe) onSaveTyLe(mauIdx, newTyLe, tongDuCat, fixedPhanCong);
          }}
        />
      )}

      {summaryView && <LenhCatSummaryModal lc={lc} view={summaryView} onClose={() => setSummaryView(null)} />}
    </div>
  );
}
