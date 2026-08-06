// FilterBar - bar filter chuẩn: chip + dropdowns + search
// Pattern lấy từ Bảng Lương Tự Động

import { ReactNode } from "react";
import { Search, X, Filter } from "lucide-react";

export interface FilterBarProps {
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  chips?: { label: string; active?: boolean; onClick?: () => void; icon?: ReactNode }[];
  selects?: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    icon?: ReactNode;
    width?: string;
  }[];
  extra?: ReactNode;
  onReset?: () => void;
}

export default function FilterBar({
  search,
  chips,
  selects,
  extra,
  onReset,
}: FilterBarProps) {
  return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-3 md:p-4 mb-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {/* Search */}
        {search && (
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder || "Tìm kiếm..."}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
            />
            {search.value && (
              <button
                onClick={() => search.onChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        )}

        {/* Chips (filter buttons) */}
        {chips && chips.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {chips.map((c, i) => (
              <button
                key={i}
                onClick={c.onClick}
                className={[
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5",
                  c.active
                    ? "bg-teal-500 text-white shadow-sm shadow-teal-500/30"
                    : "bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
                ].join(" ")}
              >
                {c.icon}
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Selects (dropdowns) */}
        {selects && selects.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {selects.map((s, i) => (
              <div key={i} className="relative">
                <select
                  value={s.value}
                  onChange={(e) => s.onChange(e.target.value)}
                  className={[
                    "appearance-none pl-3 pr-8 py-2 text-xs font-semibold rounded-lg",
                    "bg-slate-50 dark:bg-slate-900/50",
                    "border border-slate-200 dark:border-slate-700",
                    "text-slate-700 dark:text-slate-300",
                    "hover:bg-slate-100 dark:hover:bg-slate-800/80",
                    "focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition",
                    s.width || "min-w-[120px]",
                  ].join(" ")}
                  style={{
                    backgroundImage:
                      'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>\')',
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.5rem center",
                    backgroundSize: "1rem",
                  }}
                >
                  {s.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {s.icon && (
                  <span className="absolute right-7 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    {s.icon}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Extra actions */}
        {extra}

        {/* Reset button */}
        {onReset && (
          <button
            onClick={onReset}
            className="ml-auto px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition flex items-center gap-1"
          >
            <Filter className="w-3 h-3" />
            Xóa lọc
          </button>
        )}
      </div>
    </div>
  );
}
