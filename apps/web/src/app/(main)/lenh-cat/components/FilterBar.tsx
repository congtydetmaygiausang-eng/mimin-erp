// ============ FILTER + MAU SECTION ============
// Tach tu page.tsx (2026-08-05 - toi uu B.7)

import { useState } from "react";
import { Edit3, Trash2, Search, X, Layers, Building2, User, ArrowUpDown, RotateCcw, Filter } from "lucide-react";
import { toast } from "sonner";
import { TRANG_THAI_LC_LABELS, LOAI_SP_LABELS, type TrangThaiLenhCat } from "@/lib/data/lenh-cat-store";
import { FILTER_STATUSES } from "../data";

interface FilterBarProps {
  filterTrangThai: "ALL" | TrangThaiLenhCat;
  setFilterTrangThai: (v: "ALL" | TrangThaiLenhCat) => void;
  totalCount: number;
  counts: Record<string, number>;
  onCreateCD: () => void;
  onCreateCP: () => void;
  searchTerm?: string;
  setSearchTerm?: (v: string) => void;
  selectedLoaiSP?: string;
  setSelectedLoaiSP?: (v: string) => void;
  danhSachLoaiSP?: string[];
  selectedGiaCong?: string;
  setSelectedGiaCong?: (v: string) => void;
  danhSachGiaCong?: string[];
  sortBy?: string;
  setSortBy?: (v: any) => void;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
}

export function FilterBar({ 
  filterTrangThai, 
  setFilterTrangThai, 
  totalCount, 
  counts, 
  onCreateCD, 
  onCreateCP,
  searchTerm = "",
  setSearchTerm,
  selectedLoaiSP = "ALL",
  setSelectedLoaiSP,
  danhSachLoaiSP = [],
  selectedGiaCong = "ALL",
  setSelectedGiaCong,
  danhSachGiaCong = [],
  sortBy = "id_desc",
  setSortBy,
  hasActiveFilters = false,
  onResetFilters
}: FilterBarProps) {
  return (
    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm mb-4 space-y-3">
      {/* Hàng 1: Tabs Trạng thái và Nút tạo mẫu */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Segmented Control for Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar tab-scroll-mobile">
          {FILTER_STATUSES.map((tt) => {
            const count = tt === "ALL" ? totalCount : counts[tt] || 0;
            const active = filterTrangThai === tt;
            return (
              <button
                key={tt}
                onClick={() => setFilterTrangThai(tt)}
                className={`relative px-3.5 sm:px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-300 shrink-0 ${
                  active 
                    ? "bg-white text-teal-700 shadow-[0_2px_8px_rgba(0,0,0,0.08)]" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                {tt === "ALL" ? "Tất cả" : TRANG_THAI_LC_LABELS[tt as TrangThaiLenhCat]}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${active ? "bg-teal-50 text-teal-600" : "bg-slate-200 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <button onClick={onCreateCD} className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all border border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 hover:border-violet-300 text-center whitespace-nowrap">
            + Mẫu công đoạn
          </button>
          <button onClick={onCreateCP} className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 text-center whitespace-nowrap">
            + Bảng chi phí
          </button>
        </div>
      </div>

      {/* Hàng 2: Thanh tìm kiếm Mã SP, Mã Lệnh, Phân loại, Gia công nhận, Sắp xếp */}
      {setSearchTerm && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100">
          {/* Ô tìm kiếm */}
          <div className="lg:col-span-5 relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã SP (VD: M01), mã lệnh cắt (LC-...), tên SP..."
                className="w-full pl-9 pr-8 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium placeholder:text-slate-400 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Phân loại SP */}
          {setSelectedLoaiSP && (
            <div className="lg:col-span-3 relative">
              <div className="relative flex items-center">
                <Layers className="w-3.5 h-3.5 text-teal-600 absolute left-3 pointer-events-none" />
                <select
                  value={selectedLoaiSP}
                  onChange={(e) => setSelectedLoaiSP(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-700 transition appearance-none cursor-pointer"
                >
                  <option value="ALL">Tất cả loại SP ({danhSachLoaiSP.length})</option>
                  {danhSachLoaiSP.map((loai) => (
                    <option key={loai} value={loai}>
                      {LOAI_SP_LABELS[loai as keyof typeof LOAI_SP_LABELS] || loai}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 pointer-events-none text-slate-400 text-[10px]">▼</div>
              </div>
            </div>
          )}

          {/* Người phụ trách */}
          {setSelectedGiaCong && (
            <div className="lg:col-span-2 relative">
              <div className="relative flex items-center">
                <User className="w-3.5 h-3.5 text-indigo-600 absolute left-3 pointer-events-none" />
                <select
                  value={selectedGiaCong}
                  onChange={(e) => setSelectedGiaCong(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-700 transition appearance-none cursor-pointer"
                >
                  <option value="ALL">Người phụ trách ({danhSachGiaCong.length})</option>
                  {danhSachGiaCong.map((gc) => (
                    <option key={gc} value={gc}>
                      {gc}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 pointer-events-none text-slate-400 text-[10px]">▼</div>
              </div>
            </div>
          )}

          {/* Sắp xếp theo mã mới nhất / cũ nhất */}
          {setSortBy && (
            <div className="lg:col-span-2 relative">
              <div className="relative flex items-center">
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-600 absolute left-3 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-700 transition appearance-none cursor-pointer"
                >
                  <option value="id_desc">Mã mới nhất ↓</option>
                  <option value="id_asc">Mã cũ nhất ↑</option>
                  <option value="deadline_asc">Hạn giao gần nhất</option>
                  <option value="deadline_desc">Hạn giao xa nhất</option>
                  <option value="sl_desc">Số lượng nhiều nhất</option>
                  <option value="sl_asc">Số lượng ít nhất</option>
                </select>
                <div className="absolute right-2.5 pointer-events-none text-slate-400 text-[10px]">▼</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dòng đặt lại bộ lọc */}
      {hasActiveFilters && onResetFilters && (
        <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            <Filter className="w-3 h-3" /> Đang lọc danh sách
          </span>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 font-bold transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Đặt lại bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}

// ============ MAU SECTION (CD + CP) ============
interface MauSectionProps {
  dsMauCongDoan: any[];
  dsMauChiPhi: any[];
  showDanhSachMau: boolean;
  setShowDanhSachMau: (v: boolean | ((prev: boolean) => boolean)) => void;
  expandedMauCD: string | null;
  setExpandedMauCD: (v: string | null) => void;
  expandedMauCP: string | null;
  setExpandedMauCP: (v: string | null) => void;
  onEditCD: (m: any) => void;
  onEditCP: (m: any) => void;
  onDeleteCD: (id: string) => void;
  onDeleteCP: (id: string) => void;
}

export function MauSection({ dsMauCongDoan, dsMauChiPhi, showDanhSachMau, setShowDanhSachMau, expandedMauCD, setExpandedMauCD, expandedMauCP, setExpandedMauCP, onEditCD, onEditCP, onDeleteCD, onDeleteCP }: MauSectionProps) {
  if (dsMauCongDoan.length === 0 && dsMauChiPhi.length === 0) return null;

  return (
    <div className="card rounded-xl border-none shadow-md overflow-hidden mb-2">
      <button
        onClick={() => setShowDanhSachMau(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold hover:bg-slate-50 transition bg-white"
      >
        <span className="flex items-center gap-2 text-slate-700">
          <span className="text-violet-600">📋</span>
          Danh sách mẫu đã lưu
          <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold ml-2">
            {dsMauCongDoan.length} công đoạn · {dsMauChiPhi.length} bảng chi phí
          </span>
        </span>
        <span className={`text-slate-400 transition-transform ${showDanhSachMau ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {showDanhSachMau && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span>✂️</span> Mẫu Công Đoạn ({dsMauCongDoan.length})
            </h4>
            <div className="space-y-2">
              {dsMauCongDoan.map((m) => (
                <div key={m.id} className="border border-violet-100 rounded-lg bg-violet-50/50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2">
                    <button
                      onClick={() => setExpandedMauCD(expandedMauCD === m.id ? null : m.id)}
                      className="font-semibold text-sm text-slate-800 flex items-center gap-1.5 flex-1 text-left"
                    >
                      <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0"></span>
                      {m.ten}
                      <span className="text-xs font-normal text-slate-400">({Array.isArray(m.giaCong) ? m.giaCong.length : 0} khâu)</span>
                    </button>
                    <button onClick={() => onEditCD(m)} className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700/50 rounded ml-2 flex-shrink-0" title="Sửa mẫu">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm(`Xoá mẫu "${m.ten}"?`)) onDeleteCD(m.id); }} className="p-1 text-rose-400 hover:bg-rose-100 rounded ml-2 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {expandedMauCD === m.id && (
                    <div className="border-t border-violet-100 px-3 py-2 space-y-1">
                      {(Array.isArray(m.giaCong) ? m.giaCong : []).map((k: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">{k.tenCongDoan}</span>
                          <span className="font-bold text-violet-700">{(k.donGia || 0).toLocaleString()}đ</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-violet-100 mt-1">
                        <span className="font-bold text-slate-700">Tổng gia công/SP</span>
                        <span className="font-bold text-emerald-600">{(Array.isArray(m.giaCong) ? m.giaCong : []).reduce((s: number, k: any) => s + (k.donGia || 0), 0).toLocaleString()}đ</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span>💰</span> Bảng Chi Phí Cố Định ({dsMauChiPhi.length})
            </h4>
            <div className="space-y-2">
              {dsMauChiPhi.map((m) => (
                <div key={m.id} className="border border-emerald-100 rounded-lg bg-emerald-50/50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2">
                    <button
                      onClick={() => setExpandedMauCP(expandedMauCP === m.id ? null : m.id)}
                      className="font-semibold text-sm text-slate-800 flex items-center gap-1.5 flex-1 text-left"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
                      {m.ten}
                      <span className="text-xs font-normal text-slate-400">
                        ({Object.values(m.chiPhi || {}).reduce((s: number, v: any) => s + v, 0).toLocaleString()}đ/sp)
                      </span>
                    </button>
                    <button onClick={() => onEditCP(m)} className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700/50 rounded ml-2 flex-shrink-0" title="Sửa bảng giá">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm(`Xoá bảng giá "${m.ten}"?`)) onDeleteCP(m.id); }} className="p-1 text-rose-400 hover:bg-rose-100 rounded ml-2 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {expandedMauCP === m.id && (
                    <div className="border-t border-emerald-100 px-3 py-2 space-y-1">
                      {Object.entries(m.chiPhi || {}).map(([key, val]: [string, any]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-slate-600">{key}</span>
                          <span className="font-bold text-emerald-700">{(Number(val) || 0).toLocaleString()}đ</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs pt-1 border-t border-emerald-100 mt-1">
                        <span className="font-bold text-slate-700">Tổng chi phí cố định/SP</span>
                        <span className="font-bold text-emerald-600">{Object.values(m.chiPhi || {}).reduce((s: number, v: any) => s + v, 0).toLocaleString()}đ</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
