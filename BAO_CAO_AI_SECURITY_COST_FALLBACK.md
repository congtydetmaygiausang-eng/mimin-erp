# 🤖 BÁO CÁO BẢO MẬT & CHI PHÍ AI MULTI-PROVIDER (v89.6.9.3)

> **Mục đích**: Báo cáo kiểm soát an toàn thông tin, bảo mật API Key, che giấu dữ liệu nhạy cảm (PII), hạn chế chi phí và cơ chế Fallback tự động cho 3 AI Provider (DeepSeek / MiniMax / Gemini).

---

## 📋 1. MA TRẬN PHÂN CÔNG & ĐIỀU HƯỚNG AI PROVIDER

| Tác Vụ AI / Module | Agent ID & Tên Persona | Provider Chính | Provider Dự Phòng | Model AI | Timeout | Retries | Che Dữ Liệu PII |
| :--- | :--- | :---: | :---: | :--- | :---: | :---: | :---: |
| **Điều phối Tổng quan** | `mimin-orchestrator` (Mavis) | DeepSeek | Gemini | `deepseek-chat` | 10s | 2 | 🔒 Có (Mã hóa SĐT/Email) |
| **Báo cáo Kế toán & Lương** | `agent-ke-toan` (Anh Sơn) | Gemini | DeepSeek | `gemini-1.5-flash` | 8s | 2 | 🔒 Che Số Tài khoản DB |
| **Hỗ trợ Bán hàng** | `agent-ban-hang` (Chị Hoa) | MiniMax | DeepSeek | `abab6.5t-chat` | 12s | 1 | 🔒 Che Đơn giá sỉ |
| **Phân tích Logic Nâng cao** | `agent-deepseek` (Anh Sâu) | DeepSeek | Gemini | `deepseek-reasoner` | 15s | 2 | 🔒 Chỉ gửi Mã vật tư |
| **Báo cáo CFO Tài chính** | `agent-tai-chinh` (Anh Quốc) | Gemini | DeepSeek | `gemini-1.5-pro` | 10s | 2 | 🔒 Che Tên Đối tác |

---

## 🛡️ 2. QUY TẮC BẢO MẬT VÀ QUẢN LÝ CHI PHÍ

1. **Bảo mật API Key**:
   - Tất cả API Key (`DEEPSEEK_API_KEY`, `MINIMAX_API_KEY`, `GEMINI_API_KEY`) được lưu trữ tại Server Environment Variable (`.env.local`), **KHÔNG** expose client public.
2. **Che dữ liệu nhạy cảm (PII Masking)**:
   - Trước khi gửi Prompt tới Provider ngoại vi, thông tin Khách hàng (SĐT, Email, Số tài khoản, CCCD) được mã hóa thành các Token ẩn danh (ví dụ `[CLIENT_ID_001]`).
3. **Giới hạn Chi phí (Cost Limit & Circuit Breaker)**:
   - Đặt hạn mức chi phí tối đa $5.00 USD / ngày.
   - Khi Provider trả về lỗi 429 (Rate Limit) hoặc Timeout quá 10s, hệ thống tự động kích hoạt **Fallback Runtime V2** chuyển sang Mock / Provider dự phòng mà **KHÔNG** lặp vòng lặp vô tận gây tốn phí trùng.

---

## 📌 PHÂN LOẠI TRẠNG THÁI
- **API PASS** / **LOGIC PASS** / **PERMISSION PASS**.
