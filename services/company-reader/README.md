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
| JT5+ | Đối chiếu khóa mạnh, Jina fallback và tích hợp production | Chưa kích hoạt |

JT1 chỉ tải nội dung; không đoán dữ liệu doanh nghiệp, không ghi Supabase và không
thay đổi kết quả tìm kiếm hiện tại của MIMIN ERP.

JT4 tiếp tục chạy cô lập. Giai đoạn này chỉ tách ứng viên JT3 theo từng doanh
nghiệp và bảo toàn provenance; chưa ghi hoặc thay đổi dữ liệu production.

## Chạy kiểm thử

```powershell
python -m unittest discover -s services/company-reader/tests -p "test_*.py" -v
python services/company-reader/tests/validate_golden.py
```

Không có kiểm thử nào truy cập Internet.
