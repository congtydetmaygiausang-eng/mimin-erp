"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, Table2, List } from "lucide-react";

export type ViewMode = "table" | "card" | "list";

const STORAGE_KEY = "mimin_view_mode";

export function DataViewToggle({ onChange }: { onChange: (mode: ViewMode) => void }) {
  const [mode, setMode] = useState<ViewMode>("table");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (saved) {
      setMode(saved);
      onChange(saved);
    }
  }, [onChange]);

  const set = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem(STORAGE_KEY, m);
    onChange(m);
  };

  return (
    <div className="card p-1 inline-flex">
      {([
        { id: "table", icon: Table2, label: "Bảng" },
        { id: "card", icon: LayoutGrid, label: "Card" },
        { id: "list", icon: List, label: "Danh sách" },
      ] as { id: ViewMode; icon: any; label: string }[]).map((v) => (
        <button
          key={v.id}
          onClick={() => set(v.id)}
          className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition ${
            mode === v.id ? "bg-brand-500 text-white shadow" : "hover:bg-white/40 dark:hover:bg-white/5"
          }`}
          title={v.label}
        >
          <v.icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{v.label}</span>
        </button>
      ))}
    </div>
  );
}
