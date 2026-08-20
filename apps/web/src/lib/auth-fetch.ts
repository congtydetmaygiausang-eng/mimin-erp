"use client";
// Helper fetch() có đính kèm access token Supabase Auth thật của người đang
// đăng nhập, dùng cho các API route đã bật requireAdmin/requireAuth (xem
// lib/api-auth.ts) - route server sẽ tự xác minh token này, KHÔNG tin role
// do client tự khai.
import { supabase } from "@/lib/supabase/client";

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = "";
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token || "";
  }
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}
