// API: PATCH (update) + DELETE (xoa user) - admin only
// 2026-08-05 - Mavis
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

// PATCH /api/admin/users/[id] - cap nhat user
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase Admin chua cau hinh" }, { status: 500 });
  }

  const { id: userId } = await params;
  try {
    const body = await req.json();
    const updateData: any = {};

    // Chi update cac field co trong bang users
    if (body.name !== undefined) updateData.name = body.name;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.chucVu !== undefined) updateData.chucVu = body.chucVu;
    if (body.phongBan !== undefined) updateData.phongBan = body.phongBan;
    if (body.maNV !== undefined) updateData.maNV = body.maNV;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin.from("users").update(updateData).eq("id", userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Dong bo role vao auth.users.app_metadata
    if (body.role !== undefined) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { role: body.role, provider: "email", providers: ["email"] },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - xoa user
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase Admin chua cau hinh" }, { status: 500 });
  }

  const { id: userId } = await params;

  // Khong cho xoa chinh minh
  if (userId === auth.caller.id) {
    return NextResponse.json({ error: "Không thể tự xoá tài khoản của chính mình" }, { status: 400 });
  }

  try {
    // 1. Xoa khoi bang users (custom) truoc
    const { error: profileErr } = await supabaseAdmin.from("users").delete().eq("id", userId);
    if (profileErr) {
      return NextResponse.json({ error: "Xoa profile that bai: " + profileErr.message }, { status: 500 });
    }

    // 2. Xoa khoi auth.users
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) {
      return NextResponse.json({ error: "Xoa auth that bai: " + authErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
