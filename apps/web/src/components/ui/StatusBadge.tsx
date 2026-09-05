"use client";

import React from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle, Info, MinusCircle } from "lucide-react";

export type StatusType = 
  | "success"   // Còn hàng, Hoàn thành, Đã thanh toán, Đã duyệt
  | "warning"   // Sắp hết, Chờ xử lý, Đang chờ, Chờ duyệt
  | "danger"    // Hết hàng, Lỗi, Hủy, Quá hạn
  | "info"      // Đang sản xuất, Đang giao, Đang cắt, Đang may
  | "neutral";  // Nháp, Ngừng kinh doanh, Lưu kho, Mặc định

export interface StatusBadgeProps {
  label: string;
  status?: StatusType;
  /** Tự động suy luận status dựa trên chuỗi tiếng Việt nếu không truyền status */
  autoInfer?: boolean;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const STATUS_CONFIGS: Record<StatusType, { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/60",
    icon: CheckCircle2,
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/60",
    icon: Clock,
  },
  danger: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800/60",
    icon: XCircle,
  },
  info: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-800/60",
    icon: Info,
  },
  neutral: {
    bg: "bg-slate-100 dark:bg-slate-800/60",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    icon: MinusCircle,
  },
};

/** Tự động suy luận loại status theo các cụm từ nghiệp vụ may mặc phổ biến */
function inferStatus(label: string): StatusType {
  const l = (label || "").toLowerCase().trim();
  
  if (l.includes("hoàn thành") || l.includes("còn hàng") || l.includes("đã thanh toán") || l.includes("đã duyệt") || l.includes("đạt") || l.includes("đã giao")) {
    return "success";
  }
  if (l.includes("chờ") || l.includes("sắp hết") || l.includes("tạm dừng") || l.includes("cần lưu ý") || l.includes("chậm")) {
    return "warning";
  }
  if (l.includes("hết") || l.includes("hủy") || l.includes("lỗi") || l.includes("quá hạn") || l.includes("ngừng") || l.includes("không đạt")) {
    return "danger";
  }
  if (l.includes("đang") || l.includes("mới") || l.includes("tiến độ") || l.includes("xuất kho") || l.includes("nhập kho")) {
    return "info";
  }
  return "neutral";
}

export function StatusBadge({
  label,
  status,
  autoInfer = true,
  size = "md",
  showIcon = true,
  className = "",
}: StatusBadgeProps) {
  const resolvedStatus = status || (autoInfer ? inferStatus(label) : "neutral");
  const config = STATUS_CONFIGS[resolvedStatus];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  }[size];

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border shadow-xs tracking-tight ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      {showIcon && <Icon className={`${iconSizes} shrink-0`} />}
      <span>{label}</span>
    </span>
  );
}

export default StatusBadge;
