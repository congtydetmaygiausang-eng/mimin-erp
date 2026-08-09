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

const KHSX_DATA: KHSX[] = [];

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
      <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 35%, #0891b2 75%, #06b6d4 100%)" }}>
        <div className="p-5 md:p-7 text-white flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium opacity-90 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> MIMIN ERP · Sản xuất & Kế hoạch
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-2.5">
              <Calendar className="w-7 h-7" />
              Kế hoạch sản xuất
            </h1>
            <p className="text-sm opacity-95 mt-1.5">
              {tongKH} KH · Tổng SL <b className="text-white">{tongSL.toLocaleString()}</b> · Hoàn thành <b className="text-white">{daHoanThanh.toLocaleString()}</b> · Tiến độ <b className="text-white">{tienDoChung.toFixed(1)}%</b>
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition">
            <Plus className="w-4 h-4" /> Tạo KHSX
          </button>
        </div>
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

      {list.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <div className="font-bold">Chưa có Kế hoạch sản xuất nào</div>
          <div className="text-sm mt-1">Bấm "Tạo KHSX" để bắt đầu lên lịch</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((k) => {
            const tienDo = k.soLuong > 0 ? (k.daHoanThanh / k.soLuong) * 100 : 0;
            const s = TRANG_THAI_STYLE[k.trangThai];
            return (
              <div key={k.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                  <div className="flex-1">
                    <div className="text-[11px] font-bold text-brand-600 mb-1">{k.maKHSX} · {k.tuan}</div>
                    <h3 className="text-lg font-black leading-tight text-slate-800">{k.sanPham}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${s.bg} ${s.color} border border-current/20`}>{k.trangThai}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${k.loai === "Bộ" ? "bg-violet-100 text-violet-700 border-violet-200" : "bg-sky-100 text-sky-700 border-sky-200"} border`}>{k.loai}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 mb-4 flex gap-1.5 items-start">
                  <span className="shrink-0">📍</span>
                  <span className="font-medium line-clamp-2">{k.xuongPhuTrach}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-[11px] font-medium text-slate-400 mb-0.5">Lịch SX</div>
                    <div className="font-bold text-slate-700">{k.tuNgay.slice(5)} ➔ {k.denNgay.slice(5)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-medium text-slate-400 mb-0.5">Sản lượng (Xong / Tổng)</div>
                    <div className="font-bold text-slate-700"><span className="text-emerald-600">{k.daHoanThanh.toLocaleString()}</span> / {k.soLuong.toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-500">Tiến độ</span>
                    <span className={`font-black ${tienDo === 100 ? "text-emerald-600" : "text-brand-600"}`}>{tienDo.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${tienDo === 100 ? "bg-emerald-500" : tienDo > 50 ? "bg-amber-500" : "bg-brand-500"}`} style={{ width: `${tienDo}%` }} />
                  </div>
                </div>
                {k.ghiChu && <div className="mt-3 text-xs bg-amber-50 text-amber-700 p-2 rounded-lg border border-amber-200 font-medium">💬 {k.ghiChu}</div>}
              </div>
            );
          })}
        </div>
      )}

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
