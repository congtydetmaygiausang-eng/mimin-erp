"use client";

// ============ UI GIA CÔNG IN THÊU (/ui-intd) ============
// Trang dành riêng cho bộ phận In / Thêu
// Nhận bán thành phẩm từ Cắt, hoàn thành chuyển cho May

import { useStageColorInput } from "@/lib/use-stage-color-input";
import React, { useState } from "react";
import { Palette, CheckCircle2, Clock, AlertTriangle, Package } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, type TrangThaiCongDoan, type LenhCat } from "@/lib/data/lenh-cat-store";
import { kiemTraTruocHoanThanh } from "@/lib/data/cong-doan-helper";
import { LenhCatCardV2, ChiTietMauHistoryModal } from "@/components/ui";
import ImageLightbox from "@/components/ui/ImageLightbox";
import { UploadBangChungModal } from "@/components/modals/UploadBangChungModal";
import { useSession } from "@/components/session-provider";

const INTD_KEYS = ["in", "theu", "dap", "inAo", "theuAo", "in_theu", "in_theu_ao", "in_theu_quan"];

export default function UiInTheuPage() {
  const { selectedMau, setSelectedMau, handleSaveColorBatch } = useStageColorInput();
  const [uploadModal, setUploadModal] = useState<{ lc: any; pc: any } | null>(null);
  const { dsLenhCat, capNhatCongDoan, suaLenhCat } = useLenhCat();
  const { user } = useSession();
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  function getIntdPC(lc: any) {
    return lc.phanCong?.filter((pc: any) => {
      const isIntd = INTD_KEYS.some(k => pc.id === k || pc.tenCongDoan?.toLowerCase().includes("in") || pc.tenCongDoan?.toLowerCase().includes("thêu"));
      
      // Nếu là công nhân thì chỉ thấy việc của mình
      // Còn quản lý/tổ trưởng thì thấy hết (cả những việc chưa phân cho ai)

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



  function handleNhanHang(lc: any, pc: any) {
    capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "dang_lam" });
    toast.success(`🎨 Nhận hàng In/Thêu: ${lc.id} – ${pc.tenCongDoan}`);
  }

  function handleHoanThanh(lc: any, pc: any, bangChungURLs?: string[], chuKyUrl?: string) {
    // Evidence uploads may take time; finalize from the latest saved quantities.
    lc = dsLenhCat.find(item => item.id === lc.id) || lc;
    pc = lc.phanCong?.find((item: { id: string }) => item.id === pc.id) || pc;
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
      soLuongLoi: tongLoi,
      bangChungURLs: bangChungURLs,
      chuKy: chuKyUrl
    });
    toast.success(`✅ Chuyển tiếp thành công: ${tongDat} SP (Lỗi: ${tongLoi})`);
    setUploadModal(null);
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
                bangChungSlot={
                  (() => {
                    const completedPCs = intdPCs.filter((pc: any) => pc.bangChungURLs?.length > 0 || pc.chuKy);
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
                  {intdPCs.map((pc: any) => {
                    const tt = (pc.trangThaiCD as TrangThaiCongDoan) || "cho_giao";
                    const style = TRANG_THAI_CD_STYLE[tt] || TRANG_THAI_CD_STYLE["cho_giao"];

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
                        <div className="flex flex-col sm:flex-row gap-2">
                          {tt === "cho_giao" && (
                            <button onClick={() => handleNhanHang(lc, pc)}
                              className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-sm hover:bg-purple-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-purple-200">
                              <Package className="w-4 h-4" /> Nhận hàng In/Thêu
                            </button>
                          )}
                          {tt === "dang_lam" && (
                            <>
                              <button
                                onClick={() => setUploadModal({ lc, pc })}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-200"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Hoàn thành & Chuyển tiếp
                              </button>
                              <button onClick={() => capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "co_loi" })}
                                className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 font-bold text-sm transition-colors shadow-sm">
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {tt === "hoan_thanh" && (
                            <div className="flex-1 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              Xong {pc.soLuongHoanThanh ?? pc.soLuong ?? lc.tongSL} SP
                              {pc.soLuongLoi > 0 && <span className="text-rose-500 text-xs ml-2">({pc.soLuongLoi} lỗi)</span>}
                            </div>
                          )}
                          {tt === "co_loi" && (
                            <button onClick={() => handleNhanHang(lc, pc)}
                              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-amber-200">
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
          onSave={(pcId, data) => { void handleSaveColorBatch([{ pcId, data }]); }}
          onSaveBatch={handleSaveColorBatch}
          historyStage="in_theu"
          onNextColor={(nextMau) => setSelectedMau(prev => prev ? { lc: prev.lc, mau: prev.lc.dsMau?.find(mau => mau.ten === nextMau.ten) || nextMau } : null)}
        />
      )}

      {/* Modal Upload Bằng chứng */}
      <UploadBangChungModal 
        open={!!uploadModal}
        onClose={() => setUploadModal(null)}
        onConfirm={(urls, chuKyUrl) => {
          if (uploadModal) handleHoanThanh(uploadModal.lc, uploadModal.pc, urls, chuKyUrl);
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
