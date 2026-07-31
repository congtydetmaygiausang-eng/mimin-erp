"use client";

import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export type MobileCardField = {
  label: string;
  value: ReactNode;
  /** Highlight - dùng cho giá trị quan trọng (SL, tiền) */
  highlight?: boolean;
  /** Full width - chiếm cả dòng */
  fullWidth?: boolean;
};

export type MobileCardProps = {
  /** Tiêu đề card (thường là mã định danh: Mã LSX, Mã NV...) */
  title: string;
  /** Subtitle (tên sản phẩm, tên người...) */
  subtitle?: ReactNode;
  /** Badge ở góc phải (status: Hoàn thành, Đang làm...) */
  badge?: ReactNode;
  /** Danh sách field hiển thị */
  fields: MobileCardField[];
  /** Nhóm nút thao tác ở dưới */
  actions?: ReactNode;
  /** Click handler - nếu có thì card có hover + cursor pointer */
  onClick?: () => void;
};

/**
 * Mobile Card View - thay thế bảng dài trên mobile
 * Design: glassmorphism, rounded-xl, padding mobile-friendly
 */
export function MobileCard({ title, subtitle, badge, fields, actions, onClick }: MobileCardProps) {
  return (
    <div
      onClick={onClick}
      className={`card p-4 ${onClick ? "cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 transition" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-brand-600 dark:text-brand-400 font-mono font-semibold truncate">
            {title}
          </div>
          {subtitle && (
            <div className="font-semibold text-sm mt-0.5 line-clamp-2">
              {subtitle}
            </div>
          )}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
        {onClick && !badge && (
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
        )}
      </div>

      {/* Fields */}
      {fields.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs mb-3">
          {fields.map((f, i) => (
            <div key={i} className={f.fullWidth ? "col-span-2" : ""}>
              <div className="opacity-60 text-[10px] uppercase tracking-wide mb-0.5">
                {f.label}
              </div>
              <div className={`${f.highlight ? "text-brand-600 font-semibold" : ""}`}>
                {f.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="flex flex-wrap gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * Helper render danh sách card với grid responsive
 * Mobile: 1 cột, Tablet: 2 cột, Desktop: 3 cột
 */
export function MobileCardList({
  items,
  renderItem,
  emptyState,
  className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3",
}: {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  emptyState?: ReactNode;
  className?: string;
}) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }
  return <div className={className}>{items.map(renderItem)}</div>;
}
