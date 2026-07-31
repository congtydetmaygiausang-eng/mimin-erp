"use client";

import { useState } from "react";
import {
  Send, FileJson, Eye, Sparkles, Code, Save, Copy, RefreshCw, Bell, AlertTriangle, TrendingUp,
  CheckCircle2, XCircle, Loader2, MessageSquare, Users, Hash, ChevronRight, Settings, Plus
} from "lucide-react";
import { toast } from "sonner";
import {
  cardTemplateLSXMoi,
  cardTemplateCongNoQuaHan,
  cardTemplateBaoCaoTuan,
  cardTemplateApproval,
  cardTemplateWorkflowUpdate,
  cardTemplateKhoSapHet,
  cardTemplateNVMoi,
  cardTemplateLSXTreHan,
  cardTemplateLuongDaChi,
  cardTemplateDonHangMoi,
  cardTemplateSystemOK,
  createAndSendCard,
} from "@/lib/lark-cardkit";

type Template = "lsx-moi" | "cong-no" | "bao-cao" | "approval" | "workflow" | "kho-het" | "nv-moi" | "lsx-tre" | "luong-chi" | "don-hang" | "system-ok";

const TEMPLATES = [
  { k: "lsx-moi" as Template, l: "LSX mới", icon: "🆕", color: "from-blue-500 to-cyan-500", desc: "Thông báo lệnh cắt mới" },
  { k: "cong-no" as Template, l: "Công nợ quá hạn", icon: "🔴", color: "from-rose-500 to-red-500", desc: "Cảnh báo KH nợ quá hạn" },
  { k: "bao-cao" as Template, l: "Báo cáo tuần", icon: "📊", color: "from-emerald-500 to-green-500", desc: "Tổng hợp tuần" },
  { k: "approval" as Template, l: "Approval", icon: "✋", color: "from-amber-500 to-orange-500", desc: "Yêu cầu duyệt" },
  { k: "workflow" as Template, l: "Workflow update", icon: "🔄", color: "from-purple-500 to-pink-500", desc: "Phiếu chuyển khâu" },
  { k: "kho-het" as Template, l: "Kho sắp hết", icon: "⚠️", color: "from-orange-500 to-red-500", desc: "Cảnh báo mặt hàng sắp hết" },
  { k: "nv-moi" as Template, l: "NV mới vào", icon: "👋", color: "from-cyan-500 to-blue-500", desc: "Welcome NV mới + checklist" },
  { k: "lsx-tre" as Template, l: "LSX trễ hạn", icon: "🔴", color: "from-red-600 to-rose-600", desc: "Cảnh báo LSX trễ" },
  { k: "luong-chi" as Template, l: "Lương đã chi", icon: "💰", color: "from-green-500 to-emerald-500", desc: "Báo cáo lương tháng" },
  { k: "don-hang" as Template, l: "Đơn hàng mới", icon: "🛒", color: "from-indigo-500 to-violet-500", desc: "KH đặt hàng" },
  { k: "system-ok" as Template, l: "Hệ thống OK", icon: "💚", color: "from-emerald-400 to-green-500", desc: "Heartbeat hàng ngày" },
];

const SAMPLE_DATA: Record<Template, any> = {
  "lsx-moi": {
    id: "LC-M758-1234",
    maSP: "M758",
    tenSP: "Áo polo trắng nam cao cấp",
    soLuong: 500,
    donVi: "áo",
    hanHoanThanh: "2026-08-15",
    nguoiPhuTrach: "NV006 - Nguyễn Văn Giang",
  },
  "cong-no": {
    items: [
      { kh_ten: "Cty TNHH May Mặc An Phú", so_tien: 180_000_000, so_ngay: 45 },
      { kh_ten: "Cty CP Thời Trang Việt", so_tien: 95_000_000, so_ngay: 32 },
      { kh_ten: "Shop Thời Trang Hà Nội", so_tien: 42_000_000, so_ngay: 28 },
    ],
  },
  "bao-cao": {
    doanh_thu: 5_200_000_000,
    lsx_hoan_thanh: 23,
    lsx_dang_lam: 18,
    loi_nhuan: 580_000_000,
  },
  "approval": {
    type: "Tạm ứng công nhân",
    requester: "NV006 - Nguyễn Văn Giang",
    amount: 5_000_000,
    reason: "Tạm ứng 50% lương tháng 7/2026",
    request_id: "REQ-2026-007",
  },
  workflow: {
    id: "MAY_007",
    maSP: "M222",
    trang_thai: "Đang may",
    nguoi_phu_trach: "NV009 - Trần Văn Em",
    tien_do: 64,
  },
  "kho-het": {
    items: [
      { ten: "Vải Poly Nano trắng", ton: 50, don_vi: "kg", ncc: "NCC-01 Lucky Avanti" },
      { ten: "Chỉ cotton 30s đen", ton: 20, don_vi: "cuộn", ncc: "NCC-15 Phúc Vinh" },
      { ten: "Cúc 15mm vàng", ton: 800, don_vi: "cái", ncc: "NCC-16 Kim Long" },
    ],
  },
  "nv-moi": {
    maNV: "NV017",
    ten: "Nguyễn Văn Hùng",
    chucVu: "Công nhân may",
    ngayVao: "2026-08-01",
    phongBan: "Tổ May",
  },
  "lsx-tre": {
    items: [
      { id: "CAT_005", maSP: "M222", tre: 3, nguoi: "NV006" },
      { id: "MAY_012", maSP: "M333", tre: 2, nguoi: "NV009" },
    ],
  },
  "luong-chi": {
    thang: 7,
    nam: 2026,
    tong: 187_000_000,
    cn: 92_000_000,
    cbql: 95_000_000,
    nguoi: 19,
  },
  "don-hang": {
    id: "DH-2026-123",
    kh: "Cty TNHH May An Phú",
    sp: "Áo polo M758 (500 cái)",
    sl: 500,
    deadline: "2026-08-20",
    giaTri: 75_000_000,
  },
  "system-ok": {
    uptime: 89,
    records: 1250,
    errors24h: 0,
    users: 8,
  },
};

export default function LarkCardBuilderPage() {
  const [template, setTemplate] = useState<Template>("lsx-moi");
  const [data, setData] = useState(SAMPLE_DATA[template]);
  const [json, setJson] = useState(JSON.stringify(cardTemplateLSXMoi(SAMPLE_DATA["lsx-moi"]), null, 2));
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [receiveId, setReceiveId] = useState("ou_sang_admin");
  const [receiveIdType, setReceiveIdType] = useState<"open_id" | "user_id" | "email" | "chat_id">("open_id");

  const updateTemplate = (t: Template) => {
    setTemplate(t);
    setData(SAMPLE_DATA[t]);
    const builders: Record<Template, () => any> = {
      "lsx-moi": () => cardTemplateLSXMoi(SAMPLE_DATA[t]),
      "cong-no": () => cardTemplateCongNoQuaHan(SAMPLE_DATA[t].items),
      "bao-cao": () => cardTemplateBaoCaoTuan(SAMPLE_DATA[t]),
      "approval": () => cardTemplateApproval(SAMPLE_DATA[t]),
      workflow: () => cardTemplateWorkflowUpdate(SAMPLE_DATA[t]),
      "kho-het": () => cardTemplateKhoSapHet(SAMPLE_DATA[t].items),
      "nv-moi": () => cardTemplateNVMoi(SAMPLE_DATA[t]),
      "lsx-tre": () => cardTemplateLSXTreHan(SAMPLE_DATA[t].items),
      "luong-chi": () => cardTemplateLuongDaChi(SAMPLE_DATA[t]),
      "don-hang": () => cardTemplateDonHangMoi(SAMPLE_DATA[t]),
      "system-ok": () => cardTemplateSystemOK(SAMPLE_DATA[t]),
    };
    const card = builders[t]();
    setJson(JSON.stringify(card, null, 2));
    setSendResult(null);
  };

  const sendCard = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const card = JSON.parse(json);
      const result = await createAndSendCard(card, receiveId, receiveIdType);
      if (result.ok) {
        setSendResult({ ok: true, msg: `✅ Đã gửi! Card ID: ${result.card_id?.slice(0, 12)}...` });
        toast.success("Gửi card thành công!");
      } else {
        setSendResult({ ok: false, msg: result.error || "Lỗi không xác định" });
        toast.error(result.error || "Gửi thất bại");
      }
    } catch (e: any) {
      setSendResult({ ok: false, msg: `❌ JSON không hợp lệ: ${e.message}` });
      toast.error("JSON không hợp lệ");
    } finally {
      setSending(false);
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(json);
    toast.success("Đã copy JSON");
  };

  return (
    <div className="min-h-screen p-3 md:p-6 bg-gradient-to-br from-violet-50 via-purple-50/30 to-fuchsia-50/20">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white p-5 md:p-7 shadow-xl">
          <div className="text-xs font-medium opacity-90 mb-1 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> MIMIN ERP · Lark CardKit
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">💬 Lark Card Builder</h1>
          <p className="text-sm opacity-95 mt-1 max-w-3xl">
            Tạo + gửi interactive message cards tới Lark/Feishu. 5 templates có sẵn, edit JSON trực tiếp, preview trước khi gửi.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT: Templates + Form */}
          <div className="lg:col-span-1 space-y-3">
            <div className="card p-4">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5">
                <FileJson className="w-4 h-4 text-violet-500" /> Templates (5)
              </h3>
              <div className="space-y-1.5">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.k}
                    onClick={() => updateTemplate(t.k)}
                    className={`w-full text-left p-2.5 rounded-lg transition flex items-center gap-2 ${
                      template === t.k
                        ? `bg-gradient-to-r ${t.color} text-white shadow-md`
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-xl">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold ${template === t.k ? "text-white" : "text-slate-800"}`}>{t.l}</div>
                      <div className={`text-[10px] truncate ${template === t.k ? "opacity-90" : "text-slate-500"}`}>{t.desc}</div>
                    </div>
                    {template === t.k && <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-violet-500" /> Gửi tới
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Receive ID</label>
                  <input
                    value={receiveId}
                    onChange={(e) => setReceiveId(e.target.value)}
                    placeholder="ou_xxxxx hoặc user_id/email/chat_id"
                    className="w-full px-2 py-1.5 border rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Loại</label>
                  <select
                    value={receiveIdType}
                    onChange={(e) => setReceiveIdType(e.target.value as any)}
                    className="w-full px-2 py-1.5 border rounded text-xs"
                  >
                    <option value="open_id">Open ID (User)</option>
                    <option value="user_id">User ID</option>
                    <option value="email">Email</option>
                    <option value="chat_id">Chat ID (Group)</option>
                  </select>
                </div>
                <button
                  onClick={sendCard}
                  disabled={sending}
                  className="w-full px-3 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? "Đang gửi..." : "Gửi card ngay"}
                </button>
                {sendResult && (
                  <div className={`p-2 rounded text-xs ${sendResult.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {sendResult.msg}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE: JSON Editor */}
          <div className="lg:col-span-1">
            <div className="card p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-violet-500" /> Card JSON (Schema 2.0)
                </h3>
                <button
                  onClick={copyJson}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <textarea
                value={json}
                onChange={(e) => setJson(e.target.value)}
                className="flex-1 min-h-[500px] w-full px-3 py-2 border rounded-lg font-mono text-[11px] leading-relaxed focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none"
                spellCheck={false}
              />
              <div className="mt-2 text-[10px] text-slate-500">
                📐 Schema 2.0 · Lark CardKit v1 · {json.length} chars
              </div>
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div className="lg:col-span-1">
            <div className="card p-4 h-full flex flex-col">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-violet-500" /> Preview
              </h3>
              <div className="flex-1 bg-slate-100 rounded-lg p-3 overflow-auto">
                <CardPreview json={json} />
              </div>
              <div className="mt-2 text-[10px] text-slate-500">
                🎨 Preview sẽ hiển thị gần giống Lark chat
              </div>
            </div>
          </div>
        </div>

        {/* Docs */}
        <div className="card p-4 bg-violet-50 border-violet-200">
          <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5 text-violet-800">
            <FileJson className="w-4 h-4" /> API Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-violet-700">
            <div className="bg-white/60 rounded p-2">
              <div className="font-mono font-bold mb-1">POST /cardkit/v1/cards</div>
              <div>Tạo card entity, trả về <code>card_id</code></div>
            </div>
            <div className="bg-white/60 rounded p-2">
              <div className="font-mono font-bold mb-1">POST /im/v1/messages</div>
              <div>Gửi card tới user/chat với <code>receive_id</code></div>
            </div>
            <div className="bg-white/60 rounded p-2">
              <div className="font-mono font-bold mb-1">PUT /cardkit/v1/cards/:id/elements/:eid/content</div>
              <div>Streaming update text (typing effect)</div>
            </div>
            <div className="bg-white/60 rounded p-2">
              <div className="font-mono font-bold mb-1">PATCH /cardkit/v1/cards/:id/settings</div>
              <div>Update settings (vd: tắt streaming_mode)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== CARD PREVIEW ===================
function CardPreview({ json }: { json: string }) {
  let card: any;
  try {
    card = JSON.parse(json);
  } catch (e) {
    return (
      <div className="text-rose-500 text-xs p-3 bg-rose-50 rounded">
        ⚠️ JSON không hợp lệ. Sửa trước khi preview.
      </div>
    );
  }

  const headerColor: Record<string, string> = {
    blue: "bg-blue-500",
    red: "bg-rose-500",
    green: "bg-emerald-500",
    orange: "bg-amber-500",
    purple: "bg-purple-500",
    default: "bg-slate-500",
  };

  const headerBg = headerColor[card.header?.template || "default"];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-sm mx-auto">
      {/* Header */}
      {card.header?.title && (
        <div className={`${headerBg} text-white p-3 flex items-center gap-2`}>
          <MessageSquare className="w-4 h-4" />
          <div className="flex-1">
            <div className="text-[10px] opacity-90">Bot Message</div>
            <div className="font-bold text-sm">{card.header.title.content}</div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-3 space-y-2">
        {card.body?.elements?.map((el: any, i: number) => {
          if (el.tag === "markdown") {
            return (
              <div key={i} className="text-xs whitespace-pre-wrap text-slate-700">
                {el.content}
              </div>
            );
          }
          if (el.tag === "hr") {
            return <hr key={i} className="border-slate-200" />;
          }
          if (el.tag === "progress") {
            return (
              <div key={i} className="space-y-1">
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${el.value}%` }} />
                </div>
                <div className="text-[10px] text-slate-500 text-right">{el.value}%</div>
              </div>
            );
          }
          if (el.tag === "action") {
            return (
              <div key={i} className="flex flex-wrap gap-1.5">
                {el.actions?.map((btn: any, j: number) => {
                  const btnColors: Record<string, string> = {
                    primary: "bg-blue-500 text-white",
                    danger: "bg-rose-500 text-white",
                    default: "bg-slate-100 text-slate-700 border",
                  };
                  return (
                    <button
                      key={j}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${btnColors[btn.type || "default"]}`}
                    >
                      {btn.text?.content}
                    </button>
                  );
                })}
              </div>
            );
          }
          return null;
        })}
      </div>

      <div className="bg-slate-50 px-3 py-1.5 text-[9px] text-slate-400 text-center">
        CardKit 2.0 · {card.body?.elements?.length || 0} elements
      </div>
    </div>
  );
}
