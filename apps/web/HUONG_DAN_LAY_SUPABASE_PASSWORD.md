# 🔐 Hướng dẫn lấy Supabase DATABASE_URL (để apply schema tự động)

> Em không thể tự ý chạy SQL Editor vì cần password database.  
> Anh Sang làm theo 4 bước dưới, copy URL paste vào file, em sẽ chạy tự động.

## 📋 4 bước

### Bước 1: Mở Supabase Dashboard
- Link: https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/settings/database
- Login bằng tài khoản đã tạo project `nftlwdcsmlpeiazhuoho`

### Bước 2: Lấy/Cập nhật Database Password
- Kéo xuống mục **"Database password"**
- Nếu CHƯA CÓ hoặc QUÊN: click nút **"Reset database password"** → confirm
  - Supabase sẽ tạo password mới và hiển thị 1 lần
  - **COPY PASSWORD MỚI** này ngay (chỉ hiện 1 lần duy nhất)
- Nếu ĐÃ BIẾT password: bỏ qua bước này

### Bước 3: Copy Connection String
- Trong cùng trang Settings → Database
- Mục **"Connection string"** → tab **"URI"** (mặc định)
- Sẽ thấy connection string dạng:
  ```
  postgresql://postgres.nftlwdcsmlpeiazhuoho:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
  ```
- Click icon **copy** để copy toàn bộ
- **HOẶC** tự ghép: lấy password ở bước 2 thay vào `[YOUR-PASSWORD]`

### Bước 4: Paste vào file `.env.local`
Mở file `D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\.env.local`

Thêm dòng này vào cuối file:
```
DATABASE_URL=postgresql://postgres.nftlwdcsmlpeiazhuoho:PASSWORD_CO_DA_COPY@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**Lưu ý**:
- Thay `PASSWORD_CO_DA_COPY` bằng password thật từ bước 2
- KHÔNG có khoảng trắng
- Nếu password có ký tự đặc biệt (như `@`, `#`, `$`), cần URL-encode:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`

**Ví dụ**:
```
DATABASE_URL=postgresql://postgres.nftlwdcsmlpeiazhuoho:MySecurePass123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

## ✅ Xong! Báo cho Mavis

Sau khi paste xong, báo "OK" cho Mavis. Em sẽ chạy:
```bash
cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
node apply-schema.mjs
```

Script sẽ:
1. Kết nối Supabase
2. Apply `schema.sql` (10 bảng chính)
3. Apply `advanced-schema.sql` (audit_logs + RLS + 2FA)
4. Verify tables đã tạo

Nếu lỗi password, em sẽ báo và anh Sang reset lại.

## 🔒 Bảo mật

- File `.env.local` đã có trong `.gitignore` → KHÔNG bị commit lên GitHub
- Password KHÔNG được lưu vào memory Mavis
- Sau khi schema apply xong, anh Sang có thể xoá DATABASE_URL khỏi `.env.local` nếu muốn (chỉ cần khi chạy script này)

## ❓ Câu hỏi thường gặp

**Q: Tôi quên password database?**  
A: Bước 2 → Reset database password. Supabase sẽ tạo password mới.

**Q: Connection string có 2 loại (Direct vs Pooler)?**  
A: Dùng **Pooler** (port 6543) - an toàn hơn cho môi trường có IP động như máy nhà.

**Q: Sao không dùng SQL Editor trực tiếp?**  
A: Em không thể truy cập Dashboard của anh Sang. Cách này (pg client) em tự chạy được sau khi có password.

**Q: Sau khi apply xong, NV nhập liệu trên app có sync Supabase không?**  
A: CHƯA. Em cần refactor 9 stores hiện tại (đang dùng localStorage) sang dùng Supabase. Đó là bước tiếp theo (~3-5 đợt).
