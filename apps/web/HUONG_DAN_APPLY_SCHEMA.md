# 🚀 Hướng dẫn Apply Supabase Schema

> Em bị sandbox chặn DNS, không connect được từ máy em. Anh Sang chọn 1 trong 2 cách dưới đây.

---

## Cách 1: Dùng Supabase SQL Editor trên web (1 phút)

### Bước 1: Mở SQL Editor
Truy cập: **https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/sql/new**

### Bước 2: Fix lỗi trình duyệt (nếu có)
Nếu trang báo lỗi `insertBefore` hoặc React error → là do **Chrome extension** xung đột. Thử:

**Option A: Tab ẩn danh (nhanh nhất)**
- `Ctrl + Shift + N` → mở tab mới
- Vào lại link SQL Editor ở trên
- Tab ẩn danh tắt hết extension → React chạy mượt

**Option B: Tắt extension Translate**
- Vào `chrome://extensions/`
- Tìm **Google Translate** → OFF
- Reload tab Supabase

**Option C: Dùng Edge hoặc Firefox**
- Mở bằng Edge (có sẵn Windows) hoặc Firefox

### Bước 3: Copy SQL
Mở file: `D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\all-schemas-combined.sql`

Lệnh mở nhanh (PowerShell):
```powershell
notepad "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\all-schemas-combined.sql"
```

`Ctrl+A` → `Ctrl+C` để copy toàn bộ.

### Bước 4: Paste và Run
- Paste vào ô SQL Editor
- Bấm **Run** (góc phải dưới) hoặc `Ctrl+Enter`
- Đợi 5-15 giây

### Bước 5: Verify
Chạy query này để kiểm tra:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Kết quả phải có **≥14 bảng mới** (audit_logs, chuyen_cong_doan, cong_doan, cong_viec, don_hang, kho_phu_lieu, kho_vai, lich_su_kho, nhan_vien, phan_cong, phien_kiem, san_luong, thong_bao, users).

---

## Cách 2: Chạy bằng Node script (cần password)

Nếu không muốn dùng web editor, chạy script từ máy anh:

```powershell
cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
node apply-schema.mjs
```

Script tự động:
- Đọc password từ `.env.local`
- Connect vào Supabase bằng `pg` (PostgreSQL thuần)
- Apply 14 bảng + 3 functions + RLS + realtime
- Skip lỗi "already exists" (chạy lại nhiều lần OK)
- List ra tất cả bảng đã tạo

Nếu chưa có `DATABASE_URL` trong `.env.local`:
1. Vào https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/settings/database
2. Mục **Connection string** → tab **URI**
3. Nếu chưa có password: click **Reset database password** trước
4. Copy connection string
5. Paste vào `apps/web/.env.local`:
   ```
   DATABASE_URL=postgresql://postgres.nftlwdcsmlpeiazhuoho:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

---

## ⚠️ Lỗi thường gặp

| Lỗi | Cách xử lý |
|------|-----------|
| `insertBefore` React error trên web | Tab ẩn danh / tắt extension Translate |
| `password authentication failed` | Reset database password trên Dashboard |
| `ENOTFOUND` không kết nối được | Kiểm tra internet + DATABASE_URL đúng format |
| `permission denied for table users` | OK - schema cũ có RLS, kệ chạy tiếp |
| `relation already exists` | OK - DROP TABLE ở đầu file, các CREATE sau skip |

---

## 🎯 Sau khi apply xong

Báo lại em:
- ✅ "Apply xong, có X bảng" (gửi kèm output list tables)
- Hoặc paste lỗi nếu có

Em sẽ:
1. Insert 19 user nội bộ thật vào bảng `users`
2. Migrate data cũ (nếu có)
3. Refactor 9 stores từ localStorage sang Supabase (3-5 đợt)
