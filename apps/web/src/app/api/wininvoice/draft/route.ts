// WinInvoice Draft Invoice API
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { saveWinDraftInvoice, buildWininvoicePayload } from "@/lib/wininvoice";
import { type DonHangForInvoice } from "@/lib/meinvoice"; // reusing the type

const WIN_ID = "wininvoice";

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    if (!supabaseAdmin) return NextResponse.json({ ok: false, error: "Supabase chưa được cấu hình" }, { status: 500 });
    const body = await req.json();
    const { donHang, invTemplateNo, invSeries, invDate, refId, refIdDonHang, nguoiTao } = body;

    if (!donHang || !invTemplateNo || !invSeries || !invDate || !refId) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: config, error: cfgErr } = await supabaseAdmin
      .from("meinvoice_config")
      .select("*")
      .eq("id", WIN_ID)
      .single();

    if (cfgErr || !config) {
      return NextResponse.json({ ok: false, error: "Chưa cấu hình WinInvoice" }, { status: 400 });
    }

    const randomRefId = crypto.randomUUID();
    const invoiceData = buildWininvoicePayload(
      donHang as DonHangForInvoice,
      invTemplateNo,
      invSeries,
      invDate,
      randomRefId,
      true // isDraft
    );

    const result = await saveWinDraftInvoice(config, invoiceData);
    const duration = Date.now() - start;

    if (!result || result.isSuccess === false) {
      const errMsg = result?.errorMessage || result?.message || "WinInvoice API lỗi.";
      return NextResponse.json(
        { ok: false, error: errMsg },
        { status: 500 }
      );
    }

    // Success - save to DB
    const hoaDon = {
      id: result.invcCode || randomRefId, // Assuming result returns some code for draft
      transaction_id: result.invcCode || null,
      ref_id: randomRefId,
      inv_no: result.invNumber || null,
      inv_series: invSeries,
      inv_date: invDate,
      buyer_legal_name: donHang.tenKH,
      buyer_tax_code: donHang.mstKH || "",
      buyer_address: donHang.diaChiKH || "",
      buyer_phone: donHang.sdtKH || "",
      buyer_email: donHang.emailKH || "",
      total_amount: invoiceData.invSubTotal,
      vat_amount: invoiceData.invVatAmount,
      total_with_vat: invoiceData.invTotalAmount,
      currency: "VND",
      status: "draft" as const,
      publish_status: 0,
      einvoice_data: result,
      nguoi_tao: nguoiTao || null,
      nguoi_cap_nhat: nguoiTao || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertErr } = await supabaseAdmin.from("hoa_don_dien_tu").insert(hoaDon);
    
    if (refIdDonHang) {
       await supabaseAdmin.from("don_hang").update({ invoice_id: hoaDon.id, invoice_status: "draft" }).eq("id", refIdDonHang);
    }
    
    await supabaseAdmin.from("hoa_don_log").insert({
      hoa_don_id: hoaDon.id,
      action: "draft",
      endpoint: "invoice/add_type_2",
      request_body: invoiceData,
      response_status: 200,
      response_body: result,
      duration_ms: duration,
      user_email: nguoiTao,
    });

    return NextResponse.json({ ok: true, data: hoaDon });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
