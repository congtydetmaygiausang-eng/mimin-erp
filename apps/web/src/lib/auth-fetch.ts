"use client";
// Helper fetch() có đính kèm access token Supabase Auth thật của người đang
// đăng nhập, dùng cho các API route đã bật requireAdmin/requireAuth (xem
// lib/api-auth.ts) - route server sẽ tự xác minh token này, KHÔNG tin role
// do client tự khai.
import { supabase } from "@/lib/supabase/client";
import { LOCAL_ACCOUNT_MODE } from "./local-account-mode";

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (LOCAL_ACCOUNT_MODE) return Response.json({ error: "Chế độ test local không gọi API dữ liệu thật" }, { status: 503 });
  let token = "";

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token || "";
  }
  
  if (!token) return Response.json({ error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });

  const headers = new Headers(options.headers);
  headers.delete("X-Demo-Fallback");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
}
