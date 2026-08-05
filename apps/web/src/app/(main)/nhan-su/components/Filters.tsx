// ============ FILTERS (BP + SEARCH) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.3)

import { Search } from "lucide-react";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import type { NhanSuExt } from "../data";

export function Filters({ list, dsBP, filterBP, setFilterBP, search, setSearch, viewMode, setViewMode }: { list: NhanSuExt[]; dsBP: string[]; filterBP: string; setFilterBP: (v: string) => void; search: string; setSearch: (v: string) => void; viewMode: ViewMode; setViewMode: (v: ViewMode) => void }) {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2 flex-1">
          {["all", ...dsBP].map((bp) => (
            <button
              key={bp}
              onClick={() => setFilterBP(bp)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                filterBP === bp ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
              }`}
            >
              {bp === "all" ? `Tất cả (${list.length})` : `${bp} (${list.filter((n) => n.boPhan === bp).length})`}
            </button>
          ))}
        </div>
        <DataViewToggle onChange={setViewMode} />
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
        <input className="input pl-9" placeholder="Tìm tên, mã NV, SĐT, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
    </div>
  );
}
