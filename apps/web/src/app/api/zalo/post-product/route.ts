import { NextRequest, NextResponse } from "next/server";
import { postProductToZaloOA, type SanPhamDangBai } from "@/lib/zalo/oa-client";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SanPhamDangBai;
    if (!body?.tenSP) {
      return NextResponse.json({ ok: false, error: "Thiếu tên sản phẩm" }, { status: 400 });
    }
    const result = await postProductToZaloOA(body);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Lỗi không xác định" }, { status: 500 });
  }
}
