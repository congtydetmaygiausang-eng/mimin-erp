"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MessageSquare, X, Send, Sparkles, Loader2,
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

// Khu vực hướng ra khách hàng/đối tác bên ngoài (Mạng Lưới Sản Xuất + nhóm
// "MIMIN Group") - Vy (CSKH) phụ trách tư vấn/hỗ trợ ở đây thay vì MIMIN AI
// chung chung. 5 agent còn lại (Mavis/Minh/Lan/Hà/MIMIN Help) vẫn được phân
// bổ theo domain qua bộ định tuyến tự động (agent-routing-rules.ts), không
// cần ép route riêng như Kho/Vy vì không có khu vực nào chỉ-dành-riêng cho
// từng agent đó như 2 khu này.
const VY_ROUTES = ["/mang-luoi-san-xuat", "/huong-dan-vai-tro", "/so-do-chien-luoc", "/cong-thuc-dinh-muc", "/bang-tin"];

type RouteMode = "kho" | "vy" | "default";

interface ModeTheme {
  agentId: string | undefined; // undefined = để bộ định tuyến tự chọn
  botName: string;
  subtitle: string;
  BubbleIcon: typeof Sparkles;
  iconTextClass: string; // màu icon trong khung tròn
  bubbleGradient: string; // bong bóng nổi + shadow
  pulseGradient: string;
  headerBg: string; // CSS gradient string cho header panel
  badgeGradient: string; // avatar tin nhắn
  userBubbleClass: string;
  accentTextClass: string; // chữ đậm trong tin nhắn chào mừng
  loaderClass: string;
  ringClass: string;
  sendBtnClass: string;
  welcomeText: string;
}

const THEME: Record<RouteMode, ModeTheme> = {
  kho: {
    agentId: "lan",
    botName: "Minimax AI (Kho)",
    subtitle: "Chuyên gia Tồn Kho & Vật tư",
    BubbleIcon: Warehouse,
    iconTextClass: "text-white",
    bubbleGradient: "from-emerald-600 via-teal-600 to-emerald-700 shadow-emerald-500/40",
    pulseGradient: "from-emerald-500 to-teal-500",
    headerBg: "linear-gradient(135deg, #059669 0%, #0d9488 50%, #10b981 100%)",
    badgeGradient: "from-emerald-500 to-teal-600",
    userBubbleClass: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-md",
    accentTextClass: "text-emerald-700 dark:text-emerald-400",
    loaderClass: "text-emerald-500",
    ringClass: "focus:ring-emerald-500",
    sendBtnClass: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20",
    welcomeText: "👋 Chào anh! Em là **Minimax**, AI phụ trách Quản lý Kho.\n\nAnh cần tra cứu tồn kho, kiểm tra phiếu nhập hay hỏi về định mức vật tư ạ? 📦",
  },
  vy: {
    agentId: "vy",
    botName: "Vy - MIMIN Care AI",
    subtitle: "Chuyên gia tư vấn bán hàng & CSKH",
    BubbleIcon: MessageSquare,
    iconTextClass: "text-white",
    bubbleGradient: "from-pink-500 via-rose-500 to-rose-600 shadow-rose-500/40",
    pulseGradient: "from-pink-500 to-rose-500",
    headerBg: "linear-gradient(135deg, #db2777 0%, #e11d48 50%, #be123c 100%)",
    badgeGradient: "from-pink-500 to-rose-600",
    userBubbleClass: "bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-br-md",
    accentTextClass: "text-rose-700 dark:text-rose-400",
    loaderClass: "text-rose-500",
    ringClass: "focus:ring-rose-500",
    sendBtnClass: "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-rose-500/20",
    welcomeText: "👋 Chào anh/chị! Em là **Vy**, phụ trách tư vấn & hỗ trợ khách hàng của MIMIN.\n\nAnh/chị cần tìm đối tác gia công, tra cứu năng lực nhà cung cấp hay hỗ trợ đơn hàng ạ? 💬",
  },
  default: {
    agentId: undefined,
    botName: "MIMIN AI",
    subtitle: "Trợ lý đa năng ERP · Online",
    BubbleIcon: Sparkles,
    iconTextClass: "text-amber-400",
    bubbleGradient: "from-sky-500 via-cyan-600 to-teal-600 shadow-cyan-500/40",
    pulseGradient: "from-sky-500 to-cyan-500",
    headerBg: "linear-gradient(135deg, #0284c7 0%, #0891b2 50%, #0d9488 100%)",
    badgeGradient: "from-sky-500 to-cyan-600",
    userBubbleClass: "bg-gradient-to-r from-sky-600 to-cyan-600 text-white rounded-br-md",
    accentTextClass: "text-cyan-700 dark:text-cyan-400",
    loaderClass: "text-cyan-500",
    ringClass: "focus:ring-cyan-500",
    sendBtnClass: "bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 shadow-cyan-500/20",
    welcomeText: "👋 Xin chào! Em là **MIMIN AI** — trợ lý đa năng của hệ thống ERP.\n\nEm có thể đọc được toàn bộ dữ liệu thật của hệ thống. Anh cần xem tồn kho, công nợ hay danh sách nhân sự ạ? 🚀",
  },
};

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
  const isVyRoute = !isKhoRoute && VY_ROUTES.some((r) => pathname?.startsWith(r));
  const mode: RouteMode = isKhoRoute ? "kho" : isVyRoute ? "vy" : "default";
  const theme = THEME[mode];

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
          // API đọc field "agent_id". Kho -> "lan", khu MIMIN Group/Trang chủ
          // sản xuất -> "vy", các khu còn lại để trống cho bộ định tuyến tự
          // chọn theo domain/từ khoá (Mavis/Minh/Hà/MIMIN Help).
          agent_id: theme.agentId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      // Detect response format: streaming (Gemini) hoặc JSON (DeepSeek/Minimax)
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/plain") || contentType.includes("event-stream")) {
        // Gemini streaming dùng AI SDK v5 toUIMessageStreamResponse() - mỗi dòng
        // "data: " là 1 SỰ KIỆN NHỎ ({"type":"text-delta","delta":"..."} ...),
        // KHÔNG phải 1 khối JSON chat-completion duy nhất. Code cũ gộp hết rồi
        // JSON.parse() cả khối -> luôn lỗi (nhiều JSON object dính liền nhau) ->
        // rơi vào catch, hiển thị thẳng JSON thô lên khung chat thay vì câu trả
        // lời thật. Phải parse TỪNG dòng, chỉ cộng dồn phần "delta".
        const text = await res.text();
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));
        let streamedText = "";
        let streamError = "";
        for (const line of lines) {
          const payload = line.slice(6).trim();
          if (!payload || payload === "[DONE]") continue;
          let evt: any;
          try {
            evt = JSON.parse(payload);
          } catch {
            continue;
          }
          if (evt.type === "text-delta" && typeof evt.delta === "string") {
            streamedText += evt.delta;
          } else if (evt.type === "error") {
            streamError = evt.errorText || "Lỗi khi Gemini trả lời";
          }
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: streamError ? `❌ Lỗi: ${streamError}` : (streamedText || "Không có phản hồi"),
            // "ha" là agent duy nhất dùng Gemini ở bộ 6 agent V6 hiện tại
            // (agent-tai-chinh cũ đã gộp vào ha) - trước đây hardcode nhãn cũ
            // nên badge luôn hiện sai tên dù thực tế Hà đã trả lời.
            agent: { id: "ha", name: "Hà", provider: "gemini", model: "gemini-3.1-pro-preview" },
            timestamp: Date.now(),
          },
        ]);
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
              <span className={`absolute inset-0 rounded-full bg-gradient-to-r ${theme.pulseGradient} animate-ping opacity-30`} />
              <span className={`absolute -inset-1 rounded-full bg-gradient-to-r ${theme.pulseGradient} animate-pulse opacity-20`} />
            </>
          )}
          {/* Main bubble */}
          <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${theme.bubbleGradient} shadow-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${theme.iconTextClass}`}>
            <theme.BubbleIcon className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow" />
          </div>
          {/* Label tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
            🤖 {theme.botName}
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
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800" style={{ background: theme.headerBg }}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shadow-inner">
                  <theme.BubbleIcon className={`w-6 h-6 ${theme.iconTextClass}`} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-sm" />
              </div>
              <div className="flex-1">
                <div className="text-white font-bold text-sm drop-shadow-sm">{theme.botName}</div>
                <div className="text-white/80 text-[10px] font-medium">{theme.subtitle}</div>
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
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${theme.badgeGradient} flex items-center justify-center ${theme.iconTextClass} flex-shrink-0 mt-0.5 shadow-md`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md text-sm leading-relaxed bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <div className="whitespace-pre-wrap">{theme.welcomeText.split("**").map((part: string, i: number) =>
                        i % 2 === 1 ? <strong key={i} className={theme.accentTextClass}>{part}</strong> : <span key={i}>{part}</span>
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
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${theme.badgeGradient} flex items-center justify-center ${theme.iconTextClass} flex-shrink-0 mt-0.5 shadow-md`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? theme.userBubbleClass
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
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${theme.badgeGradient} flex items-center justify-center ${theme.iconTextClass} flex-shrink-0 shadow-md`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2 shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <Loader2 className={`w-4 h-4 animate-spin ${theme.loaderClass}`} />
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
                  placeholder={`Hỏi ${theme.botName} bất cứ gì...`}
                  className={`flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 outline-none transition-shadow ${theme.ringClass}`}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`w-11 h-11 rounded-xl text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:scale-105 active:scale-95 ${theme.sendBtnClass}`}
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
