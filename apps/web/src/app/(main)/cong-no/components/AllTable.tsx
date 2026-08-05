// ============ BANG CHINH (TAB ALL) + FILTER ============
// Tach tu page.tsx (2026-08-05 - toi uu B.5)

import Link from "next/link";
import { Search, CreditCard, AlertTriangle } from "lucide-react";
import { formatVNDShort } from "@/lib/data/real-data";
import { tinhCongNo } from "@/lib/data/cong-no";
import type { PhanCongCongDoan } from "@/lib/data/cong-no-store";
import { STATUS_STYLE, type StatusFilter, type NguoiFilter } from "../data";

interface AllTableProps {
  filtered: PhanCongCongDoan[];
  phanCong: PhanCongCongDoan[];
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  nguoiFilter: NguoiFilter;
  setNguoiFilter: (v: NguoiFilter) => void;
  search: string;
  setSearch: (v: string) => void;
  isLate: (p: PhanCongCongDoan) => boolean;
  onThanhToan: (p: PhanCongCongDoan) => void;
}

export function AllTable({ filtered, phanCong, statusFilter, setStatusFilter, nguoiFilter, setNguoiFilter, search, setSearch, isLate, onThanhToan }: AllTableProps) {
  const dsChoGiao = phanCong.filter((p) => p.trangThai === "Chờ giao");
  const dsDangLam = phanCong.filter((p) => p.trangThai === "Đang làm");
  const dsDaThanhToan = phanCong.filter((p) => p.trangThai === "Đã thanh toán");
  const tong = tinhCongNo(phanCong);

  return (
    <>
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs opacity-60">Trạng thái:</span>
          {([
            { id: "all" as StatusFilter, label: `Tất cả (${phanCong.length})` },
            { id: "Chờ giao" as StatusFilter, label: `Chờ giao (${dsChoGiao.length})` },
            { id: "Đang làm" as StatusFilter, label: `Đang làm (${dsDangLam.length})` },
            { id: "Hoàn thành" as StatusFilter, label: `Hoàn thành (${phanCong.filter(p => p.trangThai === "Hoàn thành").length})` },
            { id: "Đã thanh toán" as StatusFilter, label: `Đã TT (${dsDaThanhToan.length})` },
          ]).map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-2.5 py-1 rounded text-xs ${
                statusFilter === f.id ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs opacity-60">Người PT:</span>
          {([
            { id: "all" as NguoiFilter, label: "Tất cả" },
            { id: "Đối tác gia công" as NguoiFilter, label: "Đối tác" },
            { id: "Nhân viên nội bộ" as NguoiFilter, label: "Nội bộ" },
          ]).map((f) => (
            <button
              key={f.id}
              onClick={() => setNguoiFilter(f.id)}
              className={`px-2.5 py-1 rounded text-xs ${
                nguoiFilter === f.id ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            className="input pl-9"
            placeholder="Tìm theo tên, mã, lệnh cắt…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-3">Mã PC</th>
                <th className="p-3">Lệnh cắt</th>
                <th className="p-3">Công đoạn</th>
                <th className="p-3">Người phụ trách</th>
                <th className="p-3">Loại</th>
                <th className="p-3 text-right">SL</th>
                <th className="p-3 text-right">Đơn giá</th>
                <th className="p-3 text-right">Thành tiền</th>
                <th className="p-3 text-right">Đã TT</th>
                <th className="p-3 text-right">Còn nợ</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const thanhTien = p.donGiaGiao * p.soLuongGiao;
                const conNo = thanhTien - p.daThanhToan;
                const s = STATUS_STYLE[p.trangThai];
                const late = isLate(p);
                return (
                  <tr
                    key={p.id}
                    className={`border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5 ${
                      late ? "bg-red-500/5" : ""
                    }`}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="p-3 font-mono text-xs opacity-70">{p.id}</td>
                    <td className="p-3 font-mono text-xs text-brand-600 font-semibold">
                      <Link href={`/lenh-cat?id=${p.lenhCatId}`} className="hover:underline">
                        {p.lenhCatId}
                      </Link>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-brand-500/15 text-brand-700 dark:text-brand-300 text-xs font-medium">
                        {p.congDoan}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="text-xs">
                        <div className="font-medium flex items-center gap-1">
                          {p.nguoiPhuTrach.ten.split(" (")[0]}
                          {late && <AlertTriangle className="w-3 h-3 text-red-600" />}
                        </div>
                        <div className="text-[10px] opacity-60 font-mono">{p.nguoiPhuTrach.ma}</div>
                      </div>
                    </td>
                    <td className="p-3 text-xs">
                      {p.nguoiPhuTrach.loai === "Đối tác gia công" ? "Đối tác" : "Nội bộ"}
                    </td>
                    <td className="p-3 text-right">{p.soLuongGiao.toLocaleString()} {p.donVi}</td>
                    <td className="p-3 text-right font-mono">{p.donGiaGiao.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-semibold">{thanhTien.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-emerald-600">{p.daThanhToan.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-semibold text-red-600">
                      {conNo > 0 ? conNo.toLocaleString() : "✓"}
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.color}`}>
                        {p.trangThai}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {conNo > 0 && (
                        <button
                          onClick={() => onThanhToan(p)}
                          className="text-xs px-2 py-1 rounded bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 flex items-center gap-1 mx-auto"
                          title="Tạo thanh toán"
                        >
                          <CreditCard className="w-3 h-3" /> Trả
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-brand-500/10 font-bold">
                <td colSpan={7} className="p-3 text-right">TỔNG</td>
                <td className="p-3 text-right">{formatVNDShort(tong.tongThanhTien)}</td>
                <td className="p-3 text-right text-emerald-600">{formatVNDShort(tong.tongDaThanhToan)}</td>
                <td className="p-3 text-right text-red-600">{formatVNDShort(tong.tongConNo)}</td>
                <td colSpan={2} className="p-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
