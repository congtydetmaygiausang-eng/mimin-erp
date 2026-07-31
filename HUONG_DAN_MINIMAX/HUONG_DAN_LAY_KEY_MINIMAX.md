# 🔑 HƯỚNG DẪN LẤY KEY API MINIMAX

> **Sếp Sang ơi**, em đã test 3 key MINIMAX sếp paste — tất cả đều bị lỗi `1004 "login fail"`. Có thể key chưa được **activate** hoặc chưa **nạp tiền**. Sếp làm theo hướng dẫn dưới để lấy key đúng nhé.

---

## 📋 THÔNG TIN TÀI KHOẢN HIỆN TẠI

- **Email**: `polomin1994@gmail.com` (từ JWT payload)
- **Tên tài khoản**: `polomin` (từ tên biến `API-MINIMAX-POLOMIMIN_key`)
- **JWT exp**: year 2126 (100 năm — OK, không hết hạn)
- **Trạng thái key**: ❌ Chưa dùng được cho chat API

---

## 🚀 BƯỚC 1: ĐĂNG NHẬP MINIMAX

1. Mở trình duyệt → vào: **https://api.minimaxi.com**
2. Click **"Login"** (góc phải trên)
3. Đăng nhập bằng email `polomin1994@gmail.com`
4. Nếu quên password → click **"Forgot Password"** → reset qua email

---

## 💳 BƯỚC 2: KIỂM TRA TÀI KHOẢN (QUAN TRỌNG!)

Sau khi đăng nhập, sếp vào **"Account"** hoặc **"Profile"** và check:

### 2.1. Account Status
- ✅ **Active** (tài khoản đã kích hoạt)
- ❌ **Pending** → cần verify email
- ❌ **Suspended** → liên hệ support

### 2.2. Billing / Subscription
> ⚠️ **QUAN TRỌNG**: MINIMAX yêu cầu **nạp tiền trước** mới dùng được API!

- Vào **"Billing"** hoặc **"Subscription"**
- Check số dư hiện tại
- Nếu = 0 → cần **nạp tiền** (thường tối thiểu **$5-$20**)
- Phương thức thanh toán: **Credit Card** / **PayPal** / **Alipay**

### 2.3. API Plan
- MINIMAX có nhiều gói: **Free** / **Pay-as-you-go** / **Pro**
- Nếu đang ở **Free tier** → vẫn dùng được nhưng có giới hạn
- Nếu chưa có gói → chọn **Pay-as-you-go** (rẻ nhất)

---

## 🔑 BƯỚC 3: TẠO API KEY MỚI

1. Vào **"API Keys"** (menu bên trái)
2. Click **"Create New Key"** hoặc **"Generate Key"**
3. Đặt tên key: `MIMIN-ERP-Production` (để dễ nhớ)
4. **CHỌN ĐÚNG LOẠI KEY**:
   - ✅ **"Chat API Key"** (dùng cho chat completion - cái em cần)
   - ❌ **"Image API Key"** (chỉ dùng cho image generation)
   - ❌ **"Voice API Key"** (chỉ dùng cho TTS)
   - ❌ **"Embedding API Key"** (chỉ dùng cho embedding)
5. **Quan trọng**: Chọn **model = `MiniMax-Text-01`** (mạnh nhất, 1M context)
6. Click **"Generate"** / **"Create"**
7. **Copy key ngay** (MINIMAX chỉ hiện key 1 lần duy nhất!)

---

## 📝 BƯỚC 4: FORMAT KEY ĐÚNG

Key MINIMAX hợp lệ có 2 format:

### Format 1: JWT (HMAC)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6...
```
> Dùng cho: User authentication (đăng nhập web)

### Format 2: Secret Key (HMAC/API)
```
MINIMAX-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
```
> Dùng cho: Chat API (cái em cần) ← **Sếp cần cái này!**

### ⚠️ Trước đó sếp paste:
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` → Đây là **JWT auth token** (user login), **KHÔNG phải API key chat**
- `MINIMAX-RV7yRVx5-weRPKyDA-X13zB3Rp-gNanKkef` → Đây có thể là key cũ hoặc chưa activate

**Sếp cần tạo key mới** theo bước 3 ở trên, chọn đúng loại **"Chat API Key"**.

---

## 🧪 BƯỚC 5: TEST KEY SAU KHI TẠO

Sếp có thể test nhanh trên terminal:
```bash
curl -X POST "https://api.minimaxi.com/v1/text/chatcompletion_v2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <KEY_MỚI>" \
  -d '{
    "model": "MiniMax-Text-01",
    "messages": [{"role":"user","content":"Xin chào"}],
    "max_tokens": 50
  }'
```

**Nếu OK** → sẽ trả về JSON có `"reply"` field
**Nếu lỗi 1004** → key chưa activate, quay lại bước 2

---

## 📞 LIÊN HỆ SUPPORT MINIMAX (Nếu cần)

Nếu sau khi làm theo hướng dẫn vẫn lỗi, sếp liên hệ:

- **Email support**: `support@minimaxi.com` hoặc `api-support@minimaxi.com`
- **Discord**: https://discord.gg/minimax (nếu có)
- **Documentation**: https://api.minimaxi.com/document
- **Tiếng Trung** (gốc): MINIMAX là công ty Trung Quốc, support tốt nhất bằng tiếng Trung

### Nội dung email support (mẫu):
```
Subject: API Key không hoạt động - Status 1004

Hello MINIMAX Support,

Tôi vừa tạo API key nhưng khi gọi API thì bị lỗi:
- Account email: polomin1994@gmail.com
- API endpoint: https://api.minimaxi.com/v1/text/chatcompletion_v2
- Model: MiniMax-Text-01
- Error: status_code 1004 "login fail: Please carry the API secret key in the 'Authorization' field of the request header"

Tôi đã check:
- Đã login thành công
- Key format: MINIMAX-XXXX-XXXX-XXXX-XXXX
- Authorization header: "Bearer <KEY>"

Vui lòng hỗ trợ activate key hoặc cho biết lý do bị lỗi.

Thanks,
polomin
```

---

## 🎯 SAU KHI CÓ KEY ĐÚNG

Sếp paste key mới vào chat với em, format:
```
MINIMAX_API_KEY = MINIMAX-XXXX-XXXX-XXXX-XXXX
```

Em sẽ:
1. Update `.env.local`
2. Build + deploy
3. Test với sếp
4. 9 agents sẽ dùng MINIMAX (tiếng Việt xuất sắc, 1M context)

> **Trong lúc chờ**: 9 agents vẫn hoạt động bình thường qua **DeepSeek** (auto fallback) ✅

---

## 💡 TẠI SAO KEY CŨ KHÔNG WORK?

| Key sếp paste | Loại | Có dùng được cho chat? |
|---------------|------|------------------------|
| `eyJhbGci...` (JWT) | User auth token | ❌ Không - chỉ để login web |
| `MINIMAX-RV7yRVx5-...` | API key cũ? | ❌ Có thể chưa activate |

**Key đúng cho chat** phải được tạo trong dashboard MINIMAX, sau khi tài khoản **đã activate + đã nạp tiền**.

---

## 📞 SẾP CẦN EM HỖ TRỢ GÌ KHÔNG?

Sếp cứ làm theo hướng dẫn, có gì kẹt em support liền! 🚀
