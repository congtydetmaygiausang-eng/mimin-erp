import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const BUCKET = "production-company-images";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_APP_ROLES = new Set(["admin", "planner", "warehouse", "accountant"]);
const MIME_EXTENSIONS: Record<string, string> = { "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp", "image/gif":"gif" };

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:")) return true;
  const ipv4 = normalized.startsWith("::ffff:") ? normalized.slice(7) : normalized;
  if (isIP(ipv4) !== 4) return false;
  const [a, b] = ipv4.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}

async function assertPublicHttps(value: string): Promise<URL> {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.hostname === "localhost" || url.hostname.endsWith(".local")) throw new Error("URL ảnh không an toàn");
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((entry) => isPrivateAddress(entry.address))) throw new Error("Máy chủ ảnh không công khai");
  return url;
}

async function downloadImage(initialUrl: string): Promise<{ bytes: Uint8Array; mime: string }> {
  let url = await assertPublicHttps(initialUrl);
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20_000), headers: { Accept: "image/jpeg,image/png,image/webp,image/gif" } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === 3) throw new Error("Ảnh chuyển hướng quá nhiều lần");
      url = await assertPublicHttps(new URL(location, url).toString());
      continue;
    }
    if (!response.ok || !response.body) throw new Error(`Không tải được ảnh nguồn (HTTP ${response.status})`);
    const mime = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
    if (!MIME_EXTENSIONS[mime]) throw new Error("Định dạng ảnh không được hỗ trợ");
    const declaredSize = Number(response.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_BYTES) throw new Error("Ảnh vượt quá 10 MB");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error("Ảnh vượt quá 10 MB"); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const validMagic = mime === "image/jpeg" ? bytes[0] === 0xff && bytes[1] === 0xd8
      : mime === "image/png" ? bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      : mime === "image/gif" ? String.fromCharCode(...bytes.slice(0, 3)) === "GIF"
      : String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    if (!validMagic) throw new Error("Nội dung tệp không đúng định dạng ảnh");
    return { bytes, mime };
  }
  throw new Error("Không tải được ảnh nguồn");
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!token || !url || !publishableKey || !secretKey) return NextResponse.json({ error: "Thiếu cấu hình máy chủ" }, { status: 503 });
    const userClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    const user = authData.user;
    if (authError || !user || !ALLOWED_APP_ROLES.has(String(user.app_metadata?.role ?? ""))) return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Mã ảnh không hợp lệ" }, { status: 400 });
    const body = await req.json() as { status?: string };
    if (body.status !== "APPROVED" && body.status !== "REJECTED") return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
    const { data: image, error: imageError } = await userClient.from("production_company_images").select("id,company_profile_id,image_url,review_status,storage_path").eq("organization_id", "mimin").eq("id", id).single();
    if (imageError || !image) return NextResponse.json({ error: "Không tìm thấy ảnh" }, { status: 404 });
    if (image.review_status !== "PENDING") return NextResponse.json({ error: "Ảnh đã được xử lý trước đó" }, { status: 409 });
    const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
    if (body.status === "REJECTED") {
      const { error } = await admin.from("production_company_images").update({ review_status:"REJECTED", reviewed_by:user.id, reviewed_at:new Date().toISOString(), archival_status:"REMOTE" }).eq("id", id).eq("review_status", "PENDING");
      if (error) throw new Error(error.message);
      return NextResponse.json({ status: "REJECTED" });
    }
    const downloaded = await downloadImage(String(image.image_url));
    const extension = MIME_EXTENSIONS[downloaded.mime];
    const storagePath = `mimin/${image.company_profile_id}/${id}.${extension}`;
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, downloaded.bytes, { contentType: downloaded.mime, upsert: true, cacheControl: "3600" });
    if (uploadError) throw new Error(`Không lưu được ảnh: ${uploadError.message}`);
    const { error: updateError } = await admin.from("production_company_images").update({
      review_status:"APPROVED", reviewed_by:user.id, reviewed_at:new Date().toISOString(), archival_status:"ARCHIVED",
      storage_bucket:BUCKET, storage_path:storagePath, archived_at:new Date().toISOString(), archived_mime_type:downloaded.mime, archived_bytes:downloaded.bytes.byteLength,
    }).eq("id", id).eq("review_status", "PENDING");
    if (updateError) { await admin.storage.from(BUCKET).remove([storagePath]); throw new Error(updateError.message); }
    return NextResponse.json({ status:"APPROVED", storagePath });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError" ? "Máy chủ ảnh quá thời gian phản hồi" : error instanceof Error ? error.message : "Không xử lý được ảnh";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
