// API: GET (list all users) + POST (create new user) - admin only
// 2026-08-05 - Mavis
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/users - list all users tu bang users (custom) + auth.users
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase Admin chua cau hinh" }, { status: 500 });
  }

  try {
    // Lay tu bang users (custom) - co role, phongBan, chucVu
    const { data: profiles, error: profileErr } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role, \"chucVu\", \"phongBan\", \"isActive\", \"maNV\", \"created_at\", \"updated_at\"")
      .order("role", { ascending: true })
      .order("email", { ascending: true });

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({ users: profiles || [], count: profiles?.length || 0 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/admin/users - tao user moi (auth.users + bang users)
// Body: { email, password, name, role, chucVu, phongBan, maNV }
export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase Admin chua cau hinh" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { email, password, name, role, chucVu, phongBan, maNV } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Thieu email/password/name/role" }, { status: 400 });
    }

    // 1. Tao user trong auth.users (dung service role)
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role },
      app_metadata: { role, provider: "email", providers: ["email"] },
    });

    if (authErr || !authData.user) {
      return NextResponse.json({ error: authErr?.message || "Tao auth user that bai" }, { status: 500 });
    }

    const authId = authData.user.id;

    // 2. Upsert vao bang users (custom)
    const { error: profileErr } = await supabaseAdmin.from("users").upsert({
      id: authId,
      email,
      name,
      role,
      chucVu: chucVu || role,
      phongBan: phongBan || "khac",
      maNV: maNV || null,
      isActive: true,
    });

    if (profileErr) {
      // Rollback: xoa auth user neu upsert that bai
      await supabaseAdmin.auth.admin.deleteUser(authId);
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      user: { id: authId, email, name, role, chucVu, phongBan, maNV },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
