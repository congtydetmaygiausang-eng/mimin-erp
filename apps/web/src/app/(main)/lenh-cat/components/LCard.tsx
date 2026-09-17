// ============ LENH CAT CARD + STAT CARD ============
// Tach tu page.tsx (2026-08-05 - toi uu B.7)

import React, { ReactNode } from "react";
import { Package, Shirt, Calendar, Calculator, AlertCircle, Edit3, Trash2, CheckCircle2, ArrowRight, UsersRound, Image as ImageIcon } from "lucide-react";
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

  const [showColors, setShowColors] = useState(false);

  return (
    <div className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all duration-300 flex flex-col mb-4 ${isLate ? "border-rose-300 ring-2 ring-rose-200" : "border-slate-200/80 hover:shadow-xl hover:border-slate-300"}`}>
      
      {/* HEADER: ID, Status, Actions */}
      <div className={`px-5 py-3.5 flex items-center justify-between border-b border-current/10 ${s.bg}`}>
        <div className="flex items-center gap-3">
          <span className="text-base font-black text-teal-800 font-mono tracking-wide px-3 py-1 bg-white/60 rounded shadow-sm border border-teal-100">{lc.id}</span>
          <span className={`text-xs px-3 py-1.5 rounded-md font-bold uppercase tracking-wider ${s.bg} ${s.color} border border-current/20 shadow-sm`}>
            {TRANG_THAI_LC_LABELS[lc.trangThai]}
          </span>
          {isLate && <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-md border border-rose-200 shadow-sm"><AlertCircle className="w-4 h-4"/> Trễ hạn</span>}
        </div>
        
        <div className="flex items-center gap-2">
          {onChangeStatus && (
            <select
              value={lc.trangThai}
              onChange={(e) => onChangeStatus(e.target.value as TrangThaiLenhCat)}
              className={`hidden sm:block mr-2 px-3 py-2 rounded-lg border border-slate-200 bg-white/50 font-bold text-slate-700 text-sm focus:ring-2 focus:ring-teal-500/30 cursor-pointer hover:bg-white transition-colors`}
            >
              {(["Nhap", "DaTao", "DangCat", "HoanThanh", "ChuyenTiep"] as TrangThaiLenhCat[]).map((tt) => (
                <option key={tt} value={tt}>{TRANG_THAI_LC_LABELS[tt]}</option>
              ))}
            </select>
          )}
          {onEdit && (
            <button onClick={onEdit} className="p-2.5 rounded-lg bg-white/50 border border-slate-200 hover:bg-white text-slate-700 transition-all shadow-sm group" title={isTransferred ? "Xem chi tiết" : "Xem/Sửa"}>
              <Edit3 className="w-5 h-5 group-hover:text-sky-600" />
            </button>
          )}
          {onDelete && !isTransferred && (
            <button onClick={onDelete} className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100 text-rose-500 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 transition-all shadow-sm ml-1" title="Xóa lệnh cắt">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col p-6">
        
        {/* INFO ROW: Name, Code, Total, Deadline */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-6">
          <div className="flex-1">
            <h3 className="font-black text-3xl text-slate-900 leading-tight mb-3 cursor-pointer hover:text-sky-600 transition-colors" onClick={onEdit}>
              {lc.tenSP}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded text-slate-600 text-xs font-bold bg-slate-100 border border-slate-200">
                {LOAI_SP_LABELS[lc.loaiSP] || "Sản phẩm"}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded text-slate-500 text-xs font-medium bg-slate-100 border border-slate-200">
                Mã: <span className="font-bold text-slate-800 ml-1.5">{lc.maSP || "---"}</span>
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded text-slate-500 text-xs font-medium bg-slate-100 border border-slate-200">
                Thợ cắt: <span className="font-bold text-slate-800 ml-1.5">{thoCat}</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tổng SL</div>
              <div className="text-4xl font-black text-sky-700 leading-none">{(lc.tongSL || 0).toLocaleString()}</div>
            </div>
            <div className="w-px h-12 bg-slate-200 mx-1"></div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-end gap-1">Hạn chót</div>
              <div className={`text-xl font-bold leading-none ${isLate ? 'text-rose-600' : 'text-slate-800'}`}>
                <DateDisplay value={lc.hanHoanThanh} format="dd/MM/yyyy" showRelative={false} />
              </div>
            </div>
          </div>
        </div>

        {/* COLORS & IMAGES (ALWAYS VISIBLE) */}
        <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
             <div className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
               <span>🎨</span> Phân bổ Màu & Size ({lc.dsMau?.length || 0})
             </div>
          </div>
          <div className="-mx-2">
             <LenhCatColorCards lc={lc} onClickColor={(idx) => setModalTyLeMauIdx(idx)} />
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden mb-2">
          {lc.phanCong && lc.phanCong.length > 0 ? (
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
          ) : (
            <div className="text-center text-slate-400 text-sm font-medium italic py-3">
              Chưa thiết lập tiến trình
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mt-auto">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button type="button" onClick={() => setSummaryView("owners")} className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold flex items-center gap-2 transition-all text-xs shadow-sm">
            <UsersRound className="w-4 h-4" /> Phụ trách ({tongNguoiPhuTrach})
          </button>
          <button type="button" onClick={() => setSummaryView("cost")} className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-bold flex items-center gap-2 transition-all text-xs shadow-sm">
            <Calculator className="w-4 h-4" /> Giá vốn
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {isAo && (
            <button onClick={() => catDaNhap && setModalGiaCong("ao")} disabled={!catDaNhap} className={`flex-1 sm:flex-none justify-center px-5 py-2.5 border rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${catDaNhap ? "bg-violet-600 border-violet-600 text-white hover:bg-violet-700" : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"}`}>
              {!catDaNhap && "🔒 "} Gia công áo
            </button>
          )}
          {isQuan && (
            <button onClick={() => catDaNhap && setModalGiaCong("quan")} disabled={!catDaNhap} className={`flex-1 sm:flex-none justify-center px-5 py-2.5 border rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${catDaNhap ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"}`}>
              {!catDaNhap && "🔒 "} Gia công quần
            </button>
          )}
        </div>
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
