"use client";

import { Search, X, RotateCcw, Layers, Building2, ArrowUpDown, LayoutGrid, List } from "lucide-react";
import type { TrangThaiKHSX } from "@/lib/data/khsx-store";
import type { ViewMode } from "@/components/DataViewToggle";

export const TRANG_THAI_KHSX_LABELS: Record<TrangThaiKHSX, string> = {
  "Lên kế hoạch": "Lên kế hoạch",
  "Đang SX": "Đang SX",
  "Hoàn thành": "Hoàn thành",
  "Trễ hạn": "Trễ hạn",
};

interface FilterBarProps {
  filterTrangThai: TrangThaiKHSX | "Tất cả";
  setFilterTrangThai: (v: TrangThaiKHSX | "Tất cả") => void;
  totalCount: number;
  filteredCount?: number;
  counts: Record<string, number>;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedLoaiSP: string;
  setSelectedLoaiSP: (v: string) => void;
  danhSachLoaiSP: string[];
  selectedXuong: string;
  setSelectedXuong: (v: string) => void;
  danhSachXuong: string[];
  sortBy: string;
  setSortBy: (v: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onOpenCreateModal?: () => void;
  viewMode?: ViewMode;
  setViewMode?: (mode: ViewMode) => void;
}

export function KeHoachSXFilterBar({
  filterTrangThai,
  setFilterTrangThai,
  totalCount,
  filteredCount,
  counts,
  searchTerm,
  setSearchTerm,
  selectedLoaiSP,
  setSelectedLoaiSP,
  danhSachLoaiSP,
  selectedXuong,
  setSelectedXuong,
  danhSachXuong,
  sortBy,
  setSortBy,
  hasActiveFilters,
  onResetFilters,
  viewMode = "list",
  setViewMode,
}: FilterBarProps) {
  const tabs: (TrangThaiKHSX | "Tất cả")[] = ["Tất cả", "Lên kế hoạch", "Đang SX", "Hoàn thành", "Trễ hạn"];
  const displayFiltered = filteredCount !== undefined ? filteredCount : totalCount;

  return (
    <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
      {/* HÀNG 1: Segmented Tabs Trạng Thái + Toggle Chế Độ Xem (List / Card) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Bộ Tabs Trạng Thái hiện đại */}
        <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto no-scrollbar tab-scroll-mobile">
          {tabs.map((tab) => {
            const count = tab === "Tất cả" ? totalCount : counts[tab] || 0;
            const active = filterTrangThai === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTrangThai(tab)}
                className={`relative px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                  active
                    ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                }`}
              >
                {tab}
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    active
                      ? "bg-teal-50 dark:bg-emerald-950/60 text-teal-700 dark:text-emerald-300 border border-teal-200/70 dark:border-emerald-800"
                      : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cụm thông tin hiển thị & Chuyển đổi Dạng Xem */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Hiển thị: <b className="text-teal-700 dark:text-emerald-400 font-mono font-bold">{displayFiltered}</b>/{totalCount} KHSX
          </span>

          {setViewMode && (
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "list" || viewMode === "table"
                    ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
                title="Xem dạng bảng danh sách"
              >
                <List className="w-3.5 h-3.5" />
                <span>Danh sách</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "card"
                    ? "bg-white dark:bg-slate-900 text-teal-800 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
                title="Xem dạng thẻ card"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Dạng thẻ</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* HÀNG 2: Thanh Tìm Kiếm + Bộ Lọc Loại SP, Xưởng, Sắp Xếp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Ô Tìm Kiếm Đa Năng */}
        <div className="lg:col-span-5 relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã KHSX, mã SP, tên sản phẩm, lệnh cắt, màu, xưởng..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Lọc Theo Loại SP */}
        <div className="lg:col-span-2 relative">
          <div className="relative flex items-center">
            <Layers className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedLoaiSP}
              onChange={(e) => setSelectedLoaiSP(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer appearance-none transition-all truncate"
            >
              <option value="ALL">Loại SP (Tất cả)</option>
              {danhSachLoaiSP.map((lsp) => (
                <option key={lsp} value={lsp}>
                  {lsp}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lọc Theo Xưởng Phụ Trách */}
        <div className="lg:col-span-2 relative">
          <div className="relative flex items-center">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedXuong}
              onChange={(e) => setSelectedXuong(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer appearance-none transition-all truncate"
            >
              <option value="ALL">Xưởng (Tất cả)</option>
              {danhSachXuong.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sắp Xếp */}
        <div className="lg:col-span-2 relative">
          <div className="relative flex items-center">
            <ArrowUpDown className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer appearance-none transition-all truncate"
            >
              <option value="id_desc">Mã KHSX mới nhất</option>
              <option value="id_asc">Mã KHSX cũ nhất</option>
              <option value="deadline_asc">Hạn gần nhất</option>
              <option value="qty_desc">Số lượng cao nhất</option>
              <option value="qty_asc">Số lượng thấp nhất</option>
            </select>
          </div>
        </div>

        {/* Nút Đặt Lại Bộ Lọc (Chỉ hiển thị khi có bộ lọc hoạt động) */}
        {hasActiveFilters && (
          <div className="lg:col-span-1 flex items-center">
            <button
              type="button"
              onClick={onResetFilters}
              className="w-full py-2 px-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center gap-1"
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
