// POST /api/v1/lark/oauth/callback
// Exchange code → access_token + refresh_token

import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, appId, appSecret } = body;

    if (!code || !appId || !appSecret) {
      return NextResponse.json({ error: "Missing code, appId, or appSecret" }, { status: 400 });
    }

    // Call Lark API: POST /open-apis/authen/v2/oauth/token
    const res = await fetch("https://open.larksuite.com/open-apis/authen/v2/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: appId,
        client_secret: appSecret,
      }),
    });

    const data = await res.json();

    if (data.code !== 0) {
      return NextResponse.json({ error: data.msg || "OAuth failed", lark_response: data }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in, // seconds
      scope: data.scope,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
