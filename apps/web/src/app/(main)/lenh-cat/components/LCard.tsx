// ============ LENH CAT CARD + STAT CARD ============
// Tach tu page.tsx (2026-08-05 - toi uu B.7)

import React, { ReactNode } from "react";
import { Package, Shirt, Calendar, Calculator, AlertCircle, Edit3, Trash2, CheckCircle2, ArrowRight } from "lucide-react";
import { formatVND } from "@/lib/data/real-data";
import { DateDisplay } from "@/components/ui";
import { TRANG_THAI_LC_LABELS, TRANG_THAI_LC_STYLE, LOAI_SP_LABELS, type LenhCat, type TrangThaiLenhCat } from "@/lib/data/lenh-cat-store";
import { useNhanSu } from "@/lib/data/nhan-su-store";
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
  const { list: dsNhanSu } = useNhanSu();
  const s = TRANG_THAI_LC_STYLE[lc.trangThai] || { bg: "bg-slate-100", color: "text-slate-600" };
  const isLate = lc.hanHoanThanh < new Date().toISOString().split("T")[0] && lc.trangThai !== "HoanThanh";
  const isBo = lc.loaiSP?.toLowerCase().includes("bo");
  const isAo = lc.loaiSP?.toLowerCase().includes("ao") || isBo;
  // isQuan chỉ đúng khi là hàng Bộ (BoTru, BoCoTron) - Áo đơn KHÔNG có quần
  const isQuan = !!isBo;

  // Người phụ trách sản xuất
  const ptCode = lc.phuTrachSX || "";
  const ptInfo = dsNhanSu.find(nv => nv.maNV === ptCode || nv.hoTen === ptCode);
  const ptDisplayName = ptInfo?.hoTen || ptCode || "Chưa phân công";
  const ptPhone = ptInfo?.sdt;

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
  const pcCat = lc.phanCong?.find(p => p.tenCongDoan?.toLowerCase().includes("cắt"));
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

        {/* Người phụ trách sản xuất */}
        <div className="mt-3 p-3 bg-indigo-50/40 border border-indigo-100/60 rounded-xl">
          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Người phụ trách sản xuất</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800 text-sm">{ptDisplayName}</div>
              {ptPhone ? (
                <div className="text-xs font-medium text-slate-500 mt-0.5">{ptPhone}</div>
              ) : (
                <div className="text-xs italic text-slate-400 mt-0.5">Chưa có SĐT</div>
              )}
            </div>
            {ptPhone && (
              <a
                href={`https://zalo.me/${ptPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 bg-[#0068ff] hover:bg-[#0055d4] text-white rounded-full shadow-sm shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                title="Chat Zalo"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.5 5.43 3.82 7.07l-.92 3.42c-.08.28.16.55.43.46l3.65-1.22A10.74 10.74 0 0 0 12 21c5.52 0 10-4.03 10-9s-4.48-9-10-9zm-1.8 12.19c-.39 0-1.12-.12-1.42-.23-.28-.11-.47-.13-.58.17-.11.31.06.63.26.79.49.38 1.43.6 2.06.6s1.61-.17 2.11-.64c.38-.36.43-.87.11-1.14-.3-.25-1.04-.42-1.38-.52-.35-.11-.44-.26-.17-.55.22-.24.59-.44.75-.85.16-.42.06-.82-.2-.93-.26-.12-.86-.29-1.26-.06-.41.24-.54.67-.32 1.05.21.37.58.59.88.75.29.17.43.34.25.68-.17.32-.61.64-.81.76-.18.11-.53.12-.28.12z" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Tiến trình đơn hàng (dot style, matching MayCard) */}
        {lc.phanCong && lc.phanCong.length > 0 && (() => {
          const STAGE_ORDER = ["cat", "in_theu", "in", "theu", "may_ao", "may_quan", "may", "qc", "khuy_nut", "ui", "dong_goi", "nhap_kho"];
          const sorted = [...lc.phanCong].sort((a, b) => {
            const aRank = STAGE_ORDER.findIndex(k => (a.id || "").toLowerCase().includes(k));
            const bRank = STAGE_ORDER.findIndex(k => (b.id || "").toLowerCase().includes(k));
            return (aRank >= 0 ? aRank : 999) - (bRank >= 0 ? bRank : 999);
          });
          return (
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Tiến trình đơn hàng</div>
              <div className="flex items-center w-full relative">
                <div className="absolute top-[7px] left-0 right-0 h-[2px] bg-slate-100 z-0" />
                <div className="flex items-start justify-between w-full relative z-10">
                  {sorted.map((pc) => {
                    const tt = (pc.trangThaiCD as any) || "cho_giao";
                    const isCompleted = tt === "hoan_thanh";
                    const isWorking = tt === "dang_lam";
                    const isQCWaiting = tt === "cho_qc";
                    const isError = tt === "co_loi";

                    let dotColor = "bg-slate-200 border-slate-300";
                    let textColor = "text-slate-400";
                    if (isCompleted) { dotColor = "bg-emerald-500 border-emerald-600"; textColor = "text-emerald-700 font-bold"; }
                    else if (isWorking) { dotColor = "bg-teal-500 border-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.6)]"; textColor = "text-teal-700 font-black"; }
                    else if (isQCWaiting) { dotColor = "bg-amber-400 border-amber-500"; textColor = "text-amber-600 font-bold"; }
                    else if (isError) { dotColor = "bg-rose-500 border-rose-600"; textColor = "text-rose-600 font-bold"; }

                    return (
                      <div key={pc.id} className="flex flex-col items-center" style={{ width: `${100 / sorted.length}%` }}>
                        <div className="relative flex items-center justify-center">
                          {isWorking && (
                            <div className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-30" style={{ transform: 'scale(2.5)' }} />
                          )}
                          <div className={`w-3.5 h-3.5 rounded-full border-2 z-10 transition-colors duration-300 ${dotColor}`} />
                        </div>
                        <div className={`mt-2 text-[10px] text-center leading-tight ${textColor} ${isWorking ? 'scale-110' : ''}`}>
                          {pc.tenCongDoan}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Color Cards */}
        <div className="-mx-4 sm:-mx-4">
          <LenhCatColorCards lc={lc} onClickColor={(idx) => setModalTyLeMauIdx(idx)} />
        </div>
      </div>

      {/* Footer Actions */}
      {(onEdit || onDelete || onChangeStatus) && (
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {/* Left: Xem/Sửa */}
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm shadow-sm hover:shadow-md active:scale-95 ${
                  lc.trangThai === "HoanThanh"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700"
                }`}
              >
                <Edit3 className="w-4 h-4" />
                {lc.trangThai === "HoanThanh" ? "Xem chi tiết" : "Xem / Sửa"}
              </button>
            )}
          </div>

          {/* Right: Trạng thái + Xoá */}
          <div className="flex items-center gap-2">
            {onChangeStatus && (
              <select
                value={lc.trangThai}
                onChange={(e) => onChangeStatus(e.target.value as TrangThaiLenhCat)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 text-sm focus:ring-2 focus:ring-sky-500/30 cursor-pointer hover:border-sky-400 transition-colors shadow-sm"
              >
                {(["Nhap", "DaTao", "DangCat", "HoanThanh", "ChuyenTiep"] as TrangThaiLenhCat[]).map((tt) => (
                  <option key={tt} value={tt}>{TRANG_THAI_LC_LABELS[tt]}</option>
                ))}
              </select>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold transition-all flex items-center gap-2 text-sm shadow-sm hover:shadow-md active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
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
          onSave={(mauIdx, newTyLe, tongDuCat, fixedPhanCong) => {
            if (onSaveTyLe) onSaveTyLe(mauIdx, newTyLe, tongDuCat, fixedPhanCong);
          }}
        />
      )}
    </div>
  );
}
