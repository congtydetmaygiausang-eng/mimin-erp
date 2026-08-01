import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Next.js 15 + output: export cần generateStaticParams cho dynamic routes
// Return 1 placeholder để build pass
export function generateStaticParams() {
  return [{ id: "_" }];
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase Admin is not configured" }, { status: 500 });
  const id = (await params).id;
  try {
    const body = await req.json();
    const { name, role, phongBan, chucVu, sdt, password } = body;

    const updates: any = {
      user_metadata: { name, role, phongBan, chucVu, sdt }
    };
    if (password) {
      updates.password = password;
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updates);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data.user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase Admin is not configured" }, { status: 500 });
  const id = (await params).id;
  try {
    const body = await req.json();
    const { action, password } = body; // action = "toggle_status" | "reset_password"

    if (action === "toggle_status") {
      const { status } = body; // "active" or "disabled"
      const banDuration = status === "disabled" ? "876000h" : "none"; // 100 years or remove ban
      
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
        ban_duration: banDuration,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json(data.user);
    } 
    
    if (action === "reset_password") {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: password,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase Admin is not configured" }, { status: 500 });
  const id = (await params).id;
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
