// ============ FILTER BAR + SORT BAR ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)

import { Search, Download, Sparkles, Plus, ChevronDown, ChevronUp, LayoutGrid, List } from "lucide-react";
import { DS_TI_LE_SIZE, DS_KHU_KE_HANG, type SanPhamTP } from "../data";

interface FilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  filterTrangThai: "all" | SanPhamTP["trangThai"];
  setFilterTrangThai: (v: any) => void;
  filterLoai: "all" | string;
  setFilterLoai: (v: string) => void;
  dsLoai: string[];
  exportCSV: () => void;
  handleAutoGenerate: () => void;
  setShowAdd: (v: boolean) => void;
}

export function FilterBar({ search, setSearch, filterTrangThai, setFilterTrangThai, filterLoai, setFilterLoai, dsLoai, exportCSV, handleAutoGenerate, setShowAdd }: FilterBarProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 md:p-4 flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex-1 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã SP, tên, màu..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all"
          />
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-amber-500/20 whitespace-nowrap">
          <Plus className="w-4 h-4" /> <span className="hidden md:inline">Thêm mới</span>
        </button>
      </div>
      
      <div className="flex overflow-x-auto pb-1 -mx-1 px-1 gap-2 scrollbar-hide hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <select value={filterTrangThai} onChange={(e) => setFilterTrangThai(e.target.value as any)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-amber-400 flex-shrink-0">
          <option value="all">Trạng thái (Tất cả)</option>
          <option value="con">Còn hàng</option>
          <option value="dat-hang">Đang sản xuất</option>
          <option value="xuat-kho">Đã xuất kho</option>
          <option value="khong-dat">Không đạt</option>
        </select>
        <select value={filterLoai} onChange={(e) => setFilterLoai(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-amber-400 flex-shrink-0">
          <option value="all">Loại SP (Tất cả)</option>
          {dsLoai.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        
        <div className="w-px bg-slate-200 flex-shrink-0 mx-1"></div>
        
        <button onClick={exportCSV} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-1.5 flex-shrink-0 transition-colors">
          <Download className="w-4 h-4" /> CSV
        </button>
        <button onClick={handleAutoGenerate} className="px-3 py-2 bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100 rounded-lg text-sm font-medium flex items-center gap-1.5 flex-shrink-0 transition-colors">
          <Sparkles className="w-4 h-4" /> Auto
        </button>
      </div>
    </div>
  );
}

interface SortBarProps {
  sortBy: "ngay" | "sl" | "gt";
  setSortBy: (v: any) => void;
  sortDir: "asc" | "desc";
  setSortDir: (v: any) => void;
  filterSize: "all" | string;
  setFilterSize: (v: string) => void;
  filterViTri: "all" | string;
  setFilterViTri: (v: string) => void;
  filteredCount: number;
  totalCount: number;
  viewMode: "table" | "grid";
  setViewMode: (v: any) => void;
}

export function SortBar({ sortBy, setSortBy, sortDir, setSortDir, filterSize, setFilterSize, filterViTri, setFilterViTri, filteredCount, totalCount, viewMode, setViewMode }: SortBarProps) {
  return (
    <div className="card p-2 flex items-center gap-2 text-xs">
      <span className="font-semibold text-slate-600">Sắp xếp:</span>
      {[
        { k: "ngay", l: "Ngày nhập" },
        { k: "sl", l: "Số lượng" },
      ].map((s) => (
        <button
          key={s.k}
          onClick={() => { if (sortBy === s.k) setSortDir(sortDir === "asc" ? "desc" : "asc"); else { setSortBy(s.k as any); setSortDir("desc"); } }}
          className={`px-2 py-1 rounded flex items-center gap-1 ${
            sortBy === s.k ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {s.l} {sortBy === s.k && (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
        </button>
      ))}
      <div className="flex items-center gap-2 ml-2 border-l pl-2 border-slate-200">
        <select value={filterSize} onChange={(e) => setFilterSize(e.target.value)} className="px-2 py-1 bg-white border rounded text-xs outline-none text-slate-700">
          <option value="all">Tỉ lệ size</option>
          {DS_TI_LE_SIZE.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterViTri} onChange={(e) => setFilterViTri(e.target.value)} className="px-2 py-1 bg-white border rounded text-xs outline-none text-slate-700">
          <option value="all">Khu kệ hàng</option>
          {DS_KHU_KE_HANG.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-slate-500 mr-2">Hiển thị <b>{filteredCount}</b>/{totalCount}</span>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border">
          <button onClick={() => setViewMode("grid")} className={`p-1 rounded ${viewMode === "grid" ? "bg-white shadow" : "text-slate-500 hover:text-slate-700"}`} title="Grid view"><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode("table")} className={`p-1 rounded ${viewMode === "table" ? "bg-white shadow" : "text-slate-500 hover:text-slate-700"}`} title="Table view"><List className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
