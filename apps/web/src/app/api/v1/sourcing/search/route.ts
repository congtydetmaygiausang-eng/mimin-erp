import { NextRequest, NextResponse } from "next/server";
import { ROLES, SourcingSearchError, limited, runSourcingSearch, verify, type SourcingSearchParams } from "@/lib/sourcing/search-engine";

export async function POST(req: NextRequest) {
  try {
    const auth = await verify(req);
    if (!auth) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
    if (limited(auth.user.id)) return NextResponse.json({ error: "Vượt giới hạn 10 lượt/phút" }, { status: 429 });
    const body = await req.json() as { query?: string; location?: string; role?: string; center?: { latitude?: unknown; longitude?: unknown; accuracy?: unknown }; radiusKm?: number; locationMode?: string; entryPoint?: SourcingSearchParams["entryPoint"]; rawQueryText?: string };
    const query = body.query?.trim().slice(0, 150) ?? "";
    const location = body.location?.trim().slice(0, 150) ?? "";
    if (!query || !location || !body.role || !ROLES.has(body.role)) return NextResponse.json({ error: "Tiêu chí không hợp lệ" }, { status: 400 });
    const result = await runSourcingSearch({
      query,
      location,
      role: body.role,
      center: body.center,
      radiusKm: body.radiusKm,
      locationMode: body.locationMode,
      entryPoint: body.entryPoint,
      rawQueryText: body.rawQueryText,
    }, auth);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SourcingSearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Tìm kiếm thất bại" }, { status: 502 });
  }
}
