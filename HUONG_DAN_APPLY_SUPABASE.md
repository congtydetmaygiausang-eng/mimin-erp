# 🚀 HƯỚNG DẪN APPLY SUPABASE MIGRATIONS

> Tác giả: Trợ lý sếp Sang  
> Phiên bản: v89.6.8  
> Mục đích: Apply 10 bảng + 18 index + 12 RLS policies lên Supabase project `nftlwdcsmlpeiazhuoho`

---

## ✅ YÊU CẦU TRƯỚC

- File `apps/web/.env.local` đã có 9 keys (xem `HUONG_DAN_SUPABASE_TUNG_BUOC.md`)
- Node.js 18+ đã cài
- Đã mở project ở `D:\MIMIN-ERP-app-moi\`

---

## 🎯 CÁCH 1: Supabase SQL Editor (KHUYẾN NGHỊ - 1 phút)

Đơn giản nhất, không cần cài gì thêm.

### Bước 1: Mở SQL Editor
```
https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/sql/new
```

### Bước 2: Apply Schema (001)
1. Mở file `D:\MIMIN-ERP-app-moi\supabase-migrations\001_init_schema.sql`
2. Copy toàn bộ (Ctrl+A → Ctrl+C)
3. Paste vào SQL Editor
4. Click **Run** (hoặc Ctrl+Enter)
5. Đợi ~10-30s → Bảng "Success. No rows returned"

### Bước 3: Apply RLS (003)
1. Mở file `D:\MIMIN-ERP-app-moi\supabase-migrations\003_enable_rls.sql`
2. Copy toàn bộ → Paste vào SQL Editor
3. Click **Run**
4. Đợi → Bảng thông báo "RLS enabled trên 10 bảng"

### Bước 4: Verify
Mở PowerShell/Git Bash tại thư mục project:
```bash
cd D:\MIMIN-ERP-app-moi
node verify-supabase.js
```

Kỳ vọng output:
```
🔍 MIMIN ERP - Verify Supabase Schema
📊 TABLES CHECK
   ✅ users                          0 rows
   ✅ tasks                          0 rows
   ...
   ✅ lenh_sx_tong                   0 rows
   10/10 tables OK, 0 total rows
🎉 SCHEMA READY! 10/10 tables + P0/P1 fields OK
```

### Bước 5: Restart Next.js
```bash
cd D:\MIMIN-ERP-app-moi\apps\web
# Ctrl+C để stop dev server cũ (nếu đang chạy)
npm run dev
```

Test đăng nhập `sang@mimin.vn` / `sang123` → Mở DevTools > Network > check có request tới `nftlwdcsmlpeiazhuoho.supabase.co`.

---

## 🛠 CÁCH 2: Script tự động (5 phút)

Dùng Node script em đã viết sẵn, không cần mở web.

### Bước 1: Lấy Connection String
1. Vào https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/settings/database
2. Tìm mục **Connection string** > chọn tab **URI**
3. Copy (password đã điền sẵn)
4. Mở `apps/web/.env.local`, thêm dòng:
   ```
   DATABASE_URL=postgresql://postgres.nftlwdcsmlpeiazhuoho:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

### Bước 2: Chạy script
```bash
cd D:\MIMIN-ERP-app-moi
node apply-migrations.js
```

Script sẽ:
- Parse `.env.local` (không in value ra terminal)
- Check schema hiện tại
- Hướng dẫn apply qua SQL Editor (vì PostgREST không chạy raw SQL được)
- Báo cáo kết quả

### Bước 3: Hoặc dùng PowerShell
```powershell
cd D:\MIMIN-ERP-app-moi
.\apply-migrations.ps1
```

---

## 🔐 SAU KHI APPLY XONG

### Kiểm tra trong Dashboard
Vào https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/editor

Bạn sẽ thấy 10 bảng mới:
- users
- tasks
- kho
- cong_no
- nha_cung_cap
- khach_hang_si
- xuong_gia_cong
- audit_log
- notifications
- lenh_sx_tong

### Test RLS
Vào https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/auth/policies

Bạn sẽ thấy 12 policies mới được enable.

### Apply Seed Data (Optional)
Nếu muốn test với data mẫu:
1. Mở file `supabase-migrations/002_seed_data.sql`
2. Paste vào SQL Editor
3. Run

---

## 🐛 TROUBLESHOOTING

### Lỗi: "permission denied for schema public"
- Nguyên nhân: Project free tier của Supabase cho phép public schema
- Fix: Bỏ qua, dòng này ở comment, không ảnh hưởng

### Lỗi: "extension uuid-ossp does not exist"
- Fix: Supabase đã enable sẵn, bỏ qua `CREATE EXTENSION` cũng OK

### Lỗi: "relation already exists"
- Schema dùng `IF NOT EXISTS` → bỏ qua, không sao
- Nếu vẫn fail: Drop table cũ trước (cẩn thận!)

### Verify báo "401 Unauthorized"
- File `.env.local` chưa có `SUPABASE_SERVICE_ROLE_KEY` đúng
- Check lại key từ Dashboard > Settings > API

### Verify báo "tables missing"
- Chưa apply migrations
- Làm theo Cách 1 Bước 2-3

### Next.js vẫn dùng mock auth
- Restart `npm run dev` sau khi update `.env.local`
- Check `isSupabaseEnabled` trong `src/lib/supabase/client.ts` = `true`

---

## 📞 BÁO CÁO CHO EM

Sau khi apply xong, paste output của `node verify-supabase.js` cho em. Em sẽ:
- Verify 10 bảng + 12 policies
- Test login với `sang@mimin.vn`
- Check realtime subscription
- Đếm số rows sau khi seed (nếu sếp apply 002)

---

**Tác giả**: Trợ lý sếp Sang  
**Cập nhật**: 2026-07-30
