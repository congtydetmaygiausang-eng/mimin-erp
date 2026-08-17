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
            <span className="text-lg font-black text-teal-700 font-mono tracking-tight">{lc.id}</span>
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
          
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-4">
            <span>{LOAI_SP_LABELS[lc.loaiSP]}</span>
            <span>·</span>
            <span>Mã: <span className="font-bold text-slate-800">{lc.maSP}</span></span>
            {lc.daCoSoDo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 ml-1.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-black tracking-wide">
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

          {/* COGS Section */}
          {cogs && (
            <div className="space-y-1.5 mb-4">
              <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-slate-400" /> Bảng giá vốn
              </div>

              {cogs.tongTienVai != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Vải
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">{formatVND(cogs.tongTienVai / Math.max(1, lc.tongSL || 1))}/SP</span>
                </div>
              )}
              {cogs.tongTienPhuLieu != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" /> Phụ liệu
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">{formatVND(cogs.tongTienPhuLieu / Math.max(1, lc.tongSL || 1))}/SP</span>
                </div>
              )}
              {cogs.giaCong1SP != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Gia công
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">{formatVND(cogs.giaCong1SP)}/SP</span>
                </div>
              )}
              {cogs.tongChiPhiCoDinh != null && cogs.tongChiPhiCoDinh > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Chi phí cố định
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">{formatVND(cogs.tongChiPhiCoDinh)}/SP</span>
                </div>
              )}

              <div className="border-t border-dashed border-slate-200 pt-2.5 mt-2.5">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-black text-slate-700 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-violet-500" /> Giá vốn / SP
                  </span>
                  <span className="font-black text-violet-600 tabular-nums text-lg">
                    {formatVND(cogs.giaVon1SP ?? cogs.giaVonBinhQuan)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-500 pl-5 ml-0.5">Tổng lô ({lc.tongSL?.toLocaleString()} SP)</span>
                  <span className="font-black text-emerald-600 tabular-nums text-lg">
                    {formatVND(cogs.tongGiaVon ?? ((cogs.giaVon1SP ?? cogs.giaVonBinhQuan) * (lc.tongSL || 1)))}
                  </span>
                </div>
              </div>
            </div>
          )}

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
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 flex flex-wrap items-center gap-3">
            <button
              className="min-w-[110px] h-[58px] rounded-2xl border-2 border-cyan-300 bg-white text-slate-700 font-bold flex items-center justify-center transition-all hover:border-cyan-400 hover:shadow-sm text-[11px] leading-tight"
              title="In phiếu gia công"
            >
              <div className="flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                <span>In</span>
                <span>phiếu</span>
              </div>
            </button>

            <button
              className="min-w-[110px] h-[58px] rounded-2xl border-2 border-cyan-300 bg-white text-slate-700 font-bold flex items-center justify-center transition-all hover:border-cyan-400 hover:shadow-sm text-[11px] leading-tight"
              title="Chia sẻ Zalo"
            >
              <div className="flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>Chia</span>
                <span>sé</span>
              </div>
            </button>

            <button
              className="min-w-[110px] h-[58px] rounded-2xl border-2 border-cyan-300 bg-white text-slate-700 font-bold flex items-center justify-center transition-all hover:border-cyan-400 hover:shadow-sm text-[11px] leading-tight"
              title="Lưu nháp"
            >
              <div className="flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                <span>Lưu</span>
                <span>nháp</span>
              </div>
            </button>

            <button
              className="min-w-[110px] h-[58px] rounded-2xl border-2 border-cyan-300 bg-white text-slate-700 font-bold flex items-center justify-center transition-all hover:border-cyan-400 hover:shadow-sm text-[11px] leading-tight"
              title="Hoàn tất lệnh"
            >
              <div className="flex flex-col items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                <span>Hoàn</span>
                <span>tất</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              className="min-w-[72px] h-[58px] rounded-full bg-gradient-to-br from-violet-600 to-violet-500 text-white font-black flex items-center justify-center shadow-lg shadow-violet-400/30 hover:scale-[1.02] transition-all -translate-y-1.5"
              title="Chuyển khâu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>

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
