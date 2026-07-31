// ============================================
// MIMIN ERP - Supabase Realtime Events
// Auto-dispatch tới agents khi có event
// ============================================

import { callAgent } from "./agent-runtime";
import { logAudit } from "./audit-log";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nftlwdcsmlpeiazhuoho.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export type RealtimeEvent = {
  channel: string;
  event: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, any>;
  old?: Record<string, any>;
};

// ============================================
// EVENT ROUTER (channel + event → agent + tool)
// ============================================
const EVENT_ROUTES: Record<string, { agent: string; tool: string; condition?: (e: RealtimeEvent) => boolean }> = {
  // tasks
  "tasks:UPDATE": { agent: "agent-may", tool: "theoDoiTienDo" },
  "tasks:INSERT": { agent: "agent-ke-hoach", tool: "phanCongMay" },

  // kho
  "kho:UPDATE": {
    agent: "agent-kho-vai",
    tool: "tinhTonKhoVai",
    condition: (e) => e.new?.loai === "vai",
  },
  "kho:INSERT": { agent: "agent-kho-vai", tool: "tinhTonKhoVai" },

  // lenh_sx_tong
  "lenh_sx_tong:INSERT": { agent: "agent-lenh-cat", tool: "taoLenhCat" },
  "lenh_sx_tong:UPDATE": { agent: "agent-lenh-cat", tool: "layTienDo" },

  // phieu_workflow
  "phieu_workflow:UPDATE": {
    agent: "agent-ke-hoach",
    tool: "duBaoBottleneck",
    condition: (e) => e.new?.trangThai === "Hoàn thành",
  },

  // cong_no
  "cong_no:INSERT": { agent: "agent-cong-no", tool: "tongHopCongNo" },
  "cong_no:UPDATE": { agent: "agent-cong-no", tool: "canhBaoVuotHanMuc" },

  // notifications (do agent khác tạo)
  "notifications:INSERT": { agent: "agent-notification", tool: "sendInApp" },

  // users
  "users:INSERT": { agent: "agent-security", tool: "bat2FA" },
  "users:UPDATE": { agent: "agent-audit", tool: "ghiAuditLog" },

  // audit_log
  "audit_log:INSERT": { agent: "agent-audit", tool: "phatHienBatThuong" },
};

// ============================================
// SUBSCRIBE TO CHANNELS
// ============================================
let realtimeClient: WebSocket | null = null;
let isConnected = false;
let reconnectAttempts = 0;

export async function subscribeRealtime() {
  if (typeof window === "undefined") return;
  if (!SUPABASE_ANON_KEY) {
    console.warn("[realtime] No Supabase key, realtime disabled");
    return;
  }

  // Supabase Realtime endpoint
  const wsUrl = SUPABASE_URL.replace("https://", "wss://") + "/realtime/v1/websocket";
  // Note: Supabase Realtime dùng phoenix protocol - trong production cần lib @supabase/supabase-js
  // Để MVP, em dùng polling fallback
  startPolling();
}

function startPolling() {
  // MVP: Poll mỗi 30s
  setInterval(async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/lenh_sx_tong?order=updated_at.desc&limit=5`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      if (res.ok) {
        const rows = await res.json();
        for (const row of rows) {
          await dispatchEvent({
            channel: "lenh_sx_tong",
            event: "UPDATE",
            new: row,
            old: undefined,
          });
        }
      }
    } catch (e) {
      // silent fail
    }
  }, 30000);
}

// ============================================
// DISPATCH EVENT TO AGENTS
// ============================================
export async function dispatchEvent(event: RealtimeEvent) {
  const key = `${event.channel}:${event.event}`;
  const route = EVENT_ROUTES[key];

  if (!route) return; // No handler for this event

  // Check condition
  if (route.condition && !route.condition(event)) return;

  // Gọi agent
  try {
    const result = await callAgent({
      agent_id: route.agent,
      tool: route.tool,
      params: { event },
      user_id: "system", // Realtime events từ system
    });

    if (result.success) {
      console.log(`[realtime] ${route.agent}.${route.tool} → ${result.summary}`);
    }
  } catch (e) {
    console.error(`[realtime] Dispatch failed:`, e);
  }
}

// ============================================
// MANUAL TRIGGER (test thủ công)
// ============================================
export async function triggerEvent(event: RealtimeEvent) {
  await dispatchEvent(event);
}
