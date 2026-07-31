"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Scissors, Palette, Shirt, Disc3, Flame, Package, ChevronRight,
  Search, Filter, Plus, AlertCircle, CheckCircle2, Clock, Truck
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { WorkflowActions } from "@/components/WorkflowSteps";
import {
  PHIEU_CAT, PHIEU_IN_THEU_DAP, PHIEU_MAY, PHIEU_KHUY_NUT, PHIEU_UI, PHIEU_DONG_GOI,
  NGUOI_IN_THEU_DAP, NGUOI_MAY, NGUOI_KHUY_NUT, NGUOI_UI, NGUOI_DONG_GOI, DON_GIA,
  KHAU_LABELS, KHAU_ICONS, type Khau, type PhieuWorkflow, TRANG_THAI_COLORS
} from "@/lib/workflow-data";
import { Avatar } from "@/components/Avatar";

const STORAGE_KEY = "mimin_phieu_workflow_v1";

function loadPhieu(): PhieuWorkflow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, PhieuWorkflow>;
    return Object.values(map);
  } catch {
    return [];
  }
}

const KHAU_META: Record<Khau, { icon: any; color: string; nguoi: any[]; sub: string }> = {
  "cat": { icon: Scissors, color: "from-rose-500 to-pink-500", nguoi: [], sub: "Tổ cắt xưởng nhà" },
  "in-thêu-dập": { icon: Palette, color: "from-violet-500 to-purple-500", nguoi: NGUOI_IN_THEU_DAP, sub: "5 đối tác in/thêu/dập" },
  "may": { icon: Shirt, color: "from-sky-500 to-cyan-500", nguoi: [...NGUOI_MAY["May quần"], ...NGUOI_MAY["May áo tròn"], ...NGUOI_MAY["May áo trụ"]], sub: "15 đối tác may (áo/quần/bộ)" },
  "khuy-nut": { icon: Disc3, color: "from-amber-500 to-orange-500", nguoi: NGUOI_KHUY_NUT, sub: "1 nhân viên - 750đ/cái" },
  "ui": { icon: Flame, color: "from-orange-500 to-red-500", nguoi: NGUOI_UI, sub: "3 nhân viên - 600-800đ/cái" },
  "dong-goi": { icon: Package, color: "from-emerald-500 to-green-500", nguoi: NGUOI_DONG_GOI, sub: "3 nhân viên - 800-1500đ/cội" },
};

export default function WorkflowPage() {
  const { user } = useSession();
  const [activeKhau, setActiveKhau] = useState<Khau>("in-thêu-dập");
  const [phieuMap, setPhieuMap] = useState<Record<string, PhieuWorkflow>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    // Merge với data mẫu
    const all: Record<string, PhieuWorkflow> = {};
    [...PHIEU_CAT, ...PHIEU_IN_THEU_DAP, ...PHIEU_MAY, ...PHIEU_KHUY_NUT, ...PHIEU_UI, ...PHIEU_DONG_GOI].forEach((p) => {
      all[p.id] = p;
    });
    // Override với localStorage
    const saved = loadPhieu();
    saved.forEach((p) => { all[p.id] = p; });
    setPhieuMap(all);
  }, []);

  const khauList: Khau[] = ["cat", "in-thêu-dập", "may", "khuy-nut", "ui", "dong-goi"];

  // Filter phiếu theo khâu hiện tại
  const allPhieu = useMemo(() => Object.values(phieuMap), [phieuMap]);
  const phieuCuaKhau = useMemo(() => {
    const prefixMap: Record<Khau, string[]> = {
      "cat": ["CAT_"],
      "in-thêu-dập": ["INTD_"],
      "may": ["MAY_"],
      "khuy-nut": ["KN_"],
      "ui": ["UI_"],
      "dong-goi": ["DG_"],
    };
    const prefixes = prefixMap[activeKhau] || [];
    return allPhieu.filter((p) => prefixes.some((pf) => p.id.startsWith(pf)));
  }, [allPhieu, activeKhau]);

  const filtered = useMemo(() => {
    return phieuCuaKhau.filter((p) => {
      const matchSearch = !search || [p.id, p.maSP, p.phanLoai, p.tenNguoiNhan].some((s) => (s || "").toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "all" || p.trangThai === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [phieuCuaKhau, search, statusFilter]);

  const updatePhieu = (p: PhieuWorkflow) => {
    setPhieuMap((prev) => ({ ...prev, [p.id]: p }));
  };

  const activeMeta = KHAU_META[activeKhau];

  // Stats
  const stats = useMemo(() => {
    return {
      total: phieuCuaKhau.length,
      choGiao: phieuCuaKhau.filter((p) => p.trangThai === "Chờ giao" || (p.trangThai as any) === "Chờ gấp").length,
      dangLam: phieuCuaKhau.filter((p) => p.trangThai === "Đang làm" || (p.trangThai as any) === "Đang may").length,
      hoanThanh: phieuCuaKhau.filter((p) => p.trangThai === "Hoàn thành").length,
      loi: phieuCuaKhau.filter((p) => p.trangThai === "Lỗi" || (p.trangThai as any) === "Thiếu").length,
    };
  }, [phieuCuaKhau]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <span className="text-3xl">{KHAU_ICONS[activeKhau]}</span> {KHAU_LABELS[activeKhau]}
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          {activeMeta.sub} · {stats.total} phiếu · {stats.hoanThanh} hoàn thành · {stats.loi} lỗi/thiếu
        </p>
      </div>

      {/* Khâu switcher */}
      <div className="card p-2 flex flex-wrap gap-2">
        {khauList.map((k) => {
          const meta = KHAU_META[k];
          const Icon = meta.icon;
          const isActive = activeKhau === k;
          return (
            <button
              key={k}
              onClick={() => setActiveKhau(k)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? `bg-gradient-to-r ${meta.color} text-white shadow-lg`
                  : "hover:bg-white/40 dark:hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {KHAU_LABELS[k]}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Tổng" value={stats.total} color="bg-slate-500/10 text-slate-700" />
        <StatCard label="Chờ giao" value={stats.choGiao} color="bg-amber-500/10 text-amber-700" />
        <StatCard label="Đang làm" value={stats.dangLam} color="bg-sky-500/10 text-sky-700" />
        <StatCard label="Hoàn thành" value={stats.hoanThanh} color="bg-emerald-500/10 text-emerald-700" />
        <StatCard label="Lỗi/Thiếu" value={stats.loi} color="bg-red-500/10 text-red-700" />
      </div>

      {/* Người phụ trách (sidebar) */}
      {activeKhau !== "cat" && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand-500" /> Người phụ trách khâu {KHAU_LABELS[activeKhau]}
          </h3>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-2">
            {activeMeta.nguoi.map((n: any) => (
              <div key={n.ma} className="card p-2 flex items-center gap-2">
                <Avatar name={n.ten} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{n.ten}</div>
                  <div className="text-[10px] opacity-60 truncate">{n.ma} {n.chuyenMon ? `· ${n.chuyenMon}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input className="input pl-9" placeholder="Tìm mã phiếu, mã SP, người nhận..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[180px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          {Object.keys(TRANG_THAI_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Phiếu list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-12 text-center opacity-60 text-sm">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Chưa có phiếu nào ở khâu {KHAU_LABELS[activeKhau]}.
          </div>
        ) : (
          filtered.map((p) => <PhieuCard key={p.id} phieu={p} onUpdate={updatePhieu} />)
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: any) {
  return (
    <div className={`card p-3 ${color}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function PhieuCard({ phieu, onUpdate }: { phieu: PhieuWorkflow; onUpdate: (p: PhieuWorkflow) => void }) {
  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {phieu.id.split("_")[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold">{phieu.id}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700">{phieu.maSP}</span>
              {phieu.phanLoai && <span className="text-[10px] opacity-70">{phieu.phanLoai}</span>}
              {phieu.mau && <span className="text-[10px] opacity-70">· {phieu.mau}</span>}
              {phieu.size && <span className="text-[10px] opacity-70">· {phieu.size}</span>}
            </div>
            <div className="text-xs opacity-60 mt-0.5">
              LSX: {phieu.lenhSX} · Hạn: {phieu.hanHoanThanh}
            </div>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="text-[10px] opacity-60">Người nhận</div>
          <div className="font-semibold flex items-center gap-1.5 mt-0.5">
            <Avatar name={phieu.tenNguoiNhan} size="sm" />
            <span>{phieu.tenNguoiNhan}</span>
          </div>
        </div>
      </div>

      {/* 5 số lượng */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <SLBox label="Giao" value={phieu.soLuongGiao} color="bg-sky-500/10" text="text-sky-700" />
        <SLBox label="Nhận" value={phieu.soLuongNhan} color="bg-violet-500/10" text="text-violet-700" />
        <SLBox label="Đạt" value={phieu.soLuongDat} color="bg-emerald-500/10" text="text-emerald-700" />
        <SLBox label="Lỗi" value={phieu.soLuongLoi} color="bg-red-500/10" text="text-red-700" />
        <SLBox label="Thiếu" value={phieu.soLuongThieu} color="bg-orange-500/10" text="text-orange-700" />
        {phieu.soLuongSua > 0 && <SLBox label="Sửa" value={phieu.soLuongSua} color="bg-amber-500/10" text="text-amber-700" />}
      </div>

      {/* Tài chính */}
      <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800 text-xs">
        <div>
          <span className="opacity-60">Đơn giá:</span> <b>{phieu.donGia.toLocaleString("vi-VN")}đ</b> ×
          <b className="text-emerald-700"> {phieu.soLuongDat}</b> đạt =
          <b className="text-emerald-700 ml-1">{phieu.thanhTien.toLocaleString("vi-VN")}đ</b>
        </div>
        <div>
          <span className="opacity-60">Còn nợ:</span> <b className={phieu.conNo > 0 ? "text-red-600" : "text-emerald-600"}>{phieu.conNo.toLocaleString("vi-VN")}đ</b>
        </div>
      </div>

      {/* Workflow actions */}
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="text-[10px] opacity-60">
          {phieu.mauDaDuyet ? <span className="text-emerald-600">✓ Mẫu đã duyệt</span> : <span className="text-amber-600">⚠ Chưa có mẫu</span>}
          {phieu.nguoiXacNhan && <span> · Xác nhận: {phieu.nguoiXacNhan}</span>}
        </div>
        <WorkflowActions phieu={phieu} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

function SLBox({ label, value, color, text }: any) {
  return (
    <div className={`p-2 rounded ${color}`}>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className={`text-base font-bold ${text}`}>{value}</div>
    </div>
  );
}
