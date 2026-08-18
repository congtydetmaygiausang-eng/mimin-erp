import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

// Chỉ tạo "link upload có chữ ký" rồi trả về cho trình duyệt tự đẩy file thẳng
// lên Supabase Storage. KHÔNG cho file video chạy qua route này nữa - Vercel
// giới hạn body request ~4.5MB nên video vài chục giây là upload treo/lỗi.
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase service role không được cấu hình" }, { status: 500 });
    }

    const { path } = await request.json();
    if (!path) {
      return NextResponse.json({ error: "Thiếu path" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.storage.from("bang-tin-video").createSignedUploadUrl(path);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ token: data.token, path: data.path });
  } catch (error) {
    console.error("bang-tin-upload-error", error);
    return NextResponse.json({ error: "Không thể tạo link upload video" }, { status: 500 });
  }
}
