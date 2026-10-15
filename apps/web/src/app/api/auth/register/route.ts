import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Dữ liệu gửi lên không hợp lệ" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const name = (body.name || "").trim() || email.split("@")[0];

  if (!email) {
    return NextResponse.json({ ok: false, error: "Vui lòng nhập email" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Định dạng email không hợp lệ" }, { status: 400 });
  }

  if (!password || password.length < 6) {
    return NextResponse.json({ ok: false, error: "Mật khẩu phải có ít nhất 6 ký tự" }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { ok: false, error: "Hệ thống chưa cấu hình kết nối Supabase Admin" },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Tự động kích hoạt tài khoản ngay lập tức (không cần chờ link email)
      user_metadata: {
        full_name: name,
        has_set_password: true,
      },
      app_metadata: {
        provider: "email",
        providers: ["email"],
      },
    });

    if (error) {
      if (
        error.message?.toLowerCase().includes("already been registered") ||
        error.message?.toLowerCase().includes("already registered") ||
        error.message?.toLowerCase().includes("already exists")
      ) {
        return NextResponse.json(
          { ok: false, error: "Email này đã được đăng ký tài khoản. Vui lòng đăng nhập." },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ ok: false, error: "Không tạo được tài khoản" }, { status: 500 });
    }

    // Đảm bảo có record trong bảng public.users nếu trigger chưa chạy
    try {
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (!existingUser) {
        await supabaseAdmin.from("users").insert({
          id: data.user.id,
          email,
          name,
          role: "user",
          chucVu: "Nhân viên mới (Cần cập nhật)",
          phongBan: "ban-hanh-chinh",
          isActive: true,
          created_at: new Date().toISOString(),
        });
      }
    } catch (insertErr) {
      console.warn("[register] Không thể insert public.users:", insertErr);
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
      },
    });
  } catch (err) {
    console.error("[register] Lỗi hệ thống:", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Lỗi hệ thống khi đăng ký" },
      { status: 500 }
    );
  }
}
