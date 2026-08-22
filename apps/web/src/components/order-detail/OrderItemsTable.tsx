"use client";

import { Package } from "lucide-react";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import type { OrderItem } from "./types";
import { calcTotalQty } from "./types";

export function OrderItemsTable({ items }: { items: OrderItem[] }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-xs opacity-70">Danh sách sản phẩm</div>
          <h4 className="font-semibold flex items-center gap-2 mt-1">
            <Package className="w-4 h-4 text-violet-600" /> {items.length} dòng hàng · {calcTotalQty(items).toLocaleString()} sản phẩm
          </h4>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border)" }}>
              <th className="py-2 text-left text-xs opacity-70 font-medium">SKU</th>
              <th className="py-2 text-left text-xs opacity-70 font-medium">Sản phẩm</th>
              <th className="py-2 text-right text-xs opacity-70 font-medium">SL</th>
              <th className="py-2 text-right text-xs opacity-70 font-medium">Đơn giá</th>
              <th className="py-2 text-right text-xs opacity-70 font-medium">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <td className="py-3 font-mono text-xs text-brand-700">{item.sku}</td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {item.mauImg && (
                      <img src={item.mauImg} alt={item.mauTen} className="w-10 h-10 rounded-md object-cover border border-slate-200 shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-slate-800">{item.spTen}</div>
                      <div className="text-xs text-slate-500">
                        {item.mauTen} {item.size ? `- Size ${item.size}` : ""} ({item.sku})
                      </div>
                    </div>
                  </div>
                </td>
              <td className="p-3 text-right">{item.soLuong}</td>
              <td className="p-3 text-right text-slate-600">{formatVND(item.donGia)}</td>
              <td className="p-3 text-right font-medium text-emerald-700">{formatVND(item.thanhTien)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
