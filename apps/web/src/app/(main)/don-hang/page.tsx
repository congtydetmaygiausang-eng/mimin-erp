"use client";

import { useState, useMemo } from "react";
import {
  ShoppingCart, Plus, Edit2, Trash2, Search, X, Calendar, Package, CheckCircle2, Clock,
  AlertCircle, TrendingUp, DollarSign, User as UserIcon, ChevronRight, Printer, Wallet, Truck,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { useDonHang, calcTongTien, calcDaThanhToan, calcConLai } from "@/lib/data/don-hang-store";
import OrderFormModal from "@/components/order-detail/OrderFormModal";
import InvoicePrint from "@/components/order-detail/InvoicePrint";
import QuickPaymentModal from "@/components/order-detail/QuickPaymentModal";
import ShippingModal from "@/components/order-detail/ShippingModal";
import MeInvoicePublishModal from "@/components/order-detail/MeInvoicePublishModal";
import type { Order, OrderPayment, OrderShipping } from "@/components/order-detail/types";

type TrangThaiDH = Order["trangThai"];

const TRANG_THAI_STYLE: Record<TrangThaiDH, { color: string; bg: string; icon: any }> = {
  "Mới": { color: "text-sky-700", bg: "bg-sky-500/15", icon: Plus },
  "Đã duyệt": { color: "text-violet-700", bg: "bg-violet-500/15", icon: CheckCircle2 },
  "Đang SX": { color: "text-amber-700", bg: "bg-amber-500/15", icon: Clock },
  "Hoàn thành": { color: "text-emerald-700", bg: "bg-emerald-500/15", icon: CheckCircle2 },
  "Đã giao": { color: "text-green-700", bg: "bg-green-500/15", icon: CheckCircle2 },
  "Hủy": { color: "text-red-700", bg: "bg-red-500/15", icon: X },
};

export default function DonHangPage() {
  const { dsOrder, loading, themOrder, suaOrder, xoaOrder, themThanhToan, capNhatVanChuyen, doiTrangThai } = useDonHang();
  
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | TrangThaiDH>("all");
  
  const [showForm, setShowForm] = useState<{ mode: "add" | "edit"; dh?: Order } | null>(null);
  const [showPayment, setShowPayment] = useState<Order | null>(null);
  const [showShipping, setShowShipping] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState<Order | null>(null);
  const [showMeInvoice, setShowMeInvoice] = useState<Order | null>(null);

  // KPIs
  const tongDH = dsOrder.length;
  const tongDoanhThu = dsOrder.filter((d) => d.trangThai !== "Hủy").reduce((s, d) => s + calcTongTien(d), 0);
  const tongCoc = dsOrder.reduce((s, d) => s + calcDaThanhToan(d), 0);
  const conLai = tongDoanhThu - tongCoc;
  const dsMoi = dsOrder.filter((d) => d.trangThai === "Mới");
  const dsDangSX = dsOrder.filter((d) => d.trangThai === "Đang SX" || d.trangThai === "Đã duyệt");
  
  const dsSapGiao = dsOrder.filter((d) => {
    const today = new Date();
    const ngayGiao = new Date(d.ngayGiao);
    const diff = (ngayGiao.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return d.trangThai !== "Đã giao" && d.trangThai !== "Hủy" && diff <= 7 && diff >= 0;
  });

  // Filter
  const filtered = dsOrder.filter((d) => {
    const matchSearch = [d.maDH, d.khachHang, d.sanPham, d.sdt].some((x) => (x || "").toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "all" || d.trangThai === filter;
    return matchSearch && matchFilter;
  });

  const handleSaveForm = (order: Order) => {
    if (showForm?.mode === "add") {
      themOrder(order);
      toast.success(`Đã tạo đơn hàng: ${order.maDH}`);
    } else if (showForm?.mode === "edit") {
      suaOrder(order.id, order);
      toast.success(`Đã cập nhật: ${order.maDH}`);
    }
    setShowForm(null);
  };

  const handleDelete = (dh: Order) => {
    if (confirm(`Xoá đơn hàng "${dh.maDH}"?`)) {
      xoaOrder(dh.id);
      toast.success(`Đã xoá: ${dh.maDH}`);
    }
  };

  const handleAdvanceStatus = (dh: Order) => {
    const flow: TrangThaiDH[] = ["Mới", "Đã duyệt", "Đang SX", "Hoàn thành", "Đã giao"];
    const idx = flow.indexOf(dh.trangThai);
    if (idx < 0 || idx >= flow.length - 1) {
      toast.info("Đơn hàng đã ở trạng thái cuối");
      return;
    }
    const newTrangThai = flow[idx + 1];
    // Đổi trạng thái tay ở đây KHÔNG đụng đến công nợ/thanh toán (chỉ themThanhToan
    // mới trừ công nợ). Cảnh báo để không hiểu nhầm "Hoàn thành" = đã thu đủ tiền.
    const conLai = calcConLai(dh);
    if (newTrangThai === "Hoàn thành" && conLai > 0) {
      toast.warning(
        `Đơn ${dh.maDH} còn nợ ${formatVNDShort(conLai)} chưa thu. Đánh dấu "Hoàn thành" không tự trừ công nợ khách hàng - chỉ ghi nhận thanh toán mới trừ.`,
        { duration: 8000 }
      );
    }
    doiTrangThai(dh.id, newTrangThai);
    toast.success(`Đã chuyển: ${dh.trangThai} → ${newTrangThai}`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-brand-500" />
            Đơn hàng
            {loading && <span className="ml-3 w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></span>}
          </h1>
          <p className="opacity-70 mt-1 text-sm">
            {tongDH} đơn · Tổng DT <b className="text-emerald-600">{formatVNDShort(tongDoanhThu)}</b> · Đã thu <b className="text-sky-600">{formatVNDShort(tongCoc)}</b> · Còn thiếu <b className="text-amber-600">{formatVNDShort(conLai)}</b>
          </p>
        </div>
        <button onClick={() => setShowForm({ mode: "add" })} className="btn-primary flex items-center gap-2 shadow-sm">
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
            { id: "all", label: `Tất cả (${dsOrder.length})` },
            { id: "Mới", label: `Mới (${dsMoi.length})`, danger: dsMoi.length > 0 },
            { id: "Đã duyệt", label: `Đã duyệt (${dsOrder.filter(d => d.trangThai === "Đã duyệt").length})` },
            { id: "Đang SX", label: `Đang SX (${dsOrder.filter(d => d.trangThai === "Đang SX").length})` },
            { id: "Hoàn thành", label: `Hoàn thành (${dsOrder.filter(d => d.trangThai === "Hoàn thành").length})` },
            { id: "Đã giao", label: `Đã giao (${dsOrder.filter(d => d.trangThai === "Đã giao").length})` },
            { id: "Hủy", label: `Hủy (${dsOrder.filter(d => d.trangThai === "Hủy").length})` },
          ] as { id: "all" | TrangThaiDH; label: string; danger?: boolean }[]).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                filter === f.id
                  ? f.danger ? "bg-sky-500 text-white" : "bg-brand-500 text-white shadow-sm"
                  : f.danger ? "bg-sky-500/10 text-sky-700 hover:bg-sky-500/20" : "bg-white/40 hover:bg-white/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input className="input pl-9 w-full" placeholder="Tìm mã ĐH, KH, SĐT..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Unified Card List */}
      <div className="flex flex-col gap-4">
        {filtered.map((d) => {
          const s = TRANG_THAI_STYLE[d.trangThai] || TRANG_THAI_STYLE["Mới"];
          const Icon = s.icon;
          const tongTien = calcTongTien(d);
          const daTra = calcDaThanhToan(d);
          const conNo = tongTien - daTra;

          return (
            <div key={d.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 relative group">
              {/* Customer & Order Info */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-mono text-lg text-brand-600 dark:text-brand-400 font-bold truncate">{d.maDH}</div>
                    <button onClick={() => handleAdvanceStatus(d)} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${s.bg} ${s.color} hover:brightness-95 transition-all shadow-sm shrink-0`} title="Click để chuyển trạng thái">
                      <Icon className="w-3 h-3" /> {d.trangThai}
                    </button>
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                    {d.khachHang} <span className="text-slate-500 font-normal ml-1">({d.sdt})</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <Calendar className="w-3.5 h-3.5" /> {d.ngayDat}
                  </div>
                </div>
              </div>
              
              {/* Financials */}
              <div className="flex gap-4 shrink-0 lg:w-auto">
                <div className="flex flex-col gap-1 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-900/10 flex-1 lg:flex-initial min-w-[120px]">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng tiền</span>
                  <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">{tongTien.toLocaleString()}đ</span>
                </div>
                <div className="flex flex-col gap-1 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 bg-amber-50/50 dark:bg-amber-900/10 flex-1 lg:flex-initial min-w-[120px]">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Còn nợ</span>
                  {conNo > 0 ? (
                    <span className="font-bold text-base text-amber-600 dark:text-amber-400">{conNo.toLocaleString()}đ</span>
                  ) : (
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Đã thu đủ</span>
                  )}
                </div>
              </div>

              {/* Shipping & Actions */}
              <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 lg:w-auto border-t lg:border-t-0 border-slate-100 dark:border-slate-700 pt-3 lg:pt-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                  <Truck className="w-3.5 h-3.5 shrink-0" />
                  {d.shipping ? (
                    <span className="font-medium text-slate-700 dark:text-slate-300 line-clamp-1">{d.shipping.trangThai}</span>
                  ) : (
                    <span>Chưa giao</span>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => setShowInvoice(d)} className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors" title="In hoá đơn">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowPayment(d)} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title="Ghi thanh toán">
                    <Wallet className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowShipping(d)} className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors" title="Vận chuyển">
                    <Truck className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowMeInvoice(d)} className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors" title="Phát hành HĐĐT MeInvoice">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowForm({ mode: "edit", dh: d })} className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors" title="Sửa đơn">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(d)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" title="Xoá đơn">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
        {filtered.length === 0 && (
          <div className="col-span-full p-12 flex flex-col items-center justify-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <ShoppingCart className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
            <div className="text-base font-medium">Không tìm thấy đơn hàng nào phù hợp</div>
            <div className="text-sm opacity-70 mt-1">Hãy thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</div>
          </div>
        )}
      {/* Modals */}
      {showForm && (
        <OrderFormModal
          open={!!showForm}
          initial={showForm.dh}
          onClose={() => setShowForm(null)}
          onSave={handleSaveForm}
        />
      )}

      {showPayment && (
        <QuickPaymentModal
          order={showPayment}
          onClose={() => setShowPayment(null)}
          onSave={(payment) => {
            themThanhToan(showPayment.id, payment);
            toast.success("Đã ghi nhận thanh toán");
            setShowPayment(null);
          }}
        />
      )}

      {showShipping && (
        <ShippingModal
          order={showShipping}
          onClose={() => setShowShipping(null)}
          onSave={(shipping) => {
            capNhatVanChuyen(showShipping.id, shipping);
            toast.success("Đã cập nhật vận chuyển");
            setShowShipping(null);
          }}
        />
      )}

      {showInvoice && (
        <InvoicePrint
          order={showInvoice}
          onClose={() => setShowInvoice(null)}
        />
      )}

      {showMeInvoice && (
        <MeInvoicePublishModal
          order={showMeInvoice}
          onClose={() => setShowMeInvoice(null)}
          onSuccess={() => {
            // Optional: refresh data
          }}
        />
      )}
    </div>
  );
}
