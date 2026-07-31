// User Access Token storage + helper
// Dùng để bypass scope - user_access_token có quyền admin của user

const STORAGE_KEY = "mimin_lark_user_token_v1";

export type LarkUserToken = {
  token: string;
  refreshToken: string;
  expireAt: number;
  userName?: string;
  email?: string;
};

export function getUserAccessToken(): LarkUserToken | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as LarkUserToken;
    if (data.expireAt < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveUserAccessToken(
  token: string,
  refreshToken: string,
  expiresIn: number,
  userInfo?: { name?: string; email?: string }
) {
  if (typeof window === "undefined") return;
  const data: LarkUserToken = {
    token,
    refreshToken,
    expireAt: Date.now() + expiresIn * 1000,
    userName: userInfo?.name,
    email: userInfo?.email,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearUserAccessToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function hasUserToken(): boolean {
  return !!getUserAccessToken();
}
