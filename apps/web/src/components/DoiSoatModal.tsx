import { useState } from "react";
import { ResponsiveModal } from "./ui/ResponsiveModal";
import { LenhCat } from "@/lib/data/lenh-cat-store";
import { Scissors, CheckCircle2, Warehouse, AlertTriangle, Printer, Copy, BellRing } from "lucide-react";
import { toast } from "sonner";
import { formatVNDShort } from "@/components/ui/utils";
import { supabase } from "@/lib/supabase/client";

type DoiSoatModalProps = {
  isOpen: boolean;
  onClose: () => void;
  lc: LenhCat | null;
  onGiaCong?: (lc: LenhCat, tongLoi: number, lydo: string) => void;
  onNhapKho?: (lc: LenhCat, tongDat: number) => void;
};

export function DoiSoatModal({ isOpen, onClose, lc, onGiaCong, onNhapKho }: DoiSoatModalProps) {
  const [printStageId, setPrintStageId] = useState<string>("ALL");

  const handlePrint = (stageId: string) => {
    setPrintStageId(stageId);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePushNotification = async (pc: any) => {
    if (!pc.nguoiTen || !pc.userId) {
      toast.error("Chưa có thông tin User ID để gửi thông báo!");
      return;
    }
    
    const toastId = toast.loading(`Đang gửi thông báo đến ${pc.nguoiTen}...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-push', { 
        body: { 
          type: "NEW_TASK",
          record: { 
            nguoiPhuTrach: pc.nguoiTen,
            congDoan: pc.tenCongDoan,
            lenhCatId: lc?.id || "N/A"
          } 
        } 
      });

      if (error) throw error;
      if (data?.status === 'ignored') {
        throw new Error(data.reason === 'no_subscription' ? "Xưởng chưa đăng ký nhận thông báo" : "Dữ liệu không hợp lệ");
      }
      
      toast.success(`Đã báo (Ring!) sang máy của ${pc.nguoiTen}`, { id: toastId });
    } catch (error: any) {
      toast.error(`Chưa gửi được: ${error.message || "Lỗi không xác định"}`, { id: toastId });
    }
  };

  if (!lc) return null;

  // Tính toán số lượng của Tổ Cắt (Khởi nguồn)
  const catThucTe = lc.tongSLThucTe ?? lc.tongSL;
  let tongDat = catThucTe;
  let tongLoi = 0;
  let dsLoi: string[] = [];

  // Lọc ra các công đoạn gia công và hoàn thiện
  const phanCongList = lc.phanCong || [];

  return (
    <ResponsiveModal open={isOpen} onClose={onClose} title={`Đối Soát Tổng Hợp: ${lc.id}`}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .vaul-drawer { display: none !important; }
        }
      `}</style>
      <div className="p-4 sm:p-5 space-y-5 animate-fade-in text-slate-800 print:hidden">
        {/* Tiêu đề & Thông tin cơ bản */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800">{lc.tenSP} ({lc.maSP})</h3>
            <p className="text-sm font-semibold text-slate-500 mt-1">SL Cắt thực tế: <span className="text-sky-600 font-bold">{catThucTe.toLocaleString()}</span> SP</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => toast.success("Đã copy dữ liệu đối soát!")} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => handlePrint("ALL")} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bảng phân tích chi tiết */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase font-bold tracking-wide border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Khâu (Phiếu)</th>
                  <th className="px-4 py-3">Người/Xưởng TH</th>
                  <th className="px-4 py-3 text-right">SL Giao</th>
                  <th className="px-4 py-3 text-right">SL Đạt</th>
                  <th className="px-4 py-3 text-right">SL Lỗi</th>
                  <th className="px-4 py-3">Ghi chú Lỗi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-700 flex items-center justify-between group">
                    <span>Tổ Cắt</span>
                    <button onClick={() => handlePrint("cat")} className="p-1 text-slate-400 hover:text-sky-600 rounded transition opacity-0 group-hover:opacity-100" title="In phiếu Tổ Cắt">
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-600">Nội bộ</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">{lc.tongSL.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">{catThucTe.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">-</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">-</td>
                </tr>
                {phanCongList.map((pc, idx) => {
                  const slGiao = pc.soLuong || catThucTe || lc.tongSL || 0;
                  const slDat = pc.soLuongHoanThanh ?? (pc.trangThaiCD === "hoan_thanh" ? slGiao : 0);
                  const slLoi = pc.soLuongLoi ?? 0;
                  
                  if (slDat > 0 && pc.trangThaiCD === "hoan_thanh") tongDat = Math.min(tongDat, slDat);
                  if (slLoi > 0) {
                    tongLoi += slLoi;
                    dsLoi.push(`${pc.tenCongDoan}: ${slLoi} lỗi (${pc.lyDoLoi || "Không có lý do"})`);
                  }

                  return (
                    <tr key={pc.id || idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-700 flex items-center justify-between group">
                        <span>{pc.tenCongDoan}</span>
                        <button onClick={() => handlePrint(pc.id)} className="p-1 text-slate-400 hover:text-sky-600 rounded transition opacity-0 group-hover:opacity-100" title={`In phiếu ${pc.tenCongDoan}`}>
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-600 flex items-center justify-between group/notify">
                        <span className="truncate pr-2">{pc.nguoiTen || "-"}</span>
                        {pc.nguoiTen && (
                          <button 
                            onClick={() => handlePushNotification(pc)}
                            className="p-1 text-slate-400 hover:text-amber-500 rounded transition opacity-0 group-hover/notify:opacity-100 shrink-0"
                            title={`Nhắc việc ${pc.tenCongDoan} đến ${pc.nguoiTen}`}
                          >
                            <BellRing className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">{slGiao.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">{slDat > 0 ? slDat.toLocaleString() : "-"}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${slLoi > 0 ? "text-rose-600" : "text-slate-400"}`}>
                        {slLoi > 0 ? slLoi.toLocaleString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-rose-600 font-medium max-w-[150px] truncate" title={pc.lyDoLoi}>
                        {pc.lyDoLoi || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-rose-50/50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 font-black text-slate-800 text-right uppercase">Tổng Lỗi Lũy Kế:</td>
                  <td className="px-4 py-3 text-right font-mono font-black text-rose-600 text-lg" colSpan={2}>
                    {tongLoi.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-rose-700 font-medium">Báo Gia Công Lỗi</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Nút Hành động */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => {
              if (onNhapKho) onNhapKho(lc, tongDat);
              onClose();
            }}
            disabled={tongDat <= 0 || phanCongList.some(pc => pc.tenCongDoan !== "Nhập kho" && pc.trangThaiCD !== "hoan_thanh")}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black hover:from-emerald-600 hover:to-teal-600 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <Warehouse className="w-5 h-5" />
            Nhập {tongDat.toLocaleString()} SP Kho TP
          </button>
          
          <button
            onClick={() => {
              if (onGiaCong) onGiaCong(lc, tongLoi, dsLoi.join(" | "));
              onClose();
            }}
            disabled={tongLoi <= 0}
            className="w-full py-3.5 rounded-xl bg-rose-100 text-rose-700 font-black flex items-center justify-center gap-2 shadow-sm border border-rose-200 transition-all hover:bg-rose-200 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
          >
            <AlertTriangle className="w-5 h-5" />
            Bàn giao Gia công lỗi ({tongLoi})
          </button>
        </div>
      </div>

      {/* === GIAO DIỆN IN (Chỉ hiển thị khi in) === */}
      <div id="print-area" className="hidden print:block p-0 print:p-4 text-black bg-white w-full" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <style type="text/css">
          {`
            @media print {
              @page {
                size: landscape;
                margin: 10mm;
              }
              body > *:not(.print-modal-root) {
                display: none !important;
              }
              html, body {
                height: max-content;
                width: 100%;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                background: white !important;
              }
            }
          `}
        </style>
        {printStageId === "ALL" ? (
          <>
            <div className="text-center mb-6 border-b-2 border-black pb-4">
              <h1 className="text-2xl font-black uppercase tracking-wider">Phiếu Đối Soát Lệnh Cắt</h1>
              <p className="text-base font-bold mt-1">Mã Lệnh Cắt: {lc.id}</p>
              <p className="text-sm mt-1">Sản phẩm: {lc.tenSP} ({lc.maSP})</p>
              <p className="text-sm mt-1">Ngày in: {new Date().toLocaleDateString("vi-VN")} {new Date().toLocaleTimeString("vi-VN")}</p>
            </div>
            
            <div className="mb-4">
              <h2 className="font-bold text-lg border-b border-gray-300 pb-2 mb-2">1. Thông tin Khởi nguồn</h2>
              <div className="flex justify-between px-4">
                <p>SL Cắt dự kiến: <strong className="font-mono">{lc.tongSL}</strong></p>
                <p>SL Cắt thực tế: <strong className="text-lg font-mono">{catThucTe}</strong></p>
              </div>
            </div>

            <h2 className="font-bold text-lg border-b border-gray-300 pb-2 mb-2 mt-6">2. Chi tiết các khâu sản xuất</h2>
            <table className="w-full text-sm text-left border-collapse border border-black mt-2">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black px-3 py-2 text-center w-12">STT</th>
                  <th className="border border-black px-3 py-2 w-48">Khâu (Phiếu)</th>
                  <th className="border border-black px-3 py-2">Xưởng/Người nhận</th>
                  <th className="border border-black px-3 py-2 text-right w-24">SL Giao</th>
                  <th className="border border-black px-3 py-2 text-right w-24">SL Đạt</th>
                  <th className="border border-black px-3 py-2 text-right w-24">SL Lỗi</th>
                  <th className="border border-black px-3 py-2 w-48">Ghi chú / Chữ ký</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-3 py-3 text-center">1</td>
                  <td className="border border-black px-3 py-3 font-bold">Tổ Cắt</td>
                  <td className="border border-black px-3 py-3">Nội bộ</td>
                  <td className="border border-black px-3 py-3 text-right font-mono font-bold">{lc.tongSL}</td>
                  <td className="border border-black px-3 py-3 text-right font-mono font-bold">{catThucTe}</td>
                  <td className="border border-black px-3 py-3 text-right font-mono">-</td>
                  <td className="border border-black px-3 py-3 text-right"></td>
                </tr>
                {phanCongList.map((pc, idx) => {
                  const slGiao = pc.soLuong || catThucTe || lc.tongSL || 0;
                  const slDat = pc.soLuongHoanThanh ?? (pc.trangThaiCD === "hoan_thanh" ? slGiao : 0);
                  const slLoi = pc.soLuongLoi ?? 0;
                  return (
                    <tr key={pc.id} className="print:break-inside-avoid">
                      <td className="border border-black px-3 py-3 text-center">{idx + 2}</td>
                      <td className="border border-black px-3 py-3 font-bold">{pc.tenCongDoan}</td>
                      <td className="border border-black px-3 py-3">{pc.nguoiTen || "-"}</td>
                      <td className="border border-black px-3 py-3 text-right font-mono font-bold">{slGiao}</td>
                      <td className="border border-black px-3 py-3 text-right font-mono font-bold">{slDat > 0 ? slDat : "-"}</td>
                      <td className="border border-black px-3 py-3 text-right font-mono font-bold">{slLoi > 0 ? slLoi : "-"}</td>
                      <td className="border border-black px-3 py-3 text-xs italic">{pc.lyDoLoi || ""}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 font-bold">
                  <td colSpan={5} className="border border-black px-3 py-3 text-right uppercase">Tổng Lỗi Lũy Kế:</td>
                  <td colSpan={2} className="border border-black px-3 py-3 text-left font-mono text-lg">{tongLoi} SP</td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-16 flex justify-between px-16">
              <div className="text-center">
                <p className="font-bold text-base">Người lập phiếu</p>
                <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-base">Quản lý xưởng</p>
                <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
              </div>
            </div>
          </>
        ) : (
          (() => {
            const isCat = printStageId === "cat";
            const stage = isCat ? { tenCongDoan: "Tổ Cắt", nguoiTen: "Nội bộ", soLuong: lc.tongSL } : phanCongList.find(p => p.id === printStageId);
            const slGiao = stage?.soLuong || catThucTe || lc.tongSL || 0;
            
            return (
              <div className="w-full border-2 border-black p-4 sm:p-6 print:p-6 rounded-lg text-sm sm:text-base print:text-base print:h-[185mm] print:flex print:flex-col print:overflow-hidden">
                {/* Header: Company Info */}
                <div className="flex flex-col sm:flex-row print:flex-row items-center sm:items-start print:items-start justify-between border-b-2 border-black pb-4 print:pb-4 mb-6 print:mb-6 gap-4 print:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 print:gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 print:w-20 print:h-20 bg-gray-200 border-2 border-black flex items-center justify-center font-black text-lg sm:text-xl print:text-xl tracking-tighter shrink-0">
                      LOGO
                    </div>
                    <div>
                      <h2 className="text-base sm:text-xl print:text-xl font-black uppercase">Công ty TNHH Dệt may Giàu Sang</h2>
                      <p className="text-xs sm:text-sm font-semibold mt-1 print:mt-1">MST: 0318507560 · Hotline: 0774.480.916</p>
                      <p className="text-xs sm:text-sm">Đ/C: 12/39 Xuân Thới Thượng 58C, Hóc Môn, HCM</p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right print:text-right shrink-0">
                    <h1 className="text-xl sm:text-3xl print:text-2xl font-black uppercase tracking-widest text-gray-800">PHIẾU CÔNG ĐOẠN</h1>
                    <p className="font-mono text-sm sm:text-lg print:text-lg font-bold mt-2 print:mt-2 border border-black inline-block px-3 print:px-3 py-1 print:py-1 bg-gray-100">
                      Mã LC: {lc.id}
                    </p>
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="flex flex-col sm:flex-row print:flex-row justify-between gap-4 sm:gap-6 print:gap-6 mb-6 print:mb-6">
                  <div className="space-y-2 print:space-y-2 flex-1">
                    <p><span className="font-bold w-24 sm:w-28 print:w-28 inline-block">Sản phẩm:</span> {lc.tenSP} ({lc.maSP})</p>
                    <p><span className="font-bold w-24 sm:w-28 print:w-28 inline-block">Ngày giao:</span> {new Date().toLocaleDateString("vi-VN")}</p>
                  </div>
                  <div className="space-y-2 print:space-y-2 flex-1">
                    <p><span className="font-bold w-28 sm:w-32 print:w-32 inline-block">Công đoạn:</span> <span className="uppercase font-black text-base sm:text-lg print:text-lg underline decoration-2">{stage?.tenCongDoan || "Không xác định"}</span></p>
                    <p><span className="font-bold w-28 sm:w-32 print:w-32 inline-block">Xưởng nhận:</span> <span className="font-bold">{stage?.nguoiTen || "...................................."}</span></p>
                  </div>
                </div>

                {/* Main Table for the specific stage */}
                <div className="w-full mb-6 print:mb-6 overflow-hidden">
                  <table className="w-full text-left border-collapse border-2 border-black">
                    <thead>
                      <tr className="bg-gray-100 text-xs sm:text-base print:text-sm uppercase">
                        <th className="border border-black px-2 sm:px-4 py-2 sm:py-3 print:py-3">Nội dung</th>
                        <th className="border border-black px-2 sm:px-4 py-2 sm:py-3 print:py-3 text-center w-1/5">SL Giao</th>
                        <th className="border border-black px-2 sm:px-4 py-2 sm:py-3 print:py-3 text-center w-1/5">SL Đạt</th>
                        <th className="border border-black px-2 sm:px-4 py-2 sm:py-3 print:py-3 text-center w-1/5">SL Lỗi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black px-2 sm:px-4 py-4 sm:py-6 print:py-6 font-bold text-sm sm:text-lg print:text-lg">Giao việc: {stage?.tenCongDoan}</td>
                        <td className="border border-black px-2 sm:px-4 py-4 sm:py-6 print:py-6 text-center font-mono font-black text-lg sm:text-2xl print:text-2xl">{slGiao}</td>
                        <td className="border border-black px-2 sm:px-4 py-4 sm:py-6 print:py-6 text-center font-mono text-xl"></td>
                        <td className="border border-black px-2 sm:px-4 py-4 sm:py-6 print:py-6 text-center font-mono text-xl"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Notes & Defects area - FLEX GROW to fill empty space! */}
                <div className="border border-black p-3 sm:p-4 print:p-4 mb-6 print:mb-8 bg-gray-50 flex flex-col break-inside-avoid print:flex-1">
                  <span className="font-bold mb-4 print:mb-4 text-sm sm:text-base print:text-base">Ghi chú (Lý do lỗi/Yêu cầu đặc biệt):</span>
                  <div className="border-b border-dotted border-gray-400 mt-2 print:mt-4"></div>
                  <div className="border-b border-dotted border-gray-400 mt-6 print:mt-8"></div>
                  <div className="border-b border-dotted border-gray-400 mt-6 print:mt-8"></div>
                  <div className="border-b border-dotted border-gray-400 mt-6 print:mt-8 hidden print:block"></div>
                  <div className="border-b border-dotted border-gray-400 mt-6 print:mt-8 hidden print:block"></div>
                </div>

                {/* Signatures */}
                <div className="flex justify-between px-4 sm:px-10 print:px-12 break-inside-avoid">
                  <div className="text-center w-2/5">
                    <p className="font-black text-sm sm:text-lg print:text-lg">NGƯỜI GIAO VIỆC</p>
                    <p className="text-xs italic mt-1 print:text-xs">(Ký và ghi rõ họ tên)</p>
                    <div className="mt-16 sm:mt-20 print:mt-20 border-b border-dashed border-gray-400 w-full mx-auto"></div>
                  </div>
                  <div className="text-center w-2/5">
                    <p className="font-black text-sm sm:text-lg print:text-lg">NGƯỜI NHẬN VIỆC</p>
                    <p className="text-xs italic mt-1 print:text-xs">(Ký và ghi rõ họ tên)</p>
                    <div className="mt-16 sm:mt-20 print:mt-20 border-b border-dashed border-gray-400 w-full mx-auto"></div>
                  </div>
                </div>
                
                {/* Footer cutoff line */}
                <div className="mt-12 sm:mt-16 print:mt-12 text-center text-[10px] sm:text-xs text-gray-500 flex items-center gap-2 break-inside-avoid">
                  <div className="h-px bg-dashed border-t border-dashed border-gray-400 flex-1"></div>
                  <Scissors className="w-3 h-3 sm:w-4 sm:h-4 print:w-4 print:h-4" /> Liên 1: Lưu xưởng - Liên 2: Giao xưởng/người nhận
                  <div className="h-px bg-dashed border-t border-dashed border-gray-400 flex-1"></div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </ResponsiveModal>
  );
}
