"use client";

import { useState } from "react";
import { Calendar, Plus, CheckCircle2, Clock, TrendingUp, Target, AlertCircle, ChevronRight, Edit2, Trash2, X, Package, Layers } from "lucide-react";
import { toast } from "sonner";

type TrangThaiKHSX = "Lên kế hoạch" | "Đang SX" | "Hoàn thành" | "Trễ hạn";

type KHSX = {
  id: string;
  maKHSX: string;
  tuan: string;
  tuNgay: string;
  denNgay: string;
  sanPham: string;
  loai: "Áo" | "Bộ";
  soLuong: number;
  daHoanThanh: number;
  xuongPhuTrach: string;
  trangThai: TrangThaiKHSX;
  ghiChu?: string;
};

const KHSX_DATA: KHSX[] = [
  { id: "KHSX-001", maKHSX: "KHSX-2026-W28", tuan: "Tuần 28 (07-13/07)", tuNgay: "2026-07-07", denNgay: "2026-07-13", sanPham: "Bộ trụ trơn M758", loai: "Bộ", soLuong: 500, daHoanThanh: 500, xuongPhuTrach: "Tổ cắt + May áo Liễu + May quần Hương", trangThai: "Hoàn thành" },
  { id: "KHSX-002", maKHSX: "KHSX-2026-W29", tuan: "Tuần 29 (14-20/07)", tuNgay: "2026-07-14", denNgay: "2026-07-20", sanPham: "Áo trụ M873", loai: "Áo", soLuong: 546, daHoanThanh: 546, xuongPhuTrach: "Tổ cắt + In Bảo Ngân + May trụ Cúc", trangThai: "Hoàn thành" },
  { id: "KHSX-003", maKHSX: "KHSX-2026-W30", tuan: "Tuần 30 (21-27/07)", tuNgay: "2026-07-21", denNgay: "2026-07-27", sanPham: "Bộ Polo cao cấp (M775)", loai: "Bộ", soLuong: 400, daHoanThanh: 180, xuongPhuTrach: "Xưởng may Hưng + Thêu Hạnh", trangThai: "Đang SX", ghiChu: "Đã hoàn thành 45% kế hoạch" },
  { id: "KHSX-004", maKHSX: "KHSX-2026-W31", tuan: "Tuần 31 (28/07-03/08)", tuNgay: "2026-07-28", denNgay: "2026-08-03", sanPham: "Áo sơ mi công sở (M790)", loai: "Áo", soLuong: 800, daHoanThanh: 0, xuongPhuTrach: "Tổ cắt + May Minh Tâm", trangThai: "Lên kế hoạch" },
  { id: "KHSX-005", maKHSX: "KHSX-2026-W32", tuan: "Tuần 32 (04-10/08)", tuNgay: "2026-08-04", denNgay: "2026-08-10", sanPham: "Bộ đồng phục HS", loai: "Bộ", soLuong: 600, daHoanThanh: 0, xuongPhuTrach: "May Hoàng Long + Thêu Hạnh", trangThai: "Lên kế hoạch" },
];

const TRANG_THAI_STYLE: Record<TrangThaiKHSX, { color: string; bg: string }> = {
  "Lên kế hoạch": { color: "text-slate-700", bg: "bg-slate-500/15" },
  "Đang SX": { color: "text-amber-700", bg: "bg-amber-500/15" },
  "Hoàn thành": { color: "text-emerald-700", bg: "bg-emerald-500/15" },
  "Trễ hạn": { color: "text-red-700", bg: "bg-red-500/15" },
};

export default function KeHoachSXPage() {
  const [list, setList] = useState<KHSX[]>(KHSX_DATA);
  const [showForm, setShowForm] = useState(false);

  const tongKH = list.length;
  const tongSL = list.reduce((s, k) => s + k.soLuong, 0);
  const daHoanThanh = list.reduce((s, k) => s + k.daHoanThanh, 0);
  const tienDoChung = tongSL > 0 ? (daHoanThanh / tongSL) * 100 : 0;
  const dsDangSX = list.filter((k) => k.trangThai === "Đang SX");
  const dsTreHan = list.filter((k) => {
    const today = new Date();
    return k.trangThai !== "Hoàn thành" && new Date(k.denNgay) < today;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-7 h-7 text-brand-500" />
            Kế hoạch sản xuất
          </h1>
          <p className="opacity-70 mt-1 text-sm">{tongKH} KH · Tổng SL <b className="text-brand-600">{tongSL.toLocaleString()}</b> · Hoàn thành <b className="text-emerald-600">{daHoanThanh.toLocaleString()}</b> · Tiến độ <b className="text-amber-600">{tienDoChung.toFixed(1)}%</b></p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Tạo KHSX</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><Target className="w-3 h-3" /> Tổng KH</div><div className="text-2xl md:text-3xl font-bold mt-1">{tongKH}</div><div className="text-xs opacity-60 mt-1">kế hoạch</div></div>
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><Layers className="w-3 h-3" /> Tổng SL</div><div className="text-2xl md:text-3xl font-bold mt-1 text-brand-600">{tongSL.toLocaleString()}</div><div className="text-xs opacity-60 mt-1">sản phẩm</div></div>
        <div className="card p-5"><div className="text-xs opacity-70 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Hoàn thành</div><div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{daHoanThanh.toLocaleString()}</div><div className="text-xs opacity-60 mt-1">đã xong</div></div>
        <div className={`card p-5 ${dsTreHan.length > 0 ? "bg-red-500/10 border-red-500/40" : ""}`}>
          <div className="text-xs opacity-70 flex items-center gap-1"><AlertCircle className="w-3 h-3 text-red-600" /> Trễ hạn</div>
          <div className={`text-2xl md:text-3xl font-bold mt-1 ${dsTreHan.length > 0 ? "text-red-600" : "text-emerald-600"}`}>{dsTreHan.length}</div>
          <div className="text-xs opacity-60 mt-1">cần xử lý</div>
        </div>
      </div>

      <div className="space-y-3">
        {list.map((k) => {
          const tienDo = k.soLuong > 0 ? (k.daHoanThanh / k.soLuong) * 100 : 0;
          const s = TRANG_THAI_STYLE[k.trangThai];
          return (
            <div key={k.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-xs text-brand-600 font-mono">{k.maKHSX} · {k.tuan}</div>
                  <h3 className="text-base font-semibold mt-1">{k.sanPham}</h3>
                  <div className="text-xs opacity-70 mt-1">📍 {k.xuongPhuTrach}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${s.bg} ${s.color}`}>{k.trangThai}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${k.loai === "Bộ" ? "bg-violet-500/15 text-violet-700" : "bg-sky-500/15 text-sky-700"}`}>{k.loai}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs opacity-70">Từ ngày</div>
                  <div className="font-medium">{k.tuNgay}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70">Đến ngày</div>
                  <div className="font-medium">{k.denNgay}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70">SL kế hoạch</div>
                  <div className="font-mono font-semibold">{k.soLuong.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70">Đã hoàn thành</div>
                  <div className="font-mono font-semibold text-emerald-600">{k.daHoanThanh.toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="opacity-70">Tiến độ</span>
                  <span className="font-semibold">{tienDo.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-200/40 dark:bg-slate-700/40 rounded-full overflow-hidden">
                  <div className={`h-full transition-all ${tienDo === 100 ? "bg-emerald-500" : tienDo > 50 ? "bg-amber-500" : "bg-brand-500"}`} style={{ width: `${tienDo}%` }} />
                </div>
              </div>
              {k.ghiChu && <div className="mt-2 text-xs opacity-70 italic">💬 {k.ghiChu}</div>}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="card max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Tạo KHSX mới</h3>
            <p className="text-sm opacity-70 mb-3">Form đầy đủ sẽ được bổ sung trong Phase tiếp theo. Hiện tại vui lòng liên hệ quản lý để thêm KHSX.</p>
            <button onClick={() => { toast.info("Form đang phát triển"); setShowForm(false); }} className="btn-primary w-full">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
