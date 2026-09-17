// ============ UI BLOCKS (Stat, Card, Row, KPICard, F, Modal) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.4)

import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Stat({ n, label, sub, color, icon: Icon }: { n: any; label: string; sub?: string; color: string; icon: any }) {
  const colors: Record<string, string> = {
    blue: "text-[#307082]",
    violet: "text-violet-700",
    rose: "text-rose-700",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    petrol: "text-[#307082]",
    sage: "text-[#6CA3A2]",
    cream: "text-[#307082]",
    orange: "text-[#EA990C]",
  };
  return (
    <div className="card p-3 bg-white border border-[#E5E0D8] rounded-xl shadow-sm flex flex-col justify-between min-h-[90px]">
      <div className="flex items-center justify-between text-gray-500">
        <Icon className="w-4 h-4" />
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <div className={`mt-2 ${colors[color]}`}>
        <div className="text-3xl font-black leading-none">{n}</div>
        <div className="mt-1 text-[10px] font-medium opacity-80">{sub}</div>
      </div>
    </div>
  );
}

// ============ CARD - colored value box ============
export function Card({ label, v, c, sub }: { label: string; v: number; c: string; sub?: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700",
    violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-700",
    rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-700",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-700",
  };
  return (
    <div className={`p-2 rounded ${colors[c]}`}>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="text-base font-bold">{(v / 1_000_000).toFixed(1)}tr</div>
      {sub && <div className="text-[9px] opacity-60 truncate">{sub}</div>}
    </div>
  );
}

// ============ ROW - label + value + sub ============
export function Row({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/50">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <strong>{value}</strong>
        <span className="text-[10px] opacity-60">{sub}</span>
      </span>
    </div>
  );
}

// ============ KPICARD - report card ============
export function KPICard({ label, value, color, icon: Icon }: { label: string; value: any; color: string; icon: any }) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-700",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-700",
    amber: "from-amber-500/10 to-yellow-500/10 text-amber-700",
    rose: "from-rose-500/10 to-red-500/10 text-rose-700",
  };
  return (
    <div className={`card p-2 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <Icon className="w-4 h-4 opacity-60" />
        <span className="text-[10px] opacity-70">{label}</span>
      </div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}

// ============ F - form field input ============
export function F({ label, v, on, type = "text" }: { label: string; v: any; on: (v: any) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] font-semibold opacity-70">{label}</label>
      <input
        type={type}
        value={v ?? ""}
        onChange={(e: any) => on(type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value)}
        className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm"
      />
    </div>
  );
}

// ============ MODAL - bottom sheet ============
export function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 shadow-2xl">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-1"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
