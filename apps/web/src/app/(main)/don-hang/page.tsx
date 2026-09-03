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
      <div className="flex flex-wrap items-start justify-between gap-3">
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

      {/* Table & Mobile Cards */}
      <div className="card overflow-hidden">
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-left border-b bg-slate-50" style={{ borderColor: "var(--border)" }}>
                <th className="p-3 font-semibold">Mã ĐH</th>
                <th className="p-3 font-semibold">Khách hàng</th>
                <th className="p-3 font-semibold text-right">Tổng tiền</th>
                <th className="p-3 font-semibold text-right">Còn nợ</th>
                <th className="p-3 font-semibold text-center">Tiến độ</th>
                <th className="p-3 font-semibold">Vận chuyển</th>
                <th className="p-3 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const s = TRANG_THAI_STYLE[d.trangThai];
                const Icon = s.icon;
                const tongTien = calcTongTien(d);
                const daTra = calcDaThanhToan(d);
                const conNo = tongTien - daTra;

                return (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3">
                      <div className="font-mono text-brand-700 font-bold">{d.maDH}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {d.ngayDat}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{d.khachHang}</div>
                      <div className="text-xs text-slate-500">{d.sdt}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-bold text-emerald-600">{tongTien.toLocaleString()}đ</div>
                      <div className="text-[10px] text-slate-500">Đã thu: {daTra.toLocaleString()}đ</div>
                    </td>
                    <td className="p-3 text-right">
                      {conNo > 0 ? (
                        <div className="font-bold text-amber-600">{conNo.toLocaleString()}đ</div>
                      ) : (
                        <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">Đã thanh toán đủ</div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleAdvanceStatus(d)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.color} hover:brightness-95 transition-all`} title="Click để chuyển trạng thái">
                        <Icon className="w-3.5 h-3.5" /> {d.trangThai}
                      </button>
                    </td>
                    <td className="p-3">
                      {d.shipping ? (
                        <div className="text-xs">
                          <div className="font-semibold text-slate-700 uppercase">{d.shipping.phuongThuc}</div>
                          <div className="text-slate-500">{d.shipping.trangThai}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">Chưa có</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setShowInvoice(d)} className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors" title="In hoá đơn">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => setShowPayment(d)} className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Ghi thanh toán">
                          <Wallet className="w-4 h-4" />
                        </button>
                        <button onClick={() => setShowShipping(d)} className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors" title="Vận chuyển">
                          <Truck className="w-4 h-4" />
                        </button>
                        <button onClick={() => setShowMeInvoice(d)} className="p-1.5 text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors" title="🧾 Phát hành HĐĐT MeInvoice">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button onClick={() => setShowForm({ mode: "edit", dh: d })} className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors" title="Sửa đơn">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(d)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Xoá đơn">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Không tìm thấy đơn hàng nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col gap-2 p-2">
          {filtered.map((d) => {
            const s = TRANG_THAI_STYLE[d.trangThai];
            const Icon = s.icon;
            const tongTien = calcTongTien(d);
            const daTra = calcDaThanhToan(d);
            const conNo = tongTien - daTra;

            return (
              <div key={d.id} className="bg-white border rounded-xl p-3 shadow-sm flex flex-col gap-2 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-brand-700 font-bold">{d.maDH}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {d.ngayDat}
                    </div>
                  </div>
                  <button onClick={() => handleAdvanceStatus(d)} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.color}`}>
                    <Icon className="w-3 h-3" /> {d.trangThai}
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <div className="text-sm font-semibold text-slate-800">{d.khachHang}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-lg">
                  <div>
                    <span className="text-slate-500 block">Tổng tiền</span>
                    <span className="font-bold text-emerald-600">{tongTien.toLocaleString()}đ</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block">Còn nợ</span>
                    {conNo > 0 ? (
                      <span className="font-bold text-amber-600">{conNo.toLocaleString()}đ</span>
                    ) : (
                      <span className="font-semibold text-emerald-600">Đã TT đủ</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-1 border-t pt-2">
                  <div className="text-xs">
                    {d.shipping ? (
                      <span className="text-slate-600 font-medium">{d.shipping.trangThai}</span>
                    ) : (
                      <span className="text-slate-400">Chưa giao hàng</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowInvoice(d)} className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded" title="In hoá đơn">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowPayment(d)} className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Ghi thanh toán">
                      <Wallet className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowShipping(d)} className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded" title="Vận chuyển">
                      <Truck className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowForm({ mode: "edit", dh: d })} className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded" title="Sửa đơn">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Không tìm thấy đơn hàng nào.
            </div>
          )}
        </div>
      </div>

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
