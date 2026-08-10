"use client";

import { useState } from "react";
import { X, Truck, CheckCircle2 } from "lucide-react";
import type { PhuongThucVanChuyen, TrangThaiVanChuyen, Order, OrderShipping } from "./types";
import { PHUONG_THUC_VAN_CHUYEN_LABELS, TRANG_THAI_VAN_CHUYEN_LABELS } from "./types";

interface Props {
  order: Order;
  onClose: () => void;
  onSave: (shipping: Partial<OrderShipping>) => void;
}

export default function ShippingModal({ order, onClose, onSave }: Props) {
  const current = order.shipping || {} as OrderShipping;

  const [phuongThuc, setPhuongThuc] = useState<PhuongThucVanChuyen>(current.phuongThuc || "ghtk");
  const [trangThai, setTrangThai] = useState<TrangThaiVanChuyen>(current.trangThai || "cho-xu-ly");
  const [phiVanChuyen, setPhiVanChuyen] = useState(current.phiVanChuyen?.toString() || "0");
  const [maVanDon, setMaVanDon] = useState(current.maVanDon || "");
  const [diaChiGiao, setDiaChiGiao] = useState(current.diaChiGiao || order.diaChi || "");
  const [ngayGiaoDuKien, setNgayGiaoDuKien] = useState(current.ngayGiaoDuKien || order.ngayGiao || "");

  const handleSave = () => {
    const phiNum = parseInt(phiVanChuyen.replace(/\D/g, "")) || 0;
    onSave({
      phuongThuc,
      trangThai,
      phiVanChuyen: phiNum,
      maVanDon,
      diaChiGiao,
      ngayGiaoDuKien,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Truck className="w-5 h-5 text-sky-600" /> Vận chuyển & Giao hàng
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Đơn vị vận chuyển</label>
              <select
                value={phuongThuc}
                onChange={(e) => setPhuongThuc(e.target.value as PhuongThucVanChuyen)}
                className="w-full p-2.5 border rounded-xl"
              >
                {Object.entries(PHUONG_THUC_VAN_CHUYEN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <select
                value={trangThai}
                onChange={(e) => setTrangThai(e.target.value as TrangThaiVanChuyen)}
                className="w-full p-2.5 border rounded-xl font-medium text-sky-700"
              >
                {Object.entries(TRANG_THAI_VAN_CHUYEN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã vận đơn / Tracking</label>
              <input type="text" value={maVanDon} onChange={e => setMaVanDon(e.target.value)} className="w-full p-2 border rounded-xl" placeholder="VD: S123456" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phí vận chuyển (VNĐ)</label>
              <input
                type="text"
                value={parseInt(phiVanChuyen.replace(/\D/g, "") || "0").toLocaleString()}
                onChange={(e) => setPhiVanChuyen(e.target.value)}
                className="w-full p-2 border rounded-xl text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ngày giao dự kiến</label>
            <input type="date" value={ngayGiaoDuKien} onChange={e => setNgayGiaoDuKien(e.target.value)} className="w-full p-2 border rounded-xl" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Địa chỉ giao hàng</label>
            <textarea
              value={diaChiGiao}
              onChange={e => setDiaChiGiao(e.target.value)}
              className="w-full p-2 border rounded-xl min-h-[80px]"
              placeholder="Số nhà, đường, phường, quận, tỉnh..."
            />
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Hủy</button>
          <button onClick={handleSave} className="px-4 py-2 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-colors flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4" /> Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
}
