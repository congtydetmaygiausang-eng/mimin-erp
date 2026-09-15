import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const fallbackUrl = supabaseUrl || "https://ejcuqyaiwabfygyesvxj.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || "sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd";

// Client này có quyền admin, KHÔNG dùng trên browser
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Dùng cho các tool AI chỉ đọc. Production ưu tiên service-role; local không có
// secret vẫn đọc được dữ liệu mà RLS cho phép bằng publishable key, giống các tab UI.
// Tuyệt đối không dùng client này để ghi/xóa dữ liệu.
export const supabaseRead = supabaseAdmin || createClient(fallbackUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
