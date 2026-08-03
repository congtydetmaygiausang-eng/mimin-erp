import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase config
// Đọc từ env vars (xem apps/web/.env.example)
// URL mặc định cho project nftlwdcsmlpeiazhuoho
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nftlwdcsmlpeiazhuoho.supabase.co";
// Hỗ trợ cả anon key (cũ) và publishable key (Supabase 2024+)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

// Re-export từ sync-helper để các store dùng tiện
export { supabaseUpsert, supabaseDelete, supabaseFetchAll, useSupabaseSync, checkSupabase } from "./sync-helper";

// Tạo client chỉ khi có config thật
// 2026-08-03: BẬT lại sau khi sếp Sang apply schema (commit 9ae0b4b)
export const isSupabaseEnabled = true;

export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: { eventsPerSecond: 2 },
      },
    })
  : null;

// Service role key - chỉ dùng server-side (API routes, scripts)
// KHÔNG ĐƯỢC import trong client components
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
export const SUPABASE_PROJECT_REF = (supabaseUrl.match(/https:\/\/([^.]+)/) || [])[1] || "";

// DEMO_USERS đã bị xoá ngày 2026-08-01 (theo yêu cầu anh Sang)
// Chi giữ lại 19 tài khoản nội bộ thật (xem lib/users.ts)
// Để tương thích, export mảng rỗng với type UserAccount
export const DEMO_USERS: Array<{ email: string; name: string; role: string; title: string }> = [];

// Helper: lưu setting Supabase config vào localStorage (cho user tự setup)
export const SUPABASE_CONFIG_KEY = "mimin_supabase_config";

export function saveSupabaseConfig(url: string, key: string) {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, key }));
  // Reload page để áp dụng
  if (typeof window !== "undefined") {
    setTimeout(() => window.location.reload(), 500);
  }
}

export function getSupabaseConfig() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) return JSON.parse(raw) as { url: string; key: string };
  } catch {}
  return null;
}
