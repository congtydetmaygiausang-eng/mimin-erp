# JT0 Quality Gate

## Phân nhóm corpus

| Nhóm | Số ca | Mục đích |
|---|---:|---|
| `REGISTRY_PROFILE` | 10 | Hồ sơ đăng ký/MaSoThue có danh tính rõ |
| `OFFICIAL_WEBSITE` | 10 | Website doanh nghiệp và trang liên hệ |
| `MULTI_COMPANY_SOURCE` | 5 | Trang danh sách; không được coi cả trang là một công ty |
| `NOISE_OR_BLOCKED` | 10 | Tuyển dụng, rao vặt, nội dung không phải doanh nghiệp |
| `CONFLICT_OR_PARTIAL` | 10 | Nguồn thiếu hoặc mâu thuẫn cần giữ bằng chứng |
| `FETCH_LIMITED` | 5 | Đăng nhập/chặn/không đủ nội dung; phải fallback an toàn |

Tổng: **50 ca**.

## Ngưỡng bắt buộc trước production

| Chỉ số | Ngưỡng |
|---|---:|
| Tên pháp lý đúng trên ca có ground truth | >= 95% |
| Mã số thuế đúng | >= 99% |
| Địa chỉ bưu chính đúng, không lẫn văn xuôi | >= 92% |
| Không lấy nhầm doanh nghiệp liên quan | >= 98% |
| Không sinh số điện thoại giả | 100% |
| Trường được xác minh có URL + excerpt | 100% |
| Ca rác/chặn không tạo hồ sơ chính thức | 100% |

## Quy trình duyệt

1. Lưu snapshot HTML hợp pháp hoặc đoạn trích nguồn.
2. Hai lần đọc độc lập cho trường nhạy cảm: tên pháp lý, MST, địa chỉ.
3. Ghi `reviewedAt`, `reviewedBy`, `reviewNote`.
4. Chạy validator.
5. Chỉ đánh dấu `APPROVED` khi không còn placeholder và có khóa mạnh.

## Cổng an toàn

- Corpus không chạy trong build production.
- Không có API key, cookie hoặc token trong fixture.
- Không chứa dữ liệu nhân sự nội bộ MIMIN.
- Không tự động crawl khi chạy validator.
- Kết quả `REJECT`, `MULTI_COMPANY_SOURCE` và `FETCH_LIMITED` không được chuyển thành hồ sơ công ty.

