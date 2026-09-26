import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getWinAuthHeaders } from "@/lib/wininvoice";

export async function POST() {
  const start = Date.now();
  try {
    if (!supabaseAdmin) throw new Error("Supabase chưa được cấu hình");

    const { data: config, error: cfgErr } = await supabaseAdmin
      .from("meinvoice_config")
      .select("*")
      .eq("id", "wininvoice")
      .single();

    if (cfgErr || !config) throw new Error("Chưa cấu hình WinInvoice");

    const url = config.env === "live" 
      ? "https://quanly.wininvoice.vn/api/invoice/check_signed"
      : "https://demo.evat.vn/api/invoice/check_signed";

    const r = await fetch(url, {
      method: "POST",
      headers: getWinAuthHeaders(config),
      body: JSON.stringify({ invRef: "TEST_AUTH_123", invName: "1", invSerial: "C24TAA" })
    });

    // If HTTP status is 401, it's definitely an auth error
    if (r.status === 401) {
      throw new Error("Xác thực thất bại (Sai API Username hoặc API Password)");
    }

    const duration = Date.now() - start;
    return NextResponse.json({ ok: true, env: config.env, duration_ms: duration });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
