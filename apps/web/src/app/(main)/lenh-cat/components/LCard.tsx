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
    <div className={`card p-4 hover:shadow-lg transition-shadow ${isLate ? "ring-1 ring-rose-500/40" : ""}`}>
      {/* Header */}
      <div className="flex gap-4 mb-4">
        <div className="w-28 h-28 shrink-0 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm">
          {lc.dsMau?.[0]?.img ? (
            <img src={lc.dsMau[0].img} alt="SP" className="w-full h-full object-cover" />
          ) : (
            <Shirt className="w-10 h-10 text-slate-300" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-base font-black text-teal-700 font-mono tracking-tight">{lc.id}</span>
              <div className="flex items-center gap-1">
                {isLate && <AlertCircle className="w-4 h-4 text-rose-600" />}
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.bg} ${s.color} font-bold shadow-sm`}>
                  {TRANG_THAI_LC_LABELS[lc.trangThai]}
                </span>
              </div>
            </div>
            <h3 className="font-black text-xl text-slate-800 leading-tight truncate">{lc.tenSP}</h3>
            <p className="text-sm text-slate-500 mt-1.5 font-semibold">
              {LOAI_SP_LABELS[lc.loaiSP]} · Mã: <span className="font-black text-slate-700">{lc.maSP}</span>
            </p>
          </div>
          
          {lc.daCoSoDo && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 text-white rounded-md shadow-sm w-fit">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Đã có sơ đồ</span>
            </div>
          )}
        </div>
      </div>

      {/* Body - Stats */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-60 flex items-center gap-1">
            <Package className="w-3 h-3" /> Tổng SL
          </span>
          <span className="font-bold tabular-nums">{(lc.tongSL || 0).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-60 flex items-center gap-1">
            <Shirt className="w-3 h-3" /> Tỉ lệ size
          </span>
          <span className="font-mono text-[10px]">
            {lc.tiLeSize || "--"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-60 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Hạn
          </span>
          <DateDisplay value={lc.hanHoanThanh} format="dd/MM" showRelative />
        </div>
        {cogs && (
          <>
            <div className="border-t pt-1.5 mt-1.5" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between text-xs">
                <span className="opacity-60 flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> Giá vốn / SP
                </span>
                <span className="font-bold text-violet-600 tabular-nums">
                  {formatVND(cogs.giaVon1SP ?? cogs.giaVonBinhQuan)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-0.5">
                <span className="opacity-60">Tổng lô:</span>
                <span className="font-mono text-emerald-600 tabular-nums text-[11px]">
                  {formatVND(cogs.tongGiaVon ?? cogs.giaVonBinhQuan)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-1 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={onEdit}
          className="flex-1 text-[10px] px-2 py-1.5 rounded bg-sky-500/15 text-sky-700 hover:bg-sky-500/25 font-medium flex items-center justify-center gap-1"
        >
          <Edit3 className="w-3 h-3" /> Sửa
        </button>
        <select
          value={lc.trangThai}
          onChange={(e) => onChangeStatus(e.target.value as TrangThaiLenhCat)}
          className="text-[10px] px-1 py-1 rounded border" style={{ borderColor: "var(--border)" }}
        >
          {(["Nhap", "DaTao", "DangCat", "HoanThanh", "ChuyenTiep"] as TrangThaiLenhCat[]).map((tt) => (
            <option key={tt} value={tt}>{TRANG_THAI_LC_LABELS[tt]}</option>
          ))}
        </select>
        <button
          onClick={onDelete}
          className="text-[10px] px-2 py-1.5 rounded bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 font-medium"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
