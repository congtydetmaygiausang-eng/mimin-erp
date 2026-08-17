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
    <div className={`bg-white rounded-3xl p-8 shadow-md border-2 border-slate-200 hover:shadow-xl transition-all duration-200 ${isLate ? "ring-2 ring-rose-500/40" : ""}`}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Image */}
        <div 
          className="w-full lg:w-[480px] xl:w-[560px] shrink-0 bg-slate-50 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center border border-slate-100"
          onClick={onEdit}
        >
          {lc.dsMau?.[0]?.img ? (
            <img src={lc.dsMau[0].img} alt="SP" className="w-full h-full object-cover min-h-[480px] lg:min-h-full aspect-[4/5] lg:aspect-auto" />
          ) : (
            <Shirt className="w-20 h-20 text-slate-300" />
          )}
        </div>
        
        {/* Right Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header row */}
          <div className="flex items-start justify-between mb-2">
            <span className="text-2xl font-black text-teal-700 font-mono tracking-tight">{lc.id}</span>
            <div className="flex items-center gap-2">
              {isLate && <AlertCircle className="w-5 h-5 text-rose-600" />}
              <span className={`text-xs px-3 py-1 rounded-full ${s.bg} ${s.color} font-bold tracking-wide`}>
                {TRANG_THAI_LC_LABELS[lc.trangThai]}
              </span>
            </div>
          </div>
          
          <h3 
            className="font-black text-3xl lg:text-4xl text-slate-900 leading-tight mb-2.5 cursor-pointer hover:text-sky-600 transition-colors"
            onClick={onEdit}
          >
            {lc.tenSP}
          </h3>
          
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-600 text-xs font-bold border border-slate-200">
              {LOAI_SP_LABELS[lc.loaiSP] || "Sản phẩm"}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-500 text-xs font-medium border border-slate-200">
              Mã: <span className="font-bold text-slate-800 ml-1">{lc.maSP || "---"}</span>
            </span>
            {lc.daCoSoDo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[10px] font-black tracking-wide shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" /> ĐÃ SƠ ĐỒ
              </span>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between border-y-2 border-slate-100 py-4 mb-4">
            <div className="flex flex-col items-center justify-center flex-1 gap-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium"><Package className="w-4 h-4 text-slate-400"/> Tổng SL</div>
              <div className="text-lg font-black text-slate-900 tabular-nums">{(lc.tongSL || 0).toLocaleString()}</div>
            </div>
            <div className="w-px h-10 bg-slate-200 shrink-0"></div>
            <div className="flex flex-col items-center justify-center flex-1 gap-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium"><Shirt className="w-4 h-4 text-slate-400"/> Tỉ lệ size</div>
              <div className="text-lg font-black text-slate-900 tabular-nums">{lc.tiLeSize || "--"}</div>
            </div>
            <div className="w-px h-10 bg-slate-200 shrink-0"></div>
            <div className="flex flex-col items-center justify-center flex-1 gap-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium"><Calendar className="w-4 h-4 text-slate-400"/> Hạn</div>
              <div className="text-[15px] font-black text-slate-900 tabular-nums leading-none mt-1">
                <DateDisplay value={lc.hanHoanThanh} format="dd/MM" />
              </div>
              <div className="text-[10px] text-sky-500 font-medium leading-none mt-1">
                <DateDisplay value={lc.hanHoanThanh} showRelative />
              </div>
            </div>
          </div>

          {/* COGS Section - Ẩn theo yêu cầu của user */}
          {/* 
            {cogs && ( ... )} 
          */}

          {/* Outsourcing list */}
          {lc.phanCong && lc.phanCong.length > 0 && (
            <div className="flex flex-col gap-2 mt-auto">
              {lc.phanCong
                .filter(pc => {
                  const name = pc.tenCongDoan.toLowerCase();
                  return name.includes('may') || name.includes('thêu') || name.includes('in');
                })
                .map((pc, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm bg-white px-3.5 py-2 rounded-md border-2 border-slate-200">
                  <span className="font-bold text-slate-600">{pc.tenCongDoan}</span>
                  {pc.nguoiTen ? (
                    <span className="font-bold text-slate-800 line-clamp-1">{pc.nguoiTen}</span>
                  ) : (
                    <span className="italic text-slate-400">Chưa giao</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-6 mt-6 border-t-2 border-slate-100">

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-md text-[10px]"
          >
            <Edit3 className="w-3.5 h-3.5" /> Xem/Sửa
          </button>

          <select
            value={lc.trangThai}
            onChange={(e) => onChangeStatus(e.target.value as TrangThaiLenhCat)}
            className="px-3 py-1.5 rounded-lg border-2 border-slate-300 bg-white font-semibold text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-transparent transition-all text-[10px]"
          >
            {(["Nhap", "DaTao", "DangCat", "HoanThanh", "ChuyenTiep"] as TrangThaiLenhCat[]).map((tt) => (
              <option key={tt} value={tt}>{TRANG_THAI_LC_LABELS[tt]}</option>
            ))}
          </select>

          <button
            onClick={onDelete}
            className="px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-all shadow-sm hover:shadow-md"
            title="Xoá lệnh cắt"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
