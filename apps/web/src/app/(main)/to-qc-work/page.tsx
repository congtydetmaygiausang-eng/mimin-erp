"use client";

// ============ UI QC - KIỂM TRA CHẤT LƯỢNG (/ui-qc) ============
// Nhận hàng từ Tổ May, kiểm tra SL đạt/lỗi, quyết định Đạt → HT hay Lỗi → Trả may

import { useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ClipboardCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, type TrangThaiCongDoan } from "@/lib/data/lenh-cat-store";
import { DateDisplay } from "@/components/ui";

const LOAI_LOI_OPTIONS = [
  "Lỗi đường may", "Sai size", "Sai màu", "Vải bị lỗi",
  "Ô nhiễm / bẩn", "Cúc / khóa lỗi", "Đường in bị lem", "Thêu lỗi",
];

export default function UiQCPage() {
  const { dsLenhCat, capNhatCongDoan } = useLenhCat();
  const [slDat, setSlDat] = useState<Record<string, number>>({});
  const [slLoi, setSlLoi] = useState<Record<string, number>>({});
  const [loaiLoi, setLoaiLoi] = useState<Record<string, string>>({});
  const [ghiChu, setGhiChu] = useState<Record<string, string>>({});

  // Lấy LC có công đoạn may đã xong, chờ QC
  const lcChoQC = dsLenhCat.filter(lc =>
    lc.phanCong?.some((pc: any) =>
      (pc.id === "mayAo" || pc.id === "mayQuan" || pc.tenCongDoan?.toLowerCase().includes("may")) &&
      pc.trangThaiCD === "hoan_thanh"
    )
  );

  // Tất cả LC đang ở QC
  const lcQCData = lcChoQC.map(lc => {
    const mayPCs = lc.phanCong?.filter((pc: any) =>
      (pc.id === "mayAo" || pc.id === "mayQuan" || pc.tenCongDoan?.toLowerCase().includes("may")) &&
      pc.trangThaiCD === "hoan_thanh"
    ) || [];
    return { lc, mayPCs };
  });

  // KPI
  const tongSPChoKiem = lcChoQC.reduce((s, lc) => s + (lc.tongSL || 0), 0);

  function handleDat(lc: any) {
    const slD = slDat[lc.id] ?? lc.tongSL;
    const slL = slLoi[lc.id] ?? 0;
    // Cập nhật tất cả công đoạn may thành hoan_thanh QC pass
    lc.phanCong?.filter((pc: any) =>
      pc.tenCongDoan?.toLowerCase().includes("may") && pc.trangThaiCD === "hoan_thanh"
    ).forEach((pc: any) => {
      capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "hoan_thanh", soLuongHoanThanh: slD, soLuongLoi: slL });
    });
    // Cập nhật công đoạn UI (ủi/hoàn thiện) thành dang_lam nếu có
    const uiPC = lc.phanCong?.find((pc: any) => pc.id === "ui" || pc.tenCongDoan?.toLowerCase().includes("ủi")) as any;
    if (uiPC) capNhatCongDoan(lc.id, uiPC.id, { trangThaiCD: "dang_lam" });
    toast.success(`✅ QC đạt: ${lc.id} – ${slD} SP đạt${slL > 0 ? `, ${slL} SP lỗi` : ""}`);
  }

  function handleTraLai(lc: any) {
    const slL = slLoi[lc.id] ?? 0;
    const ll = loaiLoi[lc.id] ?? "";
    lc.phanCong?.filter((pc: any) =>
      pc.tenCongDoan?.toLowerCase().includes("may") && pc.trangThaiCD === "hoan_thanh"
    ).forEach((pc: any) => {
      capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "co_loi", soLuongLoi: slL });
    });
    toast.error(`⚠️ Trả lại: ${lc.id} – ${slL} SP lỗi${ll ? ` (${ll})` : ""}`);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-emerald-500" /> QC – Kiểm tra chất lượng
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {lcChoQC.length} lô chờ kiểm · {tongSPChoKiem.toLocaleString()} SP
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Chờ kiểm", value: lcChoQC.length, color: "text-amber-600", icon: ClipboardCheck },
          { label: "SP cần kiểm", value: tongSPChoKiem, color: "text-slate-700", icon: ShieldCheck },
          { label: "Đã đạt hôm nay", value: 0, color: "text-emerald-600", icon: CheckCircle2 },
          { label: "Trả lại hôm nay", value: 0, color: "text-rose-600", icon: XCircle },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500 flex items-center gap-1"><k.icon className="w-3 h-3" /> {k.label}</div>
            <div className={`text-2xl font-black mt-1 ${k.color}`}>{k.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {lcChoQC.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <div className="font-bold">Chưa có lô nào cần kiểm tra</div>
          <div className="text-sm mt-1">Khi Tổ May hoàn thành sẽ xuất hiện ở đây</div>
        </div>
      ) : (
        <div className="space-y-4">
          {lcQCData.map(({ lc, mayPCs }) => (
            <div key={lc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="font-black text-teal-700 font-mono">{lc.id}</span>
                  <span className="ml-3 font-bold text-slate-800 text-lg">{lc.tenSP}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-slate-700">{lc.tongSL?.toLocaleString()} SP</div>
                  <DateDisplay value={lc.hanHoanThanh} format="dd/MM" />
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Công đoạn may đã xong */}
                <div className="flex flex-wrap gap-2">
                  {mayPCs.map((pc: any) => (
                    <span key={pc.id} className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> {pc.tenCongDoan}: {pc.soLuongHoanThanh || lc.tongSL} SP
                    </span>
                  ))}
                </div>

                {/* Form kiểm tra */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-600 mb-1">🟢 SP đạt:</div>
                    <input type="number" value={slDat[lc.id] ?? lc.tongSL}
                      onChange={e => setSlDat(p => ({ ...p, [lc.id]: +e.target.value }))}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-600 mb-1">🔴 SP lỗi:</div>
                    <input type="number" value={slLoi[lc.id] ?? 0}
                      onChange={e => setSlLoi(p => ({ ...p, [lc.id]: +e.target.value }))}
                      className="w-full px-3 py-2 border border-rose-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/30" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-600 mb-1">Loại lỗi:</div>
                    <select value={loaiLoi[lc.id] ?? ""}
                      onChange={e => setLoaiLoi(p => ({ ...p, [lc.id]: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none">
                      <option value="">-- Chọn loại lỗi --</option>
                      {LOAI_LOI_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-600 mb-1">Ghi chú:</div>
                  <input type="text" value={ghiChu[lc.id] ?? ""}
                    onChange={e => setGhiChu(p => ({ ...p, [lc.id]: e.target.value }))}
                    placeholder="Mô tả chi tiết lỗi (tuỳ chọn)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none" />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button onClick={() => handleDat(lc)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 flex items-center justify-center gap-2 transition-colors">
                    <CheckCircle2 className="w-4 h-4" /> Đạt – Chuyển Hoàn Thiện
                  </button>
                  <button onClick={() => handleTraLai(lc)}
                    className="flex-1 py-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-600 font-bold hover:bg-rose-100 flex items-center justify-center gap-2 transition-colors">
                    <XCircle className="w-4 h-4" /> Lỗi – Trả lại Tổ May
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
