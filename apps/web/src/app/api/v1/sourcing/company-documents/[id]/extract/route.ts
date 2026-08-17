import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const BUCKET = "production-company-documents";
const ALLOWED_ROLES = new Set(["admin", "planner", "accountant"]);

interface GeminiExtraction {
  legalName?: string;
  taxCode?: string;
  documentNumber?: string;
  issuer?: string;
  issuedOn?: string;
  expiresOn?: string;
  registeredAddress?: string;
  legalRepresentative?: string;
  summary?: string;
  rawTextExcerpt?: string;
  confidence?: number;
}

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, max) : null;
}

function dateOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? null : value;
}

function apiKeys(): string[] {
  return Array.from(new Set([
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GEMINI_API_KEY,
  ].map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

async function extractWithGemini(bytes: Uint8Array, mimeType: string): Promise<{ data: GeminiExtraction; model: string }> {
  const keys = apiKeys();
  if (!keys.length) throw new Error("Chưa cấu hình GEMINI_API_KEY cho OCR");
  const models = Array.from(new Set([process.env.GEMINI_OCR_MODEL || "gemini-2.5-flash", "gemini-2.5-flash-lite"]));
  let lastError = "Gemini không phản hồi";
  for (const key of keys) {
    for (const model of models) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          signal: AbortSignal.timeout(45_000),
          body: JSON.stringify({
            contents: [{ role: "user", parts: [
              { text: [
                "Trích xuất chính xác thông tin nhìn thấy trong giấy tờ doanh nghiệp Việt Nam này.",
                "Không suy đoán, không bổ sung từ kiến thức bên ngoài. Trường không thấy phải để chuỗi rỗng.",
                "Ngày phải theo YYYY-MM-DD. confidence là độ tin cậy tổng thể từ 0 đến 100.",
                "rawTextExcerpt chỉ chứa tối đa 1500 ký tự quan trọng dùng để người kiểm duyệt đối chiếu.",
              ].join("\n") },
              { inlineData: { mimeType, data: Buffer.from(bytes).toString("base64") } },
            ] }],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 1800,
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  legalName: { type: "STRING" }, taxCode: { type: "STRING" }, documentNumber: { type: "STRING" },
                  issuer: { type: "STRING" }, issuedOn: { type: "STRING" }, expiresOn: { type: "STRING" },
                  registeredAddress: { type: "STRING" }, legalRepresentative: { type: "STRING" },
                  summary: { type: "STRING" }, rawTextExcerpt: { type: "STRING" }, confidence: { type: "INTEGER" },
                },
                required: ["legalName", "taxCode", "documentNumber", "issuer", "issuedOn", "expiresOn", "registeredAddress", "legalRepresentative", "summary", "rawTextExcerpt", "confidence"],
              },
            },
          }),
        });
        if (!response.ok) { lastError = `Gemini HTTP ${response.status}`; if (response.status === 401 || response.status === 403) break; continue; }
        const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
        if (!text) { lastError = "Gemini trả dữ liệu trống"; continue; }
        return { data: JSON.parse(text) as GeminiExtraction, model };
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Gemini không phản hồi";
      }
    }
  }
  throw new Error(lastError);
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
    if (authError || !user || !ALLOWED_ROLES.has(String(user.app_metadata?.role ?? ""))) return NextResponse.json({ error: "Không có quyền trích xuất giấy tờ" }, { status: 401 });
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Mã giấy tờ không hợp lệ" }, { status: 400 });
    const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: document, error: documentError } = await admin.from("production_company_documents")
      .select("id,organization_id,storage_path,mime_type,review_status").eq("organization_id", "mimin").eq("id", id).single();
    if (documentError || !document) return NextResponse.json({ error: "Không tìm thấy giấy tờ" }, { status: 404 });
    if (document.review_status === "REJECTED") return NextResponse.json({ error: "Không OCR giấy tờ đã bị loại" }, { status: 409 });
    const { data: file, error: downloadError } = await admin.storage.from(BUCKET).download(String(document.storage_path));
    if (downloadError || !file) throw new Error(downloadError?.message || "Không tải được giấy tờ riêng tư");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await extractWithGemini(bytes, String(document.mime_type));
    const confidence = Math.max(0, Math.min(100, Math.round(Number(result.data.confidence) || 0)));
    const { data: extraction, error: insertError } = await admin.from("production_company_document_extractions").insert({
      organization_id: "mimin", document_id: id, extraction_status: "PENDING", provider: "GEMINI", model: result.model,
      legal_name: clean(result.data.legalName, 250), tax_code: clean(result.data.taxCode, 50),
      document_number: clean(result.data.documentNumber, 100), issuer: clean(result.data.issuer, 200),
      issued_on: dateOrNull(result.data.issuedOn), expires_on: dateOrNull(result.data.expiresOn),
      registered_address: clean(result.data.registeredAddress, 500), legal_representative: clean(result.data.legalRepresentative, 200),
      summary: clean(result.data.summary, 1000), raw_text_excerpt: clean(result.data.rawTextExcerpt, 1500),
      confidence, created_by: user.id,
    }).select("id").single();
    if (insertError || !extraction) throw new Error(insertError?.message || "Không lưu được kết quả OCR");
    return NextResponse.json({ id: extraction.id, confidence });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError" ? "Gemini OCR quá thời gian phản hồi" : error instanceof Error ? error.message : "Không OCR được giấy tờ";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
