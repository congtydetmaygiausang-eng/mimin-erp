// Time-based Permission - Quyền có thời hạn
// VD: thử việc 30 ngày, hợp đồng 3 tháng, ...

import { can, type Module, type Action, type Role } from "./permissions";

export type TimeBound = {
  userId: string;
  userEmail: string;
  role: Role;
  startDate: string; // ISO
  endDate: string;   // ISO
  reason?: string;   // "Thử việc", "Hợp đồng", "Tạm thời"
  approvedBy?: string;
  active: boolean;
};

const STORAGE_KEY = "mimin_time_bounds_v1";

export function getTimeBounds(): TimeBound[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TimeBound[];
  } catch {
    return [];
  }
}

function saveBounds(bounds: TimeBound[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bounds));
}

export function getTimeBound(userIdOrEmail: string): TimeBound | null {
  const bounds = getTimeBounds();
  return bounds.find(
    (b) => b.userId === userIdOrEmail || b.userEmail === userIdOrEmail
  ) || null;
}

export function setTimeBound(bound: TimeBound): void {
  const bounds = getTimeBounds();
  const idx = bounds.findIndex(
    (b) => b.userId === bound.userId || b.userEmail === bound.userEmail
  );
  if (idx >= 0) bounds[idx] = bound;
  else bounds.push(bound);
  saveBounds(bounds);
}

export function removeTimeBound(userIdOrEmail: string): void {
  const bounds = getTimeBounds();
  const filtered = bounds.filter(
    (b) => b.userId !== userIdOrEmail && b.userEmail !== userIdOrEmail
  );
  saveBounds(filtered);
}

// Check quyền có thời hạn
export function canWithTimeBound(
  userIdOrEmail: string,
  role: Role,
  module: Module,
  action: Action
): { allowed: boolean; reason?: string; expiresIn?: number } {
  const bound = getTimeBound(userIdOrEmail);
  const now = Date.now();

  // Admin không bị giới hạn thời gian
  if (role === "admin") {
    return { allowed: can(role, module, action) };
  }

  if (!bound || !bound.active) {
    return { allowed: can(role, module, action) };
  }

  // Chưa tới ngày bắt đầu
  if (new Date(bound.startDate).getTime() > now) {
    return {
      allowed: false,
      reason: `Quyền chưa có hiệu lực. Bắt đầu từ ${new Date(bound.startDate).toLocaleDateString("vi-VN")}`,
    };
  }

  // Đã hết hạn
  if (new Date(bound.endDate).getTime() < now) {
    return {
      allowed: false,
      reason: `Quyền đã hết hạn vào ${new Date(bound.endDate).toLocaleDateString("vi-VN")}`,
    };
  }

  // Còn hiệu lực
  const expiresIn = new Date(bound.endDate).getTime() - now;
  return {
    allowed: can(role, module, action),
    expiresIn,
  };
}

// Helper: format expiresIn thành text
export function formatExpiresIn(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days > 30) return `${Math.floor(days / 30)} tháng`;
  if (days > 0) return `${days} ngày`;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours > 0) return `${hours} giờ`;
  return "Sắp hết hạn";
}

// Sắp hết hạn (còn <7 ngày)
export function isExpiringSoon(bound: TimeBound): boolean {
  const now = Date.now();
  const end = new Date(bound.endDate).getTime();
  const diff = end - now;
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

export function isExpired(bound: TimeBound): boolean {
  return new Date(bound.endDate).getTime() < Date.now();
}
