// MeInvoice Invoice [id] API - get status / delete (draft)
// 2026-08-09 - Mavis
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { getInvoiceStatus } from "@/lib/meinvoice";

const DEFAULT_ID = "default";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const start = Date.now();
  try {
    if (!supabase) return NextResponse.json({ ok: false, error: "Supabase chưa được cấu hình" }, { status: 500 });
    const { id } = await params;
    // Load from DB first
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

    // Optional: refresh status from MeInvoice
    const { data: config } = await supabase
      .from("meinvoice_config")
      .select("*")
      .eq("id", DEFAULT_ID)
      .single();
    if (config && config.app_id !== "PENDING_APP_ID" && hoaDon.transaction_id) {
      const liveStatus = await getInvoiceStatus(config, hoaDon.transaction_id);
      if (liveStatus) {
        // Update local status
        await supabase
          .from("hoa_don_dien_tu")
          .update({
            einvoice_data: { ...hoaDon.einvoice_data, liveStatus },
            status: liveStatus.Status?.toLowerCase() || hoaDon.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        return NextResponse.json({
          ok: true,
          hoaDon: { ...hoaDon, liveStatus },
          duration_ms: Date.now() - start,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      hoaDon,
      duration_ms: Date.now() - start,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
