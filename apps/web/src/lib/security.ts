// Security: rate-limit login + session TTL

const RATE_LIMIT_KEY = "mimin_login_rate_limit_v1";
const SESSION_TTL_KEY = "mimin_session_ttl_v1";

// Rate limit: tối đa 5 lần sai trong 5 phút
const MAX_FAILED_LOGIN = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000;  // 5 phút

// Session TTL: 8 giờ
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function fromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const r = localStorage.getItem(key);
    if (r) return JSON.parse(r);
  } catch {}
  return defaultValue;
}
function saveStorage<T>(key: string, v: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

interface RateLimitRecord {
  email: string;
  failures: number;
  firstFailureAt: number;
  lockedUntil?: number;
}

/**
 * Check email có bị lock không
 */
export function checkRateLimit(email: string): { allowed: boolean; remainingMs?: number; message?: string } {
  const records = fromStorage<Record<string, RateLimitRecord>>(RATE_LIMIT_KEY, {});
  const r = records[email];
  if (!r) return { allowed: true };
  if (r.lockedUntil && Date.now() < r.lockedUntil) {
    const remainingSec = Math.ceil((r.lockedUntil - Date.now()) / 1000);
    return { allowed: false, remainingMs: r.lockedUntil - Date.now(), message: `Bị khoá ${remainingSec}s. Thử lại sau.` };
  }
  return { allowed: true };
}

/**
 * Ghi nhận login fail
 */
export function recordLoginFailure(email: string): { locked: boolean; remaining: number } {
  const records = fromStorage<Record<string, RateLimitRecord>>(RATE_LIMIT_KEY, {});
  const r = records[email] || { email, failures: 0, firstFailureAt: Date.now() };
  r.failures++;
  if (r.failures >= MAX_FAILED_LOGIN) {
    r.lockedUntil = Date.now() + LOCKOUT_DURATION;
    r.failures = 0;  // Reset sau khi lock
    saveStorage(RATE_LIMIT_KEY, records);
    return { locked: true, remaining: MAX_FAILED_LOGIN - 0 };
  }
  saveStorage(RATE_LIMIT_KEY, records);
  return { locked: false, remaining: MAX_FAILED_LOGIN - r.failures };
}

/**
 * Reset khi login thành công
 */
export function clearLoginFailures(email: string): void {
  const records = fromStorage<Record<string, RateLimitRecord>>(RATE_LIMIT_KEY, {});
  delete records[email];
  saveStorage(RATE_LIMIT_KEY, records);
}

// ====================== SESSION TTL ======================

export interface SessionWithTTL {
  user: any;
  expiresAt: number;  // timestamp
}

/**
 * Tạo session có TTL
 */
export function createSessionWithTTL(user: any): void {
  const session: SessionWithTTL = {
    user,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  localStorage.setItem("mimin_erp_session", JSON.stringify(session));
  saveStorage(SESSION_TTL_KEY, session);
}

/**
 * Lấy session + auto-expire
 */
export function getSessionWithTTL(): any | null {
  const session = fromStorage<SessionWithTTL | null>("mimin_erp_session", null);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    // Expired
    localStorage.removeItem("mimin_erp_session");
    localStorage.removeItem(SESSION_TTL_KEY);
    return null;
  }
  // Auto-renew khi còn 1/3 TTL
  const remaining = session.expiresAt - Date.now();
  if (remaining < SESSION_TTL_MS / 3) {
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    localStorage.setItem("mimin_erp_session", JSON.stringify(session));
    saveStorage(SESSION_TTL_KEY, session);
  }
  return session.user;
}

export function clearSession(): void {
  localStorage.removeItem("mimin_erp_session");
  localStorage.removeItem(SESSION_TTL_KEY);
}
