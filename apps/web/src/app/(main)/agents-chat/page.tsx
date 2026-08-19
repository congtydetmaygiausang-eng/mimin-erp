"use client";

import { useState } from "react";
import { Send, Bot, User, Sparkles, MessageSquare, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { AGENT_PERSONAS, AgentPersona } from "@/lib/agent-personas";

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
}

export default function AgentsChatPage() {
  const agentsList = Object.values(AGENT_PERSONAS);
  const [selectedAgent, setSelectedAgent] = useState<AgentPersona>(agentsList[0]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    "mimin-orchestrator": [
      { id: "1", sender: "agent", text: "Xin chào! Tôi là Mavis, trợ lý AI điều phối tổng quan MIMIN ERP. Bạn cần hỗ trợ gì hôm nay?", timestamp: "10:00" },
    ],
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const currentMessages = messages[selectedAgent.agent_id] || [
    { id: "init", sender: "agent", text: `Chào sếp! Em là ${selectedAgent.name} (${selectedAgent.role_title}). Em có thể giúp sếp công việc gì?`, timestamp: "Vừa xong" }
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
          user_id: "sang@mimin.vn",
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
        const raw = await res.text();
        const lines = raw.split("\n").filter((l) => l.startsWith("data: "));
        const fullText = lines.map((l) => l.slice(6)).filter((l) => l && l !== "[DONE]").join("");
        try {
          const parsed = JSON.parse(fullText);
          responseText = parsed.choices?.[0]?.message?.content || parsed.response || fullText;
        } catch {
          responseText = fullText;
        }
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
            <Bot className="w-5 h-5 text-sky-500" /> Chat 9 Nhân viên AI
          </h2>
          <p className="text-xs text-slate-500">Chọn nhân viên AI để trao đổi trực tiếp</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {agentsList.map((agent) => {
            const isSelected = selectedAgent.agent_id === agent.agent_id;
            return (
              <button
                key={agent.agent_id}
                onClick={() => setSelectedAgent(agent)}
                className={`w-full text-left p-3 rounded-xl transition flex items-center gap-3 ${
                  isSelected ? "bg-sky-50 border border-sky-200 shadow-sm" : "hover:bg-slate-50"
                }`}
              >
                <div className="text-2xl w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {agent.avatar.startsWith("/avatars/") ? (
                    <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                  ) : (
                    agent.avatar
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 truncate">{agent.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono uppercase">
                      {agent.provider}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">{agent.role_title}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Giao diện Chat chính */}
      <div className="flex-1 flex flex-col">
        {/* Header Agent đang chọn */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-3xl w-11 h-11 rounded-full bg-sky-50 flex items-center justify-center border border-sky-100 overflow-hidden">
              {selectedAgent.avatar.startsWith("/avatars/") ? (
                <img src={selectedAgent.avatar} alt={selectedAgent.name} className="w-full h-full object-cover" />
              ) : (
                selectedAgent.avatar
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                {selectedAgent.name} <span className="text-xs text-slate-500 font-normal">({selectedAgent.role_title})</span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng
                </span>
                <span>• Model: <b>{selectedAgent.model}</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* Khung tin nhắn */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentMessages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-slate-200 text-slate-700" : "bg-sky-500 text-white"}`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
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
              <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
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
