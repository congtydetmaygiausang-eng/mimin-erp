// MeInvoice Create Invoice API - tao + phat hanh hoa don
// 2026-08-09 - Mavis
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { createAndPublishInvoice, buildInvoiceFromDonHang, type DonHangForInvoice } from "@/lib/meinvoice";

const DEFAULT_ID = "default";

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = await req.json();
    const { donHang, invSeries, invDate, refId, refIdDonHang, refIdKhachHang, nguoiTao } = body;

    if (!donHang || !invSeries || !invDate || !refId) {
      return NextResponse.json(
        { ok: false, error: "Missing: donHang, invSeries, invDate, refId" },
        { status: 400 }
      );
    }

    // Load config
    const { data: config, error: cfgErr } = await supabase
      .from("meinvoice_config")
      .select("*")
      .eq("id", DEFAULT_ID)
      .single();
    if (cfgErr || !config) {
      return NextResponse.json(
        { ok: false, error: "Chưa cấu hình MeInvoice" },
        { status: 400 }
      );
    }
    if (config.app_id === "PENDING_APP_ID") {
      return NextResponse.json(
        { ok: false, error: "AppID chưa cấu hình. Vào Settings." },
        { status: 400 }
      );
    }

    // Build invoice payload
    const invoiceData = buildInvoiceFromDonHang(
      donHang as DonHangForInvoice,
      invSeries,
      invDate,
      refId
    );

    // Call MeInvoice API
    const result = await createAndPublishInvoice(config, invoiceData);
    const duration = Date.now() - start;

    if (!result) {
      return NextResponse.json(
        { ok: false, error: "MeInvoice API không phản hồi. Kiểm tra credentials + network." },
        { status: 500 }
      );
    }

    if (result.ErrorCode && result.ErrorCode !== "0") {
      // Save log + error
      await supabase.from("hoa_don_log").insert({
        hoa_don_id: refId,
        action: "create",
        endpoint: "invoice",
        request_body: invoiceData,
        response_status: 400,
        response_body: result,
        error_msg: result.ErrorMessage || result.ErrorCode,
        duration_ms: duration,
        user_email: nguoiTao,
      });
      return NextResponse.json(
        { ok: false, error: result.ErrorMessage || result.ErrorCode, errorCode: result.ErrorCode },
        { status: 400 }
      );
    }

    // Success - save to DB
    const hoaDon = {
      id: result.TransactionID || refId,
      transaction_id: result.TransactionID,
      ref_id: refId,
      inv_no: result.InvNo,
      inv_series: invSeries,
      inv_date: invDate,
      buyer_legal_name: donHang.tenKH,
      buyer_tax_code: donHang.mstKH || "",
      buyer_address: donHang.diaChiKH || "",
      buyer_phone: donHang.sdtKH || "",
      buyer_email: donHang.emailKH || "",
      total_amount: invoiceData.TotalAmountWithoutVATOC,
      vat_amount: invoiceData.TotalVATAmountOC,
      total_with_vat: invoiceData.TotalAmountOC,
      currency: "VND",
      status: "issued" as const,
      publish_status: 1,
      einvoice_data: result,
      original_invoice_detail: invoiceData.OriginalInvoiceDetail,
      ref_id_don_hang: refIdDonHang,
      ref_id_khach_hang: refIdKhachHang,
      nguoi_tao: nguoiTao,
      issued_at: new Date().toISOString(),
    };
    const { data: saved, error: saveErr } = await supabase
      .from("hoa_don_dien_tu")
      .upsert(hoaDon, { onConflict: "id" })
      .select()
      .single();
    if (saveErr) {
      console.error("[meinvoice] save to DB error:", saveErr);
    }

    // Audit log
    await supabase.from("hoa_don_log").insert({
      hoa_don_id: saved?.id || refId,
      action: "create",
      endpoint: "invoice",
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
      invNo: result.InvNo,
      invSeries: result.InvSeries,
      transactionId: result.TransactionID,
      duration_ms: duration,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
