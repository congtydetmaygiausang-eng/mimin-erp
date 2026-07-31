// ============================================
// MIMIN ERP - Agent Runtime
// Tích hợp Mavis API (hoặc Claude API) thật
// Fallback về mock nếu không có API key
// ============================================

import { logAudit } from "./audit-log";

export interface AgentConfig {
  agent_id: string;
  name: string;
  model: string;
  system_prompt: string;
  tools: string[];
  context?: {
    database_tables?: string[];
    data_scope?: string;
    max_rows_per_query?: number;
  };
}

export interface AgentCallRequest {
  agent_id: string;
  tool: string;
  params: Record<string, any>;
  user_id: string;
  context?: Record<string, any>;
}

export interface AgentCallResponse {
  success: boolean;
  agent_id: string;
  tool: string;
  result?: any;
  summary?: string;
  error?: string;
  latency_ms: number;
  tokens_used?: number;
}

// ============================================
// MAVIS API CONFIG
// ============================================
const MAVIS_BASE_URL = process.env.Mavis_BASE_URL || "https://api.Mavis.dev/v1";
const MAVIS_API_KEY = process.env.Mavis_API_KEY || process.env.Mavis_API_KEY || "";
const USE_MOCK = !MAVIS_API_KEY; // fallback nếu không có key

// ============================================
// CALL AGENT (Mavis API thật hoặc mock)
// ============================================
export async function callAgent(req: AgentCallRequest): Promise<AgentCallResponse> {
  const start = Date.now();

  // Load agent config
  const config = await loadAgentConfig(req.agent_id);
  if (!config) {
    return {
      success: false,
      agent_id: req.agent_id,
      tool: req.tool,
      error: `Agent ${req.agent_id} không tồn tại`,
      latency_ms: Date.now() - start,
    };
  }

  // Permission check
  const hasPermission = await checkPermission(req.user_id, req.agent_id);
  if (!hasPermission) {
    return {
      success: false,
      agent_id: req.agent_id,
      tool: req.tool,
      error: `User ${req.user_id} không có quyền truy cập agent ${req.agent_id}`,
      latency_ms: Date.now() - start,
    };
  }

  // Gọi Mavis API hoặc mock
  let response: AgentCallResponse;
  if (USE_MOCK) {
    response = await mockAgentCall(config, req);
  } else {
    response = await realAgentCall(config, req);
  }

  // Audit log
  logAudit({
    user: { id: req.user_id, email: req.user_id, name: req.user_id, role: "user", title: "User", source: "demo" },
    action: "agent.call" as any,
    module: "system" as any,
    description: `${req.agent_id}.${req.tool} (${response.latency_ms}ms)`,
  });

  return response;
}

// ============================================
// LOAD AGENT CONFIG (từ /agents/*.json)
// ============================================
async function loadAgentConfig(agentId: string): Promise<AgentConfig | null> {
  try {
    // Trong Next.js, dùng dynamic import
    const config = (await import(`../../../../agents/${agentId}.json`)).default;
    return config as AgentConfig;
  } catch (e) {
    console.error(`[agent-runtime] Cannot load config for ${agentId}:`, e);
    return null;
  }
}

// ============================================
// CHECK PERMISSION
// ============================================
async function checkPermission(userId: string, agentId: string): Promise<boolean> {
  // TODO: Tích hợp với hệ thống phân quyền thật
  // Tạm thời: admin được tất cả, các role khác theo data_scope
  if (userId.includes("admin")) return true;
  return true; // MVP: tất cả được truy cập
}

// ============================================
// REAL MAVIS API CALL
// ============================================
async function realAgentCall(config: AgentConfig, req: AgentCallRequest): Promise<AgentCallResponse> {
  const start = Date.now();
  try {
    const res = await fetch(`${MAVIS_BASE_URL}/agents/${config.agent_id}/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAVIS_API_KEY}`,
      },
      body: JSON.stringify({
        tool: req.tool,
        params: req.params,
        context: req.context,
        system_prompt: config.system_prompt,
        model: config.model,
      }),
    });

    if (!res.ok) {
      return {
        success: false,
        agent_id: req.agent_id,
        tool: req.tool,
        error: `Mavis API error: ${res.status} ${res.statusText}`,
        latency_ms: Date.now() - start,
      };
    }

    const data = await res.json();
    return {
      success: true,
      agent_id: req.agent_id,
      tool: req.tool,
      result: data.result,
      summary: data.summary,
      latency_ms: Date.now() - start,
      tokens_used: data.tokens_used,
    };
  } catch (e: any) {
    return {
      success: false,
      agent_id: req.agent_id,
      tool: req.tool,
      error: `Mavis API call failed: ${e.message}`,
      latency_ms: Date.now() - start,
    };
  }
}

// ============================================
// MOCK AGENT CALL (fallback khi không có key)
// ============================================
async function mockAgentCall(config: AgentConfig, req: AgentCallRequest): Promise<AgentCallResponse> {
  // Simulate latency
  await new Promise((r) => setTimeout(r, 100 + Math.random() * 400));

  const mockResponses: Record<string, Record<string, { summary: string; data: any }>> = {
    "agent-lenh-cat": {
      taoLenhCat: { summary: "Đã tạo lệnh cắt M999 - Áo polo trắng (500 áo)", data: { lsx_id: "LC-M999-1234" } },
      layDanhSachLSX: { summary: "Có 156 lệnh cắt, 23 đang thực hiện", data: { tong_lenh: 156, dang: 23 } },
      tinhDinhMuc: { summary: "Định mức 500 áo polo = 135 kg vải", data: { kg: 135 } },
    },
    "agent-kho-vai": {
      tinhTonKhoVai: { summary: "Tồn kho vải: 12,500 kg, giá trị 2.3 tỷ", data: { tong_kg: 12500, gia_tri: 2_300_000_000 } },
    },
    "agent-cong-no": {
      tongHopCongNo: { summary: "Công nợ: phải thu 1.8 tỷ, phải trả 950tr", data: { phai_thu: 1_800_000_000, phai_tra: 950_000_000 } },
    },
    "agent-bang-luong": {
      tinhTongLuongThang: { summary: "Tổng lương tháng 7: 187 triệu", data: { tong: 187_000_000 } },
    },
    "agent-dashboard": {
      tinhKPI: { summary: "156 LSX, doanh thu 5.2 tỷ, lợi nhuận 580tr", data: { lsx: 156, doanh_thu: 5_200_000_000 } },
      tomTatTrangThaiHeThong: { summary: "Hệ thống hoạt động bình thường", data: { status: "ok" } },
    },
  };

  const agentMock = mockResponses[config.agent_id] || {};
  const result = agentMock[req.tool] || { summary: `Mock: ${config.name} đã thực thi tool ${req.tool}`, data: {} };

  return {
    success: true,
    agent_id: req.agent_id,
    tool: req.tool,
    result: result.data,
    summary: result.summary,
    latency_ms: 100 + Math.random() * 400,
    tokens_used: Math.floor(Math.random() * 1000) + 100,
  };
}

// ============================================
// STREAMING (optional - cho UX real-time)
// ============================================
export async function* streamAgent(req: AgentCallRequest): AsyncGenerator<string> {
  const config = await loadAgentConfig(req.agent_id);
  if (!config) {
    yield `Lỗi: Agent ${req.agent_id} không tồn tại`;
    return;
  }

  if (USE_MOCK) {
    // Stream mock
    const summary = `Agent ${config.name} đang xử lý ${req.tool}...`;
    for (const word of summary.split(" ")) {
      await new Promise((r) => setTimeout(r, 50));
      yield word + " ";
    }
  } else {
    // Stream thật qua SSE
    const res = await fetch(`${MAVIS_BASE_URL}/agents/${config.agent_id}/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAVIS_API_KEY}`,
      },
      body: JSON.stringify({ tool: req.tool, params: req.params }),
    });

    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value);
    }
  }
}
