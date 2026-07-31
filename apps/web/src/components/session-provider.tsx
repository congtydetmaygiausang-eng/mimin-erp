"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase, DEMO_USERS, isSupabaseEnabled } from "@/lib/supabase/client";
import { findUserByEmail } from "@/lib/users";
import { checkRateLimit, recordLoginFailure, clearLoginFailures, getSessionWithTTL, clearSession, createSessionWithTTL } from "@/lib/security";
import { is2FAEnabled, generate2FACode, verify2FACode } from "@/lib/two-factor";
import { migrateLegacyKeys } from "@/lib/migrate-legacy-keys";
import { migrateLarkConfig } from "@/lib/lark-config";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  title: string;
  source: "supabase" | "demo";
};

type SessionContextValue = {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  authSource: "supabase" | "demo" | "none";
};

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = "mimin_erp_session";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authSource, setAuthSource] = useState<"supabase" | "demo" | "none">("none");

  useEffect(() => {
    // Auto-migrate legacy keys
    migrateLegacyKeys();
    migrateLarkConfig();
    // Get session with TTL check
    const ttlUser = getSessionWithTTL();
    if (ttlUser) {
      setUser(ttlUser);
      setAuthSource(ttlUser.source || "demo");
      setLoading(false);
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setAuthSource(parsed.source || "demo");
      } catch {
        // ignore
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Rate-limit check
    const limit = checkRateLimit(email);
    if (!limit.allowed) {
      return { ok: false, error: limit.message || "Quá nhiều lần thử. Vui lòng đợi." };
    }
    // 2FA check (nếu user đã bật)
    if (is2FAEnabled(email)) {
      const code = generate2FACode(email);
      const inputCode = prompt(`🔐 Mã 2FA của ${email}: ${code}\n(Nhập mã để xác nhận)`);
      if (inputCode === null) return { ok: false, error: "Đã hủy xác thực 2FA" };
      const verify = verify2FACode(email, inputCode);
      if (!verify.ok) {
        const fail = recordLoginFailure(email);
        return { ok: false, error: verify.error + (fail.locked ? " — Tài khoản bị khoá 5 phút" : "") };
      }
    }
    // Try Supabase first (if enabled)
    if (isSupabaseEnabled && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
          const appMeta = (data.user.app_metadata as Record<string, unknown>) || {};
          const userMeta = (data.user.user_metadata as Record<string, unknown>) || {};
          const role = String(appMeta.role || "user");
          const name = String(userMeta.full_name || data.user.email?.split("@")[0] || "User");
          const titles: Record<string, string> = {
            admin: "Quản trị viên",
            planner: "Chuyên viên kế hoạch",
            warehouse: "Quản lý kho",
            sewing: "Tổ trưởng may",
            qc: "Kiểm tra chất lượng",
            finishing: "Tổ trưởng hoàn thiện",
            accountant: "Kế toán",
          };
          const u: AppUser = {
            id: data.user.id,
            email: data.user.email || email,
            name,
            role,
            title: titles[role] || role,
            source: "supabase",
          };
          setUser(u);
          setAuthSource("supabase");
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          return { ok: true };
        }
        if (error?.message?.includes("Invalid login")) {
          return { ok: false, error: "Email hoặc mật khẩu không đúng" };
        }
      } catch {
        // network fail, fall through to demo
      }
    }

    // Fallback 1: Unified users từ users.ts (canonical source - 19 + 13 + 7 mock = 26)
    const userRecord = findUserByEmail(email);
    if (userRecord && userRecord.password === password) {
      const u: AppUser = {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role,
        title: userRecord.chucVu || userRecord.role,
        source: "demo",
      };
      setUser(u);
      setAuthSource("demo");
      createSessionWithTTL(u);
      clearLoginFailures(email);
      updateUserActivity(email, true);
      return { ok: true };
    }

    // Fallback 2: Legacy DEMO_USERS từ supabase/client.ts (back-compat)
    const legacy = DEMO_USERS.find((u: any) => u.email === email && u.password === password);
    if (legacy) {
      const u: AppUser = {
        id: (legacy as any).id || email,
        email: legacy.email,
        name: (legacy as any).name || legacy.email.split("@")[0],
        role: (legacy as any).role || "user",
        title: (legacy as any).title || (legacy as any).role || "User",
        source: "demo",
      };
      setUser(u);
      setAuthSource("demo");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return { ok: true };
    }

    const fail = recordLoginFailure(email);
    return { ok: false, error: fail.locked ? "Quá 5 lần sai. Khoá 5 phút." : "Email hoặc mật khẩu không đúng" };
  };

  const signOut = async () => {
    if (isSupabaseEnabled && supabase) {
      try { await supabase.auth.signOut(); } catch {}
    }
    setUser(null);
    setAuthSource("none");
    clearSession();
  };

  return (
    <SessionContext.Provider value={{ user, loading, signIn, signOut, authSource }}>
      {children}
    </SessionContext.Provider>
  );
}



/**
 * Cập nhật hoạt động user (last active, login count)
 */
function updateUserActivity(email: string, isLogin: boolean = false) {
  if (typeof window === "undefined") return;
  try {
    const key = "mimin_user_activity_v1";
    const raw = localStorage.getItem(key);
    const activities: Record<string, { lastLogin?: string; lastActive?: string; loginCount?: number }> = raw ? JSON.parse(raw) : {};
    const now = new Date().toISOString();
    const prev = activities[email] || { loginCount: 0 };
    activities[email] = {
      lastLogin: isLogin ? now : prev.lastLogin,
      lastActive: now,
      loginCount: isLogin ? (prev.loginCount || 0) + 1 : prev.loginCount,
    };
    localStorage.setItem(key, JSON.stringify(activities));
  } catch {}
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
