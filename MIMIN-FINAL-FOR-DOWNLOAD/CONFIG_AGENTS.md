# ⚙️ CẤU HÌNH 9 AGENTS - 3 PROVIDERS

> **v89.6.9.1** - Theo yêu cầu sếp Sang (2026-07-30)

---

## 🎯 BẢNG ROUTING

| # | Agent | Module | Provider | Model | Trạng thái |
|---|-------|--------|----------|-------|------------|
| 0 | 🤖 **Mavis** (Orchestrator) | orchestrator | 🟣 MINIMAX | `MiniMax-M2` | ⏳ Chờ nạp tiền |
| 1 | 🏭 **Anh Hùng** (GĐ SX) | san-xuat | 🟣 MINIMAX | `MiniMax-M2` | ⏳ Chờ nạp tiền |
| 2 | 📦 **Anh Khoa** (GĐ Kho) | kho | 🟣 MINIMAX | `MiniMax-M2` | ⏳ Chờ nạp tiền |
| 3 | 💰 **Anh Sơn** (Kế toán) | ke-toan | 🔵 **GEMINI** | `gemini-1.5-pro` | ❌ Cần key Gemini |
| 4 | 👥 **Chị Mai** (NS) | nhan-su | 🟣 MINIMAX | `MiniMax-M2` | ⏳ Chờ nạp tiền |
| 5 | 🧠 **Anh Sâu** (DeepSeek) | deepseek | 🟢 **DEEPSEEK** | `deepseek-chat` | ✅ **ĐANG WORK** |
| 6 | 🤝 **Chị Hoa** (Bán hàng) | ban-hang | 🟣 MINIMAX | `MiniMax-M2` | ⏳ Chờ nạp tiền |
| 7 | 💎 **Anh Quốc** (CFO) | tai-chinh | 🔵 **GEMINI** | `gemini-1.5-pro` | ❌ Cần key Gemini |
| 8 | 🔍 **Chị Hạnh** (Theo dõi) | theo-doi-cd | 🟣 MINIMAX | `MiniMax-M2` | ⏳ Chờ nạp tiền |
| 9 | 🔧 **Anh Tuấn KT** (Kỹ thuật may) | ky-thuat-may | 🟣 MINIMAX | `MiniMax-M2` | ⏳ Chờ nạp tiền |

---

## 🔑 API KEYS CẦN THIẾT

### 1. 🟣 MINIMAX (đã có key, chờ nạp tiền)
- **Key**: `sk-api-QXS06nx...TobbykNU` ✓ VALID
- **Endpoint**: `https://api.minimax.io/v1/chat/completions`
- **Model**: `MiniMax-M2` ✓ TỒN TẠI
- **Vấn đề**: Tài khoản cần **NẠP TIỀN** (lỗi 1008 insufficient balance)
- **Nạp tại**: https://api.minimax.io → Billing

### 2. 🔵 GEMINI (chưa có key đúng)
- **Key sếp paste**: `AQ.Ab8RN6I5...` ❌ Không dùng được (OAuth token)
- **Key cần**: Format `AIzaSy...` (Google AI Studio API key)
- **Lấy tại**: https://aistudio.google.com/apikey

### 3. 🟢 DEEPSEEK (đã có key, đang work)
- **Key**: `sk-f9211be98edf4e97824677dda0292eeb` ✅
- **Model**: `deepseek-chat` (model `deepseek-v4-flash`)
- **Status**: ✅ **HOẠT ĐỘNG** (dùng làm fallback)

---

## 🔄 FALLBACK CHAIN

Khi provider chính lỗi, hệ thống tự chuyển:

```
1. MINIMAX (nếu được config cho agent đó)
   ↓ lỗi
2. GEMINI (nếu được config cho agent đó)
   ↓ lỗi
3. DEEPSEEK (luôn luôn dùng được)
   ↓ lỗi
4. MOCK (câu trả lời có sẵn trong code)
```

---

## 📊 TRẠNG THÁI HIỆN TẠI

| Agent | Provider config | Đang dùng thật | Ghi chú |
|-------|----------------|---------------|---------|
| Mavis | MINIMAX | DeepSeek (fallback) | MINIMAX chưa nạp tiền |
| Anh Hùng | MINIMAX | DeepSeek (fallback) | MINIMAX chưa nạp tiền |
| Anh Khoa | MINIMAX | DeepSeek (fallback) | MINIMAX chưa nạp tiền |
| **Anh Sơn** | **GEMINI** | DeepSeek (fallback) | ❌ **Cần key Gemini** |
| Chị Mai | MINIMAX | DeepSeek (fallback) | MINIMAX chưa nạp tiền |
| **Anh Sâu** | **DEEPSEEK** | ✅ **DeepSeek thật** | OK |
| Chị Hoa | MINIMAX | DeepSeek (fallback) | MINIMAX chưa nạp tiền |
| **Anh Quốc** | **GEMINI** | DeepSeek (fallback) | ❌ **Cần key Gemini** |
| Chị Hạnh | MINIMAX | DeepSeek (fallback) | MINIMAX chưa nạp tiền |
| Anh Tuấn KT | MINIMAX | DeepSeek (fallback) | MINIMAX chưa nạp tiền |

→ **Tất cả 9 agents đều hoạt động** (qua DeepSeek fallback)

---

## 🚀 CÁCH KÍCH HOẠT PROVIDER

### Kích hoạt MINIMAX:
1. Vào https://api.minimax.io
2. Đăng nhập email `polomin1994@gmail.com`
3. Vào **Billing** / **Wallet**
4. **Nạp tiền** (tối thiểu $5-$20)
5. Đợi 1-2 phút → tự chuyển sang MINIMAX

### Kích hoạt GEMINI:
1. Vào https://aistudio.google.com/apikey
2. Đăng nhập Google
3. Click **"Create API Key"**
4. Chọn project (hoặc tạo mới)
5. Copy key (format `AIzaSy...`)
6. Paste cho em → em update `.env.local`

---

## 🛠️ TÙY CHỈNH ROUTING

Sếp có thể force provider qua env:
```env
NEXT_PUBLIC_FORCE_PROVIDER=minimax  # Tất cả MINIMAX
NEXT_PUBLIC_FORCE_PROVIDER=gemini   # Tất cả Gemini
NEXT_PUBLIC_FORCE_PROVIDER=deepseek # Tất cả DeepSeek
```

Hoặc sửa trong `lib/agent-routing-config.ts`:
```ts
export const AGENT_PROVIDER_MAP: Record<AgentId, Provider> = {
  "agent-ke-toan": "gemini",  // ← Đổi sang "deepseek" nếu muốn
  "agent-tai-chinh": "gemini",
  // ...
};
```

---

## 📞 LIÊN HỆ

- **Agent chính**: Mavis (trợ lý sếp Sang)
- **Sếp Sang**: Hồ Minh Sang
- **Tài khoản MINIMAX**: polomin1994@gmail.com
- **Project**: MIMIN ERP v89.6.9.1

---

**Cập nhật lần cuối**: 2026-07-30 bởi Mavis
