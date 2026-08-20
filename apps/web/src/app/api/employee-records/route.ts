import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { toSupabaseEmployeeRecord } from "@/lib/employee-records";
import { requireAdmin, requireAuth } from "@/lib/api-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase service role chưa cấu hình" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.from("nhan_su").select("*").order("stt", { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, records: data || [] });
  } catch (error) {
    console.error("employee-records-get-error", error);
    return NextResponse.json({ error: "Không thể đọc nhân sự từ Supabase" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Xoá TOÀN BỘ bảng nhân sự (khi không truyền maNV) là thao tác admin-only -
    // trước đây không xác thực gì cả, ai gọi được URL cũng xoá sạch nhan_su.
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase service role chưa cấu hình" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { searchParams } = new URL(request.url);
    const maNV = searchParams.get("maNV");

    const { error } = maNV
      ? await supabase.from("nhan_su").delete().eq("ma_nv", maNV)
      : await supabase.from("nhan_su").delete().neq("ma_nv", "");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("employee-records-delete-error", error);
    return NextResponse.json({ error: "Không thể xóa dữ liệu nhân sự cũ" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase service role chưa cấu hình" }, { status: 500 });
    }

    const payload = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const record = toSupabaseEmployeeRecord(payload);

    const { error } = await supabase.from("nhan_su").upsert(record, { onConflict: "ma_nv" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("employee-record-error", error);
    return NextResponse.json({ error: "Không thể lưu nhân sự vào Supabase" }, { status: 500 });
  }
}
