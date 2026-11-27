"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Truck, MapPin, Calendar, Package, Phone, CheckCircle2, Clock, AlertCircle,
  Search, X, Printer, ArrowUpRight, Copy, Check, Filter, RefreshCw, Send,
  ChevronRight, ShoppingBag, ExternalLink, ShieldCheck, Box, Navigation
} from "lucide-react";
import { toast } from "sonner";
import { useDonHang } from "@/lib/data/don-hang-store";
import type { Order, OrderShipping, PhuongThucVanChuyen, TrangThaiVanChuyen } from "@/components/order-detail/types";
import { PHUONG_THUC_VAN_CHUYEN_LABELS } from "@/components/order-detail/types";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import ShippingModal from "@/components/order-detail/ShippingModal";
import DeliveryNotePrint from "@/components/order-detail/DeliveryNotePrint";

type DeliveryFilterTab = "all" | "da-giao" | "cho-xuat" | "dang-giao" | "dang-sx" | "sap-giao";

export default function GiaoHangPage() {
  const { dsOrder, loading, capNhatVanChuyen, doiTrangThai, suaOrder } = useDonHang();

  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState<DeliveryFilterTab>("all");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Modals
  const [shippingModalOrder, setShippingModalOrder] = useState<Order | null>(null);
  const [printDeliveryOrder, setPrintDeliveryOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lọc danh sách giao hàng: Bỏ đơn Hủy
  const deliveryList = useMemo(() => {
    return dsOrder.filter((o) => o.trangThai !== "Hủy");
  }, [dsOrder]);

  // Helper kiểm tra đơn đã giao thành công
  const isDelivered = (o: Order) => {
    return o.trangThai === "Đã giao" || o.shipping?.trangThai === "da-giao";
  };

  // Helper kiểm tra đơn đang giao
  const isShippingOut = (o: Order) => {
    return o.shipping?.trangThai === "dang-giao";
  };

  // Helper kiểm tra đơn kho đã xuất chờ đi
  const isReadyToShip = (o: Order) => {
    return !isDelivered(o) && !isShippingOut(o) && (o.trangThai === "Hoàn thành" || o.shipping?.trangThai === "cho-lay-hang");
  };

  // Helper kiểm tra đơn đang SX
  const isProducing = (o: Order) => {
    return !isDelivered(o) && (o.trangThai === "Đang SX" || o.trangThai === "Đã duyệt" || o.trangThai === "Mới");
  };

  // Helper kiểm tra đơn gấp trong 7 ngày
  const isUrgent = (o: Order) => {
    if (isDelivered(o)) return false;
    const targetDate = o.ngayGiao || o.shipping?.ngayGiaoDuKien;
    if (!targetDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dGiao = new Date(targetDate);
    const diffDays = Math.ceil((dGiao.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // Thống kê KPIs
  const tongLo = deliveryList.length;
  const daGiao = deliveryList.filter(isDelivered).length;
  const dangGiao = deliveryList.filter(isShippingOut).length;
  const choXuatKho = deliveryList.filter(isReadyToShip).length;
  const dangSX = deliveryList.filter(isProducing).length;
  const soDonGap = deliveryList.filter(isUrgent).length;
  const tyLeGiao = tongLo > 0 ? Math.round((daGiao / tongLo) * 100) : 0;

  // Lọc dữ liệu hiển thị
  const filteredList = useMemo(() => {
    return deliveryList.filter((g) => {
      // 1. Tìm kiếm
      const q = search.trim().toLowerCase();
      const matchSearch = !q || [
        g.maDH,
        g.khachHang,
        g.sdt,
        g.diaChi,
        g.shipping?.diaChiGiao,
        g.shipping?.maVanDon,
        g.sanPham,
      ].some((val) => (val || "").toLowerCase().includes(q));

      // 2. Tab Filter
      let matchTab = true;
      if (tabFilter === "da-giao") matchTab = isDelivered(g);
      else if (tabFilter === "cho-xuat") matchTab = isReadyToShip(g);
      else if (tabFilter === "dang-giao") matchTab = isShippingOut(g);
      else if (tabFilter === "dang-sx") matchTab = isProducing(g);
      else if (tabFilter === "sap-giao") matchTab = isUrgent(g);

      // 3. Carrier Filter
      let matchCarrier = true;
      if (carrierFilter !== "all") {
        matchCarrier = (g.shipping?.phuongThuc || "tu-giao") === carrierFilter;
      }

      return matchSearch && matchTab && matchCarrier;
    });
  }, [deliveryList, search, tabFilter, carrierFilter]);

  // Xử lý xác nhận đã giao thành công / hoàn tác
  const handleToggleDelivered = (order: Order) => {
    if (isDelivered(order)) {
      // Hoàn tác về trạng thái "Hoàn thành"
      doiTrangThai(order.id, "Hoàn thành");
      capNhatVanChuyen(order.id, { trangThai: "cho-xu-ly" as TrangThaiVanChuyen });
      toast.info(`Đã hoàn tác đơn ${order.maDH || order.id} về trạng thái Chờ xuất kho`);
    } else {
      // Xác nhận ĐÃ GIAO THÀNH CÔNG
      doiTrangThai(order.id, "Đã giao");
      capNhatVanChuyen(order.id, { trangThai: "da-giao" as TrangThaiVanChuyen });
      toast.success(`Đơn ${order.maDH || order.id}: Giao hàng thành công! Đã đồng bộ sang tab Đơn hàng.`);
    }
  };

  // Copy text nhanh
  const copyText = (txt: string, id: string) => {
    if (!txt) return;
    navigator.clipboard.writeText(txt);
    setCopiedId(id);
    toast.success(`Đã copy: ${txt}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* 1. HERO BANNER HEADER */}
      <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                Hệ thống Điều Phối & Giao Nhận POLOMIMIN
              </span>
              {loading && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs text-sky-600 bg-sky-50 border border-sky-200 animate-pulse">
                  <span className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                  Đang đồng bộ...
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/25">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Quản lý Giao hàng & Vận chuyển
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Theo dõi lịch giao, kiểm soát hãng vận chuyển và cập nhật trạng thái đơn hàng thành công hai chiều
                </p>
              </div>
            </div>

            {/* Quick summary badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                📦 {tongLo} đơn theo dõi
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ✓ {daGiao} đã giao thành công ({tyLeGiao}%)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                ⏳ {choXuatKho} kho đã xuất (chờ đi)
              </span>
              {dangGiao > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  🚚 {dangGiao} đang trên đường giao
                </span>
              )}
            </div>
          </div>

          {/* Quick links & actions */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/don-hang"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition"
            >
              <ShoppingBag className="w-4 h-4 text-slate-500" />
              Xem Tab Đơn hàng
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. 5 THẺ KPI THỐNG KÊ CHI TIẾT */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Tổng đơn theo dõi */}
        <div className="card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tổng theo dõi</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 group-hover:scale-110 transition">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {tongLo} <span className="text-xs font-bold text-slate-400 font-normal">đơn</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span>Toàn bộ đơn hàng hợp lệ</span>
          </div>
        </div>

        {/* KPI 2: Đã giao thành công */}
        <div className="card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm hover:shadow-md hover:border-emerald-400 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Giao thành công</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900/50 group-hover:scale-110 transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {daGiao} <span className="text-xs font-bold text-emerald-500/80 font-normal">đơn</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1 font-semibold truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Tỷ lệ hoàn thành: {tyLeGiao}%</span>
          </div>
        </div>

        {/* KPI 3: Kho đã xuất (Chờ đi) */}
        <div className="card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-sm hover:shadow-md hover:border-amber-400 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Kho xuất (Chờ đi)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900/50 group-hover:scale-110 transition">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {choXuatKho} <span className="text-xs font-bold text-amber-500/80 font-normal">đơn</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>Đã đóng gói xong</span>
          </div>
        </div>

        {/* KPI 4: Đang trên đường giao */}
        <div className="card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-sky-400 transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">Đang giao</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/50 group-hover:scale-110 transition">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 tracking-tight">
            {dangGiao} <span className="text-xs font-bold text-slate-400 font-normal">đơn</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
            <span>Tài xế đang vận chuyển</span>
          </div>
        </div>

        {/* KPI 5: Đang Sản Xuất (Chờ) */}
        <div className="card p-4 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-400 transition group col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Đang SX (Chờ)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-300 tracking-tight">
            {dangSX} <span className="text-xs font-bold text-slate-400 font-normal">đơn</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
            <span>Trên dây chuyền sản xuất</span>
          </div>
        </div>
      </div>

      {/* 3. THANH BỘ LỌC TABS & TÌM KIẾM & CHUYỂN VIEW MODE */}
      <div className="card p-4 space-y-3.5 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* ROW 1: TABS TRẠNG THÁI GIAO HÀNG */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar tab-scroll-mobile max-w-full pb-1">
            {[
              { id: "all", label: `Tất cả (${deliveryList.length})` },
              { id: "da-giao", label: `✓ Đã giao thành công (${daGiao})`, activeColor: "bg-emerald-600 text-white shadow-emerald-500/20" },
              { id: "cho-xuat", label: `📦 Chờ xuất kho (${choXuatKho})`, activeColor: "bg-amber-600 text-white shadow-amber-500/20" },
              { id: "dang-giao", label: `🚚 Đang giao (${dangGiao})`, activeColor: "bg-sky-600 text-white shadow-sky-500/20" },
              { id: "dang-sx", label: `⚙️ Đang SX (${dangSX})`, activeColor: "bg-purple-600 text-white shadow-purple-500/20" },
              { id: "sap-giao", label: `🔥 Giao gấp 7 ngày (${soDonGap})`, activeColor: "bg-rose-600 text-white shadow-rose-500/20" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabFilter(tab.id as DeliveryFilterTab)}
                className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  tabFilter === tab.id
                    ? tab.activeColor || "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Toggle View Mode */}
          <div className="shrink-0 ml-auto">
            <DataViewToggle value={viewMode} onChange={setViewMode} modes={["list", "card"]} />
          </div>
        </div>

        {/* ROW 2: TÌM KIẾM & BỘ LỌC ĐƠN VỊ VẬN CHUYỂN */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center gap-3">
          {/* Ô Tìm kiếm */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9 pr-8 w-full text-xs font-medium"
              placeholder="Tìm theo mã ĐH, khách hàng, số điện thoại, địa chỉ, mã vận đơn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lọc hãng vận chuyển */}
          <div className="w-full sm:w-64 shrink-0 flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="select w-full text-xs font-medium py-1.5"
            >
              <option value="all">Tất cả đơn vị vận chuyển</option>
              {Object.entries(PHUONG_THUC_VAN_CHUYEN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT: CHẾ ĐỘ XEM DANH SÁCH (TABLE) HOẶC THẺ (CARDS) */}
      {viewMode === "list" ? (
        /* TABLE VIEW */
        <div className="card overflow-hidden bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Đơn hàng</th>
                  <th className="p-3.5">Ngày hẹn giao</th>
                  <th className="p-3.5">Khách hàng & Địa chỉ</th>
                  <th className="p-3.5 text-right">Tổng SP</th>
                  <th className="p-3.5">Hàng hóa chi tiết</th>
                  <th className="p-3.5">Vận chuyển & Vận đơn</th>
                  <th className="p-3.5 text-center">Trạng thái giao hàng</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredList.map((g) => {
                  const delivered = isDelivered(g);
                  const tongSL = (g.items || []).reduce((sum, item) => sum + (item.soLuong || 0), 0) || g.soLuong || 0;
                  const spSummaries = (g.items || []).map((it) => `${it.soLuong} ${it.spTen || it.spId}${it.size ? ` (${it.size})` : ""}`).join(", ");
                  const summaryText = spSummaries || g.sanPham || "Hàng may mặc theo đơn";

                  const pthucVC = g.shipping?.phuongThuc
                    ? (PHUONG_THUC_VAN_CHUYEN_LABELS[g.shipping.phuongThuc] || g.shipping.phuongThuc)
                    : "Tự giao (POLOMIMIN)";

                  const diaChiHienThi = g.shipping?.diaChiGiao || g.diaChi || "Chưa có địa chỉ";
                  const maDisplay = g.maDH || `#DH-${g.id.slice(0, 8).toUpperCase()}`;

                  return (
                    <tr
                      key={g.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        delivered ? "bg-emerald-50/15 dark:bg-emerald-950/10" : ""
                      }`}
                    >
                      {/* Đơn hàng */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sm font-black text-sky-700 dark:text-sky-400">
                            {maDisplay}
                          </span>
                          <button
                            onClick={() => copyText(maDisplay, g.id + "-code")}
                            className="p-1 text-slate-400 hover:text-slate-600 transition"
                            title="Copy mã đơn"
                          >
                            {copiedId === g.id + "-code" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]" title={g.id}>
                          ID: {g.id}
                        </div>
                      </td>

                      {/* Ngày hẹn giao */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{g.ngayGiao || g.shipping?.ngayGiaoDuKien || g.ngayDat || "—"}</span>
                        </div>
                        {isUrgent(g) && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded mt-1">
                            <Clock className="w-2.5 h-2.5" /> Giao gấp
                          </div>
                        )}
                      </td>

                      {/* Khách hàng & Địa chỉ */}
                      <td className="p-3.5 max-w-[240px]">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {g.khachHang || "Khách lẻ"}
                        </div>
                        {g.sdt && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <a href={`tel:${g.sdt}`} className="hover:text-sky-600 font-medium hover:underline">
                              {g.sdt}
                            </a>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 flex items-start gap-1.5 mt-0.5" title={diaChiHienThi}>
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-tight">{diaChiHienThi}</span>
                          <button
                            onClick={() => copyText(diaChiHienThi, g.id + "-addr")}
                            className="text-slate-400 hover:text-slate-600 shrink-0"
                            title="Copy địa chỉ"
                          >
                            {copiedId === g.id + "-addr" ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Tổng SP */}
                      <td className="p-3.5 text-right font-mono font-black text-sm text-slate-900 dark:text-white">
                        {tongSL.toLocaleString()}
                        <div className="text-[10px] text-slate-400 font-normal">sản phẩm</div>
                      </td>

                      {/* Hàng hóa chi tiết */}
                      <td className="p-3.5 max-w-[220px]">
                        <div className="line-clamp-2 text-slate-600 dark:text-slate-400 text-xs leading-snug" title={summaryText}>
                          {summaryText}
                        </div>
                      </td>

                      {/* Vận chuyển & Tracking */}
                      <td className="p-3.5">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                          <Truck className="w-3 h-3 text-slate-500" />
                          <span>{pthucVC}</span>
                        </div>
                        {g.shipping?.maVanDon && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] font-mono text-sky-700 dark:text-sky-400 font-semibold">
                            <span>Vận đơn: {g.shipping.maVanDon}</span>
                            <button
                              onClick={() => copyText(g.shipping!.maVanDon!, g.id + "-track")}
                              className="p-0.5 text-slate-400 hover:text-slate-600"
                              title="Copy mã vận đơn"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Trạng thái giao hàng */}
                      <td className="p-3.5 text-center">
                        {delivered ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black text-emerald-700 bg-emerald-100/80 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đã giao thành công
                          </span>
                        ) : isShippingOut(g) ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-sky-700 bg-sky-100/80 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800 shadow-sm animate-pulse">
                            <Truck className="w-3.5 h-3.5 text-sky-600" />
                            Đang giao hàng
                          </span>
                        ) : isReadyToShip(g) ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-100/80 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-sm">
                            <Package className="w-3.5 h-3.5 text-amber-600" />
                            Kho xuất - Chờ đi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Đang SX ({g.trangThai})
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Chốt giao / Hoàn tác */}
                          {delivered ? (
                            <button
                              onClick={() => handleToggleDelivered(g)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                              title="Hoàn tác trạng thái giao hàng"
                            >
                              Hoàn tác
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleDelivered(g)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition flex items-center gap-1.5 active:scale-95"
                              title="Xác nhận đã giao hàng thành công"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                              Chốt giao
                            </button>
                          )}

                          {/* Cập nhật vận đơn */}
                          <button
                            onClick={() => setShippingModalOrder(g)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700 transition"
                            title="Cập nhật vận chuyển & mã tracking"
                          >
                            <Truck className="w-4 h-4" />
                          </button>

                          {/* In phiếu giao */}
                          <button
                            onClick={() => setPrintDeliveryOrder(g)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700 transition"
                            title="In phiếu giao hàng kiêm biên bản bàn giao"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
                        <div className="text-base font-bold text-slate-700 dark:text-slate-300">
                          Không tìm thấy đơn giao hàng nào
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Hãy thử thay đổi từ khóa tìm kiếm hoặc chuyển sang tab trạng thái khác
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredList.map((g) => {
            const delivered = isDelivered(g);
            const tongSL = (g.items || []).reduce((sum, item) => sum + (item.soLuong || 0), 0) || g.soLuong || 0;
            const spSummaries = (g.items || []).map((it) => `${it.soLuong} ${it.spTen || it.spId}${it.size ? ` (${it.size})` : ""}`).join(", ");
            const summaryText = spSummaries || g.sanPham || "Hàng may mặc theo đơn";

            const pthucVC = g.shipping?.phuongThuc
              ? (PHUONG_THUC_VAN_CHUYEN_LABELS[g.shipping.phuongThuc] || g.shipping.phuongThuc)
              : "Tự giao (POLOMIMIN)";

            const diaChiHienThi = g.shipping?.diaChiGiao || g.diaChi || "Chưa có địa chỉ";
            const maDisplay = g.maDH || `#DH-${g.id.slice(0, 8).toUpperCase()}`;

            return (
              <div
                key={g.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group ${
                  delivered
                    ? "border-emerald-300/80 dark:border-emerald-800/80 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/10"
                    : "border-slate-200/80 dark:border-slate-800"
                }`}
              >
                <div>
                  {/* Top Bar Card */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-base font-black text-sky-700 dark:text-sky-400">
                          {maDisplay}
                        </span>
                        <button
                          onClick={() => copyText(maDisplay, g.id + "-code-c")}
                          className="p-1 text-slate-400 hover:text-slate-600 transition"
                          title="Copy mã đơn"
                        >
                          {copiedId === g.id + "-code-c" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Hẹn: {g.ngayGiao || g.shipping?.ngayGiaoDuKien || g.ngayDat || "—"}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {delivered ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black text-emerald-700 bg-emerald-100/80 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Giao thành công
                        </span>
                      ) : isShippingOut(g) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-sky-700 bg-sky-100/80 border border-sky-300 animate-pulse">
                          <Truck className="w-3.5 h-3.5" /> Đang giao
                        </span>
                      ) : isReadyToShip(g) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-100/80 border border-amber-300">
                          <Package className="w-3.5 h-3.5" /> Chờ xuất kho
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 bg-slate-100 border">
                          <Clock className="w-3.5 h-3.5" /> Đang SX
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer & Address Details */}
                  <div className="py-3 space-y-2">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Khách hàng nhận:</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                        <span>{g.khachHang || "Khách lẻ"}</span>
                        {g.sdt && (
                          <a
                            href={`tel:${g.sdt}`}
                            className="text-xs font-semibold text-sky-600 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" /> {g.sdt}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-tight">{diaChiHienThi}</span>
                      </div>
                    </div>

                    {/* Products details */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Package className="w-3 h-3 text-sky-500" /> Chi tiết hàng:
                        </span>
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          {tongSL.toLocaleString()} SP
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-lg">
                        {summaryText}
                      </div>
                    </div>

                    {/* Carrier & Tracking */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        <Truck className="w-3 h-3 text-slate-500" /> {pthucVC}
                      </span>
                      {g.shipping?.maVanDon && (
                        <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                          {g.shipping.maVanDon}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShippingModalOrder(g)}
                      className="p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700 transition"
                      title="Cập nhật vận chuyển & mã tracking"
                    >
                      <Truck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPrintDeliveryOrder(g)}
                      className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700 transition"
                      title="In phiếu giao hàng"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>

                  {delivered ? (
                    <button
                      onClick={() => handleToggleDelivered(g)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                    >
                      Hoàn tác
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleDelivered(g)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition flex items-center gap-1.5 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      Chốt giao thành công
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredList.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-500 bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <div className="text-base font-bold text-slate-700 dark:text-slate-300">
                Không tìm thấy đơn giao hàng nào
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Hãy thử thay đổi từ khóa tìm kiếm hoặc chuyển sang tab trạng thái khác
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MODAL CẬP NHẬT VẬN CHUYỂN */}
      {shippingModalOrder && (
        <ShippingModal
          order={shippingModalOrder}
          onClose={() => setShippingModalOrder(null)}
          onSave={(shipping) => {
            capNhatVanChuyen(shippingModalOrder.id, shipping);
            toast.success(`Đã cập nhật thông tin vận chuyển cho đơn ${shippingModalOrder.maDH || shippingModalOrder.id}`);
            setShippingModalOrder(null);
          }}
        />
      )}

      {/* 6. MODAL IN PHIẾU GIAO HÀNG A4 */}
      {printDeliveryOrder && (
        <DeliveryNotePrint
          order={printDeliveryOrder}
          onClose={() => setPrintDeliveryOrder(null)}
          autoPrint={false}
        />
      )}
    </div>
  );
}
