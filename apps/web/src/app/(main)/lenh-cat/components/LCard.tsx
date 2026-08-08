// ============ LENH CAT CARD + STAT CARD ============
// Tach tu page.tsx (2026-08-05 - toi uu B.7)

import { ReactNode } from "react";
import { Package, Shirt, Calendar, Calculator, AlertCircle, Edit3, Trash2, CheckCircle2 } from "lucide-react";
import { formatVND } from "@/lib/data/real-data";
import { DateDisplay } from "@/components/ui";
import { TRANG_THAI_LC_LABELS, TRANG_THAI_LC_STYLE, LOAI_SP_LABELS, type LenhCat, type TrangThaiLenhCat } from "@/lib/data/lenh-cat-store";

// ============ STAT CARD ============
export function StatCard({ icon, label, value, sub, color }: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: "violet" | "amber" | "emerald" | "sky";
}) {
  const colorMap: Record<string, { bg: string, text: string, icon: string, value: string }> = {
    violet: { bg: "bg-white", text: "text-slate-500", icon: "text-violet-500", value: "text-slate-800" },
    amber: { bg: "bg-white", text: "text-slate-500", icon: "text-amber-500", value: "text-slate-800" },
    emerald: { bg: "bg-white", text: "text-slate-500", icon: "text-emerald-500", value: "text-emerald-600" },
    sky: { bg: "bg-white", text: "text-slate-500", icon: "text-sky-500", value: "text-sky-600" },
  };
  const config = colorMap[color] || colorMap.sky;
  return (
    <div className={`rounded-xl p-4 shadow-sm ${config.bg}`}>
      <div className={`flex items-center gap-1.5 text-xs font-semibold ${config.text} mb-1.5`}>
        <span className={config.icon}>{icon}</span><span>{label}</span>
      </div>
      <div className={`text-2xl md:text-3xl font-bold tabular-nums ${config.value}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-1 font-medium">{sub}</div>}
    </div>
  );
}

// ============ LENH CAT CARD ============
export function LenhCatCard({ lc, onEdit, onDelete, onChangeStatus }: {
  lc: LenhCat;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (tt: TrangThaiLenhCat) => void;
}) {
  const s = TRANG_THAI_LC_STYLE[lc.trangThai];
  const cogs = lc.bangCOGS;
  const isLate = lc.hanHoanThanh < new Date().toISOString().split("T")[0] && lc.trangThai !== "HoanThanh";

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 ${isLate ? "ring-2 ring-rose-500/40" : ""}`}>
      {/* Header */}
      <div className="flex gap-4 mb-5">
        <div 
          className="w-32 h-32 shrink-0 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onEdit}
        >
          {lc.dsMau?.[0]?.img ? (
            <img src={lc.dsMau[0].img} alt="SP" className="w-full h-full object-cover" />
          ) : (
            <Shirt className="w-10 h-10 text-slate-300" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-lg font-black text-teal-700 font-mono tracking-tight">{lc.id}</span>
              <div className="flex items-center gap-1.5">
                {isLate && <AlertCircle className="w-4 h-4 text-rose-600" />}
                <span className={`text-[11px] px-3 py-1 rounded-full ${s.bg} ${s.color} font-bold`}>
                  {TRANG_THAI_LC_LABELS[lc.trangThai]}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <h3 
                className="font-black text-2xl text-slate-900 leading-tight truncate cursor-pointer hover:text-sky-600 transition-colors"
                onClick={onEdit}
              >
                {lc.tenSP}
              </h3>
              {lc.daCoSoDo && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-black shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  ĐÃ CÓ SƠ ĐỒ
                </div>
              )}
            </div>
            <p className="text-[13px] text-slate-600 mt-2 font-bold">
              {LOAI_SP_LABELS[lc.loaiSP]} · Mã: <span className="font-black text-slate-800">{lc.maSP}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Body - Stats */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-500 flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" /> Tổng SL
          </span>
          <span className="font-black text-slate-900 tabular-nums text-base">{(lc.tongSL || 0).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-500 flex items-center gap-2">
            <Shirt className="w-4 h-4 text-slate-400" /> Tỉ lệ size
          </span>
          <span className="font-black text-slate-800 tabular-nums text-sm">
            {lc.tiLeSize || "--"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-500 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" /> Hạn
          </span>
          <div className="text-right">
            <DateDisplay value={lc.hanHoanThanh} format="dd/MM" showRelative />
          </div>
        </div>
        
        {cogs && (
          <div className="border-t border-slate-100 pt-3 mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-bold text-slate-500 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-slate-400" /> Giá vốn / SP
              </span>
              <span className="font-black text-violet-600 tabular-nums text-sm">
                {formatVND(cogs.giaVon1SP ?? cogs.giaVonBinhQuan)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-500 pl-6">Tổng lô:</span>
              <span className="font-black text-emerald-600 tabular-nums text-sm">
                {formatVND(cogs.tongGiaVon ?? cogs.giaVonBinhQuan)}
              </span>
            </div>
          </div>
        )}
      </div>

      {lc.phanCong && lc.phanCong.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 pt-3 border-t border-slate-100">
          {lc.phanCong
            .filter(pc => {
              const name = pc.tenCongDoan.toLowerCase();
              return name.includes('may') || name.includes('thêu') || name.includes('in');
            })
            .map((pc, idx) => (
            <div key={idx} className="inline-flex items-center gap-1.5 text-[11px] bg-white text-slate-500 px-2.5 py-1.5 rounded border border-slate-200">
              <span className="font-black text-slate-800">{pc.tenCongDoan}:</span>
              <span className="truncate max-w-[120px] font-medium">{pc.nguoiTen}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-slate-100">
        <button
          onClick={onEdit}
          className="flex-1 text-sm px-3 py-2 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Edit3 className="w-4 h-4" /> Xem & Sửa
        </button>
        <select
          value={lc.trangThai}
          onChange={(e) => onChangeStatus(e.target.value as TrangThaiLenhCat)}
          className="text-xs px-2 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        >
          {(["Nhap", "DaTao", "DangCat", "HoanThanh", "ChuyenTiep"] as TrangThaiLenhCat[]).map((tt) => (
            <option key={tt} value={tt}>{TRANG_THAI_LC_LABELS[tt]}</option>
          ))}
        </select>
        <button
          onClick={onDelete}
          className="text-rose-500 hover:bg-rose-50 px-3 py-2 rounded-lg border border-transparent hover:border-rose-200 transition-colors bg-rose-50/50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
