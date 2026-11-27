// ============ FILTER BAR & TOOLBAR CHO KHO THÀNH PHẨM ============
// Tối ưu nâng cấp đa chiều theo chuẩn MIMIN ERP
"use client";

import { useState, useEffect } from "react";
import {
  Search, X, RotateCcw, Filter, SlidersHorizontal,
  Layers, Package, CheckCircle2, AlertTriangle, ArrowUpDown
} from "lucide-react";
import { DS_TI_LE_SIZE, DS_KHU_KE_HANG, type SanPhamTP } from "../data";
import { loadSharedSizeRatioPresets } from "@/lib/size-ratio-presets";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import { formatVND } from "@/lib/data/real-data";

export interface FilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  filterTrangThai: "all" | SanPhamTP["trangThai"];
  setFilterTrangThai: (v: any) => void;
  filterLoai: "all" | string;
  setFilterLoai: (v: string) => void;
  dsLoai: string[];
  filterSize: "all" | string;
  setFilterSize: (v: string) => void;
  filterViTri: "all" | string;
  setFilterViTri: (v: string) => void;
  filterThuongHieu: "all" | "manpj" | "polomimin";
  setFilterThuongHieu: (v: "all" | "manpj" | "polomimin") => void;
  filterMucTon: "all" | "con-hang" | "sap-het" | "het-hang";
  setFilterMucTon: (v: "all" | "con-hang" | "sap-het" | "het-hang") => void;
  sortBy: "ngay" | "sl" | "gt" | "ten";
  setSortBy: (v: "ngay" | "sl" | "gt" | "ten") => void;
  sortDir: "asc" | "desc";
  setSortDir: (v: "asc" | "desc") => void;
  filteredCount: number;
  totalCount: number;
  groupedCount: number;
  totalQtyFiltered: number;
  totalValFiltered: number;
  countManPJ: number;
  countPolomimin: number;
  viewMode: "table" | "grid";
  setViewMode: (v: "table" | "grid") => void;
  onResetFilters: () => void;
}

export function FilterBar({
  search, setSearch,
  filterTrangThai, setFilterTrangThai,
  filterLoai, setFilterLoai,
  dsLoai,
  filterSize, setFilterSize,
  filterViTri, setFilterViTri,
  filterThuongHieu, setFilterThuongHieu,
  filterMucTon, setFilterMucTon,
  sortBy, setSortBy,
  sortDir, setSortDir,
  filteredCount, totalCount, groupedCount,
  totalQtyFiltered, totalValFiltered,
  countManPJ, countPolomimin,
  viewMode, setViewMode,
  onResetFilters,
}: FilterBarProps) {
  const [dynamicSizes, setDynamicSizes] = useState<string[]>(DS_TI_LE_SIZE);

  useEffect(() => {
    let active = true;
    loadSharedSizeRatioPresets().then((customPresets) => {
      if (active) {
        const customLabels = customPresets.map(p => p.label);
        const allSizes = Array.from(new Set([...DS_TI_LE_SIZE, ...customLabels]));
        setDynamicSizes(allSizes);
      }
    });
    return () => { active = false; };
  }, []);

  const hasFilter =
    Boolean(search) ||
    filterTrangThai !== "all" ||
    filterLoai !== "all" ||
    filterSize !== "all" ||
    filterViTri !== "all" ||
    filterThuongHieu !== "all" ||
    filterMucTon !== "all" ||
    sortBy !== "ngay" ||
    sortDir !== "desc";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 md:p-5 shadow-sm space-y-4 mb-4">
      {/* ============ HÀNG 1: BỘ LỌC NHANH THEO PILL (THƯƠNG HIỆU & MỨC TỒN) ============ */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        {/* Nhóm lọc thương hiệu */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Thương hiệu:
          </span>
          <button
            type="button"
            onClick={() => setFilterThuongHieu("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterThuongHieu === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Tất cả ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterThuongHieu("manpj")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterThuongHieu === "manpj"
                ? "bg-indigo-600 text-white shadow-xs shadow-indigo-500/20"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40"
            }`}
          >
            <span>👔 Hàng ManPJ</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-200/70 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200 font-mono">
              {countManPJ}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterThuongHieu("polomimin")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterThuongHieu === "polomimin"
                ? "bg-teal-600 text-white shadow-xs shadow-teal-500/20"
                : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/60 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/40"
            }`}
          >
            <span>👕 Hàng Polomimin</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-200/70 text-teal-900 dark:bg-teal-900 dark:text-teal-200 font-mono">
              {countPolomimin}
            </span>
          </button>
        </div>

        {/* Nhóm lọc mức tồn kho */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Mức tồn:
          </span>
          <button
            type="button"
            onClick={() => setFilterMucTon("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterMucTon === "all"
                ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setFilterMucTon("con-hang")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              filterMucTon === "con-hang"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Còn hàng</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMucTon("sap-het")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              filterMucTon === "sap-het"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Sắp hết (&lt;50)</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMucTon("het-hang")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              filterMucTon === "het-hang"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Hết hàng (0)</span>
          </button>
        </div>
      </div>

      {/* ============ HÀNG 2: THANH TÌM KIẾM & DROPDOWN LỌC ĐA NĂNG ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
        {/* Ô Input Search chính (5 cols) */}
        <div className="lg:col-span-4 relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-teal-600 transition" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã SP (TPJ-..., M01...), tên, màu, lô..."
            className="w-full pl-9 pr-8 py-2.5 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium placeholder:text-slate-400 text-slate-800 dark:text-slate-100 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown 1: Phân loại SP (2 cols) */}
        <div className="lg:col-span-2">
          <select
            value={filterLoai}
            onChange={(e) => setFilterLoai(e.target.value)}
            className="w-full py-2.5 px-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
          >
            <option value="all">— Tất cả loại SP —</option>
            <option value="BoCoTron">Bộ Cổ Tròn</option>
            <option value="BoTru">Bộ Trụ</option>
            <option value="AoPolo">Áo Polo</option>
            <option value="AoTru">Áo Trụ</option>
            <option value="AoCoTron">Áo Cổ Tròn</option>
            <option value="PhuKien">Quần / Phụ Kiện</option>
          </select>
        </div>

        {/* Dropdown 2: Khu kệ hàng (2 cols) */}
        <div className="lg:col-span-2">
          <select
            value={filterViTri}
            onChange={(e) => setFilterViTri(e.target.value)}
            className="w-full py-2.5 px-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
          >
            <option value="all">— Tất cả khu kệ —</option>
            {DS_KHU_KE_HANG.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        {/* Dropdown 3: Tỉ lệ size (2 cols) */}
        <div className="lg:col-span-2">
          <select
            value={filterSize}
            onChange={(e) => setFilterSize(e.target.value)}
            className="w-full py-2.5 px-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
          >
            <option value="all">— Tất cả tỉ lệ size —</option>
            {dynamicSizes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Dropdown 4: Sắp xếp (2 cols) */}
        <div className="lg:col-span-2 flex items-center gap-1.5">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setSortDir("desc");
            }}
            className="w-full py-2.5 px-2.5 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
          >
            <option value="ngay">Mới nhập nhất</option>
            <option value="sl">Tồn kho nhiều nhất</option>
            <option value="gt">Giá trị cao nhất</option>
            <option value="ten">Tên SP (A → Z)</option>
          </select>

          {hasFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 transition shrink-0 cursor-pointer"
              title="Xóa toàn bộ bộ lọc và khôi phục mặc định"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ============ HÀNG 3: DÒNG ĐẾM THỐNG KÊ & CHUYỂN CHẾ ĐỘ XEM (LIST / CARD) ============ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 font-medium">
          <span>
            Hiển thị: <b className="text-indigo-700 dark:text-indigo-400 font-mono text-sm">{filteredCount}</b> / {totalCount} biến thể ({groupedCount} mẫu SP)
          </span>
          <span>•</span>
          <span>
            Tổng tồn lọc: <b className="text-slate-900 dark:text-white font-mono font-bold">{totalQtyFiltered.toLocaleString()} SP</b>
          </span>
          <span>•</span>
          <span>
            Trị giá lọc: <b className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">{formatVND(totalValFiltered)}</b>
          </span>
        </div>

        {/* TOGGLE CHẾ ĐỘ XEM: DANH SÁCH / DẠNG THẺ */}
        <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:inline">
            Chế độ xem:
          </span>
          <DataViewToggle
            value={viewMode === "grid" ? "card" : "list"}
            onChange={(mode) => setViewMode(mode === "card" ? "grid" : "table")}
            modes={["list", "card"]}
          />
        </div>
      </div>
    </div>
  );
}
