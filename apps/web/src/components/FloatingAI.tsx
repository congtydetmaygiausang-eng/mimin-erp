"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MessageSquare, X, Send, Sparkles, Bot, User, Loader2,
  Package, BarChart3, TrendingUp, AlertTriangle, FileText,
  Minimize2, Maximize2, ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";

const QUICK_PROMPTS = [
  { icon: Package, label: "Tồn kho?", query: "Tồn kho hiện tại thế nào?" },
  { icon: BarChart3, label: "Nhân sự?", query: "Công ty có những phòng ban nào?" },
  { icon: TrendingUp, label: "Công nợ?", query: "Công nợ hiện tại ra sao?" },
];

export function FloatingAI() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [input, setInput] = useState("");

  // useChat v4 - transport-based, tự quản lý input
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/v1/orchestrator/query",
      body: { user_id: "sang@mimin.vn" },
    }),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Don't show on AI assistant page (already has full chat)
  if (pathname === "/ai-assistant" || pathname === "/agents-chat") return null;

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setPulse(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    if (error) {
      toast.error("AI bị lỗi: " + error.message);
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const sendQuickPrompt = (query: string) => {
    sendMessage({ text: query });
  };

  return (
    <>
      {/* Floating AI Bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[90] group"
          aria-label="Mở AI Assistant"
        >
          {/* Pulse rings */}
          {pulse && (
            <>
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-ping opacity-30" />
              <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-pulse opacity-20" />
            </>
          )}
          {/* Main bubble */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 shadow-2xl shadow-violet-500/40 flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-violet-500/60 group-active:scale-95">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow" />
          </div>
          {/* Label tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
            🤖 MIMIN AI — Hỏi gì cũng được!
            <div className="absolute top-full right-5 -mt-1 w-2 h-2 bg-slate-900 rotate-45" />
          </div>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className={`fixed z-[95] transition-all duration-300 ${
          expanded
            ? "inset-0 sm:inset-4"
            : "bottom-4 right-4 w-[360px] sm:w-[400px] h-[560px] sm:h-[620px]"
        }`}>
          {/* Backdrop on mobile expanded */}
          {expanded && <div className="absolute inset-0 bg-black/30 backdrop-blur-sm sm:rounded-3xl" onClick={() => setExpanded(false)} />}

          <div className={`relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${
            expanded ? "w-full h-full sm:rounded-3xl" : "w-full h-full rounded-2xl"
          }`}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800" style={{ background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 50%, #7c3aed 100%)" }}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-bold text-sm">MIMIN AI</div>
                <div className="text-white/70 text-[10px]">Trợ lý đa năng ERP · Online</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push("/ai-assistant")}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
                  title="Mở trang AI đầy đủ"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
                  title={expanded ? "Thu nhỏ" : "Mở rộng"}
                >
                  {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { setOpen(false); setExpanded(false); }}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-bl-md text-sm leading-relaxed bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <div className="whitespace-pre-wrap">👋 Xin chào! Em là **MIMIN AI** — trợ lý đa năng của hệ thống ERP.\n\nEm có thể đọc được toàn bộ dữ liệu thật của hệ thống. Anh cần xem tồn kho, công nợ hay danh sách nhân sự ạ? 🚀</div>
                  </div>
                </div>
              )}
              {messages.map((msg) => {
                // UIMessage v4 có parts[] thay vì content
                const textContent = msg.parts
                  ?.filter((p: any) => p.type === "text")
                  .map((p: any) => p.text)
                  .join("\n") || "";
                return (
                  <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-md"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md"
                    }`}>
                      <div className="whitespace-pre-wrap">{textContent.split("**").map((part: string, i: number) =>
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
                      )}</div>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                    <span className="text-xs text-slate-500">Đang phân tích...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            {messages.length === 0 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.label}
                        onClick={() => sendQuickPrompt(p.query)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition border border-violet-200/50"
                      >
                        <Icon className="w-3 h-3" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Hỏi MIMIN AI bất cứ gì..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="text-center mt-1.5">
                <span className="text-[9px] text-slate-400">MIMIN AI · Powered by Gemini 1.5 Pro</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
