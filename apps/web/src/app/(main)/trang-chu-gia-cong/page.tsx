"use client";

// ============ TRANG CHỦ NGƯỜI GIA CÔNG (Đợt 2 - Bộ 5) ============
// Mobile-first dashboard, dùng ALL_REAL_PHIEU (data thật từ Lark chị Giàu)
// 6 KPI cards + danh sách lệnh mới/đang làm
// Tailwind dùng design system hiện tại (sky/teal, glassmorphism)

import Link from "next/link";
import {
  Briefcase, Clock, CheckCircle2, AlertTriangle, Wallet, TrendingUp,
  Package, ChevronRight, Sparkles, ArrowRight,
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { useGiaCong } from "@/lib/data/gia-cong-store";
import {
  getGiaCongKPI, getWorkflowForUser, getStatusStyle,
  getMaNVFromUser,
} from "@/lib/workflow-filter";
import { MobileCard, EmptyState, DateDisplay, RoleBadge, ScopeBadge } from "@/components/ui";
import { formatVNDShort } from "@/lib/data/real-data";

export default function TrangChuGiaCongPage() {
  const { user } = useSession();
  const { getEffectiveTask } = useGiaCong();

  if (!user) {
    return (
      <EmptyState
        title="Chưa đăng nhập"
        description="Vui lòng đăng nhập để xem công việc"
      />
    );
  }

  const maNV = getMaNVFromUser(user);
  const kpi = getGiaCongKPI(user);
  const allWorkflow = getWorkflowForUser(user);
  const effectiveWorkflow = allWorkflow.map((p) => getEffectiveTask(p.id) || p);

  // Lệnh mới (chờ nhận) + đang thực hiện
  const moi = effectiveWorkflow.filter((p) =>
    p.trangThai === "Chờ giao" || p.trangThai === "Chờ gấp"
  );
  const dangLam = effectiveWorkflow.filter((p) =>
    p.trangThai === "Đang làm" || p.trangThai === "Đang may"
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header xin chào */}
      <div className="card p-4 md:p-5 bg-gradient-to-br from-brand-500/10 via-sky-500/5 to-transparent">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">👋</span>
              <h1 className="text-xl md:text-2xl font-bold truncate">
                Xin chào, {user.name}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <RoleBadge role={user.role} size="xs" />
              {maNV && <span className="opacity-60 font-mono">{maNV}</span>}
              <ScopeBadge scope="SELF" size="xs" />
            </div>
          </div>
          <Link
            href="/cong-viec"
            className="btn-primary text-sm inline-flex items-center gap-1.5 shrink-0"
          >
            <Briefcase className="w-4 h-4" />
            Tất cả việc
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 6 KPI cards - mobile-first (grid 2 cột mobile, 3 cột tablet, 6 cột desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
        <KPICard
          icon={<Sparkles className="w-4 h-4" />}
          label="Lệnh mới"
          value={kpi.moi}
          color="slate"
          highlight={kpi.moi > 0}
        />
        <KPICard
          icon={<Clock className="w-4 h-4" />}
          label="Đang làm"
          value={kpi.dangLam}
          color="amber"
        />
        <KPICard
          icon={<Package className="w-4 h-4" />}
          label="Chờ kiểm"
          value={kpi.choKiem}
          color="sky"
        />
        <KPICard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Cần làm lại"
          value={kpi.canLamLai}
          color="rose"
        />
        <KPICard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Hoàn thành"
          value={kpi.hoanThanh}
          color="emerald"
        />
        <KPICard
          icon={<TrendingUp className="w-4 h-4" />}
          label="SL hôm nay"
          value={kpi.sanLuongHomNay.toLocaleString()}
          color="violet"
        />
      </div>

      {/* Tiền công - 2 cards lớn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <div className="text-xs opacity-70">Tiền công hôm nay</div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatVNDShort(kpi.tienCongHomNay)}
          </div>
          <div className="text-[10px] opacity-60 mt-1">
            Đã tính trên phiếu Hoàn thành hôm nay
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/5">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-amber-600" />
            <div className="text-xs opacity-70">Tiền công tháng này</div>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {formatVNDShort(kpi.tienCongThangNay)}
          </div>
          <div className="text-[10px] opacity-60 mt-1">
            Tổng tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
          </div>
        </div>
      </div>

      {/* Lệnh mới (chờ nhận) - Quick action */}
      {moi.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-slate-500" />
              Lệnh mới ({moi.length})
            </h2>
            <Link href="/cong-viec" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Xem tất cả <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {moi.slice(0, 3).map((p) => (
              <WorkflowCard key={p.id} task={p} />
            ))}
          </div>
        </div>
      )}

      {/* Đang thực hiện */}
      {dangLam.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              Đang thực hiện ({dangLam.length})
            </h2>
            <Link href="/cong-viec" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Xem tất cả <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dangLam.slice(0, 3).map((p) => (
              <WorkflowCard key={p.id} task={p} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state khi không có việc */}
      {moi.length === 0 && dangLam.length === 0 && (
        <EmptyState
          icon={<Briefcase className="w-7 h-7 text-slate-500 opacity-60" />}
          title="Chưa có công việc"
          description={
            maNV
              ? `Mã ${maNV} chưa được giao việc. Liên hệ QLSX để được phân công.`
              : "Bạn chưa được giao việc. Liên hệ QLSX để được phân công."
          }
        />
      )}
    </div>
  );
}

// ============ Sub-components ============

function KPICard({ icon, label, value, color, highlight = false }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: "slate" | "amber" | "sky" | "rose" | "emerald" | "violet";
  highlight?: boolean;
}) {
  const colorMap: Record<string, string> = {
    slate: "from-slate-500/10 to-slate-500/5 text-slate-700 dark:text-slate-300",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-700 dark:text-amber-400",
    sky: "from-sky-500/10 to-sky-500/5 text-sky-700 dark:text-sky-400",
    rose: "from-rose-500/10 to-rose-500/5 text-rose-700 dark:text-rose-400",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-700 dark:text-emerald-400",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-700 dark:text-violet-400",
  };
  return (
    <div
      className={`card p-3 md:p-4 bg-gradient-to-br ${colorMap[color]} ${
        highlight ? "ring-2 ring-amber-500/40" : ""
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs opacity-80 mb-1">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-xl md:text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function WorkflowCard({ task }: { task: any }) {
  const status = getStatusStyle(task.trangThai);
  return (
    <Link href={`/cong-viec?taskId=${task.id}`}>
      <MobileCard
        title={`${task.id} · ${task.lenhCat || task.lenhSX}`}
        subtitle={task.phanLoai || task.maSP}
        badge={<span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text}`}>{status.label}</span>}
        fields={[
          { label: "Mã SP", value: task.maSP },
          { label: "Màu/Size", value: `${task.mau || "—"} · ${task.size || "—"}` },
          { label: "SL giao", value: task.soLuongGiao.toLocaleString(), highlight: true },
          { label: "Hạn", value: <DateDisplay value={task.hanHoanThanh} format="dd/MM" showRelative /> },
        ]}
        actions={
          <span className="text-xs text-brand-600 font-medium inline-flex items-center gap-1">
            Mở chi tiết <ChevronRight className="w-3 h-3" />
          </span>
        }
      />
    </Link>
  );
}
