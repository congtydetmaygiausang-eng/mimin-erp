"use client";

import { Clock, CheckCircle, ChevronRight } from "lucide-react";
import { formatVND } from "@/lib/master-schema";

interface WorkCardProps {
  id: string;
  code: string;
  title: string;
  quantity: number;
  unitPrice: number;
  status: string;
  onAction?: (id: string) => void;
}

export function WorkCard({ id, code, title, quantity, unitPrice, status, onAction }: WorkCardProps) {
  const statusBadges: Record<string, { label: string; color: string }> = {
    CHO_NHAN: { label: "Chờ nhận", color: "bg-amber-100 text-amber-800 border-amber-200" },
    DANG_LAM: { label: "Đang làm", color: "bg-blue-100 text-blue-800 border-blue-200" },
    DA_HOAN_THANH: { label: "Đã hoàn thành", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  };

  const badge = statusBadges[status] || { label: status, color: "bg-slate-100 text-slate-800 border-slate-200" };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold font-mono text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
          {code}
        </span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      <h4 className="font-bold text-slate-900 text-sm mb-2">{title}</h4>

      <div className="flex justify-between items-center text-xs text-slate-600 pt-2 border-t border-slate-100">
        <div>
          <span>SL: <b>{quantity}</b> sp</span>
          <span className="mx-2">•</span>
          <span>Đơn giá: <b>{formatVND(unitPrice)}</b></span>
        </div>
        <div className="font-bold text-emerald-600 text-sm">
          {formatVND(quantity * unitPrice)}
        </div>
      </div>

      {onAction && (
        <button
          onClick={() => onAction(id)}
          className="mt-3 w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1 transition"
        >
          <span>Cập nhật tiến độ</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
