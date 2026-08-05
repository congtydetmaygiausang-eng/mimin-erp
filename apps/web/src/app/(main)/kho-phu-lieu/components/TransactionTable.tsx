// ============ TRANSACTION TABLE (NHAP/XUAT/LICHSU) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.8)

import { formatVNDShort } from "@/lib/data/real-data";
import type { GiaoDichKho } from "@/lib/data/kho-store";

export function TransactionTable({ filteredGD }: { filteredGD: GiaoDichKho[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
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
                <td className="p-3 font-mono text-xs opacity-70">{g.id}</td>
                <td className="p-3 text-xs">{g.ngay}</td>
                <td className="p-3">{g.loai === "NHAP" ? <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 text-[10px] font-semibold">+NHẬP</span> : <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 text-[10px] font-semibold">-XUẤT</span>}</td>
                <td className="p-3 font-mono text-xs">{g.maVT}</td>
                <td className="p-3">{g.tenVT}</td>
                <td className="p-3 text-right font-mono font-semibold">{g.soLuong.toLocaleString()}</td>
                <td className="p-3 text-right font-mono">{g.donGia.toLocaleString()}</td>
                <td className="p-3 text-right font-mono text-emerald-600">{formatVNDShort(g.thanhTien)}</td>
                <td className="p-3 text-xs">{g.nguonNhap || "—"}</td>
                <td className="p-3 text-xs">{g.nguoiThucHien}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
