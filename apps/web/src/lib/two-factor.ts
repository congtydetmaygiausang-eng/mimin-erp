// 2FA đơn giản: Mã 6 số gửi qua console (mock) hoặc email
// Trong production sẽ tích hợp Twilio/email thật

export interface TwoFactorCode {
  email: string;
  code: string;            // 6 chữ số
  expiresAt: number;       // timestamp
  attempts: number;        // số lần nhập sai
  verified: boolean;       // đã verify chưa
}

const STORAGE_KEY = "mimin_2fa_v1";
const CODE_TTL = 5 * 60 * 1000;  // 5 phút
const MAX_ATTEMPTS = 3;

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

/**
 * Tạo mã 2FA mới cho email
 * Returns: 6-digit code (mock gửi qua console)
 */
export function generate2FACode(email: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codes = fromStorage<TwoFactorCode[]>(STORAGE_KEY, []);
  // Xóa code cũ của email này
  const filtered = codes.filter((c) => c.email !== email);
  const newCode: TwoFactorCode = {
    email,
    code,
    expiresAt: Date.now() + CODE_TTL,
    attempts: 0,
    verified: false,
  };
  filtered.push(newCode);
  saveStorage(STORAGE_KEY, filtered);
  // Mock: log ra console (trong production sẽ gửi qua SMS/email)
  console.log(`[2FA] Mã xác thực cho ${email}: ${code}`);
  return code;
}

/**
 * Verify mã 2FA
 */
export function verify2FACode(email: string, inputCode: string): { ok: boolean; error?: string } {
  const codes = fromStorage<TwoFactorCode[]>(STORAGE_KEY, []);
  const code = codes.find((c) => c.email === email);
  if (!code) return { ok: false, error: "Chưa yêu cầu mã 2FA" };
  if (Date.now() > code.expiresAt) return { ok: false, error: "Mã 2FA đã hết hạn" };
  if (code.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Đã nhập sai quá 3 lần" };
  if (code.code !== inputCode.trim()) {
    code.attempts++;
    saveStorage(STORAGE_KEY, codes);
    return { ok: false, error: `Mã không đúng (còn ${MAX_ATTEMPTS - code.attempts} lần)` };
  }
  code.verified = true;
  saveStorage(STORAGE_KEY, codes);
  return { ok: true };
}

/**
 * Check email có bật 2FA không
 */
export function is2FAEnabled(email: string): boolean {
  // Đã tắt tạm thời cho môi trường dev/demo để dễ dàng đăng nhập
  return false;
}


export interface TwoFactorConfig {
  email: string;
  secret: string;
  enabled: boolean;
  backupCodes?: string[];
}

/**
 * Setup 2FA cho user (mock: secret = email)
 */
export function setup2FA(email: string, secret: string): TwoFactorConfig {
  return { email, secret, enabled: true };
}

export function enable2FA(email: string, code?: string): { ok: boolean; error?: string } {
  // Trong production: verify code rồi lưu vào DB
  if (code && code !== "123456") return { ok: false, error: "Mã không đúng (mock: 123456)" };
  console.log(`[2FA] Enabled for ${email}`);
  return { ok: true };
}

export function disable2FA(email: string): void {
  console.log(`[2FA] Disabled for ${email}`);
}
