"use client";

import { useState, useMemo } from "react";
import {
  ShoppingCart,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Calendar,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  User as UserIcon,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { NCCS, formatVND, formatVNDShort } from "@/lib/data/real-data";
import { useSupabaseSync } from "@/lib/supabase/client";
import { OrderCustomer } from "@/components/order-detail/OrderCustomer";
import { OrderHeader } from "@/components/order-detail/OrderHeader";
import { OrderItemsTable } from "@/components/order-detail/OrderItemsTable";
import { OrderSummary } from "@/components/order-detail/OrderSummary";
import { OrderTimeline } from "@/components/order-detail/OrderTimeline";
import type { Order, OrderStatus } from "@/components/order-detail/types";

type TrangThaiDH = OrderStatus;
type DonHang = Order;

const { data: DON_HANG_KHOI_DAU } = useSupabaseSync<DonHang>("mimin_don_hang", "don_hang");

const TRANG_THAI_STYLE: Record<TrangThaiDH, { color: string; bg: string; icon: any }> = {
  "Mới": { color: "text-sky-700", bg: "bg-sky-500/15", icon: Plus },
  "Đã duyệt": { color: "text-violet-700", bg: "bg-violet-500/15", icon: CheckCircle2 },
  "Đang SX": { color: "text-amber-700", bg: "bg-amber-500/15", icon: Clock },
  "Hoàn thành": { color: "text-emerald-700", bg: "bg-emerald-500/15", icon: CheckCircle2 },
  "Đã giao": { color: "text-green-700", bg: "bg-green-500/15", icon: CheckCircle2 },
  "Hủy": { color: "text-red-700", bg: "bg-red-500/15", icon: X },
};

export default function DonHangPage() {
  const { data: khachHangs } = useSupabaseSync<any>("mimin_khach_hang", "khach_hang");
  const { data: list, addRecord, updateRecord, deleteRecord, isLoading } = useSupabaseSync<DonHang>("mimin_don_hang", "don_hang", DON_HANG_KHOI_DAU);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | TrangThaiDH>("all");
  const [showForm, setShowForm] = useState<{ mode: "add" | "edit"; dh?: DonHang } | null>(null);
  const [showDetail, setShowDetail] = useState<DonHang | null>(null);

  // KPIs
  const tongDH = list.length;
  const tongDoanhThu = list.filter((d) => d.trangThai !== "Hủy").reduce((s, d) => s + d.thanhTien, 0);
  const tongCoc = list.reduce((s, d) => s + d.tienCoc, 0);
  const conLai = tongDoanhThu - tongCoc;
  const dsMoi = list.filter((d) => d.trangThai === "Mới");
  const dsDangSX = list.filter((d) => d.trangThai === "Đang SX" || d.trangThai === "Đã duyệt");
  const dsSapGiao = list.filter((d) => {
    const today = new Date();
    const ngayGiao = new Date(d.ngayGiao);
    const diff = (ngayGiao.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return d.trangThai !== "Đã giao" && d.trangThai !== "Hủy" && diff <= 7 && diff >= 0;
  });

  // Filter
  const filtered = list.filter((d) => {
    const matchSearch = [d.maDH, d.khachHang, d.sanPham, d.sdt].some((x) => (x || "").toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "all" || d.trangThai === filter;
    return matchSearch && matchFilter;
  });

  const handleSave = async (dh: DonHang) => {
    if (showForm?.mode === "add") {
      await addRecord(dh);
      toast.success(`Đã tạo đơn hàng: ${dh.maDH}`);
    } else if (showForm?.mode === "edit") {
      await updateRecord(dh.id, dh);
      toast.success(`Đã cập nhật: ${dh.maDH}`);
    }
    setShowForm(null);
  };

  const handleDelete = async (dh: DonHang) => {
    if (confirm(`Xoá đơn hàng "${dh.maDH}"?`)) {
      await deleteRecord(dh.id);
      toast.success(`Đã xoá: ${dh.maDH}`);
    }
  };

  const handleAdvanceStatus = async (dh: DonHang) => {
    const flow: TrangThaiDH[] = ["Mới", "Đã duyệt", "Đang SX", "Hoàn thành", "Đã giao"];
    const idx = flow.indexOf(dh.trangThai);
    if (idx < 0 || idx >= flow.length - 1) {
      toast.info("Đơn hàng đã ở trạng thái cuối");
      return;
    }
    const newTrangThai = flow[idx + 1];
    await updateRecord(dh.id, { trangThai: newTrangThai });
    toast.success(`Đã chuyển: ${dh.trangThai} → ${newTrangThai}`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-brand-500" />
            Đơn hàng
            {isLoading && <span className="ml-3 w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></span>}
          </h1>
          <p className="opacity-70 mt-1 text-sm">
            {tongDH} đơn · Tổng DT <b className="text-emerald-600">{formatVNDShort(tongDoanhThu)}</b> · Đã cọc <b className="text-sky-600">{formatVNDShort(tongCoc)}</b> · Còn lại <b className="text-amber-600">{formatVNDShort(conLai)}</b>
          </p>
        </div>
        <button onClick={() => setShowForm({ mode: "add" })} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tạo đơn hàng
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> Tổng đơn</div>
          <div className="text-2xl md:text-3xl font-bold mt-1">{tongDH}</div>
          <div className="text-xs opacity-60 mt-1">đơn hàng</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-600" /> Doanh thu</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{formatVNDShort(tongDoanhThu)}</div>
          <div className="text-xs opacity-60 mt-1">chưa tính đơn hủy</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Clock className="w-3 h-3 text-amber-600" /> Đang SX</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-amber-600">{dsDangSX.length}</div>
          <div className="text-xs opacity-60 mt-1">đơn đang chạy</div>
        </div>
        <div className={`card p-5 ${dsSapGiao.length > 0 ? "bg-orange-500/10 border-orange-500/40" : ""}`}>
          <div className="text-xs opacity-70 flex items-center gap-1"><AlertCircle className="w-3 h-3 text-orange-600" /> Sắp đến hạn</div>
          <div className={`text-2xl md:text-3xl font-bold mt-1 ${dsSapGiao.length > 0 ? "text-orange-600" : "text-emerald-600"}`}>{dsSapGiao.length}</div>
          <div className="text-xs opacity-60 mt-1">giao trong 7 ngày</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {([
            { id: "all", label: `Tất cả (${list.length})` },
            { id: "Mới", label: `Mới (${dsMoi.length})`, danger: dsMoi.length > 0 },
            { id: "Đã duyệt", label: `Đã duyệt (${list.filter(d => d.trangThai === "Đã duyệt").length})` },
            { id: "Đang SX", label: `Đang SX (${list.filter(d => d.trangThai === "Đang SX").length})` },
            { id: "Hoàn thành", label: `Hoàn thành (${list.filter(d => d.trangThai === "Hoàn thành").length})` },
            { id: "Đã giao", label: `Đã giao (${list.filter(d => d.trangThai === "Đã giao").length})` },
            { id: "Hủy", label: `Hủy (${list.filter(d => d.trangThai === "Hủy").length})` },
          ] as { id: "all" | TrangThaiDH; label: string; danger?: boolean }[]).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                filter === f.id
                  ? f.danger ? "bg-sky-500 text-white" : "bg-brand-500 text-white"
                  : f.danger ? "bg-sky-500/10 text-sky-700 hover:bg-sky-500/20" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input className="input pl-9" placeholder="Tìm mã ĐH, KH, SĐT, sản phẩm…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-3">Mã ĐH</th>
                <th className="p-3">Ngày đặt</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3 text-right">SL</th>
                <th className="p-3 text-right">Đơn giá</th>
                <th className="p-3 text-right">Thành tiền</th>
                <th className="p-3 text-right">Đã cọc</th>
                <th className="p-3">Ngày giao</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const s = TRANG_THAI_STYLE[d.trangThai];
                const Icon = s.icon;
                const today = new Date();
                const ngayGiao = new Date(d.ngayGiao);
                const soNgayConLai = Math.floor((ngayGiao.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const sapDenHan = d.trangThai !== "Đã giao" && d.trangThai !== "Hủy" && soNgayConLai <= 7 && soNgayConLai >= 0;
                const quaHan = d.trangThai !== "Đã giao" && d.trangThai !== "Hủy" && soNgayConLai < 0;
                return (
                  <tr key={d.id} className={`border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5 ${quaHan ? "bg-red-500/5" : sapDenHan ? "bg-orange-500/5" : ""}`} style={{ borderColor: "var(--border)" }}>
                    <td className="p-3">
                      <button onClick={() => setShowDetail(d)} className="font-mono text-xs text-brand-600 font-semibold hover:underline">
                        {d.maDH}
                      </button>
                    </td>
                    <td className="p-3 text-xs">{d.ngayDat}</td>
                    <td className="p-3">
                      <div className="font-medium">{d.khachHang}</div>
                      <div className="text-[10px] opacity-60">{d.sdt}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{d.sanPham}</div>
                      <div className="text-[10px] opacity-60">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${d.loai === "Bộ" ? "bg-violet-500/15 text-violet-700" : "bg-sky-500/15 text-sky-700"}`}>{d.loai}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">{d.soLuong.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">{d.donGia.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-semibold text-emerald-600">{formatVNDShort(d.thanhTien)}</td>
                    <td className="p-3 text-right font-mono text-sky-600">{formatVNDShort(d.tienCoc)}</td>
                    <td className="p-3 text-xs">
                      <div>{d.ngayGiao}</div>
                      {quaHan && <span className="text-[9px] text-red-600 font-bold">Quá hạn {Math.abs(soNgayConLai)} ngày</span>}
                      {sapDenHan && <span className="text-[9px] text-orange-600 font-semibold">Còn {soNgayConLai} ngày</span>}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.color}`}>
                        <Icon className="w-3 h-3" /> {d.trangThai}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {d.trangThai !== "Đã giao" && d.trangThai !== "Hủy" && (
                          <button onClick={() => handleAdvanceStatus(d)} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 flex items-center gap-0.5" title="Chuyển bước tiếp">
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        <button onClick={() => setShowForm({ mode: "edit", dh: d })} className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 hover:bg-sky-500/25">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(d)} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-700 hover:bg-red-500/25">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-brand-500/10 font-bold text-xs">
                  <td colSpan={6} className="p-3 text-right">TỔNG ({filtered.length} đơn)</td>
                  <td className="p-3 text-right text-emerald-600">{formatVNDShort(filtered.reduce((s, d) => s + d.thanhTien, 0))}</td>
                  <td className="p-3 text-right text-sky-600">{formatVNDShort(filtered.reduce((s, d) => s + d.tienCoc, 0))}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {showForm && <DonHangForm mode={showForm.mode} dh={showForm.dh} existingCount={list.length} khachHangs={khachHangs} onClose={() => setShowForm(null)} onSave={handleSave} />}
      {showDetail && <DHDetailModal dh={showDetail} onClose={() => setShowDetail(null)} />}
    </div>
  );
}

function DonHangForm({ mode, dh, existingCount, onClose, onSave, khachHangs }: any) {
  const [form, setForm] = useState<DonHang>(dh || {
    id: `DH-${(existingCount + 1).toString().padStart(3, "0")}`,
    maDH: `DH-2026-${(existingCount + 1).toString().padStart(3, "0")}`,
    ngayDat: new Date().toISOString().split("T")[0],
    ngayGiao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    khachHang: khachHangs?.[0]?.ten_kh || "",
    sdt: "",
    sanPham: "",
    loai: "Bộ",
    soLuong: 0,
    donGia: 0,
    thanhTien: 0,
    trangThai: "Mới",
    tienCoc: 0,
    ghiChu: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.khachHang || !form.sanPham) {
      toast.error("Vui lòng nhập KH và sản phẩm");
      return;
    }
    onSave({ ...form, thanhTien: form.soLuong * form.donGia });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            {mode === "add" ? <Plus className="w-5 h-5 text-brand-500" /> : <Edit2 className="w-5 h-5 text-sky-600" />}
            {mode === "add" ? "Tạo đơn hàng mới" : `Sửa: ${dh?.maDH}`}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Mã ĐH *</label>
              <input required className="input w-full" value={form.maDH} onChange={(e) => setForm({ ...form, maDH: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Ngày đặt *</label>
              <input type="date" required className="input w-full" value={form.ngayDat} onChange={(e) => setForm({ ...form, ngayDat: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Ngày giao DK *</label>
              <input type="date" required className="input w-full" value={form.ngayGiao} onChange={(e) => setForm({ ...form, ngayGiao: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Khách hàng *</label>
              <select required className="input w-full" value={form.khachHang} onChange={(e) => setForm({ ...form, khachHang: e.target.value })}>
                <option value="">-- Chọn KH --</option>
                {khachHangs.map((k: any) => <option key={k.ma_kh} value={k.ten_kh}>{k.ten_kh}</option>)}
                <option value="__khac__">+ Khác (tự nhập)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">SĐT KH</label>
              <input className="input w-full" value={form.sdt} onChange={(e) => setForm({ ...form, sdt: e.target.value })} placeholder="0901234567" />
            </div>
          </div>
          {form.khachHang === "__khac__" && (
            <div>
              <label className="text-xs font-medium block mb-1">Tên KH mới</label>
              <input className="input w-full" onChange={(e) => setForm({ ...form, khachHang: e.target.value })} placeholder="Tên công ty/cá nhân" />
            </div>
          )}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium block mb-1">Sản phẩm *</label>
              <input required className="input w-full" value={form.sanPham} onChange={(e) => setForm({ ...form, sanPham: e.target.value })} placeholder="VD: Bộ trụ trơn" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Loại</label>
              <select className="input w-full" value={form.loai} onChange={(e) => setForm({ ...form, loai: e.target.value as "Áo" | "Bộ" })}>
                <option>Bộ</option>
                <option>Áo</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Số lượng *</label>
              <input type="number" required min={1} className="input w-full" value={form.soLuong || ""} onChange={(e) => setForm({ ...form, soLuong: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Đơn giá (đ) *</label>
              <input type="number" required min={0} className="input w-full" value={form.donGia || ""} onChange={(e) => setForm({ ...form, donGia: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Tiền cọc (đ)</label>
              <input type="number" min={0} className="input w-full" value={form.tienCoc || ""} onChange={(e) => setForm({ ...form, tienCoc: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Thành tiền</label>
              <div className="input w-full bg-emerald-500/10 text-emerald-700 font-bold flex items-center">{(form.soLuong * form.donGia).toLocaleString()}đ</div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Trạng thái</label>
            <select className="input w-full" value={form.trangThai} onChange={(e) => setForm({ ...form, trangThai: e.target.value as TrangThaiDH })}>
              <option>Mới</option>
              <option>Đã duyệt</option>
              <option>Đang SX</option>
              <option>Hoàn thành</option>
              <option>Đã giao</option>
              <option>Hủy</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Ghi chú</label>
            <textarea className="input w-full min-h-[50px]" value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
            <button type="submit" className="btn-primary flex-1">{mode === "add" ? "Tạo đơn hàng" : "Lưu thay đổi"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DHDetailModal({ dh, onClose }: { dh: DonHang; onClose: () => void }) {
  const items = [
    {
      id: `${dh.id}-1`,
      sku: dh.maDH,
      name: dh.sanPham,
      type: dh.loai,
      quantity: dh.soLuong,
      unitPrice: dh.donGia,
      total: dh.thanhTien,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-5xl w-full p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <OrderHeader order={dh} onClose={onClose} />
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
            <OrderItemsTable items={items} />
            <OrderCustomer order={dh} />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4">
            <OrderTimeline order={dh} />
            <OrderSummary order={dh} />
          </div>
          <div className="bg-brand-500/10 rounded p-3 text-xs">
            <div className="font-semibold mb-1">Workflow hiện tại: {dh.trangThai}</div>
            <div className="opacity-70">Luồng chuẩn: Mới → Đã duyệt → Đang SX → Hoàn thành → Đã giao</div>
          </div>
        </div>
      </div>
    </div>
  );
}

