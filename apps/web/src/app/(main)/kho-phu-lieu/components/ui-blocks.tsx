// ============ STAT HELPER ============
// Tach tu page.tsx (2026-08-05 - toi uu B.8)

import { ReactNode } from "react";

export function Stat({ icon, label, value, subValue, color }: { icon: ReactNode; label: string; value: any; subValue?: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-600 dark:text-emerald-400",
    rose: "from-rose-500/10 to-red-500/10 text-rose-600 dark:text-rose-400",
    violet: "from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400",
  };
  return (
    <div className={`card p-3 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-center gap-1.5 opacity-80 text-xs">{icon}<span>{label}</span></div>
      <div className="text-xl font-bold mt-1">{value}</div>
      {subValue && <div className="text-xs opacity-70 mt-1">{subValue}</div>}
    </div>
  );
}
