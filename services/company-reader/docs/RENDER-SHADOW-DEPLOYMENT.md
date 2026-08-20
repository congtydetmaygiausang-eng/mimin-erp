# Triển khai Company Reader shadow trên Render

## Kiến trúc giai đoạn đầu

```text
Internet → HTTPS + Bearer + HMAC → mimin-company-reader (Render web service, Singapore)
Render private network
├── mimin-company-reader-cache (Render Key Value/Valkey, Singapore)
```

Python có URL HTTPS để Supabase Edge Function gọi nhưng từ chối mọi request thiếu
Bearer token, client allowlist và chữ ký HMAC còn hạn 5 phút. Redis chặn toàn bộ
kết nối Internet và chỉ dùng connection string nội bộ. Shadow không trả hồ sơ cho
MIMIN ERP sử dụng. API còn áp dụng Redis fixed-window 60 request/phút cho client
gateway; Render chấm dứt TLS ở ingress.

## Tạo Blueprint

1. Trên Render, tạo Blueprint từ repository `mimin-erp`.
2. Chọn đường dẫn Blueprint `services/company-reader/render.yaml`.
3. Render sẽ yêu cầu nhập `JINA_API_KEY`; nhập ở Dashboard, không dán vào Git.
4. Kiểm tra chi phí trước khi bấm Apply: Blueprint dùng một web service
   `starter` và một Key Value `starter`.
5. Sau deploy, gọi `/healthz` và `/readyz` trên HTTPS URL. Thử request thiếu chữ
   ký phải nhận `INVALID_REQUEST_SIGNATURE` trước khi cấu hình Supabase secrets.

`COMPANY_READER_SERVICE_TOKEN` được Render tạo ngẫu nhiên. Chỉ copy token vào
secret manager của caller nội bộ ở giai đoạn kết nối; không đưa vào Vercel
`NEXT_PUBLIC_*` hoặc trình duyệt.

## Quality gate shadow

Giữ `COMPANY_READER_ROLLOUT_MODE=shadow` và `COMPANY_READER_CANARY_PERCENT=0`.
Thu ít nhất 200 lượt shadow hoặc 7 ngày, tùy điều kiện nào đến sau, rồi đánh giá:

- lỗi pipeline dưới 2%;
- p95 latency dưới 12 giây;
- không có SSRF/security violation;
- cache hit Jina tăng dần, không vượt rate limit thường xuyên;
- hồ sơ `BLOCKED`/mâu thuẫn không được tự dùng;
- không có dữ liệu shadow ghi vào Supabase.

## Canary

Chỉ sau khi có caller nội bộ giữ luồng cũ làm fallback:

1. Chuyển mode `canary`, tỷ lệ `1`; theo dõi tối thiểu 24 giờ.
2. Nếu đạt gate, tăng `5`; tiếp tục tối thiểu 24 giờ.
3. Nếu đạt gate, tăng `10`; tiếp tục tối thiểu 48 giờ.
4. Có bất kỳ lỗi chất lượng/bảo mật nào: đặt `COMPANY_READER_ENABLED=false`.

Không chuyển `live` trước khi review mẫu dữ liệu ở cả ba nấc và có phê duyệt.
