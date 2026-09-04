"use client";

// ============ UI GIA CÔNG IN THÊU (/ui-intd) ============
// Trang dành riêng cho bộ phận In / Thêu
// Nhận bán thành phẩm từ Cắt, hoàn thành chuyển cho May

import { useState } from "react";
import { Palette, CheckCircle2, Clock, AlertTriangle, Package } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, type TrangThaiCongDoan, type LenhCat } from "@/lib/data/lenh-cat-store";
import { kiemTraTruocHoanThanh } from "@/lib/data/cong-doan-helper";
import { LenhCatCardV2, ChiTietMauHistoryModal, type ChiTietMauInput } from "@/components/ui";
import { useSession } from "@/components/session-provider";

const INTD_KEYS = ["in", "theu", "dap", "inAo", "theuAo"];

export default function UiInTheuPage() {
  const [selectedMau, setSelectedMau] = useState<{lc: LenhCat, mau: any} | null>(null);
  const { dsLenhCat, capNhatCongDoan, suaLenhCat } = useLenhCat();
  const { user } = useSession();

  function getIntdPC(lc: any) {
    return lc.phanCong?.filter((pc: any) => {
      const isIntd = INTD_KEYS.some(k => pc.id === k || pc.tenCongDoan?.toLowerCase().includes("in") || pc.tenCongDoan?.toLowerCase().includes("thêu"));
      
      // Nếu là công đoạn In/Thêu mà không có người phụ trách (bỏ qua/không chọn) thì không hiển thị
      if (isIntd && (!pc.nguoiMa || pc.nguoiMa === "")) {
        return false;
      }

      if (user?.laCongNhan) {
        const isMyTask = pc.nguoiMa === user.id || pc.nguoiMa === user.maNV || pc.nguoiTen?.includes(user.name);
        return isIntd && isMyTask;
      }
      return isIntd;
    }) || [];
  }

  // Ổ KHÓA: Chỉ hiển thị Lệnh cắt có In/Thêu, và Cắt ĐÃ XONG
  const lcCoIntd = dsLenhCat.filter(lc =>
    ["DangCat", "HoanThanh", "ChuyenTiep"].includes(lc.trangThai)
  ).filter(lc => {
    const intdPCs = getIntdPC(lc);
    if (intdPCs.length === 0) return false;

    // Kiểm tra Cắt đã xong chưa
    const catPCs = lc.phanCong?.filter((pc: any) => pc.id === "cat" || pc.tenCongDoan?.toLowerCase().includes("cắt")) || [];
    // Nếu có Cắt, tất cả Cắt phải hoan_thanh
    if (catPCs.length > 0 && !catPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh")) {
      return false;
    }
    return true;
  });

  function getCatTT(lc: any) {
    const catPC = lc.phanCong?.find((pc: any) => pc.id === "cat" || pc.tenCongDoan?.toLowerCase().includes("cắt")) as any;
    return catPC?.trangThaiCD ?? "cho_giao";
  }

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

      if (data.sizes && data.sizes.length > 0) {
        const mauIdx = lc.dsMau?.findIndex((m: any) => m.ten === data.mau) ?? -1;
        if (mauIdx >= 0) {
          const newDsMau = [...(lc.dsMau || [])];
          newDsMau[mauIdx] = { ...newDsMau[mauIdx], tyLeSizeChiTiet: { ...(newDsMau[mauIdx].tyLeSizeChiTiet || {}), [pcId]: data.sizes } };
          suaLenhCat(lc.id, { dsMau: newDsMau }, user as any);
        }
      }

      toast.success(`Đã lưu thông tin màu ${data.mau}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  function handleNhanHang(lc: any, pc: any) {
    capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "dang_lam" });
    toast.success(`🎨 Nhận hàng In/Thêu: ${lc.id} – ${pc.tenCongDoan}`);
  }

  function handleHoanThanh(lc: any, pc: any) {
    // Bắt buộc khai báo đạt/lỗi theo màu + chặn số vượt khâu trước.
    const kiemTra = kiemTraTruocHoanThanh(lc, pc);
    if (!kiemTra.ok) {
      toast.error(kiemTra.loi!, { duration: 6000 });
      return;
    }
    const tongDat = kiemTra.slDat;
    const tongLoi = kiemTra.slLoi;

    capNhatCongDoan(lc.id, pc.id, {
      trangThaiCD: "hoan_thanh",
      soLuongHoanThanh: tongDat,
      soLuongLoi: tongLoi
    });
    toast.success(`✅ Chuyển tiếp thành công: ${tongDat} SP (Lỗi: ${tongLoi})`);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Transparent Glassmorphism Header Card */}
      <div className="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-3xl p-5 mb-5 space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-slate-800 drop-shadow-sm">
            <Palette className="w-7 h-7 text-violet-600" /> Tổ In / Thêu – Công việc
          </h1>
          <p className="text-sm font-bold text-slate-600 mt-1">{lcCoIntd.length} lệnh đang chờ / đang làm</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Đang làm", value: lcCoIntd.filter(lc => getIntdPC(lc).some((pc: any) => pc.trangThaiCD === "dang_lam")).length, color: "text-amber-600" },
            { label: "Chờ nhận", value: lcCoIntd.filter(lc => getIntdPC(lc).some((pc: any) => !pc.trangThaiCD || pc.trangThaiCD === "cho_giao")).length, color: "text-slate-700" },
            { label: "Hoàn thành", value: lcCoIntd.filter(lc => getIntdPC(lc).every((pc: any) => pc.trangThaiCD === "hoan_thanh")).length, color: "text-emerald-700" },
            { label: "Có lỗi", value: lcCoIntd.filter(lc => getIntdPC(lc).some((pc: any) => pc.trangThaiCD === "co_loi")).length, color: "text-rose-700" },
          ].map(k => (
            <div key={k.label} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-4 shadow-sm transition hover:scale-[1.02]">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{k.label}</div>
              <div className={`text-2xl font-black mt-1 ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Danh sách lệnh cắt */}
      {lcCoIntd.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Palette className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <div className="font-bold">Tuyệt vời! Bạn đã hoàn thành tất cả công việc</div>
          <div className="text-sm mt-1">Đang chờ nhận thêm hàng từ Cắt...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {lcCoIntd.map(lc => {
            const intdPCs = getIntdPC(lc);
            const catTT = getCatTT(lc);
            const catDone = catTT === "hoan_thanh";

            return (
              <LenhCatCardV2
                key={lc.id}
                lc={lc}
                onColorClick={(mau) => setSelectedMau({ lc, mau })}
                renderStatus={
                  !catDone ? (
                    <div className="px-3 py-1 bg-amber-50 border border-amber-200 text-xs text-amber-700 font-bold flex items-center gap-1.5 rounded-full">
                      <Clock className="w-3 h-3" /> Chờ Tổ Cắt ({TRANG_THAI_CD_LABELS[catTT as TrangThaiCongDoan] || "Chờ giao"})
                    </div>
                  ) : null
                }
              >
                <div className="space-y-3">
                  {intdPCs.map((pc: any) => {
                    const tt = (pc.trangThaiCD as TrangThaiCongDoan | undefined) ?? "cho_giao";
                    const style = TRANG_THAI_CD_STYLE[tt];

                    return (
                      <div key={pc.id} className={`rounded-xl border p-4 ${style.bg} border-current/20`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-black text-slate-800">{pc.tenCongDoan}</div>
                            <div className="text-xs text-slate-500">{pc.nguoiTen || "Chưa giao"} · {(pc.soLuong || lc.tongSL)?.toLocaleString()} SP</div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${style.text} bg-white/70 border`}>
                            {TRANG_THAI_CD_LABELS[tt]}
                          </span>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                          {tt === "cho_giao" && (
                            <button onClick={() => handleNhanHang(lc, pc)}
                              className="flex-1 py-2 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 flex items-center justify-center gap-1.5">
                              <Package className="w-4 h-4" /> Nhận hàng In/Thêu
                            </button>
                          )}
                          {tt === "dang_lam" && (
                            <>
                              <button
                                onClick={() => handleHoanThanh(lc, pc)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Hoàn thành & Chuyển tiếp
                              </button>
                              <button onClick={() => capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "co_loi" })}
                                className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-bold text-sm">
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {tt === "hoan_thanh" && (
                            <div className="flex-1 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              Xong {pc.soLuongHoanThanh || pc.soLuong || lc.tongSL} SP
                              {pc.soLuongLoi > 0 && <span className="text-rose-500 text-xs ml-2">({pc.soLuongLoi} lỗi)</span>}
                            </div>
                          )}
                          {tt === "co_loi" && (
                            <button onClick={() => handleNhanHang(lc, pc)}
                              className="flex-1 py-2 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 flex items-center justify-center gap-1.5">
                              <Clock className="w-4 h-4" /> Làm lại
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
          currentPCs={getIntdPC(selectedMau.lc).filter((pc: any) => pc.trangThaiCD === "dang_lam")}
          onSave={handleSaveColorModal}
        />
      )}
    </div>
  );
}
