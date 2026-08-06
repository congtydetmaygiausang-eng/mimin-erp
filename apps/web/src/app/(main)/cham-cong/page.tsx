"use client";

import { useState } from "react";
import { Calendar, Users, CheckCircle2, X, Clock, TrendingUp } from "lucide-react";

type ChamCong = {
  id: string;
  maNV: string;
  hoTen: string;
  boPhan: string;
  ngayCong: number;
  ngayNghi: number;
  ngayTre: number;
  congThang: number;
  tongGio: number;
};

const CC_DATA: ChamCong[] = [
  { id: "CC-001", maNV: "GS002", hoTen: "NGUYỄN THỊ MỸ NHI", boPhan: "Sản xuất", ngayCong: 26, ngayNghi: 1, ngayTre: 0, congThang: 26, tongGio: 234 },
  { id: "CC-002", maNV: "GS003", hoTen: "VÕ THỊ PHƯỜNG", boPhan: "Sản xuất", ngayCong: 27, ngayNghi: 0, ngayTre: 0, congThang: 27, tongGio: 243 },
  { id: "CC-003", maNV: "GS004", hoTen: "NGUYỄN NGỌC CẨM VY", boPhan: "Marketing", ngayCong: 22, ngayNghi: 3, ngayTre: 1, congThang: 22, tongGio: 198 },
  { id: "CC-004", maNV: "GS005", hoTen: "ĐỖ THỊ HUYỀN", boPhan: "Kinh doanh", ngayCong: 25, ngayNghi: 1, ngayTre: 0, congThang: 25, tongGio: 225 },
  { id: "CC-005", maNV: "GS006", hoTen: "LÊ THỊ HOA", boPhan: "QC", ngayCong: 26, ngayNghi: 0, ngayTre: 0, congThang: 26, tongGio: 234 },
  { id: "CC-006", maNV: "GS010", hoTen: "TRƯƠNG MINH TÂM", boPhan: "Sản xuất", ngayCong: 25, ngayNghi: 2, ngayTre: 0, congThang: 25, tongGio: 225 },
  { id: "CC-007", maNV: "GS011", hoTen: "NGUYỄN THỊ LAN", boPhan: "Sản xuất", ngayCong: 24, ngayNghi: 2, ngayTre: 1, congThang: 24, tongGio: 216 },
];

export default function ChamCongPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 35%, #0891b2 75%, #06b6d4 100%)" }}>
        <div className="p-5 md:p-7 text-white">
          <div className="text-xs font-medium opacity-90 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> MIMIN ERP · Kế toán & Mua bán
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-2.5">
            <Calendar className="w-7 h-7" /> Chấm công tháng 7/2026
          </h1>
          <p className="text-sm opacity-95 mt-1.5">
            {CC_DATA.length} NV · Tổng giờ làm <b className="text-white">{CC_DATA.reduce((s, c) => s + c.tongGio, 0).toLocaleString()}h</b>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><Users className="w-3 h-3" /> Tổng NV</div><div className="text-2xl md:text-3xl font-bold mt-1">{CC_DATA.length}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Công đủ</div><div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{CC_DATA.filter(c => c.ngayCong >= 25).length}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><X className="w-3 h-3 text-amber-600" /> Nghỉ &gt;2 ngày</div><div className="text-2xl md:text-3xl font-bold mt-1 text-amber-600">{CC_DATA.filter(c => c.ngayNghi > 2).length}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><Clock className="w-3 h-3 text-red-600" /> Đi trễ</div><div className="text-2xl md:text-3xl font-bold mt-1 text-red-600">{CC_DATA.filter(c => c.ngayTre > 0).length}</div></div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-3">Mã NV</th>
                <th className="p-3">Họ tên</th>
                <th className="p-3">Bộ phận</th>
                <th className="p-3 text-center">Công</th>
                <th className="p-3 text-center">Nghỉ</th>
                <th className="p-3 text-center">Trễ</th>
                <th className="p-3 text-right">Tổng giờ</th>
                <th className="p-3">Tỷ lệ</th>
              </tr>
            </thead>
            <tbody>
              {CC_DATA.map((c) => {
                const tile = c.congThang / 27 * 100;
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 font-mono text-xs opacity-70">{c.maNV}</td>
                    <td className="p-3 font-medium">{c.hoTen}</td>
                    <td className="p-3 text-xs">{c.boPhan}</td>
                    <td className="p-3 text-center font-mono font-semibold text-emerald-600">{c.ngayCong}</td>
                    <td className="p-3 text-center font-mono">{c.ngayNghi}</td>
                    <td className="p-3 text-center font-mono text-red-600">{c.ngayTre}</td>
                    <td className="p-3 text-right font-mono font-semibold">{c.tongGio}h</td>
                    <td className="p-3 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-200/40 dark:bg-slate-700/40 rounded-full overflow-hidden">
                          <div className={`h-full ${tile >= 90 ? "bg-emerald-500" : tile >= 75 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${tile}%` }} />
                        </div>
                        <span className="text-[10px] opacity-60 w-10 text-right">{tile.toFixed(0)}%</span>
                      </div>
                    </td>
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
