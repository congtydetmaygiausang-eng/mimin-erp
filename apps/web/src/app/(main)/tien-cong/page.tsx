"use client";

// ============ TRANG TIỀN CÔNG CỦA TÔI (Đợt 2 - Bộ 5) ============
// Thống kê tiền công: hôm nay / tuần / tháng / tổng cộng
// Lưu ý: chỉ hiển thị tiền công của CHÍNH MÌNH (không thấy của người khác)

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { Wallet, TrendingUp, AlertCircle, ArrowLeft, ChevronRight, Calendar } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { useGiaCong } from "@/lib/data/gia-cong-store";
import { getWorkflowForUser, getMaNVFromUser } from "@/lib/workflow-filter";
import { MobileCard, EmptyState, DateDisplay } from "@/components/ui";
import { formatVNDShort } from "@/lib/data/real-data";

type Period = "today" | "week" | "month" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Hôm nay" },
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
  { key: "all", label: "Tất cả" },
];

export default function TienCongPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <TienCongContent />
    </Suspense>
  );
}

function TienCongContent() {
  const { user } = useSession();
  const { getEffectiveTask } = useGiaCong();
  const [period, setPeriod] = useState<Period>("month");

  if (!user) {
    return <EmptyState title="Chưa đăng nhập" description="Vui lòng đăng nhập" />;
  }

  const maNV = getMaNVFromUser(user);
  const myTasks = getWorkflowForUser(user).map((p) => getEffectiveTask(p.id) || p);

  // Chỉ tính phiếu Hoàn thành
  const completed = myTasks.filter((p) => p.trangThai === "Hoàn thành");

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);

    const result = { today: 0, week: 0, month: 0, all: 0, count: 0, daThanhToan: 0, conNo: 0 };

    for (const t of completed) {
      const tienCong = t.soLuongDat * t.donGia;
      const date = t.ngayHoanThanh || t.ngayGiao || "";
      if (date >= today) result.today += tienCong;
      if (date >= weekStart.toISOString().split("T")[0]) result.week += tienCong;
      if (date >= monthStart.toISOString().split("T")[0]) result.month += tienCong;
      result.all += tienCong;
      result.daThanhToan += t.daThanhToan;
      result.conNo += Math.max(0, tienCong - t.daThanhToan);
      result.count += 1;
    }
    return result;
  }, [completed]);

  const periodValue = period === "today" ? stats.today : period === "week" ? stats.week : period === "month" ? stats.month : stats.all;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <Link href="/cong-viec" className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1 mb-1">
          <ArrowLeft className="w-3 h-3" /> Quay lại
        </Link>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6 text-emerald-500" />
          Tiền công của tôi
        </h1>
        <p className="text-xs opacity-70 mt-1">
          {maNV && <span className="font-mono">{maNV}</span>} · Chỉ hiển thị tiền công của bạn
        </p>
      </div>

      {/* Bảo mật notice */}
      <div className="card p-3 bg-sky-500/10 text-xs flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <b>Bảo mật:</b> Bạn chỉ xem được tiền công của mình. Không thấy tiền công người khác, giá vốn, giá bán hay thông tin khách hàng.
        </div>
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

      {/* Big KPI */}
      <div className="card p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
        <div className="text-xs opacity-70 mb-1 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Tiền công {PERIODS.find((p) => p.key === period)?.label.toLowerCase()}
        </div>
        <div className="text-3xl md:text-4xl font-bold text-emerald-600 tabular-nums">
          {formatVNDShort(periodValue)}
        </div>
        <div className="text-[10px] opacity-60 mt-1">
          {stats.count} phiếu hoàn thành · Đơn giá thực tế theo từng khâu
        </div>
      </div>

      {/* 3 KPI nhỏ */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3 text-center">
          <div className="text-[10px] opacity-70">Hôm nay</div>
          <div className="text-base md:text-lg font-bold text-brand-600 tabular-nums">{formatVNDShort(stats.today)}</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-[10px] opacity-70">Tuần này</div>
          <div className="text-base md:text-lg font-bold text-sky-600 tabular-nums">{formatVNDShort(stats.week)}</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-[10px] opacity-70">Tháng này</div>
          <div className="text-base md:text-lg font-bold text-violet-600 tabular-nums">{formatVNDShort(stats.month)}</div>
        </div>
      </div>

      {/* Tổng kết */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-xs opacity-70 mb-1">Tổng tích luỹ</div>
          <div className="text-xl font-bold tabular-nums">{formatVNDShort(stats.all)}</div>
        </div>
        <div className="card p-4 bg-sky-500/10">
          <div className="text-xs opacity-70 mb-1">Đã thanh toán</div>
          <div className="text-xl font-bold text-sky-600 tabular-nums">{formatVNDShort(stats.daThanhToan)}</div>
        </div>
        <div className="card p-4 bg-amber-500/10">
          <div className="text-xs opacity-70 mb-1">Còn nợ</div>
          <div className="text-xl font-bold text-amber-600 tabular-nums">{formatVNDShort(stats.conNo)}</div>
        </div>
      </div>

      {/* Lịch sử tiền công */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-brand-500" />
          Lịch sử phiếu hoàn thành ({completed.length})
        </h2>
        {completed.length === 0 ? (
          <EmptyState
            icon={<Wallet className="w-7 h-7 text-slate-500 opacity-60" />}
            title="Chưa có phiếu hoàn thành"
            description="Hoàn thành & bàn giao để tiền công được ghi nhận"
          />
        ) : (
          <div className="space-y-2">
            {[...completed].sort((a, b) => (b.ngayHoanThanh || "").localeCompare(a.ngayHoanThanh || "")).map((p) => {
              const tienCong = p.soLuongDat * p.donGia;
              return (
                <Link key={p.id} href={`/cong-viec?taskId=${p.id}`}>
                  <MobileCard
                    title={`${p.id} · ${p.lenhCat || p.lenhSX}`}
                    subtitle={p.phanLoai || p.maSP}
                    badge={<span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-700">+{formatVNDShort(tienCong)}</span>}
                    fields={[
                      { label: "SL đạt", value: p.soLuongDat.toLocaleString() },
                      { label: "Đơn giá", value: <span className="font-mono">{p.donGia.toLocaleString()}đ</span> },
                      { label: "Ngày xong", value: <DateDisplay value={p.ngayHoanThanh} showRelative /> },
                      { label: "Còn nợ", value: <span className={p.thanhTien - p.daThanhToan > 0 ? "text-amber-600 font-semibold" : "text-emerald-600"}>{formatVNDShort(Math.max(0, p.thanhTien - p.daThanhToan))}</span> },
                    ]}
                    actions={<span className="text-xs text-brand-600 inline-flex items-center gap-1">Chi tiết <ChevronRight className="w-3 h-3" /></span>}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
