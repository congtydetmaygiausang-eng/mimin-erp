// ============ HEADER + KPI CARDS ============
// Tach tu page.tsx (2026-08-05 - toi uu B.3)

import { Users, Briefcase, Shield, Wallet, Plus, Lock } from "lucide-react";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { usePermission } from "@/components/PermissionGuard";
import type { NhanSuExt } from "../data";

export function HeaderBanner({ tongNV, tongLuongCung, onAdd }: { tongNV: number; tongLuongCung: number; onAdd: () => void }) {
  const perm = usePermission();
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 35%, #0891b2 75%, #06b6d4 100%)" }}>
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #5eead4 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #67e8f9 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-white drop-shadow">
            <Users className="w-7 h-7 text-white/90" />
            Nhân sự
          </h1>
          <p className="text-white/80 mt-1 text-sm font-medium">
            {tongNV} nhân viên · Tổng quỹ lương cứng <b className="text-white">{formatVNDShort(tongLuongCung)}/tháng</b>
          </p>
        </div>
        {perm.canCreate("nhan-su") ? (
          <button onClick={onAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition shadow-lg">
            <Plus className="w-4 h-4" /> Thêm NV
          </button>
        ) : (
          <div className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/70 flex items-center gap-1 border border-white/20" title="Bạn không có quyền thêm nhân viên">
            <Lock className="w-3.5 h-3.5" /> Chỉ Admin
          </div>
        )}
      </div>
    </div>
  );
}

export function KpiCards({ kpis }: { kpis: { tongNV: number; dsBP: string[]; dsSanXuat: number; dsQC: number; dsKho: number; tongLuongCung: number } }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="card p-5">
        <div className="text-xs opacity-70 flex items-center gap-1"><Users className="w-3 h-3" /> Tổng nhân viên</div>
        <div className="text-2xl md:text-3xl font-bold mt-1">{kpis.tongNV}</div>
        <div className="text-xs opacity-60 mt-1">{kpis.dsBP.length} bộ phận</div>
      </div>
      <div className="card p-5">
        <div className="text-xs opacity-70 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Sản xuất</div>
        <div className="text-2xl md:text-3xl font-bold mt-1 text-sky-600">{kpis.dsSanXuat}</div>
        <div className="text-xs opacity-60 mt-1">công nhân</div>
      </div>
      <div className="card p-5">
        <div className="text-xs opacity-70 flex items-center gap-1"><Shield className="w-3 h-3" /> QC + Kho</div>
        <div className="text-2xl md:text-3xl font-bold mt-1 text-violet-600">{kpis.dsQC + kpis.dsKho}</div>
        <div className="text-xs opacity-60 mt-1">kiểm soát</div>
      </div>
      <div className="card p-5">
        <div className="text-xs opacity-70 flex items-center gap-1"><Wallet className="w-3 h-3" /> Quỹ lương</div>
        <div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{formatVNDShort(kpis.tongLuongCung)}</div>
        <div className="text-xs opacity-60 mt-1">{formatVND(kpis.tongLuongCung)}/tháng</div>
      </div>
    </div>
  );
}
