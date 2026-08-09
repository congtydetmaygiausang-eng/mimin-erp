"use client";

// ============ UI ỦI (/ui-ui) ============  
// Nhận hàng từ Khuy nút (hoặc QC đạt), Ủi phẳng, giao Đóng gói

import { useState } from "react";
import { CheckCircle2, Wind } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, type TrangThaiCongDoan } from "@/lib/data/lenh-cat-store";
import { DateDisplay } from "@/components/ui";
import { useSession } from "@/components/session-provider";

export default function UiUiPage() {
  const { dsLenhCat, capNhatCongDoan } = useLenhCat();
  const [htInput, setHtInput] = useState<Record<string, { dat?: number; loi?: number; lyDo?: string }>>({});

  const { user } = useSession();

  function getHTPC(lc: any) {
    return lc.phanCong?.filter((pc: any) => {
      const isHT = pc.id === "ui" || pc.tenCongDoan?.toLowerCase().includes("ủi");
      if (user?.laCongNhan) {
        const isMyTask = pc.nguoiMa === user.id || pc.nguoiMa === user.maNV || pc.nguoiTen?.includes(user.name);
        return isHT && isMyTask;
      }
      return isHT;
    }) || [];
  }

  // LC chờ Ủi: Khuy nút (nếu có) xong, hoặc May xong (nếu ko có khuy nút)
  const lcHT = dsLenhCat.filter(lc => {
    // 1. Phải có công đoạn Ủi của TÔI
    const htPCs = getHTPC(lc);
    if (htPCs.length === 0) return false;

    // 2. Kiểm tra Khuy nút hoặc May
    const khuyNutPCs = lc.phanCong?.filter((pc: any) => pc.id === "khuy_nut" || pc.tenCongDoan?.toLowerCase().includes("khuy nút")) || [];
    if (khuyNutPCs.length > 0) {
      return khuyNutPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh");
    }

    const mayPCs = lc.phanCong?.filter((pc: any) => pc.tenCongDoan?.toLowerCase().includes("may")) || [];
    return mayPCs.length > 0 && mayPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh");
  });

  function handleNhanHang(lc: any, pc: any) {
    capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "dang_lam" });
    const key = `${lc.id}-${pc.id}`;
    setHtInput(p => ({ ...p, [key]: { dat: pc.soLuong || lc.tongSL, loi: 0, lyDo: "" } }));
    toast.success(`🧺 Nhận hàng hoàn thiện: ${lc.id} – ${pc.tenCongDoan}`);
  }

  function handleXong(lc: any, pc: any) {
    const input = htInput[`${lc.id}-${pc.id}`] || {};
    const slDat = input.dat ?? pc.soLuong ?? lc.tongSL;
    const slLoi = input.loi ?? 0;
    const lyDo = input.lyDo ?? "";
    
    const thanhTienDat = slDat * (pc.donGia || 0);

    capNhatCongDoan(lc.id, pc.id, { 
      trangThaiCD: "hoan_thanh", 
      soLuongHoanThanh: slDat,
      soLuongLoi: slLoi,
      lyDoLoi: lyDo,
      thanhTien: thanhTienDat, // Cập nhật lại công nợ theo SP đạt
      conLai: thanhTienDat - (pc.daThanhToan || 0)
    });

    // Nếu tất cả công đoạn HT đã xong → cập nhật LC HoanThanh
    const allPCs = getHTPC(lc);
    const allDone = allPCs.every((p: any) =>
      p.id === pc.id ? true : p.trangThaiCD === "hoan_thanh"
    );
    if (allDone) {
      toast.success(`🎉 ${lc.id} hoàn thành toàn bộ – Đang chờ Nhập kho thành phẩm!`);
    } else {
      toast.success(`✅ Hoàn thành: ${slDat} SP đạt${slLoi > 0 ? `, ${slLoi} SP lỗi` : ""}`);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
          <Wind className="w-7 h-7 text-sky-500" /> Tổ Ủi – Việc của tôi
        </h1>
        <p className="text-sm text-slate-500 mt-1">{lcHT.length} lô đang cần Ủi phẳng</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Đang làm", value: lcHT.filter(lc => getHTPC(lc).some((pc: any) => pc.trangThaiCD === "dang_lam")).length, color: "text-amber-600" },
          { label: "Chờ nhận", value: lcHT.filter(lc => getHTPC(lc).some((pc: any) => !pc.trangThaiCD || pc.trangThaiCD === "cho_giao")).length, color: "text-slate-600" },
          { label: "Hoàn thành", value: lcHT.filter(lc => getHTPC(lc).every((pc: any) => pc.trangThaiCD === "hoan_thanh")).length, color: "text-emerald-600" },
          { label: "Có lỗi", value: lcHT.filter(lc => getHTPC(lc).some((pc: any) => pc.trangThaiCD === "co_loi")).length, color: "text-rose-600" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500">{k.label}</div>
            <div className={`text-2xl font-black mt-1 ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {lcHT.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
          <Wind className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <div className="font-bold">Không có việc Ủi nào</div>
          <div className="text-sm mt-1">Chờ các tổ trước hoàn thành công đoạn sẽ xuất hiện ở đây</div>
        </div>
      ) : (
        <div className="space-y-4">
          {lcHT.map(lc => {
            const htPCs = getHTPC(lc);

            return (
              <div key={lc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/50">
                  <div>
                    <span className="font-black text-teal-700 font-mono">{lc.id}</span>
                    <span className="ml-3 font-bold text-slate-800 text-lg">{lc.tenSP}</span>
                    <span className="ml-2 text-xs text-slate-400">{lc.tongSL?.toLocaleString()} SP</span>
                  </div>
                  <DateDisplay value={lc.hanHoanThanh} format="dd/MM" showRelative />
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
                          <div className="mb-4 space-y-3 bg-white p-3 rounded-lg border border-slate-100">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <div className="text-[11px] font-bold text-slate-500 mb-1">Số lượng nhận</div>
                                <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700">
                                  {pc.soLuong || lc.tongSL}
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] font-bold text-emerald-600 mb-1">Số lượng đạt *</div>
                                <input type="number"
                                  value={htInput[key]?.dat ?? (pc.soLuong || lc.tongSL)}
                                  onChange={e => setHtInput(p => ({ ...p, [key]: { ...p[key], dat: +e.target.value } }))}
                                  className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30" />
                              </div>
                              <div>
                                <div className="text-[11px] font-bold text-rose-600 mb-1">Số lượng lỗi</div>
                                <input type="number"
                                  value={htInput[key]?.loi ?? 0}
                                  onChange={e => setHtInput(p => ({ ...p, [key]: { ...p[key], loi: +e.target.value } }))}
                                  className="w-full px-3 py-1.5 border border-rose-300 rounded-lg text-sm font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400/30" />
                              </div>
                              <div>
                                <div className="text-[11px] font-bold text-slate-600 mb-1">Lý do lỗi</div>
                                <input type="text"
                                  value={htInput[key]?.lyDo ?? ""}
                                  onChange={e => setHtInput(p => ({ ...p, [key]: { ...p[key], lyDo: e.target.value } }))}
                                  placeholder="Vd: Thủng lỗ..."
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/30" />
                              </div>
                            </div>
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
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition-colors shadow-sm">
                                <CheckCircle2 className="w-4 h-4" /> Hoàn thành & Chuyển Đóng Gói
                              </button>
                          )}
                          {tt === "hoan_thanh" && (
                            <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm flex flex-col justify-center gap-1">
                              <div className="flex items-center gap-2 font-bold text-emerald-700">
                                <CheckCircle2 className="w-4 h-4" /> Xong: {pc.soLuongHoanThanh ?? (pc.soLuong || lc.tongSL)} Đạt
                              </div>
                              {(pc.soLuongLoi > 0) && (
                                <div className="text-xs text-rose-600 font-semibold pl-6">
                                  ⚠️ Lỗi: {pc.soLuongLoi} SP - {pc.lyDoLoi}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Nhập kho khi tất cả xong */}
                  {isAllDone && !isLCDone && (
                    <div className="border-t border-slate-100 pt-4 mt-2">
                      <div className="mb-3">
                        <label className="text-xs font-bold text-slate-600 block mb-1">Khu vực Nhập kho *</label>
                        <select
                          value={khuVuc[lc.id] || ""}
                          onChange={e => setKhuVuc(p => ({ ...p, [lc.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                        >
                          <option value="">-- Chọn khu vực lưu trữ --</option>
                          <option value="Khu A - Tầng 1">Khu A - Tầng 1</option>
                          <option value="Khu A - Tầng 2">Khu A - Tầng 2</option>
                          <option value="Khu B - Kệ 01">Khu B - Kệ 01</option>
                          <option value="Khu B - Kệ 02">Khu B - Kệ 02</option>
                          <option value="Khu C chờ xuất">Khu C chờ xuất</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          if (!khuVuc[lc.id]) {
                            toast.error("Vui lòng chọn khu vực nhập kho!");
                            return;
                          }
                          capNhatTrangThai(lc.id, "HoanThanh", null);
                          toast.success(`📦 Đã nhập kho ${lc.id} tại ${khuVuc[lc.id]}`);
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
