// ============ FILTERS (BP + STATUS + SEARCH) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.3)

import { Search, Users, UserCheck, UserX } from "lucide-react";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import type { NhanSuExt } from "../data";

export function Filters({
  list,
  dsBP,
  filterBP,
  setFilterBP,
  filterTrangThai,
  setFilterTrangThai,
  search,
  setSearch,
  viewMode,
  setViewMode,
}: {
  list: NhanSuExt[];
  dsBP: string[];
  filterBP: string;
  setFilterBP: (v: string) => void;
  filterTrangThai: "all" | "dang_lam" | "nghi_viec";
  setFilterTrangThai: (v: "all" | "dang_lam" | "nghi_viec") => void;
  search: string;
  setSearch: (v: string) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
}) {
  const dangLamCount = list.filter((n) => n.trangThai !== "nghi_viec").length;
  const nghiViecCount = list.filter((n) => n.trangThai === "nghi_viec").length;

  return (
    <div className="card p-3.5 sm:p-4 space-y-3 w-full max-w-full overflow-hidden">
      {/* Hàng 1: Lọc trạng thái làm việc */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar tab-scroll-mobile w-full sm:flex-1 pb-1">
          <span className="text-xs font-semibold text-slate-500 mr-1 shrink-0">Trạng thái:</span>
          <button
            type="button"
            onClick={() => setFilterTrangThai("all")}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filterTrangThai === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Tất cả ({list.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTrangThai("dang_lam")}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filterTrangThai === "dang_lam"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Đang làm việc ({dangLamCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTrangThai("nghi_viec")}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filterTrangThai === "nghi_viec"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100"
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            Đã nghỉ việc ({nghiViecCount})
          </button>
        </div>
        <div className="flex justify-end sm:justify-start shrink-0">
          <DataViewToggle onChange={setViewMode} />
        </div>
      </div>

      {/* Hàng 2: Lọc bộ phận & Tìm kiếm */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative w-full sm:w-72 order-1 sm:order-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            className="input pl-9 h-9 text-xs w-full"
            placeholder="Tìm tên, mã NV, SĐT, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar tab-scroll-mobile w-full sm:flex-1 pb-1 order-2 sm:order-1">
          {["all", ...dsBP].map((bp) => (
            <button
              key={bp}
              onClick={() => setFilterBP(bp)}
              className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                filterBP === bp
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-white/40 dark:bg-white/5 hover:bg-white/60 text-slate-700 dark:text-slate-300"
              }`}
            >
              {bp === "all" ? `Tất cả PB` : bp}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
