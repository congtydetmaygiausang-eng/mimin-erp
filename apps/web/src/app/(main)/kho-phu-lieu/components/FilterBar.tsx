// ============ FILTER BAR & TOOLBAR CHO KHO PHỤ LIỆU ============
// Tối ưu nâng cấp bộ lọc đa chiều chuẩn MIMIN ERP
"use client";

import { useMemo } from "react";
import {
  Search, X, RotateCcw, Filter, SlidersHorizontal,
  Package, Boxes, Plus, CheckCircle2, AlertTriangle, ArrowUpDown
} from "lucide-react";
import { formatVND, type KhoVai } from "@/lib/data/real-data";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";

export interface FilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  filterLoai: string;
  setFilterLoai: (v: string) => void;
  dsLoaiCounts: { loai: string; count: number }[];
  filterTrangThai: "all" | "con-hang" | "canh-bao" | "het-hang";
  setFilterTrangThai: (v: "all" | "con-hang" | "canh-bao" | "het-hang") => void;
  filterDvt: string;
  setFilterDvt: (v: string) => void;
  dsDvt: string[];
  sortBy: "ma" | "ton-desc" | "ton-asc" | "giatri-desc" | "dongia-desc" | "ten";
  setSortBy: (v: any) => void;
  selectedNhapMaVT: string;
  setSelectedNhapMaVT: (v: string) => void;
  onQuickNhap: () => void;
  inventory: KhoVai[];
  filteredCount: number;
  totalCount: number;
  totalQtyFiltered: number;
  totalValFiltered: number;
  viewMode: "list" | "card";
  setViewMode: (v: "list" | "card") => void;
  onResetFilters: () => void;
}

export function FilterBar({
  search, setSearch,
  filterLoai, setFilterLoai,
  dsLoaiCounts,
  filterTrangThai, setFilterTrangThai,
  filterDvt, setFilterDvt,
  dsDvt,
  sortBy, setSortBy,
  selectedNhapMaVT, setSelectedNhapMaVT,
  onQuickNhap,
  inventory,
  filteredCount, totalCount,
  totalQtyFiltered, totalValFiltered,
  viewMode, setViewMode,
  onResetFilters,
}: FilterBarProps) {
  const hasFilter =
    Boolean(search) ||
    filterLoai !== "all" ||
    filterTrangThai !== "all" ||
    filterDvt !== "all" ||
    sortBy !== "ma";

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/90 p-4 md:p-5 mb-5 space-y-4">
      {/* ============ HÀNG 1: TABS LỌC NHANH (LOẠI PHỤ LIỆU & TỒN KHO) ============ */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        {/* Nhóm Tabs: Phân loại Phụ Liệu */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Nhóm:
          </span>
          <button
            type="button"
            onClick={() => setFilterLoai("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filterLoai === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả ({totalCount})
          </button>
          {dsLoaiCounts.map((item) => (
            <button
              key={item.loai}
              type="button"
              onClick={() => setFilterLoai(item.loai)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterLoai === item.loai
                  ? "bg-teal-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.loai} ({item.count})
            </button>
          ))}
        </div>

        {/* Nhóm Tabs: Mức tồn kho */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 py-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Tồn kho:
          </span>
          {(
            [
              { id: "all", label: "Tất cả" },
              { id: "con-hang", label: "🟢 Còn hàng" },
              { id: "canh-bao", label: "🟡 Sắp hết" },
              { id: "het-hang", label: "🔴 Hết hàng" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilterTrangThai(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterTrangThai === t.id
                  ? "bg-teal-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============ HÀNG 2: TÌM KIẾM, DROPDOWNS & NHẬP NHANH ============ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Ô Search đa năng */}
        <div className="relative md:col-span-4 lg:col-span-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã (PL-001...), tên, quy cách, loại..."
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all font-medium"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown ĐVT */}
        <div className="md:col-span-2 lg:col-span-2">
          <select
            value={filterDvt}
            onChange={(e) => setFilterDvt(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
          >
            <option value="all">— Tất cả ĐVT —</option>
            {dsDvt.map((d) => (
              <option key={d} value={d}>
                Đơn vị: {d}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown Sắp xếp */}
        <div className="md:col-span-2 lg:col-span-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2.5 pl-3 pr-7 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all appearance-none"
            >
              <option value="ma">Mã VT (A → Z)</option>
              <option value="ton-desc">Tồn kho (Nhiều nhất)</option>
              <option value="ton-asc">Tồn kho (Ít nhất)</option>
              <option value="giatri-desc">Giá trị tồn (Cao nhất)</option>
              <option value="dongia-desc">Đơn giá (Cao nhất)</option>
              <option value="ten">Tên phụ liệu (A → Z)</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Khối Nhập nhanh từ NCC */}
        <div className="md:col-span-4 lg:col-span-4 flex items-center gap-2">
          <select
            value={selectedNhapMaVT}
            onChange={(e) => setSelectedNhapMaVT(e.target.value)}
            className="flex-1 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all truncate"
          >
            <option value="">-- Chọn phụ liệu nhập nhanh --</option>
            {inventory.map((item) => (
              <option key={item.maVT} value={item.maVT}>
                {item.maVT} — {item.tenVT}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onQuickNhap}
            className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl transition shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nhập NCC</span>
          </button>
        </div>
      </div>

      {/* ============ HÀNG 3: ĐẾM KẾT QUẢ & CHUYỂN CHẾ ĐỘ XEM (LIST / CARD) ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        {/* Thống kê lọc */}
        <div className="flex flex-wrap items-center gap-2 text-slate-500 font-medium">
          <span>
            Hiển thị <b className="text-slate-800 font-bold">{filteredCount}</b> / {totalCount} phụ liệu
          </span>
          <span>•</span>
          <span>
            Tổng tồn: <b className="text-teal-700 font-bold">{totalQtyFiltered.toLocaleString("vi-VN")}</b> đơn vị
          </span>
          <span>•</span>
          <span>
            Tổng trị giá: <b className="text-emerald-700 font-bold">{formatVND(totalValFiltered)}</b>
          </span>

          {hasFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 ml-2 px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Nút chuyển chế độ xem: Dạng Danh Sách vs Dạng Thẻ */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Chế độ xem:
          </span>
          <DataViewToggle
            value={viewMode}
            onChange={(m) => setViewMode(m === "card" ? "card" : "list")}
            modes={["list", "card"]}
          />
        </div>
      </div>
    </div>
  );
}
