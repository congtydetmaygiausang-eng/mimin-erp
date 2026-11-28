"use client";

import { useEffect, useState } from "react";
import { X, Printer, Truck, MapPin, Phone, User, Calendar, CheckCircle2, Package } from "lucide-react";
import type { Order } from "./types";
import { PHUONG_THUC_VAN_CHUYEN_LABELS, LOAI_DON_HANG_LABELS } from "./types";
import { formatVND } from "@/lib/data/real-data";
import { calcTongTien } from "@/lib/data/don-hang-store";

interface Props {
  order: Order;
  onClose: () => void;
  autoPrint?: boolean;
}

export default function DeliveryNotePrint({ order, onClose, autoPrint = false }: Props) {
  const [printing, setPrinting] = useState(false);

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

  const ngayDat = order.ngayDat ? new Date(order.ngayDat) : new Date();
  const ngayGiao = order.ngayGiao ? new Date(order.ngayGiao) : new Date();
  const fmtDate = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const fmtDateTime = (d: Date) => d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const tongSL = (order.items || []).reduce((sum, item) => sum + (item.soLuong || 0), 0) || order.soLuong || 0;
  const tongTien = calcTongTien(order);
  const pthucVC = order.shipping?.phuongThuc 
    ? (PHUONG_THUC_VAN_CHUYEN_LABELS[order.shipping.phuongThuc] || order.shipping.phuongThuc)
    : "Tự giao (POLOMIMIN giao)";

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #delivery-note-print, #delivery-note-print * { visibility: visible !important; }
          #delivery-note-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 8mm 12mm !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
      `}</style>

      <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-sky-600 to-teal-600 text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
            <div className="font-bold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-black leading-tight">Phiếu Giao Hàng & Biên Bản Bàn Giao</div>
                <div className="text-xs text-sky-100 font-mono mt-0.5">Đơn hàng: {order.maDH || order.id}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                {printing ? "Đang in..." : "In phiếu giao"}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Paper Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
            <div
              id="delivery-note-print"
              className="bg-white text-slate-800 shadow-xl border border-slate-200 rounded-xl"
              style={{ width: "210mm", minHeight: "285mm", padding: "12mm 16mm", boxSizing: "border-box" }}
            >
              {/* BRAND HEADER */}
              <div className="flex items-start justify-between border-b-2 border-sky-600 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden bg-slate-100 border border-slate-200">
                    <img src="/logo.png" alt="POLOMIMIN Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-sky-700 tracking-tight">CÔNG TY TNHH DỆT MAY GIÀU SANG</div>
                    <div className="text-xs font-bold text-slate-600">THƯƠNG HIỆU THỜI TRANG POLOMIMIN</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      📍 12/39 Xuân Thới Thượng 58C, Hóc Môn, TP. Hồ Chí Minh · 📞 Hotline: 0774480916
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-sky-800 tracking-tight uppercase">PHIẾU GIAO HÀNG</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-bold">KIÊM BIÊN BẢN BÀN GIAO</div>
                  <div className="text-xs font-mono text-sky-700 font-bold mt-1">Mã ĐH: {order.maDH || order.id}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Ngày lập: {fmtDate(new Date())}</div>
                </div>
              </div>

              {/* THÔNG TIN VẬN CHUYỂN & KHÁCH HÀNG */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-100 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-sky-800 flex items-center gap-1.5 pb-1 border-b border-sky-200/60">
                    <User className="w-3.5 h-3.5 text-sky-600" /> Thông tin người nhận hàng
                  </div>
                  <div className="font-bold text-sm text-slate-900 pt-0.5">{order.khachHang || "Khách lẻ"}</div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold">{order.sdt || "—"}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="leading-tight">{order.shipping?.diaChiGiao || order.diaChi || "Giao tại xưởng / Chưa rõ địa chỉ"}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-slate-700 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <Truck className="w-3.5 h-3.5 text-slate-600" /> Phương thức điều phối & Vận chuyển
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Đơn vị vận chuyển:</span>
                    <span className="font-bold text-sky-800">{pthucVC}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Mã vận đơn (Tracking):</span>
                    <span className="font-mono font-bold text-slate-800">{order.shipping?.maVanDon || "Giao trực tiếp"}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Ngày hẹn giao:</span>
                    <span className="font-semibold text-slate-800">{fmtDate(ngayGiao)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Trạng thái:</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" /> {order.trangThai === "Đã giao" ? "Đã giao hàng" : "Xuất kho giao"}
                    </span>
                  </div>
                </div>
              </div>

              {/* BẢNG CHI TIẾT SẢN PHẨM BÀN GIAO */}
              <div className="mb-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-sky-600" /> Bảng chi tiết sản phẩm bàn giao ({tongSL.toLocaleString()} SP)
                  </span>
                  <span className="text-[11px] font-normal text-slate-500 italic">Vui lòng kiểm đếm kỹ trước khi ký nhận</span>
                </div>
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-sky-700 text-white text-left font-bold">
                      <th className="p-2 border border-sky-800 text-center w-10">STT</th>
                      <th className="p-2 border border-sky-800">Tên sản phẩm & Mã SKU</th>
                      <th className="p-2 border border-sky-800 text-center w-24">Màu sắc</th>
                      <th className="p-2 border border-sky-800 text-center w-20">Size</th>
                      <th className="p-2 border border-sky-800 text-right w-24">Số lượng</th>
                      <th className="p-2 border border-sky-800 text-center w-28">Xác nhận nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items && order.items.length > 0) ? (
                      order.items.map((item, idx) => (
                        <tr key={item.id || idx} className="border-b border-slate-200 even:bg-slate-50">
                          <td className="p-2 text-center border-r border-slate-200 font-mono text-slate-600">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200">
                            <div className="font-bold text-slate-800">{item.spTen || item.spId}</div>
                            {item.sku && <div className="text-[10px] text-slate-500 font-mono mt-0.5">SKU: {item.sku}</div>}
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 font-medium text-slate-700">{item.mauTen || "—"}</td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-sky-800">{item.size || "—"}</td>
                          <td className="p-2 text-right border-r border-slate-200 font-mono font-bold text-slate-900">{item.soLuong?.toLocaleString()}</td>
                          <td className="p-2 text-center text-slate-400 font-mono text-[11px]">Đủ [  ]</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b border-slate-200">
                        <td className="p-2 text-center border-r border-slate-200 font-mono">1</td>
                        <td className="p-2 border-r border-slate-200 font-bold">{order.sanPham || "Hàng may mặc theo đơn"}</td>
                        <td className="p-2 text-center border-r border-slate-200">—</td>
                        <td className="p-2 text-center border-r border-slate-200">—</td>
                        <td className="p-2 text-right border-r border-slate-200 font-mono font-bold">{tongSL.toLocaleString()}</td>
                        <td className="p-2 text-center text-slate-400 font-mono text-[11px]">Đủ [  ]</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-sky-50 font-bold border-t-2 border-sky-600">
                      <td colSpan={4} className="p-2 text-right uppercase text-sky-900 border-r border-slate-300">
                        Tổng số lượng sản phẩm giao:
                      </td>
                      <td className="p-2 text-right font-mono text-sm text-sky-900 border-r border-slate-300">
                        {tongSL.toLocaleString()} SP
                      </td>
                      <td className="p-2 text-center text-sky-900 text-[11px]">
                        Nguyên kiện
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* GHI CHÚ GIAO NHẬN */}
              <div className="p-2.5 rounded-xl border border-dashed border-slate-300 text-xs text-slate-600 mb-6 bg-slate-50/50">
                <div className="font-bold text-slate-800 mb-1">Ghi chú vận chuyển & Bảo quản:</div>
                <div className="italic">
                  {order.shipping?.ghiChu || order.ghiChu || "Hàng may mặc đóng gói nguyên seal, tránh ẩm ướt. Khách hàng vui lòng đồng kiểm số lượng và ngoại quan trước khi ký nhận."}
                </div>
              </div>

              {/* 3 CHỮ KÝ BÀN GIAO */}
              <div className="grid grid-cols-3 gap-4 text-center text-xs mt-8 pt-4 border-t border-slate-200">
                <div>
                  <div className="font-bold uppercase text-slate-800">Thủ kho / Người lập</div>
                  <div className="text-[10px] text-slate-500 italic mt-0.5">(Ký, ghi rõ họ tên)</div>
                  <div className="mt-16 font-semibold text-slate-700">Bùi Thị Thanh</div>
                </div>

                <div>
                  <div className="font-bold uppercase text-slate-800">Nhân viên giao hàng</div>
                  <div className="text-[10px] text-slate-500 italic mt-0.5">(Ký, ghi rõ họ tên)</div>
                  <div className="mt-16 font-semibold text-slate-700">..................................</div>
                </div>

                <div>
                  <div className="font-bold uppercase text-slate-800">Người nhận hàng</div>
                  <div className="text-[10px] text-slate-500 italic mt-0.5">(Ký xác nhận nhận đủ hàng)</div>
                  <div className="mt-16 font-bold text-slate-900">{order.khachHang || ".................................."}</div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="mt-12 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 italic">
                Phiếu giao hàng kiêm biên bản bàn giao điện tử hệ thống MIMIN ERP · In lúc {fmtDateTime(new Date())}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="bg-slate-100 dark:bg-slate-800 px-5 py-3 text-xs text-slate-600 dark:text-slate-300 border-t flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Khổ giấy A4 Dọc tiêu chuẩn · Đã căn lề chuẩn 1 trang in</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-bold transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
