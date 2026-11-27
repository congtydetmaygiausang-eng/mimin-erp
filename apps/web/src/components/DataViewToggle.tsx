"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "table" | "card" | "list";

const STORAGE_KEY = "mimin_view_mode";

interface DataViewToggleProps {
  value?: ViewMode;
  onChange: (mode: ViewMode) => void;
  modes?: ViewMode[];
}

export function DataViewToggle({ value, onChange, modes = ["list", "card"] }: DataViewToggleProps) {
  // Mặc định luôn là Dạng Danh Sách (list) theo yêu cầu của anh Cường
  const [mode, setMode] = useState<ViewMode>("list");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (saved === "list" || saved === "card") {
      setMode(saved);
      onChange(saved);
    } else {
      setMode("list");
      localStorage.setItem(STORAGE_KEY, "list");
      onChange("list");
    }
  }, [onChange]);

  const set = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem(STORAGE_KEY, m);
    onChange(m);
  };

  const currentMode = value !== undefined ? (value === "table" ? "list" : value) : mode;

  const viewOptions = [
    { id: "list" as ViewMode, icon: List, label: "Danh Sách" },
    { id: "card" as ViewMode, icon: LayoutGrid, label: "Dạng Thẻ" },
  ].filter((opt) => modes.includes(opt.id));

  return (
    <div className="p-1 inline-flex bg-slate-100 rounded-xl border border-slate-200 shadow-2xs">
      {viewOptions.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => set(v.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            currentMode === v.id
              ? "bg-teal-700 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
          title={v.id === "list" ? "Dạng danh sách theo từng dòng (Tối ưu xem nhiều SP)" : "Dạng thẻ hình ảnh lớn"}
        >
          <v.icon className="w-3.5 h-3.5" />
          <span>{v.label}</span>
        </button>
      ))}
    </div>
  );
}
