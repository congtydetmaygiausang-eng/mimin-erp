"use client";

import { useMemo } from "react";

const PALETTE = [
  ["#14b8a6", "#0ea5e9"],  // teal → sky
  ["#a855f7", "#ec4899"],  // purple → pink
  ["#f59e0b", "#ef4444"],  // amber → red
  ["#10b981", "#06b6d4"],  // emerald → cyan
  ["#6366f1", "#8b5cf6"],  // indigo → violet
  ["#ec4899", "#f43f5e"],  // pink → rose
  ["#0ea5e9", "#3b82f6"],  // sky → blue
  ["#84cc16", "#22c55e"],  // lime → green
  ["#f97316", "#fb923c"],  // orange
  ["#06b6d4", "#0ea5e9"],  // cyan → sky
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getInitials(name: string): string {
  if (!name) return "?";
  const cleaned = name.replace(/\(.*?\)/g, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getColor(seed: string): [string, string] {
  const idx = hashString(seed) % PALETTE.length;
  return PALETTE[idx] as [string, string];
}

export function Avatar({
  name,
  src,
  size = "md",
  className = "",
  showStatus = false,
  isOnline = false,
}: {
  name: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showStatus?: boolean;
  isOnline?: boolean;
}) {
  const initials = useMemo(() => getInitials(name), [name]);
  const [c1, c2] = useMemo(() => getColor(name), [name]);

  const sizeClass = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
    "2xl": "w-20 h-20 text-xl",
  }[size];

  const statusSize = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-3.5 h-3.5",
    "2xl": "w-4 h-4",
  }[size];

  return (
    <div className={`relative shrink-0 ${className}`}>
      {src ? (
        <div className={`${sizeClass} rounded-full overflow-hidden shadow-md ring-2 ring-white/30 bg-slate-100 dark:bg-slate-800`}>
          <img src={src} alt={name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white shadow-md ring-2 ring-white/30`}
          style={{
            background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
          }}
        >
          {initials}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${statusSize} rounded-full border-2 border-white ${
            isOnline ? "bg-emerald-500" : "bg-slate-400"
          }`}
        />
      )}
    </div>
  );
}

export function AvatarGroup({ names, max = 4, size = "sm" }: { names: string[]; max?: number; size?: "xs" | "sm" | "md" }) {
  const visible = names.slice(0, max);
  const extra = names.length - max;
  return (
    <div className="flex -space-x-2">
      {visible.map((n, i) => (
        <div key={i} className="ring-2 ring-white rounded-full">
          <Avatar name={n} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className={`${
            size === "xs" ? "w-6 h-6 text-[10px]" : size === "md" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs"
          } rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300 ring-2 ring-white`}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
