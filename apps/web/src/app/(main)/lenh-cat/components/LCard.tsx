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
    <div className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 ${isLate ? "ring-2 ring-rose-500/40" : ""}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Left Image */}
        <div 
          className="w-full sm:w-[180px] xl:w-[200px] shrink-0 bg-slate-50 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center border border-slate-100"
          onClick={onEdit}
        >
          {lc.dsMau?.[0]?.img ? (
            <img src={lc.dsMau[0].img} alt="SP" className="w-full h-full object-cover min-h-[200px] sm:min-h-full aspect-[4/5] sm:aspect-auto" />
          ) : (
            <Shirt className="w-12 h-12 text-slate-300 my-16" />
          )}
        </div>
        
        {/* Right Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header row */}
          <div className="flex items-start justify-between mb-1">
            <span className="text-base font-black text-teal-700 font-mono tracking-tight">{lc.id}</span>
            <div className="flex items-center gap-1.5">
              {isLate && <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full ${s.bg} ${s.color} font-bold tracking-wide`}>
                {TRANG_THAI_LC_LABELS[lc.trangThai]}
              </span>
            </div>
          </div>
          
          <h3 
            className="font-black text-xl lg:text-2xl text-slate-900 leading-tight mb-1.5 cursor-pointer hover:text-sky-600 transition-colors"
            onClick={onEdit}
          >
            {lc.tenSP}
          </h3>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-3">
            <span>{LOAI_SP_LABELS[lc.loaiSP]}</span>
            <span>·</span>
            <span>Mã: <span className="font-bold text-slate-800">{lc.maSP}</span></span>
            {lc.daCoSoDo && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 ml-1 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[9px] font-black tracking-wide">
                <CheckCircle2 className="w-2.5 h-2.5" /> ĐÃ SƠ ĐỒ
              </span>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between border-y border-slate-100 py-2.5 mb-3">
            <div className="flex flex-col items-center justify-center flex-1 gap-0.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium"><Package className="w-3.5 h-3.5 text-slate-400"/> Tổng SL</div>
              <div className="text-sm font-black text-slate-900 tabular-nums">{(lc.tongSL || 0).toLocaleString()}</div>
            </div>
            <div className="w-px h-8 bg-slate-200 shrink-0"></div>
            <div className="flex flex-col items-center justify-center flex-1 gap-0.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium"><Shirt className="w-3.5 h-3.5 text-slate-400"/> Tỉ lệ size</div>
              <div className="text-sm font-black text-slate-900 tabular-nums">{lc.tiLeSize || "--"}</div>
            </div>
            <div className="w-px h-8 bg-slate-200 shrink-0"></div>
            <div className="flex flex-col items-center justify-center flex-1 gap-0.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium"><Calendar className="w-3.5 h-3.5 text-slate-400"/> Hạn</div>
              <div className="text-[13px] font-black text-slate-900 tabular-nums leading-none mt-0.5">
                <DateDisplay value={lc.hanHoanThanh} format="dd/MM" />
              </div>
              <div className="text-[9px] text-sky-500 font-medium leading-none mt-0.5">
                <DateDisplay value={lc.hanHoanThanh} showRelative />
              </div>
            </div>
          </div>

          {/* COGS Section */}
          {cogs && (
            <div className="space-y-1 mb-3">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Calculator className="w-3 h-3 text-slate-400" /> Bảng giá vốn
              </div>

              {cogs.tongTienVai != null && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" /> Vải
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">{formatVND(cogs.tongTienVai / Math.max(1, lc.tongSL || 1))}/SP</span>
                </div>
              )}
              {cogs.tongTienPhuLieu != null && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" /> Phụ liệu
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">{formatVND(cogs.tongTienPhuLieu / Math.max(1, lc.tongSL || 1))}/SP</span>
                </div>
              )}
              {cogs.giaCong1SP != null && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Gia công
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">{formatVND(cogs.giaCong1SP)}/SP</span>
                </div>
              )}
              {cogs.tongChiPhiCoDinh != null && cogs.tongChiPhiCoDinh > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" /> Chi phí cố định
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">{formatVND(cogs.tongChiPhiCoDinh)}/SP</span>
                </div>
              )}

              <div className="border-t border-dashed border-slate-200 pt-2 mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-black text-slate-700 flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5 text-violet-500" /> Giá vốn / SP
                  </span>
                  <span className="font-black text-violet-600 tabular-nums">
                    {formatVND(cogs.giaVon1SP ?? cogs.giaVonBinhQuan)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-500 pl-4.5 ml-0.5">Tổng lô ({lc.tongSL?.toLocaleString()} SP)</span>
                  <span className="font-black text-emerald-600 tabular-nums text-[13px]">
                    {formatVND(cogs.tongGiaVon ?? ((cogs.giaVon1SP ?? cogs.giaVonBinhQuan) * (lc.tongSL || 1)))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Outsourcing list */}
          {lc.phanCong && lc.phanCong.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-auto">
              {lc.phanCong
                .filter(pc => {
                  const name = pc.tenCongDoan.toLowerCase();
                  return name.includes('may') || name.includes('thêu') || name.includes('in');
                })
                .map((pc, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded-md border border-slate-200">
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
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pt-3 mt-4 border-t border-slate-100">
        <div className="w-full sm:w-auto flex-1">
          {lc.trangThai === "DaTao" || lc.trangThai === "Nhap" ? (
            <button
              onClick={() => onChangeStatus("ChuyenTiep")}
              className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              Chuyển tiếp
            </button>
          ) : <div className="hidden sm:block"></div>}
        </div>
        
        <div className="w-full sm:w-auto flex items-center gap-1.5 justify-end">
          <button
            onClick={onEdit}
            className="flex-1 sm:flex-none text-xs px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 font-bold flex items-center justify-center gap-1 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Xem/Sửa
          </button>
          
          <select
            value={lc.trangThai}
            onChange={(e) => onChangeStatus(e.target.value as TrangThaiLenhCat)}
            className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            {(["Nhap", "DaTao", "DangCat", "HoanThanh", "ChuyenTiep"] as TrangThaiLenhCat[]).map((tt) => (
              <option key={tt} value={tt}>{TRANG_THAI_LC_LABELS[tt]}</option>
            ))}
          </select>

          <button
            onClick={onDelete}
            className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg border border-rose-100 hover:border-rose-200 transition-colors bg-white shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
