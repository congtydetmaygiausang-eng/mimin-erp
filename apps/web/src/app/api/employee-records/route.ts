import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function DELETE() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase service role chưa cấu hình" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase.from("nhan_su").delete().neq("ma_nv", "");
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
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase service role chưa cấu hình" }, { status: 500 });
    }

    const payload = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const record = {
      stt: Number(payload.stt || 0),
      ma_nv: payload.maNV,
      ho_ten: payload.hoTen,
      bo_phan: payload.boPhan,
      chuc_vu: payload.chucVu,
      sdt: payload.sdt,
      email: payload.email || null,
      luong_cung: Number(payload.luongCung || 0),
      rating: Number(payload.rating || 4),
      trang_thai: payload.trangThai || "dang_lam",
      avatar_url: payload.avatar || null,
      cccd_front_url: payload.cccdFrontImage || null,
      cccd_back_url: payload.cccdBackImage || null,
      ngay_sinh: payload.ngaySinh || null,
      gioi_tinh: payload.gioiTinh || null,
      cccd: payload.cccd || null,
      dia_chi_tt: payload.diaChiTT || null,
      dia_chi_tam_tru: payload.diaChiTamTru || null,
      ngay_vao: payload.ngayVao || null,
      tai_khoan: payload.taiKhoan || null,
    };

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
