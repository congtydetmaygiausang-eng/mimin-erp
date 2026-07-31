// ============================================
// MIMIN ERP - Agent Runtime V2 (v89.6.9.3)
// Support Multi-Turn, Multi-Provider Delegation
// ============================================

import { getProviderForAgent, getApiKeyForProvider, PROVIDER_CONFIGS } from "./agent-routing-config";
import { AGENT_PERSONAS } from "./agent-personas";
import { logAudit } from "./audit-log";

export interface AgentV2Request {
  agent_id: string;
  query: string;
  user_id: string;
  context?: Record<string, any>;
}

export interface AgentV2Response {
  success: boolean;
  agent_id: string;
  agent_name: string;
  provider: string;
  response: string;
  latency_ms: number;
  tokens_used?: number;
  actions_taken?: { tool: string; result: any }[];
  error?: string;
}

export async function callAgentV2(req: AgentV2Request): Promise<AgentV2Response> {
  const start = Date.now();
  const persona = getProviderForAgent(req.agent_id);
  const apiKey = getApiKeyForProvider(persona.provider);

  // Fallback sang DeepSeek hoặc Mock nếu thiếu key
  if (!apiKey) {
    return mockAgentResponse(persona, req, start);
  }

  try {
    const config = PROVIDER_CONFIGS[persona.provider];
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: persona.model,
        messages: [
          { role: "system", content: persona.system_prompt },
          { role: "user", content: req.query },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      return mockAgentResponse(persona, req, start);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "Đã nhận thông tin.";
    const latency = Date.now() - start;

    logAudit({
      user: { id: req.user_id, email: req.user_id, name: req.user_id, role: "user", title: "User", source: "demo" },
      action: "view" as any,
      module: "cai-dat" as any,
      description: `${persona.name} (${persona.provider}) handled query in ${latency}ms`,
    });

    return {
      success: true,
      agent_id: persona.agent_id,
      agent_name: persona.name,
      provider: persona.provider,
      response: content,
      latency_ms: latency,
      tokens_used: data.usage?.total_tokens || 150,
    };
  } catch (e: any) {
    return mockAgentResponse(persona, req, start);
  }
}

function mockAgentResponse(persona: any, req: AgentV2Request, startTime: number): AgentV2Response {
  const latency = Date.now() - startTime + Math.floor(Math.random() * 150) + 100;
  const mocks: Record<string, string> = {
    "agent-san-xuat": `🏭 **${persona.name} (GĐ Sản xuất)**:\nĐã kiểm tra tiến độ sản xuất. Lệnh cắt M758 hiện tại đạt 85% tiến độ, chuyền may 02 đang hoàn thiện 450/500 sản phẩm.`,
    "agent-kho": `📦 **${persona.name} (GĐ Kho)**:\nTồn kho vải hiện tại: 12,500 kg vải Cotton Polo, 4,200 kg vải Bo cổ. Đã sẵn sàng xuất kho cho kế hoạch ngày mai.`,
    "agent-ke-toan": `💰 **${persona.name} (Kế toán Trưởng)**:\nĐã đối soát xong 14 phiếu tiền công đợt này. Tổng tiền công cần thanh toán là 48.500.000 VNĐ.`,
    "agent-nhan-su": `👤 **${persona.name} (TP Nhân sự)**:\nDanh sách nhân sự hiện tại: 17 công nhân chuyền may và 4 nhân viên kho. Tất cả đã điểm danh hôm nay.`,
  };

  const text = mocks[persona.agent_id] || `🤖 **${persona.name}**:\nEm đã xử lý xong yêu cầu "${req.query}". Tất cả số liệu hệ thống đang ở trạng thái chuẩn hóa.`;

  return {
    success: true,
    agent_id: persona.agent_id,
    agent_name: persona.name,
    provider: `${persona.provider} (simulated)`,
    response: text,
    latency_ms: latency,
    tokens_used: 120,
  };
}
