import { supabase } from "@/lib/supabase/client";

export interface CompanyReaderShadowResult {
  status: "SHADOW_PROCESSED" | "DISABLED" | "ERROR";
  profileCount: number;
  sourceCount: number;
  warningCount: number;
  code?: string;
}

// Render Free can need roughly one minute to wake up. The gateway performs a
// readiness probe before the bounded read, so the browser must not abort first.
const COMPANY_READER_SHADOW_TIMEOUT_MS = 115_000;

async function withTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("GATEWAY_TIMEOUT")), COMPANY_READER_SHADOW_TIMEOUT_MS);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function runCompanyReaderShadow(sourceUrls: string[]): Promise<CompanyReaderShadowResult> {
  if (process.env.NEXT_PUBLIC_COMPANY_READER_SHADOW_ENABLED !== "true") return { status: "DISABLED", profileCount: 0, sourceCount: 0, warningCount: 0 };
  if (!supabase) return { status: "ERROR", profileCount: 0, sourceCount: 0, warningCount: 0, code: "SUPABASE_DISABLED" };
  const client = supabase;
  const urls = Array.from(new Set(sourceUrls.filter((url) => {
    try { return new URL(url).protocol === "https:"; } catch { return false; }
  }))).slice(0, 15);
  if (!urls.length) return { status: "DISABLED", profileCount: 0, sourceCount: 0, warningCount: 0 };

  const batches = Array.from({ length: Math.ceil(urls.length / 5) }, (_, index) => urls.slice(index * 5, (index + 1) * 5));
  try {
    const responses = await Promise.all(batches.map(async (batch, index) => {
      const requestId = `mimin_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}_${index}`;
      if (process.env.NEXT_PUBLIC_COMPANY_READER_SHADOW_TRANSPORT === "local") {
        const endpoint = process.env.NEXT_PUBLIC_COMPANY_READER_LOCAL_GATEWAY_URL || "http://127.0.0.1:8766/v1/company-reader/shadow";
        const local = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ request_id: requestId, urls: batch }),
          signal: AbortSignal.timeout(COMPANY_READER_SHADOW_TIMEOUT_MS),
        });
        const response = await local.json() as { status?: string; profile_count?: number; source_count?: number; warning_count?: number; error?: string };
        if (!local.ok) throw new Error(response.error ?? "LOCAL_GATEWAY_ERROR");
        return response;
      }
      const { data, error } = await withTimeout(client.functions.invoke("company-reader-gateway", { body: { request_id: requestId, urls: batch } }));
      if (error) {
        let errCode = "GATEWAY_ERROR";
        if (typeof (error as any).context?.json === "function") {
          try {
            const errBody = await (error as any).context.json();
            if (errBody?.error) errCode = errBody.error;
          } catch {}
        }
        throw new Error(errCode);
      }
      return data as { status?: string; profile_count?: number; source_count?: number; warning_count?: number };
    }));
    const processed = responses.filter((response) => response.status === "SHADOW_PROCESSED");
    return {
      status: processed.length === responses.length ? "SHADOW_PROCESSED" : "ERROR",
      profileCount: processed.reduce((total, response) => total + (response.profile_count ?? 0), 0),
      sourceCount: processed.reduce((total, response) => total + (response.source_count ?? 0), 0),
      warningCount: processed.reduce((total, response) => total + (response.warning_count ?? 0), 0),
      code: processed.length === responses.length ? undefined : "UNEXPECTED_GATEWAY_RESPONSE",
    };
  } catch (error) {
    const code = error instanceof Error ? error.message : "GATEWAY_UNAVAILABLE";
    const disabledCodes = new Set(["COMPANY_READER_NOT_CONFIGURED", "AUTH_NOT_CONFIGURED", "SUPABASE_DISABLED", "LOCAL_GATEWAY_ERROR", "GATEWAY_ERROR", "FunctionsFetchError"]);
    if (disabledCodes.has(code)) {
      return { status: "DISABLED", profileCount: 0, sourceCount: 0, warningCount: 0 };
    }
    return { status: "ERROR", profileCount: 0, sourceCount: 0, warningCount: 0, code };
  }
}
