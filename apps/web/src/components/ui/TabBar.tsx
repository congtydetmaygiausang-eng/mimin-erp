// TabBar - tabs chuẩn pattern Bảng Lương
// Style: 3 tabs "Tổng hợp / Chi tiết / Thanh toán"

import { ReactNode } from "react";

export interface Tab {
  key: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div className="inline-flex p-1 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm mb-4">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={[
              "px-4 md:px-5 py-2 text-xs md:text-sm font-semibold rounded-lg transition flex items-center gap-1.5",
              isActive
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-sm shadow-teal-500/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60",
            ].join(" ")}
          >
            {t.icon}
            {t.label}
            {typeof t.count === "number" && (
              <span
                className={[
                  "ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-bold",
                  isActive ? "bg-white/25" : "bg-slate-200 dark:bg-slate-700",
                ].join(" ")}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
