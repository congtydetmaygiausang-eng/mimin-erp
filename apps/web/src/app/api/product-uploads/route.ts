// POST /api/product-uploads - upload ảnh/video sản phẩm lên bucket public
// "san-pham-media" (không phải dữ liệu nhạy cảm, khác employee-uploads dùng
// bucket private). Trả về URL công khai vĩnh viễn, lưu thẳng URL này vào
// dsMau[].img/imgQuan/video/hinhAnhChiTiet - KHÔNG được nhúng base64 (readAsDataURL)
// thẳng vào cột JSONB như code cũ, vì mỗi ảnh vài trăm KB - vài MB nhân với
// nhiều màu/nhiều sản phẩm làm bảng san_pham phình to tới mức query "SELECT *"
// bị Postgres huỷ do statement timeout (đã đo thực tế: 9+ giây rồi timeout).
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string | null) || "khac";

    if (!file) {
      return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 40) || "khac";
    const safeName = (file.name || "file").replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_.-]+/g, "");
    const path = `${safeFolder}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from("san-pham-media").upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from("san-pham-media").getPublicUrl(path);
    return NextResponse.json({ url: publicData.publicUrl });
  } catch (error) {
    console.error("product-upload-error", error);
    return NextResponse.json({ error: "Không thể upload file" }, { status: 500 });
  }
}
