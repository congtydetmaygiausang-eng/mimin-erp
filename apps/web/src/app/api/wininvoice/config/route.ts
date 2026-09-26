import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ ok: false }, { status: 500 });
  const { data } = await supabaseAdmin.from("meinvoice_config").select("*").eq("id", "wininvoice").single();
  return NextResponse.json({ ok: true, config: data });
}

export async function PUT(req: Request) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false }, { status: 500 });
  try {
    const { username, password, env, default_template, sign_type, tax_code, app_id } = await req.json();
    const update: any = { username, env, default_template, sign_type, tax_code, app_id };
    if (password && password !== "******") update.password_enc = password;
    
    const { data, error } = await supabaseAdmin
      .from("meinvoice_config")
      .upsert({ id: "wininvoice", ...update }, { onConflict: "id" })
      .select()
      .single();
      
    if (error) throw error;
    return NextResponse.json({ ok: true, config: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
