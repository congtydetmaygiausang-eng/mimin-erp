"use client";

import { Phone, User } from "lucide-react";
import type { Order } from "./types";

export function OrderCustomer({ order }: { order: Order }) {
  return (
    <div className="card p-4 bg-white/30 dark:bg-white/5">
      <div className="text-xs opacity-70 mb-3">Thông tin khách hàng</div>
      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-base">{order.khachHang}</div>
            <div className="text-xs opacity-70 mt-1">Mã đơn: {order.maDH}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-white/40 dark:bg-slate-900/40 p-3">
            <div className="opacity-60 mb-1">Liên hệ</div>
            <div className="font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" /> {order.sdt || "Chưa có số điện thoại"}
            </div>
          </div>
          <div className="rounded-xl bg-white/40 dark:bg-slate-900/40 p-3">
            <div className="opacity-60 mb-1">Ghi chú đơn</div>
            <div className="font-medium">{order.ghiChu?.trim() || "Không có ghi chú thêm"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
