// @codex MIMIN GROUP - AI Search Agent hội thoại (tool-calling thật qua DeepSeek).
// Theo đúng pattern callOpenAICompatibleWithTools() trong
// apps/web/src/app/api/v1/orchestrator/query/route.ts (fetch thô, tools + tool_choice
// "auto", 1 vòng thực thi tool rồi tổng hợp câu trả lời) nhưng tự chứa hoàn toàn cho
// domain Mạng lưới đối tác - KHÔNG đụng vào orchestrator/ai-tools.ts sẵn có.
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import {
  ALLOWED_APP_ROLES,
  runSourcingSearch,
  type SourcingSearchAuth,
} from "@/lib/sourcing/search-engine";
import {
  getPartnerDetail,
  insertDiscoveryCandidate,
  listPartnersForCompare,
  rankPartners,
  type AgentPartnerDetail,
} from "@/lib/sourcing/agent-partner-data";
import { agentConfigToPromptContext, getAgentConfig } from "@/lib/sourcing/agent-config";
import { applyExclusionRules, getActiveProfile, listActiveProfiles, profilesToPromptContext } from "@/lib/sourcing/search-profiles";
import { canView } from "@/lib/permissions";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { ROLE_LABELS, type ProductionPartnerRole } from "@/lib/production-network";
import type { DirectSearchCandidate } from "@/lib/production-discovery";

export const maxDuration = 60;

const MAX_TOOL_CALLS_PER_TURN = 4;
const MAX_HISTORY_MESSAGES = 6;
const MAX_ECHOED_RESULTS = 50;

interface TurnResult {
  role: ProductionPartnerRole;
  candidate: DirectSearchCandidate;
  searchQuery: string;
  provider: string;
}

interface ChatAuth {
  user: User;
  client: SupabaseClient;
  role: string;
  sourcingAuth: SourcingSearchAuth;
}

async function authenticateChatUser(req: NextRequest): Promise<ChatAuth | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return null;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  const role = String(data.user.app_metadata?.role ?? "");
  return { user: data.user, client, role, sourcingAuth: { user: data.user, client, token, url, key } };
}

// Dựng lại "kết quả tìm kiếm gần nhất" từ dữ liệu client gửi kèm (chính là results.candidates
// route này đã trả về ở lượt trước) - route không giữ state giữa các request nên
// refine_last_search/save_partner_candidate cần nguồn này để hoạt động qua nhiều lượt chat.
function parseEchoedResults(raw: unknown): TurnResult[] {
  if (!Array.isArray(raw)) return [];
  const out: TurnResult[] = [];
  for (const entry of raw.slice(0, MAX_ECHOED_RESULTS)) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const role = record.role;
    if (typeof role !== "string" || !(role in ROLE_LABELS)) continue;
    const { role: _role, roleLabel: _roleLabel, resultIndex: _resultIndex, ...candidate } = record;
    out.push({ role: role as ProductionPartnerRole, candidate: candidate as unknown as DirectSearchCandidate, searchQuery: "", provider: "" });
  }
  return out;
}

function partnerTypeToRoles(partnerType: unknown): ProductionPartnerRole[] {
  if (partnerType === "factory") return ["SATELLITE_PROCESSOR"];
  if (partnerType === "customer") return ["CUSTOMER"];
  return ["MATERIAL_SUPPLIER", "PACKAGING_FINISHER"];
}

function partnerDetailToText(detail: AgentPartnerDetail): Record<string, unknown> {
  return {
    id: detail.id,
    partnerCode: detail.partnerCode,
    legalName: detail.legalName,
    roles: detail.roleLabels,
    phone: detail.phone || null,
    email: detail.email || null,
    website: detail.website || null,
    address: [detail.address, detail.district, detail.province].filter(Boolean).join(", ") || null,
    capabilities: detail.capabilities,
    capacityPerMonth: detail.capacityPerMonth,
    minimumOrderQuantity: detail.minimumOrderQuantity,
    leadTimeDays: detail.leadTimeDays,
    score: detail.score,
    status: detail.status,
    verificationStatus: detail.verificationStatus,
  };
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_partners",
      description:
        "Tìm kiếm xưởng sản xuất, nhà cung cấp hoặc khách hàng MỚI bằng AI — gọi các API tìm kiếm web thật " +
        "(Tavily, Brave, Gemini, Google Places) để tìm công ty ngoài internet, KHÔNG phải tra trong danh mục " +
        "nội bộ đã có sẵn. Dùng khi người dùng muốn tìm đối tác mới.",
      parameters: {
        type: "object",
        properties: {
          partner_type: {
            type: "string",
            enum: ["factory", "supplier", "customer"],
            description: "factory = xưởng gia công (may/cắt/in/thêu/giặt/nhuộm/đóng gói); supplier = nhà cung cấp vật tư/nguyên phụ liệu/bao bì; customer = khách hàng/đầu ra sản xuất",
          },
          specialty: { type: "string", description: "Chuyên môn/năng lực cần tìm, ví dụ: may áo polo, cắt laser, vải cotton, dây kéo" },
          product: { type: "string", description: "Sản phẩm cụ thể nếu người dùng nêu, ví dụ: áo polo" },
          location: { type: "string", description: "Khu vực tìm kiếm, ví dụ: TP.HCM, Quận 12, Bình Dương" },
          capacity_month_min: { type: "number", description: "Năng lực tối thiểu/tháng nếu người dùng nêu rõ số lượng" },
          radius_km: { type: "number", description: "Bán kính tìm kiếm quanh khu vực tính bằng km, mặc định 20" },
          limit: { type: "number", description: "Số lượng kết quả mong muốn, mặc định 20, tối đa 50" },
        },
        required: ["partner_type", "specialty", "location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_partner_detail",
      description: "Lấy hồ sơ chi tiết 1 đối tác đã có trong danh mục nội bộ (production_partners) theo id.",
      parameters: { type: "object", properties: { partner_id: { type: "string" } }, required: ["partner_id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_partners",
      description: "So sánh nhiều đối tác đã có trong danh mục nội bộ theo danh sách id.",
      parameters: {
        type: "object",
        properties: { partner_ids: { type: "array", items: { type: "string" }, description: "Tối đa 10 id" } },
        required: ["partner_ids"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rank_partners",
      description: "Xếp hạng đối tác đã có trong danh mục nội bộ theo điểm chất lượng/uy tín (quality_score, reliability_score).",
      parameters: {
        type: "object",
        properties: {
          partner_type: { type: "string", enum: ["factory", "supplier", "customer"] },
          limit: { type: "number", description: "Số lượng tối đa trả về, mặc định 10" },
        },
        required: ["partner_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_partner_candidate",
      description:
        "Lưu 1 kết quả tìm kiếm vào vùng chờ duyệt (production_discovery_candidates). CHỈ dùng result_index lấy " +
        "từ kết quả search_partners đã trả về trong cuộc hội thoại này — KHÔNG được tự tạo hoặc gõ lại thông tin công ty.",
      parameters: {
        type: "object",
        properties: { result_index: { type: "number", description: "Chỉ số (index) của kết quả, lấy từ kết quả search_partners gần nhất" } },
        required: ["result_index"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "refine_last_search",
      description:
        "Lọc/sắp xếp lại kết quả search_partners GẦN NHẤT trong cuộc hội thoại này theo điều kiện mới - KHÔNG gọi API tìm kiếm mới, " +
        "chỉ lọc trong dữ liệu đã có. Dùng khi người dùng thêm điều kiện cho đúng lượt tìm vừa rồi (VD: \"chỉ lấy cái có website\", " +
        "\"sắp theo độ tin cậy\") thay vì muốn tìm một nhu cầu hoàn toàn mới.",
      parameters: {
        type: "object",
        properties: {
          min_confidence: { type: "number", description: "Chỉ giữ kết quả có độ tin cậy (confidence) từ mức này trở lên, 0-100" },
          require_website: { type: "boolean", description: "true = chỉ giữ kết quả có website" },
          require_phone: { type: "boolean", description: "true = chỉ giữ kết quả có số điện thoại" },
          sort_by: { type: "string", enum: ["confidence", "distance"], description: "Tiêu chí sắp xếp lại" },
        },
        required: [],
      },
    },
  },
] as const;

const BASE_SYSTEM_PROMPT = `Bạn là AI Search Agent của MIMIN GROUP - trợ lý tìm kiếm đối tác cho chuỗi cung ứng may mặc (xưởng sản xuất, nhà cung cấp nguyên phụ liệu, khách hàng).
Nguyên tắc:
- Khi người dùng muốn TÌM đối tác mới ngoài internet → gọi search_partners. Không tự bịa tên công ty, SĐT, địa chỉ.
- Khi người dùng hỏi chi tiết 1 đối tác đã có trong hệ thống → gọi get_partner_detail.
- Khi người dùng muốn so sánh nhiều đối tác → gọi compare_partners.
- Khi người dùng muốn đối tác tốt nhất/xếp hạng → gọi rank_partners.
- Khi người dùng muốn lưu 1 kết quả tìm kiếm vào vùng chờ duyệt → gọi save_partner_candidate với đúng result_index.
- Khi người dùng thêm/đổi điều kiện lọc cho ĐÚNG lượt tìm vừa rồi (không phải nhu cầu mới) → gọi refine_last_search, KHÔNG gọi search_partners lại (đỡ tốn API không cần thiết).
- Nếu tool search_partners trả về internalMatches (đối tác đã có sẵn trong hệ thống khớp chuyên môn), báo cho người dùng biết TRƯỚC khi nói về kết quả tìm mới ngoài internet.
- Sau khi có kết quả công cụ, trả lời ngắn gọn bằng tiếng Việt, nêu số lượng và 1-2 điểm nổi bật - KHÔNG liệt kê lại toàn bộ chi tiết vì giao diện đã hiển thị bảng kết quả riêng.
- Nếu công cụ báo lỗi hoặc không đủ quyền, giải thích rõ lý do cho người dùng thay vì im lặng hoặc bịa kết quả.`;

function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>\s*/gi, "").trim();
}

interface ToolSearchResults {
  candidates: Array<DirectSearchCandidate & { role: ProductionPartnerRole; roleLabel: string; resultIndex: number }>;
  diagnostics: unknown[];
  provider: string[];
}

async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
  auth: ChatAuth,
  turnResults: TurnResult[],
): Promise<{ toolMessageContent: unknown; results?: ToolSearchResults }> {
  if (name === "search_partners") {
    // Tìm mới thay thế hẳn "kết quả gần nhất" của cuộc hội thoại (kể cả kết quả được
    // client gửi lại từ lượt trước) - refine_last_search sau lượt này phải lọc trên bộ
    // kết quả MỚI, không lẫn với lượt tìm cũ.
    turnResults.length = 0;
    if (!ALLOWED_APP_ROLES.has(auth.role)) {
      return { toolMessageContent: { error: "Tài khoản của anh/chị chưa được cấp quyền tìm kiếm AI (cần vai trò admin/planner/warehouse/accountant)." } };
    }
    const specialty = typeof args.specialty === "string" ? args.specialty.trim() : "";
    const location = typeof args.location === "string" ? args.location.trim() : "";
    if (!specialty || !location) {
      return { toolMessageContent: { error: "Thiếu specialty hoặc location để tìm kiếm." } };
    }
    const product = typeof args.product === "string" ? args.product.trim() : "";
    const radiusKm = typeof args.radius_km === "number" ? args.radius_km : undefined;
    const limit = typeof args.limit === "number" ? Math.min(Math.max(Math.round(args.limit), 1), 50) : 20;
    const roles = partnerTypeToRoles(args.partner_type);
    const queryText = [specialty, product].filter(Boolean).join(", ");

    // Search Router Phase 1, bước "Internal MIMIN Database": kiểm tra đối tác đã có trong hệ
    // thống khớp chuyên môn TRƯỚC khi tốn tiền tìm ngoài internet. Không chặn tìm ngoài -
    // chỉ cho DeepSeek biết đã có sẵn gì để báo người dùng, tránh gợi ý trùng.
    let internalMatches: AgentPartnerDetail[] = [];
    try {
      const specialtyNeedle = specialty.toLowerCase();
      const internalCandidates = await rankPartners(auth.client, roles, 50);
      internalMatches = internalCandidates
        .filter((partner) => partner.capabilities.some((capability) => capability.toLowerCase().includes(specialtyNeedle) || specialtyNeedle.includes(capability.toLowerCase())))
        .slice(0, 5);
    } catch (error) {
      console.error("[mimin-group-agent] internal DB check failed:", error);
    }

    const searchResults = await Promise.all(
      roles.map((role) =>
        runSourcingSearch(
          { query: queryText, location, role, radiusKm, entryPoint: "AGENT_CHAT", rawQueryText: `[AI Agent] ${queryText} tại ${location}`, locationPriority: true },
          auth.sourcingAuth,
        ).catch((error) => {
          console.error(`[mimin-group-agent] search_partners role=${role} failed:`, error);
          return null;
        }),
      ),
    );

    const merged: TurnResult[] = [];
    const diagnosticsList: unknown[] = [];
    const providerList: string[] = [];
    for (let i = 0; i < roles.length; i += 1) {
      const result = searchResults[i];
      if (!result) continue;
      diagnosticsList.push(result.diagnostics);
      providerList.push(result.provider);
      // Lọc hậu kiểm nhẹ theo Search Profile ACTIVE (nếu có) của đúng vai trò này - profile
      // DRAFT/không tồn tại thì không đổi gì so với hành vi trước đây.
      const roleProfile = await getActiveProfile(auth.client, roles[i]);
      const roleCandidates = applyExclusionRules(result.candidates as unknown as DirectSearchCandidate[], roleProfile);
      for (const candidate of roleCandidates) {
        merged.push({ role: roles[i], candidate, searchQuery: `${queryText} | ${location}`, provider: result.provider });
      }
    }
    const limited = merged.slice(0, limit);
    const startIndex = turnResults.length;
    turnResults.push(...limited);

    const digestResults = limited.slice(0, 20).map((item, i) => ({
      index: startIndex + i,
      legalName: item.candidate.legalName,
      phone: item.candidate.phone || null,
      address: item.candidate.address || null,
      province: item.candidate.province || null,
      confidence: item.candidate.confidence,
      tier: item.candidate.resultTier ?? "EXACT",
    }));
    const internalDigest = internalMatches.map((partner) => ({
      partnerId: partner.id,
      legalName: partner.legalName,
      phone: partner.phone || null,
      capabilities: partner.capabilities,
      score: partner.score,
    }));

    const payload = {
      candidates: limited.map((item, i) => ({ ...item.candidate, role: item.role, roleLabel: ROLE_LABELS[item.role], resultIndex: startIndex + i })),
      diagnostics: diagnosticsList,
      provider: providerList,
    };

    return {
      toolMessageContent: {
        internalMatches: internalDigest.length ? internalDigest : undefined,
        internalNote: internalDigest.length ? "Đã có sẵn trong hệ thống - báo cho người dùng biết trước khi liệt kê kết quả tìm mới." : undefined,
        count: limited.length,
        truncatedForDisplay: limited.length > 20,
        results: digestResults,
      },
      results: payload,
    };
  }

  if (name === "get_partner_detail") {
    const partnerId = typeof args.partner_id === "string" ? args.partner_id : "";
    if (!partnerId) return { toolMessageContent: { error: "Thiếu partner_id" } };
    try {
      const detail = await getPartnerDetail(auth.client, partnerId);
      if (!detail) return { toolMessageContent: { error: "Không tìm thấy đối tác với id này" } };
      return { toolMessageContent: partnerDetailToText(detail) };
    } catch (error) {
      return { toolMessageContent: { error: error instanceof Error ? error.message : "Không lấy được hồ sơ đối tác" } };
    }
  }

  if (name === "compare_partners") {
    const ids = Array.isArray(args.partner_ids) ? args.partner_ids.filter((id): id is string => typeof id === "string") : [];
    if (ids.length === 0) return { toolMessageContent: { error: "Thiếu partner_ids" } };
    try {
      const details = await listPartnersForCompare(auth.client, ids);
      return { toolMessageContent: { count: details.length, partners: details.map(partnerDetailToText) } };
    } catch (error) {
      return { toolMessageContent: { error: error instanceof Error ? error.message : "Không so sánh được đối tác" } };
    }
  }

  if (name === "rank_partners") {
    const roles = partnerTypeToRoles(args.partner_type);
    const limit = typeof args.limit === "number" ? Math.min(Math.max(Math.round(args.limit), 1), 50) : 10;
    try {
      const ranked = await rankPartners(auth.client, roles, limit);
      return { toolMessageContent: { count: ranked.length, partners: ranked.map(partnerDetailToText) } };
    } catch (error) {
      return { toolMessageContent: { error: error instanceof Error ? error.message : "Không xếp hạng được đối tác" } };
    }
  }

  if (name === "save_partner_candidate") {
    const index = typeof args.result_index === "number" ? Math.round(args.result_index) : -1;
    const item = turnResults[index];
    if (!item) return { toolMessageContent: { error: "result_index không hợp lệ - phải lấy từ kết quả search_partners gần nhất trong cuộc hội thoại này." } };
    try {
      const saved = await insertDiscoveryCandidate(auth.client, item.candidate, item.role, item.searchQuery, `AGENT_${item.provider || "CHAT"}`);
      return { toolMessageContent: { saved: true, legalName: item.candidate.legalName, saveKey: saved.saveKey } };
    } catch (error) {
      return { toolMessageContent: { error: error instanceof Error ? error.message : "Không lưu được vào vùng chờ duyệt" } };
    }
  }

  if (name === "refine_last_search") {
    if (turnResults.length === 0) {
      return { toolMessageContent: { error: "Chưa có kết quả tìm kiếm nào trong cuộc hội thoại này để lọc lại. Hãy gọi search_partners trước." } };
    }
    let filtered = turnResults.map((item, index) => ({ item, index }));
    const minConfidence = typeof args.min_confidence === "number" ? args.min_confidence : null;
    if (minConfidence !== null) filtered = filtered.filter(({ item }) => item.candidate.confidence >= minConfidence);
    if (args.require_website === true) filtered = filtered.filter(({ item }) => Boolean(item.candidate.website?.trim()));
    if (args.require_phone === true) filtered = filtered.filter(({ item }) => Boolean(item.candidate.phone?.trim()));
    const sortBy = typeof args.sort_by === "string" ? args.sort_by : null;
    if (sortBy === "confidence") filtered = [...filtered].sort((a, b) => b.item.candidate.confidence - a.item.candidate.confidence);
    else if (sortBy === "distance") filtered = [...filtered].sort((a, b) => (a.item.candidate.distanceKm ?? Infinity) - (b.item.candidate.distanceKm ?? Infinity));

    const digestResults = filtered.slice(0, 20).map(({ item, index }) => ({
      index,
      legalName: item.candidate.legalName,
      phone: item.candidate.phone || null,
      address: item.candidate.address || null,
      province: item.candidate.province || null,
      confidence: item.candidate.confidence,
      tier: item.candidate.resultTier ?? "EXACT",
    }));

    const payload: ToolSearchResults = {
      candidates: filtered.map(({ item, index }) => ({ ...item.candidate, role: item.role, roleLabel: ROLE_LABELS[item.role], resultIndex: index })),
      diagnostics: [],
      provider: [],
    };

    return {
      toolMessageContent: { count: filtered.length, results: digestResults, note: "Đã lọc lại từ kết quả tìm kiếm trước, không gọi API mới." },
      results: payload,
    };
  }

  return { toolMessageContent: { error: `Tool ${name} không tồn tại` } };
}

async function callDeepSeekWithTools(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  auth: ChatAuth,
  initialTurnResults: TurnResult[],
): Promise<{ reply: string; toolCalls: Array<{ name: string; args: Record<string, unknown> }>; results: ToolSearchResults | null }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("Chưa cấu hình DEEPSEEK_API_KEY trên máy chủ");

  const baseBody = {
    model: "deepseek-chat",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature: 0.3,
    max_tokens: 1024,
    tools: TOOLS,
    tool_choice: "auto",
  };

  const firstRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(baseBody),
  });
  if (!firstRes.ok) {
    const err = await firstRes.text();
    throw new Error(`DeepSeek API lỗi ${firstRes.status}: ${err.slice(0, 200)}`);
  }
  const firstData = await firstRes.json();
  const message = firstData.choices?.[0]?.message;

  const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
  let results: ToolSearchResults | null = null;

  if (message?.tool_calls?.length) {
    // Seed từ kết quả tìm kiếm gần nhất (client gửi lại) để refine_last_search/
    // save_partner_candidate có dữ liệu tham chiếu ngay cả khi lượt tìm gốc là 1 request
    // HTTP khác (route này không giữ state giữa các lượt chat) - search_partners sẽ tự
    // reset mảng này nếu lượt hiện tại là 1 tìm kiếm mới (xem executeToolCall).
    const turnResults: TurnResult[] = [...initialTurnResults];
    const calls = (message.tool_calls as Array<{ id: string; function: { name: string; arguments: string } }>).slice(0, MAX_TOOL_CALLS_PER_TURN);
    const toolMessages: Array<{ role: string; tool_call_id: string; content: string }> = [];

    for (const call of calls) {
      const name = call.function?.name ?? "";
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function?.arguments || "{}");
      } catch {
        // giữ args rỗng nếu DeepSeek trả JSON hỏng
      }
      toolCalls.push({ name, args });
      const execResult = await executeToolCall(name, args, auth, turnResults);
      if (execResult.results) {
        results = results
          ? {
              candidates: [...results.candidates, ...execResult.results.candidates],
              diagnostics: [...results.diagnostics, ...execResult.results.diagnostics],
              provider: [...results.provider, ...execResult.results.provider],
            }
          : execResult.results;
      }
      toolMessages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(execResult.toolMessageContent) });
    }

    const secondRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: systemPrompt }, ...messages, message, ...toolMessages],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });
    if (!secondRes.ok) {
      return { reply: stripThinkTags(message?.content || "Đã có kết quả, nhưng AI chưa tổng hợp được câu trả lời."), toolCalls, results };
    }
    const secondData = await secondRes.json();
    return { reply: stripThinkTags(secondData.choices?.[0]?.message?.content || "Đã có kết quả tìm kiếm."), toolCalls, results };
  }

  return { reply: stripThinkTags(message?.content || "Không có phản hồi từ AI"), toolCalls, results };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateChatUser(req);
    if (!auth) return NextResponse.json({ error: "Không có quyền - vui lòng đăng nhập lại" }, { status: 401 });
    if (!canView(auth.role, "nha-cung-cap")) {
      return NextResponse.json({ error: "Tài khoản không có quyền xem Mạng lưới đối tác" }, { status: 403 });
    }

    const ip = getClientIp(req);
    const perUser = checkRateLimit(`mimin-group-agent:user:${auth.user.id}`, { max: 15, windowMs: 60_000 });
    if (!perUser.allowed) {
      return NextResponse.json({ error: `Anh/chị gửi quá nhiều tin nhắn, vui lòng đợi ${perUser.retryAfterSec}s` }, { status: 429 });
    }
    const perIp = checkRateLimit(`mimin-group-agent:ip:${ip}`, { max: 40, windowMs: 60_000 });
    if (!perIp.allowed) {
      return NextResponse.json({ error: `Quá nhiều yêu cầu từ mạng của anh/chị, vui lòng đợi ${perIp.retryAfterSec}s` }, { status: 429 });
    }

    const body = await req.json() as { message?: string; history?: Array<{ role: string; content: string }>; lastResults?: unknown };
    const userMessage = (body.message ?? "").trim().slice(0, 1000);
    if (!userMessage) return NextResponse.json({ error: "Vui lòng nhập nội dung tìm kiếm" }, { status: 400 });

    const initialTurnResults = parseEchoedResults(body.lastResults);

    const history = Array.isArray(body.history)
      ? body.history
          .filter((item) => (item.role === "user" || item.role === "assistant") && typeof item.content === "string" && item.content.trim())
          .slice(-MAX_HISTORY_MESSAGES)
          .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 1000) }))
      : [];

    const messages = [...history, { role: "user", content: userMessage }];

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: "Tính năng AI Search Agent chưa được cấu hình (thiếu DEEPSEEK_API_KEY)" }, { status: 503 });
    }

    const [agentConfig, activeProfiles] = await Promise.all([
      getAgentConfig(auth.client),
      listActiveProfiles(auth.client),
    ]);
    const systemPrompt = `${BASE_SYSTEM_PROMPT}${agentConfigToPromptContext(agentConfig)}${profilesToPromptContext(activeProfiles)}`;

    const { reply, toolCalls, results } = await callDeepSeekWithTools(systemPrompt, messages, auth, initialTurnResults);
    return NextResponse.json({ reply, toolCalls, results });
  } catch (error) {
    console.error("[mimin-group-agent-chat] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI Search Agent gặp lỗi" }, { status: 502 });
  }
}
