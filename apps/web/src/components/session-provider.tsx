"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase, DEMO_USERS, isSupabaseEnabled, supabaseUpsert, supabaseFetchAll } from "@/lib/supabase/client";
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
  maNV?: string;
  phongBan?: string;
  donGia?: number;
  laCongNhan?: boolean;
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

// Danh sách email MOCK cũ - nếu session còn dùng thì force logout
const MOCK_EMAILS = [
  "admin@mimin.vn",
  "sewing@mimin.vn",
  "planner@mimin.vn",
  "qc@mimin.vn",
  "finishing@mimin.vn",
  "accountant@mimin.vn",
  "warehouse@mimin.vn",
];

function clearMockSession() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;
  try {
    const parsed = JSON.parse(stored);
    if (parsed?.email && MOCK_EMAILS.includes(parsed.email.toLowerCase())) {
      console.log(`[session] Force logout mock user: ${parsed.email}`);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("mimin_erp_session_ttl");
    }
  } catch {
    // ignore
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authSource, setAuthSource] = useState<"supabase" | "demo" | "none">("none");

  useEffect(() => {
    // Auto-migrate legacy keys
    migrateLegacyKeys();
    migrateLarkConfig();
    // Xoá session nếu còn dùng email mock cũ (force re-login)
    clearMockSession();
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
    
    // Lắng nghe thay đổi trạng thái từ Supabase (đặc biệt quan trọng cho OAuth/Google Login)
    if (isSupabaseEnabled && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const appMeta = (session.user.app_metadata as Record<string, unknown>) || {};
          const userMeta = (session.user.user_metadata as Record<string, unknown>) || {};
          const role = String(appMeta.role || "user");
          const name = String(userMeta.full_name || session.user.email?.split("@")[0] || "User");
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
            id: session.user.id,
            email: session.user.email || "",
            name,
            role,
            title: titles[role] || role,
            source: "supabase",
            maNV: userMeta.maNV as string | undefined,
            phongBan: userMeta.phongBan as string | undefined,
            donGia: userMeta.donGia as number | undefined,
            laCongNhan: userMeta.laCongNhan as boolean | undefined,
          };
          
          setUser(u);
          setAuthSource("supabase");
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          
          // Kiểm tra xem đã thiết lập mật khẩu chưa (hoặc có cờ báo hiệu, hoặc đã có provider email)
          const providers = (session.user.app_metadata.providers as string[]) || [];
          const hasSetPassword = userMeta.has_set_password === true || providers.includes('email');

          // Điều hướng dựa trên trạng thái (áp dụng cho mọi trang ngoại trừ chính trang setup-password)
          if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (!hasSetPassword && !path.includes('/setup-password')) {
              window.location.href = "/setup-password";
            } else if (hasSetPassword && path.includes('/login')) {
              const target = u.role === "partner" ? "/trang-chu-gia-cong" : "/dashboard";
              window.location.href = target;
            }
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setAuthSource("none");
          localStorage.removeItem(STORAGE_KEY);
        }
      });
      
      setLoading(false);
      return () => {
        subscription.unsubscribe();
      };
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
            maNV: userMeta.maNV as string | undefined,
            phongBan: userMeta.phongBan as string | undefined,
            donGia: userMeta.donGia as number | undefined,
            laCongNhan: userMeta.laCongNhan as boolean | undefined,
          };
          setUser(u);
          setAuthSource("supabase");
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          clearLoginFailures(email);

          // Auto-sync profile vao bang users trong Supabase (neu chua co)
          if (u.maNV) {
            try {
              const existing = await supabaseFetchAll<{ id: string }>("users");
              const hasProfile = existing.some((p) => p.id === u.id);
              if (!hasProfile) {
                await supabaseUpsert("users", {
                  id: u.id,
                  email: u.email,
                  maNV: u.maNV,
                  name: u.name,
                  role: u.role,
                  chucVu: u.title,
                  phongBan: u.phongBan || "khac",
                  donGia: u.donGia || 0,
                  laCongNhan: u.laCongNhan ?? false,
                  isActive: true,
                });
                console.log(`[session] Synced user ${u.email} to Supabase users table`);
              }
            } catch (syncErr) {
              console.warn("[session] Failed to sync user profile to Supabase:", syncErr);
            }
          }
          return { ok: true };
        }
        // Trước đây "Invalid login" return sớm ở đây, khiến các tài khoản chỉ
        // tồn tại ở fallback demo (không có trong Supabase Auth) KHÔNG BAO GIỜ
        // thử được bước fallback bên dưới - vì Supabase trả cùng 1 thông điệp
        // "Invalid login credentials" cho mọi trường hợp sai (kể cả email không
        // tồn tại, theo thiết kế bảo mật của Supabase). Bỏ early-return, để mọi
        // lỗi từ Supabase đều rơi xuống thử tiếp fallback demo bên dưới.
      } catch {
        // network fail, fall through to demo
      }
    }

    // Fallback 1: tài khoản demo/nội bộ - mật khẩu được so sánh SERVER-SIDE qua
    // /api/auth/login (lib/users.server.ts, guard "server-only"). Trước đây so
    // sánh thẳng trong trình duyệt với dữ liệu từ lib/users.ts, khiến toàn bộ
    // mật khẩu thật của 18+ nhân viên bị bundle xuống JS gửi cho mọi client.
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const { user: userRecord } = await res.json();
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
    } catch {
      // network fail, fall through to legacy
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
