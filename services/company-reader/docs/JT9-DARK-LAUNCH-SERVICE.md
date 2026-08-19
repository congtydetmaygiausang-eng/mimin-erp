# JT9 — Dark-launch Company Reader API

## Mục tiêu và ranh giới

JT9 đóng gói pipeline JT1–JT8 thành một ASGI service nội bộ để kiểm thử có kiểm
soát. Service **mặc định tắt**, không được trình duyệt gọi trực tiếp, không có CORS,
không ghi Supabase và chưa thay đổi luồng tìm công ty hiện tại của MIMIN ERP.

## Hợp đồng

- `GET /healthz`: trạng thái tiến trình, không tiết lộ secret.
- `POST /v1/company-reader/read`: tối đa 5 URL, body tối đa 16 KiB.
- Bắt buộc `Authorization: Bearer <service-token>` và `Content-Type: application/json`.
- `request_id`: 8–64 ký tự chữ, số, `_` hoặc `-`; dùng để truy vết, không chứa PII.
- Một nguồn lỗi không làm hỏng cả batch; lỗi chỉ trả mã phân loại, không trả stack trace.

```json
{
  "request_id": "sourcing_20260819_001",
  "urls": ["https://example.com/company"]
}
```

## Bật dark launch cục bộ

1. Sao chép `config.example.env` thành file môi trường riêng và tạo token ngẫu
   nhiên dài ít nhất 32 ký tự.
2. Đặt `COMPANY_READER_ENABLED=true`.
3. Chỉ với một instance kiểm thử, đặt
   `COMPANY_READER_ALLOW_MEMORY_GUARDRAILS=true`.
4. Chạy bằng ASGI server đã được đội vận hành phê duyệt, entrypoint:
   `company_reader.app:app`.

Không đưa token vào `NEXT_PUBLIC_*`, log, Git hoặc response. Khi chạy nhiều
instance, phải inject `RedisEvidenceCache` và `RedisFixedWindowRateLimiter`; adapter
JT9 không tự tạo kết nối Redis để tránh âm thầm dùng sai hạ tầng.

## Điều kiện trước khi nối production

- Test golden corpus và toàn bộ unit test đạt 100%.
- Có TLS, private ingress/service-to-service auth và secret rotation.
- Có Redis dùng chung, timeout/retry/alert, dashboard metrics và runbook rollback.
- Canary theo tỷ lệ nhỏ; so sánh shadow output, không tự ghi hồ sơ chính thức.
- Chỉ bật đường gọi từ server sau review bảo mật và review dữ liệu.

Rollback tức thời bằng `COMPANY_READER_ENABLED=false`; MIMIN ERP hiện tại không bị
ảnh hưởng vì JT9 chưa được nối vào request path của ứng dụng.
