# MIMIN ERP → Company Reader

Luồng an toàn: `MIMIN ERP (Vercel) → Supabase Edge Function → Company Reader (Render) → Trafilatura`.

- Mặc định `NEXT_PUBLIC_COMPANY_READER_SHADOW_ENABLED=false`, không đổi luồng tìm kiếm hiện tại.
- Shadow chỉ gửi tối đa 5 URL HTTPS đã có từ kết quả tìm kiếm.
- Token chỉ nằm trong Supabase secret và Render secret, không nằm trong trình duyệt.

Supabase secrets: `COMPANY_READER_BASE_URL` và `COMPANY_READER_SERVICE_TOKEN`.
Company Reader phải cho phép client `mimin-supabase-gateway` và chạy rollout `shadow` trước.

Sau khi deploy Edge Function với JWT verification, bật `NEXT_PUBLIC_COMPANY_READER_SHADOW_ENABLED=true` trên Vercel Preview. Chip `Trafilatura shadow` trong chẩn đoán nguồn cho biết kết nối thành công hay lỗi.
