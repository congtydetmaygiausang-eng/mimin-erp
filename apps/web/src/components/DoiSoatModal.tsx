import { useState } from "react";
import { ResponsiveModal } from "./ui/ResponsiveModal";
import { LenhCat } from "@/lib/data/lenh-cat-store";
import { Scissors, CheckCircle2, Warehouse, AlertTriangle, Printer, Copy } from "lucide-react";
import { toast } from "sonner";
import { formatVNDShort } from "@/components/ui/utils";

type DoiSoatModalProps = {
  isOpen: boolean;
  onClose: () => void;
  lc: LenhCat | null;
  onGiaCong?: (lc: LenhCat, tongLoi: number, lydo: string) => void;
  onNhapKho?: (lc: LenhCat, tongDat: number) => void;
};

export function DoiSoatModal({ isOpen, onClose, lc, onGiaCong, onNhapKho }: DoiSoatModalProps) {
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
      <div className="p-4 sm:p-5 space-y-5 animate-fade-in text-slate-800">
        
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
            <button onClick={() => window.print()} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
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
                  <td className="px-4 py-3 font-bold text-slate-700">Tổ Cắt</td>
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
                      <td className="px-4 py-3 font-bold text-slate-700">{pc.tenCongDoan}</td>
                      <td className="px-4 py-3 text-slate-600">{pc.nguoiTen || "-"}</td>
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
    </ResponsiveModal>
  );
}
