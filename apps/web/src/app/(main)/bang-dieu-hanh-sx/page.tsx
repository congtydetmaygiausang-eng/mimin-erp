"use client";

// ============ BẢNG ĐIỀU HÀNH SẢN XUẤT (Đợt 3 - Bộ 2) ============
// Trang cho QLSX (DIEU_PHOI_SX): giao việc, theo dõi tiến độ, duyệt
// Desktop: bảng đầy đủ 10+ cột | Mobile: card view
// Dùng ALL_REAL_PHIEU (data thật từ Lark chị Giàu) + PhanCongProvider (localStorage)

import { useState, useMemo, Suspense } from "react";
import {
  Factory, Send, RefreshCw, Calendar, AlertCircle, CheckCircle2, X,
  ChevronRight, MoreVertical, BarChart3, Clock, Wallet,
  TrendingUp, Package, AlertTriangle, Eye, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { useGiaCong } from "@/lib/data/gia-cong-store";
import {
  groupByLSX, flattenPhieu, getBDHKPI, getCongDoanFromId,
  CONG_DOAN_LABELS, type LSXSummary, type PhieuRow,
} from "@/lib/bang-dieu-hanh-helper";
import type { PhieuWorkflow } from "@/lib/workflow-data";
import { logWorkflow } from "@/lib/audit-log";
import { DateDisplay, EmptyState, MobileCard } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui";
import { formatVNDShort } from "@/lib/data/real-data";
import { BangDieuHanhActions } from "@/components/qlsx/BangDieuHanhActions";

type ViewMode = "lsx" | "phieu";
type StatusFilter = "all" | "tre-han" | "dang-sx" | "hoan-thanh" | "moi";

export default function BangDieuHanhSXPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <BangDieuHanhContent />
    </Suspense>
  );
}

function BangDieuHanhContent() {
  const { user } = useSession();
  const { getEffectiveTask } = useGiaCong();
  const [view, setView] = useState<ViewMode>("lsx");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<PhieuWorkflow | null>(null);
  const [actionType, setActionType] = useState<null | "assign" | "extend" | "revoke" | "rework" | "transfer" | "approve">(null);
  const [confirmAction, setConfirmAction] = useState<null | { title: string; description?: string; onConfirm: () => void; variant?: "danger" | "primary" | "warning"; confirmLabel?: string }>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  if (!user) {
    return <EmptyState title="Chưa đăng nhập" description="Vui lòng đăng nhập" />;
  }

  const kpi = getBDHKPI();
  const lsxList = useMemo(() => {
    // Áp dụng effective task
    return groupByLSX().map((l) => ({
      ...l,
      phieu: l.phieu.map((p) => getEffectiveTask(p.id) || p),
    }));
  }, []);
  const phieuList = useMemo(() => {
    return flattenPhieu().map((p) => {
      const effective = getEffectiveTask(p.id);
      return { ...p, ...effective };
    });
  }, []);

  // Filter
  const filteredLSX = lsxList.filter((l) => {
    if (filter !== "all" && l.trangThai !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.lenhSX.toLowerCase().includes(q) &&
          !l.maSP.toLowerCase().includes(q) &&
          !(l.phanLoai || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const filteredPhieu = phieuList.filter((p) => {
    if (filter === "tre-han" && !p.quaHan) return false;
    if (filter === "hoan-thanh" && p.trangThai !== "Hoàn thành") return false;
    if (filter === "dang-sx" && (p.trangThai === "Chờ giao" || p.trangThai === "Chờ gấp" || p.trangThai === "Hoàn thành")) return false;
    if (filter === "moi" && p.trangThai !== "Chờ giao" && p.trangThai !== "Chờ gấp") return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.id.toLowerCase().includes(q) &&
          !p.lenhSX.toLowerCase().includes(q) &&
          !p.lenhCat.toLowerCase().includes(q) &&
          !p.maSP.toLowerCase().includes(q) &&
          !(p.congDoan ? CONG_DOAN_LABELS[p.congDoan] : "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const openAction = (task: PhieuWorkflow, type: typeof actionType) => {
    setSelectedTask(task);
    setActionType(type);
    setActionMenuId(null);
  };

  return (
    <div className="space-y-4 animate-fade-in" onClick={() => setActionMenuId(null)}>
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Factory className="w-6 h-6 text-brand-500" />
          Bảng điều hành SX
        </h1>
        <p className="text-xs opacity-70 mt-1">Theo dõi tiến độ + giao việc + duyệt (QLSX)</p>
      </div>

      {/* 8 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <KPICard icon={<Factory className="w-4 h-4" />} label="Tổng LSX" value={kpi.tongLSX} color="brand" />
        <KPICard icon={<TrendingUp className="w-4 h-4" />} label="Đang SX" value={kpi.lsxDangSX} color="amber" />
        <KPICard icon={<CheckCircle2 className="w-4 h-4" />} label="Hoàn thành" value={kpi.lsxHoanThanh} color="emerald" />
        <KPICard icon={<AlertTriangle className="w-4 h-4" />} label="Trễ hạn" value={kpi.lsxTreHan} color="rose" highlight={kpi.lsxTreHan > 0} />
        <KPICard icon={<Package className="w-4 h-4" />} label="Tổng phiếu" value={kpi.tongPhieu} color="slate" />
        <KPICard icon={<Clock className="w-4 h-4" />} label="Đang làm" value={kpi.phieuDangLam} color="sky" />
        <KPICard icon={<BarChart3 className="w-4 h-4" />} label="SL đạt/tổng" value={`${kpi.tongSLDat.toLocaleString()}/${kpi.tongSLGiao.toLocaleString()}`} color="violet" />
        <KPICard icon={<Wallet className="w-4 h-4" />} label="Tiền còn nợ" value={formatVNDShort(kpi.tienConNo)} color="amber" />
      </div>

      {/* View + Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="card p-1.5 inline-flex">
          {[
            { k: "lsx" as ViewMode, l: "Theo LSX" },
            { k: "phieu" as ViewMode, l: "Theo phiếu" },
          ].map((v) => (
            <button
              key={v.k}
              onClick={() => setView(v.k)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                view === v.k ? "bg-brand-500 text-white shadow" : "hover:bg-white/40"
              }`}
            >
              {v.l}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto flex-1 min-w-0">
          {[
            { k: "all" as StatusFilter, l: "Tất cả" },
            { k: "tre-han" as StatusFilter, l: "Trễ hạn", danger: true },
            { k: "dang-sx" as StatusFilter, l: "Đang SX" },
            { k: "moi" as StatusFilter, l: "Mới" },
            { k: "hoan-thanh" as StatusFilter, l: "Hoàn thành" },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap inline-flex items-center gap-1 ${
                filter === f.k
                  ? f.danger ? "bg-rose-500 text-white" : "bg-brand-500 text-white"
                  : f.danger ? "bg-rose-500/10 text-rose-700" : "bg-white/40 hover:bg-white/60"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="card p-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã LSX, mã SP, công đoạn..."
          className="input w-full"
        />
      </div>

      {/* Table view: Theo LSX */}
      {view === "lsx" && (
        <>
          {filteredLSX.length === 0 ? (
            <EmptyState title="Không có LSX" description="Thử đổi filter hoặc tìm từ khoá khác" />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b bg-slate-50/50 dark:bg-white/5" style={{ borderColor: "var(--border)" }}>
                        <th className="p-3">LSX / Mã SP</th>
                        <th className="p-3">CĐ hiện tại</th>
                        <th className="p-3 text-right">SL giao</th>
                        <th className="p-3 text-right">SL đạt</th>
                        <th className="p-3 text-right">SL lỗi</th>
                        <th className="p-3 text-right">Còn lại</th>
                        <th className="p-3">Hạn</th>
                        <th className="p-3">Trạng thái</th>
                        <th className="p-3 text-right">Tiền công</th>
                        <th className="p-3 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLSX.map((l) => (
                        <LSXTableRow
                          key={l.lenhSX}
                          lsx={l}
                          onAction={(task, type) => openAction(task, type)}
                          onLock={(_task) => {
                            setConfirmAction({
                              title: "Khóa đối soát",
                              description: `Sau khi khóa, phiếu sẽ không thể chỉnh sửa. Tiếp tục?`,
                              variant: "warning",
                              confirmLabel: "Khóa",
                              onConfirm: () => {
                                logWorkflow(user, "lock", l.lenhSX, l.lenhSX);
                                toast.success("Đã khóa đối soát");
                              },
                            });
                          }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile card view */}
              <div className="lg:hidden grid grid-cols-1 gap-3">
                {filteredLSX.map((l) => (
                  <LSXCard
                    key={l.lenhSX}
                    lsx={l}
                    onAction={(task, type) => openAction(task, type)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Table view: Theo phiếu */}
      {view === "phieu" && (
        <>
          {filteredPhieu.length === 0 ? (
            <EmptyState title="Không có phiếu" description="Thử đổi filter hoặc tìm từ khoá khác" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredPhieu.map((p) => (
                <PhieuCard
                  key={p.id}
                  phieu={p as PhieuRow}
                  onAction={(task, type) => openAction(task, type)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Action modal */}
      {selectedTask && actionType && (
        <BangDieuHanhActions
          task={selectedTask}
          action={actionType}
          user={user}
          onClose={() => { setSelectedTask(null); setActionType(null); }}
        />
      )}

      {/* Confirm dialog */}
      {confirmAction && (
        <ConfirmDialog
          open
          onClose={() => setConfirmAction(null)}
          onConfirm={() => { confirmAction.onConfirm(); setConfirmAction(null); }}
          title={confirmAction.title}
          description={confirmAction.description}
          variant={confirmAction.variant}
          confirmLabel={confirmAction.confirmLabel}
        />
      )}
    </div>
  );
}

// ============ Sub Components ============

function KPICard({ icon, label, value, color, highlight = false }: any) {
  const colorMap: Record<string, string> = {
    slate: "from-slate-500/10 to-slate-500/5 text-slate-700 dark:text-slate-300",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-700 dark:text-amber-400",
    rose: "from-rose-500/10 to-rose-500/5 text-rose-700 dark:text-rose-400",
    sky: "from-sky-500/10 to-sky-500/5 text-sky-700 dark:text-sky-400",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-700 dark:text-violet-400",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-700 dark:text-emerald-400",
    brand: "from-brand-500/10 to-brand-500/5 text-brand-700 dark:text-brand-400",
  };
  return (
    <div className={`card p-3 bg-gradient-to-br ${colorMap[color]} ${highlight ? "ring-2 ring-rose-500/40" : ""}`}>
      <div className="flex items-center gap-1.5 text-xs opacity-80 mb-1">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-lg md:text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function LSXTableRow({ lsx, onAction, onLock }: { lsx: LSXSummary; onAction: (task: PhieuWorkflow, type: any) => void; onLock: (task: PhieuWorkflow) => void }) {
  const firstTask = lsx.phieu[0];
  const conLai = Math.max(0, lsx.tongSLGiao - lsx.tongSLDat - lsx.tongSLLoi);
  const statusStyle = STATUS_STYLES[lsx.trangThai];
  return (
    <tr className="border-b hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
      <td className="p-3">
        <div className="font-mono font-semibold text-xs">{lsx.lenhSX}</div>
        <div className="text-[10px] opacity-70">Mã SP: <b>{lsx.maSP}</b> · {lsx.phanLoai}</div>
      </td>
      <td className="p-3">
        <span className="text-xs font-medium">{lsx.congDoanHienTai}</span>
        <div className="text-[10px] opacity-60">{lsx.phieuDangLam}/{lsx.tongPhieu} phiếu đang chạy</div>
      </td>
      <td className="p-3 text-right font-mono">{lsx.tongSLGiao.toLocaleString()}</td>
      <td className="p-3 text-right font-mono text-emerald-600 font-semibold">{lsx.tongSLDat.toLocaleString()}</td>
      <td className="p-3 text-right font-mono text-rose-600">{lsx.tongSLLoi.toLocaleString()}</td>
      <td className="p-3 text-right font-mono text-amber-600">{conLai.toLocaleString()}</td>
      <td className="p-3">
        <DateDisplay value={lsx.hanHoanThanh} showRelative />
      </td>
      <td className="p-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
          {statusStyle.icon} {statusStyle.label}
        </span>
        {lsx.trangThai === "tre-han" && <div className="text-[10px] text-rose-600 font-bold mt-0.5">CẦN XỬ LÝ</div>}
      </td>
      <td className="p-3 text-right">
        <div className="text-xs font-mono font-semibold">{formatVNDShort(lsx.tongChiPhi)}</div>
        {lsx.tienConNo > 0 && <div className="text-[10px] text-amber-600">Nợ {formatVNDShort(lsx.tienConNo)}</div>}
      </td>
      <td className="p-3 text-center">
        <RowActionMenu lsx={lsx} firstTask={firstTask} onAction={onAction} onLock={onLock} />
      </td>
    </tr>
  );
}

function RowActionMenu({ lsx, firstTask, onAction, onLock }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded hover:bg-white/40"
        title="Thao tác"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 z-10 card p-1 w-52 shadow-xl animate-fade-in">
          <MenuItem icon={<Send className="w-3.5 h-3.5" />} label="Giao việc" onClick={() => onAction(firstTask, "assign")} />
          <MenuItem icon={<Calendar className="w-3.5 h-3.5" />} label="Gia hạn" onClick={() => onAction(firstTask, "extend")} />
          <MenuItem icon={<ArrowRight className="w-3.5 h-3.5" />} label="Chuyển CĐ" onClick={() => onAction(firstTask, "transfer")} />
          <MenuItem icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Duyệt hoàn thành" onClick={() => onAction(firstTask, "approve")} />
          <div className="border-t my-1" style={{ borderColor: "var(--border)" }} />
          <MenuItem icon={<RefreshCw className="w-3.5 h-3.5" />} label="Yêu cầu làm lại" onClick={() => onAction(firstTask, "rework")} danger />
          <MenuItem icon={<X className="w-3.5 h-3.5" />} label="Thu hồi" onClick={() => onAction(firstTask, "revoke")} danger />
          <MenuItem icon={<Eye className="w-3.5 h-3.5" />} label="Khóa đối soát" onClick={() => onLock(firstTask)} warning />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger, warning }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; warning?: boolean }) {
  const color = danger ? "text-rose-700 hover:bg-rose-500/10" : warning ? "text-amber-700 hover:bg-amber-500/10" : "hover:bg-brand-500/10";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left text-xs px-2.5 py-1.5 rounded flex items-center gap-2 ${color}`}
    >
      {icon} {label}
    </button>
  );
}

function LSXCard({ lsx, onAction }: { lsx: LSXSummary; onAction: (task: PhieuWorkflow, type: any) => void }) {
  const firstTask = lsx.phieu[0];
  const statusStyle = STATUS_STYLES[lsx.trangThai];
  const conLai = Math.max(0, lsx.tongSLGiao - lsx.tongSLDat - lsx.tongSLLoi);
  return (
    <MobileCard
      title={lsx.lenhSX}
      subtitle={`${lsx.maSP} · ${lsx.phanLoai}`}
      badge={<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>{statusStyle.icon} {statusStyle.label}</span>}
      fields={[
        { label: "CĐ hiện tại", value: lsx.congDoanHienTai, fullWidth: true },
        { label: "SL giao / đạt", value: <span className="font-mono">{lsx.tongSLGiao.toLocaleString()} / <b className="text-emerald-600">{lsx.tongSLDat.toLocaleString()}</b></span>, highlight: true },
        { label: "Lỗi / Còn", value: <span className="font-mono"><span className="text-rose-600">{lsx.tongSLLoi}</span> / <span className="text-amber-600">{conLai.toLocaleString()}</span></span> },
        { label: "Hạn", value: <DateDisplay value={lsx.hanHoanThanh} showRelative /> },
        { label: "Tiền công", value: <span className="font-mono font-semibold">{formatVNDShort(lsx.tongChiPhi)}</span> },
      ]}
      actions={
        <div className="flex flex-wrap gap-1.5 w-full">
          <button onClick={() => onAction(firstTask, "assign")} className="text-[10px] px-2 py-1 rounded bg-brand-500/15 text-brand-700 font-medium">Giao</button>
          <button onClick={() => onAction(firstTask, "extend")} className="text-[10px] px-2 py-1 rounded bg-amber-500/15 text-amber-700 font-medium">Gia hạn</button>
          <button onClick={() => onAction(firstTask, "transfer")} className="text-[10px] px-2 py-1 rounded bg-sky-500/15 text-sky-700 font-medium">Chuyển</button>
          <button onClick={() => onAction(firstTask, "approve")} className="text-[10px] px-2 py-1 rounded bg-emerald-500/15 text-emerald-700 font-medium">Duyệt</button>
          <button onClick={() => onAction(firstTask, "rework")} className="text-[10px] px-2 py-1 rounded bg-rose-500/10 text-rose-700">Làm lại</button>
        </div>
      }
    />
  );
}

function PhieuCard({ phieu, onAction }: { phieu: PhieuRow; onAction: (task: PhieuWorkflow, type: any) => void }) {
  const statusStyle = PHIEU_STATUS_STYLES[phieu.trangThai] || { bg: "bg-slate-500/15", text: "text-slate-700", label: phieu.trangThai };
  const khau = phieu.congDoan ? CONG_DOAN_LABELS[phieu.congDoan] : "—";
  return (
    <MobileCard
      title={`${phieu.id} · ${phieu.lenhSX}`}
      subtitle={`${phieu.phanLoai || phieu.maSP} · ${khau}`}
      badge={
        <div className="flex flex-col items-end gap-0.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>{statusStyle.label}</span>
          {phieu.quaHan && <span className="text-[9px] text-rose-600 font-bold">TRỄ {phieu.soNgayTreHan} ngày</span>}
        </div>
      }
      fields={[
        { label: "Người giữ", value: <span className="font-mono text-[10px]">{phieu.tenNguoiNhan}</span>, fullWidth: true },
        { label: "SL giao", value: phieu.soLuongGiao.toLocaleString() },
        { label: "Đạt / Lỗi", value: <span className="font-mono"><b className="text-emerald-600">{phieu.soLuongDat.toLocaleString()}</b> / <span className="text-rose-600">{phieu.soLuongLoi.toLocaleString()}</span></span> },
        { label: "Hạn", value: <DateDisplay value={phieu.hanHoanThanh} showRelative /> },
        { label: "Tiền công", value: <span className="font-mono font-semibold">{formatVNDShort(phieu.chiPhiTamTinh)}</span> },
      ]}
      actions={
        <div className="flex flex-wrap gap-1.5 w-full">
          <button onClick={() => onAction(phieu, "assign")} className="text-[10px] px-2 py-1 rounded bg-brand-500/15 text-brand-700 font-medium">Giao lại</button>
          <button onClick={() => onAction(phieu, "extend")} className="text-[10px] px-2 py-1 rounded bg-amber-500/15 text-amber-700 font-medium">Gia hạn</button>
          <button onClick={() => onAction(phieu, "transfer")} className="text-[10px] px-2 py-1 rounded bg-sky-500/15 text-sky-700 font-medium">Chuyển CĐ</button>
          <button onClick={() => onAction(phieu, "approve")} className="text-[10px] px-2 py-1 rounded bg-emerald-500/15 text-emerald-700 font-medium">Duyệt</button>
        </div>
      }
    />
  );
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  "moi": { bg: "bg-slate-500/15", text: "text-slate-700", label: "Mới", icon: <Clock className="w-3 h-3" /> },
  "dang-sx": { bg: "bg-amber-500/15", text: "text-amber-700", label: "Đang SX", icon: <TrendingUp className="w-3 h-3" /> },
  "hoan-thanh": { bg: "bg-emerald-500/15", text: "text-emerald-700", label: "Hoàn thành", icon: <CheckCircle2 className="w-3 h-3" /> },
  "tre-han": { bg: "bg-rose-500/15", text: "text-rose-700", label: "Trễ hạn", icon: <AlertTriangle className="w-3 h-3" /> },
};

const PHIEU_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  "Chờ giao": { bg: "bg-slate-500/15", text: "text-slate-700", label: "Chờ giao" },
  "Chờ gấp": { bg: "bg-slate-500/15", text: "text-slate-700", label: "Chờ gấp" },
  "Đang làm": { bg: "bg-amber-500/15", text: "text-amber-700", label: "Đang làm" },
  "Đang may": { bg: "bg-amber-500/15", text: "text-amber-700", label: "Đang may" },
  "Hoàn thành": { bg: "bg-emerald-500/15", text: "text-emerald-700", label: "Hoàn thành" },
};
