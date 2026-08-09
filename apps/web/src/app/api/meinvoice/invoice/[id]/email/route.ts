// MeInvoice Send Email API - gui hoa don qua email
// 2026-08-09 - Mavis
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { sendInvoiceEmail } from "@/lib/meinvoice";

const DEFAULT_ID = "default";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const start = Date.now();
  try {
    const { id } = params;
    const body = await req.json();
    const { email, nguoiTao } = body;
    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
    }
    const { data: hoaDon, error: dbErr } = await supabase
      .from("hoa_don_dien_tu")
      .select("*")
      .eq("id", id)
      .single();
    if (dbErr || !hoaDon) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy hóa đơn" },
        { status: 404 }
      );
    }
    if (!hoaDon.transaction_id) {
      return NextResponse.json(
        { ok: false, error: "Hóa đơn chưa phát hành" },
        { status: 400 }
      );
    }
    const { data: config } = await supabase
      .from("meinvoice_config")
      .select("*")
      .eq("id", DEFAULT_ID)
      .single();
    if (!config || config.app_id === "PENDING_APP_ID") {
      return NextResponse.json(
        { ok: false, error: "Chưa cấu hình MeInvoice" },
        { status: 400 }
      );
    }

    const success = await sendInvoiceEmail(config, hoaDon.transaction_id, email);
    const duration = Date.now() - start;

    await supabase.from("hoa_don_log").insert({
      hoa_don_id: id,
      action: "sendemail",
      endpoint: "invoice/sendemail",
      request_body: { email },
      response_status: success ? 200 : 500,
      response_body: { success },
      error_msg: success ? null : "Send email failed",
      duration_ms: duration,
      user_email: nguoiTao,
    });

    return NextResponse.json({ ok: success, duration_ms: duration });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
