"use client";

// ============ UI ỦI (/ui-ui) ============
// Nhận hàng từ Khuy nút (hoặc QC đạt), Ủi phẳng, giao Đóng gói

import { useStageColorInput } from "@/lib/use-stage-color-input";
import { useState } from "react";
import { CheckCircle2, Wind, Package } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, type TrangThaiCongDoan, type LenhCat } from "@/lib/data/lenh-cat-store";
import { kiemTraTruocHoanThanh } from "@/lib/data/cong-doan-helper";
import { LenhCatCardV2, ChiTietMauHistoryModal } from "@/components/ui";
import { UploadBangChungModal } from "@/components/modals/UploadBangChungModal";
import { useSession } from "@/components/session-provider";

export default function UiUiPage() {
  const { selectedMau, setSelectedMau, handleSaveColorBatch } = useStageColorInput();
  const [uploadModal, setUploadModal] = useState<{ lc: any; pc: any } | null>(null);
  const { dsLenhCat, capNhatCongDoan, suaLenhCat } = useLenhCat();

  const { user } = useSession();

  function getHTPC(lc: any) {
    return lc.phanCong?.filter((pc: any) => {
      const isHT = pc.id === "ui" || pc.tenCongDoan?.toLowerCase().includes("ủi");
      
      // Nếu là công nhân thì chỉ thấy việc của mình
      // Quản lý/tổ trưởng thấy tất cả

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
    
    const qcPC = lc.phanCong?.find((pc: any) => pc.id === "qc");
    const isBo = lc.loaiLenh?.toLowerCase().includes("bo") || mayPCs.length > 1;

    // Chốt chặn ở bước QC cho hàng Bộ: Phải hoàn thành cả Áo và Quần (QC ghép bộ xong)
    if (isBo && qcPC) {
      return qcPC.trangThaiCD === "hoan_thanh";
    }

    return mayPCs.length > 0 && mayPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh");
  });



  function handleNhanHang(lc: any, pc: any) {
    capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "dang_lam" });
    toast.success(`💨 Nhận hàng ủi: ${lc.id} – ${pc.tenCongDoan}`);
  }

  function handleXong(lc: any, pc: any, bangChungURLs?: string[]) {
    // Bắt buộc khai báo đạt/lỗi theo màu + chặn số vượt khâu trước.
    const kiemTra = kiemTraTruocHoanThanh(lc, pc);
    if (!kiemTra.ok) {
      toast.error(kiemTra.loi!, { duration: 6000 });
      return;
    }
    const { slDat, slLoi } = kiemTra;

    const thanhTienDat = slDat * (pc.donGia || 0);

    capNhatCongDoan(lc.id, pc.id, {
      trangThaiCD: "hoan_thanh",
      soLuongHoanThanh: slDat,
      soLuongLoi: slLoi,
      bangChungURLs: bangChungURLs,
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
      toast.success(`✅ Xong: ${slDat} Đạt (Lỗi: ${slLoi})`);
    }
    setUploadModal(null);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Transparent Glassmorphism Header Card */}
      <div className="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-3xl p-5 mb-5 space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-slate-800 drop-shadow-sm">
            <Wind className="w-7 h-7 text-sky-600" /> Tổ Ủi – Việc của tôi
          </h1>
          <p className="text-sm font-bold text-slate-600 mt-1">{lcHT.length} lô đang cần Ủi phẳng</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Đang làm", value: lcHT.filter(lc => getHTPC(lc).some((pc: any) => pc.trangThaiCD === "dang_lam")).length, color: "text-amber-700" },
            { label: "Chờ nhận", value: lcHT.filter(lc => getHTPC(lc).some((pc: any) => !pc.trangThaiCD || pc.trangThaiCD === "cho_giao")).length, color: "text-slate-800" },
            { label: "Hoàn thành", value: lcHT.filter(lc => getHTPC(lc).every((pc: any) => pc.trangThaiCD === "hoan_thanh")).length, color: "text-emerald-700" },
            { label: "Có lỗi", value: lcHT.filter(lc => getHTPC(lc).some((pc: any) => pc.trangThaiCD === "co_loi")).length, color: "text-rose-700" },
          ].map(k => (
            <div key={k.label} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-4 shadow-sm transition hover:scale-[1.02]">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{k.label}</div>
              <div className={`text-2xl font-black mt-1 ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>
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
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-4 bg-teal-500 rounded-full"></span>
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Tiến độ chi tiết</span>
                  </div>
                  {htPCs.map((pc: any) => {
                    const tt = (pc.trangThaiCD as TrangThaiCongDoan | undefined) ?? "cho_giao";
                    const style = TRANG_THAI_CD_STYLE[tt];

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

                        <div className="flex flex-col sm:flex-row gap-2">
                          {tt === "cho_giao" && (
                            <button onClick={() => handleNhanHang(lc, pc)}
                              className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-sky-200">
                              <Package className="w-4 h-4" /> Nhận hàng
                            </button>
                          )}
                          {tt === "dang_lam" && (
                              <button onClick={() => setUploadModal({ lc, pc })}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-200">
                                <CheckCircle2 className="w-4 h-4" /> Hoàn thành & Chuyển Đóng Gói
                              </button>
                          )}
                          {tt === "hoan_thanh" && (
                            <div className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm flex flex-col justify-center gap-1">
                              <div className="flex items-center gap-2 font-bold text-emerald-700">
                                <CheckCircle2 className="w-4 h-4" /> Xong: {pc.soLuongHoanThanh ?? (pc.soLuong || lc.tongSL)} Đạt
                              </div>
                              {(pc.soLuongLoi > 0) && (
                                <div className="text-xs text-rose-600 font-semibold pl-6">
                                  ⚠️ Lỗi: {pc.soLuongLoi} SP
                                </div>
                              )}
                            </div>
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
          currentPCs={getHTPC(selectedMau.lc).filter((pc: any) => pc.trangThaiCD === "dang_lam")}
          onSave={(pcId, data) => { void handleSaveColorBatch([{ pcId, data }]); }}
          onSaveBatch={handleSaveColorBatch}
          historyStage="ui"
          onNextColor={(nextMau) => setSelectedMau(prev => prev ? { lc: prev.lc, mau: prev.lc.dsMau?.find(mau => mau.ten === nextMau.ten) || nextMau } : null)}
        />
      )}

      {/* Modal Upload Bằng chứng */}
      <UploadBangChungModal 
        open={!!uploadModal}
        onClose={() => setUploadModal(null)}
        onConfirm={(urls) => {
          if (uploadModal) handleXong(uploadModal.lc, uploadModal.pc, urls);
        }}
        existingUrls={uploadModal?.pc?.bangChungURLs}
      />
    </div>
  );
}
