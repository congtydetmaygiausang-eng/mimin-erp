"use client";

import { useState } from "react";
import { Shirt, Users, Scissors, TrendingUp, Clock } from "lucide-react";

type ToMay = {
  id: string;
  maTo: string;
  tenTo: string;
  toTruong: string;
  soCongNhan: number;
  sanPham: string;
  soLuongHomNay: number;
  soLuongTuan: number;
  tyLeDat: number;
};

const MAY_DATA: ToMay[] = [
  { id: "TM-001", maTo: "TM-01", tenTo: "Tổ May Áo Sài Gòn", toTruong: "VÕ THỊ PHƯỜNG", soCongNhan: 12, sanPham: "Áo Polo", soLuongHomNay: 145, soLuongTuan: 720, tyLeDat: 96 },
  { id: "TM-002", maTo: "TM-02", tenTo: "Tổ May Quần Bình Dương", toTruong: "TRẦN VĂN HÙNG", soCongNhan: 10, sanPham: "Quần tây", soLuongHomNay: 98, soLuongTuan: 510, tyLeDat: 94 },
  { id: "TM-003", maTo: "TM-03", tenTo: "Tổ May Bộ Long An", toTruong: "NGUYỄN VĂN MẠNH", soCongNhan: 15, sanPham: "Bộ vest", soLuongHomNay: 65, soLuongTuan: 320, tyLeDat: 92 },
  { id: "TM-004", maTo: "TM-04", tenTo: "Tổ May Đồng Phục", toTruong: "LÊ THỊ MAI", soCongNhan: 8, sanPham: "Đồng phục HS", soLuongHomNay: 88, soLuongTuan: 440, tyLeDat: 97 },
];

export default function MayPage() {
  const tongCN = MAY_DATA.reduce((s, t) => s + t.soCongNhan, 0);
  const tongHomNay = MAY_DATA.reduce((s, t) => s + t.soLuongHomNay, 0);
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Shirt className="w-7 h-7 text-violet-500" /> Tổ may</h1>
        <p className="opacity-70 mt-1 text-sm">Quản lý các tổ may trong xưởng</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><Users className="w-3 h-3" /> Tổng CN</div><div className="text-2xl md:text-3xl font-bold mt-1">{tongCN}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><Scissors className="w-3 h-3" /> Số tổ</div><div className="text-2xl md:text-3xl font-bold mt-1">{MAY_DATA.length}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-600" /> SP hôm nay</div><div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{tongHomNay.toLocaleString()}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><Clock className="w-3 h-3" /> Đạt chất lượng</div><div className="text-2xl md:text-3xl font-bold mt-1 text-violet-600">{(MAY_DATA.reduce((s, t) => s + t.tyLeDat, 0) / MAY_DATA.length).toFixed(1)}%</div></div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-3">Mã tổ</th>
                <th className="p-3">Tên tổ</th>
                <th className="p-3">Tổ trưởng</th>
                <th className="p-3 text-center">Số CN</th>
                <th className="p-3">SP chính</th>
                <th className="p-3 text-right">Hôm nay</th>
                <th className="p-3 text-right">Tuần này</th>
                <th className="p-3 text-right">% Đạt</th>
              </tr>
            </thead>
            <tbody>
              {MAY_DATA.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                  <td className="p-3 font-mono text-xs opacity-70">{t.maTo}</td>
                  <td className="p-3 font-medium">{t.tenTo}</td>
                  <td className="p-3 text-xs">{t.toTruong}</td>
                  <td className="p-3 text-center font-mono font-semibold">{t.soCongNhan}</td>
                  <td className="p-3 text-xs">{t.sanPham}</td>
                  <td className="p-3 text-right font-mono text-emerald-600 font-semibold">{t.soLuongHomNay}</td>
                  <td className="p-3 text-right font-mono">{t.soLuongTuan.toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <span className={`font-bold ${t.tyLeDat >= 95 ? "text-emerald-600" : t.tyLeDat >= 90 ? "text-amber-600" : "text-red-600"}`}>{t.tyLeDat}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
