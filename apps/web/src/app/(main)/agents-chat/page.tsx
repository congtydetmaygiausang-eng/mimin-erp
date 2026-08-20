"use client";

import { useState, useEffect } from "react";
import { Send, Bot, User, Sparkles, MessageSquare, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { AGENT_PERSONAS, AgentPersona, getDefaultAgentIdForRole } from "@/lib/agent-personas";
import { useSession } from "@/components/session-provider";

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
}

// Ảnh avatar là ảnh nhân vật full-thân chụp trên phông màu riêng của từng
// agent (studio gray cho Mavis, cam nhạt cho Minh...) - object-cover center
// mặc định sẽ cắt trúng bụng/chân thay vì mặt. Card lớn dùng object-top +
// mask-image mờ dần phía dưới, nền card khớp tông màu ảnh gốc để chỗ mờ
// không bị lộ viền cắt cứng, tạo cảm giác "đã xoá phông" mà không cần tách
// nền pixel thật (không có công cụ tách nền AI trong môi trường này).
const AGENT_CARD_BG: Record<string, string> = {
  mavis: "bg-gradient-to-b from-slate-300 to-slate-400",
  minh: "bg-gradient-to-b from-orange-100 to-orange-200",
  lan: "bg-gradient-to-b from-stone-300 to-stone-400",
  ha: "bg-gradient-to-b from-pink-100 to-purple-200",
  vy: "bg-gradient-to-b from-slate-50 to-slate-200",
  "mimin-help": "bg-gradient-to-b from-rose-50 to-rose-100",
};
const AVATAR_FADE_MASK = "linear-gradient(to bottom, black 58%, transparent 96%)";

export default function AgentsChatPage() {
  const { user } = useSession();
  const agentsList = Object.values(AGENT_PERSONAS);
  const [selectedAgent, setSelectedAgent] = useState<AgentPersona>(agentsList[0]);
  const [autoSelected, setAutoSelected] = useState(false);

  // Vào trang thì tự mở đúng agent phụ trách vai trò đang đăng nhập (VD kế
  // toán -> Hà, kho -> Lan) thay vì luôn mặc định Mavis cho mọi người. Chỉ tự
  // chọn 1 LẦN lúc session load xong - nếu người dùng tự bấm sang tab khác
  // thì tôn trọng lựa chọn đó, không tự đổi lại.
  useEffect(() => {
    if (autoSelected || !user) return;
    const defaultId = getDefaultAgentIdForRole(user.role);
    const match = agentsList.find((a) => a.agent_id === defaultId);
    if (match) setSelectedAgent(match);
    setAutoSelected(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, autoSelected]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    "mimin-orchestrator": [
      { id: "1", sender: "agent", text: "Xin chào! Tôi là Mavis, trợ lý AI điều phối tổng quan MIMIN ERP. Bạn cần hỗ trợ gì hôm nay?", timestamp: "10:00" },
    ],
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Lời chào mở đầu (hiện trước khi gọi API) - dùng tên thật người đang đăng
  // nhập thay vì "sếp" chung chung cho mọi người.
  const greetTitle = user?.email === "sang@mimin.vn" ? "sếp Sang" : user?.name ? `anh/chị ${user.name.split(" ").slice(-1)[0]}` : "sếp";
  const currentMessages = messages[selectedAgent.agent_id] || [
    { id: "init", sender: "agent", text: `Chào ${greetTitle}! Em là ${selectedAgent.name} (${selectedAgent.role_title}). Em có thể giúp gì cho ${greetTitle} hôm nay?`, timestamp: "Vừa xong" }
  ];

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    const userMsg: Message = { id: Date.now().toString(), sender: "user", text: userText, timestamp: now };

    setMessages((prev) => ({
      ...prev,
      [selectedAgent.agent_id]: [...(prev[selectedAgent.agent_id] || []), userMsg],
    }));
    setInput("");
    setLoading(true);

    try {
      // Gọi đúng API route thật (server-side, đọc key bí mật đúng cách) - trước đây
      // trang này gọi callAgentV2() chạy thẳng trong trình duyệt, đọc
      // process.env.DEEPSEEK_API_KEY phía client luôn ra rỗng (Next.js không đưa
      // biến môi trường không có tiền tố NEXT_PUBLIC_ vào bundle client, đúng theo
      // bảo mật) -> mọi câu hỏi đều rơi vào nhánh mock, không bao giờ gọi AI thật.
      // FloatingAI.tsx đã dùng đúng route /api/v1/orchestrator/query này từ trước.
      const res = await fetch("/api/v1/orchestrator/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Trước đây hardcode "sang@mimin.vn" cho MỌI người dùng - bất kỳ ai
          // đăng nhập chat cũng bị AI chào nhầm là "sếp Sang". Gửi đúng email
          // người đang đăng nhập thật để API chào đúng tên.
          user_id: user?.email || "guest",
          messages: [{ role: "user", content: userText }],
          agent_id: selectedAgent.agent_id,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      // Response có thể là JSON (DeepSeek/MiniMax) hoặc SSE streaming (Gemini)
      const contentType = res.headers.get("content-type") || "";
      let responseText: string;

      if (contentType.includes("text/plain") || contentType.includes("event-stream")) {
        // Nhánh Gemini dùng AI SDK v5 toUIMessageStreamResponse() - mỗi dòng
        // "data: " là 1 SỰ KIỆN NHỎ ({"type":"text-delta","delta":"..."} ...),
        // KHÔNG phải 1 khối JSON chat-completion duy nhất. Code cũ gộp hết các
        // dòng lại rồi JSON.parse() cả khối -> luôn lỗi (nhiều JSON object dính
        // liền nhau không phải JSON hợp lệ) -> rơi vào catch, hiển thị thẳng
        // JSON thô lên màn hình thay vì nội dung câu trả lời thật. Phải parse
        // TỪNG dòng, chỉ cộng dồn phần "delta" của các sự kiện "text-delta".
        const raw = await res.text();
        const lines = raw.split("\n").filter((l) => l.startsWith("data: "));
        let streamedText = "";
        for (const line of lines) {
          const payload = line.slice(6).trim();
          if (!payload || payload === "[DONE]") continue;
          let evt: any;
          try {
            evt = JSON.parse(payload);
          } catch {
            continue; // dòng lỗi định dạng, bỏ qua - không làm gãy cả phản hồi
          }
          if (evt.type === "text-delta" && typeof evt.delta === "string") {
            streamedText += evt.delta;
          } else if (evt.type === "error") {
            // Lỗi thật từ AI SDK (VD hết quota) - phải ném ra ngoài để catch()
            // hiển thị rõ nguyên nhân, không được nuốt lỗi rồi báo chung chung.
            throw new Error(evt.errorText || "Lỗi khi Gemini trả lời");
          }
        }
        responseText = streamedText || "Không có phản hồi";
      } else {
        const data = await res.json();
        responseText = data.response || data.error || "Không có phản hồi";
      }

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: responseText,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => ({
        ...prev,
        [selectedAgent.agent_id]: [...(prev[selectedAgent.agent_id] || []), agentMsg],
      }));
    } catch (e: any) {
      console.error(e);
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: `❌ Lỗi khi gọi AI: ${e?.message || "Không rõ nguyên nhân"}`,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => ({
        ...prev,
        [selectedAgent.agent_id]: [...(prev[selectedAgent.agent_id] || []), errMsg],
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50">
      {/* Sidebar Danh sách 9 Agent */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <Link href="/agents" className="text-xs text-sky-600 flex items-center gap-1 font-semibold mb-2 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard Agents
          </Link>
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Bot className="w-5 h-5 text-sky-500" /> Chat {agentsList.length} Nhân viên AI
          </h2>
          <p className="text-xs text-slate-500">Chọn nhân viên AI để trao đổi trực tiếp</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {agentsList.map((agent) => {
            const isSelected = selectedAgent.agent_id === agent.agent_id;
            const isImg = agent.avatar.startsWith("/avatars/");
            const isReplyingHere = loading && isSelected;
            return (
              <button
                key={agent.agent_id}
                onClick={() => setSelectedAgent(agent)}
                className={`w-full text-left rounded-2xl transition flex items-stretch overflow-hidden border ${
                  isSelected ? "border-sky-300 shadow-md ring-2 ring-sky-100" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className={`relative w-20 shrink-0 overflow-hidden ${AGENT_CARD_BG[agent.agent_id] || "bg-slate-100"}`}>
                  {isImg ? (
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="absolute inset-0 w-full h-full object-cover object-top"
                      style={{ maskImage: AVATAR_FADE_MASK, WebkitMaskImage: AVATAR_FADE_MASK }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">{agent.avatar}</div>
                  )}
                  {isReplyingHere && (
                    <span className="absolute inset-0 ring-4 ring-sky-400/70 rounded-none animate-pulse" />
                  )}
                </div>
                <div className={`flex-1 min-w-0 p-3 flex flex-col justify-center gap-1 ${isSelected ? "bg-sky-50" : "bg-white"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">{agent.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono uppercase shrink-0">
                      {agent.provider}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">{agent.role_title}</div>
                  {isReplyingHere && (
                    <div className="text-[11px] text-sky-600 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 animate-spin" /> Đang trả lời...
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Giao diện Chat chính */}
      <div className="flex-1 flex flex-col">
        {/* Header Agent đang chọn - "hero card" full chiều rộng, theo đúng tông
            màu phông ảnh của agent (khớp card bên sidebar) thay vì thanh nhỏ
            trung tính trước đây - bấm card nào bên trái, cả khung chat đổi
            "danh tính" theo agent đó. */}
        <div className={`relative overflow-hidden border-b border-slate-200 shadow-sm ${AGENT_CARD_BG[selectedAgent.agent_id] || "bg-white"}`}>
          <div className="relative flex items-center gap-4 px-6 py-5">
            <div className="w-20 h-20 rounded-2xl bg-white/40 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-white/70 shadow-md text-4xl">
              {selectedAgent.avatar.startsWith("/avatars/") ? (
                <img src={selectedAgent.avatar} alt={selectedAgent.name} className="w-full h-full object-cover object-top" />
              ) : (
                selectedAgent.avatar
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xl flex items-center gap-2 drop-shadow-sm">
                {selectedAgent.name} <span className="text-sm text-slate-700 font-medium">({selectedAgent.role_title})</span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-700 mt-1">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-white/50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng
                </span>
                <span className="bg-white/50 px-2 py-0.5 rounded-full">Model: <b>{selectedAgent.model}</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* Khung tin nhắn */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentMessages.map((msg) => {
            const isUser = msg.sender === "user";
            const isAgentImg = !isUser && selectedAgent.avatar.startsWith("/avatars/");
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${isUser ? "bg-slate-200 text-slate-700" : "bg-sky-500 text-white"}`}>
                  {isUser ? (
                    <User className="w-4 h-4" />
                  ) : isAgentImg ? (
                    <img src={selectedAgent.avatar} alt={selectedAgent.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div className={`max-w-xl rounded-2xl p-4 text-sm ${isUser ? "bg-sky-500 text-white" : "bg-white border border-slate-200 text-slate-800 shadow-sm"}`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  <div className={`text-[10px] mt-1 text-right ${isUser ? "text-sky-100" : "text-slate-400"}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-3">
              <div className="relative w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 overflow-hidden">
                {selectedAgent.avatar.startsWith("/avatars/") ? (
                  <img src={selectedAgent.avatar} alt={selectedAgent.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                <span className="absolute inset-0 rounded-full ring-2 ring-sky-400 animate-ping" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 shadow-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-500 animate-spin" />
                <span>{selectedAgent.name} đang suy nghĩ...</span>
              </div>
            </div>
          )}
        </div>

        {/* Khung nhập liệu */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={`Hỏi ${selectedAgent.name} về ${selectedAgent.role_title.toLowerCase()}...`}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:border-sky-500 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold text-sm rounded-xl flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" /> Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
