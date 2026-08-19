# JT4 - Phân đoạn thực thể doanh nghiệp

JT4 nhận duy nhất tài liệu sạch JT2 và tập ứng viên có chứng cứ JT3. Lớp này
không tải mạng, không gọi AI/Jina, không chọn giá trị cuối và không ghi Supabase.

## Quy tắc an toàn

- URL nguồn và `text_sha256` của JT2/JT3 phải khớp tuyệt đối; sai provenance thì
  toàn bộ ứng viên chuyển sang `INPUT_MISMATCH`.
- Tên pháp lý và mã số thuế có vị trí trong nội dung là neo phân đoạn.
- Hai tên pháp lý khác nhau hoặc hai mã số thuế khác nhau luôn tách thành hai
  thực thể, dù nằm gần nhau.
- Mã số thuế là khóa mạnh duy nhất ở JT4. Website, email và điện thoại chỉ là
  thuộc tính hỗ trợ; chưa được dùng để tự động gộp doanh nghiệp.
- Metadata không có vị trí chỉ được gán khi trang có một thực thể, hoặc tên pháp
  lý khớp chính xác duy nhất. Trường hợp còn lại giữ ở `unresolved_candidates`.
- Mỗi ứng viên đầu vào phải xuất hiện đúng một lần: trong một thực thể hoặc vùng
  chưa phân giải. JT4 tuyệt đối không làm mất hoặc nhân đôi chứng cứ.

## Đầu ra

Mỗi thực thể có ID ổn định, khoảng ký tự, tên/MST riêng, danh sách ứng viên và
trạng thái `STRONG_IDENTITY`, `WEAK_IDENTITY` hoặc `REVIEW_REQUIRED`. Hợp đồng
JSON nằm tại `tests/schemas/entity-segmentation-result.schema.json`.
