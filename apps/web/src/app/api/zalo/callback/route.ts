import { NextRequest, NextResponse } from "next/server";
import { connectZaloOA } from "@/lib/zalo/oa-client";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || req.nextUrl.searchParams.get("oa_code");
  const base = req.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${base}/danh-muc-sp?zalo=error&msg=${encodeURIComponent("Thiếu mã xác thực từ Zalo")}`);
  }

  const result = await connectZaloOA(code);
  if (!result.ok) {
    return NextResponse.redirect(`${base}/danh-muc-sp?zalo=error&msg=${encodeURIComponent(result.error || "Kết nối thất bại")}`);
  }
  return NextResponse.redirect(`${base}/danh-muc-sp?zalo=success`);
}
