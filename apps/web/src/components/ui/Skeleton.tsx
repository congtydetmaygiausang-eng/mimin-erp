"use client";

import { ReactNode } from "react";

export type SkeletonProps = {
  className?: string;
  variant?: "text" | "circle" | "rect";
  width?: string | number;
  height?: string | number;
  count?: number;
};

/**
 * Loading skeleton - dùng khi đang fetch data
 * Pulse animation, slate-200/700
 */
export function Skeleton({ className = "", variant = "text", width, height, count = 1 }: SkeletonProps) {
  const baseClass = "animate-pulse bg-slate-200/60 dark:bg-slate-700/40";
  const variantClass = {
    text: "h-3 rounded",
    circle: "rounded-full",
    rect: "rounded-lg",
  }[variant];

  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`${baseClass} ${variantClass} ${className}`} style={style} />
        ))}
      </div>
    );
  }
  return <div className={`${baseClass} ${variantClass} ${className}`} style={style} />;
}

// Skeleton cho card (KPI, list item, etc.)
export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card p-5 animate-pulse">
      <Skeleton variant="text" width="40%" className="mb-2" />
      <Skeleton variant="rect" width="60%" height={28} className="mb-2" />
      <Skeleton variant="text" count={rows} width="100%" />
    </div>
  );
}

// Skeleton cho table
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card p-4 animate-pulse space-y-3">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} variant="rect" height={20} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} variant="text" height={16} />
          ))}
        </div>
      ))}
    </div>
  );
}
