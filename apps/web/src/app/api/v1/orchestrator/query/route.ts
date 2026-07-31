// ============================================
// MIMIN ERP - Orchestrator Query API
// POST /api/v1/orchestrator/query
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/audit-log";
import { callAgent } from "@/lib/agent-runtime";

interface OrchestratorQuery {
  user_id: string;
  query: string;
  context?: Record<string, any>;
  session_id?: string;
}

interface OrchestratorResponse {
  request_id: string;
  agents_called: string[];
  response: string;
  data?: Record<string, any>;
  actions_taken: Array<{
    agent: string;
    tool: string;
    result: any;
  }>;
  latency_ms: number;
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const request_id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const body: OrchestratorQuery = await req.json();
    const { user_id, query, context = {} } = body;

    if (!user_id || !query) {
      return NextResponse.json(
        { error: "Missing user_id or query" },
        { status: 400 }
      );
    }

    // Log audit (user_id ở đây là email string, cast thành AppUser minimal)
    logAudit({
      user: { id: user_id, email: user_id, name: user_id, role: "user", title: "User", source: "demo" },
      action: "create" as any, // orchestrator.query
      module: "system" as any, // ai
      description: query.slice(0, 200),
    });

    // Phân tích intent → route tới agent
    const { agent, tool, params } = await routeQuery(query, context);

    // Gọi agent THẬT qua agent-runtime (Mavis API hoặc mock)
    const agentResult = await callAgent({
      agent_id: agent,
      tool,
      params,
      user_id,
      context,
    });

    // Tổng hợp response
    const response: OrchestratorResponse = {
      request_id,
      agents_called: [agent],
      response: agentResult.summary || "Đã xử lý yêu cầu.",
      data: agentResult.result,
      actions_taken: [
        { agent, tool, result: agentResult },
      ],
      latency_ms: Date.now() - start,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`[${request_id}] Orchestrator error:`, error);
    return NextResponse.json(
      { error: error.message || "Internal error", request_id },
      { status: 500 }
    );
  }
}

// ============================================
// ROUTING (đơn giản - dùng keyword matching)
// Sau này sẽ dùng Mavis routing_rules
// ============================================
async function routeQuery(query: string, context: any) {
  const q = query.toLowerCase();

  // Kiểm tra từ khóa - route tới agent phù hợp
  if (/lệnh cắt|lsx|m758|tạo lệnh|định mức/.test(q)) {
    return { agent: "agent-lenh-cat", tool: "layDanhSachLSX", params: { query } };
  }
  if (/kho vải|tồn vải|nhập vải|xuất vải/.test(q)) {
    return { agent: "agent-kho-vai", tool: "tinhTonKhoVai", params: { query } };
  }
  if (/công nợ|nợ|hạn mức|quá hạn/.test(q)) {
    return { agent: "agent-cong-no", tool: "tongHopCongNo", params: { query } };
  }
  if (/lương|tiền công|bảng lương/.test(q)) {
    return { agent: "agent-bang-luong", tool: "tinhTongLuongThang", params: { query } };
  }
  if (/nhân sự|nhân viên|hợp đồng/.test(q)) {
    return { agent: "agent-nhan-su", tool: "layDanhSachNV", params: { query } };
  }
  if (/tổng quan|dashboard|kpi|toàn hệ thống/.test(q)) {
    return { agent: "agent-dashboard", tool: "tinhKPI", params: { query } };
  }

  // Mặc định → dashboard
  return { agent: "agent-dashboard", tool: "tomTatTrangThaiHeThong", params: { query } };
}

// ============================================
// CALL AGENT - Đã chuyển sang lib/agent-runtime.ts
// ============================================
// (Removed - now imported from @/lib/agent-runtime)
