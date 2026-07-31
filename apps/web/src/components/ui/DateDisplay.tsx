"use client";

export type DateDisplayProps = {
  /** ISO date string (YYYY-MM-DD hoặc full ISO) */
  value: string | null | undefined;
  /** Format output */
  format?: "dd/MM/yyyy" | "dd/MM" | "dd/MM/yyyy HH:mm" | "HH:mm";
  /** Hiển thị "—" nếu rỗng */
  emptyText?: string;
  /** Thêm relative time (e.g. "còn 2 ngày", "trễ 1 ngày") */
  showRelative?: boolean;
  className?: string;
};

/**
 * Format date theo chuẩn Việt Nam dd/MM/yyyy
 * Tránh bug timezone khi dùng new Date("2026-07-30") - ăn nhầm UTC
 */
function parseISODate(value: string): { y: number; m: number; d: number; hh: number; mm: number; hasTime: boolean } | null {
  if (!value) return null;
  // Match YYYY-MM-DD or YYYY-MM-DDTHH:mm
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) {
    // Try fallback to Date
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), hh: d.getHours(), mm: d.getMinutes(), hasTime: true };
  }
  return {
    y: parseInt(m[1], 10),
    m: parseInt(m[2], 10),
    d: parseInt(m[3], 10),
    hh: m[4] ? parseInt(m[4], 10) : 0,
    mm: m[5] ? parseInt(m[5], 10) : 0,
    hasTime: !!m[4],
  };
}

function diffDays(target: { y: number; m: number; d: number }, today: Date): number {
  const t = new Date(target.y, target.m - 1, target.d).getTime();
  const n = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((t - n) / (1000 * 60 * 60 * 24));
}

function formatDate(d: { y: number; m: number; d: number; hh: number; mm: number; hasTime: boolean }, format: DateDisplayProps["format"] = "dd/MM/yyyy"): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  switch (format) {
    case "dd/MM/yyyy":
      return `${pad(d.d)}/${pad(d.m)}/${d.y}`;
    case "dd/MM":
      return `${pad(d.d)}/${pad(d.m)}`;
    case "HH:mm":
      return `${pad(d.hh)}:${pad(d.mm)}`;
    case "dd/MM/yyyy HH:mm":
    default:
      return d.hasTime
        ? `${pad(d.d)}/${pad(d.m)}/${d.y} ${pad(d.hh)}:${pad(d.mm)}`
        : `${pad(d.d)}/${pad(d.m)}/${d.y}`;
  }
}

export function DateDisplay({ value, format = "dd/MM/yyyy", emptyText = "—", showRelative = false, className = "" }: DateDisplayProps) {
  const d = parseISODate(value || "");
  if (!d) return <span className={`opacity-50 ${className}`}>{emptyText}</span>;
  const formatted = formatDate(d, format);

  if (!showRelative) {
    return <span className={className}>{formatted}</span>;
  }
  const days = diffDays(d, new Date());
  let relativeText = "";
  let relativeClass = "opacity-60";
  if (days === 0) relativeText = "Hôm nay";
  else if (days === 1) relativeText = "Ngày mai";
  else if (days === -1) relativeText = "Hôm qua";
  else if (days > 0 && days <= 7) {
    relativeText = `Còn ${days} ngày`;
    relativeClass = "text-amber-600 font-medium";
  } else if (days > 7 && days <= 30) {
    relativeText = `Còn ${days} ngày`;
    relativeClass = "text-sky-600";
  } else if (days < 0 && days >= -7) {
    relativeText = `Trễ ${Math.abs(days)} ngày`;
    relativeClass = "text-red-600 font-semibold";
  } else if (days < -7) {
    relativeText = `Trễ ${Math.abs(days)} ngày`;
    relativeClass = "text-red-700 font-bold";
  } else {
    relativeText = `Còn ${days} ngày`;
  }

  return (
    <span className={`inline-flex flex-col leading-tight ${className}`}>
      <span>{formatted}</span>
      <span className={`text-[10px] ${relativeClass}`}>{relativeText}</span>
    </span>
  );
}

/** Helper format date trong code (không phải component) */
export function formatDateVN(value: string | null | undefined, format: "dd/MM/yyyy" | "dd/MM" | "dd/MM/yyyy HH:mm" = "dd/MM/yyyy"): string {
  const d = parseISODate(value || "");
  if (!d) return "—";
  return formatDate(d, format);
}
