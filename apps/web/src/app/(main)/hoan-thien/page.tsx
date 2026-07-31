"use client";

import { useState } from "react";
import { ClipboardList, CheckCircle2, Clock, Package, Scissors } from "lucide-react";

type HoanThien = {
  id: string;
  ngay: string;
  lenhCat: string;
  congDoan: "Ủi" | "Đóng gói" | "Gấp mác" | "Kiểm tra cuối";
  soLuong: number;
  nguoiThucHien: string;
  trangThai: "Chờ" | "Đang làm" | "Xong";
};

const HT_DATA: HoanThien[] = [
  { id: "HT-001", ngay: "2026-07-28", lenhCat: "LC-M758", congDoan: "Ủi", soLuong: 500, nguoiThucHien: "Trương Minh Tâm", trangThai: "Đang làm" },
  { id: "HT-002", ngay: "2026-07-29", lenhCat: "LC-M758", congDoan: "Gấp mác", soLuong: 500, nguoiThucHien: "Nguyễn Thị Lan", trangThai: "Chờ" },
  { id: "HT-003", ngay: "2026-07-30", lenhCat: "LC-M873", congDoan: "Ủi", soLuong: 546, nguoiThucHien: "Trương Minh Tâm", trangThai: "Chờ" },
  { id: "HT-004", ngay: "2026-07-30", lenhCat: "LC-M873", congDoan: "Đóng gói", soLuong: 546, nguoiThucHien: "Nguyễn Thị Hoa", trangThai: "Chờ" },
];

const TT_STYLE: Record<HoanThien["trangThai"], { color: string; bg: string }> = {
  "Chờ": { color: "text-slate-700", bg: "bg-slate-500/15" },
  "Đang làm": { color: "text-amber-700", bg: "bg-amber-500/15" },
  "Xong": { color: "text-emerald-700", bg: "bg-emerald-500/15" },
};

export default function HoanThienPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><ClipboardList className="w-7 h-7 text-sky-500" /> Hoàn thiện</h1>
        <p className="opacity-70 mt-1 text-sm">Ủi · Gấp mác · Đóng gói · Kiểm tra cuối</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><div className="text-xs opacity-70">Tổng lô</div><div className="text-2xl md:text-3xl font-bold mt-1">{HT_DATA.length}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70">Tổng SL</div><div className="text-2xl md:text-3xl font-bold mt-1 text-sky-600">{HT_DATA.reduce((s, h) => s + h.soLuong, 0).toLocaleString()}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70">Đang làm</div><div className="text-2xl md:text-3xl font-bold mt-1 text-amber-600">{HT_DATA.filter(h => h.trangThai === "Đang làm").length}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70">Hoàn thành</div><div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{HT_DATA.filter(h => h.trangThai === "Xong").length}</div></div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-3">Mã</th>
                <th className="p-3">Ngày</th>
                <th className="p-3">Lệnh cắt</th>
                <th className="p-3">Công đoạn</th>
                <th className="p-3 text-right">SL</th>
                <th className="p-3">Người TH</th>
                <th className="p-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {HT_DATA.map((h) => {
                const s = TT_STYLE[h.trangThai];
                return (
                  <tr key={h.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 font-mono text-xs opacity-70">{h.id}</td>
                    <td className="p-3 text-xs">{h.ngay}</td>
                    <td className="p-3 font-mono text-xs text-brand-600 font-semibold">{h.lenhCat}</td>
                    <td className="p-3 text-xs">{h.congDoan}</td>
                    <td className="p-3 text-right font-mono">{h.soLuong.toLocaleString()}</td>
                    <td className="p-3 text-xs">{h.nguoiThucHien}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${s.bg} ${s.color}`}>{h.trangThai}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
