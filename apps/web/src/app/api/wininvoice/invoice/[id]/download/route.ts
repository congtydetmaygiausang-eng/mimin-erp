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
    
    // Debug log to see actual response structure
    console.log("[wininvoice/download] API response:", JSON.stringify(resData));
    
    // WinInvoice dung 'isSuccess' chu khong phai 'status'
    if (!resData || resData.isSuccess === false) {
      const errMsg = resData?.errorMessage || resData?.message || "Lấy link PDF thất bại";
      throw new Error(errMsg);
    }

    // WinInvoice get_link_byref trả về field 'link' hoặc 'data'
    const pdfUrl: string | null =
      typeof resData === "string" ? resData :
      typeof resData.link === "string" ? resData.link :
      typeof resData.data === "string" ? resData.data :
      typeof resData.data?.link === "string" ? resData.data.link :
      typeof resData.result === "string" ? resData.result : null;

    if (!pdfUrl) {
      throw new Error(`Không tìm thấy URL PDF trong response: ${JSON.stringify(resData)}`);
    }

    return NextResponse.json({ ok: true, url: pdfUrl });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
