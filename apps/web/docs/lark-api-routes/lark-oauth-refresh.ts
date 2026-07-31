// POST /api/v1/lark/oauth/refresh
// Refresh access_token khi hết hạn

import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken, appId, appSecret } = body;

    if (!refreshToken || !appId || !appSecret) {
      return NextResponse.json({ error: "Missing refreshToken, appId, or appSecret" }, { status: 400 });
    }

    const res = await fetch("https://open.larksuite.com/open-apis/authen/v2/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: appId,
        client_secret: appSecret,
      }),
    });

    const data = await res.json();
    if (data.code !== 0) {
      return NextResponse.json({ error: data.msg || "Refresh failed" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
