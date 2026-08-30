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
    // Nếu không có token (vd: tài khoản Demo, hoặc tài khoản Supabase bị lỗi mất session/chưa confirm email),
    // thử kiểm tra xem có đang đăng nhập ở local (localStorage) không.
    const stored = localStorage.getItem("mimin_erp_session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Hỗ trợ 2 định dạng: 
        // 1. { user: { email: ... } } (của Demo có TTL)
        // 2. { email: ... } (của Supabase lưu trực tiếp)
        const fallbackEmail = parsed?.user?.email || parsed?.email;
        if (fallbackEmail) {
          demoFallback = fallbackEmail;
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
