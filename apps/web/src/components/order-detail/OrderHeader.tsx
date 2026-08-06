"use client";

import { FileText, Phone, X } from "lucide-react";
import type { Order } from "./types";

export function OrderHeader({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-500" />
          Chi tiết đơn hàng: {order.maDH}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-700 font-semibold">
            {order.trangThai}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/40 dark:bg-white/5 opacity-80">
            {order.loai} · {order.sanPham}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {order.sdt && (
          <a
            href={`tel:${order.sdt}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 transition"
            aria-label={`Gọi ${order.khachHang}`}
          >
            <Phone className="w-4 h-4" /> Gọi khách
          </a>
        )}
        <button onClick={onClose} className="p-2 hover:bg-white/40 rounded-lg" aria-label="Đóng chi tiết đơn hàng">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
