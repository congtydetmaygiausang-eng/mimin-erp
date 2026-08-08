"use client";

// ============ UI HOÀN THIỆN (/ui-hoan-thien) ============  
// Nhận hàng từ QC đạt, Ủi + Gấp + Đóng gói, giao Kho Thành Phẩm

import { useState } from "react";
import { ClipboardList, CheckCircle2, Package, Shirt, Clock, Box } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, type TrangThaiCongDoan } from "@/lib/data/lenh-cat-store";
import { DateDisplay } from "@/components/ui";

export default function UiHoanThienPage() {
  const { dsLenhCat, capNhatCongDoan, capNhatTrangThai } = useLenhCat();
  const [slInput, setSlInput] = useState<Record<string, number>>({});

  // LC chờ hoàn thiện: công đoạn ủi/đóng gói còn chưa xong, nhưng may đã xong
  const lcHT = dsLenhCat.filter(lc =>
    lc.phanCong?.some((pc: any) =>
      (pc.id === "ui" || pc.id === "dongGoi" ||
       pc.tenCongDoan?.toLowerCase().includes("ủi") ||
       pc.tenCongDoan?.toLowerCase().includes("đóng gói"))
    )
  );

  function getHTPC(lc: any) {
    return lc.phanCong?.filter((pc: any) =>
      pc.id === "ui" || pc.id === "dongGoi" ||
      pc.tenCongDoan?.toLowerCase().includes("ủi") ||
      pc.tenCongDoan?.toLowerCase().includes("đóng gói")
    ) || [];
  }

  function handleNhanHang(lc: any, pc: any) {
    capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "dang_lam" });
    toast.success(`🧺 Nhận hàng hoàn thiện: ${lc.id} – ${pc.tenCongDoan}`);
  }

  function handleXong(lc: any, pc: any) {
    const sl = slInput[`${lc.id}-${pc.id}`] ?? pc.soLuong ?? lc.tongSL;
    capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "hoan_thanh", soLuongHoanThanh: sl });

    // Nếu tất cả công đoạn HT đã xong → cập nhật LC HoanThanh
    const allPCs = getHTPC(lc);
    const allDone = allPCs.every((p: any) =>
      p.id === pc.id ? true : p.trangThaiCD === "hoan_thanh"
    );
    if (allDone) {
      capNhatTrangThai(lc.id, "HoanThanh", null);
      toast.success(`🎉 ${lc.id} hoàn thành toàn bộ – Nhập kho thành phẩm!`);
    } else {
      toast.success(`✅ ${pc.tenCongDoan} xong: ${sl} SP`);
    }
  }

  const tongSPDangHT = lcHT.reduce((s, lc) => {
    const htPCs = getHTPC(lc);
    const dangLam = htPCs.some((pc: any) => pc.trangThaiCD === "dang_lam");
    return dangLam ? s + (lc.tongSL || 0) : s;
  }, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-sky-500" /> Hoàn Thiện – Công việc
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Ủi · Gấp mác · Đóng gói · Kiểm tra cuối
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Lô đang hoàn thiện", value: lcHT.filter(lc => getHTPC(lc).some((pc: any) => pc.trangThaiCD === "dang_lam")).length, color: "text-amber-600", icon: Clock },
          { label: "SP đang xử lý", value: tongSPDangHT, color: "text-sky-600", icon: Shirt },
          { label: "Lô chờ nhận", value: lcHT.filter(lc => getHTPC(lc).every((pc: any) => !pc.trangThaiCD || pc.trangThaiCD === "cho_giao")).length, color: "text-slate-600", icon: Package },
          { label: "Lô hoàn thành", value: lcHT.filter(lc => lc.trangThai === "HoanThanh").length, color: "text-emerald-600", icon: CheckCircle2 },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500 flex items-center gap-1"><k.icon className="w-3 h-3" /> {k.label}</div>
            <div className={`text-2xl font-black mt-1 ${k.color}`}>{k.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {lcHT.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <div className="font-bold">Chưa có lô nào cần hoàn thiện</div>
          <div className="text-sm mt-1">Hàng QC đạt sẽ chuyển sang đây</div>
        </div>
      ) : (
        <div className="space-y-4">
          {lcHT.map(lc => {
            const htPCs = getHTPC(lc);
            const isAllDone = htPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh");
            const isLCDone = lc.trangThai === "HoanThanh";

            return (
              <div key={lc.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isLCDone ? "border-emerald-200" : "border-slate-200"}`}>
                {/* Header */}
                <div className={`px-5 py-4 border-b flex items-center justify-between ${isLCDone ? "bg-emerald-50 border-emerald-100" : "bg-sky-50 border-sky-100"}`}>
                  <div>
                    <span className="font-black text-teal-700 font-mono">{lc.id}</span>
                    <span className="ml-3 font-bold text-slate-800 text-lg">{lc.tenSP}</span>
                    <span className="ml-2 text-xs text-slate-400">{lc.tongSL?.toLocaleString()} SP</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {isLCDone && (
                      <span className="text-xs bg-emerald-500 text-white font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> HOÀN THÀNH
                      </span>
                    )}
                    <DateDisplay value={lc.hanHoanThanh} format="dd/MM" showRelative />
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {htPCs.map((pc: any) => {
                    const tt = (pc.trangThaiCD as TrangThaiCongDoan | undefined) ?? "cho_giao";
                    const style = TRANG_THAI_CD_STYLE[tt];
                    const key = `${lc.id}-${pc.id}`;

                    return (
                      <div key={pc.id} className={`rounded-xl border p-4 ${style.bg} border-current/20`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-black text-slate-800">{pc.tenCongDoan}</div>
                            <div className="text-xs text-slate-500">{pc.nguoiTen || "Chưa giao"}</div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold bg-white/70 border ${style.text}`}>
                            {TRANG_THAI_CD_LABELS[tt]}
                          </span>
                        </div>

                        {tt === "dang_lam" && (
                          <div className="mb-3">
                            <div className="text-xs font-bold text-slate-600 mb-1">SP đã xử lý:</div>
                            <input type="number"
                              value={slInput[key] ?? ""}
                              onChange={e => setSlInput(p => ({ ...p, [key]: +e.target.value }))}
                              placeholder={String(pc.soLuong || lc.tongSL)}
                              className="w-full md:w-40 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
                          </div>
                        )}

                        <div className="flex gap-2">
                          {tt === "cho_giao" && (
                            <button onClick={() => handleNhanHang(lc, pc)}
                              className="flex-1 py-2 rounded-xl bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 flex items-center justify-center gap-1.5">
                              <Package className="w-4 h-4" /> Nhận hàng
                            </button>
                          )}
                          {tt === "dang_lam" && (
                            <button onClick={() => handleXong(lc, pc)}
                              className="flex-1 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Xong
                            </button>
                          )}
                          {tt === "hoan_thanh" && (
                            <div className="flex-1 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Xong {pc.soLuongHoanThanh || pc.soLuong || lc.tongSL} SP
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Nhập kho khi tất cả xong */}
                  {isAllDone && !isLCDone && (
                    <div className="border-t border-slate-100 pt-4">
                      <button
                        onClick={() => {
                          capNhatTrangThai(lc.id, "HoanThanh", null);
                          toast.success(`📦 Nhập kho thành phẩm: ${lc.id}`);
                        }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black hover:from-emerald-600 hover:to-teal-600 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02]"
                      >
                        <Box className="w-5 h-5" /> Nhập kho thành phẩm
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
