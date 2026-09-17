"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MessageSquare, X, Send, Sparkles, Loader2,
  Minimize2, Maximize2, Warehouse, ArrowUpRight, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { AGENT_PERSONAS } from "@/lib/agent-personas";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent?: { id: string; name: string; provider: string; model: string };
  routing?: { taskTypes: string[]; isMultiAgent: boolean; totalAgents: number };
  timestamp: number;
}

const MINH_ROUTES = ["san-xuat", "lenh-", "to-", "-cl", "qc", "may", "tien-cong", "san-luong", "gia-cong", "hoan-thien", "cong-doan"];
const LAN_ROUTES = ["-kho", "kho-", "khach-hang", "lo-hang"];
const HA_ROUTES = ["nha-cung-cap", "nhan-su", "cong-no", "tai-chinh", "luong"];
const VY_ROUTES = ["mang-luoi-san-xuat", "huong-dan-vai-tro", "so-do-chien-luoc", "cong-thuc-dinh-muc", "bang-tin", "mau-da-thich"];
const HELP_ROUTES = ["audit-log", "realtime", "workflow", "he-thong", "cai-dat", "test-", "phan-quyen"];

type RouteMode = "lan" | "vy" | "minh" | "ha" | "mimin-help" | "mavis";

interface ModeTheme {
  agentId: string;
  botName: string;
  subtitle: string;
  BubbleIcon: any;
  iconTextClass: string;
  bubbleGradient: string;
  pulseGradient: string;
  headerBg: string;
  badgeGradient: string;
  userBubbleClass: string;
  accentTextClass: string;
  loaderClass: string;
  ringClass: string;
  sendBtnClass: string;
  welcomeText: string;
}

const THEME: Record<RouteMode, ModeTheme> = {
  lan: {
    agentId: "lan",
    botName: "Lan (Kho & Bán Hàng)",
    subtitle: "Chuyên gia Tồn Kho, Vật tư & Đơn hàng",
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
    welcomeText: "👋 Chào anh! Em là **Lan**, phụ trách Kho & Bán hàng.\n\nAnh cần tra cứu tồn kho, kiểm tra phiếu nhập hay hỏi về định mức vật tư, đơn bán ạ? 📦",
  },
  vy: {
    agentId: "vy",
    botName: "Vy (MIMIN Care)",
    subtitle: "Tư vấn & Chăm sóc khách hàng",
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
  minh: {
    agentId: "minh",
    botName: "Minh (Sản Xuất E2E)",
    subtitle: "Chuyên gia Kế hoạch & Sản xuất",
    BubbleIcon: Sparkles,
    iconTextClass: "text-white",
    bubbleGradient: "from-orange-500 via-amber-500 to-orange-600 shadow-orange-500/40",
    pulseGradient: "from-orange-500 to-amber-500",
    headerBg: "linear-gradient(135deg, #ea580c 0%, #d97706 50%, #f59e0b 100%)",
    badgeGradient: "from-orange-500 to-amber-600",
    userBubbleClass: "bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-br-md",
    accentTextClass: "text-orange-700 dark:text-orange-400",
    loaderClass: "text-orange-500",
    ringClass: "focus:ring-orange-500",
    sendBtnClass: "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-orange-500/20",
    welcomeText: "👋 Chào anh! Em là **Minh**, phụ trách toàn bộ quy trình sản xuất.\n\nTừ lệnh cắt → may → QC → hoàn thiện. Anh muốn kiểm tra tiến độ, lệnh sản xuất hay công đoạn nào? 🏭",
  },
  ha: {
    agentId: "ha",
    botName: "Hà (Kế toán & Nhân sự)",
    subtitle: "Chuyên gia Tài chính, Công nợ & Nhân sự",
    BubbleIcon: Sparkles,
    iconTextClass: "text-white",
    bubbleGradient: "from-violet-500 via-purple-500 to-violet-600 shadow-violet-500/40",
    pulseGradient: "from-violet-500 to-purple-500",
    headerBg: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #7c3aed 100%)",
    badgeGradient: "from-violet-500 to-purple-600",
    userBubbleClass: "bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-md",
    accentTextClass: "text-violet-700 dark:text-violet-400",
    loaderClass: "text-violet-500",
    ringClass: "focus:ring-violet-500",
    sendBtnClass: "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/20",
    welcomeText: "👋 Chào anh! Em là **Hà**, phụ trách Tài chính – Kế toán – Nhân sự.\n\nAnh muốn em kiểm tra thu chi, công nợ, bảng lương hay hồ sơ nhân sự nào hôm nay? 💰",
  },
  "mimin-help": {
    agentId: "mimin-help",
    botName: "MIMIN Help (Phân tích AI)",
    subtitle: "Chuyên gia Giải pháp & Tối ưu",
    BubbleIcon: Sparkles,
    iconTextClass: "text-slate-800",
    bubbleGradient: "from-slate-200 via-slate-300 to-slate-400 shadow-slate-500/40",
    pulseGradient: "from-slate-300 to-slate-400",
    headerBg: "linear-gradient(135deg, #475569 0%, #64748b 50%, #334155 100%)",
    badgeGradient: "from-slate-400 to-slate-500",
    userBubbleClass: "bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-br-md",
    accentTextClass: "text-slate-700 dark:text-slate-400",
    loaderClass: "text-slate-500",
    ringClass: "focus:ring-slate-500",
    sendBtnClass: "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-slate-500/20",
    welcomeText: "👋 Chào anh! Em là **MIMIN Help**, chuyên gia tư vấn giải pháp AI hệ thống.\n\nAnh cần hỗ trợ phân tích dữ liệu, tìm nguyên nhân lỗi, hay tối ưu hóa cấu hình hệ thống? 🤖",
  },
  mavis: {
    agentId: "mavis",
    botName: "Mavis (Điều phối)",
    subtitle: "Trợ lý Điều phối Tổng quan",
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
    welcomeText: "👋 Xin chào! Em là **Mavis**, trợ lý điều phối tổng quan hệ thống.\n\nAnh cứ giao việc cho em, em sẽ phân tích và điều hướng đến bộ phận chuyên trách (Kho, SX, Kế toán...). Hôm nay anh muốn làm gì? 🚀",
  },
};

export function FloatingAI() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // DRAG & DROP STATE
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initPosX: 0, initPosY: 0, dragging: false, moved: false });

  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSession();

  const isMinhRoute = MINH_ROUTES.some((r) => pathname?.includes(r)) && !pathname?.includes("mang-luoi-san-xuat");
  const isLanRoute = LAN_ROUTES.some((r) => pathname?.includes(r));
  const isHaRoute = HA_ROUTES.some((r) => pathname?.includes(r));
  const isVyRoute = VY_ROUTES.some((r) => pathname?.includes(r));
  const isHelpRoute = HELP_ROUTES.some((r) => pathname?.includes(r));

  let mode: RouteMode = "mavis";
  if (isMinhRoute) mode = "minh";
  else if (isLanRoute) mode = "lan";
  else if (isHaRoute) mode = "ha";
  else if (isVyRoute) mode = "vy";
  else if (isHelpRoute) mode = "mimin-help";
  
  const theme = THEME[mode];

  // Hiện đúng "nhân vật" thật của agent phụ trách (ảnh hoặc emoji riêng từng
  // agent trong agent-personas.ts) thay vì icon Lucide chung chung - trước
  // đây bong bóng nổi luôn hiện icon trừu tượng (Warehouse/MessageSquare/
  // Sparkles), không phân biệt được đang nói chuyện với "ai".
  const agentAvatar = theme.agentId ? AGENT_PERSONAS[theme.agentId]?.avatar : undefined;
  const isImageAvatar = !!agentAvatar && agentAvatar.startsWith("/");
  const hasCharacterAvatar = !!agentAvatar && !isImageAvatar; // emoji

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Early return moved to the bottom to prevent React Error #300 (rendered fewer hooks)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("mimin_hide_ai") === "true") setIsHidden(true);
      const savedPos = localStorage.getItem("mimin_ai_pos");
      if (savedPos) {
        try { setPos(JSON.parse(savedPos)); } catch(e) {}
      } else {
        setPos({ x: 24, y: window.innerWidth < 768 ? 80 : 24 }); // Mặc định góc trái dưới
      }
      
      const handleRestore = () => setIsHidden(false);
      window.addEventListener("mimin_restore_ai", handleRestore);
      return () => window.removeEventListener("mimin_restore_ai", handleRestore);
    }
  }, []);

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
          // Trước đây hardcode "sang@mimin.vn" cho MỌI người dùng - bất kỳ ai
          // đăng nhập chat cũng bị AI chào nhầm là "sếp Sang". Gửi đúng email
          // người đang đăng nhập thật để API chào đúng tên (route.ts tra tên
          // thật từ users.ts theo email này).
          user_id: user?.email || "guest",
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

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, initPosX: pos.x, initPosY: pos.y, dragging: true, moved: false };
    setIsDragging(true);
    setShowTrash(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = dragRef.current.startY - e.clientY; 
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.moved = true;
    
    setPos({ x: dragRef.current.initPosX + dx, y: dragRef.current.initPosY + dy });

    if (e.clientY > window.innerHeight - 120 && Math.abs(e.clientX - window.innerWidth / 2) < 100) {
      setOverTrash(true);
    } else {
      setOverTrash(false);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    setIsDragging(false);
    setShowTrash(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (overTrash) {
      setIsHidden(true);
      localStorage.setItem("mimin_hide_ai", "true");
    } else {
      localStorage.setItem("mimin_ai_pos", JSON.stringify(pos));
      if (!dragRef.current.moved) setOpen(true);
    }
    setOverTrash(false);
  };

  if (pathname === "/ai-assistant" || pathname === "/agents-chat" || isHidden) return null;

  return (
    <>
      {/* Trash Zone */}
      {showTrash && !open && (
        <div className={`fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-red-500/20 to-transparent z-[80] flex items-end justify-center pb-6 transition-all duration-300 pointer-events-none ${overTrash ? 'from-red-500/40 pb-8' : ''}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${overTrash ? 'bg-red-500 text-white scale-110 shadow-xl shadow-red-500/50' : 'bg-slate-800/80 text-slate-400 backdrop-blur-md'}`}>
            <Trash2 className="w-8 h-8" />
          </div>
        </div>
      )}

      {/* Floating AI Bubble */}
      {!open && (
        <button
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ left: `${pos.x}px`, bottom: `${pos.y}px`, touchAction: "none" }}
          className={`fixed z-[90] group ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab transition-all duration-300'}`}
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
          <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${theme.bubbleGradient} shadow-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${theme.iconTextClass} overflow-hidden pointer-events-none`}>
            {isImageAvatar ? (
              <img src={agentAvatar} alt={theme.botName} className="w-full h-full object-cover pointer-events-none" draggable={false} />
            ) : hasCharacterAvatar ? (
              <span className="text-3xl sm:text-4xl drop-shadow pointer-events-none" role="img" aria-label={theme.botName} draggable={false}>{agentAvatar}</span>
            ) : (
              <theme.BubbleIcon className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow pointer-events-none" />
            )}
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
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shadow-inner overflow-hidden">
                  {isImageAvatar ? (
                    <img src={agentAvatar} alt={theme.botName} className="w-full h-full object-cover" />
                  ) : hasCharacterAvatar ? (
                    <span className="text-xl" role="img" aria-label={theme.botName}>{agentAvatar}</span>
                  ) : (
                    <theme.BubbleIcon className={`w-6 h-6 ${theme.iconTextClass}`} />
                  )}
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
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${theme.badgeGradient} flex items-center justify-center ${theme.iconTextClass} flex-shrink-0 mt-0.5 shadow-md overflow-hidden`}>
                    {isImageAvatar ? (
                      <img src={agentAvatar} alt={theme.botName} className="w-full h-full object-cover" />
                    ) : hasCharacterAvatar ? (
                      <span className="text-base" role="img" aria-label={theme.botName}>{agentAvatar}</span>
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
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
                // Ở mode "default" (Mavis/bộ định tuyến), agent trả lời thật
                // sự (msg.agent) có thể khác agent mặc định của trang tuỳ
                // câu hỏi - dùng avatar của AGENT THẬT đã trả lời, không phải
                // avatar cố định của theme trang.
                const msgAvatar = msg.agent?.id ? AGENT_PERSONAS[msg.agent.id]?.avatar : agentAvatar;
                const msgIsImage = !!msgAvatar && msgAvatar.startsWith("/");
                const msgHasAvatar = !!msgAvatar && !msgIsImage;
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
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${theme.badgeGradient} flex items-center justify-center ${theme.iconTextClass} flex-shrink-0 mt-0.5 shadow-md overflow-hidden`}>
                        {msgIsImage ? (
                          <img src={msgAvatar} alt={msg.agent?.name} className="w-full h-full object-cover" />
                        ) : msgHasAvatar ? (
                          <span className="text-base" role="img" aria-label={msg.agent?.name}>{msgAvatar}</span>
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
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
