import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase config
// Đọc từ env vars (xem apps/web/.env.example)
// URL mặc định cho project nftlwdcsmlpeiazhuoho
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nftlwdcsmlpeiazhuoho.supabase.co";
// Hỗ trợ cả anon key (cũ) và publishable key (Supabase 2024+)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

// Tạo client chỉ khi có config thật
export const isSupabaseEnabled = !!(supabaseUrl && supabaseAnonKey);

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

export const DEMO_USERS = [
  { email: "admin@mimin.vn", password: "admin123", role: "admin", name: "Nguyễn Văn An", title: "Quản trị viên" },
  { email: "planner@mimin.vn", password: "planner123", role: "planner", name: "Trần Thị Bình", title: "Chuyên viên kế hoạch" },
  { email: "warehouse@mimin.vn", password: "warehouse123", role: "warehouse", name: "Lê Văn Cường", title: "Quản lý kho" },
  { email: "sewing@mimin.vn", password: "sewing123", role: "sewing", name: "Phạm Thị Dung", title: "Tổ trưởng may" },
  { email: "qc@mimin.vn", password: "qc123", role: "qc", name: "Hoàng Minh Đức", title: "Kiểm tra chất lượng" },
  { email: "finishing@mimin.vn", password: "finishing123", role: "finishing", name: "Đỗ Thị Hương", title: "Tổ trưởng hoàn thiện" },
  { email: "accountant@mimin.vn", password: "accountant123", role: "accountant", name: "Bùi Văn Hùng", title: "Kế toán" },
];

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
