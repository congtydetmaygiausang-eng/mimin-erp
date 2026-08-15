// MeInvoice Download Invoice API - tai PDF hoac XML
// 2026-08-09 - Mavis
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { downloadInvoice } from "@/lib/meinvoice";

const DEFAULT_ID = "default";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const start = Date.now();
  try {
    if (!supabase) return NextResponse.json({ ok: false, error: "Supabase chưa được cấu hình" }, { status: 500 });
    const { id } = await params;
    const format = (req.nextUrl.searchParams.get("format") || "pdf") as "pdf" | "xml";

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
        { ok: false, error: "Hóa đơn chưa phát hành, không thể tải" },
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

    const blob = await downloadInvoice(config, hoaDon.transaction_id, format);
    if (!blob) {
      await supabase.from("hoa_don_log").insert({
        hoa_don_id: id,
        action: "download",
        endpoint: "invoice/download",
        request_body: { format },
        response_status: 500,
        response_body: null,
        error_msg: "Download failed",
        duration_ms: Date.now() - start,
      });
      return NextResponse.json(
        { ok: false, error: "Tải hóa đơn thất bại" },
        { status: 500 }
      );
    }

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = `HoaDon_${hoaDon.inv_no || id}.${format}`;
    const contentType =
      format === "pdf"
        ? "application/pdf"
        : "application/xml";

    await supabase.from("hoa_don_log").insert({
      hoa_don_id: id,
      action: "download",
      endpoint: "invoice/download",
      request_body: { format },
      response_status: 200,
      response_body: { size: buffer.length, filename },
      error_msg: null,
      duration_ms: Date.now() - start,
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
