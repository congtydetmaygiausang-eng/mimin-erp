import { supabase } from "@/lib/supabase/client";

export interface CompanyReaderShadowResult {
  status: "SHADOW_PROCESSED" | "DISABLED" | "ERROR";
  profileCount: number;
  sourceCount: number;
  warningCount: number;
  code?: string;
}

export async function runCompanyReaderShadow(sourceUrls: string[]): Promise<CompanyReaderShadowResult> {
  if (process.env.NEXT_PUBLIC_COMPANY_READER_SHADOW_ENABLED !== "true") return { status: "DISABLED", profileCount: 0, sourceCount: 0, warningCount: 0 };
  if (!supabase) return { status: "ERROR", profileCount: 0, sourceCount: 0, warningCount: 0, code: "SUPABASE_DISABLED" };
  const urls = Array.from(new Set(sourceUrls.filter((url) => {
    try { return new URL(url).protocol === "https:"; } catch { return false; }
  }))).slice(0, 5);
  if (!urls.length) return { status: "DISABLED", profileCount: 0, sourceCount: 0, warningCount: 0 };

  const requestId = `mimin_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
  try {
    const { data, error } = await supabase.functions.invoke("company-reader-gateway", { body: { request_id: requestId, urls } });
    if (error) return { status: "ERROR", profileCount: 0, sourceCount: 0, warningCount: 0, code: "GATEWAY_ERROR" };
    const response = data as { status?: string; profile_count?: number; source_count?: number; warning_count?: number };
    return {
      status: response.status === "SHADOW_PROCESSED" ? "SHADOW_PROCESSED" : "ERROR",
      profileCount: response.profile_count ?? 0,
      sourceCount: response.source_count ?? 0,
      warningCount: response.warning_count ?? 0,
      code: response.status === "SHADOW_PROCESSED" ? undefined : "UNEXPECTED_GATEWAY_RESPONSE",
    };
  } catch {
    return { status: "ERROR", profileCount: 0, sourceCount: 0, warningCount: 0, code: "GATEWAY_UNAVAILABLE" };
  }
}
