"use client";

// ============ LENH CAT FLOW BOARD (10 CÔNG ĐOẠN SẢN XUẤT) ============
// Bảng theo dõi & điều phối Lệnh Cắt theo chuẩn quy trình 10 bước (AGENTS.md)
// 1. Kế hoạch -> 2. Lệnh Cắt -> 3. Cắt -> 4. In/Thêu -> 5. May -> 6. QC -> 7. Khuy Nút -> 8. Ủi -> 9. Đóng Gói -> 10. Hoàn Thiện
// Dữ liệu thời gian thực từ useLenhCat() (Single Source of Truth)

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Scissors, Shirt, ShieldCheck, Package, Clock, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, Eye, Layers, CircleDot,
  Wind, Warehouse, ExternalLink, SlidersHorizontal, FileText, Check, Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE,
  LOAI_SP_LABELS, type TrangThaiCongDoan, type LenhCat,
} from "@/lib/data/lenh-cat-store";
import { formatVNDShort } from "@/lib/data/real-data";
import { DateDisplay } from "@/components/ui";
import { TyLeSizeModal } from "@/components/modals/TyLeSizeModal";
import { useSession } from "@/components/session-provider";

// 10 Bước quy trình sản xuất chuẩn mực MIMIN ERP (AGENTS.md 3.1)
export const QUY_TRINH_10_BUOC = [
  {
    step: 1,
    name: "Kế hoạch SX",
    desc: "Kế hoạch & vật tư",
    route: "/ke-hoach-san-xuat",
    icon: FileText,
    key: "khsx",
    bgClass: "bg-blue-50/80 hover:bg-blue-100/90 dark:bg-blue-950/20 border-blue-200/90 hover:border-blue-400",
    iconBgClass: "bg-blue-600 text-white shadow-xs shadow-blue-300",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300",
  },
  {
    step: 2,
    name: "Lệnh cắt",
    desc: "Sơ đồ cắt & định mức",
    route: "/lenh-cat",
    icon: SlidersHorizontal,
    key: "lc",
    bgClass: "bg-cyan-50/80 hover:bg-cyan-100/90 dark:bg-cyan-950/20 border-cyan-200/90 hover:border-cyan-400",
    iconBgClass: "bg-cyan-600 text-white shadow-xs shadow-cyan-300",
    badgeClass: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300",
  },
  {
    step: 3,
    name: "Tổ Cắt",
    desc: "Chốt SL thực tế (Size)",
    route: "/to-cat-work",
    icon: Scissors,
    key: "cat",
    bgClass: "bg-sky-50/80 hover:bg-sky-100/90 dark:bg-sky-950/20 border-sky-200/90 hover:border-sky-400",
    iconBgClass: "bg-sky-600 text-white shadow-xs shadow-sky-300",
    badgeClass: "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300",
  },
  {
    step: 4,
    name: "In / Thêu",
    desc: "Auto-Cascade & lỗi",
    route: "/ui-intd",
    icon: Layers,
    key: "in_theu",
    bgClass: "bg-purple-50/80 hover:bg-purple-100/90 dark:bg-purple-950/20 border-purple-200/90 hover:border-purple-400",
    iconBgClass: "bg-purple-600 text-white shadow-xs shadow-purple-300",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300",
  },
  {
    step: 5,
    name: "Tổ May",
    desc: "May Áo & Quần bộ",
    route: "/to-may-work",
    icon: Shirt,
    key: "may",
    bgClass: "bg-violet-50/80 hover:bg-violet-100/90 dark:bg-violet-950/20 border-violet-200/90 hover:border-violet-400",
    iconBgClass: "bg-violet-600 text-white shadow-xs shadow-violet-300",
    badgeClass: "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-300",
  },
  {
    step: 6,
    name: "QC Kiểm hàng",
    desc: "Kiểm tra Đạt / Lỗi",
    route: "/to-qc-work",
    icon: ShieldCheck,
    key: "qc",
    bgClass: "bg-rose-50/80 hover:bg-rose-100/90 dark:bg-rose-950/20 border-rose-200/90 hover:border-rose-400",
    iconBgClass: "bg-rose-600 text-white shadow-xs shadow-rose-300",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300",
  },
  {
    step: 7,
    name: "Khuy nút",
    desc: "Đơm khuy, đóng nút",
    route: "/ui-khuy-nut",
    icon: CircleDot,
    key: "khuy_nut",
    bgClass: "bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/20 border-amber-200/90 hover:border-amber-400",
    iconBgClass: "bg-amber-600 text-white shadow-xs shadow-amber-300",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
  },
  {
    step: 8,
    name: "Tổ Ủi",
    desc: "Ủi phẳng & hao hụt",
    route: "/ui-ui",
    icon: Wind,
    key: "ui",
    bgClass: "bg-teal-50/80 hover:bg-teal-100/90 dark:bg-teal-950/20 border-teal-200/90 hover:border-teal-400",
    iconBgClass: "bg-teal-600 text-white shadow-xs shadow-teal-300",
    badgeClass: "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300",
  },
  {
    step: 9,
    name: "Đóng gói",
    desc: "Gấp bao bì theo size",
    route: "/ui-dong-goi",
    icon: Package,
    key: "dong_goi",
    bgClass: "bg-emerald-50/80 hover:bg-emerald-100/90 dark:bg-emerald-950/20 border-emerald-200/90 hover:border-emerald-400",
    iconBgClass: "bg-emerald-600 text-white shadow-xs shadow-emerald-300",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
  },
  {
    step: 10,
    name: "Hoàn thiện / Kho",
    desc: "Nhập kho & chốt lương",
    route: "/to-ht-work",
    icon: Warehouse,
    key: "nhap_kho",
    bgClass: "bg-green-50/80 hover:bg-green-100/90 dark:bg-green-950/20 border-green-200/90 hover:border-green-400",
    iconBgClass: "bg-green-600 text-white shadow-xs shadow-green-300",
    badgeClass: "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300",
  },
] as const;

// Các công đoạn chạy trong xưởng hiển thị ở bảng điều phối
export const CONG_DOAN_FLOW = [
  { key: "cat",       label: "Cắt",       icon: Scissors,     color: "sky",     route: "/to-cat-work" },
  { key: "in_theu",   label: "In/Thêu",   icon: Layers,       color: "purple",  route: "/ui-intd" },
  { key: "may_ao",    label: "May Áo",    icon: Shirt,        color: "violet",  route: "/to-may-work" },
  { key: "may_quan",  label: "May Quần",  icon: Shirt,        color: "indigo",  route: "/to-may-work" },
  { key: "qc",        label: "QC",        icon: ShieldCheck,  color: "rose",    route: "/to-qc-work" },
  { key: "khuy_nut",  label: "Khuy Nút",  icon: CircleDot,    color: "amber",   route: "/ui-khuy-nut" },
  { key: "ui",        label: "Ủi",        icon: Wind,         color: "teal",    route: "/ui-ui" },
  { key: "dong_goi",  label: "Đóng gói",  icon: Package,      color: "emerald", route: "/ui-dong-goi" },
  { key: "nhap_kho",  label: "Hoàn thiện",icon: Warehouse,    color: "emerald", route: "/to-ht-work" },
] as const;

const DOT_COLOR: Record<string, string> = {
  cho_giao:   "bg-slate-300",
  dang_lam:   "bg-amber-400 animate-pulse",
  cho_qc:     "bg-sky-400 animate-pulse",
  hoan_thanh: "bg-emerald-500",
  co_loi:     "bg-rose-500",
  "":         "bg-slate-200",
};

const CELL_BG: Record<string, string> = {
  cho_giao:   "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100",
  dang_lam:   "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100",
  cho_qc:     "bg-sky-50 border-sky-300 text-sky-800 hover:bg-sky-100",
  hoan_thanh: "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100",
  co_loi:     "bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100",
  "":         "bg-slate-50/50 border-slate-100 text-slate-400",
};

export function LenhCatFlowBoard() {
  const { dsLenhCat, capNhatCongDoan, suaLenhCat } = useLenhCat();
  const { user } = useSession();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalTyLe, setModalTyLe] = useState<{ lc: LenhCat; mauIdx: number } | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Tìm kiếm công đoạn trong Lệnh Cắt theo key
  function getPCByKey(lc: LenhCat, key: string) {
    return lc.phanCong?.find((pc: any) => {
      const id = (pc.id || "").toLowerCase();
      const ten = (pc.tenCongDoan || "").toLowerCase();
      switch (key) {
        case "cat":
          return id === "cat" || ten.includes("cắt");
        case "in_theu":
          return id === "in_theu" || id === "in" || id === "theu" || ten.includes("in") || ten.includes("thêu");
        case "may_ao":
          return id === "may_ao" || id === "mayao" || (ten.includes("may") && ten.includes("áo")) || (ten.includes("may") && !ten.includes("quần"));
        case "may_quan":
          return id === "may_quan" || id === "mayquan" || (ten.includes("may") && ten.includes("quần"));
        case "qc":
          return id === "qc" || ten.includes("qc") || ten.includes("kiểm");
        case "khuy_nut":
          return id === "khuy_nut" || id === "khuynut" || ten.includes("khuy") || ten.includes("nút");
        case "ui":
          return id === "ui" || ten.includes("ủi");
        case "dong_goi":
          return id === "dong_goi" || id === "donggoi" || ten.includes("đóng gói");
        case "nhap_kho":
          return id === "nhap_kho" || id === "nhapkho" || id === "hoan_thien" || ten.includes("nhập kho") || ten.includes("hoàn thiện");
        default:
          return id === key || ten.includes(key);
      }
    });
  }

  // Đếm số lệnh đang ở từng công đoạn
  const stageStats = useMemo(() => {
    const stats: Record<string, number> = {};
    CONG_DOAN_FLOW.forEach((cd) => {
      stats[cd.key] = dsLenhCat.filter((lc) => {
        const pc = getPCByKey(lc, cd.key);
        return pc && (pc.trangThaiCD === "dang_lam" || pc.trangThaiCD === "cho_qc");
      }).length;
    });
    return stats;
  }, [dsLenhCat]);

  // Bộ lọc danh sách
  const filtered = useMemo(() => {
    return dsLenhCat.filter((lc) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const match =
          lc.id.toLowerCase().includes(q) ||
          lc.tenSP.toLowerCase().includes(q) ||
          lc.maSP.toLowerCase().includes(q) ||
          (lc.khachHang || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      if (statusFilter !== "all") {
        if (statusFilter === "tre-han") {
          const isLate = lc.hanHoanThanh < todayStr && lc.trangThai !== "HoanThanh";
          if (!isLate) return false;
        } else if (statusFilter === "co-loi") {
          const hasError = lc.phanCong?.some((pc: any) => pc.trangThaiCD === "co_loi" || (pc.soLuongLoi || 0) > 0);
          if (!hasError) return false;
        } else if (statusFilter === "dang-sx") {
          if (lc.trangThai === "HoanThanh" || lc.trangThai === "Nhap") return false;
        } else if (statusFilter === "hoan-thanh") {
          if (lc.trangThai !== "HoanThanh") return false;
        }
      }

      if (stageFilter !== "all") {
        const pc = getPCByKey(lc, stageFilter);
        if (!pc || (pc.trangThaiCD !== "dang_lam" && pc.trangThaiCD !== "cho_qc")) return false;
      }

      return true;
    });
  }, [dsLenhCat, search, statusFilter, stageFilter, todayStr]);

  // Cập nhật nhanh trạng thái công đoạn
  function handleCycleStatus(lc: LenhCat, pc: any) {
    if (!pc) return;
    const current = pc.trangThaiCD || "cho_giao";
    const nextMap: Record<string, TrangThaiCongDoan> = {
      cho_giao: "dang_lam",
      dang_lam: "hoan_thanh",
      hoan_thanh: "co_loi",
      co_loi: "cho_giao",
    };
    const nextTT = nextMap[current] || "dang_lam";

    capNhatCongDoan(lc.id, pc.id, {
      trangThaiCD: nextTT,
      ...(nextTT === "hoan_thanh" && !pc.soLuongHoanThanh ? { soLuongHoanThanh: pc.soLuong || lc.tongSLThucTe || lc.tongSL } : {}),
    });
    toast.success(`${lc.id} · ${pc.tenCongDoan}: Đã chuyển sang "${TRANG_THAI_CD_LABELS[nextTT]}"`);
  }

  // Lưu tỷ lệ size từ TyLeSizeModal
  function handleSaveTyLe(mauIdx: number, newTyLe: Record<string, { size: string; sl: number }[]>, _tongDuCat?: number, fixedPhanCong?: any) {
    if (!modalTyLe) return;
    const lc = modalTyLe.lc;
    const newDsMau = [...(lc.dsMau || [])];
    if (!newDsMau[mauIdx]) return;

    newDsMau[mauIdx] = {
      ...newDsMau[mauIdx],
      tyLeSizeChiTiet: { ...newDsMau[mauIdx].tyLeSizeChiTiet, ...newTyLe },
    };

    // Đồng bộ phanBoSize với số liệu khâu Cắt
    const catKeySync = Object.keys(newTyLe).find(k =>
      k.toLowerCase().includes("cat") ||
      (fixedPhanCong?.find((p: any) => p.id === k)?.tenCongDoan || "").toLowerCase().includes("cắt") ||
      (lc.phanCong?.find((p: any) => p.id === k)?.tenCongDoan || "").toLowerCase().includes("cắt")
    );
    if (catKeySync && newTyLe[catKeySync]) {
      newDsMau[mauIdx].phanBoSize = newTyLe[catKeySync].map((sz: any) => ({
        size: sz.size,
        sl: sz.sl || 0,
      }));
    }

    // Tự động tính lại tổng SL thực tế của khâu Cắt
    let totalThucTe = 0;
    newDsMau.forEach(m => {
      if (m.tyLeSizeChiTiet) {
        const catKey = Object.keys(m.tyLeSizeChiTiet).find(k =>
          k.toLowerCase().includes("cat") ||
          (lc.phanCong?.find((p: any) => p.id === k)?.tenCongDoan || "").toLowerCase().includes("cắt") ||
          (fixedPhanCong?.find((p: any) => p.id === k)?.tenCongDoan || "").toLowerCase().includes("cắt")
        );
        if (catKey && m.tyLeSizeChiTiet[catKey]) {
          totalThucTe += m.tyLeSizeChiTiet[catKey].reduce((sum, s) => sum + (s.sl || 0), 0);
        }
      }
    });

    const updatedPatch: Partial<LenhCat> = {
      dsMau: newDsMau,
      ...(totalThucTe > 0 ? { tongSLThucTe: totalThucTe } : {}),
      ...(fixedPhanCong ? { phanCong: fixedPhanCong } : {}),
    };

    if (user) {
      suaLenhCat(lc.id, updatedPatch, user);
    }
    setModalTyLe(null);
    toast.success(`Đã cập nhật tỷ lệ size cho ${lc.id}`);
  }

  return (
    <div className="space-y-4">
      {/* 10 BƯỚC QUY TRÌNH SẢN XUẤT CHUẨN (BỐ CỤC 5 CỘT X 2 HÀNG RỘNG RÃI, KHÔNG CẮT CHỮ) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
            <span className="uppercase tracking-wider">Quy trình điều hành 10 bước tuần tự (Chuẩn MIMIN ERP)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              Single Source of Truth
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click vào bước để lọc lệnh hoặc bấm ↗ để mở bàn làm việc
          </span>
        </div>

        {/* 10 BƯỚC DÂY CHUYỀN: 5 CỘT X 2 HÀNG RỘNG RÃI, NỀN MÀU NHẸ & ICON NỔI BẬT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {QUY_TRINH_10_BUOC.map((step) => {
            const Icon = step.icon;
            const activeCount = stageStats[step.key] || 0;
            const isFilterActive = stageFilter === step.key;

            return (
              <div
                key={step.step}
                className={`relative group rounded-2xl p-3.5 border transition-all text-left flex flex-col justify-between shadow-2xs hover:shadow-md ${step.bgClass} ${
                  isFilterActive
                    ? "ring-2 ring-brand-500 shadow-md scale-[1.02]"
                    : ""
                }`}
              >
                {/* Header card: Step number + Status badge + Link */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black font-mono shadow-2xs ${step.badgeClass}`}>
                    #{step.step < 10 ? `0${step.step}` : step.step}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {activeCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/60 animate-pulse">
                        ⚡ {activeCount} lệnh
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Sẵn sàng</span>
                    )}

                    <Link
                      href={step.route}
                      className="text-slate-400 hover:text-brand-600 transition-colors p-1 rounded-lg hover:bg-white/80 dark:hover:bg-slate-700"
                      title={`Mở bàn làm việc ${step.name}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Body card: Icon container nổi bật + Full Name + Description */}
                <button
                  type="button"
                  onClick={() => setStageFilter(isFilterActive ? "all" : step.key)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${step.iconBgClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {step.name}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 line-clamp-1 pl-0.5">
                    {step.desc}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* TÌM KIẾM NHANH VÀ CHÚ THÍCH TRẠNG THÁI */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Tìm nhanh theo mã Lệnh Cắt, tên sản phẩm, mã SKU, khách hàng..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Chú thích trạng thái công đoạn */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400">Trạng thái CĐ:</span>
          {Object.entries(TRANG_THAI_CD_LABELS).map(([k, v]) => {
            const s = TRANG_THAI_CD_STYLE[k as TrangThaiCongDoan] || TRANG_THAI_CD_STYLE["cho_giao"];
            return (
              <span key={k} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${s.bg} ${s.text} font-bold text-[11px]`}>
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                {v}
              </span>
            );
          })}
          {stageFilter !== "all" && (
            <button
              onClick={() => setStageFilter("all")}
              className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-[11px] hover:bg-amber-200 transition"
            >
              ✕ Bỏ lọc bước: {stageFilter}
            </button>
          )}
        </div>
      </div>

      {/* BẢNG ĐIỀU HÀNH CHI TIẾT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <th className="px-4 py-3 text-left font-black whitespace-nowrap min-w-[130px]">Lệnh Cắt</th>
                <th className="px-3 py-3 text-left font-black min-w-[160px]">Sản phẩm</th>
                <th className="px-3 py-3 text-center font-black min-w-[90px]">SL Cắt</th>
                <th className="px-3 py-3 text-center font-black min-w-[70px]">Tiến độ</th>
                <th className="px-3 py-3 text-center font-black min-w-[75px]">Hạn giao</th>
                {CONG_DOAN_FLOW.map((cd) => (
                  <th key={cd.key} className="px-2 py-3 text-center font-black whitespace-nowrap min-w-[85px]">
                    <Link
                      href={cd.route}
                      className="inline-flex items-center gap-1 hover:text-brand-600 transition-colors"
                      title={`Xem bàn làm việc ${cd.label}`}
                    >
                      {cd.label}
                      <ExternalLink className="w-2.5 h-2.5 opacity-40 hover:opacity-100" />
                    </Link>
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-black min-w-[90px]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={15} className="text-center py-12 text-slate-400">
                    Không tìm thấy Lệnh Cắt nào phù hợp bộ lọc
                  </td>
                </tr>
              ) : (
                filtered.map((lc) => {
                  const isExpanded = expandedId === lc.id;
                  const isLate = lc.hanHoanThanh < todayStr && lc.trangThai !== "HoanThanh";
                  const isDone = lc.trangThai === "HoanThanh";

                  // Tính % tiến độ công đoạn
                  const totalCD = (lc.phanCong || []).length;
                  const doneCD = (lc.phanCong || []).filter((p: any) => p.trangThaiCD === "hoan_thanh").length;
                  const progressPct = totalCD > 0 ? Math.round((doneCD / totalCD) * 100) : 0;

                  return (
                    <tr
                      key={lc.id}
                      className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isLate ? "bg-rose-50/30 dark:bg-rose-950/15" : isDone ? "bg-emerald-50/20 dark:bg-emerald-950/10" : ""
                      }`}
                    >
                      {/* Cột 1: Mã Lệnh Cắt */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href="/lenh-cat"
                            className="font-black text-brand-600 dark:text-brand-400 font-mono text-xs hover:underline"
                          >
                            {lc.id}
                          </Link>
                          {lc.loaiLenh === "HangDat" && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                              ĐẶT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span>{lc.trangThai}</span>
                          {lc.khachHang && <span>· {lc.khachHang}</span>}
                        </div>
                      </td>

                      {/* Cột 2: Sản phẩm */}
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[170px]" title={lc.tenSP}>
                          {lc.tenSP}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {LOAI_SP_LABELS[lc.loaiSP] || lc.loaiSP} · <b className="text-slate-600 dark:text-slate-300">{lc.maSP}</b>
                        </div>
                      </td>

                      {/* Cột 3: SL Kế hoạch / Cắt thực tế */}
                      <td className="px-3 py-3 text-center">
                        <div className="font-mono font-bold text-slate-700 dark:text-slate-200">
                          {(lc.tongSLThucTe || lc.tongSL || 0).toLocaleString()}
                        </div>
                        {lc.tongSLThucTe && lc.tongSLThucTe !== lc.tongSL ? (
                          <div className="text-[9px] font-semibold text-emerald-600">
                            (Gốc: {lc.tongSL?.toLocaleString()})
                          </div>
                        ) : (
                          <div className="text-[9px] text-slate-400">SP kế hoạch</div>
                        )}
                      </td>

                      {/* Cột 4: Tiến độ */}
                      <td className="px-3 py-3 text-center">
                        <div className="w-12 mx-auto">
                          <div className="text-[10px] font-black font-mono text-slate-700 dark:text-slate-300 mb-0.5">
                            {progressPct}%
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                progressPct === 100
                                  ? "bg-emerald-500"
                                  : progressPct > 50
                                  ? "bg-brand-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Cột 5: Hạn giao */}
                      <td className="px-3 py-3 text-center">
                        <div className={`font-mono ${isLate ? "text-rose-600 font-bold" : "text-slate-600 dark:text-slate-400"}`}>
                          <DateDisplay value={lc.hanHoanThanh} format="dd/MM" />
                        </div>
                        {isLate && <div className="text-[9px] text-rose-600 font-black">TRỄ HẠN</div>}
                      </td>

                      {/* Cột 6 -> 14: Từng công đoạn */}
                      {CONG_DOAN_FLOW.map((cd) => {
                        const pc = getPCByKey(lc, cd.key);
                        if (!pc) {
                          // Nếu là may_quan nhưng sản phẩm không phải hàng Bộ thì ẩn gạch ngang mờ
                          const isBo = (lc.loaiSP || "").toLowerCase().includes("bo");
                          if (cd.key === "may_quan" && !isBo) {
                            return (
                              <td key={cd.key} className="px-1 py-3 text-center">
                                <span className="text-slate-300 dark:text-slate-700 text-[10px]">—</span>
                              </td>
                            );
                          }
                          return (
                            <td key={cd.key} className="px-1 py-3 text-center">
                              <span className="text-slate-300 dark:text-slate-700 text-[10px]">—</span>
                            </td>
                          );
                        }

                        const tt = (pc.trangThaiCD as TrangThaiCongDoan) || "cho_giao";
                        const hasLoi = (pc.soLuongLoi || 0) > 0 || tt === "co_loi";

                        return (
                          <td key={cd.key} className="px-1 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleCycleStatus(lc, pc)}
                              className={`w-full py-1.5 px-1 rounded-lg border text-[10px] font-bold transition-all hover:scale-105 ${CELL_BG[tt]}`}
                              title={`${pc.tenCongDoan}: ${pc.nguoiTen || "Chưa giao"} · Click để chuyển trạng thái`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[tt]}`} />
                                <span className="truncate max-w-[50px]">{TRANG_THAI_CD_LABELS[tt]}</span>
                              </div>
                              {hasLoi && (
                                <div className="text-[9px] text-rose-600 font-black mt-0.5">
                                  Lỗi {pc.soLuongLoi || 1}
                                </div>
                              )}
                              {pc.soLuongHoanThanh != null && pc.soLuongHoanThanh > 0 && (
                                <div className="text-[8px] text-emerald-700 dark:text-emerald-400 font-mono">
                                  {pc.soLuongHoanThanh} SP
                                </div>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Cột cuối: Thao tác & Tỷ Lệ Size */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setModalTyLe({ lc, mauIdx: 0 })}
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 font-bold transition"
                            title="Nhập / Xem Tỷ Lệ Size các khâu (Single Source of Truth)"
                          >
                            📐
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : lc.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
                            title={isExpanded ? "Thu gọn" : "Xem chi tiết công đoạn"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHI TIẾT TỔNG HỢP KHI MỞ RỘNG */}
      {expandedId && (
        <div className="card p-4 bg-slate-50/70 dark:bg-slate-800/40 border-2 border-brand-500/20 rounded-2xl animate-fade-in">
          {(() => {
            const lc = dsLenhCat.find((l) => l.id === expandedId);
            if (!lc) return null;

            return (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-brand-600 dark:text-brand-400">{lc.id}</span>
                    <span className="text-xs text-slate-500">|</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{lc.tenSP}</span>
                    <span className="text-xs text-slate-400">({lc.maSP})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setModalTyLe({ lc, mauIdx: 0 })}
                      className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-sm"
                    >
                      📐 Mở Bảng Tỷ Lệ Size
                    </button>
                    <Link
                      href="/lenh-cat"
                      className="px-2.5 py-1 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-sm"
                    >
                      Xem Lệnh Cắt Gốc →
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {(lc.phanCong || []).map((pc: any) => {
                    const tt = (pc.trangThaiCD as TrangThaiCongDoan) || "cho_giao";
                    const style = TRANG_THAI_CD_STYLE[tt] || TRANG_THAI_CD_STYLE["cho_giao"];

                    return (
                      <div
                        key={pc.id}
                        className={`rounded-xl border p-3 ${CELL_BG[tt]}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-slate-800 dark:text-slate-100 text-xs">{pc.tenCongDoan}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                            {TRANG_THAI_CD_LABELS[tt]}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300">
                          Phụ trách: <b>{pc.nguoiTen || "Chưa giao"}</b>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                          <span>Đơn giá: {formatVNDShort(pc.donGia || 0)}</span>
                          <span>SL: {(pc.soLuong || lc.tongSLThucTe || lc.tongSL || 0).toLocaleString()}</span>
                        </div>
                        {pc.soLuongLoi != null && pc.soLuongLoi > 0 && (
                          <div className="text-[10px] text-rose-600 font-bold mt-1">
                            ⚠️ Có {pc.soLuongLoi} SP lỗi cần xử lý
                          </div>
                        )}
                        {/* Quick switch */}
                        <div className="flex gap-1 mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          {(["dang_lam", "hoan_thanh", "co_loi"] as TrangThaiCongDoan[]).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                capNhatCongDoan(lc.id, pc.id, { trangThaiCD: s });
                                toast.success(`Đã cập nhật: ${pc.tenCongDoan} → ${TRANG_THAI_CD_LABELS[s]}`);
                              }}
                              className={`flex-1 text-[9px] py-1 rounded font-bold border transition ${
                                tt === s ? "opacity-100 ring-2 ring-brand-500" : "opacity-40 hover:opacity-100"
                              } ${CELL_BG[s]}`}
                            >
                              {s === "dang_lam" ? "▶ Làm" : s === "hoan_thanh" ? "✓ Xong" : "✗ Lỗi"}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* MODAL NHẬP TỶ LỆ SIZE (SINGLE SOURCE OF TRUTH) */}
      {modalTyLe && (
        <TyLeSizeModal
          lc={modalTyLe.lc}
          mauIdx={modalTyLe.mauIdx}
          onClose={() => setModalTyLe(null)}
          onSave={handleSaveTyLe}
        />
      )}
    </div>
  );
}
