# JT2 - Trích xuất nội dung sạch bằng Trafilatura

## Phạm vi

JT2 nhận duy nhất `FetchEvidence(status=OK)` từ JT1 và tách nội dung chính cùng
metadata mô tả. JT2 không tự tải URL, không crawl link, không gọi Jina, không ghi
database và không xác minh tên pháp lý/MST/địa chỉ.

## Cấu hình chính xác

- Trafilatura được khóa ở phiên bản `2.2.0`.
- `favor_precision=True`: ưu tiên bỏ menu, footer, quảng cáo và văn bản lặp.
- `with_metadata=True`, `include_comments=False`, `include_links=False`.
- Giữ bảng vì website doanh nghiệp thường trình bày liên hệ/pháp lý bằng bảng.
- Deduplicate nội dung lặp trong cùng tài liệu.
- Tối đa 200.000 ký tự đầu ra; luôn ghi cờ `truncated` nếu cắt.
- Không dùng `trafilatura.fetch_url()`: mọi kết nối bắt buộc qua JT1.

## Ranh giới dữ liệu

`title`, `author`, `description`, `date`, `language` chỉ là metadata nguồn và chưa
được coi là thông tin công ty đã xác minh. JT3+ phải gắn bằng chứng theo từng trường
và đối chiếu khóa mạnh trước khi tạo hồ sơ.

Nếu thư viện thiếu, đầu vào không hợp lệ, kết quả rỗng hoặc parser lỗi, JT2 trả mã
trạng thái rõ ràng và không tự bịa nội dung fallback.

