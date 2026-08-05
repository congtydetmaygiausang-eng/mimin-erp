// ============ UI BLOCKS (WorkspaceHeader, Stat, TimelineRow, LinkToMeSoi, F) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.6)

import { Plus, GitBranch, CheckCircle2, AlertCircle } from "lucide-react";

export function WorkspaceHeader({ title, subtitle, color, action }: any) {
  return (
    <div className={`card p-3 bg-gradient-to-r from-${color}-500/10 to-${color}-500/5`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">{title}</h2>
          <p className="text-xs opacity-70">{subtitle}</p>
        </div>
        {action && (
          <button onClick={action.onClick} className={`btn-primary bg-${color}-500 hover:bg-${color}-600 text-sm`}>
            <Plus className="w-3.5 h-3.5 inline" /> {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function Stat({ label, value, sub, color }: any) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-700",
    violet: "from-violet-500/10 to-purple-500/10 text-violet-700",
    rose: "from-rose-500/10 to-pink-500/10 text-rose-700",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-700",
    amber: "from-amber-500/10 to-yellow-500/10 text-amber-700",
    cyan: "from-cyan-500/10 to-blue-500/10 text-cyan-700",
    slate: "from-slate-500/10 to-gray-500/10 text-slate-700",
  };
  return (
    <div className={`card p-3 bg-gradient-to-br ${colors[color]}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-[10px] opacity-60">{sub}</div>}
    </div>
  );
}

export function TimelineRow({ label, value, status }: { label: string; value: string; status: "ok" | "warn" | "fail" }) {
  return (
    <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
      <span>{label}</span>
      <span className="flex items-center gap-1">
        <strong>{value}</strong>
        {status === "ok" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
        {status === "warn" && <AlertCircle className="w-3 h-3 text-amber-500" />}
        {status === "fail" && <AlertCircle className="w-3 h-3 text-rose-500" />}
      </span>
    </div>
  );
}

export function LinkToMeSoi({ maLo, small = false }: { maLo: string; small?: boolean }) {
  return (
    <div className={`text-[10px] opacity-60 mt-1 flex items-center gap-1 ${small ? "" : "text-xs"}`}>
      <GitBranch className="w-3 h-3" /> Mẻ sợi: <span className="font-mono font-semibold">{maLo}</span>
    </div>
  );
}

export function F({ label, v, on, type = "text" }: { label: string; v: any; on: (v: any) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] font-semibold opacity-70">{label}</label>
      <input
        type={type}
        value={v ?? ""}
        onChange={(e) => on(type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value)}
        className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm"
      />
    </div>
  );
}
