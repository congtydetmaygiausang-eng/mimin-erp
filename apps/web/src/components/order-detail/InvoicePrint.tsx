"use client";

// ============================================
// InvoicePrint - In hoa don A4 cho POLOMIMIN
// Phase 3: format A4, header POLOMIMIN, bang SP, tong tien, chu ky
// 2026-08-06
// ============================================
//
// Usage:
//   const [print, setPrint] = useState(false);
//   <button onClick={() => setPrint(true)}>In hóa đơn</button>
//   {print && <InvoicePrint order={order} onClose={() => setPrint(false)} />}
//
// Khi mo: tu dong goi window.print() sau 500ms
// User in xong nhan ESC hoac Close de dong

import { useEffect, useState } from "react";
import { X, Printer, Download } from "lucide-react";
import { formatVND } from "@/lib/data/real-data";
import type { Order } from "./types";
import {
  PHUONG_THUC_THANH_TOAN_LABELS, PHUONG_THUC_VAN_CHUYEN_LABELS, LOAI_DON_HANG_LABELS,
  NGAN_HANG_OPTIONS,
} from "./types";
import { calcOrderTotal, calcPaidTotal } from "./helpers";

interface Props {
  order: Order;
  onClose: () => void;
  /** Auto print khi mo (default true) */
  autoPrint?: boolean;
}

export default function InvoicePrint({ order, onClose, autoPrint = true }: Props) {
  const [printing, setPrinting] = useState(false);

  // Auto print
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

  // Build days
  const ngayDat = order.ngayDat ? new Date(order.ngayDat) : new Date();
  const ngayGiao = order.ngayGiao ? new Date(order.ngayGiao) : new Date();
  const fmtDate = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const fmtDateTime = (d: Date) => d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const tongTien = calcOrderTotal(order.items);
  const phiVC = order.shipping?.phiVanChuyen || 0;
  const tongThanhToan = tongTien + phiVC;
  const daThanhToan = calcPaidTotal(order.payments);
  const conLai = tongThanhToan - daThanhToan;

  return (
    <>
      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        @page {
          size: A4;
          margin: 1.5cm 1.5cm 1.5cm 1.5cm;
        }
        #invoice-print {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1a1a1a;
          background: #fff;
        }
        #invoice-print .iv-title { font-size: 28px; font-weight: 800; color: #0f766e; }
        #invoice-print .iv-section { margin-bottom: 16px; }
        #invoice-print .iv-table { width: 100%; border-collapse: collapse; }
        #invoice-print .iv-table th { background: #0f766e; color: #fff; padding: 8px 6px; text-align: left; font-size: 12px; }
        #invoice-print .iv-table td { padding: 6px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
        #invoice-print .iv-table tr:nth-child(even) td { background: #f9fafb; }
        #invoice-print .iv-info-row { display: flex; gap: 16px; }
        #invoice-print .iv-info-block { flex: 1; }
      `}</style>

      {/* Modal overlay (no-print) */}
      <div className="no-print fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-5 py-3 flex items-center justify-between">
            <div className="font-bold flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Xem trước hóa đơn - {order.maDH}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                {printing ? "Đang in..." : "In ngay"}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/20"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
            <div id="invoice-print" className="bg-white mx-auto shadow-lg" style={{ maxWidth: "210mm", minHeight: "297mm", padding: "20mm" }}>
              {/* HEADER */}
              <div className="flex items-start justify-between border-b-2 border-cyan-600 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl">
                    P
                  </div>
                  <div>
                    <div className="iv-title">POLOMIMIN</div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      CÔNG TY TNHH DỆT MAY GIÀU SANG<br />
                      MST: 0318507560 · Hotline: 0774480916<br />
                      12/39 Xuân Thới Thượng 58C, Bà Điểm, HCM
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-cyan-700">HÓA ĐƠN BÁN HÀNG</div>
                  <div className="text-sm text-slate-500 mt-1">Số: <b className="text-slate-800">{order.maDH}</b></div>
                  <div className="text-xs text-slate-500 mt-0.5">Ngày: {fmtDate(ngayDat)}</div>
                  <div className="text-xs">
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${order.loaiDonHang === "ban-si" ? "bg-violet-100 text-violet-700" : order.loaiDonHang === "ban-san" ? "bg-amber-100 text-amber-700" : "bg-cyan-100 text-cyan-700"}`}>
                      {LOAI_DON_HANG_LABELS[order.loaiDonHang]}{order.kenhBan ? ` · ${order.kenhBan}` : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* KHACH HANG + NGAY GIAO */}
              <div className="iv-section iv-info-row">
                <div className="iv-info-block p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                  <div className="text-[10px] uppercase font-bold text-cyan-700 mb-1">Khách hàng</div>
                  <div className="font-bold text-base">{order.khachHang || "—"}</div>
                  {order.sdt && <div className="text-xs text-slate-600">SĐT: {order.sdt}</div>}
                  {order.shipping?.diaChiGiao && <div className="text-xs text-slate-600 mt-1">📍 {order.shipping.diaChiGiao}</div>}
                </div>
                <div className="iv-info-block p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-600 mb-1">Đơn hàng</div>
                  <div className="text-xs">Ngày đặt: <b>{fmtDate(ngayDat)}</b></div>
                  <div className="text-xs">Ngày giao DK: <b>{fmtDate(ngayGiao)}</b></div>
                  <div className="text-xs">Vận chuyển: <b>{PHUONG_THUC_VAN_CHUYEN_LABELS[order.shipping?.phuongThuc || "tu-giao"]}</b></div>
                  {order.shipping?.maVanDon && <div className="text-xs">Mã vận đơn: <code className="text-[10px] bg-white px-1">{order.shipping.maVanDon}</code></div>}
                </div>
              </div>

              {/* BANG SAN PHAM */}
              <div className="iv-section">
                <div className="text-[10px] uppercase font-bold text-slate-600 mb-1.5">Chi tiết sản phẩm</div>
                <table className="iv-table">
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}>STT</th>
                      <th>Sản phẩm</th>
                      <th>Phân loại</th>
                      <th style={{ width: 50, textAlign: "right" }}>SL</th>
                      <th style={{ width: 90, textAlign: "right" }}>Đơn giá</th>
                      <th style={{ width: 110, textAlign: "right" }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-slate-400 py-4">Chưa có sản phẩm</td></tr>
                    ) : (
                      order.items.map((item, i) => (
                        <tr key={item.id}>
                          <td>{i + 1}</td>
                          <td>
                            <div className="font-semibold">{item.spTen}</div>
                            {item.sku && <div className="text-[10px] text-slate-500 font-mono">{item.sku}</div>}
                          </td>
                          <td>
                            {item.mauTen && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded mr-1">🎨 {item.mauTen}</span>}
                            {item.size && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded">📏 {item.size}</span>}
                          </td>
                          <td style={{ textAlign: "right" }} className="font-semibold">{item.soLuong}</td>
                          <td style={{ textAlign: "right" }} className="font-mono">{formatVND(item.donGia)}</td>
                          <td style={{ textAlign: "right" }} className="font-bold font-mono">{formatVND(item.thanhTien)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* TONG TIEN + THANH TOAN */}
              <div className="iv-section flex gap-4">
                <div className="flex-1">
                  <div className="text-[10px] uppercase font-bold text-slate-600 mb-1.5">Thanh toán ({order.payments.length} lần)</div>
                  {order.payments.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">Chưa thanh toán</div>
                  ) : (
                    <table className="iv-table">
                      <thead>
                        <tr>
                          <th>Phương thức</th>
                          <th>Ngày</th>
                          <th>Chi tiết</th>
                          <th style={{ textAlign: "right" }}>Số tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.payments.map((p) => {
                          const nh = NGAN_HANG_OPTIONS.find((n) => n.code === p.nganHang);
                          return (
                            <tr key={p.id}>
                              <td className="text-[11px]">{PHUONG_THUC_THANH_TOAN_LABELS[p.phuongThuc]}</td>
                              <td className="text-[11px]">{p.ngayThanhToan}</td>
                              <td className="text-[10px]">
                                {p.nganHang && <span>🏦 {nh?.ten || p.nganHang} </span>}
                                {p.maGiaoDich && <code className="ml-1 bg-slate-100 px-1">{p.maGiaoDich}</code>}
                                {p.ghiChu && <div className="italic mt-0.5">{p.ghiChu}</div>}
                              </td>
                              <td style={{ textAlign: "right" }} className="font-bold font-mono">{formatVND(p.soTien)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                <div style={{ width: 220 }} className="text-sm">
                  <div className="text-[10px] uppercase font-bold text-slate-600 mb-1.5">Tổng cộng</div>
                  <div className="flex justify-between py-1 text-xs">
                    <span>Tổng SP:</span>
                    <span className="font-mono">{formatVND(tongTien)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-xs">
                    <span>Phí VC:</span>
                    <span className="font-mono">{formatVND(phiVC)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-slate-300 font-bold text-base">
                    <span>TỔNG:</span>
                    <span className="font-mono text-cyan-700">{formatVND(tongThanhToan)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-xs text-emerald-600">
                    <span>Đã trả:</span>
                    <span className="font-mono">{formatVND(daThanhToan)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-xs font-bold text-amber-600">
                    <span>Còn lại:</span>
                    <span className="font-mono">{formatVND(conLai)}</span>
                  </div>
                </div>
              </div>

              {/* GHI CHU */}
              {order.ghiChu && (
                <div className="iv-section text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-600 mb-1">Ghi chú:</div>
                  <div className="italic text-slate-700">{order.ghiChu}</div>
                </div>
              )}

              {/* CHU KY */}
              <div className="iv-section mt-12 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <div className="font-bold mb-1">Người mua hàng</div>
                  <div className="text-slate-500 italic text-[10px]">(Ký, ghi rõ họ tên)</div>
                  <div className="mt-12">{order.khachHang}</div>
                </div>
                <div>
                  <div className="font-bold mb-1">Người giao hàng</div>
                  <div className="text-slate-500 italic text-[10px]">(Ký, ghi rõ họ tên)</div>
                  <div className="mt-12">................................</div>
                </div>
                <div>
                  <div className="font-bold mb-1">Đại diện POLOMIMIN</div>
                  <div className="text-slate-500 italic text-[10px]">(Ký, đóng dấu)</div>
                  <div className="mt-12">HỒ MINH SANG</div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="iv-section mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 italic">
                Cảm ơn quý khách đã mua hàng tại POLOMIMIN!<br />
                Hotline: 0774480916 · Website: polomimin.shop · In lúc: {fmtDateTime(new Date())}
              </div>
            </div>
          </div>

          <div className="no-print bg-slate-100 px-5 py-3 text-xs text-slate-600 border-t flex items-center justify-between">
            <div>📄 Hóa đơn A4 · Dùng Print/ESC để in hoặc đóng</div>
            <button onClick={onClose} className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 font-semibold">Đóng</button>
          </div>
        </div>
      </div>
    </>
  );
}
