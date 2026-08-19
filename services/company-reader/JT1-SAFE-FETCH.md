# JT1 - Safe Fetch Gateway

## Trách nhiệm duy nhất

Nhận một URL HTTPS công khai, tải tối đa một tài liệu văn bản có giới hạn và trả
về `FetchEvidence`. JT1 không trích xuất thông tin công ty và không quyết định một
nguồn có đáng tin hay không.

## Hàng rào bắt buộc

- Chỉ HTTPS, port 443; cấm credentials trong URL.
- Cấm localhost, hostname nội bộ và toàn bộ IP không public.
- Kiểm tra **tất cả** IP DNS trả về; chỉ một IP private cũng phải chặn.
- Tự xử lý tối đa 3 redirect và xác minh lại URL + DNS ở từng hop.
- Timeout mặc định 12 giây, body tối đa 2 MB.
- Chỉ nhận HTML, XHTML hoặc plain text; không tải ảnh/PDF/file nhị phân.
- Không gửi cookie, API key, Supabase token hay header từ request người dùng.
- Không log nội dung toàn trang; bằng chứng dùng SHA-256, kích thước và header allowlist.
- Không tự retry để tránh nhân chi phí và gây tải cho website nguồn.

## Trạng thái đầu ra

| Trạng thái | Ý nghĩa | Xử lý giai đoạn sau |
|---|---|---|
| `OK` | Đọc được tài liệu hợp lệ | Cho phép JT2 trích xuất |
| `BLOCKED` | URL/DNS/redirect không an toàn | Dừng, không fallback |
| `HTTP_ERROR` | Nguồn trả 4xx/5xx | JT2+ có thể chọn provider khác |
| `TIMEOUT` | Quá thời gian | Có thể fallback có kiểm soát |
| `TOO_LARGE` | Vượt 2 MB | Không đọc tiếp |
| `UNSUPPORTED_CONTENT` | Không phải văn bản web | Chuyển pipeline tài liệu riêng |
| `NETWORK_ERROR` | DNS/TLS/kết nối lỗi | Có thể fallback có kiểm soát |

## Điều kiện nối production

JT1 vẫn đứng ngoài `apps/web`. Chỉ được nối sau khi JT2/JT3 có bộ trích xuất,
bằng chứng theo trường, rate limit, cache và xác thực service-to-service.

