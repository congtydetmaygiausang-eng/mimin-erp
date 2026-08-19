# JT6 - Jina Reader fallback có kiểm soát

JT6 chỉ gọi `https://r.jina.ai` khi JT1 gặp HTTP error, timeout, network error;
hoặc JT2 không trích được nội dung/thiếu thư viện/nội dung quá yếu. Một kết quả
Trafilatura đủ tốt luôn được giữ nguyên và Jina không được gọi.

## Hàng rào

- URL đích phải vượt qua URL/DNS/SSRF policy JT1 trước khi gửi tới Jina.
- Không fallback cho URL bị chặn, nội dung quá lớn hoặc loại file không hỗ trợ.
- Không retry tự động; timeout 20 giây, phản hồi tối đa 2 MB, nội dung tối đa
  200.000 ký tự.
- Dùng JSON response và yêu cầu markdown. URL Jina trả về phải khớp URL đã duyệt;
  nếu khác thì loại để tránh sai provenance.
- API key chỉ nằm trong header `Authorization`; không xuất hiện trong model,
  log, lỗi hoặc JSON audit.
- Nội dung Jina được hash SHA-256 và chuyển về cùng `ExtractedDocument` để JT3–JT5
  xử lý như mọi nguồn khác. Jina không được quyền xác minh trường dữ liệu.
- Nếu Jina lỗi hoặc nội dung yếu, giữ nguyên thất bại ban đầu; không bịa fallback.

JT6 vẫn là thư viện cô lập và chưa được gọi từ API production.
