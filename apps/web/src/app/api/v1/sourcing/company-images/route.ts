import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_APP_ROLES = new Set(["admin", "planner", "warehouse", "accountant"]);
const requests = new Map<string, { count: number; reset: number }>();

type ImageCategory = "LOGO" | "FACADE" | "FACTORY" | "MACHINERY" | "PRODUCT" | "CERTIFICATE" | "OTHER";
interface TavilyResult { title?: string; url?: string; score?: number; images?: string[] }
interface TavilyResponse { results?: TavilyResult[] }

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const current = requests.get(userId);
  if (!current || current.reset < now) {
    requests.set(userId, { count: 1, reset: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 5;
}

async function verify(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return null;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user || !ALLOWED_APP_ROLES.has(String(data.user.app_metadata?.role ?? ""))) return null;
  return data.user;
}

function safeHttpsUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return "";
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host === "0.0.0.0" || host === "::1" || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return "";
    const private172 = host.match(/^172\.(\d{1,3})\./)?.[1];
    if (private172 && Number(private172) >= 16 && Number(private172) <= 31) return "";
    return url.toString().slice(0, 2000);
  } catch { return ""; }
}

function categoryFor(value: string): ImageCategory {
  const text = value.toLowerCase();
  if (/logo|thương hiệu|brand/.test(text)) return "LOGO";
  if (/mặt tiền|cổng|địa chỉ|showroom|cửa hàng/.test(text)) return "FACADE";
  if (/nhà xưởng|nhà máy|factory|workshop|xưởng/.test(text)) return "FACTORY";
  if (/máy móc|thiết bị|machine|dây chuyền/.test(text)) return "MACHINERY";
  if (/sản phẩm|vải|fabric|product|catalog/.test(text)) return "PRODUCT";
  if (/chứng nhận|giấy phép|certificate|iso/.test(text)) return "CERTIFICATE";
  return "OTHER";
}

export async function POST(req: NextRequest) {
  try {
    const user = await verify(req);
    if (!user) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
    if (rateLimited(user.id)) return NextResponse.json({ error: "Vượt giới hạn 5 lượt/phút" }, { status: 429 });
    const body = await req.json() as { legalName?: string; address?: string; website?: string };
    const legalName = body.legalName?.trim().slice(0, 200) ?? "";
    const address = body.address?.trim().slice(0, 300) ?? "";
    if (legalName.length < 3) return NextResponse.json({ error: "Tên công ty chưa hợp lệ" }, { status: 400 });
    const key = process.env.TAVILY_API_KEY;
    if (!key) return NextResponse.json({ error: "Chưa cấu hình TAVILY_API_KEY" }, { status: 503 });

    const query = `"${legalName}" ${address} logo mặt tiền nhà xưởng máy móc sản phẩm công ty`;
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ query, topic: "general", search_depth: "basic", max_results: 10, include_answer: false, include_raw_content: false, include_images: true }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return NextResponse.json({ error: `Tavily tạm lỗi (HTTP ${response.status})` }, { status: 502 });
    const data = await response.json() as TavilyResponse;
    const websiteHost = safeHttpsUrl(body.website)?.replace(/^https:\/\//, "").split("/")[0].replace(/^www\./, "") ?? "";
    const images = (data.results ?? []).flatMap((result) => {
      const sourcePageUrl = safeHttpsUrl(result.url);
      if (!sourcePageUrl) return [];
      const sourceHost = new URL(sourcePageUrl).hostname.replace(/^www\./, "");
      const score = Math.max(0, Math.min(100, Math.round((result.score ?? 0.5) * 75 + (websiteHost && sourceHost === websiteHost ? 20 : 0))));
      return (result.images ?? []).slice(0, 8).flatMap((imageUrl) => {
        const safeImageUrl = safeHttpsUrl(imageUrl);
        if (!safeImageUrl) return [];
        const context = `${result.title ?? ""} ${safeImageUrl}`;
        return [{ imageUrl: safeImageUrl, sourcePageUrl, sourceTitle: (result.title ?? sourceHost).slice(0, 300), caption: (result.title ?? legalName).slice(0, 500), category: categoryFor(context), matchScore: score }];
      });
    });
    const unique = Array.from(new Map(images.map((image) => [image.imageUrl, image])).values())
      .sort((left, right) => right.matchScore - left.matchScore).slice(0, 24);
    return NextResponse.json({ provider: "TAVILY", query, images: unique });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError" ? "Tavily quá thời gian phản hồi" : error instanceof Error ? error.message : "Không tìm được hình ảnh";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
