"use client";

import React, { useState } from "react";
import { LenhCat, TrangThaiCongDoan, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE } from "@/lib/data/lenh-cat-store";
import { useNhanSu } from "@/lib/data/nhan-su-store";
import { DateDisplay } from "./DateDisplay";
import TabBar from "./TabBar";
import { LayoutGrid, List, AlertTriangle, Eye, X } from "lucide-react";
import { ResponsiveModal } from "./ResponsiveModal";

interface Props {
  data: LenhCat[];
  stageKeyword: string; // e.g. "cat", "may", "qc" to find the phanCong
  renderCard: (lc: LenhCat) => React.ReactNode;
  emptyMessage?: string;
  isStageAccessible?: (pc: any) => boolean; // custom filter if needed
}

export function StageWorkList({ data, stageKeyword, renderCard, emptyMessage = "Chưa có lệnh nào", isStageAccessible }: Props) {
  const [activeTab, setActiveTab] = useState("dang_lam");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedLc, setSelectedLc] = useState<LenhCat | null>(null);
  
  const { list: dsNhanSu } = useNhanSu();

  // Helper to find the relevant assignment for this stage
  const getPhanCong = (lc: LenhCat) => {
    return lc.phanCong?.find((pc: any) => {
      const match = pc.id === stageKeyword || pc.tenCongDoan?.toLowerCase().includes(stageKeyword);
      if (match && isStageAccessible) {
        return isStageAccessible(pc);
      }
      return match;
    });
  };

  // Filter data that actually belongs to this stage
  const stageData = data.filter(lc => getPhanCong(lc) !== undefined);

  // Group by status
  const dangLamList = stageData.filter(lc => {
    const pc = getPhanCong(lc) as any;
    return pc && pc.trangThaiCD !== "hoan_thanh";
  });

  const hoanThanhList = stageData.filter(lc => {
    const pc = getPhanCong(lc) as any;
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
        
        <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setViewMode("card")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${viewMode === "card" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
          >
            <LayoutGrid className="w-4 h-4" /> Dạng Thẻ
          </button>
          <button 
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${viewMode === "table" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
          >
            <List className="w-4 h-4" /> Dạng Bảng
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Mã Lệnh / Hình</th>
                    <th className="px-4 py-3">Sản Phẩm</th>
                    <th className="px-4 py-3 text-right">Số Lượng</th>
                    <th className="px-4 py-3 text-center">Tiến độ khâu</th>
                    <th className="px-4 py-3">Phụ trách</th>
                    <th className="px-4 py-3 text-right">Hạn giao</th>
                    <th className="px-4 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentList.map(lc => {
                    const pc = getPhanCong(lc) as any;
                    const tt = (pc?.trangThaiCD as TrangThaiCongDoan) || "cho_giao";
                    const style = TRANG_THAI_CD_STYLE[tt] || TRANG_THAI_CD_STYLE["cho_giao"];
                    const isLate = lc.hanHoanThanh < new Date().toISOString().split("T")[0] && tt !== "hoan_thanh";
                    
                    const ptCode = pc?.nguoiMa || pc?.nguoiTen || "";
                    const ptInfo = dsNhanSu.find(nv => nv.maNV === ptCode || nv.hoTen === ptCode);
                    const ptDisplayName = ptInfo?.hoTen || ptCode || "Chưa phân công";

                    return (
                      <tr key={lc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                            {lc.dsMau?.[0]?.img ? (
                              <img src={lc.dsMau[0].img} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-400">NO IMG</div>
                            )}
                          </div>
                          <span className="font-black text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-100/50">{lc.id}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">
                          {lc.tenSP}
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">Mã SP: {lc.maSP || "---"}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-sky-700">
                          {lc.tongSL?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${style.bg} ${style.text} border border-current/20`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {TRANG_THAI_CD_LABELS[tt]}
                            {isLate && <AlertTriangle className="w-3 h-3 ml-0.5 text-rose-500" />}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                          {ptDisplayName}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className={`font-bold ${isLate ? "text-rose-600" : "text-slate-700"}`}>
                            <DateDisplay value={lc.hanHoanThanh} format="dd/MM/yyyy" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => setSelectedLc(lc)}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors mx-auto"
                          >
                            <Eye className="w-3.5 h-3.5" /> Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
