// Zalo Official Account (OA) API client - ket noi + dang bai san pham
import { supabaseAdmin } from "@/lib/supabase/admin";

const ZALO_APP_ID = process.env.ZALO_APP_ID || "";
const ZALO_APP_SECRET = process.env.ZALO_APP_SECRET || "";
const ZALO_OA_CALLBACK_URL = process.env.ZALO_OA_CALLBACK_URL || "";

const OAUTH_BASE = "https://oauth.zaloapp.com/v4/oa";
const OPENAPI_BASE = "https://openapi.zalo.me/v3.0/oa";

export function buildZaloAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    app_id: ZALO_APP_ID,
    redirect_uri: ZALO_OA_CALLBACK_URL,
    state,
  });
  return `https://oauth.zaloapp.com/v4/oa/permission?${params.toString()}`;
}

interface ZaloTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: string;
  error?: number;
  error_name?: string;
  error_reason?: string;
}

async function exchangeCodeForToken(code: string): Promise<ZaloTokenResponse> {
  const body = new URLSearchParams({
    code,
    app_id: ZALO_APP_ID,
    grant_type: "authorization_code",
  });
  const r = await fetch(`${OAUTH_BASE}/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: ZALO_APP_SECRET,
    },
    body,
  });
  return r.json();
}

export async function connectZaloOA(code: string, connectedBy?: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseAdmin) return { ok: false, error: "Supabase chưa được cấu hình" };
  const tokenRes = await exchangeCodeForToken(code);
  if (!tokenRes.access_token) {
    return { ok: false, error: tokenRes.error_reason || "Không lấy được access token từ Zalo" };
  }
  const expiresAt = new Date(Date.now() + Number(tokenRes.expires_in || 0) * 1000).toISOString();
  const { error } = await supabaseAdmin.from("zalo_oa_config").upsert({
    id: "default",
    access_token: tokenRes.access_token,
    refresh_token: tokenRes.refresh_token,
    token_expires_at: expiresAt,
    connected_by: connectedBy || null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function refreshAccessToken(refreshToken: string): Promise<ZaloTokenResponse> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    app_id: ZALO_APP_ID,
    grant_type: "refresh_token",
  });
  const r = await fetch(`${OAUTH_BASE}/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: ZALO_APP_SECRET,
    },
    body,
  });
  return r.json();
}

/** Lấy access token còn hạn; tự refresh nếu đã hết hạn. */
export async function getValidAccessToken(): Promise<{ token?: string; error?: string }> {
  if (!supabaseAdmin) return { error: "Supabase chưa được cấu hình" };
  const { data, error } = await supabaseAdmin.from("zalo_oa_config").select("*").eq("id", "default").single();
  if (error || !data?.access_token) return { error: "Chưa kết nối Zalo OA. Vào Danh mục sản phẩm → Kết nối Zalo OA." };

  const expiresAt = data.token_expires_at ? new Date(data.token_expires_at).getTime() : 0;
  if (expiresAt > Date.now() + 60_000) {
    return { token: data.access_token };
  }

  if (!data.refresh_token) return { error: "Token Zalo OA đã hết hạn, cần kết nối lại." };
  const refreshed = await refreshAccessToken(data.refresh_token);
  if (!refreshed.access_token) return { error: refreshed.error_reason || "Không làm mới được token Zalo OA" };

  const newExpiresAt = new Date(Date.now() + Number(refreshed.expires_in || 0) * 1000).toISOString();
  await supabaseAdmin.from("zalo_oa_config").update({
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token || data.refresh_token,
    token_expires_at: newExpiresAt,
    updated_at: new Date().toISOString(),
  }).eq("id", "default");

  return { token: refreshed.access_token };
}

export interface SanPhamDangBai {
  tenSP: string;
  moTa?: string;
  gia?: number;
  soLuongTon?: number;
  hinhAnhUrl?: string;
}

/**
 * Đăng tin sản phẩm mới lên Zalo OA (dạng tin nhắn broadcast tới người theo dõi OA).
 * LƯU Ý: API cụ thể (message broadcast / article) phụ thuộc gói OA đã đăng ký với Zalo -
 * cần test thực tế 1 lần trước khi tự động hoá hàng loạt.
 */
export async function postProductToZaloOA(sp: SanPhamDangBai): Promise<{ ok: boolean; error?: string; raw?: unknown }> {
  const { token, error } = await getValidAccessToken();
  if (!token) return { ok: false, error };

  const lines = [
    `🆕 MẪU MỚI: ${sp.tenSP}`,
    sp.moTa ? sp.moTa : undefined,
    sp.gia ? `Giá: ${sp.gia.toLocaleString("vi-VN")}đ` : undefined,
    sp.soLuongTon !== undefined ? `Tồn kho: ${sp.soLuongTon.toLocaleString("vi-VN")}` : undefined,
  ].filter(Boolean);

  const payload = sp.hinhAnhUrl
    ? {
        recipient: { user_id: "" },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "media",
              elements: [{ media_type: "image", url: sp.hinhAnhUrl }],
            },
          },
          text: lines.join("\n"),
        },
      }
    : { message: { text: lines.join("\n") } };

  const r = await fetch(`${OPENAPI_BASE}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: token,
    },
    body: JSON.stringify(payload),
  });
  const json = await r.json().catch(() => ({}));
  if (json.error && json.error !== 0) {
    return { ok: false, error: json.message || "Zalo API trả lỗi", raw: json };
  }
  return { ok: true, raw: json };
}
