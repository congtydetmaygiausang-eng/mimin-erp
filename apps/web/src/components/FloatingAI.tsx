"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MessageSquare, X, Send, Sparkles, Bot, User, Loader2,
  Minimize2, Maximize2, Warehouse, ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent?: { id: string; name: string; provider: string; model: string };
  routing?: { taskTypes: string[]; isMultiAgent: boolean; totalAgents: number };
  timestamp: number;
}

export function FloatingAI() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const isKhoRoute = pathname?.includes("-kho") || pathname?.includes("trang-chu-kho");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Don't show on AI assistant page (already has full chat)
  if (pathname === "/ai-assistant" || pathname === "/agents-chat") return null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setPulse(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/orchestrator/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "sang@mimin.vn",
          messages: [{ role: "user", content: text }],
          // API đọc field "agent_id", không phải "hint_agent" - trước đây gửi
          // sai tên field nên gợi ý ép agent-kho bị rớt âm thầm, luôn rơi về
          // định tuyến theo từ khoá. "lan" là agent thật đang phụ trách Kho ở
          // bộ 6 agent V6 (agent-kho cũ đã gộp vào lan).
          agent_id: isKhoRoute ? "lan" : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      // Detect response format: streaming (Gemini) hoặc JSON (DeepSeek/Minimax)
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/plain") || contentType.includes("event-stream")) {
        // Gemini streaming - đọc toàn bộ text
        const text = await res.text();
        // Parse SSE format
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));
        const fullText = lines
          .map((l) => l.slice(6))
          .filter((l) => l && l !== "[DONE]")
          .join("");
        try {
          const parsed = JSON.parse(fullText);
          const content = parsed.choices?.[0]?.message?.content || parsed.response || fullText;
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: "assistant",
              content: typeof content === "string" ? content : JSON.stringify(content),
              // "ha" là agent duy nhất dùng Gemini ở bộ 6 agent V6 hiện tại
              // (agent-tai-chinh cũ đã gộp vào ha) - trước đây hardcode nhãn cũ
              // nên badge luôn hiện sai tên dù thực tế Hà đã trả lời.
              agent: { id: "ha", name: "Hà", provider: "gemini", model: "gemini-1.5-pro" },
              timestamp: Date.now(),
            },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: "assistant",
              content: fullText,
              // "ha" là agent duy nhất dùng Gemini ở bộ 6 agent V6 hiện tại
              // (agent-tai-chinh cũ đã gộp vào ha) - trước đây hardcode nhãn cũ
              // nên badge luôn hiện sai tên dù thực tế Hà đã trả lời.
              agent: { id: "ha", name: "Hà", provider: "gemini", model: "gemini-1.5-pro" },
              timestamp: Date.now(),
            },
          ]);
        }
      } else {
        // DeepSeek/Minimax JSON
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: data.response || data.error || "Không có phản hồi",
            agent: data.agent,
            routing: data.routing,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err: any) {
      toast.error("AI bị lỗi: " + err.message);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `❌ Lỗi: ${err.message}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
    setInput("");
  };

  const botName = isKhoRoute ? "Minimax AI (Kho)" : "MIMIN AI";
  const botIcon = isKhoRoute ? <Warehouse className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-amber-400" />;
  const themeColors = isKhoRoute ? "from-emerald-600 via-teal-600 to-emerald-700 shadow-emerald-500/40" : "from-sky-500 via-cyan-600 to-teal-600 shadow-cyan-500/40";
  const headerBg = isKhoRoute ? "linear-gradient(135deg, #059669 0%, #0d9488 50%, #10b981 100%)" : "linear-gradient(135deg, #0284c7 0%, #0891b2 50%, #0d9488 100%)";
  const botBadgeColor = isKhoRoute ? "from-emerald-500 to-teal-600" : "from-sky-500 to-cyan-600";
  const welcomeText = isKhoRoute 
    ? "👋 Chào anh! Em là **Minimax**, AI phụ trách Quản lý Kho.\n\nAnh cần tra cứu tồn kho, kiểm tra phiếu nhập hay hỏi về định mức vật tư ạ? 📦"
    : "👋 Xin chào! Em là **MIMIN AI** — trợ lý đa năng của hệ thống ERP.\n\nEm có thể đọc được toàn bộ dữ liệu thật của hệ thống. Anh cần xem tồn kho, công nợ hay danh sách nhân sự ạ? 🚀";

  return (
    <>
      {/* Floating AI Bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-6 md:bottom-6 z-[90] group"
          aria-label="Mở AI Assistant"
        >
          {/* Pulse rings */}
          {pulse && (
            <>
              <span className={`absolute inset-0 rounded-full bg-gradient-to-r ${isKhoRoute ? "from-emerald-500 to-teal-500" : "from-sky-500 to-cyan-500"} animate-ping opacity-30`} />
              <span className={`absolute -inset-1 rounded-full bg-gradient-to-r ${isKhoRoute ? "from-emerald-500 to-teal-500" : "from-sky-500 to-cyan-500"} animate-pulse opacity-20`} />
            </>
          )}
          {/* Main bubble */}
          <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${themeColors} shadow-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${isKhoRoute ? "text-white" : "text-amber-400"}`}>
            {isKhoRoute ? <Warehouse className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow" /> : <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow" />}
          </div>
          {/* Label tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
            🤖 {botName}
            <div className="absolute top-full right-5 -mt-1 w-2 h-2 bg-slate-900 rotate-45" />
          </div>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className={`fixed z-[95] transition-all duration-300 ${
          expanded
            ? "inset-0 sm:inset-4"
            : "bottom-20 right-4 md:bottom-4 w-[360px] sm:w-[400px] h-[560px] sm:h-[620px]"
        }`}>
          {/* Backdrop on mobile expanded */}
          {expanded && <div className="absolute inset-0 bg-black/30 backdrop-blur-sm sm:rounded-3xl" onClick={() => setExpanded(false)} />}

          <div className={`relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${
            expanded ? "w-full h-full sm:rounded-3xl" : "w-full h-full rounded-2xl"
          }`}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800" style={{ background: headerBg }}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shadow-inner">
                  {botIcon}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-sm" />
              </div>
              <div className="flex-1">
                <div className="text-white font-bold text-sm drop-shadow-sm">{botName}</div>
                <div className="text-white/80 text-[10px] font-medium">{isKhoRoute ? "Chuyên gia Tồn Kho & Vật tư" : "Trợ lý đa năng ERP · Online"}</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push("/ai-assistant")}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition"
                  title="Mở trang AI đầy đủ"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition"
                  title={expanded ? "Thu nhỏ" : "Mở rộng"}
                >
                  {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { setOpen(false); setExpanded(false); }}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
              {messages.length === 0 && (
                <div className="flex gap-2.5">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${botBadgeColor} flex items-center justify-center ${isKhoRoute ? "text-white" : "text-amber-400"} flex-shrink-0 mt-0.5 shadow-md`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md text-sm leading-relaxed bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <div className="whitespace-pre-wrap">{welcomeText.split("**").map((part: string, i: number) =>
                        i % 2 === 1 ? <strong key={i} className={isKhoRoute ? "text-emerald-700 dark:text-emerald-400" : "text-cyan-700 dark:text-cyan-400"}>{part}</strong> : <span key={i}>{part}</span>
                      )}</div>
                  </div>
                </div>
              )}
              {messages.map((msg) => {
                const textContent = msg.content || "";
                const agentBadge = msg.agent ? (
                  <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold opacity-70">
                    <Sparkles className="w-3 h-3" />
                    <span>{msg.agent.name}</span>
                    <span className="opacity-50">· {msg.agent.provider}</span>
                    {msg.routing?.isMultiAgent && (
                      <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-700 rounded-full text-[9px]">
                        🤝 {msg.routing.totalAgents} agents
                      </span>
                    )}
                  </div>
                ) : null;
                return (
                  <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${botBadgeColor} flex items-center justify-center ${isKhoRoute ? "text-white" : "text-amber-400"} flex-shrink-0 mt-0.5 shadow-md`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? isKhoRoute ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-md" : "bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-br-md"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md border border-slate-100 dark:border-slate-700/50"
                    }`}>
                      {agentBadge}
                      <div className="whitespace-pre-wrap">{textContent.split("**").map((part: string, i: number) =>
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
                      )}</div>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex gap-2.5">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${botBadgeColor} flex items-center justify-center ${isKhoRoute ? "text-white" : "text-amber-400"} flex-shrink-0 shadow-md`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2 shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <Loader2 className={`w-4 h-4 animate-spin ${isKhoRoute ? "text-emerald-500" : "text-cyan-500"}`} />
                    <span className="text-xs font-medium text-slate-500">Đang phân tích dữ liệu...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Hỏi ${botName} bất cứ gì...`}
                  className={`flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 outline-none transition-shadow ${isKhoRoute ? "focus:ring-emerald-500" : "focus:ring-cyan-500"}`}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`w-11 h-11 rounded-xl text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:scale-105 active:scale-95 ${
                    isKhoRoute ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20" : "bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 shadow-cyan-500/20"
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="text-center mt-2">
                <span className="text-[10px] font-medium text-slate-400">Powered by Gemini 1.5 Pro & DeepSeek</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
