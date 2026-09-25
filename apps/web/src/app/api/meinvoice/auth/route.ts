// MeInvoice Auth API - test connection + get fresh token
// 2026-08-09 - Mavis
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getMeInvoiceToken } from "@/lib/meinvoice";

const DEFAULT_ID = "default";

export async function POST() {
  const start = Date.now();
  try {
    if (!supabaseAdmin) return NextResponse.json({ ok: false, error: "Supabase chưa được cấu hình" }, { status: 500 });
    const { data: config, error: cfgErr } = await supabaseAdmin
      .from("meinvoice_config")
      .select("*")
      .eq("id", DEFAULT_ID)
      .single();
    if (cfgErr || !config) {
      return NextResponse.json(
        { ok: false, error: "Chưa cấu hình MeInvoice. Vào Settings để nhập credentials." },
        { status: 400 }
      );
    }
    if (config.app_id === "PENDING_APP_ID") {
      return NextResponse.json(
        { ok: false, error: "AppID chưa được cấu hình. Vào Settings → Nhập AppID từ MISA." },
        { status: 400 }
      );
    }

    // Force fresh token (skip cache)
    const BASE_URLS = {
      test: "https://testapi.meinvoice.vn/api/integration",
      live: "https://api.meinvoice.vn/api/integration",
    };
    const url = `${BASE_URLS[config.env as "test" | "live"]}/auth/token`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appid: config.app_id,
        taxcode: config.tax_code,
        username: config.username,
        password: config.password_enc,
      }),
    });
    const json = await r.json();
    const duration = Date.now() - start;

    const isSuccess = json.Success !== undefined ? json.Success : json.success;
    const errorCode = json.ErrorCode !== undefined ? json.ErrorCode : json.errorCode;
    const errors = json.Errors !== undefined ? json.Errors : json.errors;
    const data = json.Data !== undefined ? json.Data : json.data;

    // Log to audit
    await supabaseAdmin.from("hoa_don_log").insert({
      hoa_don_id: null,
      action: "auth",
      endpoint: url,
      request_body: { appid: config.app_id, taxcode: config.tax_code, username: config.username },
      response_status: r.status,
      response_body: json,
      error_msg: isSuccess ? null : errorCode || errors,
      duration_ms: duration,
      user_email: "system",
    });

    if (isSuccess && data) {
      // Cache token (14 days)
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from("meinvoice_config")
        .update({ last_token: data, token_expires_at: expiresAt })
        .eq("id", DEFAULT_ID);

      return NextResponse.json({
        ok: true,
        token_preview: json.Data.substring(0, 20) + "...",
        expires_at: expiresAt,
        env: config.env,
        duration_ms: duration,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: errors || errorCode || "Auth failed",
        errorCode: errorCode,
        duration_ms: duration,
      },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
