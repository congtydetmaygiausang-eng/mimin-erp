// @codex MIMIN GROUP - AI Search Agent hội thoại (tool-calling thật qua DeepSeek).
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { agentConfigToPromptContext, getAgentConfig } from "@/lib/sourcing/agent-config";
import { getActiveProfile, listActiveProfiles, profilesToPromptContext } from "@/lib/sourcing/search-profiles";
import { canView } from "@/lib/permissions";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const maxDuration = 55;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 25000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Kết nối tới máy chủ AI vượt quá thời gian cho phép (${timeoutMs / 1000}s). Vui lòng thử lại.`);
    }
    throw error;
  }
}

const MAX_HISTORY_MESSAGES = 15;

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

QUAN TRỌNG: SAU KHI CÓ KẾT QUẢ TỪ CÔNG CỤ (đặc biệt là search_partners), BẠN BẮT BUỘC PHẢI TRÌNH BÀY BÁO CÁO THEO ĐÚNG CẤU TRÚC SAU (không liệt kê chi tiết vì đã có thẻ giao diện ở dưới):

### Kết quả tìm kiếm [Nội dung ngắn gọn]

Tìm được **[Số lượng]** kết quả, tuy nhiên hầu hết đều có độ tin cậy [cao/trung bình/thấp] và [nêu 1 điểm yếu chung, VD: chưa xác minh được số điện thoại]. Một số điểm nổi bật:

Các kết quả đáng chú ý nhất:
- **[Tên công ty 1]** — [Mô tả rất ngắn gọn 1 dòng]
- **[Tên công ty 2]** — [Mô tả rất ngắn gọn 1 dòng]
- **[Tên công ty 3]** — [Mô tả rất ngắn gọn 1 dòng]

⚠️ Lưu ý: Hầu hết các kết quả [Nêu rõ nhược điểm hoặc rủi ro của tập kết quả này để người dùng cẩn thận].

Bạn có muốn tôi:
1. Lọc lại chỉ giữ các kết quả có độ tin cậy cao hơn?
2. Tìm kiếm mở rộng sang khu vực lân cận?
3. Lưu một số kết quả tiềm năng vào vùng chờ duyệt?`;

function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>\s*/gi, "").trim();
}

async function authenticateChatUser(req: NextRequest) {
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
  return { user: data.user, client, role };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateChatUser(req);
    if (!auth) return NextResponse.json({ error: "Không có quyền - vui lòng đăng nhập lại" }, { status: 401 });
    if (!canView(auth.role, "nha-cung-cap")) {
      return NextResponse.json({ error: "Tài khoản không có quyền xem Mạng lưới đối tác" }, { status: 403 });
    }

    const ip = getClientIp(req);
    const perUser = checkRateLimit(`mimin-group-agent-proxy:user:${auth.user.id}`, { max: 40, windowMs: 60_000 });
    if (!perUser.allowed) return NextResponse.json({ error: `Vui lòng đợi ${perUser.retryAfterSec}s` }, { status: 429 });

    const body = await req.json();
    const history = Array.isArray(body.messages)
      ? body.messages
          .filter((item: any) => item.role && item.content !== undefined)
          .slice(-MAX_HISTORY_MESSAGES)
      : [];

    if (!history.length) return NextResponse.json({ error: "Tin nhắn trống" }, { status: 400 });

    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const minimaxKey = process.env.MINIMAX_API_KEY;
    if (!deepseekKey && !minimaxKey) {
      return NextResponse.json({ error: "Chưa cấu hình API Key" }, { status: 503 });
    }

    let activeKey = deepseekKey || minimaxKey;
    let activeUrl = deepseekKey ? "https://api.deepseek.com/v1/chat/completions" : "https://api.minimax.chat/v1/chat/completions";
    let activeModel = deepseekKey ? "deepseek-chat" : "abab6.5s-chat";

    const [agentConfig, activeProfiles] = await Promise.all([
      getAgentConfig(auth.client),
      listActiveProfiles(auth.client),
    ]);
    const systemPrompt = `${BASE_SYSTEM_PROMPT}${agentConfigToPromptContext(agentConfig)}${profilesToPromptContext(activeProfiles)}`;

    const baseBody = {
      model: activeModel,
      messages: [{ role: "system", content: systemPrompt }, ...history],
      temperature: 0.3,
      max_tokens: 1024,
      tools: TOOLS,
      tool_choice: "auto",
    };

    const aiWork = async () => {
      let response = await fetchWithTimeout(activeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${activeKey}` },
        body: JSON.stringify(baseBody),
      }, 25000);

      if (!response.ok && deepseekKey && minimaxKey && activeKey === deepseekKey) {
        console.warn(`[agent] DeepSeek failed, fallback to MiniMax...`);
        activeKey = minimaxKey;
        activeUrl = "https://api.minimax.chat/v1/chat/completions";
        baseBody.model = "abab6.5s-chat";
        response = await fetchWithTimeout(activeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${activeKey}` },
          body: JSON.stringify(baseBody),
        }, 25000);
      }

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`API lỗi ${response.status}: ${err.slice(0, 200)}`);
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message;
      if (message?.content) message.content = stripThinkTags(message.content);
      return { message };
    };

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let isClosed = false;
        const intervalId = setInterval(() => {
          if (isClosed) return;
          try { controller.enqueue(encoder.encode(" ")); } catch (e) {}
        }, 2000);

        try {
          const result = await aiWork();
          if (!isClosed) controller.enqueue(encoder.encode(JSON.stringify(result)));
        } catch (error) {
          console.error("[mimin-group-agent-proxy] error:", error);
          const errMsg = error instanceof Error ? error.message : "AI Proxy gặp lỗi";
          if (!isClosed) controller.enqueue(encoder.encode(JSON.stringify({ error: errMsg })));
        } finally {
          isClosed = true;
          clearInterval(intervalId);
          try { controller.close(); } catch (e) {}
        }
      }
    });

    return new Response(stream, { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[mimin-group-agent-proxy] outer error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI Proxy gặp lỗi" }, { status: 502 });
  }
}
