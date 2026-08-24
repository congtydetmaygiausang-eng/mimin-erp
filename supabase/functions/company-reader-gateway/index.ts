const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GatewayRequest { request_id: string; urls: string[] }

const READER_WAKE_TIMEOUT_MS = 60_000;
const READER_REQUEST_TIMEOUT_MS = 55_000;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

function validRequest(value: unknown): value is GatewayRequest {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<GatewayRequest>;
  if (!input.request_id?.match(/^[A-Za-z0-9_-]{8,64}$/)) return false;
  if (!Array.isArray(input.urls) || input.urls.length < 1 || input.urls.length > 5) return false;
  return new Set(input.urls).size === input.urls.length && input.urls.every((url) => {
    if (typeof url !== "string" || url.length > 2_000) return false;
    try { return new URL(url).protocol === "https:"; } catch { return false; }
  });
}

async function sign(token: string, timestamp: string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(token), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}\n${body}`));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json(401, { error: "AUTH_REQUIRED" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) return json(503, { error: "AUTH_NOT_CONFIGURED" });
  try {
    const user = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authorization, apikey: supabaseAnonKey },
      signal: AbortSignal.timeout(5_000),
    });
    if (!user.ok) return json(401, { error: "INVALID_SESSION" });
  } catch {
    return json(503, { error: "AUTH_UNAVAILABLE" });
  }

  const readerUrl = Deno.env.get("COMPANY_READER_BASE_URL")?.replace(/\/$/, "");
  const readerToken = Deno.env.get("COMPANY_READER_SERVICE_TOKEN");
  if (!readerUrl || !readerToken || readerToken.length < 32) return json(503, { error: "COMPANY_READER_NOT_CONFIGURED" });

  let payload: unknown;
  try { payload = await request.json(); } catch { return json(400, { error: "INVALID_JSON" }); }
  if (!validRequest(payload)) return json(400, { error: "INVALID_REQUEST" });

  try {
    const body = JSON.stringify(payload);
    // Render Free sleeps when idle. Wake it through the readiness endpoint first
    // so cold-start time does not consume the actual extraction budget.
    const ready = await fetch(`${readerUrl}/readyz`, {
      signal: AbortSignal.timeout(READER_WAKE_TIMEOUT_MS),
    });
    if (!ready.ok) return json(503, { error: "COMPANY_READER_NOT_READY" });
    const timestamp = Math.floor(Date.now() / 1_000).toString();
    const signature = await sign(readerToken, timestamp, body);
    const upstream = await fetch(`${readerUrl}/v1/company-reader/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${readerToken}`, "Content-Type": "application/json", "X-Mimin-Client": "mimin-supabase-gateway", "X-Mimin-Timestamp": timestamp, "X-Mimin-Signature": signature },
      body,
      signal: AbortSignal.timeout(READER_REQUEST_TIMEOUT_MS),
    });
    const upstreamBody = await upstream.json().catch(() => ({ error: "INVALID_UPSTREAM_RESPONSE" }));
    return json(upstream.status, upstreamBody);
  } catch (error) {
    const code = error instanceof DOMException && error.name === "TimeoutError"
      ? "COMPANY_READER_TIMEOUT"
      : "COMPANY_READER_UNAVAILABLE";
    return json(502, { error: code });
  }
});
