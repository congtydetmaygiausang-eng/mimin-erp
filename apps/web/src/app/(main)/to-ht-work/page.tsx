"use client";

// ============ UI HOÀN THIỆN (/ui-hoan-thien) ============
// Nhận hàng từ QC đạt, Ủi + Gấp + Đóng gói, giao Kho Thành Phẩm

import { useState } from "react";
import { ClipboardList, CheckCircle2, Package, Shirt, Clock, Box } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, type TrangThaiCongDoan, type LenhCat } from "@/lib/data/lenh-cat-store";
import { LenhCatCardV2, ChiTietMauHistoryModal, type ChiTietMauInput } from "@/components/ui";
import { useSession } from "@/components/session-provider";

export default function UiHoanThienPage() {
  const [selectedMau, setSelectedMau] = useState<{lc: LenhCat, mau: any} | null>(null);
  const { dsLenhCat, capNhatCongDoan, capNhatTrangThai } = useLenhCat();
  const [soThung, setSoThung] = useState<Record<string, number>>({});
  const [khuVuc, setKhuVuc] = useState<Record<string, string>>({});

  const { user } = useSession();

  function getHTPC(lc: any) {
    return lc.phanCong?.filter((pc: any) => {
      const isHT = pc.id === "ui" || pc.id === "dongGoi" ||
                   pc.tenCongDoan?.toLowerCase().includes("ủi") ||
                   pc.tenCongDoan?.toLowerCase().includes("đóng gói");

      if (user?.laCongNhan) {
        const isMyTask = pc.nguoiMa === user.id || pc.nguoiMa === user.maNV || pc.nguoiTen?.includes(user.name);
        return isHT && isMyTask;
      }
      return isHT;
    }) || [];
  }

  // LC chờ hoàn thiện: các công đoạn trước (May áo, May quần...) ĐÃ XONG (đủ bộ), chuẩn bị Ủy/Đóng gói
  const lcHT = dsLenhCat.filter(lc => {
    // 1. Phải có công đoạn HT của TÔI
    const htPCs = getHTPC(lc);
    if (htPCs.length === 0) return false;

    // 2. Tất cả công đoạn gia công trước đó (Cắt, May, In...) phải hoàn thành thì mới "đủ bộ"
    const prevPCs = lc.phanCong?.filter((pc: any) =>
      !(pc.id === "ui" || pc.id === "dongGoi" ||
        pc.tenCongDoan?.toLowerCase().includes("ủi") ||
        pc.tenCongDoan?.toLowerCase().includes("đóng gói"))
    ) || [];

    // Nếu chưa hoàn thành tất cả công đoạn trước -> Chưa đủ bộ -> Không hiển thị ở Hoàn thiện
    return prevPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh");
  });

  const handleSaveColorModal = (pcId: string, data: ChiTietMauInput) => {
    if (!selectedMau) return;
    const { lc } = selectedMau;
    const pc = lc.phanCong?.find((p: any) => p.id === pcId);
    if (!pc) return;

    try {
      const existingIdx = pc.chiTietMau?.findIndex((m: any) => m.mau === data.mau) ?? -1;
      let newChiTiet = [...(pc.chiTietMau || [])];

      if (existingIdx >= 0) {
        newChiTiet[existingIdx] = data;
      } else {
        newChiTiet.push(data);
      }

      capNhatCongDoan(lc.id, pcId, { chiTietMau: newChiTiet });
      toast.success(`Đã lưu thông tin màu ${data.mau}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  function handleNhanHang(lc: any, pc: any) {
    capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "dang_lam" });
    toast.success(`🧺 Nhận hàng hoàn thiện: ${lc.id} – ${pc.tenCongDoan}`);
  }

  function handleXong(lc: any, pc: any) {
    const key = `${lc.id}-${pc.id}`;
    const chiTietMau = pc.chiTietMau || [];

    let slDat = 0;
    let slLoi = 0;

    if (chiTietMau.length > 0) {
      for (const m of chiTietMau) {
        slDat += (m.soLuongDat || 0);
        slLoi += (m.soLuongLoi || 0);
      }
    } else {
      slDat = pc.soLuong || lc.tongSL;
      slLoi = 0;
    }

    const numThung = soThung[key] ?? 0;
    const lyDoKemThung = numThung > 0 ? `Đóng được: ${numThung} thùng` : "";

    const thanhTienDat = slDat * (pc.donGia || 0);

    capNhatCongDoan(lc.id, pc.id, {
      trangThaiCD: "hoan_thanh",
      soLuongHoanThanh: slDat,
      soLuongLoi: slLoi,
      lyDoLoi: lyDoKemThung,
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
      toast.success(`✅ ${pc.tenCongDoan} xong: ${slDat} SP`);
    }
  }

  const tongSPDangHT = lcHT.reduce((s, lc) => {
    const htPCs = getHTPC(lc);
    const dangLam = htPCs.some((pc: any) => pc.trangThaiCD === "dang_lam");
    return dangLam ? s + (lc.tongSL || 0) : s;
  }, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Transparent Glassmorphism Header Card */}
      <div className="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-3xl p-5 mb-5 space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-slate-800 drop-shadow-sm">
            <ClipboardList className="w-7 h-7 text-sky-600" /> Hoàn Thiện – Công việc
          </h1>
          <p className="text-sm font-bold text-slate-600 mt-1">
            Ủi · Gấp mác · Đóng gói · Kiểm tra cuối
          </p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Lô đang hoàn thiện", value: lcHT.filter(lc => getHTPC(lc).some((pc: any) => pc.trangThaiCD === "dang_lam")).length, color: "text-amber-700", icon: Clock },
            { label: "SP đang xử lý", value: tongSPDangHT, color: "text-sky-700", icon: Shirt },
            { label: "Lô chờ nhận", value: lcHT.filter(lc => getHTPC(lc).every((pc: any) => !pc.trangThaiCD || pc.trangThaiCD === "cho_giao")).length, color: "text-slate-800", icon: Package },
            { label: "Lô hoàn thành", value: lcHT.filter(lc => lc.trangThai === "HoanThanh").length, color: "text-emerald-700", icon: CheckCircle2 },
          ].map(k => (
            <div key={k.label} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-4 shadow-sm transition hover:scale-[1.02]">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <k.icon className="w-3.5 h-3.5" /> {k.label}
              </div>
              <div className={`text-2xl font-black mt-1 ${k.color}`}>{k.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
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
              <LenhCatCardV2
                key={lc.id}
                lc={lc}
                onColorClick={(mau) => setSelectedMau({ lc, mau })}
                renderStatus={
                  isLCDone ? (
                    <span className="text-xs bg-emerald-500 text-white font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> HOÀN THÀNH
                    </span>
                  ) : null
                }
              >
                <div className="space-y-3">
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
                            <div className="text-[11px] font-bold text-sky-600 mb-1">Số thùng/kiện</div>
                            <input type="number"
                              value={soThung[key] ?? ""}
                              onChange={e => setSoThung(p => ({ ...p, [key]: +e.target.value }))}
                              placeholder="0"
                              className="w-full px-3 py-2 border border-sky-300 rounded-lg text-sm font-bold text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
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
              </LenhCatCardV2>
            );
          })}
        </div>
      )}

      {/* Modal nhập liệu cho màu */}
      {selectedMau && (
        <ChiTietMauHistoryModal
          isOpen={!!selectedMau}
          onClose={() => setSelectedMau(null)}
          lc={selectedMau.lc}
          mau={selectedMau.mau}
          currentPCs={getHTPC(selectedMau.lc).filter((pc: any) => pc.trangThaiCD === "dang_lam")}
          onSave={handleSaveColorModal}
        />
      )}
    </div>
  );
}
