"use client";

import { DATA_SCOPE_LABELS, type DataScope } from "@/lib/vai-tro-chuan";
import { Eye, Users, Building2, Factory, Globe, Briefcase } from "lucide-react";

export type ScopeBadgeProps = {
  scope: DataScope | string | undefined | null;
  size?: "xs" | "sm" | "md";
  showIcon?: boolean;
  className?: string;
};

const SCOPE_COLORS: Record<string, string> = {
  SELF: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  ASSIGNED: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  TEAM: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  DEPARTMENT: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  PRODUCTION: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  COMPANY: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  PARTNER: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

const SCOPE_ICONS: Record<string, typeof Eye> = {
  SELF: Eye,
  ASSIGNED: Users,
  TEAM: Users,
  DEPARTMENT: Building2,
  PRODUCTION: Factory,
  COMPANY: Globe,
  PARTNER: Briefcase,
};

export function ScopeBadge({ scope, size = "xs", showIcon = true, className = "" }: ScopeBadgeProps) {
  if (!scope) return null;
  const label = (DATA_SCOPE_LABELS as Record<string, string>)[scope] || scope;
  const colorClass = SCOPE_COLORS[scope] || "bg-slate-500/15 text-slate-700";
  const Icon = SCOPE_ICONS[scope] || Eye;
  const sizeClass = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  }[size];
  const iconSize = size === "md" ? "w-3.5 h-3.5" : "w-3 h-3";
  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClass} rounded-full font-medium ${colorClass} ${className}`}
      title={`Phạm vi dữ liệu: ${label}`}
    >
      {showIcon && <Icon className={iconSize} />}
      {label}
    </span>
  );
}
