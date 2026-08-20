# MIMIN Company Reader

Python service cô lập để đọc và chuẩn hóa nguồn công khai về doanh nghiệp. Dịch vụ
được phát triển theo từng quality gate và **chưa được nối vào API production** cho
đến khi đạt đủ ngưỡng của golden corpus.

## Trạng thái

| Giai đoạn | Phạm vi | Trạng thái |
|---|---|---|
| JT0 | Data contract, quality gate, golden corpus 50 ca | Hoàn thành |
| JT1 | Safe Fetch Gateway: URL policy, SSRF, redirect, timeout, dung lượng | Hoàn thành |
| JT2 | Trích xuất nội dung sạch và metadata bằng Trafilatura 2.2.0 | Hoàn thành |
| JT3 | Phát hiện ứng viên thông tin công ty kèm đoạn trích và chống ghép chéo | Hoàn thành |
| JT4 | Phân đoạn nhiều công ty, khóa MST và vùng ứng viên chưa phân giải | Hoàn thành |
| JT5 | Đối chiếu liên nguồn bằng MST/domain chính thức và chặn xung đột bắc cầu | Hoàn thành |
| JT6 | Jina Reader fallback có kiểm soát, giới hạn và khóa provenance | Hoàn thành |
| JT7 | Lựa chọn trường chuẩn, đồng thuận nguồn và cổng duyệt xung đột | Hoàn thành |
| JT8 | Cache TTL, rate limit, circuit breaker, request coalescing và metrics an toàn | Hoàn thành |
| JT9 | Dark-launch ASGI API, service auth, request bounds và adapter Redis | Hoàn thành, mặc định tắt |
| JT10 | Production fail-closed, client allowlist, Redis injection, shadow/canary/live | Hoàn thành, chưa kích hoạt |
| Hạ tầng shadow | Container production, Redis readiness, Render private Blueprint | Đã chuẩn bị, chưa tạo tài nguyên |
| JT11+ | Caller nội bộ, shadow telemetry và tích hợp MIMIN ERP | Chưa kích hoạt |

JT1 chỉ tải nội dung; không đoán dữ liệu doanh nghiệp, không ghi Supabase và không
thay đổi kết quả tìm kiếm hiện tại của MIMIN ERP.

JT4 tiếp tục chạy cô lập. Giai đoạn này chỉ tách ứng viên JT3 theo từng doanh
nghiệp và bảo toàn provenance; chưa ghi hoặc thay đổi dữ liệu production.

JT5 chỉ đối chiếu các thực thể JT4 trong bộ nhớ. Mã số thuế mâu thuẫn luôn chặn
gộp; điện thoại chỉ tạo đề xuất duyệt và không phải khóa tự động.

JT6 chỉ dùng Jina khi fetch/extraction chính thất bại theo allowlist. Nội dung
Trafilatura đủ tốt không bị thay thế, và API production vẫn chưa gọi lớp này.

JT7 tạo hồ sơ chuẩn có giải thích nhưng trạng thái cao nhất vẫn là chờ con người
duyệt. Không có dữ liệu nào được tự động xuất bản hoặc ghi vào production.

JT8 thêm hàng rào vận hành trong bộ nhớ quanh Jina. Đây chưa phải rate limit phân
tán và chưa được nối vào request path hiện tại của MIMIN ERP.

JT9 đóng gói pipeline thành service API nội bộ nhưng giữ feature flag mặc định
tắt. Adapter Redis được cung cấp theo dependency injection; JT9 không tự kết nối
hạ tầng, không bật CORS, không ghi Supabase và chưa nối vào MIMIN ERP. Xem
[`docs/JT9-DARK-LAUNCH-SERVICE.md`](docs/JT9-DARK-LAUNCH-SERVICE.md).

JT10 thêm readiness, allowlist caller, chế độ shadow/canary/live xác định và bắt
buộc Redis injection khi khai báo production. Không có kết nối hạ tầng hoặc đường
gọi frontend nào được tự bật. Xem
[`docs/JT10-PRODUCTION-CANARY.md`](docs/JT10-PRODUCTION-CANARY.md).

Nền tảng triển khai shadow dùng container Python không đặc quyền, Render private
service và Render Key Value/Valkey cùng vùng Singapore. Redis phải kết nối thành
công thì `/readyz` mới trả thành công. Blueprint giữ rollout ở `shadow/0%`, không
có public URL và chưa nối vào MIMIN ERP. Xem
[`docs/RENDER-SHADOW-DEPLOYMENT.md`](docs/RENDER-SHADOW-DEPLOYMENT.md).

Có thể chạy shadow trước trên máy cá nhân bằng Python hoặc Docker Compose. Bản
Docker ghép Company Reader với Valkey, chỉ publish API vào `127.0.0.1` và vẫn giữ
rollout `shadow/0%`. Xem [`docs/LOCAL-SHADOW.md`](docs/LOCAL-SHADOW.md).

## Chạy kiểm thử

```powershell
python -m unittest discover -s services/company-reader/tests -p "test_*.py" -v
python services/company-reader/tests/validate_golden.py
```

Không có kiểm thử nào truy cập Internet.
