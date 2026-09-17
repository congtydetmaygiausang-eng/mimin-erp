import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { LOCAL_ACCOUNT_MODE } from "../local-account-mode";
import type { AccountDirectoryEntry, AccountDisplayProfile } from "../data/account-access";

// Supabase config
// Đọc từ env vars (xem apps/web/.env.example)
// URL mặc định cho project Pro mới (2026-08-03 chuyển từ Free sang Pro)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ejcuqyaiwabfygyesvxj.supabase.co";
// Hỗ trợ cả anon key (cũ) và publishable key (Supabase 2024+)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd";

// Re-export từ sync-helper để các store dùng tiện
export { supabaseUpsert, supabaseDelete, supabaseFetchAll, supabaseFetchAllRaw, supabaseUpsertRaw, useSupabaseSync, checkSupabase, camelToSnake } from "./sync-helper";

// Tạo client chỉ khi có config thật
// 2026-08-03: BẬT lại sau khi sếp Sang apply schema (commit 9ae0b4b)
export const isSupabaseEnabled = !LOCAL_ACCOUNT_MODE;

export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: { eventsPerSecond: 2 },
      },
    })
  : null;

// Directory reads also work in local account preview. Use the real Auth session
// and public key; local role selection never grants database permissions.
let directoryClient: SupabaseClient | null = null;
export async function fetchAccountDisplayProfile(email: string, employeeCode?: string): Promise<AccountDisplayProfile> {
  const client = supabase || (directoryClient ??= createClient(supabaseUrl, supabaseAnonKey));
  const { data: account, error: accountError } = await client.from("users").select('name,"chucVu","maNV"').eq("email", email.trim().toLowerCase()).maybeSingle();
  const columns = "ho_ten,avatar_url,chuc_vu";
  const byEmail = await client.from("nhan_su").select(columns).eq("email", email.trim().toLowerCase()).maybeSingle();
  const code = account?.maNV || employeeCode;
  const byCode = !byEmail.data && code ? await client.from("nhan_su").select(columns).eq("ma_nv", code).maybeSingle() : null;
  const employee = byEmail.data || byCode?.data;
  if (!employee && !account && (accountError || byEmail.error || byCode?.error)) throw new Error("Không tải được hồ sơ tài khoản từ Supabase");
  let avatar = typeof employee?.avatar_url === "string" ? employee.avatar_url : undefined;
  if (avatar?.startsWith("nhan-su/")) {
    const { data, error } = await client.storage.from("employee-documents").createSignedUrl(avatar, 3600);
    avatar = error ? undefined : data?.signedUrl;
  }
  if (avatar && !/^(https?:\/\/|\/[^/])/.test(avatar)) avatar = undefined;
  return { name: employee?.ho_ten || account?.name || undefined, title: employee?.chuc_vu || account?.chucVu || undefined, avatar };
}
export async function fetchAccountDirectory(): Promise<AccountDirectoryEntry[]> {
  const client = supabase || (directoryClient ??= createClient(supabaseUrl, supabaseAnonKey));
  async function readPages(table: string, columns: string): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await client.from(table).select(columns).order("id").range(offset, offset + 499);
      if (error) throw new Error(`Không tải được ${table}: ${error.message}`);
      const page = (data || []) as unknown as Record<string, unknown>[];
      rows.push(...page);
      if (page.length < 500) return rows;
    }
  }
  const [employees, companies] = await Promise.all([
    readPages("nhan_su", "id,ma_nv,ho_ten,email,bo_phan"),
    readPages("nha_cung_cap", "id,ma_ncc,ten_ncc,email,loai"),
  ]);
  const value = (row: Record<string, unknown>, key: string) => typeof row[key] === "string" ? row[key].trim() : "";
  return [
    ...employees.map(row => ({ kind: "employee" as const, code: value(row, "ma_nv"), name: value(row, "ho_ten"), email: value(row, "email"), department: value(row, "bo_phan") })),
    ...companies.map(row => ({ kind: value(row, "loai") === "doi_tac_gia_cong" ? "partner" as const : "supplier" as const, code: value(row, "ma_ncc"), name: value(row, "ten_ncc"), email: value(row, "email"), department: "" })),
  ].filter(row => row.code).sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

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
