# ECC Gate 5 — Production quality evaluation

## Phạm vi

Gate 5 là cổng **quan sát và chấm điểm**, không phải một tầng lọc mới. Nó nhận
kết quả đã trả về từ Gate 4, ghi nhận nhãn kiểm chứng và tạo báo cáo; không sửa
ứng viên, không thay đổi thứ tự, không gọi API và không ghi dữ liệu ERP.

## Ba kịch bản cố định

| ID | Năng lực | Tâm tìm kiếm | Bán kính |
| --- | --- | --- | ---: |
| `COTTON_HOC_MON_10` | Nhà cung cấp vải cotton | Hóc Môn | 10 km |
| `GARMENT_TAN_PHU_20` | Xưởng may gia công | Tân Phú | 20 km |
| `TEXTILE_BINH_THANH_30` | Công ty dệt may | Bình Thạnh | 30 km |

Không được đổi truy vấn, tâm hoặc bán kính giữa các lần đo. Mỗi ứng viên phải
được đối chiếu nguồn trước khi gán nhãn.

## Ngưỡng nghiệm thu

- Tối thiểu 5 hồ sơ được chấp nhận cho mỗi kịch bản.
- Độ chính xác B2B tối thiểu 90%.
- Tỷ lệ đã xác minh nằm trong bán kính tối thiểu 80%.
- 100% tên phải là danh tính pháp lý/thương mại hợp lệ, không phải tiêu đề bài viết.
- Tỷ lệ trùng tối đa 5%.
- Tối thiểu 70% hồ sơ có cả địa chỉ và số điện thoại kèm chứng cứ.
- Email, mã số thuế và website được báo cáo riêng, chưa dùng làm điều kiện loại.

Nếu mẫu dưới 5 hồ sơ, trạng thái là `INSUFFICIENT_SAMPLE`, không được diễn giải
thành `PASS`. Mọi lý do loại được đếm riêng để Gate 6 tối ưu đúng nút thắt.

## Chu trình TDD

- RED: `npm run test:gate5` thất bại vì chưa có hợp đồng Gate 5.
- GREEN: bộ đánh giá được triển khai độc lập và vượt qua toàn bộ ca kiểm thử.
- Không sửa component, API route, Supabase hoặc logic tìm kiếm production.

