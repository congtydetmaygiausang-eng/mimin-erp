// @codex MIMIN GROUP - Kiểm tra Token API
// Cache-bust for Vercel deployment: 2026-08-27_3

export interface TokenStatus {
  name: string;
  status: "OK" | "ERROR" | "NOT_CONFIGURED";
  message: string;
}

export async function checkAllTokens(): Promise<string> {
  const results: TokenStatus[] = [];

  const checks = [
    checkDeepSeek(),
    checkMiniMax(),
    checkOpenAI(),
    checkGemini(),
    checkTavily(),
    checkJina(),
    checkBrave(),
    checkSerper(),
    checkGoogleMaps()
  ];

  const statuses = await Promise.all(checks);
  statuses.forEach(s => results.push(s));

  // Build markdown table
  let md = `### 🔍 Báo cáo Trạng thái API Token\n\n`;
  md += `| Dịch vụ | Trạng thái | Thông tin chi tiết |\n`;
  md += `|---|---|---|\n`;

  for (const r of results) {
    const icon = r.status === "OK" ? "✅ Tốt" : r.status === "ERROR" ? "❌ Lỗi" : "⚠️ Chưa cấu hình";
    md += `| **${r.name}** | ${icon} | ${r.message} |\n`;
  }

  md += `\n*Báo cáo được tạo tự động bởi AI Agent lúc ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.*`;
  return md;
}

async function checkDeepSeek(): Promise<TokenStatus> {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) return { name: "DeepSeek", status: "NOT_CONFIGURED", message: "Thiếu DEEPSEEK_API_KEY" };
  try {
    const res = await fetch("https://api.deepseek.com/user/balance", {
      headers: { "Authorization": `Bearer ${key}` }
    });
    if (!res.ok) return { name: "DeepSeek", status: "ERROR", message: `HTTP ${res.status}` };
    const data = await res.json();
    if (data && data.balance_infos && data.balance_infos.length > 0) {
      const balance = data.balance_infos[0].total_balance;
      const currency = data.balance_infos[0].currency;
      return { name: "DeepSeek", status: "OK", message: `Số dư: ${balance} ${currency}` };
    }
    return { name: "DeepSeek", status: "OK", message: "Hợp lệ" };
  } catch (e: any) {
    return { name: "DeepSeek", status: "ERROR", message: e.message };
  }
}

async function checkMiniMax(): Promise<TokenStatus> {
  const key = process.env.MINIMAX_API_KEY?.trim();
  if (!key) return { name: "MiniMax", status: "NOT_CONFIGURED", message: "Thiếu MINIMAX_API_KEY" };
  try {
    const res = await fetch("https://api.minimax.io/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "MiniMax-Text-01", messages: [{ role: "user", content: "test" }] })
    });
    if (res.status === 401) return { name: "MiniMax", status: "ERROR", message: "Key không hợp lệ hoặc hết hạn" };
    if (!res.ok) return { name: "MiniMax", status: "ERROR", message: `HTTP ${res.status}` };
    return { name: "MiniMax", status: "OK", message: "Hợp lệ" };
  } catch (e: any) {
    return { name: "MiniMax", status: "ERROR", message: e.message };
  }
}

async function checkOpenAI(): Promise<TokenStatus> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return { name: "OpenAI", status: "NOT_CONFIGURED", message: "Thiếu OPENAI_API_KEY" };
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { "Authorization": `Bearer ${key}` }
    });
    if (!res.ok) return { name: "OpenAI", status: "ERROR", message: `HTTP ${res.status}` };
    return { name: "OpenAI", status: "OK", message: "Hợp lệ" };
  } catch (e: any) {
    return { name: "OpenAI", status: "ERROR", message: e.message };
  }
}

async function checkGemini(): Promise<TokenStatus> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return { name: "Gemini", status: "NOT_CONFIGURED", message: "Thiếu GEMINI_API_KEY" };
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (!res.ok) return { name: "Gemini", status: "ERROR", message: `HTTP ${res.status}` };
    return { name: "Gemini", status: "OK", message: "Hợp lệ" };
  } catch (e: any) {
    return { name: "Gemini", status: "ERROR", message: e.message };
  }
}

async function checkTavily(): Promise<TokenStatus> {
  const key = process.env.TAVILY_API_KEY?.trim();
  if (!key) return { name: "Tavily", status: "NOT_CONFIGURED", message: "Thiếu TAVILY_API_KEY" };
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key, query: "test", include_answer: false, max_results: 1 })
    });
    if (!res.ok) return { name: "Tavily", status: "ERROR", message: `HTTP ${res.status}` };
    return { name: "Tavily", status: "OK", message: "Hợp lệ" };
  } catch (e: any) {
    return { name: "Tavily", status: "ERROR", message: e.message };
  }
}

async function checkJina(): Promise<TokenStatus> {
  const key = process.env.JINA_API_KEY?.trim();
  if (!key) return { name: "Jina AI", status: "NOT_CONFIGURED", message: "Thiếu JINA_API_KEY" };
  try {
    const res = await fetch("https://api.jina.ai/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ model: "jina-embeddings-v2-base-en", input: ["test"] })
    });
    if (!res.ok) return { name: "Jina AI", status: "ERROR", message: `HTTP ${res.status}` };
    return { name: "Jina AI", status: "OK", message: "Hợp lệ" };
  } catch (e: any) {
    return { name: "Jina AI", status: "ERROR", message: e.message };
  }
}

async function checkBrave(): Promise<TokenStatus> {
  const key = process.env.BRAVE_SEARCH_API_KEY?.trim();
  if (!key) return { name: "Brave Search", status: "NOT_CONFIGURED", message: "Thiếu BRAVE_SEARCH_API_KEY" };
  try {
    const res = await fetch("https://api.search.brave.com/res/v1/web/search?q=test", {
      headers: { "Accept": "application/json", "X-Subscription-Token": key }
    });
    if (!res.ok) return { name: "Brave Search", status: "ERROR", message: `HTTP ${res.status}` };
    return { name: "Brave Search", status: "OK", message: "Hợp lệ" };
  } catch (e: any) {
    return { name: "Brave Search", status: "ERROR", message: e.message };
  }
}

async function checkSerper(): Promise<TokenStatus> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) return { name: "Serper (Google)", status: "NOT_CONFIGURED", message: "Thiếu SERPER_API_KEY" };
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": key },
      body: JSON.stringify({ q: "test" })
    });
    if (!res.ok) return { name: "Serper (Google)", status: "ERROR", message: `HTTP ${res.status}` };
    return { name: "Serper (Google)", status: "OK", message: "Hợp lệ" };
  } catch (e: any) {
    return { name: "Serper (Google)", status: "ERROR", message: e.message };
  }
}

async function checkGoogleMaps(): Promise<TokenStatus> {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) return { name: "Google Maps", status: "NOT_CONFIGURED", message: "Thiếu GOOGLE_MAPS_API_KEY" };
  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=test&inputtype=textquery&key=${key}`);
    if (!res.ok) return { name: "Google Maps", status: "ERROR", message: `HTTP ${res.status}` };
    return { name: "Google Maps", status: "OK", message: "Hợp lệ" };
  } catch (e: any) {
    return { name: "Google Maps", status: "ERROR", message: e.message };
  }
}
