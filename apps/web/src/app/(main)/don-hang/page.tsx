"use client";

import { useState, useMemo, useCallback } from "react";
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
  Printer,
  Wallet,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { NCCS, formatVND, formatVNDShort } from "@/lib/data/real-data";
import { useSupabaseSync } from "@/lib/supabase/client";
import { OrderCustomer } from "@/components/order-detail/OrderCustomer";
import { OrderHeader } from "@/components/order-detail/OrderHeader";
import { OrderItemsTable } from "@/components/order-detail/OrderItemsTable";
import { OrderSummary } from "@/components/order-detail/OrderSummary";
import { OrderTimeline } from "@/components/order-detail/OrderTimeline";
import OrderFormModal from "@/components/order-detail/OrderFormModal";
import InvoicePrint from "@/components/order-detail/InvoicePrint";
import type { Order, OrderItem, OrderPayment, OrderShipping } from "@/components/order-detail/types";
import {
  PHUONG_THUC_THANH_TOAN_LABELS, PHUONG_THUC_VAN_CHUYEN_LABELS, TRANG_THAI_VAN_CHUYEN_LABELS,
  LOAI_DON_HANG_LABELS,
} from "@/components/order-detail/types";
import { calcOrderTotal, calcPaidTotal } from "@/components/order-detail/helpers";

type TrangThaiDH = Order["trangThai"];
type DonHang = Order;

const TRANG_THAI_STYLE: Record<TrangThaiDH, { color: string; bg: string; icon: any }> = {
  "Mới": { color: "text-sky-700", bg: "bg-sky-500/15", icon: Plus },
  "Đã duyệt": { color: "text-violet-700", bg: "bg-violet-500/15", icon: CheckCircle2 },
  "Đang SX": { color: "text-amber-700", bg: "bg-amber-500/15", icon: Clock },
  "Hoàn thành": { color: "text-emerald-700", bg: "bg-emerald-500/15", icon: CheckCircle2 },
  "Đã giao": { color: "text-green-700", bg: "bg-green-500/15", icon: CheckCircle2 },
  "Hủy": { color: "text-red-700", bg: "bg-red-500/15", icon: X },
};

/**
 * Migration: convert Order cu (khong co items[]) sang Order moi
 * - Tao items[] fake tu sanPham/soLuong/donGia
 * - Tao shipping default
 * - Tao payments[] fake tu tienCoc
 */
function migrateOldOrder(oldOrder: any): Order {
  const items: OrderItem[] = oldOrder.sanPham
    ? [{
        id: oldOrder.id + "-item-1",
        spId: oldOrder.sanPham,
        spTen: oldOrder.sanPham,
        soLuong: oldOrder.soLuong || 1,
        donGia: oldOrder.donGia || 0,
        thanhTien: (oldOrder.soLuong || 1) * (oldOrder.donGia || 0),
      }]
    : [];

  const tienCoc = oldOrder.tienCoc || 0;
  const payments: OrderPayment[] = tienCoc > 0
    ? [{
        id: oldOrder.id + "-pay-1",
        phuongThuc: "tien-mat" as const,
        soTien: tienCoc,
        ngayThanhToan: oldOrder.ngayDat || new Date().toISOString().slice(0, 10),
      }]
    : [];

  const shipping: OrderShipping = {
    phuongThuc: "tu-giao",
    phiVanChuyen: 0,
    trangThai: "cho-xu-ly",
  };

  return {
    ...oldOrder,
    loaiDonHang: oldOrder.loaiDonHang || "ban-le",
    items,
    payments,
    shipping,
    trangThaiThanhToan: tienCoc > 0 ? "thanh-toan-mot-phan" : "chua-thanh-toan",
  };
}

/**
 * Convert Order moi -> format luu tru (giu backward compat voi schema cu)
 * - sanPham: ten SP dau tien
 * - soLuong: tong so luong
 * - donGia: don gia SP dau tien
 * - tienCoc: tong payments
 */
function toLegacyFormat(order: Order): any {
  const tongSL = order.items.reduce((s, i) => s + (i.soLuong || 0), 0);
  const tongTienCoc = order.payments.reduce((s, p) => s + (p.soTien || 0), 0);
  const firstItem = order.items[0];
  return {
    ...order,
    sanPham: firstItem?.spTen || order.sanPham || "",
    loai: order.loai || "Bộ",
    soLuong: tongSL || order.soLuong || 0,
    donGia: firstItem?.donGia || order.donGia || 0,
    tienCoc: tongTienCoc || order.tienCoc || 0,
  };
}

export default function DonHangPage() {
  const { data: khachHangs } = useSupabaseSync<any>("mimin_khach_hang", "khach_hang");
  const { data: list, addRecord, updateRecord, deleteRecord, isLoading } = useSupabaseSync<DonHang>("mimin_don_hang", "don_hang", []);
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

  // Open form (cho OrderFormModal) - migrate order cu neu can
  const openForm = (mode: "add" | "edit", dh?: DonHang) => {
    if (mode === "edit" && dh) {
      const migrated = (!dh.items || dh.items.length === 0) ? migrateOldOrder(dh) : dh;
      setShowForm({ mode, dh: migrated });
    } else {
      setShowForm({ mode });
    }
  };

  const handleSave = async (order: Order) => {
    const legacyFormat = toLegacyFormat(order);
    if (showForm?.mode === "add") {
      await addRecord(legacyFormat);
      toast.success(`Đã tạo đơn hàng: ${order.maDH}`);
    } else if (showForm?.mode === "edit") {
      await updateRecord(order.id, legacyFormat);
      toast.success(`Đã cập nhật: ${order.maDH}`);
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
        <button onClick={() => openForm("add")} className="btn-primary flex items-center gap-2">
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
                        <button onClick={() => openForm("edit", d)} className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 hover:bg-sky-500/25">
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

      {showForm && (
        <OrderFormModal
          open={!!showForm}
          initial={showForm.dh || null}
          onClose={() => setShowForm(null)}
          onSave={handleSave}
        />
      )}
      {showDetail && (
        <DHDetailModal
          dh={showDetail}
          onClose={() => setShowDetail(null)}
          onEdit={(dh) => openForm("edit", dh)}
        />
      )}
    </div>
  );
}

function DHDetailModal({ dh, onClose, onEdit }: { dh: DonHang; onClose: () => void; onEdit?: (dh: DonHang) => void }) {
  const [printing, setPrinting] = useState(false);
  // Migrate neu order cu (khong co items) - dung useMemo de tranh tao object moi moi render (gây React #321)
  const dhMigrated = useMemo(
    () => (!dh.items || dh.items.length === 0) ? migrateOldOrder(dh) : dh,
    [dh]
  );
  const items = dhMigrated.items.map((it) => ({
    id: it.id,
    sku: it.sku || it.spId,
    name: it.spTen,
    type: dh.loai,
    quantity: it.soLuong,
    unitPrice: it.donGia,
    total: it.thanhTien,
  }));

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="card max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <OrderHeader order={dhMigrated} onClose={onClose} />
          <div className="space-y-4 text-sm">
            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setPrinting(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                In hóa đơn A4
              </button>
              {onEdit && (
                <button
                  onClick={() => { onEdit(dhMigrated); onClose(); }}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-700 hover:bg-sky-500/25 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Sửa đơn
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
              <OrderItemsTable items={items} />
              <OrderCustomer order={dhMigrated} />
            </div>

            {/* Thanh toán multi-method */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  Thanh toán ({dhMigrated.payments.length} lần)
                </h3>
                <div className="text-xs">
                  <span className="opacity-70">Trạng thái: </span>
                  <span className={`font-bold ${
                    dhMigrated.trangThaiThanhToan === "thanh-toan-du" ? "text-emerald-600" :
                    dhMigrated.trangThaiThanhToan === "thanh-toan-mot-phan" ? "text-amber-600" :
                    "text-rose-600"
                  }`}>
                    {dhMigrated.trangThaiThanhToan === "thanh-toan-du" ? "Đã thanh toán đủ" :
                     dhMigrated.trangThaiThanhToan === "thanh-toan-mot-phan" ? "Thanh toán một phần" :
                     "Chưa thanh toán"}
                  </span>
                </div>
              </div>
              {dhMigrated.payments.length === 0 ? (
                <div className="text-xs text-slate-500 italic">Chưa có thanh toán nào</div>
              ) : (
                <div className="space-y-1.5">
                  {dhMigrated.payments.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-xs bg-white dark:bg-slate-800 px-3 py-1.5 rounded">
                      <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-700 rounded font-semibold">
                        {PHUONG_THUC_THANH_TOAN_LABELS[p.phuongThuc]}
                      </span>
                      <span className="opacity-70">{p.ngayThanhToan}</span>
                      {p.nganHang && <span className="opacity-70">· {p.nganHang}</span>}
                      {p.maGiaoDich && <code className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1 rounded">{p.maGiaoDich}</code>}
                      <span className="ml-auto font-bold text-emerald-600 dark:text-emerald-400">
                        {formatVND(p.soTien)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vận chuyển */}
            <div className="p-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg">
              <h3 className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5 mb-2">
                <Truck className="w-4 h-4" />
                Vận chuyển
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div><span className="opacity-70">Phương thức:</span> <b>{PHUONG_THUC_VAN_CHUYEN_LABELS[dhMigrated.shipping.phuongThuc]}</b></div>
                <div><span className="opacity-70">Phí:</span> <b>{formatVND(dhMigrated.shipping.phiVanChuyen || 0)}</b></div>
                <div><span className="opacity-70">Trạng thái:</span> <b>{TRANG_THAI_VAN_CHUYEN_LABELS[dhMigrated.shipping.trangThai]}</b></div>
                {dhMigrated.shipping.maVanDon && <div><span className="opacity-70">Mã vận đơn:</span> <code className="bg-white dark:bg-slate-800 px-1 rounded">{dhMigrated.shipping.maVanDon}</code></div>}
                {dhMigrated.shipping.diaChiGiao && <div className="col-span-2"><span className="opacity-70">Địa chỉ:</span> {dhMigrated.shipping.diaChiGiao}</div>}
                {dhMigrated.shipping.ghiChu && <div className="col-span-2 italic opacity-80">{dhMigrated.shipping.ghiChu}</div>}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4">
              <OrderTimeline order={dhMigrated} />
              <OrderSummary order={dhMigrated} />
            </div>
            <div className="bg-brand-500/10 rounded p-3 text-xs">
              <div className="font-semibold mb-1">Workflow hiện tại: {dh.trangThai}</div>
              <div className="opacity-70">Luồng chuẩn: Mới → Đã duyệt → Đang SX → Hoàn thành → Đã giao</div>
            </div>
          </div>
        </div>
      </div>

      {printing && (
        <InvoicePrint
          order={dhMigrated}
          onClose={() => setPrinting(false)}
        />
      )}
    </>
  );
}

