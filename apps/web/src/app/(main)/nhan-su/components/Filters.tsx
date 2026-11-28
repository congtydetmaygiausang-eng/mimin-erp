// ============ FILTERS (BỘ LỌC & TÌM KIẾM NHÂN SỰ CHUYÊN NGHIỆP) ============
// Tối ưu theo phong cách chuẩn ERP của Kho Thành Phẩm & Kho Vải
"use client";

import {
  Search,
  X,
  Users,
  UserCheck,
  UserX,
  RotateCcw,
  SlidersHorizontal,
  Briefcase,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import type { NhanSuExt } from "../data";

export interface FiltersProps {
  list: NhanSuExt[];
  dsBP: string[];
  filterBP: string;
  setFilterBP: (v: string) => void;
  filterTrangThai: "all" | "dang_lam" | "nghi_viec";
  setFilterTrangThai: (v: "all" | "dang_lam" | "nghi_viec") => void;
  filterLuong?: string;
  setFilterLuong?: (v: string) => void;
  sortBy?: string;
  setSortBy?: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  filteredCount?: number;
  onReset?: () => void;
}

export function Filters({
  list,
  dsBP,
  filterBP,
  setFilterBP,
  filterTrangThai,
  setFilterTrangThai,
  filterLuong = "all",
  setFilterLuong,
  sortBy = "stt",
  setSortBy,
  search,
  setSearch,
  viewMode,
  setViewMode,
  filteredCount,
  onReset,
}: FiltersProps) {
  const dangLamCount = list.filter((n) => n.trangThai !== "nghi_viec").length;
  const nghiViecCount = list.filter((n) => n.trangThai === "nghi_viec").length;

  const hasFilter =
    Boolean(search) ||
    filterTrangThai !== "all" ||
    filterBP !== "all" ||
    filterLuong !== "all" ||
    sortBy !== "stt";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 md:p-5 shadow-sm space-y-4 mb-4">
      {/* ============ HÀNG 1: BỘ LỌC NHANH THEO PILL (TRẠNG THÁI & BỘ PHẬN) ============ */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        {/* Nhóm lọc trạng thái nhân sự */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Trạng thái:
          </span>
          <button
            type="button"
            onClick={() => setFilterTrangThai("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterTrangThai === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tất cả ({list.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTrangThai("dang_lam")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterTrangThai === "dang_lam"
                ? "bg-emerald-600 text-white shadow-xs shadow-emerald-500/20"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Đang làm việc</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200/70 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200 font-mono">
              {dangLamCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTrangThai("nghi_viec")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterTrangThai === "nghi_viec"
                ? "bg-rose-600 text-white shadow-xs shadow-rose-500/20"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40"
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Đã nghỉ việc</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200/70 text-rose-900 dark:bg-rose-900 dark:text-rose-200 font-mono">
              {nghiViecCount}
            </span>
          </button>
        </div>

        {/* Nhóm lọc nhanh Bộ phận dạng Pill */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar tab-scroll-mobile pb-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
            Bộ phận:
          </span>
          <button
            type="button"
            onClick={() => setFilterBP("all")}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterBP === "all"
                ? "bg-teal-700 text-white dark:bg-teal-600 shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Tất cả PB
          </button>
          {dsBP.map((bp) => {
            const count = list.filter((n) => n.boPhan === bp).length;
            const isSelected = filterBP === bp;
            return (
              <button
                key={bp}
                type="button"
                onClick={() => setFilterBP(bp)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? "bg-teal-700 text-white dark:bg-teal-600 shadow-xs"
                    : "bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/50 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800/40"
                }`}
              >
                <span>{bp}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ HÀNG 2: THANH TÌM KIẾM & DROPDOWN LỌC ĐA NĂNG ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
        {/* Ô Input Search chính (5 cols) */}
        <div className="lg:col-span-5 relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-teal-600 transition" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, mã NV (NV01...), SĐT, email, chức vụ..."
            className="w-full pl-9 pr-8 py-2.5 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium placeholder:text-slate-400 text-slate-800 dark:text-slate-100 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Xoá tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown 1: Phòng ban / Bộ phận (3 cols) */}
        <div className="lg:col-span-3">
          <select
            value={filterBP}
            onChange={(e) => setFilterBP(e.target.value)}
            className="w-full py-2.5 px-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
          >
            <option value="all">— Tất cả bộ phận ({list.length}) —</option>
            {dsBP.map((bp) => {
              const count = list.filter((n) => n.boPhan === bp).length;
              return (
                <option key={bp} value={bp}>
                  {bp} ({count} nhân sự)
                </option>
              );
            })}
          </select>
        </div>

        {/* Dropdown 2: Mức lương (2 cols) */}
        {setFilterLuong && (
          <div className="lg:col-span-2">
            <select
              value={filterLuong}
              onChange={(e) => setFilterLuong(e.target.value)}
              className="w-full py-2.5 px-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
            >
              <option value="all">— Mức lương cơ bản —</option>
              <option value="duoi_8tr">Dưới 8 triệu/tháng</option>
              <option value="8_12tr">Từ 8 - 12 triệu</option>
              <option value="tren_12tr">Trên 12 triệu/tháng</option>
              <option value="luong_sp">Hưởng lương sản phẩm</option>
            </select>
          </div>
        )}

        {/* Dropdown 3: Sắp xếp (2 cols) */}
        {setSortBy && (
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2.5 px-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
            >
              <option value="stt">Sắp xếp: Mặc định (Mã NV)</option>
              <option value="ten_asc">Tên: A → Z</option>
              <option value="ten_desc">Tên: Z → A</option>
              <option value="luong_desc">Lương: Cao → Thấp</option>
              <option value="ngay_desc">Ngày vào: Mới nhất</option>
              <option value="rating_desc">Đánh giá: Sao cao nhất</option>
            </select>
          </div>
        )}
      </div>

      {/* ============ HÀNG 3: BỘ ĐẾM KẾT QUẢ + NÚT RESET + DATA VIEW TOGGLE ============ */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <span>
            Hiển thị:{" "}
            <b className="text-teal-700 dark:text-teal-400 font-bold">
              {filteredCount !== undefined ? filteredCount : list.length}
            </b>{" "}
            / {list.length} nhân sự
          </span>

          {hasFilter && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 font-bold transition cursor-pointer"
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DataViewToggle value={viewMode} onChange={setViewMode} modes={["card", "list", "table"]} />
        </div>
      </div>
    </div>
  );
}
