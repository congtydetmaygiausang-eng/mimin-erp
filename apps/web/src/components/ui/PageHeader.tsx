// PageHeader - header gradient teal-cyan với title + subtitle + action buttons
// Pattern lấy từ Bảng Lương Tự Động (ảnh tham chiếu sếp Sang)
// Màu: primary teal #109090, gradient teal-600 → cyan-600

import { ReactNode } from "react";
import { ChevronRight, Home } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  /** Tiêu đề chính - lớn, bold, trắng */
  title: ReactNode;
  /** Phụ đề nhỏ phía dưới title */
  subtitle?: ReactNode;
  /** Nhóm action buttons bên phải (VD: Xuất CSV, Thêm mới) */
  actions?: ReactNode;
  /** Breadcrumb (optional) */
  breadcrumbs?: Crumb[];
  /** Module label phía trên title (VD: "MIMIN ERP - Bảng lương") */
  moduleLabel?: string;
  /** Icon nhỏ trước title */
  icon?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
  moduleLabel,
  icon,
}: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl mb-6 shadow-lg">
      {/* Background gradient teal → cyan */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #0d9488 0%, #14b8a6 35%, #0891b2 75%, #06b6d4 100%)",
        }}
      />
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)",
        }}
      />
      {/* Content */}
      <div className="relative z-10 p-6 md:p-8 text-white">
        {/* Breadcrumb */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-white/80 mb-3">
            <Home className="w-3.5 h-3.5" />
            {breadcrumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 opacity-60" />
                <span className={i === breadcrumbs.length - 1 ? "font-semibold text-white" : ""}>
                  {c.label}
                </span>
              </span>
            ))}
          </nav>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {moduleLabel && (
              <div className="text-xs font-medium text-white/80 mb-1.5 flex items-center gap-1.5">
                {icon}
                {moduleLabel}
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-2.5 leading-tight">
              {icon && !moduleLabel && (
                <span className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                  {icon}
                </span>
              )}
              <span className="break-words">{title}</span>
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-white/90 max-w-2xl">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>
          )}
        </div>
      </div>
    </div>
  );
}
