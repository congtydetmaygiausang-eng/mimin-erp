# JT5 - Đối chiếu thực thể bằng khóa mạnh

JT5 nhận các phân đoạn JT4 từ nhiều URL và tạo nhóm doanh nghiệp liên nguồn.
Giai đoạn này không tải mạng, không gọi AI/Jina, không lựa chọn giá trị cuối và
không ghi Supabase.

## Ma trận quyết định

| Điều kiện | Quyết định |
|---|---|
| MST trùng chính xác | Tự động gộp |
| Domain chính thức trùng, không có MST mâu thuẫn | Tự động gộp |
| Điện thoại trùng + tên hoặc địa chỉ trùng | Chờ duyệt |
| Hai MST khác nhau | Chặn gộp tuyệt đối |
| Không có khóa mạnh chung | Giữ độc lập |

Domain chỉ được coi là chính thức khi website trong hồ sơ trùng hostname của URL
nguồn. Danh bạ, mạng xã hội và trang tổng hợp như masothue.com không bao giờ được
dùng làm khóa domain chính thức.

## Bảo vệ xung đột bắc cầu

Trước mỗi phép hợp nhất, JT5 kiểm tra toàn bộ MST đã có trong hai nhóm. Vì vậy,
một hồ sơ không có MST không thể làm cầu nối hai doanh nghiệp có MST khác nhau.
Mọi thực thể và ứng viên chưa phân giải từ JT4 đều được bảo toàn trong kết quả.
