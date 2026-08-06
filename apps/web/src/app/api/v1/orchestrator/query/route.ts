import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit-log";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { AGENT_PERSONAS } from "@/lib/agent-personas";
import { PERSONALITY_SYSTEM } from "@/lib/agent-personality";
import { PROJECT_MANAGER_CONFIG } from "@/lib/agent-project-manager";
import { routeTask, formatRouteForMavis } from "@/lib/agent-routing-rules";
import { getAllTools } from "@/lib/ai-tools";

// Đảm bảo không bị timeout trên Vercel nếu request hơi lâu
export const maxDuration = 60;

// ============================================
// PROVIDER MAPPING
// ============================================
type ProviderName = "deepseek" | "minimax" | "gemini";

interface ProviderConfig {
  model: any;
  systemPromptBase: string;
  modelName: string;
}

const ORCHESTRATOR_INTRO = `
Bạn là MIMIN AI, trợ lý ảo thông minh của hệ thống quản lý sản xuất may mặc MIMIN ERP (do sếp Sang tạo ra).
Bạn hãy xưng là "em" và gọi người dùng theo nguyên tắc SAU (rất quan trọng):

**NGUYÊN TẮC XƯNG HÔ VỚI USER:**
- Nếu user_id = "sang@mimin.vn" hoặc "sang" → đây là ADMIN, gọi là "sếp Sang" hoặc "anh MrKey Sang"
- Nếu user_id là user @mimin.vn khác → gọi "anh/chị <tên thật của họ>"
- Nếu không rõ → mặc định gọi "sếp"
- TUYỆT ĐỐI KHÔNG gọi "anh Cường" / "a Cường" - đã xoá tên này khỏi hệ thống

Giọng văn của bạn phải chuyên nghiệp, ngắn gọn, thân thiện và có phong cách "anh-em" casual.
`;

// ============================================
// BUILD PROVIDER CONFIG
// ============================================
async function buildProviderConfig(agentId: string): Promise<ProviderConfig | null> {
  const persona = AGENT_PERSONAS[agentId];
  if (!persona) return null;

  const basePrompt = ORCHESTRATOR_INTRO + "\n" + PERSONALITY_SYSTEM + "\n" + PROJECT_MANAGER_CONFIG + "\n" + persona.system_prompt;
  const systemPromptBase = basePrompt + `

Bạn có quyền truy cập vào các công cụ (tools) để đọc dữ liệu thật của hệ thống.
Khi được hỏi về số liệu, hãy LUÔN gọi tool tương ứng để lấy dữ liệu thay vì đoán.
Sau khi có dữ liệu từ tool, hãy format nó lại thành câu trả lời dễ đọc, có thể dùng bullet points, in đậm.

KHÔNG ĐƯỢC tự bịa số liệu. Nếu tool trả về rỗng, hãy báo là chưa tìm thấy dữ liệu.
LUÔN trả lời bằng Tiếng Việt.

Vùng dữ liệu bạn được phép truy cập: ${persona.allowed_domains.join(", ")}.
`;

  // Trả về config tùy theo provider
  switch (persona.provider) {
    case "gemini":
      return {
        model: google("gemini-1.5-pro-latest"),
        systemPromptBase,
        modelName: persona.model,
      };
    case "deepseek":
    case "minimax":
      // DeepSeek & Minimax dùng OpenAI-compatible API - xử lý qua custom provider trong hàm callProvider
      return {
        model: null, // không dùng Vercel AI SDK cho 2 provider này
        systemPromptBase,
        modelName: persona.model,
      };
    default:
      return null;
  }
}

// ============================================
// CALL DEEPSEEK / MINIMAX (OpenAI-compatible)
// ============================================
async function callOpenAICompatible(
  provider: ProviderName,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  // DeepSeek: api.deepseek.com (chỉ cần API key)
  // MiniMax (MiniMax) International: api.minimax.io (chỉ cần API key, OpenAI-compatible)
  // Note: MiniMax China (api.minimax.chat) cần thêm GroupId - không dùng ở đây
  const baseUrl =
    provider === "deepseek" ? "https://api.deepseek.com/v1" : "https://api.minimax.io/v1";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${provider} API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Không có phản hồi từ AI";
}

// ============================================
// MAIN HANDLER
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, messages = [], agent_id: requestedAgentId, hint_agent: hintAgentId } = body;

    if (!user_id || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing user_id or messages" },
        { status: 400 }
      );
    }

    // Lấy nội dung từ message cuối
    const lastMessage = messages[messages.length - 1];
    const userInput = typeof lastMessage?.content === "string"
      ? lastMessage.content
      : lastMessage?.parts?.find((p: any) => p.type === "text")?.text || "";

    // ============================================
    // 1. ROUTING - Phân loại task → agent phù hợp
    // ============================================
    let agentId = requestedAgentId || hintAgentId;
    let routeResult = null;

    if (!agentId) {
      routeResult = routeTask(userInput);
      agentId = routeResult.primary?.agentId || "mimin-orchestrator";
    }

    const persona = AGENT_PERSONAS[agentId] || AGENT_PERSONAS["mimin-orchestrator"];
    const provider = persona.provider as ProviderName;

    // Log audit
    logAudit({
      user: { id: user_id, email: user_id, name: user_id, role: "user", title: "User", source: "demo" },
      action: "create",
      module: "cai-dat",
      description: `[${persona.name}] ${userInput.slice(0, 150)}`,
    });

    // ============================================
    // 2. SWITCH BY PROVIDER
    // ============================================

    // GEMINI - dùng Vercel AI SDK + streaming
    if (provider === "gemini") {
      const config = await buildProviderConfig(agentId);
      if (!config || !config.model) {
        return NextResponse.json({ error: "Gemini config error" }, { status: 500 });
      }
      const result = streamText({
        model: config.model,
        system: config.systemPromptBase,
        messages: await convertToModelMessages(messages as UIMessage[]),
        tools: getAllTools(),
      });
      return result.toUIMessageStreamResponse();
    }

    // DEEPSEEK - gọi API thẳng
    if (provider === "deepseek") {
      const apiKey = process.env.DEEPSEEK_API_KEY || "";
      if (!apiKey) {
        return NextResponse.json({ error: "DEEPSEEK_API_KEY not configured" }, { status: 500 });
      }
      const config = await buildProviderConfig(agentId);
      if (!config) return NextResponse.json({ error: "Config error" }, { status: 500 });
      const text = await callOpenAICompatible("deepseek", apiKey, persona.model, config.systemPromptBase, userInput);
      return NextResponse.json({
        agent: { id: agentId, name: persona.name, provider, model: persona.model },
        routing: routeResult ? { taskTypes: routeResult.taskTypes, isMultiAgent: routeResult.isMultiAgent, totalAgents: routeResult.totalAgents } : null,
        response: text,
      });
    }

    // MINIMAX - gọi API thẳng
    if (provider === "minimax") {
      const apiKey = process.env.MINIMAX_API_KEY || "";
      if (!apiKey) {
        return NextResponse.json({ error: "MINIMAX_API_KEY not configured" }, { status: 500 });
      }
      const config = await buildProviderConfig(agentId);
      if (!config) return NextResponse.json({ error: "Config error" }, { status: 500 });
      const text = await callOpenAICompatible("minimax", apiKey, persona.model, config.systemPromptBase, userInput);
      return NextResponse.json({
        agent: { id: agentId, name: persona.name, provider, model: persona.model },
        routing: routeResult ? { taskTypes: routeResult.taskTypes, isMultiAgent: routeResult.isMultiAgent, totalAgents: routeResult.totalAgents } : null,
        response: text,
      });
    }

    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 500 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal error";
    console.error(`[orchestrator] error:`, error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
