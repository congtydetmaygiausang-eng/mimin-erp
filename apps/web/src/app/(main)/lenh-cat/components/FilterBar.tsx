// ============ FILTER + MAU SECTION ============
// Tach tu page.tsx (2026-08-05 - toi uu B.7)

import { useState } from "react";
import { Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TRANG_THAI_LC_LABELS, type TrangThaiLenhCat } from "@/lib/data/lenh-cat-store";
import { FILTER_STATUSES } from "../data";

interface FilterBarProps {
  filterTrangThai: "ALL" | TrangThaiLenhCat;
  setFilterTrangThai: (v: "ALL" | TrangThaiLenhCat) => void;
  totalCount: number;
  counts: Record<string, number>;
  onCreateCD: () => void;
  onCreateCP: () => void;
}

export function FilterBar({ filterTrangThai, setFilterTrangThai, totalCount, counts, onCreateCD, onCreateCP }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
      <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-full border border-slate-200/60 shadow-sm">
        {FILTER_STATUSES.map((tt) => {
          const count = tt === "ALL" ? totalCount : counts[tt] || 0;
          const active = filterTrangThai === tt;
          return (
            <button
              key={tt}
              onClick={() => setFilterTrangThai(tt)}
              className={`px-4 py-1.5 rounded-full text-xs transition-all duration-300 relative ${
                active 
                  ? "bg-white text-teal-700 shadow-[0_2px_10px_rgba(15,118,110,0.15)] font-bold scale-105 z-10" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium"
              }`}
            >
              {tt === "ALL" ? "Tất cả" : TRANG_THAI_LC_LABELS[tt as TrangThaiLenhCat]}
              <span className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] ${
                active ? "bg-teal-50 text-teal-700 font-black" : "bg-slate-100 text-slate-500 font-bold"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
      
      <div className="flex items-center gap-2">
        <button onClick={onCreateCD} className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5">
          + Mẫu công đoạn
        </button>
        <button onClick={onCreateCP} className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5">
          + Bảng chi phí
        </button>
      </div>
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
