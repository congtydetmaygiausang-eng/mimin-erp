import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getWinAuthHeaders } from "@/lib/wininvoice";

const WIN_ID = "wininvoice";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { email } = await req.json();
    if (!email) throw new Error("Vui lòng cung cấp email");

    const { data: config } = await supabaseAdmin.from("meinvoice_config").select("*").eq("id", WIN_ID).single();
    if (!config) throw new Error("Chưa cấu hình WinInvoice");

    const { data: hoaDon } = await supabaseAdmin.from("hoa_don_dien_tu").select("*").eq("id", id).single();
    if (!hoaDon) throw new Error("Không tìm thấy hóa đơn");

    const payload = {
      invRef: hoaDon.ref_id,
      sendTo: email,
      updateMail: 1
    };

    const url = config.env === "live" 
      ? "https://quanly.wininvoice.vn/api/mailer/send_inv_mail"
      : "https://demo.evat.vn/api/mailer/send_inv_mail";

    const r = await fetch(url, {
      method: "POST",
      headers: getWinAuthHeaders(config),
      body: JSON.stringify(payload)
    });

    const resData = await r.json();
    if (!resData || resData.status === "ERROR") {
      throw new Error(resData?.message || "Gửi email qua WinInvoice thất bại");
    }

    return NextResponse.json({ ok: true, data: resData });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
