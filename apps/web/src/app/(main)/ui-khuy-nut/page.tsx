"use client";

import { LOCAL_ACCOUNT_MODE } from "@/lib/local-account-mode";
import { localActiveAccount } from "@/lib/local-account-store";
import { canAccessStage } from "@/lib/account-access";
import { can } from "@/lib/permissions";


// ============ UI KHUY NÚT (/ui-khuy-nut) ============
// Nhận hàng từ QC đạt, Khuy nút, giao Ủi

import { useStageColorInput } from "@/lib/use-stage-color-input";
import { useState } from "react";
import { CheckCircle2, Circle, Package } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, type TrangThaiCongDoan, type LenhCat } from "@/lib/data/lenh-cat-store";
import { kiemTraTruocHoanThanh } from "@/lib/data/cong-doan-helper";
import { LenhCatCardV2, ChiTietMauHistoryModal } from "@/components/ui";
import ImageLightbox from "@/components/ui/ImageLightbox";
import { UploadBangChungModal } from "@/components/modals/UploadBangChungModal";
import { useSession } from "@/components/session-provider";
import React from "react";

export default function UiKhuyNutPage() {
  const { selectedMau, setSelectedMau, handleSaveColorBatch } = useStageColorInput();
  const [uploadModal, setUploadModal] = useState<{ lc: any; pc: any } | null>(null);
  const [editingPC, setEditingPC] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const { dsLenhCat, capNhatCongDoan, suaLenhCat } = useLenhCat();

  const { user } = useSession();

  function getHTPC(lc: any) {
    return lc.phanCong?.filter((pc: any) => {
      const isHT = pc.id === "khuy_nut" || pc.tenCongDoan?.toLowerCase().includes("khuy nút");
      
      // Nếu là công nhân thì chỉ thấy việc của mình
      // Quản lý/tổ trưởng thấy tất cả
      
      if (LOCAL_ACCOUNT_MODE) return isHT && canAccessStage(localActiveAccount(), pc, "view", can);
      if (user?.laCongNhan) {
        const isMyTask = pc.nguoiMa === user.id || pc.nguoiMa === user.maNV || pc.nguoiTen?.includes(user.name);
        return isHT && isMyTask;
      }
      return isHT;
    }) || [];
  }

  // LC chờ Khuy Nút: công đoạn May ĐÃ XONG (QC đã duyệt = hoan_thanh)
  const lcHT = dsLenhCat.filter(lc => {
    // 1. Phải có công đoạn Khuy nút của TÔI
    const htPCs = getHTPC(lc);
    if (htPCs.length === 0) return false;

    // 2. Công đoạn May phải là hoan_thanh (Tức là QC đã duyệt)
    const mayPCs = lc.phanCong?.filter((pc: any) =>
      pc.tenCongDoan?.toLowerCase().includes("may")
    ) || [];

    const qcPC = lc.phanCong?.find((pc: any) => pc.id === "qc");
    
    if (qcPC) {
      return qcPC.trangThaiCD === "hoan_thanh";
    }

    return mayPCs.length > 0 && mayPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh");
  });



  function handleNhanHang(lc: any, pc: any) {
    capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "dang_lam" });
    toast.success(`🔘 Nhận hàng hoàn thiện: ${lc.id} – ${pc.tenCongDoan}`);
  }

  function handleXong(lc: any, pc: any, bangChungURLs?: string[], chuKyUrl?: string) {
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
      chuKy: chuKyUrl,
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
            <Circle className="w-7 h-7 text-indigo-600" /> Khuy Nút – Việc của tôi
          </h1>
          <p className="text-sm font-bold text-slate-600 mt-1">{lcHT.length} lô đang cần đóng khuy nút</p>
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
          <Circle className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <div className="font-bold">Không có việc Khuy Nút nào</div>
          <div className="text-sm mt-1">Khi Tổ QC duyệt đơn có Khuy Nút sẽ xuất hiện ở đây</div>
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
                bangChungSlot={
                  (() => {
                    const completedPCs = htPCs.filter((pc: any) => pc.bangChungURLs?.length > 0 || pc.chuKy);
                    if (completedPCs.length === 0) return null;
                    return (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                          <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Bằng chứng & Chữ ký ({completedPCs.length})</span>
                        </div>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-5">
                          {completedPCs.map((pc: any, idx: number) => {
                             return (
                               <React.Fragment key={idx}>
                                 {pc.bangChungURLs?.map((url: string, i: number) => (
                                    <div key={`img-${idx}-${i}`} className="flex flex-col w-[150px] sm:w-[140px] group cursor-pointer" onClick={() => setZoomImage(url)}>
                                      <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 group-hover:border-sky-300 group-hover:shadow-md transition-all duration-300 bg-white relative">
                                        <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-3.5 py-1 rounded-full shadow-sm font-black text-slate-800 text-[10px] border border-white whitespace-nowrap z-20 transition-all group-hover:-translate-y-1 group-hover:shadow-md">
                                          Ảnh {pc.tenCongDoan}
                                        </div>
                                      </div>
                                    </div>
                                 ))}
                                 {pc.chuKy && (
                                    <div key={`chuKy-${idx}`} className="flex flex-col w-[150px] sm:w-[140px] group cursor-pointer" onClick={() => setZoomImage(pc.chuKy)}>
                                      <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 border-dashed group-hover:border-sky-300 group-hover:shadow-md transition-all duration-300 bg-slate-50 relative p-4 flex flex-col items-center justify-center">
                                        <img src={pc.chuKy} className="w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-3.5 py-1 rounded-full shadow-sm font-black text-slate-800 text-[10px] border border-white whitespace-nowrap z-20 transition-all group-hover:-translate-y-1 group-hover:shadow-md">
                                          Chữ ký ({pc.nguoiTen || pc.nguoiMa})
                                        </div>
                                      </div>
                                    </div>
                                 )}
                               </React.Fragment>
                             )
                          })}
                        </div>
                      </div>
                    );
                  })()
                }
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1.5 h-4 bg-teal-500 rounded-full"></span>
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Tiến độ chi tiết</span>
                  </div>
                  {htPCs.map((pc: any) => {
                    const tt = (pc.trangThaiCD as TrangThaiCongDoan) || "cho_giao";
                    const style = TRANG_THAI_CD_STYLE[tt] || TRANG_THAI_CD_STYLE["cho_giao"];

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
                          {tt === "dang_lam" && (() => {
                            const isEditing = editingPC === pc.id || pc.bangChungURLs?.length > 0 || pc.chuKy;
                            return (
                              <div className="flex-1 flex flex-col gap-2">
                                {isEditing && (
                                  <div className="flex items-center justify-center gap-2 py-2 px-3 bg-amber-50/80 border border-amber-200/60 rounded-lg text-amber-700 text-[12px] font-medium shadow-sm transition-all duration-300">
                                    <span className="relative flex h-2 w-2 shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    <span>Chế độ sửa số lượng: Vui lòng bấm vào <strong>Màu Áo</strong> ở trên để cập nhật.</span>
                                  </div>
                                )}
                                <button 
                                  onClick={() => {
                                    if (isEditing) {
                                      setEditingPC(null);
                                      handleXong(lc, pc, pc.bangChungURLs, pc.chuKy);
                                    } else {
                                      setUploadModal({ lc, pc });
                                    }
                                  }}
                                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5 shadow-sm ${isEditing ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"}`}
                                >
                                  <CheckCircle2 className="w-4 h-4" /> 
                                  {isEditing ? "Lưu SL đã sửa & Đóng lại" : "Hoàn thành & Chuyển Ủi"}
                                </button>
                              </div>
                            );
                          })()}
                          {tt === "hoan_thanh" && (() => {
                            const pcIdx = lc.phanCong?.findIndex((p: any) => p.id === pc.id);
                            const nextStage = pcIdx !== -1 ? lc.phanCong?.[pcIdx + 1] : undefined;
                            const nextStageNotStarted = !nextStage || !nextStage.trangThaiCD || nextStage.trangThaiCD === "cho_giao";

                            return (
                              <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm flex items-center justify-between gap-2">
                                <div className="flex flex-col justify-center gap-1">
                                  <div className="flex items-center gap-2 font-bold text-emerald-700">
                                    <CheckCircle2 className="w-4 h-4" /> Xong: {pc.soLuongHoanThanh ?? (pc.soLuong || lc.tongSL)} Đạt
                                  </div>
                                  {(pc.soLuongLoi > 0) && (
                                    <div className="text-xs text-rose-600 font-semibold pl-6">
                                      ⚠️ Lỗi: {pc.soLuongLoi} SP
                                    </div>
                                  )}
                                </div>
                                {nextStageNotStarted && (
                                  <button 
                                    onClick={() => {
                                      setEditingPC(pc.id);
                                      capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "dang_lam" });
                                      toast.info("Đã mở lại khâu Khuy nút. Vui lòng bấm vào từng màu ở trên để sửa số lượng, sau đó bấm Hoàn thành lại.");
                                    }}
                                    className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 font-bold rounded-lg shadow-sm hover:bg-emerald-100 active:scale-95 transition-all text-[11px] whitespace-nowrap flex items-center gap-1"
                                  >
                                    ✏️ Sửa SL
                                  </button>
                                )}
                              </div>
                            );
                          })()}
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
          historyStage="khuy_nut"
          onNextColor={(nextMau) => setSelectedMau(prev => prev ? { lc: prev.lc, mau: prev.lc.dsMau?.find(mau => mau.ten === nextMau.ten) || nextMau } : null)}
        />
      )}

      {/* Modal Upload Bằng chứng */}
      <UploadBangChungModal 
        open={!!uploadModal}
        onClose={() => setUploadModal(null)}
        onConfirm={(urls, chuKyUrl) => {
          if (uploadModal) handleXong(uploadModal.lc, uploadModal.pc, urls, chuKyUrl);
        }}
        existingUrls={uploadModal?.pc?.bangChungURLs}
        existingChuKy={uploadModal?.pc?.chuKy}
      />

      {/* Lightbox for Evidence Images */}
      {zoomImage && (
        <ImageLightbox src={zoomImage} onClose={() => setZoomImage(null)} />
      )}
    </div>
  );
}
