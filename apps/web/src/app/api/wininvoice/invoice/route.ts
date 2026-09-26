// WinInvoice Create/Publish API
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { saveWinDraftInvoice, buildWininvoicePayload } from "@/lib/wininvoice";
import { type DonHangForInvoice } from "@/lib/meinvoice"; 

const WIN_ID = "wininvoice";

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    if (!supabaseAdmin) return NextResponse.json({ ok: false, error: "Supabase chưa được cấu hình" }, { status: 500 });
    const body = await req.json();
    const { donHang, invTemplateNo, invSeries, invDate, refId, refIdDonHang, refIdKhachHang, nguoiTao } = body;

    if (!donHang || !invTemplateNo || !invSeries || !invDate || !refId) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const { data: config, error: cfgErr } = await supabaseAdmin
      .from("meinvoice_config")
      .select("*")
      .eq("id", WIN_ID)
      .single();

    if (cfgErr || !config) {
      return NextResponse.json({ ok: false, error: "Chưa cấu hình WinInvoice" }, { status: 400 });
    }

    const invoiceData = buildWininvoicePayload(
      donHang as DonHangForInvoice,
      invTemplateNo,
      invSeries,
      invDate,
      refId,
      false // isDraft = false => AutoSign = 1
    );

    const result = await saveWinDraftInvoice(config, invoiceData);
    const duration = Date.now() - start;

    if (!result || result.status === 'ERROR') {
      await supabaseAdmin.from("hoa_don_log").insert({
        hoa_don_id: refId,
        action: "create",
        endpoint: "invoice/add_type_2",
        request_body: invoiceData,
        response_status: 400,
        response_body: result,
        error_msg: result?.message || "Lỗi WinInvoice",
        duration_ms: duration,
        user_email: nguoiTao,
      });
      return NextResponse.json({ ok: false, error: result?.message || "WinInvoice API lỗi" }, { status: 400 });
    }

    // Success - save to DB
    const hoaDon = {
      id: result.invcCode || refId,
      transaction_id: result.invcCode || null,
      ref_id: refId,
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
      status: "issued" as const,
      publish_status: 1,
      einvoice_data: result,
      ref_id_don_hang: refIdDonHang,
      ref_id_khach_hang: refIdKhachHang,
      nguoi_tao: nguoiTao,
      issued_at: new Date().toISOString(),
    };

    const { data: saved, error: saveErr } = await supabaseAdmin
      .from("hoa_don_dien_tu")
      .upsert(hoaDon, { onConflict: "id" })
      .select()
      .single();

    if (saveErr) console.error("[wininvoice] save to DB error:", saveErr);

    await supabaseAdmin.from("hoa_don_log").insert({
      hoa_don_id: saved?.id || refId,
      action: "create",
      endpoint: "invoice/add_type_2",
      request_body: invoiceData,
      response_status: 200,
      response_body: result,
      error_msg: null,
      duration_ms: duration,
      user_email: nguoiTao,
    });

    return NextResponse.json({
      ok: true,
      hoaDon: saved,
      invNo: result.invNumber,
      invSeries: invSeries,
      transactionId: result.invcCode,
      duration_ms: duration,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
