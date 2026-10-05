"use client";

// ============ BẢNG ĐIỀU HÀNH SẢN XUẤT (CHUẨN HÓA 10 BƯỚC) ============
// Trung tâm điều hành sản xuất cho QLSX (Quản lý điều phối SX)
// Kết nối trực tiếp dữ liệu Lệnh Cắt useLenhCat() (Single Source of Truth)
// Hỗ trợ 4 chế độ xem:
// 1. Luồng 10 Công Đoạn (Mặc định) - ma trận trạng thái real-time
// 2. Bảng Lệnh Cắt - danh sách lệnh cắt kèm tiến độ & SL thực tế
// 3. Phiếu Công Đoạn - bảng giao việc chi tiết từng khâu
// 4. Đối Soát LSX (Lark) - dữ liệu đối soát lịch sử

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  Factory, TrendingUp, CheckCircle2, AlertTriangle, Package,
  Clock, Wallet, Scissors, ExternalLink, SlidersHorizontal,
  Search, Filter, ShieldCheck, ArrowRight, RefreshCw, Eye
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import {
  useLenhCat, LOAI_SP_LABELS, TRANG_THAI_LC_LABELS, TRANG_THAI_LC_STYLE,
  TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, type TrangThaiCongDoan,
  type LenhCat, type CongDoanItem
} from "@/lib/data/lenh-cat-store";
import {
  groupByLSX, flattenPhieu, CONG_DOAN_LABELS, type LSXSummary, type PhieuRow
} from "@/lib/bang-dieu-hanh-helper";
import { DateDisplay, EmptyState } from "@/components/ui";
import { formatVNDShort } from "@/lib/data/real-data";
import { LenhCatFlowBoard } from "./LeNhCatFlow";
import { TyLeSizeModal } from "@/components/modals/TyLeSizeModal";

type ViewMode = "lenh-cat-flow" | "lenh-cat-table" | "phan-cong-cd" | "lsx-lark";
type StatusFilter = "all" | "tre-han" | "dang-sx" | "co-loi" | "hoan-thanh";

export default function BangDieuHanhSXPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải bảng điều hành SX…</div>}>
      <BangDieuHanhContent />
    </Suspense>
  );
}

function BangDieuHanhContent() {
  const { user } = useSession();
  const { dsLenhCat, suaLenhCat, capNhatCongDoan } = useLenhCat();

  const [view, setView] = useState<ViewMode>("lenh-cat-flow");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [modalTyLe, setModalTyLe] = useState<{ lc: LenhCat; mauIdx: number } | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Tính toán KPI real-time trực tiếp từ dsLenhCat (Data thật 100%)
  const kpi = useMemo(() => {
    const tongLC = dsLenhCat.length;
    const dangSX = dsLenhCat.filter((l) => l.trangThai !== "HoanThanh" && l.trangThai !== "Nhap").length;
    const hoanThanh = dsLenhCat.filter((l) => l.trangThai === "HoanThanh").length;
    const treHan = dsLenhCat.filter((l) => l.trangThai !== "HoanThanh" && l.hanHoanThanh && l.hanHoanThanh < todayStr).length;

    const tongSLKeHoach = dsLenhCat.reduce((acc, l) => acc + (l.tongSL || 0), 0);
    const tongSLCatThucTe = dsLenhCat.reduce((acc, l) => acc + (l.tongSLThucTe || l.tongSL || 0), 0);

    let phieuDangLam = 0;
    let phieuCoLoi = 0;
    let tongTienGiaCong = 0;

    dsLenhCat.forEach((l) => {
      (l.phanCong || []).forEach((pc: any) => {
        if (pc.trangThaiCD === "dang_lam" || pc.trangThaiCD === "cho_qc") phieuDangLam++;
        if (pc.trangThaiCD === "co_loi" || (pc.soLuongLoi || 0) > 0) phieuCoLoi++;
        tongTienGiaCong += (pc.thanhTien || (pc.donGia || 0) * (pc.soLuong || l.tongSLThucTe || l.tongSL || 0));
      });
    });

    return {
      tongLC,
      dangSX,
      hoanThanh,
      treHan,
      tongSLKeHoach,
      tongSLCatThucTe,
      phieuDangLam,
      phieuCoLoi,
      tongTienGiaCong,
    };
  }, [dsLenhCat, todayStr]);

  // Danh sách Lệnh Cắt đã lọc
  const filteredLenhCat = useMemo(() => {
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

      if (filter === "tre-han") {
        return lc.hanHoanThanh < todayStr && lc.trangThai !== "HoanThanh";
      }
      if (filter === "dang-sx") {
        return lc.trangThai !== "HoanThanh" && lc.trangThai !== "Nhap";
      }
      if (filter === "hoan-thanh") {
        return lc.trangThai === "HoanThanh";
      }
      if (filter === "co-loi") {
        return lc.phanCong?.some((pc: any) => pc.trangThaiCD === "co_loi" || (pc.soLuongLoi || 0) > 0);
      }
      return true;
    });
  }, [dsLenhCat, search, filter, todayStr]);

  // Phẳng hóa các phiếu công đoạn cho view 'phan-cong-cd'
  const flatCongDoanList = useMemo(() => {
    const list: Array<{
      lcId: string;
      maSP: string;
      tenSP: string;
      hanHoanThanh: string;
      tongSL: number;
      tongSLThucTe?: number;
      pc: CongDoanItem;
    }> = [];

    dsLenhCat.forEach((lc) => {
      (lc.phanCong || []).forEach((pc) => {
        list.push({
          lcId: lc.id,
          maSP: lc.maSP,
          tenSP: lc.tenSP,
          hanHoanThanh: lc.hanHoanThanh,
          tongSL: lc.tongSL,
          tongSLThucTe: lc.tongSLThucTe,
          pc,
        });
      });
    });

    return list.filter((item) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const match =
          item.lcId.toLowerCase().includes(q) ||
          item.tenSP.toLowerCase().includes(q) ||
          item.maSP.toLowerCase().includes(q) ||
          (item.pc.tenCongDoan || "").toLowerCase().includes(q) ||
          (item.pc.nguoiTen || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      if (stageFilter !== "all") {
        const tenCD = (item.pc.tenCongDoan || "").toLowerCase();
        if (!tenCD.includes(stageFilter.toLowerCase())) return false;
      }

      const tt = (item.pc.trangThaiCD || "cho_giao") as string;
      if (filter === "tre-han") {
        return item.hanHoanThanh < todayStr && tt !== "hoan_thanh";
      }
      if (filter === "dang-sx") {
        return tt === "dang_lam" || tt === "cho_qc";
      }
      if (filter === "hoan-thanh") {
        return tt === "hoan_thanh";
      }
      if (filter === "co-loi") {
        return tt === "co_loi" || (item.pc.soLuongLoi || 0) > 0;
      }

      return true;
    });
  }, [dsLenhCat, search, filter, stageFilter, todayStr]);

  // Dữ liệu đối soát cũ (Lark)
  const lsxList = useMemo(() => groupByLSX(), []);

  // Xử lý lưu Tỷ Lệ Size
  const handleSaveTyLe = (mauIdx: number, newTyLe: Record<string, { size: string; sl: number }[]>, _tongDuCat?: number, fixedPhanCong?: any) => {
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
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* HEADER TRANG (CHỮ TRẮNG NỔI BẬT RÕ NÉT TRÊN NỀN CYAN/TEAL) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/20">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-3 text-white drop-shadow-sm tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-md">
              <Factory className="w-5 h-5 text-white" />
            </div>
            Bảng Điều Hành Sản Xuất
          </h1>
          <p className="text-xs md:text-sm font-semibold text-white/95 mt-1.5 flex flex-wrap items-center gap-2 drop-shadow-xs">
            <span>⚡ Điều phối quy trình 10 bước</span>
            <span className="text-white/40">·</span>
            <span>Kế thừa dữ liệu Lệnh Cắt thật</span>
            <span className="text-white/40">·</span>
            <span>Giám sát tiến độ & tỷ lệ size</span>
          </p>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/lenh-cat"
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-black transition flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-600" />
            Quản lý Lệnh Cắt
          </Link>
          <Link
            href="/ke-hoach-san-xuat"
            className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white text-xs font-bold transition shadow-sm hover:scale-105 active:scale-95"
          >
            Kế Hoạch SX →
          </Link>
        </div>
      </div>

      {/* 8 THẺ KPI SẢN XUẤT REAL-TIME (BỐ CỤC 4 CỘT RÕ RÀNG, CHỮ RÕ NÉT) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-3.5">
        <KPICard
          icon={<Factory className="w-4 h-4" />}
          label="Tổng Lệnh Cắt"
          value={kpi.tongLC}
          subtext="Tất cả đơn đặt & hàng nhà"
          color="brand"
        />
        <KPICard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Đang sản xuất"
          value={kpi.dangSX}
          subtext="Đang vận hành trên chuyền"
          color="amber"
        />
        <KPICard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Đã hoàn thành"
          value={kpi.hoanThanh}
          subtext="Đã xuất xưởng / kho"
          color="emerald"
        />
        <KPICard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Trễ hạn giao"
          value={kpi.treHan}
          subtext={kpi.treHan > 0 ? "⚠️ Cần ưu tiên xử lý gấp" : "✓ 100% đúng tiến độ"}
          color="rose"
          highlight={kpi.treHan > 0}
        />
        <KPICard
          icon={<Package className="w-4 h-4" />}
          label="SL Kế hoạch"
          value={`${kpi.tongSLKeHoach.toLocaleString()} SP`}
          subtext="Định mức sản xuất ban đầu"
          color="slate"
        />
        <KPICard
          icon={<Scissors className="w-4 h-4" />}
          label="SL Cắt thực tế"
          value={`${kpi.tongSLCatThucTe.toLocaleString()} SP`}
          subtext="Chốt theo Single Source of Truth"
          color="sky"
        />
        <KPICard
          icon={<Clock className="w-4 h-4" />}
          label="CĐ đang vận hành"
          value={`${kpi.phieuDangLam} khâu`}
          subtext={kpi.phieuCoLoi > 0 ? `⚠️ Có ${kpi.phieuCoLoi} khâu báo lỗi` : "Không có cảnh báo lỗi"}
          color="violet"
        />
        <KPICard
          icon={<Wallet className="w-4 h-4" />}
          label="Tổng tiền gia công"
          value={formatVNDShort(kpi.tongTienGiaCong)}
          subtext="Chi phí ước tính toàn bộ khâu"
          color="amber"
        />
      </div>

      {/* VIEW SELECTOR & FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-2.5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Chế độ xem */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
          {[
            { k: "lenh-cat-flow" as ViewMode, l: "🔀 Luồng 10 Công Đoạn" },
            { k: "lenh-cat-table" as ViewMode, l: "📋 Bảng Lệnh Cắt" },
            { k: "phan-cong-cd" as ViewMode, l: "⚙️ Phiếu Công Đoạn" },
            { k: "lsx-lark" as ViewMode, l: "📦 Đối Soát LSX (Lark)" },
          ].map((v) => (
            <button
              key={v.k}
              type="button"
              onClick={() => setView(v.k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                view === v.k
                  ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {v.l}
            </button>
          ))}
        </div>

        {/* Trạng thái filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { k: "all" as StatusFilter, l: `Tất cả (${kpi.tongLC})` },
            { k: "dang-sx" as StatusFilter, l: `Đang SX (${kpi.dangSX})` },
            { k: "tre-han" as StatusFilter, l: `Trễ hạn (${kpi.treHan})`, danger: true },
            { k: "co-loi" as StatusFilter, l: `Có lỗi (${kpi.phieuCoLoi})`, danger: true },
            { k: "hoan-thanh" as StatusFilter, l: `Hoàn thành (${kpi.hoanThanh})` },
          ].map((f) => (
            <button
              key={f.k}
              type="button"
              onClick={() => setFilter(f.k)}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
                filter === f.k
                  ? f.danger
                    ? "bg-rose-500 text-white shadow-sm"
                    : "bg-brand-500 text-white shadow-sm"
                  : f.danger
                  ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: LUỒNG 10 CÔNG ĐOẠN (MẶC ĐỊNH) */}
      {view === "lenh-cat-flow" && <LenhCatFlowBoard />}

      {/* VIEW 2: BẢNG LỆNH CẮT TOÀN DIỆN */}
      {view === "lenh-cat-table" && (
        <div className="space-y-3">
          <div className="card p-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Tìm theo mã Lệnh Cắt, tên sản phẩm, mã SKU, khách hàng..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <th className="px-4 py-3 text-left font-black">Lệnh Cắt</th>
                    <th className="px-3 py-3 text-left font-black">Sản phẩm</th>
                    <th className="px-3 py-3 text-center font-black">Loại SP</th>
                    <th className="px-3 py-3 text-right font-black">SL Kế hoạch</th>
                    <th className="px-3 py-3 text-right font-black">SL Cắt thực tế</th>
                    <th className="px-3 py-3 text-center font-black">Hạn giao</th>
                    <th className="px-3 py-3 text-center font-black">Tiến độ CĐ</th>
                    <th className="px-3 py-3 text-center font-black">Trạng thái</th>
                    <th className="px-3 py-3 text-center font-black">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLenhCat.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-slate-400">
                        Không có Lệnh Cắt nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    filteredLenhCat.map((lc) => {
                      const isLate = lc.hanHoanThanh < todayStr && lc.trangThai !== "HoanThanh";
                      const totalCD = (lc.phanCong || []).length;
                      const doneCD = (lc.phanCong || []).filter((p: any) => p.trangThaiCD === "hoan_thanh").length;
                      const pct = totalCD > 0 ? Math.round((doneCD / totalCD) * 100) : 0;
                      const ttStyle = TRANG_THAI_LC_STYLE[lc.trangThai] || TRANG_THAI_LC_STYLE["Nhap"];

                      return (
                        <tr
                          key={lc.id}
                          className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${
                            isLate ? "bg-rose-50/30 dark:bg-rose-950/15" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <Link href="/lenh-cat" className="font-mono font-black text-brand-600 hover:underline">
                              {lc.id}
                            </Link>
                            <div className="text-[10px] text-slate-400">
                              {lc.loaiLenh === "HangDat" ? "Hàng Đặt" : "Hàng Nhà"}
                              {lc.khachHang && ` · ${lc.khachHang}`}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
                              {lc.tenSP}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{lc.maSP}</div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                              {LOAI_SP_LABELS[lc.loaiSP] || lc.loaiSP}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                            {(lc.tongSL || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-emerald-600">
                            {(lc.tongSLThucTe || lc.tongSL || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className={isLate ? "text-rose-600 font-bold" : "text-slate-600 dark:text-slate-400"}>
                              <DateDisplay value={lc.hanHoanThanh} format="dd/MM/yyyy" />
                            </div>
                            {isLate && <div className="text-[9px] text-rose-600 font-black">QUÁ HẠN</div>}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="text-[10px] font-black font-mono text-slate-700 dark:text-slate-300">
                              {doneCD}/{totalCD} CĐ ({pct}%)
                            </div>
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-brand-500"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${ttStyle.bg} ${ttStyle.color}`}>
                              {TRANG_THAI_LC_LABELS[lc.trangThai]}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setModalTyLe({ lc, mauIdx: 0 })}
                                className="px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-bold transition"
                                title="Nhập Tỷ Lệ Size Single Source of Truth"
                              >
                                📐 Size
                              </button>
                              <Link
                                href="/lenh-cat"
                                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-brand-600 transition"
                                title="Chi tiết Lệnh Cắt"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
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
        </div>
      )}

      {/* VIEW 3: PHIẾU CÔNG ĐOẠN CHI TIẾT */}
      {view === "phan-cong-cd" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Tìm theo mã LC, tên công đoạn, người phụ trách..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            {/* Lọc nhanh theo loại công đoạn */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none"
            >
              <option value="all">Tất cả công đoạn</option>
              <option value="cắt">Tổ Cắt</option>
              <option value="in">In / Thêu</option>
              <option value="may">Tổ May</option>
              <option value="qc">QC Kiểm hàng</option>
              <option value="khuy">Khuy Nút</option>
              <option value="ủi">Tổ Ủi</option>
              <option value="đóng gói">Đóng gói</option>
              <option value="nhập kho">Hoàn thiện / Kho</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <th className="px-4 py-3 text-left font-black">Lệnh Cắt / SP</th>
                    <th className="px-3 py-3 text-left font-black">Công đoạn</th>
                    <th className="px-3 py-3 text-left font-black">Người phụ trách</th>
                    <th className="px-3 py-3 text-right font-black">SL Giao</th>
                    <th className="px-3 py-3 text-right font-black">SL Hoàn thành</th>
                    <th className="px-3 py-3 text-right font-black">Lỗi</th>
                    <th className="px-3 py-3 text-center font-black">Hạn</th>
                    <th className="px-3 py-3 text-center font-black">Trạng thái CĐ</th>
                    <th className="px-3 py-3 text-center font-black">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {flatCongDoanList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-slate-400">
                        Không tìm thấy phiếu công đoạn nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    flatCongDoanList.map((item, idx) => {
                      const tt = (item.pc.trangThaiCD || "cho_giao") as TrangThaiCongDoan;
                      const style = TRANG_THAI_CD_STYLE[tt] || TRANG_THAI_CD_STYLE["cho_giao"];
                      const isLate = item.hanHoanThanh < todayStr && tt !== "hoan_thanh";

                      return (
                        <tr
                          key={`${item.lcId}-${item.pc.id}-${idx}`}
                          className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${
                            isLate ? "bg-rose-50/20" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-mono font-bold text-brand-600">{item.lcId}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                              {item.tenSP} ({item.maSP})
                            </div>
                          </td>
                          <td className="px-3 py-3 font-bold text-slate-800 dark:text-slate-100">
                            {item.pc.tenCongDoan}
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-semibold text-slate-700 dark:text-slate-300">
                              {item.pc.nguoiTen || <span className="italic text-slate-400">Chưa giao</span>}
                            </div>
                            <div className="text-[9px] text-slate-400">
                              {item.pc.loaiNguoi === "xuong_ngoai" ? "Xưởng ngoài" : "Nội bộ"}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                            {(item.pc.soLuong || item.tongSLThucTe || item.tongSL || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-emerald-600">
                            {(item.pc.soLuongHoanThanh || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right font-mono">
                            {item.pc.soLuongLoi ? (
                              <span className="text-rose-600 font-bold">{item.pc.soLuongLoi}</span>
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className={isLate ? "text-rose-600 font-bold" : "text-slate-500"}>
                              <DateDisplay value={item.hanHoanThanh} format="dd/MM" />
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${style.bg} ${style.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              {TRANG_THAI_CD_LABELS[tt]}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {(["dang_lam", "hoan_thanh"] as TrangThaiCongDoan[]).map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => {
                                    capNhatCongDoan(item.lcId, item.pc.id, { trangThaiCD: s });
                                    toast.success(`${item.lcId} · ${item.pc.tenCongDoan}: Đã đổi sang ${TRANG_THAI_CD_LABELS[s]}`);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
                                    tt === s
                                      ? "bg-brand-500 text-white border-brand-500"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                  }`}
                                >
                                  {s === "dang_lam" ? "Làm" : "Xong"}
                                </button>
                              ))}
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
        </div>
      )}

      {/* VIEW 4: ĐỐI SOÁT LỆNH SẢN XUẤT CŨ (LARK) */}
      {view === "lsx-lark" && (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <span>📦 Dữ liệu đối soát lịch sử từ Lark Base. Đang lưu trữ tham khảo đối chiếu.</span>
            <span className="font-bold">Tổng {lsxList.length} LSX</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <th className="px-4 py-3 text-left font-black">LSX / Mã SP</th>
                    <th className="px-3 py-3 text-left font-black">CĐ hiện tại</th>
                    <th className="px-3 py-3 text-right font-black">SL Giao</th>
                    <th className="px-3 py-3 text-right font-black">SL Đạt</th>
                    <th className="px-3 py-3 text-right font-black">Lỗi</th>
                    <th className="px-3 py-3 text-right font-black">Còn lại</th>
                    <th className="px-3 py-3 text-center font-black">Hạn</th>
                    <th className="px-3 py-3 text-right font-black">Tiền công</th>
                  </tr>
                </thead>
                <tbody>
                  {lsxList.map((l) => {
                    const conLai = Math.max(0, l.tongSLGiao - l.tongSLDat - l.tongSLLoi);
                    return (
                      <tr key={l.lenhSX} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold">{l.lenhSX}</div>
                          <div className="text-[10px] text-slate-400">
                            {l.maSP} · {l.phanLoai}
                          </div>
                        </td>
                        <td className="px-3 py-3 font-semibold">{l.congDoanHienTai}</td>
                        <td className="px-3 py-3 text-right font-mono">{l.tongSLGiao.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right font-mono text-emerald-600 font-bold">{l.tongSLDat.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right font-mono text-rose-600">{l.tongSLLoi.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right font-mono text-amber-600">{conLai.toLocaleString()}</td>
                        <td className="px-3 py-3 text-center">
                          <DateDisplay value={l.hanHoanThanh} format="dd/MM" />
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-semibold">{formatVNDShort(l.tongChiPhi)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TỶ LỆ SIZE (SINGLE SOURCE OF TRUTH) */}
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

// Sub component: Thẻ KPI
function KPICard({
  icon,
  label,
  value,
  subtext,
  color,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color: "slate" | "amber" | "rose" | "sky" | "violet" | "emerald" | "brand";
  highlight?: boolean;
}) {
  const iconColorMap = {
    slate: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80",
    amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60",
    rose: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/60",
    sky: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200/60",
    violet: "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200/60",
    emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60",
    brand: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200/60",
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
        highlight
          ? "border-rose-400 dark:border-rose-800 ring-2 ring-rose-500/20 shadow-rose-100 dark:shadow-none"
          : "border-slate-200/90 dark:border-slate-800"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconColorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div className="space-y-0.5">
        <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight tabular-nums truncate">
          {value}
        </div>
        {subtext && (
          <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
