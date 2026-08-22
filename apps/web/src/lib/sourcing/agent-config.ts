// @codex MIMIN GROUP - hồ sơ công ty dùng làm ngữ cảnh cố định cho AI Search Agent.
// getAgentConfig() dùng server-side (chat route, RLS-scoped client) để build system
// prompt động; saveAgentConfig()/loadAgentConfig() dùng client-side cho trang cấu hình.
//
// industrySynonyms: phiên bản đơn giản, thủ công của "SEARCH_LEARNING_SUGGESTION" - người
// dùng tự khai các cách gọi khác nhau của cùng 1 thứ (VD: "bo cổ = bo áo = bo polo = dệt bo")
// để agent hiểu đúng ý khi người dùng gõ từ khác nhau. Đây KHÔNG phải pipeline tự học/tự
// crawl hàng ngày - chỉ là ngữ cảnh tĩnh do người dùng chủ động nhập và duyệt.

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export const AGENT_CONFIG_ORGANIZATION_ID = "mimin";

export interface AgentConfig {
  companyProducts: string;
  preferredRegions: string;
  defaultMoq: number | null;
  qualityRequirements: string;
  preferredCertifications: string[];
  industrySynonyms: string;
  additionalNotes: string;
  updatedAt: string | null;
}

interface AgentConfigRow {
  company_products: string | null;
  preferred_regions: string | null;
  default_moq: number | null;
  quality_requirements: string | null;
  preferred_certifications: string[] | null;
  industry_synonyms: string | null;
  additional_notes: string | null;
  updated_at: string | null;
}

const EMPTY_CONFIG: AgentConfig = {
  companyProducts: "",
  preferredRegions: "",
  defaultMoq: null,
  qualityRequirements: "",
  preferredCertifications: [],
  industrySynonyms: "",
  additionalNotes: "",
  updatedAt: null,
};

function mapRow(row: AgentConfigRow | null): AgentConfig {
  if (!row) return EMPTY_CONFIG;
  return {
    companyProducts: row.company_products ?? "",
    preferredRegions: row.preferred_regions ?? "",
    defaultMoq: row.default_moq,
    qualityRequirements: row.quality_requirements ?? "",
    preferredCertifications: row.preferred_certifications ?? [],
    industrySynonyms: row.industry_synonyms ?? "",
    additionalNotes: row.additional_notes ?? "",
    updatedAt: row.updated_at,
  };
}

/** Server-side (route API): dùng client RLS-scoped từ verify()/authenticateChatUser(). */
export async function getAgentConfig(
  client: SupabaseClient,
  organizationId: string = AGENT_CONFIG_ORGANIZATION_ID,
): Promise<AgentConfig> {
  const { data, error } = await client
    .from("mimin_group_agent_config")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) {
    console.error("[agent-config] getAgentConfig failed:", error);
    return EMPTY_CONFIG;
  }
  return mapRow(data as AgentConfigRow | null);
}

/** Chuyển hồ sơ công ty thành đoạn text chèn vào system prompt của agent chat. */
export function agentConfigToPromptContext(config: AgentConfig): string {
  const lines: string[] = [];
  if (config.companyProducts.trim()) lines.push(`- Sản phẩm chính công ty đang sản xuất: ${config.companyProducts.trim()}`);
  if (config.preferredRegions.trim()) lines.push(`- Khu vực ưu tiên tìm đối tác: ${config.preferredRegions.trim()}`);
  if (config.defaultMoq !== null) lines.push(`- MOQ (số lượng tối thiểu) thường đặt: ${config.defaultMoq.toLocaleString("vi-VN")}`);
  if (config.qualityRequirements.trim()) lines.push(`- Yêu cầu chất lượng: ${config.qualityRequirements.trim()}`);
  if (config.preferredCertifications.length) lines.push(`- Chứng nhận ưu tiên: ${config.preferredCertifications.join(", ")}`);
  if (config.additionalNotes.trim()) lines.push(`- Ghi chú thêm: ${config.additionalNotes.trim()}`);
  const synonymsBlock = config.industrySynonyms.trim()
    ? `\n\nTừ đồng nghĩa ngành (các cách gọi khác nhau của cùng 1 thứ - hiểu là tương đương khi người dùng gõ bất kỳ từ nào trong nhóm):\n${config.industrySynonyms.trim()}`
    : "";
  if (lines.length === 0 && !synonymsBlock) return "";
  const contextBlock = lines.length
    ? `\n\nBối cảnh công ty (dùng để hiểu ngầm định khi người dùng không nêu rõ, KHÔNG áp đặt nếu người dùng yêu cầu khác):\n${lines.join("\n")}`
    : "";
  return `${contextBlock}${synonymsBlock}`;
}

/** Client-side (trang Cấu hình AI Agent). */
export async function loadAgentConfig(): Promise<AgentConfig> {
  if (!supabase) return EMPTY_CONFIG;
  const { data, error } = await supabase
    .from("mimin_group_agent_config")
    .select("*")
    .eq("organization_id", AGENT_CONFIG_ORGANIZATION_ID)
    .maybeSingle();
  if (error) throw error;
  return mapRow(data as AgentConfigRow | null);
}

export interface AgentConfigInput {
  companyProducts: string;
  preferredRegions: string;
  defaultMoq: number | null;
  qualityRequirements: string;
  preferredCertifications: string[];
  industrySynonyms: string;
  additionalNotes: string;
}

export async function saveAgentConfig(input: AgentConfigInput): Promise<AgentConfig> {
  if (!supabase) throw new Error("Chưa kết nối Supabase");
  const { data, error } = await supabase
    .from("mimin_group_agent_config")
    .upsert(
      {
        organization_id: AGENT_CONFIG_ORGANIZATION_ID,
        company_products: input.companyProducts.trim() || null,
        preferred_regions: input.preferredRegions.trim() || null,
        default_moq: input.defaultMoq,
        quality_requirements: input.qualityRequirements.trim() || null,
        preferred_certifications: input.preferredCertifications,
        industry_synonyms: input.industrySynonyms.trim() || null,
        additional_notes: input.additionalNotes.trim() || null,
      },
      { onConflict: "organization_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as AgentConfigRow);
}
