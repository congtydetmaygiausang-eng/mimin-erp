// ============ TRANSACTION TABLE (NHAP/XUAT/LICHSU) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.8)

import { formatVND } from "@/lib/data/real-data";
import type { GiaoDichKho } from "@/lib/data/kho-store";

export function TransactionTable({ filteredGD }: { filteredGD: GiaoDichKho[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
              <th className="p-3">Mã GD</th>
              <th className="p-3">Ngày</th>
              <th className="p-3">Loại</th>
              <th className="p-3">Mã VT</th>
              <th className="p-3">Tên</th>
              <th className="p-3 text-right">SL</th>
              <th className="p-3 text-right">Đơn giá</th>
              <th className="p-3 text-right">Tiền</th>
              <th className="p-3">Nguồn</th>
              <th className="p-3">Người TH</th>
            </tr>
          </thead>
          <tbody>
            {filteredGD.length === 0 ? (
              <tr><td colSpan={10} className="p-8 text-center opacity-60 text-sm">Chưa có giao dịch</td></tr>
            ) : filteredGD.map((g) => (
              <tr key={g.id} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                <td className="p-3 text-sm font-medium opacity-80 whitespace-nowrap">{g.id}</td>
                <td className="p-3 text-sm whitespace-nowrap">{g.ngay}</td>
                <td className="p-3">{g.loai === "NHAP" ? <span className="px-2 py-1 rounded bg-sky-500/15 text-sky-700 text-xs font-semibold">+NHẬP</span> : <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-700 text-xs font-semibold">-XUẤT</span>}</td>
                <td className="p-3 text-sm font-semibold whitespace-nowrap">{g.maVT}</td>
                <td className="p-3">{g.tenVT}</td>
                <td className="p-3 text-right font-semibold whitespace-nowrap">{g.soLuong.toLocaleString("vi-VN")}</td>
                <td className="p-3 text-right whitespace-nowrap">{g.donGia.toLocaleString("vi-VN")}</td>
                <td className="p-3 text-right font-semibold text-emerald-600 whitespace-nowrap">{formatVND(g.thanhTien)}</td>
                <td className="p-3 text-sm">{g.nguonNhap || "—"}</td>
                <td className="p-3 text-sm">{g.nguoiThucHien}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
