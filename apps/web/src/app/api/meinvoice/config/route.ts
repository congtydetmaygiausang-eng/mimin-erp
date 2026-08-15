// MeInvoice Config API - GET/PUT credentials + cached token
// 2026-08-09 - Mavis
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

const DEFAULT_ID = "default";

export async function GET() {
  try {
    if (!supabase) return NextResponse.json({ ok: false, error: "Supabase chưa được cấu hình" }, { status: 500 });
    const { data, error } = await supabase
      .from("meinvoice_config")
      .select("*")
      .eq("id", DEFAULT_ID)
      .single();
    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ ok: true, config: null });
    }
    // Mask password for security
    const masked = {
      ...data,
      password_enc: data.password_enc ? "******" : "",
      // Hide last_token from frontend
      last_token: data.last_token ? "******" : "",
    };
    return NextResponse.json({ ok: true, config: masked });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ ok: false, error: "Supabase chưa được cấu hình" }, { status: 500 });
    const body = await req.json();
    const { app_id, tax_code, username, password, env, sign_type } = body;
    if (!app_id || !tax_code || !username || !password) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: app_id, tax_code, username, password" },
        { status: 400 }
      );
    }
    // Check if password is masked (no change)
    const update: any = {
      id: DEFAULT_ID,
      app_id,
      tax_code,
      username,
      env: env || "test",
      sign_type: sign_type || 2,
      updated_at: new Date().toISOString(),
    };
    if (password !== "******") {
      // TODO: encrypt password in production
      update.password_enc = password;
    }

    const { data, error } = await supabase
      .from("meinvoice_config")
      .upsert(update, { onConflict: "id" })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, config: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
