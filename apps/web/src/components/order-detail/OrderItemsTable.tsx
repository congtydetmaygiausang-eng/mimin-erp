"use client";

import { Package } from "lucide-react";
import { formatVNDShort } from "@/lib/data/real-data";
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
              <th className="py-2 text-left text-xs opacity-70 font-medium">Loại</th>
              <th className="py-2 text-right text-xs opacity-70 font-medium">SL</th>
              <th className="py-2 text-right text-xs opacity-70 font-medium">Đơn giá</th>
              <th className="py-2 text-right text-xs opacity-70 font-medium">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <td className="py-3 font-mono text-xs text-brand-700">{item.sku}</td>
                <td className="py-3 font-medium">{item.name}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${item.type === "Bộ" ? "bg-violet-500/15 text-violet-700" : "bg-sky-500/15 text-sky-700"}`}>
                    {item.type}
                  </span>
                </td>
                <td className="py-3 text-right font-mono">{item.quantity.toLocaleString()}</td>
                <td className="py-3 text-right font-mono">{formatVNDShort(item.unitPrice)}</td>
                <td className="py-3 text-right font-mono font-semibold text-emerald-600">{formatVNDShort(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
