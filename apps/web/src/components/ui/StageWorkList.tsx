"use client";

import React, { useState, useEffect, useMemo } from "react";
import { LenhCat, TrangThaiCongDoan, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, MauVai, LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import TabBar from "./TabBar";
import { LayoutGrid, List, Search, X, Layers, Users, ArrowUpDown, RotateCcw, Filter, Building2, CheckCircle2, User } from "lucide-react";
import { ResponsiveModal } from "./ResponsiveModal";
import { LenhCatTableView, type StageKey } from "./LenhCatTableView";
import { useNhanSu, resolveTenNhanSu } from "@/lib/data/nhan-su-store";

export interface ExtraTabItem {
  key: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface Props {
  data: LenhCat[];
  stageKeyword?: string; // e.g. "cat", "may", "qc" to find the phanCong
  stage?: StageKey;
  renderCard: (lc: LenhCat) => React.ReactNode;
  emptyMessage?: string;
  isStageAccessible?: (pc: any) => boolean; // custom filter if needed
  getStagePC?: (lc: LenhCat) => any;
  onColorClick?: (lc: LenhCat, mau: MauVai) => void;
  onTyLeClick?: (lc: LenhCat) => void;
  onGiaCongClick?: (lc: LenhCat, type?: "ao" | "quan") => void;
  onActionClick?: (lc: LenhCat) => void;
  extraTabs?: ExtraTabItem[];
}

const STORAGE_VIEW_KEY = "mimin_stagework_view_mode";

export function StageWorkList({ 
  data, 
  stageKeyword, 
  stage = "cat",
  renderCard, 
  emptyMessage = "Chưa có lệnh nào", 
  isStageAccessible,
  getStagePC,
  onColorClick,
  onTyLeClick,
  onGiaCongClick,
  onActionClick,
  extraTabs,
}: Props) {
  const [activeTab, setActiveTab] = useState("dang_lam");
  // Mặc định luôn là Dạng Danh Sách theo yêu cầu của anh Cường
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const [selectedLc, setSelectedLc] = useState<LenhCat | null>(null);

  // Bộ lọc tìm kiếm & sắp xếp
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoaiSP, setSelectedLoaiSP] = useState("ALL");
  const [selectedGiaCong, setSelectedGiaCong] = useState("ALL");
  const [sortBy, setSortBy] = useState<"id_desc" | "id_asc" | "deadline_asc" | "deadline_desc" | "sl_desc" | "sl_asc">("id_desc");
  let dsNhanSu: any[] = [];
  try {
    const ns = useNhanSu();
    dsNhanSu = ns.list || [];
  } catch {}

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_VIEW_KEY) as "card" | "list" | null;
    if (saved === "card" || saved === "list") {
      setViewMode(saved);
    } else {
      setViewMode("list");
      localStorage.setItem(STORAGE_VIEW_KEY, "list");
    }
  }, []);

  const handleSetViewMode = (mode: "card" | "list") => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_VIEW_KEY, mode);
  };

  // Helper to find the relevant assignment for this stage
  const findPhanCong = (lc: LenhCat) => {
    if (getStagePC) return getStagePC(lc);
    if (!stageKeyword) return lc.phanCong?.[0];
    return lc.phanCong?.find((pc: any) => {
      const match = pc.id === stageKeyword || pc.tenCongDoan?.toLowerCase().includes(stageKeyword);
      if (match && isStageAccessible) {
        return isStageAccessible(pc);
      }
      return match;
    });
  };

  // Filter data that actually belongs to this stage
  const stageData = useMemo(() => {
    return data.filter(lc => {
      const pc = findPhanCong(lc);
      return pc !== undefined && pc !== null && (Array.isArray(pc) ? pc.length > 0 : true);
    });
  }, [data]);

  // Group by status
  const dangLamList = useMemo(() => {
    return stageData.filter(lc => {
      const pc = findPhanCong(lc);
      if (Array.isArray(pc)) {
        return !pc.every((p: any) => p.trangThaiCD === "hoan_thanh");
      }
      return pc && pc.trangThaiCD !== "hoan_thanh";
    });
  }, [stageData]);

  const hoanThanhList = useMemo(() => {
    return stageData.filter(lc => {
      const pc = findPhanCong(lc);
      if (Array.isArray(pc)) {
        return pc.length > 0 && pc.every((p: any) => p.trangThaiCD === "hoan_thanh");
      }
      return pc && pc.trangThaiCD === "hoan_thanh";
    });
  }, [stageData]);

  const currentList = activeTab === "dang_lam" ? dangLamList : hoanThanhList;

  // Thu thập danh sách Loại SP xuất hiện trong dữ liệu
  const danhSachLoaiSP = useMemo(() => {
    const set = new Set<string>();
    stageData.forEach(lc => {
      if (lc.loaiSP) set.add(lc.loaiSP);
    });
    return Array.from(set);
  }, [stageData]);

  // Thu thập danh sách Người phụ trách / Gia công nhận khâu này
  const danhSachGiaCong = useMemo(() => {
    const set = new Set<string>();
    stageData.forEach(lc => {
      const pc = findPhanCong(lc);
      if (Array.isArray(pc)) {
        pc.forEach((p: any) => {
          if (p?.nguoiTen && p.nguoiTen.trim()) {
            set.add(resolveTenNhanSu(p.nguoiTen.trim(), dsNhanSu));
          }
        });
      } else if (pc?.nguoiTen && pc.nguoiTen.trim()) {
        set.add(resolveTenNhanSu(pc.nguoiTen.trim(), dsNhanSu));
      }
    });
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi"));
  }, [stageData, dsNhanSu]);

  // Lọc và Sắp xếp kết hợp
  const filteredAndSortedList = useMemo(() => {
    let result = currentList.filter(lc => {
      // 1. Tìm kiếm theo từ khóa (Mã LC, Mã SP, Tên SP, Tên gia công, Tên màu)
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchId = (lc.id || "").toLowerCase().includes(q);
        const matchMaSP = (lc.maSP || "").toLowerCase().includes(q);
        const matchTenSP = (lc.tenSP || "").toLowerCase().includes(q);
        
        const pc = findPhanCong(lc);
        const nguoiTenStr = (Array.isArray(pc) 
          ? pc.map((p: any) => p?.nguoiTen || "").join(" ") 
          : (pc?.nguoiTen || "")
        ).toLowerCase();
        const matchGiaCong = nguoiTenStr.includes(q);

        const matchMau = (lc.dsMau || []).some(m => 
          (m.ten || "").toLowerCase().includes(q) || 
          (m.maSKU || "").toLowerCase().includes(q)
        );

        if (!matchId && !matchMaSP && !matchTenSP && !matchGiaCong && !matchMau) {
          return false;
        }
      }

      // 2. Lọc theo Phân loại sản phẩm
      if (selectedLoaiSP !== "ALL" && lc.loaiSP !== selectedLoaiSP) {
        return false;
      }

      // 3. Lọc theo Tên đơn vị gia công / Người phụ trách
      if (selectedGiaCong !== "ALL") {
        const pc = findPhanCong(lc);
        const rawNames: string[] = Array.isArray(pc)
          ? pc.map((p: any) => (p?.nguoiTen || "").trim())
          : [(pc?.nguoiTen || "").trim()];
        const resolvedNames = rawNames.map(n => resolveTenNhanSu(n, dsNhanSu));
        const allCandidates = [...rawNames, ...resolvedNames].filter(Boolean);
        const match = allCandidates.some(c => c === selectedGiaCong || c.toLowerCase() === selectedGiaCong.toLowerCase());
        if (!match) {
          return false;
        }
      }

      return true;
    });

    // 4. Sắp xếp
    result = [...result].sort((a, b) => {
      if (sortBy === "id_desc") {
        return b.id.localeCompare(a.id, undefined, { numeric: true });
      }
      if (sortBy === "id_asc") {
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      }
      if (sortBy === "deadline_asc") {
        const timeA = a.hanHoanThanh ? new Date(a.hanHoanThanh).getTime() : Infinity;
        const timeB = b.hanHoanThanh ? new Date(b.hanHoanThanh).getTime() : Infinity;
        return timeA - timeB;
      }
      if (sortBy === "deadline_desc") {
        const timeA = a.hanHoanThanh ? new Date(a.hanHoanThanh).getTime() : 0;
        const timeB = b.hanHoanThanh ? new Date(b.hanHoanThanh).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === "sl_desc") {
        return (b.tongSL || 0) - (a.tongSL || 0);
      }
      if (sortBy === "sl_asc") {
        return (a.tongSL || 0) - (b.tongSL || 0);
      }
      return 0;
    });

    return result;
  }, [currentList, searchTerm, selectedLoaiSP, selectedGiaCong, sortBy]);

  const hasActiveFilters = searchTerm !== "" || selectedLoaiSP !== "ALL" || selectedGiaCong !== "ALL" || sortBy !== "id_desc";

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedLoaiSP("ALL");
    setSelectedGiaCong("ALL");
    setSortBy("id_desc");
  };

  const isExtraTabActive = useMemo(() => {
    return extraTabs?.some((t) => t.key === activeTab) ?? false;
  }, [extraTabs, activeTab]);

  const activeExtraTab = useMemo(() => {
    return extraTabs?.find((t) => t.key === activeTab);
  }, [extraTabs, activeTab]);

  return (
    <div className="space-y-4">
      {/* ===== BỘ ĐIỀU KHIỂN & BỘ LỌC CHUẨN ERP ===== */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm p-3.5 space-y-3">
        {/* Hàng 1: Tabs Trạng thái và Toggle View (Mặc định Dạng Bảng) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <TabBar 
            tabs={[
              { key: "dang_lam", label: "Đang chờ / Đang làm", count: dangLamList.length },
              { key: "hoan_thanh", label: "Đã hoàn thành", count: hoanThanhList.length },
              ...(extraTabs?.map((t) => ({ key: t.key, label: t.label, count: t.count, icon: t.icon })) || [])
            ]}
            active={activeTab}
            onChange={(k) => setActiveTab(k)}
          />
          
          {/* Toggle [ Dạng Danh Sách ] (Mặc định) ⇋ [ Dạng Thẻ ] */}
          {!isExtraTabActive && (
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs self-end sm:self-auto shrink-0">
              <button 
                onClick={() => handleSetViewMode("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === "list" ? "bg-teal-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`}
                title="Xem danh sách dạng dòng tối ưu"
              >
                <List className="w-3.5 h-3.5" /> Dạng Danh Sách
              </button>
              <button 
                onClick={() => handleSetViewMode("card")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === "card" ? "bg-teal-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`}
                title="Xem danh sách dạng thẻ trực quan"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Dạng Thẻ
              </button>
            </div>
          )}
        </div>

        {/* Hàng 2: Thanh tìm kiếm và các bộ lọc đa tiêu chí */}
        {!isExtraTabActive && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-1 border-t border-slate-100">
          {/* 1. Ô tìm kiếm Mã SP, Mã Lệnh, Tên SP */}
          <div className="lg:col-span-5 relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã SP (VD: M01), mã lệnh (LC-...), tên SP, màu..."
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

          {/* 2. Dropdown Phân loại sản phẩm */}
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

          {/* 3. Dropdown Người phụ trách */}
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

          {/* 4. Dropdown Sắp xếp theo mã mới nhất / cũ nhất */}
          <div className="lg:col-span-2 relative">
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-600 absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
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
        </div>

        {/* Dòng tóm tắt trạng thái bộ lọc & nút reset */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Tìm thấy: <b className="text-teal-700 font-mono text-sm">{filteredAndSortedList.length}</b> / {currentList.length} lệnh
            </span>
            {hasActiveFilters && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                <Filter className="w-3 h-3" /> Đang lọc kết quả
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 font-bold transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Đặt lại bộ lọc
            </button>
          )}
        </div>
          </>
        )}
      </div>

      {/* ===== HIỂN THỊ DỮ LIỆU ===== */}
      {isExtraTabActive ? (
        activeExtraTab?.content
      ) : filteredAndSortedList.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div className="font-bold text-slate-700">{emptyMessage}</div>
          {hasActiveFilters ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Không có lệnh sản xuất nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.</p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold hover:bg-teal-100 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Xóa bộ lọc tìm kiếm
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Chưa có lệnh nào ở trạng thái này</p>
          )}
        </div>
      ) : (
        viewMode === "card" ? (
          <div className="space-y-4">
            {filteredAndSortedList.map(lc => (
              <div key={lc.id}>
                {renderCard(lc)}
              </div>
            ))}
          </div>
        ) : (
          <LenhCatTableView
            stage={stage}
            list={filteredAndSortedList}
            onColorClick={onColorClick}
            onTyLeClick={onTyLeClick}
            onGiaCongClick={onGiaCongClick}
            onActionClick={onActionClick}
            getStagePC={getStagePC || findPhanCong}
            renderExpandedRow={(lc) => (
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                {renderCard(lc)}
              </div>
            )}
          />
        )
      )}

      {/* Modal chi tiết cho dạng bảng */}
      {selectedLc && (
        <ResponsiveModal 
          open={!!selectedLc} 
          onClose={() => setSelectedLc(null)} 
          title={`Chi tiết lệnh ${selectedLc.id}`}
        >
          <div className="p-4 md:p-6 bg-slate-50/50">
            {renderCard(selectedLc)}
          </div>
        </ResponsiveModal>
      )}
    </div>
  );
}
