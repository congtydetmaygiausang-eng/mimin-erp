# JT10 — Production boundary và canary an toàn

## Phạm vi

JT10 bổ sung lớp kiểm soát để chuẩn bị chạy Company Reader nhiều instance. Không
thêm API route vào Next.js, không gọi từ trình duyệt, không ghi Supabase và không
thay đổi kết quả tìm kiếm hiện tại.

## Hàng rào bắt buộc

- Production chỉ khởi động khi `COMPANY_READER_GUARDRAIL_MODE=redis` và tiến trình
  đã inject một Redis client dùng chung.
- Mọi request cần Bearer token và `X-Mimin-Client` nằm trong allowlist.
- Private ingress/TLS/mTLS phải được cấu hình ở load balancer; header allowlist
  không thay thế network isolation.
- `/healthz` chỉ báo tiến trình; `/readyz` trả 200 duy nhất khi feature đã bật và
  cấu hình hợp lệ.
- Không lưu URL, token hay nội dung công ty trong metric/key Redis. Cache và rate
  limit chỉ dùng SHA-256 opaque key.

## Ba chế độ rollout

1. `shadow`: chạy pipeline để đo chất lượng nhưng response chỉ có số lượng, tuyệt
   đối không trả hồ sơ cho ứng dụng sử dụng.
2. `canary`: chọn ổn định theo hash `request_id`; ngoài tỷ lệ trả
   `CANARY_NOT_SELECTED`, caller tiếp tục luồng cũ.
3. `live`: trả toàn bộ hồ sơ. Chỉ dùng sau khi shadow/canary đạt quality gate và
   được review.

Thay đổi tỷ lệ theo thứ tự 0% → 1% → 5% → 10% → 25% → 50% → 100%. Mỗi nấc cần
theo dõi lỗi, latency, tỷ lệ hồ sơ review/blocked và chi phí Jina trước khi tăng.

## Rollback

1. Đặt `COMPANY_READER_ENABLED=false` để readiness rớt và ngừng nhận việc.
2. Caller luôn giữ luồng tìm kiếm cũ; không phụ thuộc Company Reader để hoàn tất.
3. Không xóa Redis khi rollback; giữ TTL tự hết để phục vụ điều tra.
4. Không tự động áp dụng shadow/canary output vào dữ liệu chính thức.

JT10 mới cung cấp code boundary và dependency injection. Việc tạo Redis thật,
private network, secret manager và cấu hình load balancer thuộc bước triển khai hạ
tầng sau review, không được hard-code trong repository.
