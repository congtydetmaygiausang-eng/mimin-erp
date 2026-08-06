"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Paperclip, Sparkles, X, Plus, History, ChevronRight, Bot, User, Loader2, FileText, BarChart3, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  agent?: string;
  data?: any;
  quickActions?: { label: string; action: string }[];
}

const SUGGESTIONS = [
  { icon: Package, label: "Lệnh cắt M758 tiến độ?", query: "Lệnh cắt M758 tiến độ thế nào?" },
  { icon: BarChart3, label: "Tồn kho vải?", query: "Tồn kho vải hiện tại?" },
  { icon: TrendingUp, label: "Công nợ quá hạn?", query: "Công nợ nào đang quá hạn?" },
  { icon: AlertTriangle, label: "Cảnh báo?", query: "Có cảnh báo nào quan trọng không?" },
  { icon: FileText, label: "Lương tháng 7?", query: "Tổng lương tháng 7 bao nhiêu?" },
  { icon: Sparkles, label: "Tạo lệnh cắt", query: "Tôi muốn tạo lệnh cắt mới" },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "👋 Xin chào sếp Sang! Em là trợ lý AI của MIMIN ERP. Em có thể giúp sếp:\n\n• Tạo / sửa / xem lệnh cắt\n• Kiểm tra tồn kho vải, sợi, phụ liệu, TP\n• Tính công nợ KH / NCC\n• Tính lương\n• Lập báo cáo\n\nSếp cứ hỏi bất cứ gì nhé!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Gọi API orchestrator
      const res = await fetch("/api/v1/orchestrator/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "sang@mimin.vn",
          messages: [{ role: "user", content }],
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.response || "Đã xử lý xong.",
        timestamp: new Date(),
        agent: data.agents_called?.[0],
        data: data.data,
        quickActions: data.actions_taken?.map((a: any) => ({ label: `🔍 ${a.tool}`, action: "view" })),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      // Fallback: dùng mock response nếu API lỗi
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: `⚠️ Không kết nối được tới orchestrator API. Sếp thử lại sau nhé!\n\nEm vẫn có thể demo: **${content}** - hệ thống đang trong quá trình kết nối agent.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      toast.error("Mất kết nối với Orchestrator");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {/* Sidebar - History */}
      {showHistory && (
        <div className="hidden md:flex w-64 bg-white/60 backdrop-blur border-r border-slate-200 flex-col">
          <div className="p-4 border-b">
            <button
              onClick={() => setMessages([messages[0]])}
              className="w-full px-3 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Cuộc trò chuyện mới
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase px-2 py-2">📜 Gần đây</h3>
            {[
              { title: "Lệnh cắt M758 tiến độ?", time: "2 phút trước" },
              { title: "Tồn kho vải?", time: "1 giờ trước" },
              { title: "Lương tháng 7?", time: "Hôm qua" },
              { title: "Công nợ quá hạn?", time: "2 ngày trước" },
              { title: "Cảnh báo NCC?", time: "3 ngày trước" },
            ].map((h, i) => (
              <button
                key={i}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-sky-50 transition group"
              >
                <div className="text-sm font-medium text-slate-700 truncate">{h.title}</div>
                <div className="text-[10px] text-slate-400">{h.time}</div>
              </button>
            ))}
          </div>
          <div className="p-3 border-t bg-slate-50/50">
            <div className="text-[10px] text-slate-500 text-center">
              🤖 Orchestrator: <b>Mavis Opus 4</b>
              <br />
              26 agents · 1,234 calls/ngày
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-4 md:px-6 py-3 bg-white/70 backdrop-blur border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="md:hidden p-1.5 rounded hover:bg-slate-100"
            >
              <History className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 via-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">Trợ lý sếp Sang</h1>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Đang hoạt động · 26 agents sẵn sàng
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded">● Online</span>
            <span className="px-2 py-1 bg-slate-100 rounded">1.2s avg</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} onAction={(action) => toast.info(`Action: ${action}`)} />
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                <span className="text-sm text-slate-500">Đang gọi agent...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <div className="px-4 md:px-6 pb-2">
            <div className="text-xs font-semibold text-slate-500 mb-2">💡 Gợi ý câu hỏi:</div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.query)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 rounded-full text-xs font-medium text-slate-700 flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <s.icon className="w-3.5 h-3.5 text-sky-500" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 md:p-6 bg-white/70 backdrop-blur border-t border-slate-200">
          <div className="max-w-4xl mx-auto flex gap-2 items-end">
            <button className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Hỏi bất cứ gì... (Enter để gửi, Shift+Enter xuống dòng)"
                rows={1}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl resize-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-sm"
                style={{ maxHeight: "120px" }}
              />
            </div>
            <button className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Gửi</span>
            </button>
          </div>
          <div className="max-w-4xl mx-auto mt-2 text-[10px] text-slate-400 text-center">
            💡 Mavis AI có thể mắc lỗi. Vui lòng kiểm tra thông tin quan trọng.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MESSAGE BUBBLE COMPONENT
// ============================================
function MessageBubble({ msg, onAction }: { msg: Message; onAction: (action: string) => void }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-slate-200" : "bg-gradient-to-br from-sky-500 to-blue-500"
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-2xl ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        {msg.agent && (
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            🤖 {msg.agent}
            <span className="text-slate-300">·</span>
            <span>{msg.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white"
              : "bg-white border border-slate-200 text-slate-800 shadow-sm"
          }`}
        >
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
          {msg.data && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs space-y-1 font-mono">
              <div className="font-bold text-slate-600 mb-1">📊 Data:</div>
              {Object.entries(msg.data).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}:</span>
                  <span className="text-slate-800 font-semibold">{JSON.stringify(v)}</span>
                </div>
              ))}
            </div>
          )}
          {msg.quickActions && msg.quickActions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {msg.quickActions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => onAction(a.action)}
                  className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs rounded-full hover:bg-sky-100 font-medium"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
