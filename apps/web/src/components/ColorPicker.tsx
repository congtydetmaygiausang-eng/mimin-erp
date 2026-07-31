"use client";
import { useState } from "react";
import { Palette, X } from "lucide-react";
import { MAU_VAI_35, type MauVai } from "@/lib/mau-vai-35";

interface Props {
  value?: string;
  onChange: (mau: MauVai) => void;
  compact?: boolean;
}

export default function ColorPicker({ value, onChange, compact }: Props) {
  const [open, setOpen] = useState(false);
  const selected = MAU_VAI_35.find((m) => m.id === value || m.ten === value);

  if (compact) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-10 h-10 rounded-lg border-2 border-slate-300 flex items-center justify-center"
          style={{ background: selected?.hex || "#f1f5f9" }}
          title={selected?.ten || "Chọn màu"}
        >
          {!selected && <Palette className="w-4 h-4 text-slate-500" />}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute z-40 top-full mt-1 left-0 card p-3 w-72 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-7 gap-1.5">
                {MAU_VAI_35.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { onChange(m); setOpen(false); }}
                    className="w-8 h-8 rounded border-2 hover:scale-110 transition"
                    style={{ background: m.hex, borderColor: selected?.id === m.id ? "#3b82f6" : "#cbd5e1" }}
                    title={m.ten}
                  />
                ))}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 text-center">{selected ? `Đã chọn: ${selected.ten}` : "Chọn 1 màu"}</div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 border rounded-lg flex items-center gap-2 hover:border-blue-400"
      >
        <div className="w-6 h-6 rounded border" style={{ background: selected?.hex || "transparent" }} />
        <span className="flex-1 text-left text-sm">{selected?.ten || "Chọn màu vải"}</span>
        <Palette className="w-4 h-4 text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 mt-1 card p-3 w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm">Chọn màu vải ({MAU_VAI_35.length} màu)</h4>
              <button onClick={() => setOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {MAU_VAI_35.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { onChange(m); setOpen(false); }}
                  className="flex flex-col items-center gap-1 p-1 rounded hover:bg-slate-100"
                  title={m.ten}
                >
                  <div
                    className="w-8 h-8 rounded border-2"
                    style={{ background: m.hex, borderColor: selected?.id === m.id ? "#3b82f6" : "#cbd5e1" }}
                  />
                  <span className="text-[9px] text-slate-600 truncate w-full text-center">{m.ten}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
