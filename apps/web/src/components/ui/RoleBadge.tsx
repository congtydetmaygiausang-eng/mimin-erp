"use client";

import { VAI_TRO_LABELS, VAI_TRO_COLORS, type VaiTroChuan } from "@/lib/vai-tro-chuan";

export type RoleBadgeProps = {
  role: string | undefined | null;
  size?: "xs" | "sm" | "md";
  showIcon?: boolean;
  className?: string;
};

/**
 * Badge hiển thị vai trò chuẩn (19 vai trò từ vai-tro-chuan.ts)
 * Dùng gradient color theo từng nhóm (quản lý, công nhân, đối tác...)
 */
export function RoleBadge({ role, size = "sm", showIcon = false, className = "" }: RoleBadgeProps) {
  if (!role) return null;
  // Map role cũ (admin/planner/sewing/qc/finishing/accountant/warehouse) → label tương ứng
  const legacyLabels: Record<string, string> = {
    admin: "Quản trị viên",
    planner: "Chuyên viên kế hoạch",
    warehouse: "Quản lý kho",
    sewing: "Tổ trưởng may",
    qc: "Kiểm tra chất lượng",
    finishing: "Tổ trưởng hoàn thiện",
    accountant: "Kế toán",
  };
  const legacyColors: Record<string, string> = {
    admin: "from-rose-500 to-pink-500",
    planner: "from-violet-500 to-purple-500",
    warehouse: "from-amber-500 to-orange-500",
    sewing: "from-sky-500 to-cyan-500",
    qc: "from-emerald-500 to-green-500",
    finishing: "from-fuchsia-500 to-pink-500",
    accountant: "from-blue-500 to-indigo-500",
  };

  const isVaiTroChuan = role in VAI_TRO_LABELS;
  const label = isVaiTroChuan ? VAI_TRO_LABELS[role as VaiTroChuan] : legacyLabels[role] || role;
  const colorClass = isVaiTroChuan ? VAI_TRO_COLORS[role as VaiTroChuan] : legacyColors[role] || "from-slate-500 to-slate-600";

  const sizeClass = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClass} rounded-full font-medium text-white bg-gradient-to-r ${colorClass} shadow-sm ${className}`}
    >
      {showIcon && <span>👤</span>}
      {label}
    </span>
  );
}
