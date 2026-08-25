// ============ LENH CAT CARD + STAT CARD ============
// Tach tu page.tsx (2026-08-05 - toi uu B.7)

import React, { ReactNode } from "react";
import { Package, Shirt, Calendar, Calculator, AlertCircle, Edit3, Trash2, CheckCircle2, ArrowRight, ExternalLink, Scissors } from "lucide-react";
import { formatVND } from "@/lib/data/real-data";
import { DateDisplay } from "@/components/ui";
import { TRANG_THAI_LC_LABELS, TRANG_THAI_LC_STYLE, LOAI_SP_LABELS, type LenhCat, type TrangThaiLenhCat } from "@/lib/data/lenh-cat-store";
import { LenhCatColorCards } from "@/components/ui/LenhCatColorCards";
import { GiaCongModal } from "@/components/modals/GiaCongModal";
import { TyLeSizeModal } from "@/components/modals/TyLeSizeModal";
import { useState } from "react";
import Link from "next/link";

// ============ STAT CARD ============
export function StatCard({ icon, label, value, sub, color }: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: "violet" | "amber" | "emerald" | "sky";
}) {
  const colorMap: Record<string, { bg: string, text: string, iconColor: string, iconBg: string, value: string, border: string }> = {
    violet: { bg: "bg-white", text: "text-violet-500", iconColor: "text-white", iconBg: "bg-gradient-to-br from-violet-400 to-violet-600 shadow-violet-200", value: "text-violet-950", border: "border-violet-100" },
    amber: { bg: "bg-white", text: "text-amber-500", iconColor: "text-white", iconBg: "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-200", value: "text-amber-950", border: "border-amber-100" },
    emerald: { bg: "bg-white", text: "text-emerald-500", iconColor: "text-white", iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-200", value: "text-emerald-950", border: "border-emerald-100" },
    sky: { bg: "bg-white", text: "text-sky-500", iconColor: "text-white", iconBg: "bg-gradient-to-br from-sky-400 to-sky-600 shadow-sky-200", value: "text-sky-950", border: "border-sky-100" },
  };
  const config = colorMap[color] || colorMap.sky;
  
  return (
    <div className={`rounded-2xl p-4 shadow-sm border ${config.border} ${config.bg} flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full opacity-50 pointer-events-none" />
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className={`text-[10px] font-bold uppercase tracking-widest ${config.text}`}>
          {label}
        </div>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${config.iconBg} ${config.iconColor} group-hover:scale-110 transition-transform duration-300`}>
          <div className="[&>svg]:w-4 [&>svg]:h-4">
            {icon}
          </div>
        </div>
      </div>
      <div className="relative z-10">
        <div className={`text-2xl xl:text-3xl font-black tabular-nums ${config.value} tracking-tight`}>
          {value}
        </div>
        {sub && (
          <div className="text-[10px] text-slate-400 mt-1 font-medium truncate">
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
  onSaveTyLe?: (mauIdx: number, newTyLe: any) => void;
}) {
  const s = TRANG_THAI_LC_STYLE[lc.trangThai] || { bg: "bg-slate-100", color: "text-slate-600" };
  const isLate = lc.hanHoanThanh < new Date().toISOString().split("T")[0] && lc.trangThai !== "HoanThanh";
  const isBo = lc.loaiSP?.toLowerCase().includes("bo");
  const isAo = lc.loaiSP?.toLowerCase().includes("ao") || isBo;
  // isQuan chỉ đúng khi là hàng Bộ (BoTru, BoCoTron) - Áo đơn KHÔNG có quần
  const isQuan = !!isBo;

  const [modalGiaCong, setModalGiaCong] = useState<"ao" | "quan" | null>(null);
  const [modalTyLeMauIdx, setModalTyLeMauIdx] = useState<number | null>(null);

  // Kiểm tra khâu Cắt đã có số liệu chưa (dựa vào tyLeSizeChiTiet của tất cả màu)
  // Nếu cắt chưa nhập: khoá nút Gia Công và TyLeSize các khâu sau
  const catDaNhap = (lc.dsMau || []).some(mau => {
    const catKey = Object.keys(mau.tyLeSizeChiTiet || {}).find(k => k.toLowerCase().includes("cat"));
    if (!catKey) return false;
    return (mau.tyLeSizeChiTiet![catKey] || []).reduce((s, sz) => s + (sz.sl || 0), 0) > 0;
  });

  // Helper tìm người phụ trách cắt
  const pcCat = lc.phanCong?.find(p => p.tenCongDoan.toLowerCase().includes("cắt"));
  const thoCat = pcCat?.nguoiTen || <span className="italic text-slate-400">Chưa giao</span>;

  return (
    <div className={`bg-white rounded-3xl border shadow-sm hover:shadow-xl hover:-translate-y-0.5 overflow-hidden transition-all duration-300 ${isLate ? "border-rose-200 ring-4 ring-rose-50" : "border-slate-200/60"}`}>
      
      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between ${s.bg} bg-opacity-30 border-b border-current/5 backdrop-blur-sm`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-slate-100">
            <Scissors className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm font-black text-slate-700 font-mono tracking-tight">{lc.id}</span>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm border border-white/50 ${s.bg} ${s.color}`}>
            {TRANG_THAI_LC_LABELS[lc.trangThai]}
          </span>
          {isLate && (
            <div className="flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold border border-rose-200 shadow-sm animate-pulse">
              <AlertCircle className="w-3 h-3" />
              Quá hạn
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isAo && (
            <button
              onClick={() => catDaNhap && setModalGiaCong("ao")}
              disabled={!catDaNhap}
              title={!catDaNhap ? "Khâu Cắt chưa nhập số liệu - hãy nhập tỷ lệ size khâu Cắt trước" : undefined}
              className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                catDaNhap
                  ? "bg-gradient-to-b from-white to-violet-50 border-violet-200 text-violet-700 hover:shadow-md hover:scale-105"
                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {!catDaNhap ? "🔒" : <Shirt className="w-3.5 h-3.5" />} Gia công áo
            </button>
          )}
          {isQuan && (
            <button
              onClick={() => catDaNhap && setModalGiaCong("quan")}
              disabled={!catDaNhap}
              title={!catDaNhap ? "Khâu Cắt chưa nhập số liệu - hãy nhập tỷ lệ size khâu Cắt trước" : undefined}
              className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                catDaNhap
                  ? "bg-gradient-to-b from-white to-emerald-50 border-emerald-200 text-emerald-700 hover:shadow-md hover:scale-105"
                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {!catDaNhap ? "🔒" : <Shirt className="w-3.5 h-3.5" />} Gia công quần
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Row: SP Name & Loại */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-black text-xl text-slate-900 leading-tight mb-1 cursor-pointer hover:text-sky-600 transition-colors" onClick={onEdit}>
              {lc.tenSP}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                {LOAI_SP_LABELS[lc.loaiSP] || "Sản phẩm"}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium border border-slate-200">
                Mã: <span className="font-bold text-slate-800 ml-1">{lc.maSP || "---"}</span>
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Tổng SL</div>
            <div className="text-xl font-black text-slate-900 tabular-nums leading-none mt-0.5">
              {(lc.tongSL || 0).toLocaleString()} <span className="text-xs text-slate-400 font-medium">SP</span>
            </div>
          </div>
        </div>

        {/* Row: Thông tin chi tiết */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-slate-500 text-[11px] font-bold mb-0.5">Thợ cắt</div>
            <div className="font-bold text-slate-800">{thoCat}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px] font-bold mb-0.5 flex items-center gap-1"><Calendar className="w-3 h-3"/> Hạn hoàn thành</div>
            <div className={`font-bold ${isLate ? 'text-rose-600' : 'text-slate-800'}`}>
              <DateDisplay value={lc.hanHoanThanh} format="dd/MM/yyyy" showRelative />
            </div>
          </div>
        </div>

        {/* Workflow Stages (Quy trình sản xuất) */}
        {lc.phanCong && lc.phanCong.length > 0 && (
          <div className="bg-gradient-to-r from-slate-50 to-white rounded-2xl p-4 border border-slate-100/60 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Tiến độ:</span>
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {[...lc.phanCong].sort((a, b) => {
                const STAGE_ORDER = ["cat", "in", "theu", "in_theu", "may_ao", "may_quan", "may", "qc", "khuy_nut", "ui", "dong_goi", "nhap_kho"];
                const aRank = STAGE_ORDER.findIndex(k => a.id.toLowerCase().includes(k));
                const bRank = STAGE_ORDER.findIndex(k => b.id.toLowerCase().includes(k));
                return (aRank >= 0 ? aRank : 999) - (bRank >= 0 ? bRank : 999);
              }).map((pc, i) => {
                const tt = (pc.trangThaiCD as any) || "cho_giao";
                const ttStyles: any = {
                  cho_giao: "bg-white text-slate-500 border-slate-200 shadow-sm",
                  dang_lam: "bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 border-sky-200 shadow-sm",
                  cho_qc: "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200 shadow-sm",
                  hoan_thanh: "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200 shadow-sm",
                  co_loi: "bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border-rose-200 shadow-sm animate-pulse"
                };
                const s = ttStyles[tt] || ttStyles.cho_giao;
                return (
                  <React.Fragment key={pc.id}>
                    <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${s} whitespace-nowrap transition-transform hover:scale-105 cursor-default`}>
                      {pc.tenCongDoan}
                    </div>
                    {i < lc.phanCong!.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Color Cards */}
        <div className="-mx-4 sm:-mx-4">
          <LenhCatColorCards lc={lc} onClickColor={(idx) => setModalTyLeMauIdx(idx)} />
        </div>
      </div>

      {/* Footer Actions (Chỉ hiện khi ở trang chủ Lệnh Cắt, tuỳ biến) */}
      {(onEdit || onDelete || onChangeStatus) && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Xem chi tiết 9 tab công đoạn */}
          <Link
            href={`/lenh-cat/${lc.id}`}
            className="px-3 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700 font-bold flex items-center gap-1.5 transition-all text-xs shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Xem chi tiết
          </Link>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button onClick={onEdit} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-1.5 transition-all text-xs">
                <Edit3 className="w-3.5 h-3.5" /> Sửa
              </button>
            )}
            {onChangeStatus && (
              <select
                value={lc.trangThai}
                onChange={(e) => onChangeStatus(e.target.value as TrangThaiLenhCat)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-700 text-xs focus:ring-2 focus:ring-sky-500/30"
              >
                {(["Nhap", "DaTao", "DangCat", "HoanThanh", "ChuyenTiep"] as TrangThaiLenhCat[]).map((tt) => (
                  <option key={tt} value={tt}>{TRANG_THAI_LC_LABELS[tt]}</option>
                ))}
              </select>
            )}
            {onDelete && (
              <button onClick={onDelete} className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold transition-all flex items-center gap-1.5 text-xs">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

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
          onSave={(mauIdx, newTyLe) => {
            if (onSaveTyLe) onSaveTyLe(mauIdx, newTyLe);
          }}
        />
      )}
    </div>
  );
}
