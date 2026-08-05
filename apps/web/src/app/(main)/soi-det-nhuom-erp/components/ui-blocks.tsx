// ============ UI BLOCKS - Stat, Field, FormulaBlock ============
// Tach tu page.tsx (2026-08-05 - toi uu B.1)
// Cac component dung chung cho 14 screen con

import { ReactNode } from "react";

// ============ STAT - KPI card ============
export function Stat({ icon, label, value, sub, color }: { icon: ReactNode; label: string; value: any; sub?: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-600",
    violet: "from-violet-500/10 to-purple-500/10 text-violet-600",
    rose: "from-rose-500/10 to-pink-500/10 text-rose-600",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-600",
    amber: "from-amber-500/10 to-yellow-500/10 text-amber-600",
  };
  return (
    <div className={`card p-3 bg-gradient-to-br ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-1.5 opacity-80 text-xs">{icon}<span>{label}</span></div>
      <div className="text-lg font-bold mt-1">{value}</div>
      {sub && <div className="text-[10px] opacity-70">{sub}</div>}
    </div>
  );
}

// ============ FIELD - Input wrapper ============
export function Field({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (v: any) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold opacity-70">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
      />
    </div>
  );
}

// ============ FORMULA BLOCK - Computed value display ============
export function FormulaBlock({ label, formula, value, color }: { label: string; formula: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700",
    rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-700",
  };
  return (
    <div className={`p-2 rounded ${colors[color] || colors.blue}`}>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="text-[10px] opacity-60 mb-1">{formula}</div>
      <div className="text-base font-bold">{value}</div>
    </div>
  );
}
