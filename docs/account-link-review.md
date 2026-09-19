# Kiểm kê liên kết tài khoản — giai đoạn giao diện

## Hiện trạng xác định từ code

- `users.id` là ID tài khoản; API quản trị sẵn có dùng ID này để cập nhật.
- `users.maNV` liên kết với `nhan_su.ma_nv`; chưa đổi sang một khóa mới.
- Trang phân quyền trước đây khởi tạo danh sách tài khoản viết sẵn và đổi vai trò trực tiếp theo email. Nay tải từ API quản trị và cập nhật qua API bằng ID, cùng luồng với màn hình tài khoản.
- Đăng nhập, session-provider, policy, schema và dữ liệu sản xuất không được thay đổi trong giai đoạn này.

## Giao diện mới

- Đọc tài khoản từ API quản trị và hồ sơ nhân sự trực tiếp từ nguồn dữ liệu, không dùng danh sách nhân viên mẫu trong bộ nhớ đệm để quyết định liên kết.
- Phân loại liên kết hợp lệ, chưa liên kết, trùng tài khoản, trùng mã nhân viên và thiếu hồ sơ.
- Chỉ chọn hồ sơ đang tồn tại có mã duy nhất và chưa gắn với tài khoản khác.
- Trước khi lưu: tải lại hai nguồn, kiểm tra liên kết hiện tại có bị người khác đổi không, rồi kiểm tra trùng.
- Chỉ gửi `maNV` khi lưu liên kết; đọc lại tài khoản để xác nhận kết quả. Không tạo nhân viên, đổi ID, đổi vai trò hoặc xóa hồ sơ trong thao tác này.
- Xem quyền theo vai trò dùng ma trận hiện hành; đây không phải kiểm toán RLS hay phạm vi dữ liệu từng đơn hàng.

## Kiểm chứng và giới hạn

- `node scripts/test-account-link-review.cjs`: 11 kiểm tra qua; chỉ dữ liệu trong bộ nhớ.
- Kiểm thử browser: trang liên kết và bảng xem quyền hiển thị; đổi lựa chọn vai trò hoạt động. Phiên hiện tại hết hạn, màn hình báo lỗi và khóa liên kết.
- Chưa kiểm kê số lượng liên kết thật hoặc thử lưu trên tài khoản thử vì chưa có phiên quản trị hợp lệ. Không kết luận dữ liệu thật đã sạch.
- TypeScript toàn repo còn lỗi ở các module ngoài thay đổi này, bao gồm sản xuất, kho và sync-helper; chưa thể chứng nhận build toàn dự án.
- Kiểm tra ở client không bảo đảm chống hai quản trị viên ghi đồng thời. Sau kiểm kê cần thiết kế ràng buộc duy nhất/transaction ở nguồn dữ liệu; chưa tự thêm migration.
- API cập nhật vai trò hiện có ghi `users` và Auth metadata thành hai bước; chưa có giao dịch nguyên tử hay kiểm tra đầy đủ lỗi đồng bộ Auth. Giai đoạn này tái sử dụng API, không sửa cơ chế đăng nhập.
- API danh sách tài khoản hiện có có thể chịu giới hạn số dòng của backend. Cần kiểm tra tổng số tài khoản khi kiểm kê thực tế trước khi coi danh sách là đầy đủ.
- Liên kết nhân sự chỉ bao phủ `maNV`. Đối tác/NCC không có `maNV` cần kiểm kê quan hệ riêng, không tự ghép theo tên/email.

## Bước xác nhận tiếp theo

Đăng nhập local bằng quản trị viên hợp lệ, tải kiểm kê, rà các dòng bất thường và đối chiếu số lượng với nguồn. Thử lưu trên tài khoản thử đã được chỉ định trước khi áp dụng cho nhân viên thật. Không sửa bảng hoặc xóa dữ liệu để làm cho kiểm kê hết cảnh báo.
