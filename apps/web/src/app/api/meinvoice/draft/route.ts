// MeInvoice Draft Invoice API
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { saveDraftInvoice, buildInvoiceFromDonHang, getInvoiceTemplates, type DonHangForInvoice } from "@/lib/meinvoice";

const DEFAULT_ID = "default";

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    if (!supabaseAdmin) return NextResponse.json({ ok: false, error: "Supabase chưa được cấu hình" }, { status: 500 });
    const body = await req.json();
    const { donHang, invTemplateNo, invSeries, invoiceTemplateId, invDate, refId, refIdDonHang, refIdKhachHang, nguoiTao } = body;

    if (!donHang || !invTemplateNo || !invSeries || !invDate || !refId) {
      return NextResponse.json(
        { ok: false, error: "Missing: donHang, invTemplateNo, invSeries, invDate, refId" },
        { status: 400 }
      );
    }

    // Load config
    const { data: config, error: cfgErr } = await supabaseAdmin
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

    let templateId = invoiceTemplateId || "00000000-0000-0000-0000-000000000000";
    try {
      const templates = await getInvoiceTemplates(config);
      if (templates && templates.length > 0) {
        console.log("[meinvoice] First template keys:", Object.keys(templates[0]));
        const template = templates.find((t: any) => t.InvTemplateNo === invTemplateNo && t.InvSeries === invSeries);
        if (template) {
          templateId = template.InvoiceTemplateID || template.TemplateID || template.IPTemplateID || templateId;
          console.log("[meinvoice] Found templateId:", templateId);
        }
      }
    } catch (e) {
      console.warn("Could not get invoice templates, using default empty GUID");
    }

    // RefID MUST be a valid GUID for invoiceweb/insert
    const randomRefId = crypto.randomUUID();

    // Build invoice payload
    const invoiceData = buildInvoiceFromDonHang(
      donHang as DonHangForInvoice,
      invTemplateNo,
      invSeries,
      invDate,
      randomRefId
    );

    // Call MeInvoice API
    const result = await saveDraftInvoice(config, invoiceData);
    const duration = Date.now() - start;

    if (!result) {
      return NextResponse.json(
        { ok: false, error: "MeInvoice API không phản hồi. Kiểm tra credentials + network." },
        { status: 500 }
      );
    }

    // Success - save to DB
    const hoaDon = {
      id: result.TransactionID || refId,
      transaction_id: result.TransactionID || null,
      ref_id: refId,
      inv_no: result.InvNo || null,
      inv_series: result.InvSeries || invSeries,
      inv_date: invDate,
      buyer_legal_name: donHang.tenKH,
      buyer_tax_code: donHang.mstKH || "",
      buyer_address: donHang.diaChiKH || "",
      buyer_phone: donHang.sdtKH || "",
      buyer_email: donHang.emailKH || "",
      total_amount: invoiceData.TotalSaleAmountOC,
      vat_amount: invoiceData.TotalVATAmountOC,
      total_with_vat: invoiceData.TotalAmountOC,
      currency: "VND",
      status: "draft" as const, // Draft state
      publish_status: 0,
      einvoice_data: result,
      nguoi_tao: nguoiTao || null,
      nguoi_cap_nhat: nguoiTao || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertErr } = await supabaseAdmin.from("hoa_don_dien_tu").insert(hoaDon);
    
    // Save to don_hang as well
    if (refIdDonHang) {
       await supabaseAdmin
         .from("don_hang")
         .update({ invoice_id: hoaDon.id, invoice_status: "draft" })
         .eq("id", refIdDonHang);
    }
    
    if (insertErr) {
      console.error("[meinvoice] draft DB insert error:", insertErr);
    }

    // Save log
    await supabaseAdmin.from("hoa_don_log").insert({
      hoa_don_id: hoaDon.id,
      action: "draft",
      endpoint: "invoiceweb/insert",
      request_body: invoiceData,
      response_status: 200,
      response_body: result,
      duration_ms: duration,
      user_email: nguoiTao,
    });

    return NextResponse.json({ 
      ok: true, 
      data: hoaDon
    });
  } catch (err: any) {
    const errorMsg = err.message || err.toString();
    console.error("[meinvoice] post draft exception:", errorMsg);
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
