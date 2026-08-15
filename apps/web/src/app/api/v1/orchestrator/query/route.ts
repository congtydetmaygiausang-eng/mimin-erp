import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit-log";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { AGENT_PERSONAS } from "@/lib/agent-personas";
import { PERSONALITY_SYSTEM } from "@/lib/agent-personality";
import { PROJECT_MANAGER_CONFIG } from "@/lib/agent-project-manager";
import { routeTask } from "@/lib/agent-routing-rules";
import { getAllTools, getToolsForDomain } from "@/lib/ai-tools";

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

// ============================================
// CORE ORCHESTRATOR INTRO (ngắn gọn hơn)
// ============================================
const ORCHESTRATOR_INTRO = `
Bạn là MIMIN AI, trợ lý ảo thông minh của hệ thống quản lý sản xuất may mặc MIMIN ERP.
Xưng "em", gọi user theo nguyên tắc:
- user_id = "sang@mimin.vn" hoặc "sang" → gọi "sếp Sang" hoặc "anh MrKey Sang"  
- user @mimin.vn khác → gọi "anh/chị <tên thật>"
- Không rõ → gọi "sếp"
- TUYỆT ĐỐI KHÔNG gọi "anh Cường" / "a Cường"

Giọng văn: chuyên nghiệp, ngắn gọn, thân thiện, phong cách "anh-em" casual.
`;

// ============================================
// CONVERSATION SUMMARY (Fix 5: summarize sau 10 messages)
// ============================================
function buildConversationSummary(messages: any[]): string {
  if (messages.length <= 10) return "";
  
  // Lấy 5 message đầu làm context lịch sử
  const oldMessages = messages.slice(0, messages.length - 8);
  const summaryLines: string[] = ["[TÓM TẮT HỘI THOẠI TRƯỚC:]"];
  
  for (const msg of oldMessages.slice(-5)) {
    const role = msg.role === "user" ? "User" : "AI";
    const content = typeof msg.content === "string" 
      ? msg.content.slice(0, 150) 
      : msg.parts?.find((p: any) => p.type === "text")?.text?.slice(0, 150) || "";
    if (content) summaryLines.push(`${role}: ${content}${content.length >= 150 ? "..." : ""}`);
  }
  
  return summaryLines.join("\n") + "\n[HẾT TÓM TẮT]\n\n";
}

// ============================================
// BUILD FULL SYSTEM PROMPT (Fix 3: tối ưu token)
// ============================================
function buildSystemPrompt(persona: any, conversationSummary: string): string {
  // Chỉ dùng PERSONALITY_SYSTEM (core rules) + persona cụ thể
  // Bỏ PROJECT_MANAGER_CONFIG nếu không cần cho agent đó
  const needsPMConfig = ["mimin-orchestrator", "mavis"].includes(persona.agent_id);
  
  const parts = [
    ORCHESTRATOR_INTRO,
    PERSONALITY_SYSTEM,
    needsPMConfig ? PROJECT_MANAGER_CONFIG : "",
    persona.system_prompt,
    conversationSummary,
    `
Bạn có quyền truy cập các tools để đọc dữ liệu thật. LUÔN gọi tool khi được hỏi về số liệu.
Vùng dữ liệu được phép: ${persona.allowed_domains.join(", ")}.
KHÔNG bịa số liệu. Nếu tool trả về rỗng → báo "chưa tìm thấy dữ liệu".
LUÔN trả lời bằng Tiếng Việt.
`,
  ];
  
  return parts.filter(Boolean).join("\n\n");
}

// ============================================
// BUILD PROVIDER CONFIG
// ============================================
async function buildProviderConfig(agentId: string, conversationSummary = ""): Promise<ProviderConfig | null> {
  const persona = AGENT_PERSONAS[agentId];
  if (!persona) return null;

  const systemPromptBase = buildSystemPrompt(persona, conversationSummary);

  switch (persona.provider) {
    case "gemini":
      return {
        model: google(persona.model.includes("pro") ? "gemini-1.5-pro-latest" : "gemini-1.5-flash-latest"),
        systemPromptBase,
        modelName: persona.model,
      };
    case "deepseek":
    case "minimax":
      return {
        model: null,
        systemPromptBase,
        modelName: persona.model,
      };
    default:
      return null;
  }
}

// ============================================
// CALL DEEPSEEK / MINIMAX với TOOLS support (Fix 1)
// Implement tool calling theo OpenAI function calling format
// ============================================
async function callOpenAICompatibleWithTools(
  provider: ProviderName,
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  allowedDomains: string[]
): Promise<string> {
  const baseUrl =
    provider === "deepseek" ? "https://api.deepseek.com/v1" : "https://api.minimax.io/v1";

  // Lấy tools phù hợp với domain của agent
  const tools = getToolsForDomain(allowedDomains);

  const requestBody: any = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature: 0.3,
    max_tokens: 2048,
  };

  // Thêm tools nếu có (Fix 1: DeepSeek/MiniMax giờ có tools)
  if (tools.length > 0) {
    requestBody.tools = tools;
    requestBody.tool_choice = "auto";
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${provider} API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message;

  // Xử lý tool calls nếu model muốn gọi tool (Fix 1 continued)
  if (message?.tool_calls && message.tool_calls.length > 0) {
    const toolResults: Array<{ role: string; tool_call_id: string; content: string }> = [];
    
    for (const toolCall of message.tool_calls) {
      try {
        const toolName = toolCall.function?.name;
        const toolArgs = JSON.parse(toolCall.function?.arguments || "{}");
        const toolResult = await executeToolByName(toolName, toolArgs);
        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      } catch {
        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: "Tool execution failed",
        });
      }
    }

    // Second pass: gửi kết quả tool về để AI tổng hợp câu trả lời
    const secondRes = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
          message, // assistant message với tool_calls
          ...toolResults,
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!secondRes.ok) {
      // Fallback: trả về câu trả lời gốc nếu second pass lỗi
      return message?.content || "Không có phản hồi từ AI";
    }

    const secondData = await secondRes.json();
    return secondData.choices?.[0]?.message?.content || "Không có phản hồi từ AI";
  }

  return message?.content || "Không có phản hồi từ AI";
}

// ============================================
// EXECUTE TOOL BY NAME (bridge cho DeepSeek/MiniMax)
// ============================================
async function executeToolByName(toolName: string, args: Record<string, any>): Promise<any> {
  // Dynamic import để tránh circular dependency
  const toolsModule = await import("@/lib/ai-tools");
  const allTools = toolsModule.getAllTools();
  
  const tool = (allTools as any)[toolName];
  if (!tool) return `Tool ${toolName} không tồn tại`;
  
  // Execute the tool
  return await tool.execute(args);
}

// ============================================
// CONVERT UIMessages → simple messages array (Fix 2: full history)
// ============================================
function convertToSimpleMessages(
  messages: any[],
  maxHistory = 20
): Array<{ role: string; content: string }> {
  // Giữ tối đa maxHistory messages gần nhất để tránh quá dài
  const recentMessages = messages.slice(-maxHistory);
  
  return recentMessages
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({
      role: m.role,
      content: typeof m.content === "string"
        ? m.content
        : m.parts?.find((p: any) => p.type === "text")?.text || "",
    }))
    .filter(m => m.content); // loại bỏ message rỗng
}

// ============================================
// MAIN HANDLER
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, messages = [], agent_id: requestedAgentId } = body;

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
    let agentId = requestedAgentId;
    let routeResult = null;

    if (!agentId) {
      routeResult = routeTask(userInput);
      agentId = routeResult.primary?.agentId || "mimin-orchestrator";
    }

    const persona = AGENT_PERSONAS[agentId] || AGENT_PERSONAS["mimin-orchestrator"];
    const provider = persona.provider as ProviderName;

    // ============================================
    // Fix 5: Tạo conversation summary nếu > 10 messages
    // ============================================
    const conversationSummary = buildConversationSummary(messages as UIMessage[]);

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

    // GEMINI - streaming + full tools (giữ nguyên, đã hoạt động tốt)
    if (provider === "gemini") {
      const config = await buildProviderConfig(agentId, conversationSummary);
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

    // DEEPSEEK - Fix 1+2: có tools + full conversation history
    if (provider === "deepseek") {
      const apiKey = process.env.DEEPSEEK_API_KEY || "";
      if (!apiKey) {
        // Fallback sang Gemini nếu không có DeepSeek key
        return handleGeminiFallback(agentId, messages as UIMessage[], conversationSummary);
      }
      const config = await buildProviderConfig(agentId, conversationSummary);
      if (!config) return NextResponse.json({ error: "Config error" }, { status: 500 });
      
      // Fix 2: truyền FULL conversation history (tối đa 20 messages gần nhất)
      const fullMessages = convertToSimpleMessages(messages as UIMessage[], 20);
      
      // Fix 1: gọi với tools support
      const text = await callOpenAICompatibleWithTools(
        "deepseek",
        apiKey,
        persona.model,
        config.systemPromptBase,
        fullMessages,
        persona.allowed_domains
      );
      
      return NextResponse.json({
        agent: { id: agentId, name: persona.name, provider, model: persona.model },
        routing: routeResult
          ? { taskTypes: routeResult.taskTypes, isMultiAgent: routeResult.isMultiAgent, totalAgents: routeResult.totalAgents }
          : null,
        response: text,
      });
    }

    // MINIMAX - Fix 1+2: có tools + full conversation history
    if (provider === "minimax") {
      const apiKey = process.env.MINIMAX_API_KEY || "";
      if (!apiKey) {
        // Fallback sang Gemini nếu không có MiniMax key
        return handleGeminiFallback(agentId, messages as UIMessage[], conversationSummary);
      }
      const config = await buildProviderConfig(agentId, conversationSummary);
      if (!config) return NextResponse.json({ error: "Config error" }, { status: 500 });
      
      const fullMessages = convertToSimpleMessages(messages as UIMessage[], 20);
      
      const text = await callOpenAICompatibleWithTools(
        "minimax",
        apiKey,
        persona.model,
        config.systemPromptBase,
        fullMessages,
        persona.allowed_domains
      );
      
      return NextResponse.json({
        agent: { id: agentId, name: persona.name, provider, model: persona.model },
        routing: routeResult
          ? { taskTypes: routeResult.taskTypes, isMultiAgent: routeResult.isMultiAgent, totalAgents: routeResult.totalAgents }
          : null,
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

// ============================================
// GEMINI FALLBACK (khi DeepSeek/MiniMax không có key)
// ============================================
async function handleGeminiFallback(
  agentId: string,
  messages: any[],
  conversationSummary: string
): Promise<any> {
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  if (!geminiKey) {
    return NextResponse.json(
      { error: "Không có API key nào được cấu hình. Vui lòng thêm DEEPSEEK_API_KEY, MINIMAX_API_KEY hoặc GOOGLE_GENERATIVE_AI_API_KEY vào .env" },
      { status: 500 }
    );
  }
  
  const config = await buildProviderConfig(agentId, conversationSummary);
  if (!config) {
    return NextResponse.json({ error: "Gemini fallback config error" }, { status: 500 });
  }
  
  const result = streamText({
    model: google("gemini-1.5-flash-latest"),
    system: config.systemPromptBase,
    messages: await convertToModelMessages(messages),
    tools: getAllTools(),
  });
  
  return result.toUIMessageStreamResponse();
}
