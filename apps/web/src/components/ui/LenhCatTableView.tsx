"use client";

import React, { useState, useMemo } from "react";
import {
  Scissors, Package, Calendar, CheckCircle2, Clock,
  AlertTriangle, Eye, Users, ChevronDown, ChevronUp,
  Sparkles, ShieldCheck, Shirt, Palette, Wind, ClipboardList,
  ExternalLink, Layers, Printer, Edit2, Building2, UserCheck, CheckSquare, List, Maximize2, User
} from "lucide-react";
import ImageLightbox from "@/components/ui/ImageLightbox";
import type { LenhCat, MauVai, CongDoanItem, TrangThaiCongDoan } from "@/lib/data/lenh-cat-store";
import { LOAI_SP_LABELS, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, detectLoaiSP } from "@/lib/data/lenh-cat-store";
import { useNhanSu, resolveTenNhanSu } from "@/lib/data/nhan-su-store";
import { DateDisplay } from "./DateDisplay";
import { inPhieuLenhCatA4 } from "@/lib/phieu-lenh-cat-print";
import ChonPhieuInModal from "./ChonPhieuInModal";

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

export function resolveLenhCatImage(lc: LenhCat): string {
  // 1. Kiểm tra ảnh đại diện chính của lệnh cắt (loại trừ các file pdf/phiếu cắt)
  if (lc.hinhAnh && typeof lc.hinhAnh === "string" && !lc.hinhAnh.includes("/phieu-cat/")) {
    return lc.hinhAnh;
  }
  // 2. Tìm ảnh màu thật của lệnh cắt
  const colorImg = lc.dsMau?.find((m) => m.img && typeof m.img === "string" && !m.img.includes("/phieu-cat/"))?.img;
  if (colorImg) return colorImg;

  // 3. Hình mẫu in thêu nếu có
  if ((lc as any).hinhMauInTheu && typeof (lc as any).hinhMauInTheu === "string") {
    return (lc as any).hinhMauInTheu;
  }

  // 4. Fallback theo mã sản phẩm chuẩn (M01 -> M28, M288, M336, FCASA04, AAS02, v.v.)
  if (lc.maSP) {
    const clean = String(lc.maSP).trim().toUpperCase();
    return `/product-models/${clean}.png`;
  }

  return "";
}

export function resolveSpCode(lc: LenhCat): string {
  if (lc.maSP && typeof lc.maSP === "string" && lc.maSP.trim()) {
    return lc.maSP.trim();
  }
  if (lc.tenSP) {
    const match = lc.tenSP.match(/\b(M\d+|BPJ-[\w-]+|PBJ-[\w-]+|TINA-[\w-]+|[A-Z]{2,6}\d{1,4})\b/i);
    if (match) return match[0].toUpperCase();
  }
  return "";
}

export function isChuyenNhietOrder(lc?: Partial<LenhCat> | null, spCode?: string): boolean {
  if (!lc && !spCode) return false;
  const IN_CHUYEN_NHIET_CODES = new Set([
    "FCASA04", "AAS02", "AAS03", "KLAS17", "KLAS16", "DYAS04", 
    "HKAS5", "HKAS6", "KLAS14", "KLAS15", "NTAS4", "FCASA03", "NTAS5"
  ]);
  const code = (spCode || lc?.maSP || "").trim().toUpperCase();
  if (IN_CHUYEN_NHIET_CODES.has(code)) return true;
  if (lc?.ghiChuInTheu?.toLowerCase().includes("chuyển nhiệt")) return true;
  if (lc?.ghiChuInTheu?.toLowerCase().includes("chuyen nhiet")) return true;
  if (lc?.tenSP?.toLowerCase().includes("chuyển nhiệt")) return true;
  if (lc?.tenSP?.toLowerCase().includes("chuyen nhiet")) return true;
  if (Array.isArray(lc?.phanCong) && lc.phanCong.some((pc: any) => 
    pc?.nguoiMa === "GC-IN-004" || 
    pc?.tenCongDoan?.toLowerCase().includes("chuyển nhiệt") || 
    pc?.tenCongDoan?.toLowerCase().includes("chuyen nhiet")
  )) return true;
  return false;
}

export function getLoaiSPInfo(lc: Partial<LenhCat>): { label: string; style: string } {
  const loaiKey = lc.loaiSP || detectLoaiSP(lc.tenSP || "");
  const rawLabel = (LOAI_SP_LABELS as any)[loaiKey] || loaiKey || "";

  let label = rawLabel;
  if (!label || label === "AoTru" || (label.toLowerCase().includes("trụ") && !label.toLowerCase().includes("bộ"))) {
    label = "Áo Trụ";
  } else if (label === "AoCoTron" || (label.toLowerCase().includes("tròn") && !label.toLowerCase().includes("bộ"))) {
    label = "Áo Cổ Tròn";
  } else if (label === "BoTru" || (label.toLowerCase().includes("bộ") && label.toLowerCase().includes("trụ"))) {
    label = "Bộ Trụ";
  } else if (label === "BoCoTron" || (label.toLowerCase().includes("bộ") && label.toLowerCase().includes("tròn"))) {
    label = "Bộ Cổ Tròn";
  } else if (label === "AoPolo") {
    label = "Áo Trụ";
  }

  if (label === "Áo Trụ" || label === "AoTru" || label === "Áo Polo") {
    return {
      label: "Áo Trụ",
      style: "bg-blue-50 text-blue-800 border-blue-200/90",
    };
  }
  if (label === "Áo Cổ Tròn" || label === "AoCoTron" || label.includes("Cổ Tròn")) {
    return {
      label: "Áo Cổ Tròn",
      style: "bg-teal-50 text-teal-800 border-teal-200/90",
    };
  }
  if (label === "Bộ Trụ" || label === "BoTru") {
    return {
      label: "Bộ Trụ",
      style: "bg-purple-50 text-purple-800 border-purple-200/90",
    };
  }
  if (label === "Bộ Cổ Tròn" || label === "Bộ Tròn" || label === "BoCoTron") {
    return {
      label: "Bộ Cổ Tròn",
      style: "bg-amber-50 text-amber-800 border-amber-200/90",
    };
  }

  return {
    label: label || "---",
    style: "bg-slate-50 text-slate-700 border-slate-200",
  };
}

export function LenhCatListView({
  stage,
  list,
  onColorClick,
  onTyLeClick,
  onGiaCongClick,
  onActionClick,
  getStagePC,
  renderExpandedRow,
}: Props) {
  const [zoomImg, setZoomImg] = useState<{ url: string; alt?: string; badge?: string } | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [printModalLC, setPrintModalLC] = useState<LenhCat | null>(null);
  let dsNhanSu: any[] = [];
  try {
    const ns = useNhanSu();
    dsNhanSu = ns.list || [];
  } catch {}

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
      if (stage === "lenh-cat") {
        const dongGoi = (lc.phanCong || []).find((pItem: any) => pItem.id === "dong_goi" || pItem.id === "dongGoi" || pItem.tenCongDoan?.toLowerCase().includes("đóng gói"));
        if (dongGoi) return p.id === dongGoi.id;
        const lastActive = (lc.phanCong || []).slice().reverse().find((pItem: any) => pItem.trangThaiCD === "dang_lam" || pItem.trangThaiCD === "hoan_thanh");
        if (lastActive) return p.id === lastActive.id;
        return true;
      }
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
    const rawNguoiTen = stage === "lenh-cat"
      ? ((lc as any).phuTrachSX || (lc as any).phuTrachCat || pc?.nguoiTen || "Xưởng nhà")
      : (pc?.nguoiTen || (pc as any)?.nguoiPhuTrach?.ten || "Chưa phân công");
    const nguoiTen = resolveTenNhanSu(rawNguoiTen, dsNhanSu);
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

  // Tổng hợp số liệu toàn danh sách (Footer Summary Row)
  const summary = useMemo(() => {
    let tongKeHoach = 0;
    let tongDat = 0;
    let tongLoi = 0;

    list.forEach(lc => {
      tongKeHoach += (lc.tongSL || 0);
      const m = getStageMetrics(lc);
      tongDat += (stage === "cat" ? m.slCatThucTe : m.slHoanThanh);
      tongLoi += (m.slLoi || 0);
    });

    const tyLe = tongKeHoach > 0 ? Math.round((tongDat / tongKeHoach) * 100) : 0;
    return { tongKeHoach, tongDat, tongLoi, tyLe };
  }, [list, stage]);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden w-full max-w-full">
      {/* ===== MOBILE COMPACT LIST VIEW (< md) ===== */}
      <div className="block md:hidden divide-y divide-slate-100">
        {list.length === 0 ? (
          <div className="py-12 text-center text-slate-400 p-4">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <div className="font-bold text-sm">Không có lệnh sản xuất nào ở khâu này</div>
          </div>
        ) : (
          list.map((lc, index) => {
            const mainImg = resolveLenhCatImage(lc);
            const spCode = resolveSpCode(lc);
            const isChuyenNhiet = isChuyenNhietOrder(lc, spCode);
            const loaiInfo = getLoaiSPInfo(lc);
            const logoUrl = (() => {
              if (!lc.hinhMauInTheu) return "";
              const raw = String(lc.hinhMauInTheu).trim();
              if (raw.startsWith("/") || raw.startsWith("http") || raw.startsWith("data:")) return raw;
              try {
                const parsed = JSON.parse(raw);
                return parsed?.url || (typeof parsed === "string" ? parsed : "");
              } catch {
                return raw;
              }
            })();
            const metrics = getStageMetrics(lc);
            const style = TRANG_THAI_CD_STYLE[metrics.tt] || TRANG_THAI_CD_STYLE["cho_giao"];
            const isExpanded = expandedRowId === lc.id;
            const currentDone = stage === "cat" ? metrics.slCatThucTe : metrics.slHoanThanh;
            const isOverdue = lc.hanHoanThanh && lc.hanHoanThanh < todayStr && metrics.tt !== "hoan_thanh";

            return (
              <div key={lc.id} className="p-3 space-y-2.5 bg-white">
                {/* Row 1: STT + Mã LC + Cột Mã SP riêng + Loại SP riêng + Trạng Thái */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                    <span className="font-mono font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded text-xs border border-teal-200">
                      {lc.id}
                    </span>
                    {lc.maSP && (
                      <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 shadow-2xs">
                        {lc.maSP}
                      </span>
                    )}
                    <span className={`font-bold text-[11px] px-2 py-0.5 rounded border shadow-2xs whitespace-nowrap ${loaiInfo.style}`}>
                      {loaiInfo.label}
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-black rounded-md shrink-0 border ${style.bg} ${style.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {TRANG_THAI_CD_LABELS[metrics.tt] || metrics.tt}
                  </span>
                </div>

                {/* Row 2: Thumbnail kích thước chuẩn + Tên SP + Phân Loại + Hạn Giao + Gia Công */}
                <div className="flex items-start gap-3">
                  <div
                    onClick={() => mainImg && setZoomImg({ url: mainImg, alt: lc.tenSP, badge: isChuyenNhiet ? undefined : spCode })}
                    style={{ width: "50px", height: "62px", minWidth: "50px", maxWidth: "50px", minHeight: "62px", maxHeight: "62px" }}
                    className="rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-zoom-in shadow-2xs relative group"
                    title="Bấm để xem ảnh to phóng lớn"
                  >
                    {mainImg ? (
                      <>
                        <img 
                          src={mainImg} 
                          alt={lc.tenSP} 
                          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} 
                          onError={(e) => {
                            if (spCode && !e.currentTarget.src.includes(`/product-models/${spCode}.png`)) {
                              e.currentTarget.src = `/product-models/${spCode}.png`;
                            } else {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />

                        {/* ĐÓNG DẤU GHI MÃ SẢN PHẨM Ở DƯỚI ĐÁY TẤM HÌNH (trừ 13 mã in chuyển nhiệt vì đã có sẵn mã trong ảnh gốc) */}
                        {spCode && !isChuyenNhiet && (
                          <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-[1px] py-0.5 px-0.5 text-center pointer-events-none z-10 border-t border-amber-400/40">
                            <span className="font-mono font-black text-[9px] text-amber-300 tracking-tight block truncate leading-tight drop-shadow-xs">
                              {spCode}
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white z-20">
                          <Maximize2 className="w-3.5 h-3.5 drop-shadow" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-slate-300">NO</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div 
                      onClick={() => onActionClick?.(lc)}
                      className="font-bold text-slate-800 text-sm leading-snug line-clamp-1 cursor-pointer hover:text-teal-600 transition-colors" 
                      title={`${lc.tenSP} - Nhấp để xem/sửa`}
                    >
                      {lc.tenSP}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2 flex-wrap">
                      <span className={`flex items-center gap-1 font-semibold ${isOverdue ? "text-rose-600 font-bold" : "text-slate-600"}`}>
                        <Calendar className={`w-3 h-3 ${isOverdue ? "text-rose-500" : "text-slate-400"} shrink-0`} />
                        <DateDisplay value={lc.hanHoanThanh} format="dd/MM/yyyy" />
                        {isOverdue && <span className="text-[9px] bg-rose-50 text-rose-600 px-1 rounded border border-rose-200 font-bold">Trễ</span>}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
                      <User className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span className="truncate">Người phụ trách: <b className="text-slate-700">{metrics.nguoiTen}</b></span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Số liệu kế hoạch / đạt / lỗi (3 cột) */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-lg text-center text-xs border border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Kế hoạch</div>
                    <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">{lc.tongSL.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                      {stage === "cat" ? "Cắt TT" : "SL Đạt"}
                    </div>
                    <div className="font-mono font-black text-emerald-700 text-sm mt-0.5">
                      {currentDone.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Lỗi / Hụt</div>
                    <div className={`font-mono font-black text-sm mt-0.5 ${metrics.slLoi > 0 ? "text-rose-600" : "text-slate-400"}`}>
                      {metrics.slLoi > 0 ? `-${metrics.slLoi}` : "0"}
                    </div>
                  </div>
                </div>

                {/* Row 4: Swatches Màu + Thao Tác */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar tab-scroll-mobile py-0.5">
                    {lc.dsMau?.slice(0, 4).map((mau, mi) => {
                      const swatchSrc = (mau.img && !mau.img.includes('/phieu-cat/')) ? mau.img : (lc.hinhAnh && !lc.hinhAnh.includes('/phieu-cat/') ? lc.hinhAnh : "");
                      return (
                        <button
                          key={mi}
                          onClick={() => onColorClick?.(lc, mau)}
                          style={{ width: "26px", height: "32px", minWidth: "26px", maxWidth: "26px" }}
                          className="rounded-md border border-slate-200 overflow-hidden shrink-0 shadow-2xs hover:scale-110 transition-transform"
                          title={mau.ten}
                        >
                          {swatchSrc ? (
                            <img 
                              src={swatchSrc} 
                              alt={mau.ten} 
                              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center bg-slate-100 text-[9px] font-bold text-slate-500">
                              {mau.ten?.slice(0, 1)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {(lc.dsMau?.length || 0) > 4 && (
                      <span
                        onClick={() => setExpandedRowId(isExpanded ? null : lc.id)}
                        className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 cursor-pointer"
                      >
                        +{lc.dsMau!.length - 4}
                      </span>
                    )}

                    {/* Ô Logo trên mobile nếu có */}
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomImg({
                            url: logoUrl,
                            alt: `Hình In/Thêu - ${lc.tenSP}`,
                          });
                        }}
                        style={{ width: "26px", height: "32px", minWidth: "26px", maxWidth: "26px" }}
                        className="rounded-md border border-purple-300 bg-purple-50 p-0.5 overflow-hidden shrink-0 shadow-2xs hover:scale-110 transition-transform relative cursor-pointer"
                        title="Logo In/Thêu - Bấm xem to"
                      >
                        <img
                          src={logoUrl}
                          alt="Logo"
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onActionClick?.(lc)}
                      className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-bold text-xs shadow-2xs"
                      title="Xem và sửa lệnh"
                    >
                      <Edit2 className="w-3.5 h-3.5 inline mr-1" /> Sửa
                    </button>
                    <button
                      onClick={() => setPrintModalLC(lc)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                      title="In phiếu A4 (Lệnh Cắt / Kiểm Đếm)"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (onTyLeClick) onTyLeClick(lc);
                        else if (lc.dsMau?.[0] && onColorClick) onColorClick(lc, lc.dsMau[0]);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs"
                    >
                      Nhập SL
                    </button>
                    <button
                      onClick={() => setExpandedRowId(isExpanded ? null : lc.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details on Mobile */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-100 space-y-2.5">
                    <div className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5 text-teal-600" /> Chi tiết các màu ({lc.dsMau?.length || 0} màu)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {lc.dsMau?.map((mau, mi) => (
                        <div
                          key={mi}
                          onClick={() => onColorClick?.(lc, mau)}
                          className="bg-slate-50 p-2 rounded-lg border border-slate-200 cursor-pointer flex items-center gap-2.5 hover:border-teal-400 transition"
                        >
                          <div style={{ width: "36px", height: "44px", minWidth: "36px" }} className="rounded overflow-hidden border border-slate-200 shrink-0">
                            {mau.img ? (
                              <img src={mau.img} alt={mau.ten} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[9px] text-slate-400 font-bold">NO</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-slate-800 truncate block">{mau.ten}</span>
                            <span className="text-[10px] text-sky-600 font-semibold mt-0.5 block">Nhập SL →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {renderExpandedRow && renderExpandedRow(lc)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ===== DESKTOP LIST VIEW (>= md) ===== */}
      {/* Tách cột Mã SP và In/Thêu riêng, ảnh rõ nét bấm vào xem to, chữ rõ ràng dễ đọc */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[1250px] table-fixed">
          <colgroup>
            <col style={{ width: "38px" }} />  {/* STT */}
            <col style={{ width: "65px" }} />  {/* Cột Ảnh (Bấm để xem to) */}
            <col style={{ width: "80px" }} />  {/* CỘT RIÊNG: Mã Sản Phẩm */}
            <col style={{ width: "105px" }} /> {/* CỘT RIÊNG: Loại Sản Phẩm */}
            <col style={{ width: "215px" }} /> {/* Lệnh & Tên SP */}
            <col style={{ width: "105px" }} /> {/* Hạn Giao */}
            <col style={{ width: "85px" }} />  {/* Kế Hoạch */}
            <col style={{ width: "90px" }} />  {/* SL Đạt */}
            <col style={{ width: "80px" }} />  {/* Lỗi/Hụt */}
            <col style={{ width: "145px" }} /> {/* Người phụ trách */}
            <col style={{ width: "110px" }} /> {/* Trạng Thái */}
            <col style={{ width: "115px" }} /> {/* Màu sắc */}
            <col style={{ width: "85px" }} />  {/* CỘT RIÊNG: Logo In/Thêu */}
            <col style={{ width: "170px" }} /> {/* Thao tác */}
          </colgroup>
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-600 tracking-wider">
              <th className="py-3 px-2 text-center">#</th>
              <th className="py-3 px-2 text-center">Ảnh</th>
              <th className="py-3 px-2 text-center">Mã SP</th>
              <th className="py-3 px-2 text-center">Loại SP</th>
              <th className="py-3 px-2">Lệnh Cắt & Sản Phẩm</th>
              <th className="py-3 px-2">Hạn Giao</th>
              <th className="py-3 px-2 text-right">Kế Hoạch</th>
              <th className="py-3 px-2 text-right">{stage === "cat" ? "Cắt TT" : "SL Đạt"}</th>
              <th className="py-3 px-2 text-right">Lỗi / Hụt</th>
              <th className="py-3 px-2">Người phụ trách</th>
              <th className="py-3 px-2 text-center">Trạng Thái</th>
              <th className="py-3 px-2">Màu Sắc</th>
              <th className="py-3 px-2 text-center">In / Thêu</th>
              <th className="py-3 px-2 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-16 text-center text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <div className="font-bold text-sm text-slate-600">Không có lệnh sản xuất nào ở khâu này</div>
                </td>
              </tr>
            ) : (
              list.map((lc, index) => {
                const mainImg = resolveLenhCatImage(lc);
                const spCode = resolveSpCode(lc);
                const isChuyenNhiet = isChuyenNhietOrder(lc, spCode);
                const loaiInfo = getLoaiSPInfo(lc);
                const logoUrl = (() => {
                  if (!lc.hinhMauInTheu) return "";
                  const raw = String(lc.hinhMauInTheu).trim();
                  if (raw.startsWith("/") || raw.startsWith("http") || raw.startsWith("data:")) return raw;
                  try {
                    const parsed = JSON.parse(raw);
                    return parsed?.url || (typeof parsed === "string" ? parsed : "");
                  } catch {
                    return raw;
                  }
                })();
                const metrics = getStageMetrics(lc);
                const style = TRANG_THAI_CD_STYLE[metrics.tt] || TRANG_THAI_CD_STYLE["cho_giao"];
                const isExpanded = expandedRowId === lc.id;
                const isOverdue = lc.hanHoanThanh && lc.hanHoanThanh < todayStr && metrics.tt !== "hoan_thanh";

                return (
                  <React.Fragment key={lc.id}>
                    <tr className={`hover:bg-teal-50/25 transition-colors ${isExpanded ? "bg-teal-50/20" : ""}`}>
                      {/* # STT */}
                      <td className="py-2.5 px-2 text-center font-bold text-slate-400 text-xs font-mono">
                        {index + 1}
                      </td>

                      {/* CỘT ẢNH: Khung chữ nhật đứng (tỷ lệ 4:5) chuẩn thời trang, click để xem phóng lớn */}
                      <td className="py-2 px-2 text-center">
                        <div
                          onClick={() => mainImg && setZoomImg({ url: mainImg, alt: lc.tenSP, badge: isChuyenNhiet ? undefined : spCode })}
                          style={{ width: "48px", height: "60px", minWidth: "48px", maxWidth: "48px", minHeight: "60px", maxHeight: "60px" }}
                          className="mx-auto rounded-lg bg-slate-100 border border-slate-200/90 overflow-hidden shrink-0 cursor-zoom-in hover:border-teal-500 hover:shadow-md transition-all shadow-2xs group relative"
                          title="Bấm để xem ảnh to phóng lớn"
                        >
                          {mainImg ? (
                            <>
                              <img 
                                src={mainImg} 
                                alt={lc.tenSP} 
                                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} 
                                className="group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  if (spCode && !e.currentTarget.src.includes(`/product-models/${spCode}.png`)) {
                                    e.currentTarget.src = `/product-models/${spCode}.png`;
                                  } else {
                                    e.currentTarget.style.display = 'none';
                                  }
                                }}
                              />

                              {/* ĐÓNG DẤU GHI MÃ SẢN PHẨM Ở DƯỚI ĐÁY TẤM HÌNH (trừ 13 mã in chuyển nhiệt vì đã có sẵn mã trong ảnh gốc) */}
                              {spCode && !isChuyenNhiet && (
                                <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-[1px] py-0.5 px-0.5 text-center pointer-events-none z-10 border-t border-amber-400/40">
                                  <span className="font-mono font-black text-[9px] text-amber-300 tracking-tight block truncate leading-tight drop-shadow-xs">
                                    {spCode}
                                  </span>
                                </div>
                              )}

                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white z-20">
                                <Maximize2 className="w-3.5 h-3.5 drop-shadow" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-slate-300">NO</div>
                          )}
                        </div>
                      </td>

                      {/* CỘT RIÊNG: MÃ SẢN PHẨM (Badge tím pastel tinh tế, chuyên nghiệp) */}
                      <td className="py-2.5 px-2 text-center">
                        {lc.maSP ? (
                          <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded-md border border-indigo-200/80 shadow-2xs inline-block tracking-wide">
                            {lc.maSP}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">---</span>
                        )}
                      </td>

                      {/* CỘT RIÊNG: LOẠI SẢN PHẨM (Áo trụ, Áo cổ tròn, Bộ trụ, Bộ tròn...) */}
                      <td className="py-2.5 px-2 text-center">
                        <span className={`font-bold text-xs px-2.5 py-1 rounded-md border shadow-2xs inline-block tracking-wide whitespace-nowrap ${loaiInfo.style}`}>
                          {loaiInfo.label}
                        </span>
                      </td>

                      {/* Lệnh cắt & Tên sản phẩm */}
                      <td className="py-2.5 px-2">
                        <div className="min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded text-[11px] border border-teal-200/80">
                              {lc.id}
                            </span>
                          </div>
                          <div 
                            onClick={() => onActionClick?.(lc)}
                            className="font-bold text-slate-900 text-sm truncate cursor-pointer hover:text-teal-700 transition-colors leading-snug" 
                            title={`${lc.tenSP} - Nhấp để xem/sửa`}
                          >
                            {lc.tenSP}
                          </div>
                        </div>
                      </td>

                      {/* Hạn Giao */}
                      <td className="py-2.5 px-2">
                        <div className={`font-medium text-xs flex items-center gap-1.5 ${isOverdue ? "text-rose-600 font-bold" : "text-slate-700"}`}>
                          <Calendar className={`w-3.5 h-3.5 ${isOverdue ? "text-rose-500" : "text-slate-400"} shrink-0`} />
                          <DateDisplay value={lc.hanHoanThanh} format="dd/MM/yyyy" />
                        </div>
                        {isOverdue && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Quá hạn
                          </span>
                        )}
                      </td>

                      {/* Kế Hoạch */}
                      <td className="py-2.5 px-2 text-right">
                        <span className="font-mono font-bold text-slate-800 text-sm">
                          {lc.tongSL?.toLocaleString() || "0"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal ml-1">SP</span>
                      </td>

                      {/* SL Đạt */}
                      <td className="py-2.5 px-2 text-right">
                        <span className="font-mono font-bold text-emerald-800 text-sm bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/90 shadow-2xs">
                          {stage === "cat"
                            ? metrics.slCatThucTe?.toLocaleString()
                            : (metrics.slHoanThanh > 0 ? metrics.slHoanThanh?.toLocaleString() : "-")
                          }
                        </span>
                      </td>

                      {/* Lỗi / Hụt */}
                      <td className="py-2.5 px-2 text-right">
                        {metrics.slLoi > 0 ? (
                          <span className="font-mono font-bold text-rose-700 text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shadow-2xs inline-block">
                            -{metrics.slLoi} SP
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal text-xs">0</span>
                        )}
                      </td>

                      {/* Người phụ trách */}
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium truncate" title={metrics.nguoiTen}>
                          <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{metrics.nguoiTen}</span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-2.5 px-2 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-bold border shadow-2xs ${style.bg} ${style.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {TRANG_THAI_CD_LABELS[metrics.tt] || metrics.tt}
                        </span>
                      </td>

                      {/* Màu sắc (Chỉ swatches màu áo / quần) */}
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {lc.dsMau?.slice(0, 3).map((mau, mi) => {
                            const swatchSrc = (mau.img && !mau.img.includes('/phieu-cat/')) ? mau.img : (lc.hinhAnh && !lc.hinhAnh.includes('/phieu-cat/') ? lc.hinhAnh : "");
                            return (
                              <button
                                key={mi}
                                onClick={() => onColorClick?.(lc, mau)}
                                style={{ width: "24px", height: "30px", minWidth: "24px", maxWidth: "24px" }}
                                className="rounded border border-slate-200 overflow-hidden relative shadow-2xs hover:scale-110 transition-transform cursor-pointer"
                                title={`${mau.ten} - Nhấp để nhập số lượng`}
                              >
                                {swatchSrc ? (
                                  <img 
                                    src={swatchSrc} 
                                    alt={mau.ten} 
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : (
                                  <span className="w-full h-full flex items-center justify-center bg-slate-100 text-[8px] font-bold text-slate-400">
                                    {mau.ten?.slice(0, 1)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                          {(lc.dsMau?.length || 0) > 3 && (
                            <span
                              onClick={() => setExpandedRowId(isExpanded ? null : lc.id)}
                              className="text-[10px] font-bold text-slate-600 cursor-pointer bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 hover:bg-slate-200"
                            >
                              +{lc.dsMau!.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CỘT RIÊNG: LOGO IN / THÊU (Kế cột Màu Sắc) */}
                      <td className="py-2.5 px-2 text-center">
                        {logoUrl ? (
                          <div className="flex flex-col items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomImg({
                                  url: logoUrl,
                                  alt: `Hình In/Thêu - ${lc.tenSP}`,
                                });
                              }}
                              style={{ width: "30px", height: "36px", minWidth: "30px", maxWidth: "30px" }}
                              className="rounded-lg border border-purple-300 bg-white hover:border-purple-500 shadow-2xs p-0.5 flex items-center justify-center overflow-hidden hover:scale-110 transition-transform cursor-pointer group relative"
                              title="Logo In/Thêu - Bấm xem to rõ nét"
                            >
                              <img
                                src={logoUrl}
                                alt="Logo"
                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                onError={(e) => { e.currentTarget.style.display = "none"; }}
                              />
                              <div className="absolute inset-0 bg-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-purple-700">
                                <Maximize2 className="w-2.5 h-2.5 drop-shadow" />
                              </div>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 font-medium">---</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-2.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onActionClick?.(lc)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium text-xs shadow-2xs transition-all whitespace-nowrap active:scale-95"
                            title="Xem và chỉnh sửa Lệnh Cắt"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                            <span>Sửa</span>
                          </button>

                          <button
                            onClick={() => setPrintModalLC(lc)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="In phiếu A4 (Lệnh Cắt / Kiểm Đếm)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (onTyLeClick) onTyLeClick(lc);
                              else if (lc.dsMau?.[0] && onColorClick) onColorClick(lc, lc.dsMau[0]);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs transition-colors whitespace-nowrap flex items-center gap-1 active:scale-95"
                            title="Nhập số lượng & tỷ lệ size"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Nhập SL</span>
                          </button>

                          <button
                            onClick={() => setExpandedRowId(isExpanded ? null : lc.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
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
                        <td colSpan={14} className="p-4">
                          <div className="space-y-3.5">
                            <div>
                              <div className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Palette className="w-3.5 h-3.5 text-teal-600" /> Chi tiết các màu ({lc.dsMau?.length || 0} màu)
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                                {lc.dsMau?.map((mau, mi) => (
                                  <div
                                    key={mi}
                                    onClick={() => onColorClick?.(lc, mau)}
                                    className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-teal-500 hover:shadow-sm transition-all cursor-pointer flex flex-col items-center group relative"
                                  >
                                    <div style={{ width: "54px", height: "66px" }} className="rounded overflow-hidden border border-slate-100 mb-1.5 relative">
                                      {mau.img ? (
                                        <>
                                          <img 
                                            src={mau.img} 
                                            alt={mau.ten} 
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                            className="group-hover:scale-105 transition-transform" 
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                          />
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setZoomImg({ url: mau.img!, alt: `${mau.ten} - ${lc.tenSP}`, badge: isChuyenNhiet ? undefined : spCode });
                                            }}
                                            className="absolute bottom-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Xem to ảnh màu"
                                          >
                                            <Maximize2 className="w-2.5 h-2.5" />
                                          </button>
                                        </>
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[9px] text-slate-400 font-bold">NO</div>
                                      )}
                                    </div>
                                    <span className="font-bold text-xs text-slate-800 truncate w-full text-center">{mau.ten}</span>
                                    <span className="text-[10px] text-sky-700 font-bold mt-1 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                                      Nhập số lượng
                                    </span>
                                  </div>
                                ))}

                                {/* Ô LOGO IN / THÊU TRONG DÒNG MỞ RỘNG */}
                                {logoUrl && (
                                  <div
                                    onClick={() => setZoomImg({ url: logoUrl, alt: `Hình In/Thêu - ${lc.tenSP}` })}
                                    className="bg-purple-50/60 p-2.5 rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-sm transition-all cursor-pointer flex flex-col items-center group relative"
                                    title="Logo In/Thêu - Nhấp để xem ảnh to rõ nét"
                                  >
                                    <div style={{ width: "54px", height: "66px" }} className="rounded bg-white border border-purple-200/80 mb-1.5 p-1 flex items-center justify-center relative overflow-hidden">
                                      <img
                                        src={logoUrl}
                                        alt="Logo In/Thêu"
                                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                        className="group-hover:scale-105 transition-transform"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                      />
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setZoomImg({ url: logoUrl, alt: `Hình In/Thêu - ${lc.tenSP}` });
                                        }}
                                        className="absolute bottom-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Xem to logo"
                                      >
                                        <Maximize2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                    <span className="font-bold text-xs text-purple-900 truncate w-full text-center">Logo In/Thêu</span>
                                    <span className="text-[10px] text-purple-700 font-bold mt-1 bg-white px-2 py-0.5 rounded border border-purple-200">
                                      Xem ảnh to
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {renderExpandedRow && (
                              <div className="pt-2 border-t border-slate-200/80">
                                {renderExpandedRow(lc)}
                              </div>
                            )}

                            {onGiaCongClick && (
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                                <button
                                  onClick={() => onGiaCongClick(lc, "ao")}
                                  className="px-3 py-1.5 rounded-md bg-violet-50 text-violet-700 hover:bg-violet-100 font-bold text-xs border border-violet-200 transition-colors"
                                >
                                  Gia công áo
                                </button>
                                <button
                                  onClick={() => onGiaCongClick(lc, "quan")}
                                  className="px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs border border-indigo-200 transition-colors"
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

          {/* ===== DÒNG TỔNG KẾT DANH SÁCH (TFOOT) CHUẨN ERP ===== */}
          {list.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 text-xs font-bold text-slate-800">
                <td colSpan={6} className="py-3 px-3 uppercase tracking-wider font-black text-slate-700">
                  Tổng cộng ({list.length} lệnh sản xuất)
                </td>
                <td className="py-3 px-2 text-right font-mono font-black text-slate-800 text-sm">
                  {summary.tongKeHoach.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">SP</span>
                </td>
                <td className="py-3 px-2 text-right font-mono font-black text-emerald-800 text-sm">
                  {summary.tongDat.toLocaleString()} <span className="text-[10px] font-normal text-emerald-600">SP</span>
                </td>
                <td className="py-3 px-2 text-right font-mono font-black text-sm">
                  {summary.tongLoi > 0 ? (
                    <span className="text-rose-600">-{summary.tongLoi.toLocaleString()} SP</span>
                  ) : (
                    <span className="text-slate-400">0 SP</span>
                  )}
                </td>
                <td colSpan={2} className="py-3 px-2 text-center text-xs font-bold text-slate-600">
                  Tiến độ: <span className="text-teal-700 font-mono font-black">{summary.tyLe}%</span>
                </td>
                <td colSpan={3} className="py-3 px-2 text-right text-[11px] text-slate-500 font-medium">
                  MIMIN ERP
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {zoomImg && (
        <ImageLightbox src={zoomImg.url} alt={zoomImg.alt} badge={zoomImg.badge} onClose={() => setZoomImg(null)} />
      )}

      {printModalLC && (
        <ChonPhieuInModal
          open={!!printModalLC}
          onClose={() => setPrintModalLC(null)}
          lenhCat={printModalLC}
        />
      )}
    </div>
  );
}

// Giữ lại alias LenhCatTableView cho tương thích ngược
export const LenhCatTableView = LenhCatListView;
