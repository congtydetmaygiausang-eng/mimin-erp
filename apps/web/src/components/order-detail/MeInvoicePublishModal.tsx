"use client";

/**
 * MeInvoicePublishModal - Modal phat hanh Hoa don dien tu tu Don hang
 * 2026-08-09 - Mavis (for sep Sang)
 *
 * Flow:
 * 1. Load config MeInvoice + check da cau hinh chua
 * 2. Hien thi preview DH (items + total + buyer)
 * 3. User chon InvSeries (template) + ngay phat hanh
 * 4. Bam "Phat hanh" -> goi /api/meinvoice/invoice
 * 5. Hien thi ket qua (inv_no, transaction_id) + nut tai PDF / gui email
 */

import { useState, useEffect } from "react";
import {
  X, FileText, Loader2, CheckCircle2, AlertCircle, Download, Mail,
  ExternalLink, Settings
} from "lucide-react";
import { toast } from "sonner";
import { formatVND } from "@/lib/data/real-data";
import type { Order } from "./types";
import { calcOrderTotal, calcPaidTotal } from "./helpers";

interface Props {
  order: Order;
  onClose: () => void;
  onSuccess?: (hoaDon: any) => void;
  onOpenSettings?: () => void;
}

interface MeInvoiceConfig {
  app_id: string;
  tax_code: string;
  username: string;
  env: "test" | "live";
  default_template: string;
}

export default function MeInvoicePublishModal({
  order,
  onClose,
  onSuccess,
  onOpenSettings,
}: Props) {
  const [config, setConfig] = useState<MeInvoiceConfig | null>(null);
  const [invSeries, setInvSeries] = useState("1C25MMA");
  const [invDate, setInvDate] = useState(new Date().toISOString().split("T")[0]);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load config
  useEffect(() => {
    fetch("/api/meinvoice/config")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.config) {
          setConfig(j.config);
          if (j.config.default_template) setInvSeries(j.config.default_template);
        }
      })
      .catch((e) => console.error("load config:", e));
  }, []);

  // Build payload preview
  const buyer = order.shipping || {
    tenNguoiNhan: order.tenKH,
    sdtNguoiNhan: order.sdtNguoiNhan,
    emailNguoiNhan: order.emailNguoiNhan,
    diaChiGiao: order.diaChiGiao,
  };

  const tongTien = calcOrderTotal(order.items);
  const phiVC = order.shipping?.phiVanChuyen || 0;
  const tongThanhToan = tongTien + phiVC;
  const daThanhToan = calcPaidTotal(order.payments);
  const conLai = tongThanhToan - daThanhToan;

  // VAT mac dinh 8% (giam thue VAT 2025 theo NQ 110/2023/QH15)
  const vatRate = 8;
  const vatAmount = Math.round((tongThanhToan * vatRate) / 100);
  const totalWithVat = tongThanhToan + vatAmount;

  // ============ PUBLISH ============
  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const refId = `${order.maDH}-${Date.now()}`;
      const donHang = {
        id: order.maDH,
        maKH: order.maKH,
        tenKH: order.tenKH,
        sdtKH: order.sdtNguoiNhan,
        emailKH: order.emailNguoiNhan,
        diaChiKH: order.diaChiGiao,
        mstKH: "",
        items: order.items.map((it) => ({
          maSP: it.maSP,
          tenSP: it.tenSP,
          dvt: it.dvt || "Cai",
          soLuong: it.soLuong,
          donGia: it.donGia,
          thanhTien: it.thanhTien,
          vat: vatRate,
        })),
      };

      const r = await fetch("/api/meinvoice/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donHang,
          invSeries,
          invDate,
          refId,
          refIdDonHang: order.maDH,
          refIdKhachHang: order.maKH,
          nguoiTao: "current_user@mimin.vn",
        }),
      });
      const json = await r.json();
      if (json.ok) {
        setResult(json.hoaDon);
        toast.success(`Đã phát hành HĐĐT ${json.invSeries}${json.invNo}!`);
        onSuccess?.(json.hoaDon);
      } else {
        setError(json.error || "Phát hành thất bại");
        toast.error(json.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  // ============ ACTIONS ============
  const downloadPDF = async () => {
    if (!result) return;
    try {
      const r = await fetch(`/api/meinvoice/invoice/${result.id}/download?format=pdf`);
      if (!r.ok) {
        const err = await r.json();
        toast.error(err.error);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HoaDon_${result.inv_no || result.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const sendEmail = async () => {
    if (!result) return;
    const email = prompt("Email KH:", result.buyer_email || buyer.emailNguoiNhan || "");
    if (!email) return;
    try {
      const r = await fetch(`/api/meinvoice/invoice/${result.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      if (j.ok) toast.success("Đã gửi email!");
      else toast.error(j.error);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ============ RENDER ============
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-full sm:w-[96%] sm:max-w-2xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[95vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                🧾 Phát hành Hóa đơn điện tử
              </h3>
              <p className="text-xs text-slate-500">Misa meInvoice · {config?.env === "live" ? "🚀 LIVE" : "🧪 TEST"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chua cau hinh */}
        {config && config.app_id === "PENDING_APP_ID" && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                  Chưa cấu hình MeInvoice
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-200 mt-1">
                  Vào module HĐĐT → Settings để nhập AppID, username, password.
                </div>
                {onOpenSettings && (
                  <button
                    onClick={() => {
                      onClose();
                      setTimeout(() => onOpenSettings(), 300);
                    }}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600"
                  >
                    <Settings className="w-3.5 h-3.5" /> Mở Settings
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200">
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-emerald-900 dark:text-emerald-100">
                  Phát hành thành công!
                </div>
                <div className="text-sm text-emerald-700 dark:text-emerald-200 mt-1">
                  <div>Số HĐ: <span className="font-mono font-semibold">{result.inv_series}{result.inv_no}</span></div>
                  <div>Ngày: {result.inv_date}</div>
                  <div>Mã giao dịch: <span className="font-mono text-xs">{result.transaction_id}</span></div>
                  <div>Tổng tiền: <span className="font-semibold">{formatVND(result.total_with_vat)}</span> (VAT {formatVND(result.vat_amount)})</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadPDF}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500 text-white text-sm font-semibold hover:bg-cyan-600"
              >
                <Download className="w-4 h-4" /> Tải PDF
              </button>
              <button
                onClick={sendEmail}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600"
              >
                <Mail className="w-4 h-4" /> Gửi email
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5" />
              <div className="text-sm text-rose-700">{error}</div>
            </div>
          </div>
        )}

        {/* Form preview - chi hien khi chua publish */}
        {!result && config && config.app_id !== "PENDING_APP_ID" && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ký hiệu mẫu *</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                  value={invSeries}
                  onChange={(e) => setInvSeries(e.target.value.toUpperCase())}
                  placeholder="1C25MMA"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ngày phát hành *</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  value={invDate}
                  onChange={(e) => setInvDate(e.target.value)}
                />
              </div>
            </div>

            {/* Preview buyer */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200">
              <div className="text-xs font-bold text-slate-600 mb-1">NGƯỜI MUA</div>
              <div className="font-semibold text-sm">{order.tenKH || buyer.tenNguoiNhan}</div>
              <div className="text-xs text-slate-500">
                {buyer.diaChiGiao || "—"} {buyer.sdtNguoiNhan ? `· ${buyer.sdtNguoiNhan}` : ""} {buyer.emailNguoiNhan ? `· ${buyer.emailNguoiNhan}` : ""}
              </div>
            </div>

            {/* Preview items */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="p-2 text-left">SP</th>
                    <th className="p-2 text-right">SL</th>
                    <th className="p-2 text-right">Đơn giá</th>
                    <th className="p-2 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{it.tenSP}</td>
                      <td className="p-2 text-right">{it.soLuong}</td>
                      <td className="p-2 text-right font-mono">{formatVND(it.donGia)}</td>
                      <td className="p-2 text-right font-mono font-semibold">{formatVND(it.thanhTien)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-slate-50 dark:bg-slate-800/50">
                    <td colSpan={3} className="p-2 text-right font-semibold">Tổng:</td>
                    <td className="p-2 text-right font-mono font-semibold">{formatVND(tongThanhToan)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="p-2 text-right text-slate-600">VAT {vatRate}%:</td>
                    <td className="p-2 text-right font-mono text-slate-600">{formatVND(vatAmount)}</td>
                  </tr>
                  <tr className="bg-cyan-50 dark:bg-cyan-900/20">
                    <td colSpan={3} className="p-2 text-right font-bold text-cyan-700">Tổng thanh toán:</td>
                    <td className="p-2 text-right font-mono font-bold text-cyan-700">{formatVND(totalWithVat)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50"
            >
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang phát hành lên MeInvoice...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Phát hành HĐĐT lên MeInvoice
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 text-[10px] text-slate-400 text-center">
          HĐĐT phát hành qua Misa meInvoice · Tuân thủ NĐ 123/2020/NĐ-CP
        </div>
      </div>
    </div>
  );
}
