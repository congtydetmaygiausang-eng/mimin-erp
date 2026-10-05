"use client";

import React, { useState, useEffect } from "react";
import { LenhCat, TrangThaiCongDoan, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, MauVai } from "@/lib/data/lenh-cat-store";
import { useNhanSu } from "@/lib/data/nhan-su-store";
import TabBar from "./TabBar";
import { LayoutGrid, Table2, List } from "lucide-react";
import { ResponsiveModal } from "./ResponsiveModal";
import { LenhCatTableView, type StageKey } from "./LenhCatTableView";

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
}: Props) {
  const [activeTab, setActiveTab] = useState("dang_lam");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedLc, setSelectedLc] = useState<LenhCat | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_VIEW_KEY) as "card" | "table" | null;
    if (saved === "card" || saved === "table") {
      setViewMode(saved);
    }
  }, []);

  const handleSetViewMode = (mode: "card" | "table") => {
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
  const stageData = data.filter(lc => {
    const pc = findPhanCong(lc);
    return pc !== undefined && pc !== null && (Array.isArray(pc) ? pc.length > 0 : true);
  });

  // Group by status
  const dangLamList = stageData.filter(lc => {
    const pc = findPhanCong(lc);
    if (Array.isArray(pc)) {
      return !pc.every((p: any) => p.trangThaiCD === "hoan_thanh");
    }
    return pc && pc.trangThaiCD !== "hoan_thanh";
  });

  const hoanThanhList = stageData.filter(lc => {
    const pc = findPhanCong(lc);
    if (Array.isArray(pc)) {
      return pc.length > 0 && pc.every((p: any) => p.trangThaiCD === "hoan_thanh");
    }
    return pc && pc.trangThaiCD === "hoan_thanh";
  });

  const currentList = activeTab === "dang_lam" ? dangLamList : hoanThanhList;

  return (
    <div className="space-y-4">
      {/* Header controls: Tabs and View Mode */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <TabBar 
          tabs={[
            { key: "dang_lam", label: "Đang chờ / Đang làm", count: dangLamList.length },
            { key: "hoan_thanh", label: "Đã hoàn thành", count: hoanThanhList.length }
          ]}
          active={activeTab}
          onChange={(k) => setActiveTab(k)}
        />
        
        {/* Toggle [ Dạng Thẻ ] ⇋ [ Dạng Bảng ] */}
        <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
          <button 
            onClick={() => handleSetViewMode("table")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${viewMode === "table" ? "bg-sky-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Table2 className="w-3.5 h-3.5" /> Dạng Bảng
          </button>
          <button 
            onClick={() => handleSetViewMode("card")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${viewMode === "card" ? "bg-sky-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Dạng Thẻ
          </button>
        </div>
      </div>

      {/* Content */}
      {currentList.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="font-bold">{emptyMessage}</div>
        </div>
      ) : (
        viewMode === "card" ? (
          <div className="space-y-4">
            {currentList.map(lc => (
              <div key={lc.id}>
                {renderCard(lc)}
              </div>
            ))}
          </div>
        ) : (
          <LenhCatTableView
            stage={stage}
            list={currentList}
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
