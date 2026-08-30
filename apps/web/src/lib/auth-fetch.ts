"use client";
// Helper fetch() có đính kèm access token Supabase Auth thật của người đang
// đăng nhập, dùng cho các API route đã bật requireAdmin/requireAuth (xem
// lib/api-auth.ts) - route server sẽ tự xác minh token này, KHÔNG tin role
// do client tự khai.
import { supabase } from "@/lib/supabase/client";

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = "";
  let demoFallback = "";

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token || "";
  }
  
  if (!token && typeof window !== "undefined") {
    // Nếu không có token, thử kiểm tra xem có đang dùng tài khoản Demo không
    const stored = localStorage.getItem("mimin_erp_session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.user?.source === "demo" && parsed?.user?.email) {
          demoFallback = parsed.user.email;
        }
      } catch {}
    }
  }

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else if (demoFallback) {
    headers.set("X-Demo-Fallback", demoFallback);
  }

  return fetch(url, { ...options, headers });
}
