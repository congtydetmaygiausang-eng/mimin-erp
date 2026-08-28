// ============ TRANSACTION TABLE (NHAP/XUAT/LICHSU) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.8)

import { formatVND } from "@/lib/data/real-data";
import type { GiaoDichKho } from "@/lib/data/kho-store";

export function TransactionTable({ filteredGD }: { filteredGD: GiaoDichKho[] }) {
  return (
    <div className="card shadow-sm">
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-sm tabular-nums border-collapse">
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

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden flex flex-col gap-3 p-2">
        {filteredGD.length === 0 ? (
          <div className="p-8 text-center opacity-60 text-sm">Chưa có giao dịch</div>
        ) : filteredGD.map((g) => (
          <div key={g.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-3 space-y-2 relative">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-bold text-slate-800 text-sm">{g.tenVT}</div>
                <div className="text-xs font-mono text-slate-500 mt-0.5">{g.maVT}</div>
              </div>
              <div>
                {g.loai === "NHAP" ? (
                  <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 text-[10px] font-bold">+NHẬP</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">-XUẤT</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
              <div>
                <div className="text-[10px] text-slate-400">Số lượng</div>
                <div className="font-bold text-slate-700">{g.soLuong.toLocaleString("vi-VN")}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Đơn giá</div>
                <div className="font-semibold text-slate-600">{g.donGia.toLocaleString("vi-VN")}đ</div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-2 rounded mt-1">
              <div className="text-[10px] text-slate-500">
                <div>{g.ngay}</div>
                <div className="truncate w-24" title={g.nguoiThucHien}>{g.nguoiThucHien}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Tổng tiền</div>
                <div className="font-bold text-emerald-600">{formatVND(g.thanhTien)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
