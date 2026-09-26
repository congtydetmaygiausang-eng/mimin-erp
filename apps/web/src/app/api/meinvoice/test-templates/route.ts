import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getInvoiceTemplates } from "@/lib/meinvoice";

export async function GET() {
  const config = {
    app_id: "01a0d788-0058-7345-924b-b6d605e421ec",
    tax_code: "0318507560",
    env: "live"
  };
  const templates = await getInvoiceTemplates(config as any);
  return NextResponse.json({ templates });
}
