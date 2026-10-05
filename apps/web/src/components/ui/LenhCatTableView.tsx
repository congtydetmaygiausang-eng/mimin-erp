"use client";

import React, { useState } from "react";
import { 
  Scissors, Package, Calendar, CheckCircle2, Clock, 
  AlertTriangle, Eye, Users, ChevronDown, ChevronUp, 
  Sparkles, ShieldCheck, Shirt, Palette, Wind, ClipboardList,
  ExternalLink, Layers
} from "lucide-react";
import ImageLightbox from "@/components/ui/ImageLightbox";
import type { LenhCat, MauVai, CongDoanItem, TrangThaiCongDoan } from "@/lib/data/lenh-cat-store";
import { LOAI_SP_LABELS, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE } from "@/lib/data/lenh-cat-store";
import { DateDisplay } from "./DateDisplay";

export type StageKey = 
  | "lenh-cat"
  | "cat" 
  | "in-theu" 
  | "may" 
  | "qc" 
  | "khuy-nut" 
  | "ui" 
  | "dong-goi" 
  | "hoan-thien";

interface Props {
  stage: StageKey;
  list: LenhCat[];
  onColorClick?: (lc: LenhCat, mau: MauVai) => void;
  onTyLeClick?: (lc: LenhCat) => void;
  onGiaCongClick?: (lc: LenhCat, type?: "ao" | "quan") => void;
  onActionClick?: (lc: LenhCat) => void;
  getStagePC?: (lc: LenhCat) => any;
  renderExpandedRow?: (lc: LenhCat) => React.ReactNode;
}

export function LenhCatTableView({
  stage,
  list,
  onColorClick,
  onTyLeClick,
  onGiaCongClick,
  onActionClick,
  getStagePC,
  renderExpandedRow,
}: Props) {
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Helper tính số lượng và lỗi theo khâu
  function getStageMetrics(lc: LenhCat) {
    const pc = getStagePC ? getStagePC(lc) : (lc.phanCong || []).find((p: any) => {
      if (stage === "cat") return p.id === "cat" || p.tenCongDoan?.toLowerCase().includes("cắt");
      if (stage === "in-theu") return p.id === "in" || p.id === "theu" || p.tenCongDoan?.toLowerCase().includes("in");
      if (stage === "may") return p.id === "may" || p.id === "may_ao" || p.id === "may_quan" || p.tenCongDoan?.toLowerCase().includes("may");
      if (stage === "qc") return p.id === "qc" || p.tenCongDoan?.toLowerCase().includes("qc");
      if (stage === "khuy-nut") return p.id === "khuy_nut" || p.tenCongDoan?.toLowerCase().includes("khuy");
      if (stage === "ui") return p.id === "ui" || p.tenCongDoan?.toLowerCase().includes("ủi");
      if (stage === "dong-goi") return p.id === "dong_goi" || p.tenCongDoan?.toLowerCase().includes("đóng gói");
      return false;
    });

    // Tính SL thực tế cắt (Single source of truth)
    const slCatThucTe = (lc.dsMau || []).reduce((sum, m) => {
      if (m.slThucTe) return sum + m.slThucTe;
      if (m.phanBoSize && m.phanBoSize.length > 0) {
        return sum + m.phanBoSize.reduce((s, b) => s + (b.sl || 0), 0);
      }
      return sum + (m.slDuKien || 0);
    }, 0) || lc.tongSL;

    // SL Đạt của khâu
    const slHoanThanh = pc?.soLuongHoanThanh ?? (pc?.trangThaiCD === "hoan_thanh" ? (pc?.soLuong || slCatThucTe) : 0);
    const slLoi = pc?.soLuongLoi || 0;
    const lyDoLoi = pc?.lyDoLoi || "";
    const nguoiTen = pc?.nguoiTen || pc?.nguoiPhuTrach?.ten || "Chưa phân công";
    const tt = (pc?.trangThaiCD as TrangThaiCongDoan) || (lc.trangThai === "HoanThanh" ? "hoan_thanh" : "cho_giao");

    return {
      pc,
      slCatThucTe,
      slHoanThanh,
      slLoi,
      lyDoLoi,
      nguoiTen,
      tt
    };
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th className="py-3 px-3 min-w-[200px]">Lệnh Cắt & Sản Phẩm</th>
              <th className="py-3 px-3 min-w-[100px]">Hạn Giao</th>
              <th className="py-3 px-3 text-right min-w-[90px]">Kế Hoạch</th>
              <th className="py-3 px-3 text-right min-w-[100px]">
                {stage === "cat" ? "Cắt Thực Tế" : "SL Đạt (Xong)"}
              </th>
              <th className="py-3 px-3 text-right min-w-[90px]">Lỗi / Hao Hụt</th>
              <th className="py-3 px-3 min-w-[130px]">Phụ Trách</th>
              <th className="py-3 px-3 min-w-[100px] text-center">Trạng Thái</th>
              <th className="py-3 px-3 min-w-[140px]">Danh Sách Màu</th>
              <th className="py-3 px-3 text-right min-w-[130px]">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <div className="font-bold text-sm">Không có lệnh sản xuất nào ở khâu này</div>
                </td>
              </tr>
            ) : (
              list.map((lc, index) => {
                const mainImg = lc.dsMau?.[0]?.img || "";
                const metrics = getStageMetrics(lc);
                const style = TRANG_THAI_CD_STYLE[metrics.tt] || TRANG_THAI_CD_STYLE["cho_giao"];
                const isExpanded = expandedRowId === lc.id;

                return (
                  <React.Fragment key={lc.id}>
                    <tr className={`hover:bg-sky-50/40 transition-colors ${isExpanded ? "bg-sky-50/30" : ""}`}>
                      {/* # */}
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* Lệnh cắt & Tên SP */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail */}
                          <div 
                            onClick={() => mainImg && setZoomImg(mainImg)}
                            className="w-12 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-pointer hover:border-sky-400 transition-all relative group shadow-sm"
                            title="Nhấp để xem ảnh to"
                          >
                            {mainImg ? (
                              <img src={mainImg} alt={lc.tenSP} className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-300">NO IMG</div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-mono font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-[11px] border border-teal-100">
                                {lc.id}
                              </span>
                              {lc.maSP && (
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {lc.maSP}
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-slate-800 text-xs md:text-sm truncate max-w-[220px]" title={lc.tenSP}>
                              {lc.tenSP}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              {LOAI_SP_LABELS[lc.loaiSP] || lc.loaiSP || "Bộ/Áo"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Hạn Giao */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <DateDisplay value={lc.hanHoanThanh} format="dd/MM/yyyy" />
                        </div>
                      </td>

                      {/* Kế hoạch */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-600">
                        {lc.tongSL?.toLocaleString() || "0"}
                      </td>

                      {/* SL Đạt */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-black text-emerald-700 text-sm bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                          {stage === "cat" 
                            ? metrics.slCatThucTe?.toLocaleString() 
                            : (metrics.slHoanThanh > 0 ? metrics.slHoanThanh?.toLocaleString() : "-")
                          }
                        </span>
                      </td>

                      {/* Lỗi / Hao Hụt */}
                      <td className="py-3 px-3 text-right">
                        {metrics.slLoi > 0 ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="font-black text-rose-600 text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> {metrics.slLoi} SP
                            </span>
                            {metrics.lyDoLoi && (
                              <span className="text-[9px] text-rose-500 font-medium truncate max-w-[90px]" title={metrics.lyDoLoi}>
                                {metrics.lyDoLoi}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-medium text-xs">0</span>
                        )}
                      </td>

                      {/* Phụ trách */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold truncate max-w-[130px]" title={metrics.nguoiTen}>
                          <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{metrics.nguoiTen}</span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold border ${style.bg} ${style.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {TRANG_THAI_CD_LABELS[metrics.tt] || metrics.tt}
                        </span>
                      </td>

                      {/* Danh sách màu */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 flex-wrap max-w-[160px]">
                          {lc.dsMau?.slice(0, 4).map((mau, mi) => (
                            <button
                              key={mi}
                              onClick={() => onColorClick?.(lc, mau)}
                              className="w-6 h-7 rounded border border-slate-200 overflow-hidden relative shadow-2xs hover:scale-110 transition-transform cursor-pointer"
                              title={`${mau.ten} - Nhấp để nhập số lượng`}
                            >
                              {mau.img ? (
                                <img src={mau.img} alt={mau.ten} className="w-full h-full object-cover" />
                              ) : (
                                <span className="w-full h-full flex items-center justify-center bg-slate-100 text-[8px] font-bold text-slate-400">
                                  {mau.ten?.slice(0, 1)}
                                </span>
                              )}
                            </button>
                          ))}
                          {(lc.dsMau?.length || 0) > 4 && (
                            <span 
                              onClick={() => setExpandedRowId(isExpanded ? null : lc.id)}
                              className="text-[10px] font-bold text-slate-500 cursor-pointer bg-slate-100 px-1 py-0.5 rounded hover:bg-slate-200"
                            >
                              +{lc.dsMau!.length - 4}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Nhập SL / Tỷ lệ */}
                          <button
                            onClick={() => {
                              if (onTyLeClick) onTyLeClick(lc);
                              else if (lc.dsMau?.[0] && onColorClick) onColorClick(lc, lc.dsMau[0]);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] shadow-sm transition-colors whitespace-nowrap"
                          >
                            Nhập SL
                          </button>

                          {/* Nút Xem chi tiết / Thu gọn */}
                          <button
                            onClick={() => setExpandedRowId(isExpanded ? null : lc.id)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                            title={isExpanded ? "Thu gọn" : "Xem chi tiết"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* DÒNG MỞ RỘNG (EXPANDED ROW) */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <td colSpan={10} className="p-4 md:p-5">
                          <div className="space-y-4">
                            {/* Danh sách màu đầy đủ */}
                            <div>
                              <div className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Palette className="w-3.5 h-3.5 text-teal-600" /> Chi tiết các màu ({lc.dsMau?.length || 0} màu)
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                {lc.dsMau?.map((mau, mi) => (
                                  <div 
                                    key={mi}
                                    onClick={() => onColorClick?.(lc, mau)}
                                    className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer flex flex-col items-center group"
                                  >
                                    <div className="w-16 h-20 rounded-lg overflow-hidden border border-slate-100 mb-2 relative">
                                      {mau.img ? (
                                        <img src={mau.img} alt={mau.ten} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[10px] text-slate-400 font-bold">NO IMG</div>
                                      )}
                                    </div>
                                    <span className="font-bold text-xs text-slate-800 truncate w-full text-center">{mau.ten}</span>
                                    <span className="text-[10px] text-sky-600 font-semibold mt-1 bg-sky-50 px-2 py-0.5 rounded-full">
                                      Nhập số lượng
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Khung custom renderer của từng trang nếu có */}
                            {renderExpandedRow && (
                              <div className="pt-3 border-t border-slate-200/80">
                                {renderExpandedRow(lc)}
                              </div>
                            )}

                            {/* Gia công buttons nếu trang cắt / may */}
                            {(onGiaCongClick) && (
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                                <button
                                  onClick={() => onGiaCongClick(lc, "ao")}
                                  className="px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 font-bold text-xs border border-violet-200 transition-colors"
                                >
                                  Gia công áo
                                </button>
                                <button
                                  onClick={() => onGiaCongClick(lc, "quan")}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs border border-indigo-200 transition-colors"
                                >
                                  Gia công quần
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {zoomImg && (
        <ImageLightbox src={zoomImg} onClose={() => setZoomImg(null)} />
      )}
    </div>
  );
}
