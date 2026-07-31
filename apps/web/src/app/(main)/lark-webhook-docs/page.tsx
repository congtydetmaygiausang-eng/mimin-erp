"use client";

import { Code, Copy, Server, Webhook, CheckCircle2, Bot, FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LarkWebhookDocs() {
  return (
    <div className="min-h-screen p-3 md:p-6 bg-gradient-to-br from-indigo-50 via-blue-50/30 to-cyan-50/20">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white p-5 md:p-7 shadow-xl">
          <div className="text-xs font-medium opacity-90 mb-1 flex items-center gap-2">
            <Webhook className="w-3.5 h-3.5" /> MIMIN ERP · Lark Integration
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">📡 Lark Webhook & Bot Docs</h1>
          <p className="text-sm opacity-95 mt-1 max-w-3xl">
            Tài liệu kỹ thuật cho OAuth flow, Webhook receiver, và Bot auto-send. Copy code snippets, setup URL trên Lark Console.
          </p>
        </div>

        {/* OAuth Flow */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-indigo-500" /> 1. OAuth Flow (User Authorization)
          </h2>
          <div className="space-y-3 text-sm">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="font-bold text-xs text-slate-700 mb-1">Bước 1: Redirect user tới Lark</div>
              <CodeBlock
                code={`GET https://open.larksuite.com/open-apis/authen/v1/index
  ?redirect_uri=${encodeURIComponent("https://mimin-erp.app/lark-callback")}
  &app_id=cli_xxxxxxxx
  &state=random_state_123
  &scope=bitable:app:readonly+bitable:app:write+im:message`}
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="font-bold text-xs text-slate-700 mb-1">Bước 2: Lark redirect về callback với code</div>
              <CodeBlock code={`https://mimin-erp.app/lark-callback?code=ct-xxxxx&state=random_state_123`} />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="font-bold text-xs text-slate-700 mb-1">Bước 3: Exchange code → access_token</div>
              <CodeBlock
                code={`POST https://open.larksuite.com/open-apis/authen/v2/oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "ct-xxxxx",
  "client_id": "cli_xxxxxxxx",
  "client_secret": "xxxxxxxx"
}`}
              />
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg">
              <div className="font-bold text-xs text-emerald-700 mb-1">Response:</div>
              <CodeBlock
                code={`{
  "access_token": "t-xxxxx",
  "refresh_token": "rt-xxxxx",
  "expires_in": 7200,
  "scope": "bitable:app:readonly bitable:app:write im:message"
}`}
              />
            </div>
          </div>
        </div>

        {/* Webhook */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-500" /> 2. Webhook Receiver
          </h2>
          <div className="space-y-3 text-sm">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="font-bold text-xs text-blue-800 mb-1">📌 Webhook URL cấu hình trên Lark:</div>
              <div className="font-mono text-xs text-blue-900">https://mimin-erp.app/api/v1/lark/webhook</div>
              <div className="text-[10px] text-blue-700 mt-1">
                (Lưu ý: project hiện tại dùng static export. Webhook URL cần deploy riêng trên Vercel/Netlify hoặc server Next.js)
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="font-bold text-xs text-slate-700 mb-1">URL Verification (Lark gửi lần đầu):</div>
              <CodeBlock
                code={`POST /api/v1/lark/webhook
Content-Type: application/json

{
  "type": "url_verification",
  "challenge": "ajls384kdjxgxx"
}

// Response:
{
  "challenge": "ajls384kdjxgxx"
}`}
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="font-bold text-xs text-slate-700 mb-1">Card Action Click (user click button):</div>
              <CodeBlock
                code={`{
  "schema": "2.0",
  "header": {
    "event_type": "card.action.trigger",
    "app_id": "cli_xxxxxxxx",
    "tenant_key": "xxx"
  },
  "event": {
    "type": "card.action.trigger",
    "action": {
      "tag": "button",
      "value": {
        "action": "approve",
        "request_id": "REQ-2026-007"
      }
    },
    "open_id": "ou_xxxxx",
    "user_id": "eu_xxxxx",
    "open_message_id": "om_xxxxx"
  }
}`}
              />
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg">
              <div className="font-bold text-xs text-emerald-700 mb-1">✅ Action handlers đã code:</div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div>• accept_lsx</div>
                <div>• approve / reject</div>
                <div>• accept_order / reject_order</div>
                <div>• call_all_debtors</div>
                <div>• download_weekly_report</div>
                <div>• view_kho</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bot Auto-send */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-500" /> 3. Bot Auto-send (Cron)
          </h2>
          <div className="space-y-3 text-sm">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="font-bold text-xs text-slate-700 mb-1">Default Schedules:</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="text-left p-1">Name</th>
                    <th className="text-left p-1">Cron</th>
                    <th className="text-left p-1">Template</th>
                    <th className="text-center p-1">Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-1">📊 Báo cáo tuần</td>
                    <td className="p-1 font-mono">0 8 * * 6</td>
                    <td className="p-1">weekly-report</td>
                    <td className="p-1 text-center">✅</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-1">🔴 Cảnh báo công nợ</td>
                    <td className="p-1 font-mono">0 9 * * *</td>
                    <td className="p-1">cong-no-qua-han</td>
                    <td className="p-1 text-center">✅</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-1">🆕 LSX mới trong ngày</td>
                    <td className="p-1 font-mono">0 17 * * *</td>
                    <td className="p-1">lsx-moi</td>
                    <td className="p-1 text-center">⚪</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="font-bold text-xs text-slate-700 mb-1">API: Run bot manually</div>
              <CodeBlock
                code={`POST /api/v1/lark/bot/run
Content-Type: application/json

{
  "scheduleId": "weekly-report"
}

// Response:
{
  "ok": true,
  "sent": 1,
  "errors": []
}`}
              />
            </div>
          </div>
        </div>

        {/* CardKit 11 Templates */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-500" /> 4. 11 Card Templates
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {[
              "🆕 LSX mới",
              "🔴 Công nợ quá hạn",
              "📊 Báo cáo tuần",
              "✋ Approval",
              "🔄 Workflow update",
              "⚠️ Kho sắp hết",
              "👋 NV mới vào",
              "🔴 LSX trễ hạn",
              "💰 Lương đã chi",
              "🛒 Đơn hàng mới",
              "💚 Hệ thống OK",
            ].map((t) => (
              <div key={t} className="bg-slate-50 rounded p-2 text-center font-semibold">
                {t}
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-500 text-center">
            → Xem tất cả ở <a href="/lark-card-builder" className="text-violet-600 font-bold underline">/lark-card-builder/</a>
          </div>
        </div>

        {/* Setup steps */}
        <div className="card p-5 bg-amber-50 border-amber-200">
          <h2 className="font-bold text-lg mb-3 text-amber-800">⚙️ Setup Checklist</h2>
          <ol className="text-sm text-amber-900 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-700">1.</span>
              <span>
                Tạo Lark App tại <a href="https://open.larksuite.com/app" target="_blank" className="underline">open.larksuite.com/app</a>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-700">2.</span>
              <span>Enable scopes: <code>bitable:app:readonly</code>, <code>bitable:app:write</code>, <code>im:message</code>, <code>im:message:send_as_bot</code>, <code>cardkit:card:write</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-700">3.</span>
              <span>Cấu hình Event Subscription URL: <code>https://your-domain.com/api/v1/lark/webhook</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-700">4.</span>
              <span>Paste App ID + Secret vào <a href="/lark-setup" className="underline font-bold">/lark-setup/</a></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-700">5.</span>
              <span>Test OAuth flow ở Bước 3 của Setup Wizard</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-amber-700">6.</span>
              <span>Gửi card test ở <a href="/lark-card-builder" className="underline font-bold">/lark-card-builder/</a></span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-slate-900 text-slate-100 p-3 rounded text-[11px] overflow-x-auto font-mono leading-relaxed">
      {code}
      <button
        onClick={() => { navigator.clipboard.writeText(code); toast.success("Copied!"); }}
        className="float-right mt-1 text-slate-400 hover:text-white"
      >
        <Copy className="w-3 h-3" />
      </button>
    </pre>
  );
}
