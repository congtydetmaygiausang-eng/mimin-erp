# MIMIN AI Sourcing

1. Mở `chrome://extensions`, bật **Chế độ dành cho nhà phát triển**.
2. Chọn **Tải tiện ích đã giải nén** và chọn thư mục này.
3. Yêu cầu ChatGPT, Gemini hoặc DeepSeek trả về JSON theo mẫu bên dưới.
4. Bôi chọn khối JSON và nhấn **Gửi sang MIMIN**.
5. Đăng nhập MIMIN, kiểm tra bản xem trước rồi mới lưu vào vùng chờ.

```json
[{"legalName":"Tên công ty","address":"Địa chỉ","province":"Tỉnh thành","district":"Quận huyện","phone":"Số điện thoại","website":"https://...","latitude":10.8,"longitude":106.6}]
```

Extension không chứa khóa API/Supabase, không tự động đọc hội thoại và không tự duyệt đối tác.
