"use client";

import { useState, useMemo } from "react";
import {
  ShoppingCart, Plus, Edit2, Trash2, Search, X, Calendar, Package, CheckCircle2, Clock,
  AlertCircle, TrendingUp, DollarSign, User as UserIcon, ChevronRight, Printer, Wallet, Truck,
  FileText, Users, ShoppingBag, ClipboardList, Factory,
} from "lucide-react";
import { toast } from "sonner";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { useDonHang, calcTongTien, calcDaThanhToan, calcConLai } from "@/lib/data/don-hang-store";
import { useKhachHang } from "@/lib/data/khach-hang-store";
import OrderFormModal from "@/components/order-detail/OrderFormModal";
import InvoicePrint from "@/components/order-detail/InvoicePrint";
import QuickPaymentModal from "@/components/order-detail/QuickPaymentModal";
import ShippingModal from "@/components/order-detail/ShippingModal";
import MeInvoicePublishModal from "@/components/order-detail/MeInvoicePublishModal";
import type { Order, OrderPayment, OrderShipping, TepKhachHang } from "@/components/order-detail/types";
import { TEP_KHACH_HANG_LABELS } from "@/components/order-detail/types";
import { detectTepKhachHang } from "@/components/order-detail/helpers";

type TrangThaiDH = Order["trangThai"];

const TRANG_THAI_STYLE: Record<TrangThaiDH, { color: string; bg: string; icon: any }> = {
  "Mới": { color: "text-sky-700", bg: "bg-sky-500/15", icon: Plus },
  "Đã duyệt": { color: "text-violet-700", bg: "bg-violet-500/15", icon: CheckCircle2 },
  "Đang SX": { color: "text-amber-700", bg: "bg-amber-500/15", icon: Clock },
  "Hoàn thành": { color: "text-emerald-700", bg: "bg-emerald-500/15", icon: CheckCircle2 },
  "Đã giao": { color: "text-green-700", bg: "bg-green-500/15", icon: CheckCircle2 },
  "Hủy": { color: "text-red-700", bg: "bg-red-500/15", icon: X },
};

const TEP_STYLE: Record<TepKhachHang, { label: string; icon: any; color: string; bg: string; border: string }> = {
  "don-hang-dat": {
    label: "Đơn hàng đặt",
    icon: ClipboardList,
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-500/10 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-800",
  },
  "don-ban-khach": {
    label: "Đơn bán khách",
    icon: ShoppingBag,
    color: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-500/10 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-800",
  },
  "don-san-xuat": {
    label: "Đơn sản xuất cho khách",
    icon: Factory,
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-500/10 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
};

export default function DonHangPage() {
  const { dsOrder, loading, themOrder, suaOrder, xoaOrder, themThanhToan, capNhatVanChuyen, doiTrangThai } = useDonHang();
  const { list: khList } = useKhachHang();
  
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | TrangThaiDH>("all");
  const [tepFilter, setTepFilter] = useState<"all" | TepKhachHang>("all");
  
  const [showForm, setShowForm] = useState<{ mode: "add" | "edit"; dh?: Order } | null>(null);
  const [showPayment, setShowPayment] = useState<Order | null>(null);
  const [showShipping, setShowShipping] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState<Order | null>(null);
  const [showMeInvoice, setShowMeInvoice] = useState<{order: Order, provider: "misa" | "wininvoice"} | null>(null);

  // KPIs
  const tongDH = dsOrder.length;
  const dsHopLe = useMemo(() => dsOrder.filter((d) => d.trangThai !== "Hủy"), [dsOrder]);
  const tongDoanhThu = useMemo(() => dsHopLe.reduce((s, d) => s + calcTongTien(d), 0), [dsHopLe]);
  const tongCoc = useMemo(() => dsHopLe.reduce((s, d) => s + calcDaThanhToan(d), 0), [dsHopLe]);
  // Còn thiếu (Công nợ cần thu): BẮT BUỘC bằng tổng công nợ còn lại của từng đơn hợp lệ cộng lại
  const conLai = useMemo(() => dsHopLe.reduce((s, d) => s + calcConLai(d), 0), [dsHopLe]);
  const tyLeThu = tongDoanhThu > 0 ? Math.min(100, Math.round((tongCoc / tongDoanhThu) * 100)) : 0;
  const soDonDaGiao = dsOrder.filter((d) => d.trangThai === "Đã giao").length;
  const dsMoi = dsOrder.filter((d) => d.trangThai === "Mới");
  const dsDangSX = dsOrder.filter((d) => d.trangThai === "Đang SX" || d.trangThai === "Đã duyệt");
  
  const dsSapGiao = dsOrder.filter((d) => {
    const today = new Date();
    const ngayGiao = new Date(d.ngayGiao);
    const diff = (ngayGiao.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return d.trangThai !== "Đã giao" && d.trangThai !== "Hủy" && diff <= 7 && diff >= 0;
  });

  // Số lượng đơn theo từng tệp khách hàng
  const tepCounts = useMemo(() => {
    let countDat = 0;
    let countBan = 0;
    let countSX = 0;
    for (const d of dsOrder) {
      const tep = detectTepKhachHang(d, khList);
      if (tep === "don-hang-dat") countDat++;
      else if (tep === "don-ban-khach") countBan++;
      else if (tep === "don-san-xuat") countSX++;
    }
    return {
      all: dsOrder.length,
      "don-hang-dat": countDat,
      "don-ban-khach": countBan,
      "don-san-xuat": countSX,
    };
  }, [dsOrder, khList]);

  // Danh sách đơn theo tệp đang chọn (dùng cho đếm số lượng trạng thái)
  const dsTheoTep = useMemo(() => {
    if (tepFilter === "all") return dsOrder;
    return dsOrder.filter((d) => detectTepKhachHang(d, khList) === tepFilter);
  }, [dsOrder, tepFilter, khList]);

  // Filter kết hợp cả: Tìm kiếm + Trạng thái + Tệp khách hàng
  const filtered = useMemo(() => {
    return dsOrder.filter((d) => {
      const matchSearch = [d.maDH, d.khachHang, d.sanPham, d.sdt].some((x) =>
        (x || "").toLowerCase().includes(search.toLowerCase())
      );
      const matchStatus = filter === "all" || d.trangThai === filter;
      const matchTep = tepFilter === "all" || detectTepKhachHang(d, khList) === tepFilter;
      return matchSearch && matchStatus && matchTep;
    });
  }, [dsOrder, search, filter, tepFilter, khList]);

  const handleCycleTep = (dh: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const orderFlow: TepKhachHang[] = ["don-ban-khach", "don-hang-dat", "don-san-xuat"];
    const currentTep = detectTepKhachHang(dh, khList);
    const currIdx = orderFlow.indexOf(currentTep);
    const nextTep = orderFlow[(currIdx + 1) % orderFlow.length];
    suaOrder(dh.id, { tepKhachHang: nextTep });
    toast.success(`Đơn ${dh.maDH}: đã chuyển sang "${TEP_KHACH_HANG_LABELS[nextTep]}"`);
  };

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
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all">
        {/* Glow ambient background accents */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                Hệ thống Quản lý Đơn hàng MIMIN
              </span>
              {loading && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs text-brand-600 bg-brand-50 border border-brand-200 animate-pulse">
                  <span className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  Đang đồng bộ...
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Đơn hàng & Doanh số
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Theo dõi đơn hàng, dòng tiền thực thu và công nợ khách hàng theo thời gian thực
                </p>
              </div>
            </div>

            {/* Quick summary badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                📦 {tongDH} đơn hàng
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                💰 Doanh thu: {formatVNDShort(tongDoanhThu)}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                💳 Đã thu: {formatVNDShort(tongCoc)} ({tyLeThu}%)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                ⏳ Còn thiếu: {formatVNDShort(conLai)}
              </span>
              {tepFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  🎯 Đang lọc: {TEP_KHACH_HANG_LABELS[tepFilter]}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowForm({ mode: "add" })}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 hover:from-teal-700 hover:via-teal-600 hover:to-cyan-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            Tạo đơn hàng mới
          </button>
        </div>
      </div>

      {/* DASHBOARD KPIS (6 Ô RÕ RÀNG TỪNG SỐ LIỆU) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Tổng đơn hàng */}
        <div className="card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tổng đơn</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 group-hover:scale-110 transition">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {tongDH} <span className="text-xs font-bold text-slate-400 font-normal">đơn</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span>{dsMoi.length} mới · {soDonDaGiao} đã giao</span>
          </div>
        </div>

        {/* KPI 2: Tổng Doanh thu */}
        <div className="card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition group" title={`Tổng doanh thu chính xác: ${formatVND(tongDoanhThu)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Doanh thu</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatVNDShort(tongDoanhThu)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Chưa tính đơn hủy</span>
          </div>
        </div>

        {/* KPI 3: Đã thu tiền (Thực thu) */}
        <div className="card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-cyan-400 dark:hover:border-cyan-600 transition group" title={`Đã thu thực tế: ${formatVND(tongCoc)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">Đã thu</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-100 dark:border-cyan-900/50 group-hover:scale-110 transition">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight">
            {formatVNDShort(tongCoc)}
          </div>
          {/* Mini progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${tyLeThu}%` }} />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Tiến độ thu:</span>
            <span className="font-bold text-cyan-700 dark:text-cyan-300">{tyLeThu}%</span>
          </div>
        </div>

        {/* KPI 4: Công nợ còn thiếu (Cần thu) */}
        <div className={`card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border shadow-sm hover:shadow-md transition group ${
          conLai > 0 ? "border-amber-200/90 dark:border-amber-900/60 hover:border-amber-400" : "border-slate-200/80 dark:border-slate-800"
        }`} title={`Công nợ còn thiếu: ${formatVND(conLai)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Còn thiếu</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 group-hover:scale-110 transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black tracking-tight ${conLai > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {formatVNDShort(conLai)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
            <span className={`w-1.5 h-1.5 rounded-full ${conLai > 0 ? "bg-amber-500" : "bg-emerald-500"} shrink-0`} />
            <span>{conLai > 0 ? `${dsHopLe.filter(d => calcConLai(d) > 0).length} đơn chưa thu đủ` : "Đã thu đủ 100%"}</span>
          </div>
        </div>

        {/* KPI 5: Đang sản xuất */}
        <div className="card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-400 dark:hover:border-purple-600 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Đang SX</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 group-hover:scale-110 transition">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-300 tracking-tight">
            {dsDangSX.length} <span className="text-xs font-bold text-slate-400 font-normal">đơn</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
            <span>{dsOrder.filter(d => d.trangThai === "Đang SX").length} đang may · {dsOrder.filter(d => d.trangThai === "Đã duyệt").length} đã duyệt</span>
          </div>
        </div>

        {/* KPI 6: Sắp đến hạn giao */}
        <div className={`card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border shadow-sm hover:shadow-md transition group ${
          dsSapGiao.length > 0
            ? "border-rose-300 dark:border-rose-800/80 bg-rose-50/30 dark:bg-rose-950/20 hover:border-rose-500"
            : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${dsSapGiao.length > 0 ? "text-rose-700 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}>
              Sắp đến hạn
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition group-hover:scale-110 ${
              dsSapGiao.length > 0
                ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
            }`}>
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black tracking-tight ${dsSapGiao.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}`}>
            {dsSapGiao.length} <span className="text-xs font-bold text-slate-400 font-normal">đơn</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
            <span className={`w-1.5 h-1.5 rounded-full ${dsSapGiao.length > 0 ? "bg-rose-500" : "bg-emerald-500"} shrink-0`} />
            <span>Giao trong 7 ngày tới</span>
          </div>
        </div>
      </div>

      {/* Filters: 3 NÚT PHÂN LOẠI TỆP KHÁCH HÀNG + BỘ LỌC TRẠNG THÁI */}
      <div className="card p-4 space-y-3.5">
        {/* ROW 1: 3 NÚT PHÂN LOẠI TỆP KHÁCH HÀNG */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand-500" />
              Phân loại tệp khách hàng:
            </span>
            {tepFilter !== "all" && (
              <button
                onClick={() => setTepFilter("all")}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Xem tất cả tệp
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Nút Tất cả */}
            <button
              onClick={() => setTepFilter("all")}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between transition border-2 ${
                tepFilter === "all"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <Users className="w-4 h-4 shrink-0" />
                Tất cả tệp
              </span>
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                tepFilter === "all" ? "bg-white/20 text-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}>
                {tepCounts.all}
              </span>
            </button>

            {/* Nút 1: Đơn hàng đặt */}
            <button
              onClick={() => setTepFilter("don-hang-dat")}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between transition border-2 ${
                tepFilter === "don-hang-dat"
                  ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20"
                  : "bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60 hover:bg-purple-50/60 dark:hover:bg-purple-950/30"
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <ClipboardList className="w-4 h-4 shrink-0" />
                Đơn hàng đặt
              </span>
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                tepFilter === "don-hang-dat" ? "bg-white/20 text-white" : "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
              }`}>
                {tepCounts["don-hang-dat"]}
              </span>
            </button>

            {/* Nút 2: Đơn bán khách */}
            <button
              onClick={() => setTepFilter("don-ban-khach")}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between transition border-2 ${
                tepFilter === "don-ban-khach"
                  ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/20"
                  : "bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60 hover:bg-sky-50/60 dark:hover:bg-sky-950/30"
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <ShoppingBag className="w-4 h-4 shrink-0" />
                Đơn bán khách
              </span>
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                tepFilter === "don-ban-khach" ? "bg-white/20 text-white" : "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300"
              }`}>
                {tepCounts["don-ban-khach"]}
              </span>
            </button>

            {/* Nút 3: Đơn sản xuất cho khách */}
            <button
              onClick={() => setTepFilter("don-san-xuat")}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between transition border-2 ${
                tepFilter === "don-san-xuat"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                  : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30"
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <Factory className="w-4 h-4 shrink-0" />
                Đơn sản xuất cho khách
              </span>
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                tepFilter === "don-san-xuat" ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
              }`}>
                {tepCounts["don-san-xuat"]}
              </span>
            </button>
          </div>
        </div>

        {/* ROW 2: BỘ LỌC TRẠNG THÁI + TÌM KIẾM */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {([
              { id: "all", label: `Tất cả (${dsTheoTep.length})` },
              { id: "Mới", label: `Mới (${dsTheoTep.filter(d => d.trangThai === "Mới").length})`, danger: dsTheoTep.filter(d => d.trangThai === "Mới").length > 0 },
              { id: "Đã duyệt", label: `Đã duyệt (${dsTheoTep.filter(d => d.trangThai === "Đã duyệt").length})` },
              { id: "Đang SX", label: `Đang SX (${dsTheoTep.filter(d => d.trangThai === "Đang SX").length})` },
              { id: "Hoàn thành", label: `Hoàn thành (${dsTheoTep.filter(d => d.trangThai === "Hoàn thành").length})` },
              { id: "Đã giao", label: `Đã giao (${dsTheoTep.filter(d => d.trangThai === "Đã giao").length})` },
              { id: "Hủy", label: `Hủy (${dsTheoTep.filter(d => d.trangThai === "Hủy").length})` },
            ] as { id: "all" | TrangThaiDH; label: string; danger?: boolean }[]).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filter === f.id
                    ? f.danger ? "bg-sky-500 text-white shadow-sm" : "bg-brand-500 text-white shadow-sm"
                    : f.danger ? "bg-sky-500/10 text-sky-700 hover:bg-sky-500/20" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative max-w-md w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input className="input pl-9 w-full text-xs" placeholder="Tìm mã ĐH, KH, SĐT..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unified Card List */}
      <div className="flex flex-col gap-4">
        {filtered.map((d) => {
          const s = TRANG_THAI_STYLE[d.trangThai] || TRANG_THAI_STYLE["Mới"];
          const Icon = s.icon;
          const tongTien = calcTongTien(d);
          const daTra = calcDaThanhToan(d);
          const conNo = calcConLai(d);

          const tep = detectTepKhachHang(d, khList);
          const tStyle = TEP_STYLE[tep] || TEP_STYLE["don-ban-khach"];
          const TepIcon = tStyle.icon;

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
                    {/* Badge Phân loại tệp khách hàng */}
                    <button
                      type="button"
                      onClick={(e) => handleCycleTep(d, e)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${tStyle.bg} ${tStyle.color} border ${tStyle.border} hover:opacity-85 transition-all shrink-0`}
                      title="Click để chuyển đổi phân loại tệp khách hàng"
                    >
                      <TepIcon className="w-3 h-3" /> {tStyle.label}
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
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span>Tổng tiền</span>
                    {d.thueVAT ? <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold ml-1">(+{d.thueVAT}% VAT)</span> : null}
                  </div>
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
                  <button onClick={() => setShowMeInvoice({order: d, provider: "misa"})} className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors" title="Phát hành HĐĐT MeInvoice">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowMeInvoice({order: d, provider: "wininvoice"})} className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors" title="Phát hành HĐĐT WinInvoice">
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
          isNewOrder={showForm.mode === "add"}
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
          order={showMeInvoice.order}
          defaultProvider={showMeInvoice.provider}
          onClose={() => setShowMeInvoice(null)}
          onSuccess={() => {
            // Optional: refresh data
          }}
        />
      )}
    </div>
  );
}
