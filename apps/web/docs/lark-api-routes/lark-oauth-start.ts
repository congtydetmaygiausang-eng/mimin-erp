// POST /api/v1/lark/oauth/start
// Bắt đầu OAuth flow - trả về authorize URL

import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appId, redirectUri, scopes } = body;

    if (!appId) {
      return NextResponse.json({ error: "Missing appId" }, { status: 400 });
    }

    const finalRedirect = redirectUri || `${req.nextUrl.origin}/lark-callback`;
    const finalScopes = scopes || [
      "bitable:app:readonly",
      "bitable:app:write",
      "im:message",
      "im:message:send_as_bot",
    ].join(" ");

    const state = Math.random().toString(36).slice(2, 18);
    const authorizeUrl = `https://open.larksuite.com/open-apis/authen/v1/index?redirect_uri=${encodeURIComponent(finalRedirect)}&app_id=${appId}&state=${state}&scope=${encodeURIComponent(finalScopes)}`;

    return NextResponse.json({ ok: true, authorizeUrl, state });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
