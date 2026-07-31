"use client";
import { useState, useMemo } from "react";
import {
  Scissors, Brush, Hammer, Plus, CheckCircle2, Clock, ArrowRight, Package,
  AlertTriangle, TrendingUp, Calendar, User, Sparkles, Eye, Award, Layers,
  ChevronRight, FileText, BarChart3, Wallet, Tag,
} from "lucide-react";
import { ALL_REAL_PHIEU } from "@/lib/real-workflow-data";
import { REAL_NHAN_VIEN, REAL_DON_GIA } from "@/lib/real-workflow-data";
import { KH_SI_FULL } from "@/lib/master-data-full";
import { NCC_FULL } from "@/lib/master-data-full";

type Khau = "all" | "CAT" | "INTD" | "MAY" | "KN" | "UI" | "DG";

const KHAU_INFO: Record<string, { ten: string; icon: any; mau: string; donGiaMacDinh: number }> = {
  CAT:  { ten: "Cắt",           icon: Scissors,  mau: "from-sky-500 to-cyan-500",       donGiaMacDinh: 1400 },
  INTD: { ten: "In/Thêu/Dập",   icon: Brush,     mau: "from-violet-500 to-purple-500",   donGiaMacDinh: 2500 },
  MAY:  { ten: "May",           icon: Hammer,    mau: "from-amber-500 to-orange-500",    donGiaMacDinh: 14000 },
  KN:   { ten: "Khuy nút",      icon: Tag,       mau: "from-yellow-500 to-amber-500",    donGiaMacDinh: 750 },
  UI:   { ten: "Ủi",            icon: Sparkles,  mau: "from-rose-500 to-pink-500",       donGiaMacDinh: 2000 },
  DG:   { ten: "Gấp xếp - ĐG",  icon: Package,   mau: "from-emerald-500 to-teal-500",   donGiaMacDinh: 800 },
};

export default function LSXM758DemoPage() {
  const [filterKhau, setFilterKhau] = useState<Khau>("all");

  // Lọc phiếu của LSX-2026-001 (M758)
  const phieuM758 = useMemo(() => ALL_REAL_PHIEU.filter((p) => p.lenhSX === "LSX-2026-001"), []);

  // Filter theo khâu
  const filtered = useMemo(() => {
    if (filterKhau === "all") return phieuM758;
    return phieuM758.filter((p) => p.id.startsWith(filterKhau));
  }, [filterKhau, phieuM758]);

  // Tính tổng
  const tongSL = phieuM758[0]?.soLuongGiao || 0;
  const tongDat = phieuM758.reduce((s, p) => s + p.soLuongDat, 0);
  const tongLoi = phieuM758.reduce((s, p) => s + p.soLuongLoi, 0);
  const tongTien = phieuM758.reduce((s, p) => s + p.thanhTien, 0);
  const tongNo = phieuM758.reduce((s, p) => s + p.conNo, 0);
  const tongNV = new Set(phieuM758.map((p) => p.nguoiNhan)).size;

  // Công nợ: khách hàng
  const khachHang = KH_SI_FULL[0];
  // NCC
  const nccVai = NCC_FULL.find((n) => n.loai === "sợi" || n.loai === "dệt");
  const nccPhuLieu = NCC_FULL.find((n) => n.loai === "phụ liệu");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 p-3 md:p-5">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-700 text-white p-5 md:p-7 shadow-xl">
          <div className="text-xs font-medium opacity-90 mb-1">🏭 Bước 3-8 · Nhập liệu thật · LSX MẪU M758</div>
          <h1 className="text-2xl md:text-3xl font-bold">📋 LSX-2026-001 · M758 · Bộ trụ trơn 500 bộ</h1>
          <p className="text-sm opacity-95 mt-1 max-w-3xl">
            LSX thật đã chạy qua <b>6/7 khâu</b> (Cắt → INTD → May → Khuy nút → Ủi → ĐG). 
            Tổng <b>{phieuM758.length} phiếu workflow</b> từ Lark chị Giàu.
          </p>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold">{tongSL}</div><div className="opacity-90">Tổng SL</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold">{tongDat}</div><div className="opacity-90">Đạt</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold text-rose-200">{tongLoi}</div><div className="opacity-90">Lỗi</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold text-amber-200">{(tongTien/1_000_000).toFixed(1)}M</div><div className="opacity-90">Thành tiền</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold text-rose-200">{(tongNo/1_000_000).toFixed(1)}M</div><div className="opacity-90">Còn nợ</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold">{tongNV}</div><div className="opacity-90">NV tham gia</div></div>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="card p-4">
          <h2 className="font-bold text-sm mb-3">🔄 Quy trình 7 khâu (Workflow)</h2>
          <div className="flex flex-wrap items-center gap-1">
            {Object.entries(KHAU_INFO).map(([k, info], idx, arr) => {
              const Icon = info.icon;
              const phieus = phieuM758.filter((p) => p.id.startsWith(k));
              const sl = phieus.reduce((s, p) => s + p.soLuongDat, 0);
              const slGiao = phieus.reduce((s, p) => s + p.soLuongGiao, 0);
              const pct = slGiao > 0 ? Math.round(sl / slGiao * 100) : 0;
              const done = pct >= 100;
              return (
                <div key={k} className="flex items-center">
                  <div className={`px-3 py-2 rounded-lg bg-gradient-to-r ${info.mau} text-white shadow-md min-w-[110px]`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold">{idx + 1}. {info.ten}</span>
                    </div>
                    <div className="text-[10px] opacity-90">
                      {sl}/{slGiao} sp ({pct}%)
                    </div>
                    {done && <CheckCircle2 className="w-3 h-3 inline mt-0.5 ml-1" />}
                  </div>
                  {idx < arr.length - 1 && <ArrowRight className="w-4 h-4 text-slate-400 mx-1" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all",  label: "📊 Tất cả", count: phieuM758.length },
            ...Object.entries(KHAU_INFO).map(([k, info]) => ({
              id: k, label: `${info.ten} (${phieuM758.filter((p) => p.id.startsWith(k)).length})`, count: phieuM758.filter((p) => p.id.startsWith(k)).length,
            })),
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterKhau(t.id as Khau)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                filterKhau === t.id ? "bg-indigo-500 text-white shadow" : "bg-white border border-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Phiếu workflow cards */}
        <div className="space-y-2">
          {filtered.map((p) => {
            const khauKey = p.id.split("_")[0];
            const info = KHAU_INFO[khauKey] || KHAU_INFO.CAT;
            const Icon = info.icon;
            const nv = REAL_NHAN_VIEN.find((n) => n.ma === p.nguoiNhan);
            const isNV = !!nv;
            const pct = p.soLuongGiao > 0 ? Math.round(p.soLuongDat / p.soLuongGiao * 100) : 0;
            return (
              <div key={p.id} className="card p-3 border-l-4 border-indigo-500">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-r ${info.mau} text-white flex items-center justify-center`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded">{p.id}</span>
                      <span className="font-bold text-sm">{info.ten} - {p.phanLoai}</span>
                      {p.trangThai === "Hoàn thành" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✅ Xong</span>}
                      {p.trangThai === "Đang may" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">🔄 Đang làm</span>}
                      {p.trangThai === "Chờ gấp" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">⏳ Chờ</span>}
                    </div>
                    <div className="text-[11px] text-slate-600 mb-1">
                      📅 Giao: {p.ngayGiao || "—"} · Hạn: {p.hanHoanThanh} {p.ngayHoanThanh && `· Xong: ${p.ngayHoanThanh}`}
                    </div>
                    <div className="text-[11px] text-slate-700">
                      👤 <b>{p.tenNguoiNhan}</b> {isNV ? `(${nv.boPhan})` : "(Outsource)"} · Giao bởi: {p.nguoiGiao}
                    </div>
                    {p.ghiChu && <div className="text-[10px] text-slate-500 italic mt-1">"{p.ghiChu}"</div>}
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-[10px] text-slate-500">SL Đạt/Giao</div>
                    <div className="text-base font-bold text-emerald-600">{p.soLuongDat}/{p.soLuongGiao}</div>
                    <div className="text-[10px] text-slate-400">({pct}%)</div>
                    {p.soLuongLoi > 0 && <div className="text-[10px] text-rose-600">⚠️ Lỗi: {p.soLuongLoi}</div>}
                    <div className="text-[10px] text-slate-500 mt-2">Đơn giá</div>
                    <div className="text-xs font-bold">{p.donGia.toLocaleString("vi-VN")}đ</div>
                    <div className="text-[10px] text-slate-500 mt-1">Thành tiền</div>
                    <div className="text-sm font-bold text-indigo-600">{(p.thanhTien/1_000).toFixed(0)}K</div>
                    {p.conNo > 0 && <div className="text-[10px] text-rose-600">Nợ: {(p.conNo/1_000).toFixed(0)}K</div>}
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className={`bg-gradient-to-r ${info.mau} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Công nợ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="card p-4 bg-emerald-50 border-2 border-emerald-200">
            <h3 className="font-bold text-sm text-emerald-800 mb-2">💰 Công nợ KH ({khachHang.tenKH})</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Tổng giá trị LSX</span><b>{(tongTien / 1_000_000).toFixed(2)}M đ</b></div>
              <div className="flex justify-between"><span>Đã thanh toán</span><b className="text-emerald-600">{((tongTien - tongNo) / 1_000_000).toFixed(2)}M đ</b></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span>Còn nợ</span><b className="text-rose-600">{(tongNo / 1_000_000).toFixed(2)}M đ</b></div>
              <div className="text-[10px] text-slate-500 mt-2 italic">Hạn thanh toán: 2026-08-30 (30 ngày)</div>
            </div>
          </div>
          <div className="card p-4 bg-rose-50 border-2 border-rose-200">
            <h3 className="font-bold text-sm text-rose-800 mb-2">💸 Công nợ NCC ({nccVai?.tenNCC})</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Mua vải (500 bộ × 0.56kg × 116.5K)</span><b>32.6M đ</b></div>
              <div className="flex justify-between"><span>Bo cổ + phụ liệu</span><b>5.5M đ</b></div>
              <div className="flex justify-between"><span>May gia công (3 xưởng)</span><b>{(tongTien * 0.4 / 1_000_000).toFixed(2)}M đ</b></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span>Tổng nợ NCC</span><b className="text-rose-600">{((tongTien * 0.5) / 1_000_000).toFixed(2)}M đ</b></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
