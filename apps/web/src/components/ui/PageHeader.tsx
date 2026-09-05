"use client";

import React, { ReactNode } from "react";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  /** Tiêu đề chính của màn hình */
  title: ReactNode;
  /** Mô tả ngắn gọn chức năng của trang */
  subtitle?: ReactNode;
  /** Primary Action & Secondary Actions phía bên phải */
  actions?: ReactNode;
  /** Đường dẫn Breadcrumb */
  breadcrumbs?: Crumb[];
  /** Huy hiệu hoặc tag danh mục đi kèm tiêu đề */
  badge?: ReactNode;
  /** Icon tiêu đề */
  icon?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
  badge,
  icon,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-6 space-y-2 ${className}`}>
      {/* 1. BREADCRUMBS */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <Home className="w-3.5 h-3.5 text-slate-400" />
          {breadcrumbs.map((c, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-slate-400 opacity-60" />
                {c.href && !isLast ? (
                  <a href={c.href} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                    {c.label}
                  </a>
                ) : (
                  <span className={isLast ? "font-semibold text-slate-800 dark:text-slate-200" : ""}>
                    {c.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      )}

      {/* 2. TITLE & ACTION ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300 shadow-xs shrink-0">
                {icon}
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* 3. PRIMARY & SECONDARY ACTIONS */}
        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0 sm:self-start pt-1 sm:pt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
