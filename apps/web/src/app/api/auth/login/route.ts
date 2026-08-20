// POST /api/auth/login - xác thực mật khẩu cho các tài khoản "demo/fallback"
// (nguồn lib/users.server.ts) NGAY TRÊN SERVER, không còn so sánh mật khẩu ở
// trình duyệt. Trước đây session-provider.tsx import trực tiếp lib/users.ts
// (chứa password thật) để so sánh - toàn bộ mảng đó bị bundle xuống mọi client.
import { NextRequest, NextResponse } from "next/server";
import { findUserByEmailFull } from "@/lib/users.server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body không hợp lệ" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Thiếu email hoặc mật khẩu" }, { status: 400 });
  }

  const record = findUserByEmailFull(email);
  if (!record || record.password !== password) {
    // Không tiết lộ "email không tồn tại" hay "sai mật khẩu" riêng biệt - tránh dò email
    return NextResponse.json({ ok: false, error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
  }

  // Trả về đúng các field công khai - KHÔNG bao giờ trả password/passwordHash
  return NextResponse.json({
    ok: true,
    user: {
      id: record.id,
      email: record.email,
      name: record.name,
      role: record.role,
      chucVu: record.chucVu,
      maNV: record.maNV,
      phongBan: record.phongBan,
      donGia: record.donGia,
      laCongNhan: record.laCongNhan,
    },
  });
}
