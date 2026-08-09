// MeInvoice Auth API - test connection + get fresh token
// 2026-08-09 - Mavis
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { getMeInvoiceToken } from "@/lib/meinvoice";

const DEFAULT_ID = "default";

export async function POST() {
  const start = Date.now();
  try {
    const { data: config, error: cfgErr } = await supabase
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

    // Log to audit
    await supabase.from("hoa_don_log").insert({
      hoa_don_id: null,
      action: "auth",
      endpoint: url,
      request_body: { appid: config.app_id, taxcode: config.tax_code, username: config.username },
      response_status: r.status,
      response_body: json,
      error_msg: json.Success ? null : json.ErrorCode || json.Errors,
      duration_ms: duration,
      user_email: "system",
    });

    if (json.Success && json.Data) {
      // Cache token (14 days)
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from("meinvoice_config")
        .update({ last_token: json.Data, token_expires_at: expiresAt })
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
        error: json.Errors || json.ErrorCode || "Auth failed",
        errorCode: json.ErrorCode,
        duration_ms: duration,
      },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
