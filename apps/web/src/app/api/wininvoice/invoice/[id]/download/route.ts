import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getWinAuthHeaders } from "@/lib/wininvoice";

const WIN_ID = "wininvoice";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!supabaseAdmin) throw new Error("Missing supabaseAdmin");

    const { data: config } = await supabaseAdmin.from("meinvoice_config").select("*").eq("id", WIN_ID).single();
    if (!config) throw new Error("Chưa cấu hình WinInvoice");

    const { data: hoaDon } = await supabaseAdmin.from("hoa_don_dien_tu").select("*").eq("id", id).single();
    if (!hoaDon) throw new Error("Không tìm thấy hóa đơn");

    // Removed draft check to see if WinInvoice supports draft PDF downloading

    const payload = {
      invRef: hoaDon.ref_id,
      invSign: hoaDon.inv_series,
      invName: hoaDon.einvoice_data?.invName || "1",
      pdf: 1
    };

    const url = config.env === "live" 
      ? "https://quanly.wininvoice.vn/api/invoice/get_link_byref"
      : "https://demo.evat.vn/api/invoice/get_link_byref";

    const r = await fetch(url, {
      method: "POST",
      headers: getWinAuthHeaders(config),
      body: JSON.stringify(payload)
    });

    const resData = await r.json();
    if (!resData || resData.status === "ERROR") {
      throw new Error(resData?.message || "Lấy link PDF thất bại");
    }

    // resData.link is expected to contain the download link
    const pdfUrl = resData.link || resData.data?.link || resData;

    return NextResponse.json({ ok: true, url: pdfUrl });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
