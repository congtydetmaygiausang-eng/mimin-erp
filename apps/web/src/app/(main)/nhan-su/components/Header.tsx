// ============ HEADER BANNER & STATS PANEL NHÂN SỰ ============
// Chuẩn phong cách Banner Thẻ Card Gradient Teal / Cyan như Kho Thành Phẩm
"use client";

import {
  Users,
  Briefcase,
  ShieldCheck,
  Wallet,
  Plus,
  Lock,
  Download,
  Sparkles,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { usePermission } from "@/components/PermissionGuard";

export interface HeaderBannerProps {
  tongNV: number;
  tongLuongCung: number;
  kpis: {
    tongNV: number;
    dsBP: string[];
    dsSanXuat: number;
    dsQC: number;
    dsKho: number;
    tongLuongCung: number;
    dangLamCount?: number;
    nghiViecCount?: number;
  };
  onAdd: () => void;
  onExportCSV?: () => void;
}

export function HeaderBanner({
  tongNV,
  tongLuongCung,
  kpis,
  onAdd,
  onExportCSV,
}: HeaderBannerProps) {
  const perm = usePermission();

  return (
    <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-800 rounded-3xl p-5 md:p-6 text-white shadow-lg border border-teal-600/30 relative overflow-hidden mb-5">
      {/* Glow décor background nhẹ nhàng sang trọng */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />

      {/* Top row: Title + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-teal-600/30 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md border border-white/25 shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-900/50 text-teal-200 border border-teal-500/30">
                Quản Trị Nhân Sự
              </span>
              <span className="text-xs text-teal-100/90 font-medium">· Đội ngũ & Lao động may mặc</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">
              Hồ Sơ Nhân Sự & Quản Lý Lao Động
            </h1>
            <p className="text-xs text-teal-100/80 mt-0.5 hidden sm:block">
              Quản lý {tongNV} nhân sự xưởng may · Phân bổ các tổ Sản xuất, QC, Kho vận & Văn phòng · Tổng quỹ lương {formatVNDShort(tongLuongCung)}/tháng
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer backdrop-blur-sm"
              title="Xuất file Excel CSV danh sách nhân sự"
            >
              <Download className="w-3.5 h-3.5 text-teal-200" />
              <span>Xuất CSV</span>
            </button>
          )}

          {perm.canCreate("nhan-su") ? (
            <button
              type="button"
              onClick={onAdd}
              className="px-4 py-2 bg-white hover:bg-teal-50 text-teal-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-lg cursor-pointer"
              title="Thêm nhân viên mới vào hệ thống"
            >
              <Plus className="w-4 h-4 text-teal-700 stroke-[3]" />
              <span>Thêm nhân viên</span>
            </button>
          ) : (
            <div
              className="text-xs px-3 py-1.5 rounded-xl bg-white/10 text-white/70 flex items-center gap-1.5 border border-white/20"
              title="Bạn không có quyền thêm nhân viên"
            >
              <Lock className="w-3.5 h-3.5 text-teal-200" /> Chỉ Admin
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: 4 Thẻ KPI Thống Kê Tổng Quan (Chuẩn thẻ mờ kính Glassmorphism như Kho Thành Phẩm) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5 relative z-10">
        {/* KPI 1: Tổng nhân sự */}
        <div className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-teal-200 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-200" /> Tổng nhân sự
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/15 text-white border border-white/20">
              Đội ngũ
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2 tabular-nums">
            {kpis.tongNV}{" "}
            <span className="text-xs font-medium text-teal-200/90">nhân sự</span>
          </div>
          <div className="text-xs text-teal-100/75 mt-1 font-medium">
            {kpis.dangLamCount ?? kpis.tongNV} đang làm · {kpis.nghiViecCount ?? 0} đã nghỉ
          </div>
        </div>

        {/* KPI 2: Tổ sản xuất */}
        <div className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-teal-200 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-teal-200" /> Tổ sản xuất
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/15 text-white border border-white/20">
              Xưởng may
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2 tabular-nums">
            {kpis.dsSanXuat}{" "}
            <span className="text-xs font-medium text-teal-200/90">công nhân</span>
          </div>
          <div className="text-xs text-teal-100/75 mt-1 font-medium">
            Tổ Cắt, May, Khuy nút, Ủi & Đóng gói
          </div>
        </div>

        {/* KPI 3: QC + Kho vận */}
        <div className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-teal-200 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-200" /> QC & Kho vận
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/15 text-white border border-white/20">
              Kiểm soát
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2 tabular-nums">
            {kpis.dsQC + kpis.dsKho}{" "}
            <span className="text-xs font-medium text-teal-200/90">nhân sự</span>
          </div>
          <div className="text-xs text-teal-100/75 mt-1 font-medium">
            Kiểm tra KCS & Quản lý kho vật tư
          </div>
        </div>

        {/* KPI 4: Quỹ lương hàng tháng */}
        <div className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all shadow-sm">
          <div className="flex items-center justify-between text-teal-200 text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-teal-200" /> Quỹ lương cứng
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/15 text-white border border-white/20">
              Hàng tháng
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2 tabular-nums">
            {formatVNDShort(kpis.tongLuongCung)}{" "}
            <span className="text-xs font-medium text-teal-200/90">/tháng</span>
          </div>
          <div className="text-xs text-teal-100/75 mt-1 font-medium">
            {formatVND(kpis.tongLuongCung)}/tháng
          </div>
        </div>
      </div>
    </div>
  );
}

// Giữ lại KpiCards để tương thích ngược nếu có chỗ gọi (không làm vỡ code)
export function KpiCards({
  kpis,
}: {
  kpis: {
    tongNV: number;
    dsBP: string[];
    dsSanXuat: number;
    dsQC: number;
    dsKho: number;
    tongLuongCung: number;
    dangLamCount?: number;
    nghiViecCount?: number;
  };
}) {
  return null;
}
