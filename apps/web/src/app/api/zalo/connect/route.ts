import { NextRequest, NextResponse } from "next/server";
import { buildZaloAuthorizeUrl } from "@/lib/zalo/oa-client";

export async function GET(req: NextRequest) {
  const state = crypto.randomUUID();
  const url = buildZaloAuthorizeUrl(state);
  return NextResponse.redirect(url);
}
