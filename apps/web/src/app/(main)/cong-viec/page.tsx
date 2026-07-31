"use client";

// ============ TRANG CÔNG VIỆC CỦA TÔI (Đợt 2 - Bộ 5) ============
// Danh sách tất cả công việc của user hiện tại
// Filter: 5 trạng thái + search
// Mobile-first dùng MobileCard (không bảng dài)
// Click card → mở modal chi tiết 7 tab

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Briefcase, Search, Filter, ChevronRight, Sparkles, Clock,
  CheckCircle2, AlertTriangle, Package,
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { useGiaCong } from "@/lib/data/gia-cong-store";
import {
  getWorkflowForUser, getStatusStyle, getMaNVFromUser,
} from "@/lib/workflow-filter";
import { MobileCard, EmptyState, DateDisplay, RoleBadge } from "@/components/ui";
import { CongViecDetailModal } from "@/components/gia-cong/CongViecDetailModal";
import { toast } from "sonner";

type FilterStatus = "ALL" | "Chờ nhận" | "Đang làm" | "Chờ kiểm" | "Cần làm lại" | "Hoàn thành";

const FILTER_TABS: { key: FilterStatus; label: string; icon: any; match: (status: string) => boolean }[] = [
  { key: "ALL", label: "Tất cả", icon: Briefcase, match: () => true },
  { key: "Chờ nhận", label: "Chờ nhận", icon: Sparkles, match: (s) => s === "Chờ giao" || s === "Chờ gấp" },
  { key: "Đang làm", label: "Đang làm", icon: Clock, match: (s) => s === "Đang làm" || s === "Đang may" },
  { key: "Chờ kiểm", label: "Chờ kiểm", icon: Package, match: (s) => s === "Hoàn thành" },
  { key: "Cần làm lại", label: "Cần làm lại", icon: AlertTriangle, match: (s) => s === "Cần làm lại" },
  { key: "Hoàn thành", label: "Hoàn thành", icon: CheckCircle2, match: (s) => s === "Hoàn thành" },
];

export default function CongViecPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <CongViecContent />
    </Suspense>
  );
}

function CongViecContent() {
  const { user } = useSession();
  const { getEffectiveTask } = useGiaCong();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Mở modal khi có ?taskId=xxx
  useEffect(() => {
    const tid = searchParams.get("taskId");
    if (tid) setSelectedId(tid);
  }, [searchParams]);

  if (!user) {
    return <EmptyState title="Chưa đăng nhập" description="Vui lòng đăng nhập để xem công việc" />;
  }

  const maNV = getMaNVFromUser(user);
  const allTasks = getWorkflowForUser(user).map((p) => getEffectiveTask(p.id) || p);

  // Filter theo status
  const activeFilter = FILTER_TABS.find((t) => t.key === filter) || FILTER_TABS[0];
  let filtered = allTasks.filter((t) => activeFilter.match(t.trangThai));

  // Filter theo search
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((t) =>
      t.id.toLowerCase().includes(q) ||
      (t.lenhCat || "").toLowerCase().includes(q) ||
      (t.lenhSX || "").toLowerCase().includes(q) ||
      (t.maSP || "").toLowerCase().includes(q) ||
      (t.phanLoai || "").toLowerCase().includes(q) ||
      (t.mau || "").toLowerCase().includes(q) ||
      (t.size || "").toLowerCase().includes(q)
    );
  }

  // Sort: ưu tiên "Chờ giao" > "Đang làm" > còn lại
  const priorityOrder: Record<string, number> = {
    "Chờ giao": 1, "Chờ gấp": 1, "Đang làm": 2, "Đang may": 2, "Hoàn thành": 3,
  };
  filtered.sort((a, b) => (priorityOrder[a.trangThai] || 9) - (priorityOrder[b.trangThai] || 9));

  const selectedTask = selectedId ? allTasks.find((t) => t.id === selectedId) : null;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-brand-500" />
            Công việc của tôi
          </h1>
          <p className="text-xs opacity-70 mt-1">
            {maNV ? <span className="font-mono">{maNV}</span> : user.name} · {allTasks.length} việc
          </p>
        </div>
        <RoleBadge role={user.role} size="sm" />
      </div>

      {/* Search */}
      <div className="card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã lệnh, mã SP, màu, size..."
            className="input pl-9 w-full"
          />
        </div>
      </div>

      {/* Filter chips - scroll ngang mobile */}
      <div className="overflow-x-auto -mx-3 px-3">
        <div className="flex gap-2 pb-2 min-w-max">
          {FILTER_TABS.map((t) => {
            const Icon = t.icon;
            const count = t.key === "ALL" ? allTasks.length : allTasks.filter((p) => t.match(p.trangThai)).length;
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition ${
                  active
                    ? "bg-brand-500 text-white shadow"
                    : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-7 h-7 text-slate-500 opacity-60" />}
          title={search ? `Không tìm thấy "${search}"` : "Chưa có công việc"}
          description={search ? "Thử từ khoá khác" : `Bạn chưa có việc ở trạng thái "${activeFilter.label}"`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const status = getStatusStyle(p.trangThai);
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="text-left"
              >
                <MobileCard
                  title={`${p.id} · ${p.lenhCat || p.lenhSX}`}
                  subtitle={p.phanLoai || p.maSP}
                  badge={<span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text}`}>{status.label}</span>}
                  fields={[
                    { label: "Mã SP", value: <span className="font-mono font-semibold">{p.maSP}</span> },
                    { label: "Màu · Size", value: `${p.mau || "—"} · ${p.size || "—"}` },
                    { label: "SL giao", value: p.soLuongGiao.toLocaleString(), highlight: true },
                    { label: "Đạt", value: p.soLuongDat > 0 ? <span className="text-emerald-600">{p.soLuongDat.toLocaleString()}</span> : "—" },
                    { label: "Hạn", value: <DateDisplay value={p.hanHoanThanh} format="dd/MM" showRelative /> },
                    { label: "Giao bởi", value: <span className="font-mono text-[10px]">{p.nguoiGiao}</span> },
                  ]}
                  actions={
                    <span className="text-xs text-brand-600 font-medium inline-flex items-center gap-1">
                      Mở chi tiết <ChevronRight className="w-3 h-3" />
                    </span>
                  }
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Modal chi tiết */}
      {selectedTask && (
        <CongViecDetailModal
          task={selectedTask}
          user={user}
          open={!!selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
