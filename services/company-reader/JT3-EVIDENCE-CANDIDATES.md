# JT3 - Ứng viên dữ liệu có bằng chứng

## Mục tiêu

JT3 phát hiện ứng viên tên doanh nghiệp, MST, địa chỉ, điện thoại, email, website
và phần giới thiệu từ `ExtractedDocument(status=OK)`. Mọi ứng viên đều giữ:

- giá trị gốc và giá trị chuẩn hóa;
- URL nguồn và SHA-256 của nội dung JT2;
- đoạn trích, vị trí bắt đầu/kết thúc và loại nguồn;
- điểm tin cậy phát hiện cùng cảnh báo.

## Nguyên tắc chống ghép nhầm

- Điện thoại chỉ lấy trong dòng có nhãn liên hệ hợp lệ.
- Chuỗi MST bị loại khỏi danh sách điện thoại.
- Địa chỉ phải có nhãn và cấu trúc bưu chính; văn xuôi không được nhận là địa chỉ.
- Tên bài viết kiểu “Top 10”, “Danh sách công ty”, tuyển dụng hoặc hướng dẫn bị loại.
- Từ hai MST hoặc nhiều tên công ty độc lập, tài liệu chuyển thành
  `MULTI_ENTITY_REVIEW`; không được tự tạo một hồ sơ tổng hợp.
- JT3 chỉ tạo **candidate**, chưa xác minh và chưa ghi Supabase.

## Ranh giới

JT4+ mới thực hiện phân đoạn nhiều doanh nghiệp, đối chiếu khóa mạnh và lựa chọn
giá trị theo từng trường. DeepSeek chỉ được dùng sau lớp bằng chứng này và không
được phép tạo giá trị không tồn tại trong đoạn trích nguồn.

