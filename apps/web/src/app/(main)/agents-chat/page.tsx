"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, MessageSquare, ArrowLeft, CheckCircle2, Trash2, Volume2, VolumeX, Paperclip, X, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AGENT_PERSONAS, AgentPersona, getDefaultAgentIdForRole } from "@/lib/agent-personas";
import { useSession } from "@/components/session-provider";
import { buildUtteranceForAgent } from "@/lib/agent-voice";

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  imageUrl?: string; // ảnh đính kèm (nếu tin nhắn user gửi kèm ảnh) - hiện lại làm bằng chứng đã gửi đúng ảnh gì
  attachmentName?: string; // tên file Excel đính kèm (nếu có) - hiện badge nhỏ, không hiện cả bảng dữ liệu vào bong bóng chat
}

// Đính kèm đang chờ gửi - Excel được đọc thành text (gửi kèm câu hỏi qua
// đường text bình thường, chạy được với cả 3 provider); ảnh gửi base64 qua
// nhánh vision riêng (chỉ Gemini đọc được ảnh trong stack này).
type PendingAttachment =
  | { type: "excel"; fileName: string; textContext: string }
  | { type: "image"; fileName: string; dataUrl: string; mimeType: string };

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

// Trước đây lịch sử chat chỉ nằm trong useState - refresh trang hoặc chuyển
// tab là mất sạch. Anh Sang yêu cầu giữ lại lịch sử tối đa 1 ngày, tự xoá
// sau đó, và có nút xoá tay bất cứ lúc nào. Lưu localStorage (không phải
// Supabase - đây là UI state cá nhân, chưa cần đồng bộ nhiều thiết bị).
const CHAT_HISTORY_KEY = "mimin_agents_chat_history_v1";
const CHAT_HISTORY_TTL_MS = 24 * 60 * 60 * 1000;


// "Đã từng gặp agent này chưa" - QUYẾT ĐỊNH RIÊNG với lịch sử chat 24h ở trên:
// lịch sử tin nhắn có thể tự xoá sau 1 ngày, nhưng KHÔNG có nghĩa là "quên"
// đã từng làm việc với agent - giống nhân sự thật, không tự nhiên "quên mặt"
// đồng nghiệp chỉ vì qua 1 ngày. Lưu riêng, không có hạn.
const AGENTS_MET_KEY = "mimin_agents_met_v1";

function loadMetAgents(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(AGENTS_MET_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function markAgentMet(agentId: string) {
  if (typeof window === "undefined") return;
  const met = loadMetAgents();
  if (met.has(agentId)) return;
  met.add(agentId);
  try {
    localStorage.setItem(AGENTS_MET_KEY, JSON.stringify(Array.from(met)));
  } catch {}
}

// Gọi /api/v1/orchestrator/query và trả về text thuần - dùng chung cho cả
// tin nhắn thật (handleSend) lẫn lời chào động theo dữ liệu (tier 3). Tách
// riêng để không lặp lại đoạn parse SSE của nhánh Gemini (mỗi dòng "data: "
// là 1 sự kiện nhỏ, không phải 1 khối JSON chat-completion duy nhất).
async function callOrchestrator(
  userId: string,
  content: string,
  agentId: string,
  image?: { dataUrl: string; mimeType: string }
): Promise<string> {
  const res = await fetch("/api/v1/orchestrator/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      messages: [{ role: "user", content }],
      agent_id: agentId,
      ...(image ? { image } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/plain") || contentType.includes("event-stream")) {
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
        continue;
      }
      if (evt.type === "text-delta" && typeof evt.delta === "string") {
        streamedText += evt.delta;
      } else if (evt.type === "error") {
        throw new Error(evt.errorText || "Lỗi khi Gemini trả lời");
      }
    }
    return streamedText || "Không có phản hồi";
  }

  const data = await res.json();
  return data.response || data.error || "Không có phản hồi";
}

// Lời chào "biết tình hình thật" (tier 3) - agent tự tra dữ liệu qua tool
// của mình rồi chào ngắn gọn theo đúng chuyên môn, thay vì câu chào ngắn
// tĩnh (greetingShort) không đổi. Chỉ áp dụng cho lần mở chat SAU (đã từng
// gặp) - lần đầu vẫn dùng greeting tĩnh để giới thiệu danh tính trước đã.
const DYNAMIC_GREETING_PROMPT =
  "Đây là tin nhắn tự động khi mở lại phiên chat, KHÔNG phải câu hỏi thật của người dùng - không trả lời như đang trả lời câu hỏi. Nếu có tool tra cứu dữ liệu thuộc chuyên môn của bạn, hãy dùng thử để xem hôm nay có gì đáng chú ý không. Sau đó chào ngắn gọn 1-2 câu đúng phong cách riêng của bạn (KHÔNG giới thiệu lại tên/vai trò vì đã từng nói chuyện rồi), chủ động nhắc điểm đáng chú ý nếu tìm thấy, và hỏi hôm nay muốn xử lý gì trước. Trả lời ngắn gọn, không dùng markdown.";

function loadStoredMessages(): { savedAt: number; messages: Record<string, Message[]> } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt: number; messages: Record<string, Message[]> };
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > CHAT_HISTORY_TTL_MS) {
      localStorage.removeItem(CHAT_HISTORY_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export default function AgentsChatPage() {
  const { user } = useSession();
  const searchParams = useSearchParams();
  const agentsList = Object.values(AGENT_PERSONAS);
  const [selectedAgent, setSelectedAgent] = useState<AgentPersona>(agentsList[0]);
  const [autoSelected, setAutoSelected] = useState(false);

  // Gộp làm 1 effect (không tách 2 effect riêng): tách riêng bị race - cả 2
  // effect cùng chạy trong 1 lượt render với "autoSelected" đọc từ closure
  // CŨ (false), nên effect theo vai trò luôn ghi đè mất kết quả của effect
  // đọc ?agent= dù nó chạy sau và set autoSelected=true trước đó. Bấm card
  // agent ở Dashboard Agents (/agents) hoặc nút "Chat với..." ở trang chi
  // tiết đều điều hướng sang đây kèm ?agent=<id> - ưu tiên param này cao
  // nhất; chỉ dùng agent mặc định theo vai trò khi KHÔNG có param.
  useEffect(() => {
    if (autoSelected) return;
    const agentIdFromUrl = searchParams.get("agent");
    if (agentIdFromUrl) {
      const match = agentsList.find((a) => a.agent_id === agentIdFromUrl);
      if (match) {
        setSelectedAgent(match);
        setAutoSelected(true);
      }
      return;
    }
    if (!user) return;
    const defaultId = getDefaultAgentIdForRole(user.role);
    const match = agentsList.find((a) => a.agent_id === defaultId);
    if (match) setSelectedAgent(match);
    setAutoSelected(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, autoSelected]);

  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    const stored = loadStoredMessages();
    return (
      stored?.messages || {
        "mimin-orchestrator": [
          { id: "1", sender: "agent", text: "Xin chào! Tôi là Mavis, trợ lý AI điều phối tổng quan MIMIN ERP. Bạn cần hỗ trợ gì hôm nay?", timestamp: "10:00" },
        ],
      }
    );
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [autoRead, setAutoRead] = useState(false);
  const [metAgents, setMetAgents] = useState<Set<string>>(() => loadMetAgents());
  // Lời chào tier 3 (theo dữ liệu thật) - KHÔNG persist, phải gọi lại mỗi
  // lần mở chat theo đúng yêu cầu, không lưu vĩnh viễn như lịch sử hội thoại.
  const [dynamicGreetings, setDynamicGreetings] = useState<Record<string, string>>({});
  const [greetingLoadingId, setGreetingLoadingId] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chọn file đính kèm - Excel (.xlsx/.xls/.csv) đọc thành text bảng để gửi
  // kèm câu hỏi qua đường text bình thường (chạy được cả 3 provider). Ảnh
  // đọc base64 để gửi qua nhánh vision riêng (chỉ Gemini đọc được ảnh).
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại đúng file đó lần sau
    if (!file) return;

    const isExcel = /\.(xlsx|xls|csv)$/i.test(file.name);
    const isImage = file.type.startsWith("image/");

    setFileError(null);
    if (!isExcel && !isImage) {
      setFileError("Chỉ hỗ trợ file Excel (.xlsx, .xls, .csv) hoặc ảnh (jpg, png...).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File quá lớn (tối đa 10MB).");
      return;
    }

    setAttaching(true);
    try {
      if (isImage) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        setAttachment({ type: "image", fileName: file.name, dataUrl, mimeType: file.type });
      } else {
        // xlsx đọc được cả .csv luôn, không cần parser riêng.
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const parts: string[] = [];
        for (const sheetName of wb.SheetNames.slice(0, 5)) {
          const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
          // Giới hạn ~400 dòng/sheet để không gửi file khổng lồ vào prompt,
          // tốn token vô ích và có thể vượt giới hạn context của model.
          const lines = csv.split("\n").slice(0, 400);
          parts.push(`--- Sheet "${sheetName}" ---\n${lines.join("\n")}`);
        }
        const textContext = `[File Excel đính kèm: "${file.name}"]\n${parts.join("\n\n")}`;
        setAttachment({ type: "excel", fileName: file.name, textContext });
      }
    } catch (err) {
      console.error(err);
      setFileError(`Không đọc được file: ${err instanceof Error ? err.message : "lỗi không rõ"}`);
    } finally {
      setAttaching(false);
    }
  };

  // Đọc to 1 tin nhắn bằng Web Speech API (giọng trình duyệt - miễn phí,
  // không cần API key, làm được ngay). Huỷ câu đang đọc trước khi đọc câu
  // mới, tránh chồng giọng khi bấm liên tục.
  const speak = (text: string, messageId: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (speakingId === messageId) {
      setSpeakingId(null);
      return;
    }
    // Tốc độ/cao độ/giọng nam-nữ riêng theo từng agent (agent-voice.ts) - khớp
    // tính cách đã viết trong agent-personality.ts, thay vì 1 giọng máy móc
    // giống hệt nhau cho cả 6 agent.
    const utterance = buildUtteranceForAgent(text, selectedAgent.agent_id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Tắt trang/đổi agent thì phải dừng giọng đọc đang phát dở, không để nó
  // tự đọc tiếp trong nền sau khi người dùng đã rời màn hình.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Ghi lại mỗi khi tin nhắn đổi - giữ nguyên savedAt gốc nếu còn hạn (hết
  // đúng 24h kể từ tin nhắn đầu, không phải "24h kể từ lần chat gần nhất").
  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = loadStoredMessages();
    const savedAt = existing?.savedAt || Date.now();
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify({ savedAt, messages }));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleClearHistory = () => {
    if (!window.confirm("Xoá toàn bộ lịch sử chat với tất cả agent? Không thể hoàn tác.")) return;
    localStorage.removeItem(CHAT_HISTORY_KEY);
    setMessages({});
  };

  // Lời chào mở đầu (hiện trước khi gọi API):
  // - Lần ĐẦU gặp agent: giới thiệu đầy đủ (greeting), không gọi AI.
  // - Lần sau: đang tra dữ liệu (loading) -> chào "biết tình hình thật"
  //   (dynamicGreetings, tier 3) nếu gọi được -> rơi về chào ngắn tĩnh
  //   (greetingShort) nếu lỗi/chưa xong. Không lặp lại y hệt như đang nói
  //   chuyện với 1 agent duy nhất đổi avatar.
  const agentId = selectedAgent.agent_id;
  const hasRealHistory = !!messages[agentId]?.length;
  let initGreetingText = selectedAgent.greeting;
  let greetingIsLoading = false;
  if (metAgents.has(agentId)) {
    if (dynamicGreetings[agentId]) {
      initGreetingText = dynamicGreetings[agentId];
    } else if (greetingLoadingId === agentId) {
      greetingIsLoading = true;
      initGreetingText = "";
    } else {
      initGreetingText = selectedAgent.greetingShort;
    }
  }
  const currentMessages = hasRealHistory
    ? messages[agentId]
    : greetingIsLoading
    ? []
    : [{ id: "init", sender: "agent" as const, text: initGreetingText, timestamp: "Vừa xong" }];

  // Chào theo dữ liệu thật (tier 3) - chỉ cho agent đã từng gặp, và chỉ khi
  // chưa có hội thoại thật nào trong phiên hiện tại (không ghi đè lịch sử
  // đang xem). Không lưu vào messages[] persisted - phải gọi lại MỖI LẦN mở
  // chat như anh Sang yêu cầu, không phải 1 lần duy nhất rồi lưu mãi.
  useEffect(() => {
    if (!metAgents.has(agentId)) return;
    if (hasRealHistory) return;
    if (dynamicGreetings[agentId]) return;
    if (greetingLoadingId === agentId) return;

    let cancelled = false;
    setGreetingLoadingId(agentId);
    callOrchestrator(user?.email || "guest", DYNAMIC_GREETING_PROMPT, agentId)
      .then((text) => {
        if (cancelled || !text) return;
        setDynamicGreetings((prev) => ({ ...prev, [agentId]: text }));
        if (autoRead) speak(text, `dyn-greeting-${agentId}`);
      })
      .catch(() => {
        // Im lặng rơi về greetingShort tĩnh - không cần báo lỗi cho 1 lời chào phụ.
      })
      .finally(() => {
        if (!cancelled) setGreetingLoadingId((id) => (id === agentId ? null : id));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, metAgents, hasRealHistory]);

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || loading) return;
    const userText = input.trim();
    const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const currentAttachment = attachment;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: userText || (currentAttachment?.type === "image" ? "Phân tích ảnh này giúp em" : "Xem file đính kèm giúp em"),
      timestamp: now,
      imageUrl: currentAttachment?.type === "image" ? currentAttachment.dataUrl : undefined,
      attachmentName: currentAttachment?.type === "excel" ? currentAttachment.fileName : undefined,
    };

    setMessages((prev) => {
      const existing = prev[selectedAgent.agent_id] || [];
      // Chưa có hội thoại thật nào -> lời chào đang hiện (dài/ngắn/tier 3) sẽ
      // biến mất ngay khi currentMessages chuyển sang đọc messages[] thật.
      // Giữ nó lại làm tin nhắn đầu tiên của cuộc hội thoại hôm nay, tránh
      // cảm giác lời chào vừa đọc xong bỗng dưng biến mất khỏi khung chat.
      const greetingMsg: Message[] =
        existing.length === 0 && initGreetingText
          ? [{ id: `greeting-${selectedAgent.agent_id}`, sender: "agent", text: initGreetingText, timestamp: "Vừa xong" }]
          : [];
      return {
        ...prev,
        [selectedAgent.agent_id]: [...greetingMsg, ...existing, userMsg],
      };
    });
    markAgentMet(selectedAgent.agent_id);
    setMetAgents((prev) => (prev.has(selectedAgent.agent_id) ? prev : new Set(prev).add(selectedAgent.agent_id)));
    setInput("");
    setAttachment(null);
    setLoading(true);

    try {
      // Gọi đúng API route thật (server-side, đọc key bí mật đúng cách) - trước đây
      // trang này gọi callAgentV2() chạy thẳng trong trình duyệt, đọc
      // process.env.DEEPSEEK_API_KEY phía client luôn ra rỗng (Next.js không đưa
      // biến môi trường không có tiền tố NEXT_PUBLIC_ vào bundle client, đúng theo
      // bảo mật) -> mọi câu hỏi đều rơi vào nhánh mock, không bao giờ gọi AI thật.
      // FloatingAI.tsx đã dùng đúng route /api/v1/orchestrator/query này từ trước.
      // File Excel: nối text bảng đã đọc vào NỘI DUNG gửi cho AI (không hiện
      // trong bong bóng chat, chỉ hiện badge tên file). Ảnh: gửi qua nhánh
      // vision riêng của route (param image).
      const contentToSend =
        currentAttachment?.type === "excel"
          ? `${currentAttachment.textContext}\n\nCâu hỏi: ${userMsg.text}`
          : userMsg.text;
      const responseText = await callOrchestrator(
        user?.email || "guest",
        contentToSend,
        selectedAgent.agent_id,
        currentAttachment?.type === "image" ? { dataUrl: currentAttachment.dataUrl, mimeType: currentAttachment.mimeType } : undefined
      );

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
      if (autoRead) speak(agentMsg.text, agentMsg.id);
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

  // Vào chat qua ?agent=<id> (bấm card ở Dashboard Agents hoặc nút "Chat
  // với...") -> xem như đang vào 1-1 riêng với agent đó, ẩn thanh 6 agent
  // bên trái cho gọn màn hình (theo yêu cầu anh Sang), thay vì luôn hiện
  // switcher. Vào thẳng /agents-chat (không kèm param) vẫn giữ switcher như
  // cũ để người dùng tự do chuyển qua lại giữa các agent.
  const isFocusedChat = !!searchParams.get("agent");

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50">
      {/* Sidebar Danh sách 9 Agent - ẩn khi vào chat riêng 1 agent (focused) */}
      <div className={`w-80 bg-white border-r border-slate-200 flex-col ${isFocusedChat ? "hidden" : "flex"}`}>
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <Link href="/agents" className="text-xs text-sky-600 flex items-center gap-1 font-semibold mb-2 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard Agents
            </Link>
            <button
              onClick={handleClearHistory}
              title="Xoá lịch sử chat (lưu tối đa 1 ngày)"
              className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 mb-2 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xoá lịch sử
            </button>
          </div>
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Bot className="w-5 h-5 text-sky-500" /> Chat {agentsList.length} Nhân viên AI
          </h2>
          <p className="text-xs text-slate-500">Chọn nhân viên AI để trao đổi trực tiếp · lưu lịch sử tối đa 1 ngày</p>
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
          {isFocusedChat && (
            <div className="px-6 pt-3">
              <Link
                href="/agents"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white/50 hover:bg-white/70 px-2.5 py-1 rounded-full transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard Agents
              </Link>
            </div>
          )}
          <div className="relative flex items-center gap-4 px-6 py-5">
            <button
              onClick={() => speak(initGreetingText || selectedAgent.greetingShort, `intro-${selectedAgent.agent_id}`)}
              title="Bấm để nghe agent tự giới thiệu"
              className="relative w-20 h-20 rounded-2xl bg-white/40 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-white/70 shadow-md text-4xl cursor-pointer hover:ring-sky-300 transition group/avatar"
            >
              {selectedAgent.avatar.startsWith("/avatars/") ? (
                <img src={selectedAgent.avatar} alt={selectedAgent.name} className="w-full h-full object-cover object-top" />
              ) : (
                selectedAgent.avatar
              )}
              <span className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/20 flex items-center justify-center transition">
                <Volume2 className={`w-6 h-6 text-white opacity-0 group-hover/avatar:opacity-100 transition ${speakingId === `intro-${selectedAgent.agent_id}` ? "opacity-100 animate-pulse" : ""}`} />
              </span>
            </button>
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
            <button
              onClick={() => {
                if (autoRead && typeof window !== "undefined") window.speechSynthesis?.cancel();
                setAutoRead((v) => !v);
              }}
              title={autoRead ? "Đang tự động đọc câu trả lời - bấm để tắt" : "Bật tự động đọc câu trả lời bằng giọng nói"}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                autoRead ? "bg-sky-600 text-white shadow" : "bg-white/50 text-slate-700 hover:bg-white/70"
              }`}
            >
              {autoRead ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              {autoRead ? "Đang đọc tự động" : "Đọc tự động"}
            </button>
          </div>
        </div>

        {/* Khung tin nhắn */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {greetingIsLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                {selectedAgent.avatar.startsWith("/avatars/") ? (
                  <img src={selectedAgent.avatar} alt={selectedAgent.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full bg-sky-500 text-white flex items-center justify-center"><Bot className="w-4 h-4" /></div>
                )}
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 shadow-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-500 animate-spin" />
                <span>{selectedAgent.name} đang xem tình hình hôm nay...</span>
              </div>
            </div>
          )}
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
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Ảnh đính kèm" className="max-w-full max-h-64 rounded-lg mb-2 border border-white/30" />
                  )}
                  {msg.attachmentName && (
                    <div className={`flex items-center gap-1.5 text-xs mb-2 px-2 py-1 rounded-lg w-fit ${isUser ? "bg-white/15" : "bg-slate-100"}`}>
                      <FileSpreadsheet className="w-3.5 h-3.5" /> {msg.attachmentName}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  <div className={`flex items-center gap-2 mt-1 ${isUser ? "justify-end" : "justify-between"}`}>
                    {!isUser && (
                      <button
                        onClick={() => speak(msg.text, msg.id)}
                        title={speakingId === msg.id ? "Dừng đọc" : "Đọc to tin nhắn này"}
                        className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition ${
                          speakingId === msg.id ? "bg-sky-100 text-sky-700" : "text-slate-400 hover:text-sky-600 hover:bg-sky-50"
                        }`}
                      >
                        {speakingId === msg.id ? <Volume2 className="w-3 h-3 animate-pulse" /> : <Volume2 className="w-3 h-3" />}
                      </button>
                    )}
                    <div className={`text-[10px] ${isUser ? "text-sky-100" : "text-slate-400"}`}>
                      {msg.timestamp}
                    </div>
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
          {fileError && (
            <div className="flex items-center justify-between gap-2 mb-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              <span>{fileError}</span>
              <button onClick={() => setFileError(null)} className="text-rose-400 hover:text-rose-700 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {attachment && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl w-fit">
              {attachment.type === "image" ? (
                <img src={attachment.dataUrl} alt="preview" className="w-8 h-8 rounded object-cover" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              )}
              <span className="text-xs text-slate-700 max-w-[200px] truncate">{attachment.fileName}</span>
              <button onClick={() => setAttachment(null)} className="text-slate-400 hover:text-rose-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={attaching}
              title="Đính kèm ảnh hoặc file Excel để agent phân tích"
              className="px-3 py-2.5 border border-slate-300 rounded-xl text-slate-500 hover:text-sky-600 hover:border-sky-300 transition disabled:opacity-50 shrink-0"
            >
              {attaching ? <Sparkles className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                attachment
                  ? attachment.type === "image"
                    ? "Hỏi thêm về ảnh này (hoặc để trống, bấm Gửi)..."
                    : "Hỏi thêm về file này (hoặc để trống, bấm Gửi)..."
                  : `Hỏi ${selectedAgent.name} về ${selectedAgent.role_title.toLowerCase()}...`
              }
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:border-sky-500 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && !attachment)}
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
