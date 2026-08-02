"use client";

// ============ LENH CAT PAGE (Giai đoạn 1 - Mavis) ============
// Trang chu quan ly Lenh Cat moi
// - Stats tong quan (tong LC, dang cat, da cat, hoan thanh, COGS TB)
// - List lệnh cắt mới tạo (cards)
// - Modal "Them Lenh Cat" với 4 sections + COGS auto

import { useState } from "react";
import {
  Scissors, Plus, TrendingUp, Calendar, Shirt, Package, AlertCircle,
  ChevronRight, Calculator, Wallet, Clock, CheckCircle2, Edit3, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import LenhCatModal from "@/components/LenhCatModal";
import {
  useLenhCat,
  type LenhCat,
  type TrangThaiLenhCat,
  TRANG_THAI_LC_LABELS,
  TRANG_THAI_LC_STYLE,
  LOAI_SP_LABELS,
} from "@/lib/data/lenh-cat-store";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { MobileCard, EmptyState, DateDisplay } from "@/components/ui";

export default function LenhCatPage() {
  const { dsLenhCat, xoaLenhCat, capNhatTrangThai, reset } = useLenhCat();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterTrangThai, setFilterTrangThai] = useState<TrangThaiLenhCat | "ALL">("ALL");

  // ============ KPIs ============
  const stats = {
    tongLC: dsLenhCat.length,
    moi: dsLenhCat.filter((l) => l.trangThai === "Moi").length,
    dangCat: dsLenhCat.filter((l) => l.trangThai === "DangCat").length,
    daCat: dsLenhCat.filter((l) => l.trangThai === "DaCat").length,
    hoanThanh: dsLenhCat.filter((l) => l.trangThai === "HoanThanh").length,
    tongSL: dsLenhCat.reduce((s, l) => s + l.tongSL, 0),
    tongGiaVon: dsLenhCat.reduce((s, l) => s + (l.bangCOGS?.tongGiaVon ?? 0), 0),
    giaVonTBSP: (() => {
      const valid = dsLenhCat.filter((l) => l.tongSL > 0 && l.bangCOGS);
      if (valid.length === 0) return 0;
      return valid.reduce((s, l) => s + l.tongSL * (l.bangCOGS?.giaVon1SP ?? 0), 0) /
        valid.reduce((s, l) => s + l.tongSL, 0);
    })(),
  };

  // ============ Filter ============
  const filteredLC = dsLenhCat.filter((l) => {
    if (filterTrangThai !== "ALL" && l.trangThai !== filterTrangThai) return false;
    return true;
  });

  // ============ Handlers ============
  const handleEdit = (id: string) => {
    setEditId(id);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditId(null);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(`Xoá ${id}? Hành động này không thể hoàn tác.`)) {
      xoaLenhCat(id, null);
      toast.success(`Đã xoá ${id}`);
    }
  };

  const handleReset = () => {
    if (confirm("Reset toàn bộ lệnh cắt về mặc định? Hành động này sẽ xoá dữ liệu bạn đã tạo.")) {
      reset();
      toast.success("Đã reset");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Scissors className="w-7 h-7 text-violet-500" />
            Lệnh cắt
          </h1>
          <p className="opacity-70 mt-1 text-sm">
            Tạo lệnh cắt mới, phân bổ size, tính giá vốn tự động (COGS)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Reset
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-fuchsia-700 flex items-center gap-1.5 shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-4 h-4" />
            Tạo lệnh cắt
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Scissors className="w-4 h-4" />}
          label="Tổng lệnh"
          value={stats.tongLC.toString()}
          sub={`${stats.tongSL.toLocaleString()} sp`}
          color="violet"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Mới + Đang cắt"
          value={(stats.moi + stats.dangCat).toString()}
          sub={`${stats.moi} mới · ${stats.dangCat} đang cắt`}
          color="amber"
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Đã cắt + Hoàn thành"
          value={(stats.daCat + stats.hoanThanh).toString()}
          sub={`${stats.daCat} đã cắt · ${stats.hoanThanh} xong`}
          color="emerald"
        />
        <StatCard
          icon={<Wallet className="w-4 h-4" />}
          label="Tổng giá vốn lô"
          value={formatVNDShort(stats.tongGiaVon)}
          sub={`BQ: ${formatVNDShort(stats.giaVonTBSP)}/sp`}
          color="sky"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 overflow-x-auto">
        {(["ALL", "Moi", "DangCat", "DaCat", "HoanThanh"] as const).map((tt) => {
          const count = tt === "ALL" ? dsLenhCat.length : dsLenhCat.filter((l) => l.trangThai === tt).length;
          const active = filterTrangThai === tt;
          return (
            <button
              key={tt}
              onClick={() => setFilterTrangThai(tt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                active
                  ? "bg-violet-500 text-white shadow"
                  : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
              }`}
            >
              {tt === "ALL" ? "Tất cả" : TRANG_THAI_LC_LABELS[tt]} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {filteredLC.length === 0 ? (
        <EmptyState
          icon={<Scissors className="w-7 h-7 text-violet-500 opacity-60" />}
          title={filterTrangThai === "ALL" ? "Chưa có lệnh cắt nào" : `Không có lệnh cắt ở trạng thái "${TRANG_THAI_LC_LABELS[filterTrangThai as TrangThaiLenhCat]}"`}
          description="Bấm 'Tạo lệnh cắt' để bắt đầu"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredLC.map((lc) => (
            <LenhCatCard
              key={lc.id}
              lc={lc}
              onEdit={() => handleEdit(lc.id)}
              onDelete={() => handleDelete(lc.id)}
              onChangeStatus={(tt) => capNhatTrangThai(lc.id, tt, null)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <LenhCatModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditId(null);
          }}
          editId={editId}
        />
      )}
    </div>
  );
}

// ============ Sub-components ============
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: "violet" | "amber" | "emerald" | "sky";
}) {
  const colorMap: Record<string, string> = {
    violet: "bg-violet-900 text-violet-50",
    amber: "bg-amber-900 text-amber-50",
    emerald: "bg-emerald-900 text-emerald-50",
    sky: "bg-sky-900 text-sky-50",
  };
  return (
    <div className={`rounded-xl p-3 shadow-md ${colorMap[color]}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold opacity-80 mb-1">
        {icon}<span>{label}</span>
      </div>
      <div className="text-xl md:text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-[10px] opacity-70 mt-1 font-medium">{sub}</div>}
    </div>
  );
}

function LenhCatCard({ lc, onEdit, onDelete, onChangeStatus }: {
  lc: LenhCat;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (tt: TrangThaiLenhCat) => void;
}) {
  const s = TRANG_THAI_LC_STYLE[lc.trangThai];
  const cogs = lc.bangCOGS;
  const isLate = lc.hanHoanThanh < new Date().toISOString().split("T")[0] && lc.trangThai !== "HoanThanh";

  return (
    <div className={`card p-4 hover:shadow-lg transition-shadow ${isLate ? "ring-1 ring-rose-500/40" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-mono opacity-60">{lc.id}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.bg} ${s.color} font-semibold`}>
              {TRANG_THAI_LC_LABELS[lc.trangThai]}
            </span>
            {isLate && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
          </div>
          <h3 className="font-bold text-sm truncate">{lc.tenSP}</h3>
          <p className="text-[10px] opacity-60 mt-0.5">
            {LOAI_SP_LABELS[lc.loaiSP]} · Mã: <span className="font-mono">{lc.maSP}</span>
          </p>
        </div>
      </div>

      {/* Body - Stats */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-60 flex items-center gap-1">
            <Package className="w-3 h-3" /> Tổng SL
          </span>
          <span className="font-bold tabular-nums">{lc.tongSL.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-60 flex items-center gap-1">
            <Shirt className="w-3 h-3" /> Phân bổ size
          </span>
          <span className="font-mono text-[10px]">
            {lc.phanBoSize.map((p) => `${p.size}:${p.sl}`).join(" · ")}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-60 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Hạn
          </span>
          <DateDisplay value={lc.hanHoanThanh} format="dd/MM" showRelative />
        </div>
        {cogs && (
          <>
            <div className="border-t pt-1.5 mt-1.5" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between text-xs">
                <span className="opacity-60 flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> Giá vốn / SP
                </span>
                <span className="font-bold text-violet-600 tabular-nums">
                  {formatVND(cogs.giaVon1SP)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-0.5">
                <span className="opacity-60">Tổng lô:</span>
                <span className="font-mono text-emerald-600 tabular-nums text-[11px]">
                  {formatVND(cogs.tongGiaVon)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-1 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={onEdit}
          className="flex-1 text-[10px] px-2 py-1.5 rounded bg-sky-500/15 text-sky-700 hover:bg-sky-500/25 font-medium flex items-center justify-center gap-1"
        >
          <Edit3 className="w-3 h-3" /> Sửa
        </button>
        <select
          value={lc.trangThai}
          onChange={(e) => onChangeStatus(e.target.value as TrangThaiLenhCat)}
          className="text-[10px] px-1 py-1 rounded border" style={{ borderColor: "var(--border)" }}
        >
          {(["Moi", "DangCat", "DaCat", "HoanThanh"] as TrangThaiLenhCat[]).map((tt) => (
            <option key={tt} value={tt}>{TRANG_THAI_LC_LABELS[tt]}</option>
          ))}
        </select>
        <button
          onClick={onDelete}
          className="text-[10px] px-2 py-1.5 rounded bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 font-medium"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
