"use client";

import { Calendar, CheckCircle2, CircleDashed, Clock3, Truck } from "lucide-react";
import type { Order, OrderStatus } from "./types";

const ORDER_FLOW: OrderStatus[] = ["Mới", "Đã duyệt", "Đang SX", "Hoàn thành", "Đã giao"];

export function OrderTimeline({ order }: { order: Order }) {
  const currentIndex = ORDER_FLOW.indexOf(order.trangThai);
  const steps = [
    { key: "Ngày đặt", value: order.ngayDat, icon: Calendar },
    { key: "Đã duyệt", value: currentIndex >= 1 ? "Đã xác nhận" : "Chờ duyệt", icon: CheckCircle2 },
    { key: "Sản xuất", value: currentIndex >= 2 ? "Đang chạy" : "Chưa bắt đầu", icon: Clock3 },
    { key: "Hoàn tất", value: currentIndex >= 3 ? "Đã hoàn thành" : "Đang xử lý", icon: CheckCircle2 },
    { key: "Giao dự kiến", value: order.ngayGiao, icon: Truck },
  ];

  return (
    <div className="card p-4">
      <div className="text-xs opacity-70 mb-3">Lịch trình theo dõi</div>
      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const active = index <= Math.max(currentIndex, 0) || index === 0;
          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${active ? "bg-brand-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                  {active ? <Icon className="w-4 h-4" /> : <CircleDashed className="w-4 h-4" />}
                </div>
                {index < steps.length - 1 && <div className={`w-px flex-1 mt-1 ${active ? "bg-brand-500/40" : "bg-slate-300 dark:bg-slate-700"}`} />}
              </div>
              <div className="pb-3">
                <div className="font-semibold text-sm">{step.key}</div>
                <div className="text-xs opacity-70 mt-0.5">{step.value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
