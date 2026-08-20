# JT7 - Lựa chọn trường chuẩn theo bằng chứng

JT7 nhận từng nhóm doanh nghiệp JT5 và tạo hồ sơ chuẩn để **con người duyệt**.
Giai đoạn này không tự xuất bản, không ghi Supabase và không làm mất ứng viên.

## Quy tắc

- Nguồn độc lập được đếm theo hostname; nhiều URL trên cùng website chỉ tính một.
- Tên pháp lý, MST và địa chỉ có từ hai giá trị cùng vượt ngưỡng thì báo xung đột,
  không chọn bên thắng.
- MST xung đột làm hồ sơ `BLOCKED`.
- Điện thoại, email và website được phép có nhiều giá trị: chọn giá trị có bằng
  chứng cao nhất để hiển thị, giữ toàn bộ giá trị khác và bắt buộc duyệt.
- Giới thiệu công ty luôn cần con người duyệt, kể cả lấy từ website chính thức.
- Metadata chưa kiểm chứng bị trừ điểm; dữ liệu dưới ngưỡng không được chọn.
- Nguồn chính thức, bằng chứng trong nội dung chính và đồng thuận đa nguồn được
  cộng điểm có giới hạn. Không có trường nào được tạo mới từ suy luận.
- Trạng thái tốt nhất là `READY_FOR_REVIEW`, không có trạng thái tự động duyệt.

Mọi quyết định chứa giá trị chuẩn hóa, độ tin cậy, số nguồn độc lập, đoạn chứng cứ,
phương án thay thế và lý do để giao diện sau này giải thích được.
