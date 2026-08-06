// CardListItem - 1 row trong list, pattern lấy từ Bảng Lương
// Mỗi item = card trắng với avatar + tên + info chính + meta phụ + nút hành động

import { ReactNode } from "react";

export interface CardListItemProps {
  /** ID duy nhất (cho key) */
  id: string;
  /** Tên / tiêu đề chính */
  title: string;
  /** Subtitle (phụ) hiển thị dưới title */
  subtitle?: ReactNode;
  /** Avatar hoặc icon (optional) */
  avatar?: ReactNode;
  /** Badge label (optional) - hiển thị chip nhỏ cạnh title */
  badge?: { label: string; color?: "teal" | "amber" | "rose" | "sky" | "violet" | "emerald" | "slate" };
  /** Cột chính giữa (thường là số tiền) - lớn, đậm, màu teal */
  centerValue?: { value: string; sublabel?: string; color?: "teal" | "emerald" | "amber" | "rose" };
  /** Meta phụ (ngày tháng, số lượng, ...) */
  meta?: ReactNode;
  /** Nút hành động bên phải */
  actions?: ReactNode;
  /** Click handler cho toàn card */
  onClick?: () => void;
  /** Highlight (mới thêm, đang xử lý, ...) */
  highlight?: "new" | "hot" | "warning";
}

const BADGE_COLORS = {
  teal: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/20",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20",
  rose: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20",
  sky: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20",
  emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  slate: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/20",
};

const VALUE_COLORS = {
  teal: "text-teal-700 dark:text-teal-300",
  emerald: "text-emerald-700 dark:text-emerald-300",
  amber: "text-amber-700 dark:text-amber-300",
  rose: "text-rose-700 dark:text-rose-300",
};

export default function CardListItem({
  id,
  title,
  subtitle,
  avatar,
  badge,
  centerValue,
  meta,
  actions,
  onClick,
  highlight,
}: CardListItemProps) {
  return (
    <div
      key={id}
      onClick={onClick}
      className={[
        "group relative flex flex-wrap items-center gap-3 p-4 rounded-xl",
        "bg-white dark:bg-slate-800/60",
        "border border-slate-200/70 dark:border-slate-700/60",
        "shadow-sm hover:shadow-md",
        "transition-all duration-200",
        onClick ? "cursor-pointer hover:border-teal-400/60 hover:-translate-y-0.5" : "",
      ].join(" ")}
    >
      {/* Highlight ribbon */}
      {highlight && (
        <span
          className={[
            "absolute top-0 left-0 bottom-0 w-1 rounded-l-xl",
            highlight === "new" && "bg-teal-500",
            highlight === "hot" && "bg-rose-500",
            highlight === "warning" && "bg-amber-500",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      )}

      {/* Avatar / Icon */}
      {avatar && (
        <div className="shrink-0 w-11 h-11 rounded-lg bg-gradient-to-br from-teal-500/15 to-cyan-500/15 border border-teal-500/20 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-sm">
          {avatar}
        </div>
      )}

      {/* Title + subtitle + badge */}
      <div className="flex-1 min-w-[180px]">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm md:text-base text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          {badge && (
            <span
              className={[
                "px-2 py-0.5 text-[10px] font-semibold rounded-full border",
                BADGE_COLORS[badge.color || "teal"],
              ].join(" ")}
            >
              {badge.label}
            </span>
          )}
        </div>
        {subtitle && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</div>
        )}
        {meta && !centerValue && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{meta}</div>
        )}
      </div>

      {/* Center value (e.g. số tiền) */}
      {centerValue && (
        <div className="text-right min-w-[100px]">
          <div
            className={[
              "text-base md:text-lg font-bold",
              VALUE_COLORS[centerValue.color || "teal"],
            ].join(" ")}
          >
            {centerValue.value}
          </div>
          {centerValue.sublabel && (
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {centerValue.sublabel}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-1.5 shrink-0">{actions}</div>
      )}
    </div>
  );
}
