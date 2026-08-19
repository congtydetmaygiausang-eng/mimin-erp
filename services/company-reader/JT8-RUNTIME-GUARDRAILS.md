# JT8 - Cache, rate limit, circuit breaker và observability

JT8 bọc Jina Reader JT6 bằng các hàng rào vận hành trong bộ nhớ. Lớp này vẫn
đứng ngoài API production và không ghi Supabase.

## Cấu hình mặc định

- Cache LRU tối đa 1.000 URL hash; kết quả tốt 24 giờ, lỗi tạm thời 60 giây.
- Cache key là SHA-256 của URL đã chuẩn hóa; không lưu API key/caller trong key.
- Rate limit 20 request/60 giây cho mỗi caller đã hash, chỉ tính cache miss.
- Circuit breaker mở sau 3 lỗi tạm thời liên tiếp và thử lại sau 60 giây.
- Các request đồng thời cùng URL được coalescing để chỉ gọi provider một lần.
- URL không an toàn bị chặn trước cache/rate/provider.
- Metrics chỉ có counter allowlist, không chứa URL, query, caller hay API key.

## Ranh giới triển khai

Cache và rate limit JT8 là in-process, phù hợp kiểm thử/worker đơn. Khi nối nhiều
instance production phải thay bằng Redis hoặc kho phân tán có atomic increment;
không được coi counter trong RAM là hạn mức toàn hệ thống.
