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
import { applyExclusionRules, getActiveProfile } from "@/lib/sourcing/search-profiles";
import { canView } from "@/lib/permissions";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { ROLE_LABELS, type ProductionPartnerRole } from "@/lib/production-network";
import type { DirectSearchCandidate } from "@/lib/production-discovery";

export const maxDuration = 55;

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

    let internalMatches: AgentPartnerDetail[] = [];
    try {
      const specialtyNeedle = specialty.toLowerCase();
      const internalCandidates = await rankPartners(auth.client, roles, 50);
      internalMatches = internalCandidates
        .filter((partner) => partner.capabilities.some((capability) => capability.toLowerCase().includes(specialtyNeedle) || specialtyNeedle.includes(capability.toLowerCase())))
        .slice(0, 5);
    } catch (error) {
      console.error("[mimin-group-agent-tools] internal DB check failed:", error);
    }

    const searchResults = [];
    for (const role of roles) {
      try {
        const res = await runSourcingSearch(
          { query: queryText, location, role, radiusKm, entryPoint: "AGENT_CHAT", rawQueryText: `[AI Agent] ${queryText} tại ${location}`, locationPriority: true },
          auth.sourcingAuth,
        );
        searchResults.push(res);
      } catch (error) {
        console.error(`[mimin-group-agent-tools] search_partners role=${role} failed:`, error);
        searchResults.push(null);
      }
    }

    const merged: TurnResult[] = [];
    const diagnosticsList: unknown[] = [];
    const providerList: string[] = [];
    for (let i = 0; i < roles.length; i += 1) {
      const result = searchResults[i];
      if (!result) continue;
      diagnosticsList.push(result.diagnostics);
      providerList.push(result.provider);
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

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateChatUser(req);
    if (!auth) return NextResponse.json({ error: "Không có quyền - vui lòng đăng nhập lại" }, { status: 401 });
    if (!canView(auth.role, "nha-cung-cap")) {
      return NextResponse.json({ error: "Tài khoản không có quyền xem Mạng lưới đối tác" }, { status: 403 });
    }

    const ip = getClientIp(req);
    const perUser = checkRateLimit(`mimin-group-agent-tools:user:${auth.user.id}`, { max: 30, windowMs: 60_000 });
    if (!perUser.allowed) return NextResponse.json({ error: "Thao tác quá nhanh" }, { status: 429 });

    const body = await req.json();
    if (!Array.isArray(body.toolCalls) || !Array.isArray(body.turnResults)) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    const turnResults: TurnResult[] = body.turnResults;
    const toolMessages: Array<{ role: string; tool_call_id: string; content: string }> = [];
    let aggregatedResults: ToolSearchResults | null = null;

    for (const call of body.toolCalls) {
      const name = call.function?.name ?? "";
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function?.arguments || "{}");
      } catch {
        // ignore
      }
      const execResult = await executeToolCall(name, args, auth, turnResults);
      if (execResult.results) {
        aggregatedResults = aggregatedResults
          ? {
              candidates: [...aggregatedResults.candidates, ...execResult.results.candidates],
              diagnostics: [...aggregatedResults.diagnostics, ...execResult.results.diagnostics],
              provider: [...aggregatedResults.provider, ...execResult.results.provider],
            }
          : execResult.results;
      }
      toolMessages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(execResult.toolMessageContent) });
    }

    return NextResponse.json({ toolMessages, turnResults, results: aggregatedResults });
  } catch (error) {
    console.error("[mimin-group-agent-tools] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Thực thi tool thất bại" }, { status: 500 });
  }
}
