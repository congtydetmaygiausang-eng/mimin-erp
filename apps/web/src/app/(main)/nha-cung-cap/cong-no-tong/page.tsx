"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Building2,
  DollarSign,
  AlertCircle,
  CreditCard,
  Search,
  X,
  Phone,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { useSupplierRelations, EmptyRelationState } from "../supplier-relations";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";

export default function CongNoTongPage() {
  const { suppliers } = useSupplierRelations();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "DEBT" | "NO_DEBT" | "OVER_LIMIT">("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Thống kê công nợ
  const stats = useMemo(() => {
    const total = suppliers.reduce((sum, s) => sum + (s.cong_no || 0), 0);
    const inDebtList = suppliers.filter((s) => (s.cong_no || 0) > 0);
    const noDebtList = suppliers.filter((s) => (s.cong_no || 0) <= 0);
    const totalLimit = suppliers.reduce((sum, s) => sum + (s.han_muc || 50_000_000), 0);
    const overLimitList = suppliers.filter((s) => (s.cong_no || 0) > (s.han_muc || 50_000_000));
    return {
      totalDebt: total,
      inDebtCount: inDebtList.length,
      noDebtCount: noDebtList.length,
      totalLimit,
      overLimitCount: overLimitList.length,
    };
  }, [suppliers]);

  // Bộ lọc
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter((s) => {
      const matchQ =
        !q ||
        s.ten_ncc.toLowerCase().includes(q) ||
        (s.ma_ncc || "").toLowerCase().includes(q) ||
        (s.nguoi_lh || "").toLowerCase().includes(q) ||
        (s.sdt || "").includes(q);

      const debt = s.cong_no || 0;
      const limit = s.han_muc || 50_000_000;

      if (filterType === "DEBT" && debt <= 0) return false;
      if (filterType === "NO_DEBT" && debt > 0) return false;
      if (filterType === "OVER_LIMIT" && debt <= limit) return false;

      return matchQ;
    });
  }, [suppliers, search, filterType]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 w-full max-w-full overflow-x-hidden">
      {/* 1. HERO COMMAND BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-teal-50/70 to-emerald-50/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 md:p-7 shadow-sm border border-teal-200/90 dark:border-teal-800/80 group">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-2xs">
              <Wallet className="w-3.5 h-3.5 text-teal-600" />
              Sổ Quản Lý Công Nợ Phải Trả Nhà Cung Cấp
            </span>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/25">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Công Nợ Tổng Nhà Cung Cấp
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  Đối soát dư nợ gối đầu, kiểm soát hạn mức tín dụng và lên kế hoạch thanh toán cho các đối tác chuỗi may mặc
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 shadow-2xs">
                💳 Tổng nợ phải trả: {formatVND(stats.totalDebt)}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 shadow-2xs">
                🏢 {stats.inDebtCount} NCC đang nợ gối đầu
              </span>
              {stats.overLimitCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> {stats.overLimitCount} NCC vượt hạn mức
                </span>
              )}
            </div>
          </div>

          <Link
            href="/nha-cung-cap/thanh-toan"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition active:scale-95 cursor-pointer shrink-0"
          >
            <CreditCard className="w-4 h-4" /> Lập Phiếu Thanh Toán
          </Link>
        </div>
      </div>

      {/* 2. DASHBOARD 4 KPI CÔNG NỢ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-white dark:to-slate-900 border border-rose-300/80 dark:border-rose-800/80 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wide">Tổng Dư Nợ</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-rose-600 dark:text-rose-400 mt-2 tabular-nums">
            {formatVNDShort(stats.totalDebt)}
          </div>
          <div className="text-xs text-slate-500 mt-1 truncate">{formatVND(stats.totalDebt)}</div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white dark:to-slate-900 border border-amber-300/80 dark:border-amber-800/80 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">NCC Đang Nợ</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-amber-700 dark:text-amber-400 mt-2 tabular-nums">
            {stats.inDebtCount} <span className="text-sm font-bold text-slate-500 font-sans">NCC</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Trên tổng số {suppliers.length} NCC</div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-white dark:to-slate-900 border border-teal-300/80 dark:border-teal-800/80 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wide">Hết Công Nợ</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-teal-700 dark:text-teal-400 mt-2 tabular-nums">
            {stats.noDebtCount} <span className="text-sm font-bold text-slate-500 font-sans">NCC</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Đã tất toán toàn bộ</div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white dark:to-slate-900 border border-indigo-300/80 dark:border-indigo-800/80 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide">Hạn Mức Cấp</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-indigo-700 dark:text-indigo-400 mt-2 tabular-nums">
            {formatVNDShort(stats.totalLimit)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Tổng mức tín dụng gối đầu</div>
        </div>
      </div>

      {/* 3. TÌM KIẾM & BỘ LỌC CÔNG NỢ */}
      <div className="card p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs space-y-3.5">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
          <input
            className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Tìm theo tên nhà cung cấp, mã NCC, người liên hệ, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "ALL", label: "Tất cả NCC", count: suppliers.length },
              { id: "DEBT", label: "Đang có nợ", count: stats.inDebtCount },
              { id: "NO_DEBT", label: "Đã tất toán", count: stats.noDebtCount },
              { id: "OVER_LIMIT", label: "Vượt hạn mức", count: stats.overLimitCount },
            ].map((tab) => {
              const active = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    active
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              Hiển thị: <b className="text-teal-700 font-mono">{filtered.length}</b> NCC
            </span>
            <DataViewToggle onChange={setViewMode} />
          </div>
        </div>
      </div>

      {/* 4. HIỂN THỊ DỮ LIỆU */}
      {filtered.length === 0 ? (
        <EmptyRelationState>Không tìm thấy nhà cung cấp phù hợp điều kiện lọc.</EmptyRelationState>
      ) : viewMode === "table" ? (
        <div className="card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold bg-slate-50/80 dark:bg-slate-800/60">
                  <th className="py-3 px-4">MÃ NCC</th>
                  <th className="py-3 px-4">TÊN NHÀ CUNG CẤP</th>
                  <th className="py-3 px-4">LIÊN HỆ & SĐT</th>
                  <th className="py-3 px-4 text-right">HẠN MỨC CHO NỢ</th>
                  <th className="py-3 px-4 text-right">DƯ NỢ HIỆN TẠI</th>
                  <th className="py-3 px-4">TỶ LỆ NỢ</th>
                  <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                  <th className="py-3 px-4 text-center">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((s) => {
                  const debt = s.cong_no || 0;
                  const limit = s.han_muc || 50_000_000;
                  const pct = limit > 0 ? Math.min(100, Math.round((debt / limit) * 100)) : 0;
                  const isOver = debt > limit;

                  return (
                    <tr key={s.ma_ncc} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-teal-600">{s.ma_ncc}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{s.ten_ncc}</div>
                        <div className="text-[11px] text-slate-400">{s.loai || "Vật tư may mặc"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{s.nguoi_lh || "Đại diện"}</div>
                        <a href={`tel:${s.sdt}`} className="text-teal-600 font-mono hover:underline text-[11px]">
                          {s.sdt || "—"}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                        {formatVND(limit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatVND(debt)}
                      </td>
                      <td className="py-3 px-4 w-32">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOver ? "bg-rose-600" : pct > 80 ? "bg-amber-500" : "bg-teal-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            isOver
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : debt > 0
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          }`}
                        >
                          {isOver ? "Vượt hạn mức" : debt > 0 ? "Đang có nợ" : "Đã tất toán"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/nha-cung-cap/thanh-toan?maNcc=${s.ma_ncc}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-[11px] border border-teal-200 transition"
                        >
                          Thanh toán <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const debt = s.cong_no || 0;
            const limit = s.han_muc || 50_000_000;
            const pct = limit > 0 ? Math.min(100, Math.round((debt / limit) * 100)) : 0;
            const isOver = debt > limit;

            return (
              <div
                key={s.ma_ncc}
                className="card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                      {s.ma_ncc}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        isOver
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : debt > 0
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {isOver ? "Vượt hạn mức" : debt > 0 ? "Đang có nợ" : "Đã tất toán"}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-2">{s.ten_ncc}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Liên hệ: <b className="text-slate-800 dark:text-slate-200">{s.nguoi_lh || "Đại diện"}</b> (
                    {s.sdt || "—"})
                  </div>

                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Dư nợ hiện tại:</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm tabular-nums">
                        {formatVND(debt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Hạn mức cho nợ:</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                        {formatVND(limit)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${
                          isOver ? "bg-rose-600" : pct > 80 ? "bg-amber-500" : "bg-teal-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Tỷ lệ sử dụng: {pct}%</span>
                  <Link
                    href={`/nha-cung-cap/thanh-toan?maNcc=${s.ma_ncc}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700"
                  >
                    Thanh toán <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
