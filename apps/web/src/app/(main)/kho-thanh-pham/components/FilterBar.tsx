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
    <div className="card p-3 flex flex-col md:flex-row gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm mã SP, tên, LSX, màu, size, vị trí..."
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:border-amber-500 outline-none"
        />
      </div>
      <select value={filterTrangThai} onChange={(e) => setFilterTrangThai(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm">
        <option value="all">Tất cả trạng thái</option>
        <option value="con">Còn hàng</option>
        <option value="dat-hang">Đang sản xuất</option>
        <option value="xuat-kho">Đã xuất kho</option>
        <option value="khong-dat">Không đặt</option>
      </select>
      <select value={filterLoai} onChange={(e) => setFilterLoai(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
        <option value="all">Tất cả loại</option>
        {dsLoai.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      <button onClick={exportCSV} className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
        <Download className="w-4 h-4" /> CSV
      </button>
      <button onClick={handleAutoGenerate} className="px-3 py-2 bg-sky-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
        <Sparkles className="w-4 h-4" /> Auto
      </button>
      <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
        <Plus className="w-4 h-4" /> Thêm
      </button>
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
