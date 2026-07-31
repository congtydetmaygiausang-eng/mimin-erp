"use client";

import { ReactNode } from "react";
import { Inbox } from "lucide-react";

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "compact";
};

/**
 * Empty state - hiển thị khi không có dữ liệu
 * Dùng design system: card glassmorphism, sky/teal, animate-fade-in
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
}: EmptyStateProps) {
  if (variant === "compact") {
    return (
      <div className="text-center py-4 text-sm opacity-60 animate-fade-in">
        {icon || <Inbox className="w-4 h-4 inline-block mr-1 opacity-50" />}
        <span>{title}</span>
      </div>
    );
  }
  return (
    <div className="card p-8 md:p-12 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-full bg-slate-500/10 flex items-center justify-center mx-auto mb-3">
        {icon || <Inbox className="w-7 h-7 text-slate-500 opacity-60" />}
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm opacity-60 max-w-sm mx-auto mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
