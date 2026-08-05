// ============ TYPES + CONSTANTS ============
// Tach tu page.tsx (2026-08-05 - toi uu B.5)

import type { PhanCongCongDoan, CongDoanKey } from "@/lib/data/cong-no-store";

export type StatusFilter = "all" | "Chờ giao" | "Đang làm" | "Hoàn thành" | "Đã thanh toán";
export type NguoiFilter = "all" | "Đối tác gia công" | "Nhân viên nội bộ";
export type TabKey = "all" | "theo-nguoi" | "theo-cong-doan" | "theo-lenh" | "tre-han";

export const STATUS_STYLE: Record<PhanCongCongDoan["trangThai"], { color: string; bg: string }> = {
  "Chờ giao": { color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-500/15" },
  "Đang làm": { color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/15" },
  "Hoàn thành": { color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/15" },
  "Đã thanh toán": { color: "text-sky-700 dark:text-sky-400", bg: "bg-sky-500/15" },
};

export const CONG_DOAN_OPTIONS: CongDoanKey[] = ["Cắt", "Thêu", "In", "May áo", "May quần", "Ủi/Đóng gói"];
