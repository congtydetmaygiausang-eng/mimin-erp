// ============================================
// Giọng nói agent (Web Speech API - giọng trình duyệt, miễn phí) - dùng chung
// giữa agents-chat/page.tsx và agents/page.tsx (2 nơi có nút nghe giới thiệu).
// ============================================
//
// GIỚI HẠN THẬT của Web Speech API (đã báo anh Sang): không có tham số
// "cảm xúc"/prosody - chỉ chỉnh được rate (tốc độ), pitch (cao độ) và chọn
// voice hệ thống có sẵn. Muốn giọng thật sự biểu cảm (lên xuống theo ngữ
// cảnh câu) cần đổi sang TTS AI trả phí (ElevenLabs/OpenAI TTS...) - anh
// Sang đã chọn giọng trình duyệt miễn phí trước đó nên không đổi hạ tầng,
// chỉ tối ưu trong giới hạn cho phép: rate/pitch riêng theo tính cách từng
// agent (khớp PERSONALITY_* đã viết) + ưu tiên đúng giọng nam/nữ nếu máy có.

export type AgentGender = "male" | "female";

export const AGENT_VOICE_PROFILE: Record<string, { gender: AgentGender; rate: number; pitch: number }> = {
  // Mavis: điềm tĩnh như quản lý -> tốc độ vừa, cao độ chuẩn mực
  mavis: { gender: "female", rate: 0.95, pitch: 1.0 },
  // Minh: nhanh, thực tế, quản đốc -> nói nhanh hơn 1 chút, giọng trầm hơn
  minh: { gender: "male", rate: 1.08, pitch: 0.95 },
  // Lan: hoạt bát, nắm hàng nhanh -> nhanh nhẹn, cao giọng hơn
  lan: { gender: "female", rate: 1.05, pitch: 1.15 },
  // Hà: cẩn thận, chuẩn số liệu -> chậm rãi, chắc chắn
  ha: { gender: "female", rate: 0.9, pitch: 0.98 },
  // Vy: nhẹ nhàng, chu đáo -> êm, tốc độ vừa, hơi cao
  vy: { gender: "female", rate: 0.95, pitch: 1.1 },
  // MIMIN Help: năng động, công nghệ/giải pháp -> trung tính, nhanh nhẹn
  "mimin-help": { gender: "male", rate: 1.02, pitch: 0.97 },
};

const DEFAULT_PROFILE = { gender: "female" as AgentGender, rate: 0.95, pitch: 1.0 };

// Từ khoá nhận diện giọng nam/nữ trong tên voice hệ thống - Windows/Edge có
// "Microsoft NamMinh Online (Natural) - Vietnamese" (nam) và "Microsoft
// HoaiMy Online (Natural) - Vietnamese" (nữ); Android/Chrome thường chỉ có
// đúng 1 giọng "Google Tiếng Việt" (không phân biệt được, sẽ rơi về mặc định).
const MALE_HINTS = ["nam", "male", "duy", "khoa", "minh trai"];
const FEMALE_HINTS = ["hoai", "female", "linh", "mai", "my", "nu"];

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  return cachedVoices;
}

// Voice list thường load bất đồng bộ (rỗng ở lần gọi đầu) - gọi 1 lần lúc
// module load + lắng nghe voiceschanged để lần sau đã có sẵn trong cache.
if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
}

function pickVoiceForGender(gender: AgentGender): SpeechSynthesisVoice | undefined {
  const voices = loadVoices();
  const viVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith("vi"));
  if (viVoices.length === 0) return undefined;
  const hints = gender === "male" ? MALE_HINTS : FEMALE_HINTS;
  const matched = viVoices.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));
  return matched || viVoices[0];
}

export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-•]\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

export function buildUtteranceForAgent(text: string, agentId: string): SpeechSynthesisUtterance {
  const profile = AGENT_VOICE_PROFILE[agentId] || DEFAULT_PROFILE;
  const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
  utterance.lang = "vi-VN";
  utterance.rate = profile.rate;
  utterance.pitch = profile.pitch;
  const voice = pickVoiceForGender(profile.gender);
  if (voice) utterance.voice = voice;
  return utterance;
}
