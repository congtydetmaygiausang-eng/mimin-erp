"use client";

import { useState } from "react";
import { Truck, MapPin, Calendar, Package, Phone, CheckCircle2, Clock, AlertCircle } from "lucide-react";

type GiaoHang = {
  id: string;
  maGH: string;
  ngayGiao: string;
  donHang: string;
  khachHang: string;
  sdt: string;
  diaChi: string;
  soLuong: number;
  trangThai: "Chờ giao" | "Đang giao" | "Đã giao" | "Trễ";
  phuongTien: string;
  nguoiVanChuyen?: string;
};

const GH_DATA: GiaoHang[] = [
  { id: "GH-001", maGH: "GH-2026-001", ngayGiao: "2026-07-10", donHang: "DH-2026-005", khachHang: "Shop Thời Trang Sài Gòn", sdt: "0987654321", diaChi: "Quận 1, TP.HCM", soLuong: 100, trangThai: "Đã giao", phuongTien: "Xe tải 1.5T", nguoiVanChuyen: "Nguyễn Văn Tài" },
  { id: "GH-002", maGH: "GH-2026-002", ngayGiao: "2026-07-15", donHang: "DH-2026-006", khachHang: "Cty May Hà Nội", sdt: "0912345678", diaChi: "Hà Nội", soLuong: 500, trangThai: "Đã giao", phuongTien: "Xe tải 5T", nguoiVanChuyen: "Trần Văn Bình" },
  { id: "GH-003", maGH: "GH-2026-003", ngayGiao: "2026-07-20", donHang: "DH-2026-007", khachHang: "Xưởng may Hoàng Long", sdt: "0945678901", diaChi: "Long An", soLuong: 300, trangThai: "Đã giao", phuongTien: "Xe tải 3T", nguoiVanChuyen: "Lê Văn Cường" },
  { id: "GH-004", maGH: "GH-2026-004", ngayGiao: "2026-08-05", donHang: "DH-2026-001", khachHang: "Cty May Hà Nội", sdt: "0912345678", diaChi: "Hà Nội", soLuong: 500, trangThai: "Đang giao", phuongTien: "Xe tải 5T", nguoiVanChuyen: "Trần Văn Bình" },
  { id: "GH-005", maGH: "GH-2026-005", ngayGiao: "2026-08-10", donHang: "DH-2026-002", khachHang: "Shop Thời Trang Sài Gòn", sdt: "0987654321", diaChi: "Quận 1, TP.HCM", soLuong: 300, trangThai: "Chờ giao", phuongTien: "Xe tải 1.5T" },
];

const TT_STYLE: Record<GiaoHang["trangThai"], { color: string; bg: string; icon: any }> = {
  "Chờ giao": { color: "text-slate-700", bg: "bg-slate-500/15", icon: Clock },
  "Đang giao": { color: "text-amber-700", bg: "bg-amber-500/15", icon: Truck },
  "Đã giao": { color: "text-emerald-700", bg: "bg-emerald-500/15", icon: CheckCircle2 },
  "Trễ": { color: "text-red-700", bg: "bg-red-500/15", icon: AlertCircle },
};

export default function GiaoHangPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Truck className="w-7 h-7 text-sky-500" /> Giao hàng</h1>
        <p className="opacity-70 mt-1 text-sm">Theo dõi lịch giao hàng cho khách</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><div className="text-xs opacity-70">Tổng lô giao</div><div className="text-2xl md:text-3xl font-bold mt-1">{GH_DATA.length}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70">Đã giao</div><div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{GH_DATA.filter(g => g.trangThai === "Đã giao").length}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70">Đang giao</div><div className="text-2xl md:text-3xl font-bold mt-1 text-amber-600">{GH_DATA.filter(g => g.trangThai === "Đang giao").length}</div></div>
        <div className="card p-5"><div className="text-xs opacity-70">Chờ giao</div><div className="text-2xl md:text-3xl font-bold mt-1 text-slate-600">{GH_DATA.filter(g => g.trangThai === "Chờ giao").length}</div></div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-3">Mã GH</th>
                <th className="p-3">Ngày giao</th>
                <th className="p-3">Đơn hàng</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3 text-right">SL</th>
                <th className="p-3">Phương tiện</th>
                <th className="p-3">Vận chuyển</th>
                <th className="p-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {GH_DATA.map((g) => {
                const s = TT_STYLE[g.trangThai];
                const Icon = s.icon;
                return (
                  <tr key={g.id} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 font-mono text-xs opacity-70">{g.maGH}</td>
                    <td className="p-3 text-xs"><div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {g.ngayGiao}</div></td>
                    <td className="p-3 font-mono text-xs text-brand-600">{g.donHang}</td>
                    <td className="p-3">
                      <div className="font-medium text-xs">{g.khachHang}</div>
                      <div className="text-[10px] opacity-60 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {g.sdt} · <MapPin className="w-3 h-3" /> {g.diaChi}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">{g.soLuong.toLocaleString()}</td>
                    <td className="p-3 text-xs">{g.phuongTien}</td>
                    <td className="p-3 text-xs">{g.nguoiVanChuyen || "—"}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.color}`}>
                        <Icon className="w-3 h-3" /> {g.trangThai}
                      </span>
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
