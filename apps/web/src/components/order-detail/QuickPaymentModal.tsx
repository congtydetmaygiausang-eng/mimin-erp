"use client";

import { useState } from "react";
import { X, Wallet, CheckCircle2 } from "lucide-react";
import type { PhuongThucThanhToan, Order, OrderPayment } from "./types";
import { PHUONG_THUC_THANH_TOAN_LABELS } from "./types";
import { calcTongTien, calcDaThanhToan } from "@/lib/data/don-hang-store";

interface Props {
  order: Order;
  onClose: () => void;
  onSave: (payment: OrderPayment) => void;
}

export default function QuickPaymentModal({ order, onClose, onSave }: Props) {
  const tongTien = calcTongTien(order);
  const daThanhToan = calcDaThanhToan(order);
  const conLai = tongTien - daThanhToan;

  const [phuongThuc, setPhuongThuc] = useState<PhuongThucThanhToan>("tien-mat");
  const [soTien, setSoTien] = useState(conLai.toString());
  const [ngayThanhToan, setNgayThanhToan] = useState(new Date().toISOString().substring(0, 10));
  const [nganHang, setNganHang] = useState("");
  const [maGiaoDich, setMaGiaoDich] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  const handleSave = () => {
    const tienNum = parseInt(soTien.replace(/\D/g, "")) || 0;
    if (tienNum <= 0) return alert("Vui lòng nhập số tiền hợp lệ");

    const newPayment: OrderPayment = {
      id: `pay_${Date.now()}`,
      phuongThuc,
      soTien: tienNum,
      ngayThanhToan,
      nganHang: phuongThuc === "ngan-hang" ? nganHang : undefined,
      maGiaoDich: phuongThuc === "ngan-hang" ? maGiaoDich : undefined,
      ghiChu,
    };
    onSave(newPayment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" /> Ghi nhận thanh toán
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border">
            <div className="text-sm text-slate-500 mb-1">Cần thanh toán thêm</div>
            <div className="text-2xl font-bold text-amber-600">{conLai.toLocaleString()}đ</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Số tiền (VNĐ)</label>
            <input
              type="text"
              value={parseInt(soTien.replace(/\D/g, "") || "0").toLocaleString()}
              onChange={(e) => setSoTien(e.target.value)}
              className="w-full p-2.5 border rounded-xl text-lg font-bold text-right"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phương thức</label>
            <select
              value={phuongThuc}
              onChange={(e) => setPhuongThuc(e.target.value as PhuongThucThanhToan)}
              className="w-full p-2.5 border rounded-xl"
            >
              {Object.entries(PHUONG_THUC_THANH_TOAN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {phuongThuc === "ngan-hang" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Ngân hàng</label>
                <input type="text" value={nganHang} onChange={e => setNganHang(e.target.value)} className="w-full p-2 border rounded-xl" placeholder="VD: VCB, MB" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mã GD (nếu có)</label>
                <input type="text" value={maGiaoDich} onChange={e => setMaGiaoDich(e.target.value)} className="w-full p-2 border rounded-xl" placeholder="VD: FT24..." />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Ngày thanh toán</label>
            <input type="date" value={ngayThanhToan} onChange={e => setNgayThanhToan(e.target.value)} className="w-full p-2 border rounded-xl" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú</label>
            <input type="text" value={ghiChu} onChange={e => setGhiChu(e.target.value)} className="w-full p-2 border rounded-xl" placeholder="VD: Khách chuyển cọc" />
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Hủy</button>
          <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4" /> Lưu thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}
