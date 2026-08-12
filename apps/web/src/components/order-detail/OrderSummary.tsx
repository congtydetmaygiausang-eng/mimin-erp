"use client";

import { Landmark, ReceiptText, Wallet } from "lucide-react";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import type { Order } from "./types";
import { docSoVietNam } from "./types";
import { calcDaThanhToan, calcConLai, calcTongTien } from "@/lib/data/don-hang-store";

export function OrderSummary({ order }: { order: Order }) {
  const tongTien = calcTongTien(order);
  const daThanhToan = calcDaThanhToan(order);
  const conLai = calcConLai(order);

  return (
    <div className="card p-4">
      <div className="text-xs opacity-70 mb-3">Tổng kết thanh toán</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-xs opacity-70 mb-1">
            <ReceiptText className="w-3.5 h-3.5" /> Tổng tiền
          </div>
          <div className="text-lg font-bold text-emerald-600">{formatVNDShort(tongTien)}</div>
        </div>
        <div className="rounded-xl bg-sky-500/10 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-xs opacity-70 mb-1">
            <Wallet className="w-3.5 h-3.5" /> Đã trả
          </div>
          <div className="text-lg font-bold text-sky-600">{formatVNDShort(daThanhToan)}</div>
        </div>
        <div className={`rounded-xl p-3 text-center ${conLai > 0 ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
          <div className="flex items-center justify-center gap-1 text-xs opacity-70 mb-1">
            <Landmark className="w-3.5 h-3.5" /> Còn lại
          </div>
          <div className={`text-lg font-bold ${conLai > 0 ? "text-amber-600" : "text-emerald-600"}`}>{formatVNDShort(conLai)}</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-white/30 dark:bg-white/5 p-3 text-xs space-y-1.5">
        <div><span className="opacity-60">Tổng giá trị:</span> <span className="font-semibold">{formatVND(tongTien)}</span></div>
        <div><span className="opacity-60">Bằng chữ:</span> <span className="font-semibold">{docSoVietNam(tongTien)}</span></div>
        <div><span className="opacity-60">Tỷ lệ thanh toán:</span> <span className="font-semibold">{tongTien > 0 ? Math.round((daThanhToan / tongTien) * 100) : 0}%</span></div>
      </div>
    </div>
  );
}
