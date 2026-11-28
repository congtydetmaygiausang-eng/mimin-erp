"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  X,
  Calendar,
  Building2,
  Package,
  Layers,
  TrendingUp,
  FileText,
  DollarSign,
  Boxes,
  Truck,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { useSupplierRelations, EmptyRelationState } from "../supplier-relations";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";

export default function GiaoDichMuaPage() {
  const { giaoDich, suppliers } = useSupplierRelations();
  const [search, setSearch] = useState("");
  const [filterSupplier, setFilterSupplier] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Lọc chỉ lấy các giao dịch nhập mua kho
  const rows = useMemo(() => {
    return giaoDich.filter((g) => g.loai === "NHAP");
  }, [giaoDich]);

  // Thống kê tổng quan
  const stats = useMemo(() => {
    const totalTransactions = rows.length;
    const totalAmount = rows.reduce((s, r) => s + (r.thanhTien || 0), 0);
    const uniqueSuppliers = new Set(rows.map((r) => r.nguonNhap).filter(Boolean)).size;
    const totalQty = rows.reduce((s, r) => s + (r.soLuong || 0), 0);
    return { totalTransactions, totalAmount, uniqueSuppliers, totalQty };
  }, [rows]);

  // Danh sách nhà cung cấp có giao dịch để lọc
  const supplierOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.nguonNhap) set.add(r.nguonNhap);
    });
    return Array.from(set);
  }, [rows]);

  // Lọc theo tìm kiếm và nhà cung cấp
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQ =
        !q ||
        (r.nguonNhap || "").toLowerCase().includes(q) ||
        (r.tenVT || "").toLowerCase().includes(q) ||
        (r.id || "").toLowerCase().includes(q);

      const matchSup = filterSupplier === "ALL" || r.nguonNhap === filterSupplier;
      return matchQ && matchSup;
    });
  }, [rows, search, filterSupplier]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 w-full max-w-full overflow-x-hidden">
      {/* 1. HERO COMMAND BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-teal-50/70 to-emerald-50/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 md:p-7 shadow-sm border border-teal-200/90 dark:border-teal-800/80 group">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-2xs">
              <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
              Sổ Giao Dịch Mua Hàng & Nhập Kho Vật Tư
            </span>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Giao Dịch Mua Nhà Cung Cấp
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  Nhật ký nhập mua vải chính, bo dệt, cúc nút, phụ liệu may mặc và đối soát hóa đơn chứng từ
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 shadow-2xs">
                📦 {stats.totalTransactions} phiếu nhập mua
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 shadow-2xs">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Tổng giá trị: {formatVND(stats.totalAmount)}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 shadow-2xs">
                🏢 {stats.uniqueSuppliers} nhà cung ứng
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/kho-vai-tinhmann"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 transition shadow-2xs"
            >
              <Package className="w-4 h-4 text-teal-600" /> Kho Vải Tinh Mann
            </Link>
            <Link
              href="/kho-phu-lieu"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs border border-emerald-200 transition"
            >
              <Boxes className="w-4 h-4 text-emerald-600" /> Kho Phụ Liệu
            </Link>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD 4 KPI MUA HÀNG */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-white dark:to-slate-900 border border-teal-300/80 dark:border-teal-800/80 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wide">Phiếu Nhập Mua</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white mt-2 tabular-nums">
            {stats.totalTransactions} <span className="text-sm font-bold text-slate-500 font-sans">phiếu</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Đã kiểm đếm & nhập kho</div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white dark:to-slate-900 border border-emerald-300/80 dark:border-emerald-800/80 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Tổng Giá Trị Mua</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-emerald-700 dark:text-emerald-400 mt-2 tabular-nums">
            {formatVNDShort(stats.totalAmount)}
          </div>
          <div className="text-xs text-slate-500 mt-1 truncate">{formatVND(stats.totalAmount)}</div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-white dark:to-slate-900 border border-sky-300/80 dark:border-sky-800/80 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wide">Nhà Cung Cấp</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-sky-700 dark:text-sky-400 mt-2 tabular-nums">
            {stats.uniqueSuppliers} <span className="text-sm font-bold text-slate-500 font-sans">đơn vị</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Có phát sinh mua hàng</div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white dark:to-slate-900 border border-amber-300/80 dark:border-amber-800/80 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Tổng Sản Lượng Nhập</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400 mt-2 tabular-nums">
            {stats.totalQty.toLocaleString("vi-VN")} <span className="text-sm font-bold text-slate-500 font-sans">vật tư</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Mét vải, cuộn bo, phụ liệu</div>
        </div>
      </div>

      {/* 3. THANH TÌM KIẾM & BỘ LỌC GIAO DỊCH */}
      <div className="card p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs space-y-3.5">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
          <input
            className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Tìm theo tên nhà cung cấp, tên vật tư vải / bo / phụ liệu, mã chứng từ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500">Lọc theo NCC:</span>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">Tất cả nhà cung cấp ({stats.totalTransactions})</option>
              {supplierOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              Hiển thị: <b className="text-teal-700 font-mono">{filtered.length}</b> giao dịch
            </span>
            <DataViewToggle onChange={setViewMode} />
          </div>
        </div>
      </div>

      {/* 4. HIỂN THỊ DỮ LIỆU */}
      {filtered.length === 0 ? (
        <EmptyRelationState>Chưa có giao dịch mua hàng phù hợp điều kiện lọc.</EmptyRelationState>
      ) : viewMode === "table" ? (
        <div className="card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold bg-slate-50/80 dark:bg-slate-800/60">
                  <th className="py-3 px-4">NGÀY NHẬP</th>
                  <th className="py-3 px-4">NHÀ CUNG CẤP</th>
                  <th className="py-3 px-4">VẬT TƯ / NGUYÊN LIỆU</th>
                  <th className="py-3 px-4 text-right">SỐ LƯỢNG</th>
                  <th className="py-3 px-4 text-right">ĐƠN GIÁ</th>
                  <th className="py-3 px-4 text-right">THÀNH TIỀN</th>
                  <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((g) => {
                  const donGia = g.soLuong > 0 ? Math.round(g.thanhTien / g.soLuong) : 0;
                  return (
                    <tr key={g.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500">{g.ngay}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{g.nguonNhap || "NCC vãng lai"}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{g.tenVT}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {g.soLuong.toLocaleString("vi-VN")} <span className="text-slate-400 font-normal font-sans">{g.donVi}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                        {donGia > 0 ? formatVND(donGia) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatVND(g.thanhTien)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                          Đã nhập kho
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs text-slate-400">{g.ngay}</span>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Nhập kho
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5">{g.tenVT}</h3>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                NCC: <b className="text-slate-800 dark:text-slate-200">{g.nguonNhap || "NCC vãng lai"}</b>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Số lượng</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {g.soLuong.toLocaleString("vi-VN")} {g.donVi}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Thành tiền</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatVND(g.thanhTien)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
