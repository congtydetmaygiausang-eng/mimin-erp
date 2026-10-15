"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Printer, ArrowLeft } from "lucide-react";
import { formatVND } from "@/lib/data/real-data";

interface Props {
  ncc: any; // Thông tin nhà cung cấp sợi
  danhSachSoi: any[]; // Danh sách các loại sợi
  chungTu?: any[]; // Ảnh chứng từ đính kèm
  onClose: () => void;
  autoPrint?: boolean;
}

export default function PhieuNhapSoiPrint({ ncc, danhSachSoi, chungTu, onClose, autoPrint = false }: Props) {
  const [printing, setPrinting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => {
        window.print();
        setPrinting(true);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  const handlePrint = () => {
    window.print();
    setPrinting(true);
  };

  const fmtDate = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const fmtDateTime = (d: Date) => d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const tongKg = (danhSachSoi || []).reduce((sum, item) => sum + Math.max(item.soKg || 0, 0), 0);
  const tongTien = (danhSachSoi || []).reduce((sum, item) => sum + (Math.max(item.soKg || 0, 0) * Math.max(item.donGia || 0, 0)), 0);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #phieu-nhap-soi-print, #phieu-nhap-soi-print * { visibility: visible !important; }
          #phieu-nhap-soi-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Floating Close Button: Luôn luôn hiển thị ở góc trên cùng bên phải màn hình */}
      <button
        type="button"
        onClick={onClose}
        className="no-print fixed top-4 right-4 z-[10002] flex items-center gap-1.5 px-3 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xl transition hover:scale-105 active:scale-95"
        title="Đóng phiếu in (ESC)"
      >
        <X className="w-4 h-4" />
        <span>Đóng (ESC)</span>
      </button>

      <div
        className="fixed inset-0 z-[10000] flex flex-col bg-slate-900/85 backdrop-blur-md overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="flex flex-1 flex-col mx-auto w-full max-w-4xl bg-slate-100 shadow-2xl min-h-screen my-0 sm:my-4 sm:rounded-2xl overflow-hidden relative">
          {/* Sticky Toolbar */}
          <div className="no-print sticky top-0 flex items-center justify-between bg-slate-900 text-white px-5 py-3.5 shadow-md z-30 border-b border-slate-800">
            <div className="font-bold flex items-center gap-2 text-sm text-cyan-400">
              <Printer className="w-5 h-5" />
              <span>XEM TRƯỚC VÀ IN PHIẾU NHẬP SỢI</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs transition shadow-md active:scale-95"
              >
                <Printer className="w-4 h-4" />
                {printing ? "Đang mở hộp thoại in..." : "In phiếu ngay"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </button>
            </div>
          </div>

          {/* Preview content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
            <div id="phieu-nhap-soi-print" className="bg-white mx-auto shadow-lg text-slate-800 flex flex-col relative" style={{ maxWidth: "210mm", minHeight: "297mm", padding: "10mm 20mm" }}>
              {/* HEADER */}
              <div className="flex items-start justify-between border-b-2 border-cyan-600 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden">
                    <img src="/logo.png" alt="POLOMIMIN Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-cyan-700 tracking-tight">POLOMIMIN</div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      CÔNG TY TNHH DỆT MAY GIÀU SANG<br />
                      MST: 0318507560 · Hotline: 0774480916<br />
                      12/39 Xuân Thới Thượng 58C, Bà Điểm, HCM<br />
                      STK: 7777369369369 - MB Bank - CÔNG TY TNHH DỆT MAY GIÀU SANG
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-2xl font-black text-cyan-800 uppercase mb-1">PHIẾU NHẬP SỢI</h1>
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold">Ngày:</span> {fmtDate(new Date())}
                  </div>
                </div>
              </div>

              {/* SUPPLIER INFO */}
              <div className="mb-6 rounded-lg border border-slate-200 p-4 bg-slate-50 text-sm">
                <h2 className="font-bold text-slate-700 mb-2 uppercase text-xs">Thông tin Nhà cung cấp</h2>
                {ncc ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-500">Tên NCC:</span> <b>{ncc.ten_ncc}</b></div>
                    <div><span className="text-slate-500">Mã NCC:</span> <b>{ncc.ma_ncc}</b></div>
                    {ncc.dia_chi && <div className="col-span-2"><span className="text-slate-500">Địa chỉ:</span> {ncc.dia_chi}</div>}
                    {ncc.sdt && <div><span className="text-slate-500">Điện thoại:</span> {ncc.sdt}</div>}
                  </div>
                ) : (
                  <div className="text-slate-400 italic">Chưa xác định Nhà cung cấp</div>
                )}
              </div>

              {/* ITEMS LIST */}
              <div className="mb-6">
                <h2 className="font-bold text-slate-700 mb-2 uppercase text-xs">Chi tiết Nhập sợi</h2>
                <table className="w-full border-collapse border border-slate-300 text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 p-2 w-12">STT</th>
                      <th className="border border-slate-300 p-2 text-left">Loại sợi</th>
                      <th className="border border-slate-300 p-2 text-left">Mã lô</th>
                      <th className="border border-slate-300 p-2 text-right">Số thùng</th>
                      <th className="border border-slate-300 p-2 text-right">Kg/thùng</th>
                      <th className="border border-slate-300 p-2 text-right">Tổng kg</th>
                      <th className="border border-slate-300 p-2 text-right">Đơn giá/kg</th>
                      <th className="border border-slate-300 p-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {danhSachSoi.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="border border-slate-300 p-4 text-center text-slate-400 italic">Không có dữ liệu sợi</td>
                      </tr>
                    ) : (
                      danhSachSoi.map((soi, idx) => (
                        <tr key={soi.id}>
                          <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-300 p-2 font-semibold">{soi.loaiSoi}</td>
                          <td className="border border-slate-300 p-2 text-slate-600">{soi.maLoSoi}</td>
                          <td className="border border-slate-300 p-2 text-right text-slate-600">{soi.soThung ? soi.soThung.toLocaleString("vi-VN") : ""}</td>
                          <td className="border border-slate-300 p-2 text-right text-slate-600">{soi.kgMoiThung ? soi.kgMoiThung.toLocaleString("vi-VN") : ""}</td>
                          <td className="border border-slate-300 p-2 text-right font-semibold">{Math.max(soi.soKg, 0).toLocaleString("vi-VN")} kg</td>
                          <td className="border border-slate-300 p-2 text-right">{formatVND(Math.max(soi.donGia, 0))}</td>
                          <td className="border border-slate-300 p-2 text-right font-bold font-mono">{formatVND(Math.max(soi.soKg, 0) * Math.max(soi.donGia, 0))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={5} className="border border-slate-300 p-2 text-right">TỔNG CỘNG:</td>
                      <td className="border border-slate-300 p-2 text-right text-blue-700">{tongKg.toLocaleString("vi-VN")} kg</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2 text-right text-red-600 font-mono text-base">{formatVND(tongTien)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {chungTu && chungTu.length > 0 && (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/40 p-3">
                  <div className="text-xs font-bold text-blue-900 mb-2">Ảnh chứng từ / Biên bản đính kèm ({chungTu.length} ảnh):</div>
                  <div className="flex flex-wrap gap-2">
                    {chungTu.map((item, idx) => (
                      <div key={item.id || idx} className="h-16 w-16 rounded-lg border border-blue-300 overflow-hidden bg-white">
                        <img src={item.dataUrl} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto">
                {/* CHU KY */}
                <div className="grid grid-cols-3 gap-2 text-center text-sm pt-8">
                  <div>
                    <div className="font-bold mb-1">Đại diện Nhà Cung Cấp Sợi</div>
                    <div className="text-slate-500 italic text-[11px]">(Người giao - Ký, ghi rõ họ tên)</div>
                    <div className="mt-20">................................</div>
                  </div>
                  <div>
                    <div className="font-bold mb-1">Đại diện Xưởng Dệt</div>
                    <div className="text-slate-500 italic text-[11px]">(Người nhận - Ký, ghi rõ họ tên)</div>
                    <div className="mt-20">................................</div>
                  </div>
                  <div>
                    <div className="font-bold mb-1">Đại diện POLOMIMIN</div>
                    <div className="text-slate-500 italic text-[11px]">(Người duyệt - Ký, đóng dấu)</div>
                    <div className="mt-20 font-bold">HỒ MINH SANG</div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 italic">
                  In lúc: {fmtDateTime(new Date())} · Hệ thống quản lý ERP POLOMIMIN
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar: Luôn có nút đóng & in ngay khi người dùng cuộn xem hết phiếu */}
          <div className="no-print sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3.5 flex items-center justify-between z-20 shadow-lg">
            <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
              Mẹo: Bấm phím <b>ESC</b> hoặc nút "Quay lại" để trở về theo dõi quy trình
            </span>
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
              >
                ← Quay lại (ESC)
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs text-white transition shadow-md active:scale-95"
              >
                <Printer className="w-4 h-4" />
                In phiếu này
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
