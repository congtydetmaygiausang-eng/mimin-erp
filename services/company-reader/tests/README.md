# JT0 - Golden dataset cho Company Reader

Thư mục này chỉ chứa hợp đồng dữ liệu và dữ liệu kiểm thử. Không được import vào
runtime của MIMIN ERP và không được ghi vào các bảng danh mục chính thức.

## Mục tiêu

- Khóa cấu trúc input/output trước khi xây Python reader.
- Ngăn lấy nhầm bài viết, danh bạ hoặc doanh nghiệp liên quan thành một công ty.
- Bắt buộc mọi trường kỳ vọng phải có bằng chứng nguồn.
- Tạo mốc chất lượng để so sánh JT1-JT12.

## Thành phần

- `schemas/golden-case.schema.json`: JSON Schema cho một test case.
- `schemas/fetch-evidence.schema.json`: hợp đồng đầu ra Safe Fetch của JT1.
- `schemas/extracted-document.schema.json`: hợp đồng nội dung sạch của JT2.
- `fixtures/golden-cases.json`: 50 URL/ca kiểm thử đã phân nhóm.
- `validate_golden.py`: validator không cần package bên ngoài.
- `test_url_policy.py`, `test_fetcher.py`: kiểm thử JT1 hoàn toàn offline.
- `test_extractor.py`: kiểm thử adapter Trafilatura bằng HTML nội bộ.
- `QUALITY-GATE.md`: ngưỡng chất lượng và quy trình duyệt fixture.

## Chạy kiểm tra

```powershell
python services/company-reader/tests/validate_golden.py
```

Validator chỉ kiểm tra tính toàn vẹn của corpus, không tự truy cập Internet. Việc
chụp HTML và duyệt giá trị kỳ vọng phải được thực hiện có chủ đích để kết quả test
không thay đổi theo website bên ngoài.

## Quy tắc cập nhật

1. Không sửa giá trị kỳ vọng chỉ để làm test pass.
2. Khi nguồn thay đổi, lưu bằng chứng mới rồi ghi rõ `reviewNote`.
3. Không thêm dữ liệu đoán; trường chưa xác minh để `null` hoặc bỏ khỏi `fields`.
4. Test case `COMPANY` phải có ít nhất một khóa mạnh: MST, website chính thức hoặc điện thoại.
5. Test case bị chặn/rác không được chứa trường công ty được coi là đã xác minh.
