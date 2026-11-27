"use client";

import React from "react";
import {
  Printer,
  Scissors,
  ClipboardCheck,
  X,
  FileSpreadsheet,
  PackageCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { LenhCat } from "@/lib/data/lenh-cat-store";
import { inPhieuLenhCatA4 } from "@/lib/phieu-lenh-cat-print";
import { inPhieuKiemDemA4 } from "@/lib/phieu-kiem-dem-print";

interface ChonPhieuInModalProps {
  open: boolean;
  onClose: () => void;
  lenhCat: Partial<LenhCat> | null;
}

export default function ChonPhieuInModal({
  open,
  onClose,
  lenhCat,
}: ChonPhieuInModalProps) {
  if (!open || !lenhCat) return null;

  const maSP = lenhCat.maSP || "SP";
  const tenSP = lenhCat.tenSP || "Sản phẩm";
  const idLenhCat = lenhCat.id || "Lệnh Cắt";
  const tongSL = lenhCat.tongSL || lenhCat.tongSLThucTe || 0;

  const handlePrintLenhCat = () => {
    inPhieuLenhCatA4(lenhCat);
    onClose();
  };

  const handlePrintKiemDem = () => {
    inPhieuKiemDemA4(lenhCat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Printer className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Chọn Loại Phiếu In A4
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  {idLenhCat}
                </span>
              </h3>
              <p className="text-xs text-slate-300 truncate max-w-xs mt-0.5">
                [{maSP}] {tenSP} &bull; {tongSL.toLocaleString("vi-VN")} SP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - 2 Lựa chọn in */}
        <div className="p-6 space-y-4 bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Vui lòng chọn mẫu phiếu cần in ra khổ A4:
          </p>

          <div className="grid grid-cols-1 gap-3.5">
            {/* Lựa chọn 1: Phiếu Lệnh Cắt Sản Xuất */}
            <div
              onClick={handlePrintLenhCat}
              className="group relative p-4 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-800 transition-all cursor-pointer shadow-xs hover:shadow-md flex items-start gap-4 active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-slate-900 text-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                <Scissors className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-slate-950 flex items-center gap-2">
                    Phiếu Lệnh Cắt Sản Xuất
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Tổ Cắt & Sơ Đồ
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  Bao gồm: Sơ đồ cắt giác mẫu (dài/khổ), định mức vải chính/phối, nguyên phụ liệu & thông số kỹ thuật rập.
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-xs font-bold text-slate-700 group-hover:text-slate-950">
                  <span className="underline decoration-slate-400 group-hover:decoration-slate-800">
                    Bấm để mở và in ngay &rarr;
                  </span>
                </div>
              </div>
            </div>

            {/* Lựa chọn 2: Phiếu Kiểm Đếm & Theo Dõi Giao Nhận (Mới) */}
            <div
              onClick={handlePrintKiemDem}
              className="group relative p-4 rounded-xl bg-blue-50/50 hover:bg-blue-50/90 border-2 border-blue-300 hover:border-blue-600 transition-all cursor-pointer shadow-xs hover:shadow-md flex items-start gap-4 active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-blue-700 text-blue-800 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-blue-950 flex items-center gap-2">
                    Phiếu Kiểm Đếm & Giao Nhận
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-blue-600 text-white tracking-wider">
                      Mới
                    </span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100/80 text-blue-800 border border-blue-200">
                    QC & Gia Công
                  </span>
                </div>
                <p className="text-xs text-blue-900/90 mt-1 line-clamp-2 leading-relaxed">
                  Bao gồm: Khối thông số kỹ thuật, ảnh mẫu TO RÕ NÉT, kiểm đếm chi tiết ÁO & QUẦN (set bộ), theo dõi tiến trình 8 khâu giao nhận, hàng sửa & nghiệm thu.
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-xs font-bold text-blue-800 group-hover:text-blue-950">
                  <span className="underline decoration-blue-400 group-hover:decoration-blue-700">
                    Bấm để mở và in ngay &rarr;
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-600">
            Khổ in: <strong className="text-slate-700">A4 Portrait</strong> &bull; Tương thích mọi trình duyệt
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
