"use client";

// ============ TRANG SẢN LƯỢNG CỦA TÔI (Đợt 2 - Bộ 5) ============
// Thống kê sản lượng: hôm nay / tuần này / tháng này
// Theo từng khâu (cat, may, ui, dong-goi, intd, khuy-nut)

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { BarChart3, TrendingUp, Award, ArrowLeft, Package } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { useGiaCong } from "@/lib/data/gia-cong-store";
import { getWorkflowForUser, getMaNVFromUser } from "@/lib/workflow-filter";
import { MobileCard, EmptyState, DateDisplay } from "@/components/ui";

type Period = "today" | "week" | "month";

const PERIODS: { key: Period; label: string; days: number }[] = [
  { key: "today", label: "Hôm nay", days: 1 },
  { key: "week", label: "Tuần này", days: 7 },
  { key: "month", label: "Tháng này", days: 30 },
];

export default function SanLuongPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <SanLuongContent />
    </Suspense>
  );
}

function SanLuongContent() {
  const { user } = useSession();
  const { getEffectiveTask, sanLuongUpdates } = useGiaCong();
  const [period, setPeriod] = useState<Period>("today");

  if (!user) {
    return <EmptyState title="Chưa đăng nhập" description="Vui lòng đăng nhập" />;
  }

  const maNV = getMaNVFromUser(user);
  const myTasks = getWorkflowForUser(user);
  const effectiveTasks = myTasks.map((p) => getEffectiveTask(p.id) || p);

  // Tính sản lượng theo period
  const now = new Date();
  const startDate = (() => {
    if (period === "today") {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    } else if (period === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    } else {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d;
    }
  })();

  // Tính theo từng khâu
  // FIX BUG #3: Tính SL theo sanLuongUpdates (đã có ngay chính xác) thay vì ngayHoanThanh gốc
  //  vì user có thể báo cáo SL hôm nay nhưng phiếu chưa hoàn thành nên ngayHoanThanh = ""
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setDate(monthStart.getDate() - 30);
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const monthStartStr = monthStart.toISOString().split("T")[0];

    const result = {
      today: 0, week: 0, month: 0,
      byKhau: { cat: 0, intd: 0, may: 0, "khuy-nut": 0, ui: 0, "dong-goi": 0 } as Record<string, number>,
      total: 0, loi: 0,
    };

    // Lấy danh sách taskId thuộc về user hiện tại
    const myTaskIds = new Set(effectiveTasks.map((t) => t.id));

    // Tính SL theo sanLuongUpdates (cho today/week/month)
    for (const u of sanLuongUpdates) {
      if (!myTaskIds.has(u.taskId)) continue;
      if (u.ngay === today) result.today += u.soLuongDat;
      if (u.ngay >= weekStartStr) result.week += u.soLuongDat;
      if (u.ngay >= monthStartStr) result.month += u.soLuongDat;
    }

    // Tính byKhau, total, loi dựa trên effectiveTasks (SL tổng)
    for (const t of effectiveTasks) {
      // Theo khâu (theo prefix id)
      const khau = t.id.startsWith("CAT_") ? "cat"
        : t.id.startsWith("INTD_") ? "intd"
        : t.id.startsWith("MAY_") ? "may"
        : t.id.startsWith("KN_") ? "khuy-nut"
        : t.id.startsWith("UI_") ? "ui"
        : t.id.startsWith("DG_") ? "dong-goi"
        : null;
      if (khau) result.byKhau[khau] = (result.byKhau[khau] || 0) + t.soLuongDat;

      result.total += t.soLuongDat;
      result.loi += t.soLuongLoi;
    }

    return result;
  }, [effectiveTasks, sanLuongUpdates, period]);

  const periodValue = period === "today" ? stats.today : period === "week" ? stats.week : stats.month;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <Link href="/cong-viec" className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1 mb-1">
          <ArrowLeft className="w-3 h-3" /> Quay lại
        </Link>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-violet-500" />
          Sản lượng của tôi
        </h1>
        <p className="text-xs opacity-70 mt-1">{maNV && <span className="font-mono">{maNV}</span>} · Theo dõi tiến độ sản xuất</p>
      </div>

      {/* Period selector */}
      <div className="card p-1.5 inline-flex flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              period === p.key ? "bg-brand-500 text-white shadow" : "hover:bg-white/40 dark:hover:bg-white/5"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI lớn */}
      <div className="card p-5 bg-gradient-to-br from-violet-500/10 to-purple-500/5">
        <div className="text-xs opacity-70 mb-1 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" />
          Sản lượng {PERIODS.find((p) => p.key === period)?.label.toLowerCase()}
        </div>
        <div className="text-3xl md:text-4xl font-bold text-violet-600 tabular-nums">
          {periodValue.toLocaleString()}
        </div>
        <div className="text-[10px] opacity-60 mt-1">Sản phẩm hoàn thành</div>
      </div>

      {/* 3 KPI cards nhỏ */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3 text-center">
          <div className="text-[10px] opacity-70">Hôm nay</div>
          <div className="text-lg font-bold text-brand-600 tabular-nums">{stats.today.toLocaleString()}</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-[10px] opacity-70">Tuần này</div>
          <div className="text-lg font-bold text-sky-600 tabular-nums">{stats.week.toLocaleString()}</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-[10px] opacity-70">Tháng này</div>
          <div className="text-lg font-bold text-violet-600 tabular-nums">{stats.month.toLocaleString()}</div>
        </div>
      </div>

      {/* Theo khâu */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold flex items-center gap-1.5">
          <Package className="w-4 h-4 text-brand-500" />
          Theo khâu công đoạn
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(stats.byKhau).map(([khau, sl]) => {
            const labels: Record<string, string> = {
              cat: "Cắt", intd: "In/Thêu/Dập", may: "May",
              "khuy-nut": "Khuy nút", ui: "Ủi", "dong-goi": "Đóng gói",
            };
            return (
              <div key={khau} className="card p-3">
                <div className="text-[10px] opacity-70">{labels[khau] || khau}</div>
                <div className="text-xl font-bold tabular-nums">{sl.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tổng + lỗi */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3 bg-emerald-500/10">
          <div className="text-[10px] opacity-70">Tổng SL đạt</div>
          <div className="text-xl font-bold text-emerald-600">{stats.total.toLocaleString()}</div>
        </div>
        <div className="card p-3 bg-rose-500/10">
          <div className="text-[10px] opacity-70">Tổng SL lỗi</div>
          <div className="text-xl font-bold text-rose-600">{stats.loi.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
