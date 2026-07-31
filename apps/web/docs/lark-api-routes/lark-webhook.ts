// POST /api/v1/lark/webhook
// Nhận events từ Lark: card clicks, bitable changes, etc.

import { NextRequest, NextResponse } from "next/server";


interface WebhookPayload {
  schema?: string;
  header?: {
    event_type?: string;
    app_id?: string;
    tenant_key?: string;
    token?: string;
  };
  event?: {
    type?: string;
    action?: {
      tag?: string;        // button, select_static, etc.
      value?: any;         // { action: "approve", request_id: "REQ-001" }
      option?: string;
    };
    open_id?: string;
    user_id?: string;
    open_message_id?: string;
  };
  challenge?: string;  // Verification challenge từ Lark
  type?: string;       // "url_verification"
}

// Action handlers - xử lý khi user click button trên card
const ACTION_HANDLERS: Record<string, (payload: any) => Promise<{ response?: any; updateCard?: boolean }>> = {
  // LSX actions
  accept_lsx: async ({ action, open_id }) => {
    console.log(`[lark-webhook] User ${open_id} accepted LSX ${action.value?.lsx_id}`);
    return { response: { message: `Đã nhận LSX ${action.value?.lsx_id}` } };
  },
  // Approval actions
  approve: async ({ action, open_id }) => {
    console.log(`[lark-webhook] User ${open_id} approved ${action.value?.request_id}`);
    // TODO: Update DB - mark request as approved
    return { response: { message: `Đã duyệt yêu cầu ${action.value?.request_id}` } };
  },
  reject: async ({ action, open_id }) => {
    console.log(`[lark-webhook] User ${open_id} rejected ${action.value?.request_id}`);
    return { response: { message: `Đã từ chối yêu cầu ${action.value?.request_id}` } };
  },
  // Other actions
  call_all_debtors: async () => {
    console.log(`[lark-webhook] Triggered call all debtors`);
    return { response: { message: "Đã gọi tất cả KH nợ" } };
  },
  download_weekly_report: async () => {
    console.log(`[lark-webhook] Triggered download weekly report`);
    return { response: { message: "Đang tạo báo cáo PDF..." } };
  },
};

export async function POST(req: NextRequest) {
  try {
    const payload: WebhookPayload = await req.json();

    // 1. URL Verification Challenge (Lark gửi lần đầu để verify URL)
    if (payload.type === "url_verification" && payload.challenge) {
      return NextResponse.json({ challenge: payload.challenge });
    }

    // 2. Log event
    console.log(`[lark-webhook] Event: ${payload.header?.event_type || payload.event?.type}`);

    // 3. Handle card action events
    if (payload.event?.action) {
      const actionName = payload.event.action.value?.action;
      const handler = actionName ? ACTION_HANDLERS[actionName] : null;

      if (handler) {
        const result = await handler(payload);
        // Respond với card update (nếu cần) hoặc message
        if (result.updateCard) {
          // Return new card JSON to update display
          return new NextResponse(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return NextResponse.json({ ok: true, ...result });
      }
    }

    // 4. Handle bitable changes (sync từ Lark → Local)
    if (payload.header?.event_type?.startsWith("bitable.")) {
      console.log(`[lark-webhook] Bitable change: ${payload.header.event_type}`);
      // TODO: Trigger sync engine pull
      return NextResponse.json({ ok: true, handled: "bitable_change" });
    }

    return NextResponse.json({ ok: true, message: "Event received" });
  } catch (e: any) {
    console.error("[lark-webhook] Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "MIMIN ERP Lark Webhook",
    version: "1.0.0",
    events: [
      "url_verification",
      "card.action.click",
      "bitable.record.created",
      "bitable.record.updated",
      "bitable.record.deleted",
    ],
    actions: Object.keys(ACTION_HANDLERS),
  });
}
