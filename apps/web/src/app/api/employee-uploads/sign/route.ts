// POST /api/employee-uploads/sign - ký lại URL tạm cho các path trong bucket
// employee-documents (private - ảnh CCCD). Dùng service role vì bucket không
// cho phép getPublicUrl() và trang Nhân sự đọc danh sách nhân viên thẳng từ
// client (nhan-su-store.tsx), không có sẵn quyền service role ở đó.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase service role không được cấu hình" }, { status: 500 });
    }

    const body = await request.json().catch(() => null);
    const paths = Array.isArray(body?.paths) ? (body.paths as unknown[]).filter((p): p is string => typeof p === "string" && p.length > 0) : [];
    if (!paths.length) return NextResponse.json({ urls: {} });

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.storage.from("employee-documents").createSignedUrls(Array.from(new Set(paths)), 3600);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const urls: Record<string, string> = {};
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
    }
    return NextResponse.json({ urls });
  } catch (error) {
    console.error("employee-uploads-sign-error", error);
    return NextResponse.json({ error: "Không thể tạo URL xem ảnh" }, { status: 500 });
  }
}
