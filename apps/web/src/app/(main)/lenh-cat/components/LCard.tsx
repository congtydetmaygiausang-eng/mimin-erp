// ============ LENH CAT CARD + STAT CARD ============
// Tach tu page.tsx (2026-08-05 - toi uu B.7)

import React, { ReactNode } from "react";
import { Package, Shirt, Calendar, Calculator, AlertCircle, Edit3, Trash2, CheckCircle2, ArrowRight } from "lucide-react";
import { formatVND } from "@/lib/data/real-data";
import { DateDisplay } from "@/components/ui";
import { TRANG_THAI_LC_LABELS, TRANG_THAI_LC_STYLE, LOAI_SP_LABELS, type LenhCat, type TrangThaiLenhCat } from "@/lib/data/lenh-cat-store";
import { LenhCatColorCards } from "@/components/ui/LenhCatColorCards";
import { GiaCongModal } from "@/components/modals/GiaCongModal";
import { TyLeSizeModal } from "@/components/modals/TyLeSizeModal";
import { useState } from "react";

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
  // isQuan chỉ đúng khi là hàng Bộ (BoTru, BoCoTron) - Áo đơn KHÔNG có quần
  const isQuan = !!isBo;

  const [modalGiaCong, setModalGiaCong] = useState<"ao" | "quan" | null>(null);
  const [modalTyLeMauIdx, setModalTyLeMauIdx] = useState<number | null>(null);

  // Kiểm tra khâu Cắt đã có số liệu chưa (dựa vào tyLeSizeChiTiet của tất cả màu)
  // Nếu cắt chưa nhập: khoá nút Gia Công và TyLeSize các khâu sau
  const catDaNhap = (lc.dsMau || []).some(mau => {
    const catKey = Object.keys(mau.tyLeSizeChiTiet || {}).find(k => k.toLowerCase().includes("cat") || (lc.phanCong?.find(p => p.id === k)?.tenCongDoan || "").toLowerCase().includes("cắt"));
    if (!catKey) return false;
    return (mau.tyLeSizeChiTiet![catKey] || []).reduce((s, sz) => s + (sz.sl || 0), 0) > 0;
  });

  // Helper tìm người phụ trách cắt
  const pcCat = lc.phanCong?.find(p => p.tenCongDoan.toLowerCase().includes("cắt"));
  const thoCat = pcCat?.nguoiTen || <span className="italic text-slate-400">Chưa giao</span>;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${isLate ? "border-rose-300 ring-2 ring-rose-200" : "border-slate-200 hover:shadow-lg"}`}>
      
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${s.bg} border-b border-current/10`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-teal-700 font-mono">{lc.id}</span>
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
          <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 flex items-center gap-1.5 flex-wrap">
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
                  <div className={`px-2 py-0.5 rounded border text-[10px] font-bold ${s} whitespace-nowrap`}>
                    {pc.tenCongDoan}
                  </div>
                  {i < lc.phanCong!.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Color Cards */}
        <div className="-mx-4 sm:-mx-4">
          <LenhCatColorCards lc={lc} onClickColor={(idx) => setModalTyLeMauIdx(idx)} />
        </div>
      </div>

      {/* Footer Actions (Chỉ hiện khi ở trang chủ Lệnh Cắt, tuỳ biến) */}
      {(onEdit || onDelete || onChangeStatus) && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          {onEdit && (
            <button onClick={onEdit} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-1.5 transition-all text-xs">
              <Edit3 className="w-3.5 h-3.5" /> Xem/Sửa
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
          onSave={(mauIdx, newTyLe, tongDuCat, fixedPhanCong) => {
            if (onSaveTyLe) onSaveTyLe(mauIdx, newTyLe, tongDuCat, fixedPhanCong);
          }}
        />
      )}
    </div>
  );
}
