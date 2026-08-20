# 🚀 Hướng dẫn Apply Supabase Schema + Seed Users

> Em bị sandbox chặn DNS, không connect được từ máy em. Anh Sang chạy từ máy anh là OK.

---

## Thứ tự: 2 bước (mỗi bước ~1 phút)

### Bước 1: Apply schema (tạo 14 bảng mới)

```powershell
cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
node apply-schema.mjs
```

Script sẽ:
- Đọc `all-schemas-combined.sql` (đã có sẵn trong `apps/web/`)
- Apply 14 bảng + 3 functions + RLS + realtime
- Skip lỗi "already exists" → chạy lại nhiều lần OK
- List ra tất cả bảng đã tạo

**Nếu gặp lỗi kết nối:** Kiểm tra `apps/web/.env.local` có `DATABASE_URL` đúng chưa. Nếu chưa có, xem phần [Lấy DATABASE_URL](#-lấy-database_url) bên dưới.

### Bước 2: Seed 19 user nội bộ vào bảng `nhan_su`

```powershell
cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
node seed-users.mjs
```

Script sẽ:
- Xoá sạch nhân sự cũ (test/demo/legacy) trong bảng
- Insert 19 user nội bộ thật (sang, giau, thanh, huyen, vy, hau + 13 CN)
- Verify hiển thị + phân bố theo bộ phận

### Bước 3: Verify (optional)

Vào https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/editor → mở bảng `nhan_su` → thấy 19 rows.

Hoặc trong app: **/nhan-su** (Quản lý nhân sự).

---

## 🔑 Lấy DATABASE_URL

1. Vào https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/settings/database
2. Mục **Connection string** → tab **URI**
3. Nếu chưa có password: click **Reset database password** trước → copy password mới
4. Copy connection string (dạng):
   ```
   postgresql://postgres.nftlwdcsmlpeiazhuoho:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
5. Paste vào `apps/web/.env.local`:
   ```
   DATABASE_URL=postgresql://postgres.nftlwdcsmlpeiazhuoho:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

Password hiện tại xem trong `.env.local` (KHÔNG commit giá trị thật vào tài liệu này) — nếu vẫn dùng được thì không cần reset.

---

## 🐛 Lỗi thường gặp + cách xử lý

| Lỗi | Cách xử lý |
|------|-----------|
| Lỗi `insertBefore` React trên web Dashboard | Tab ẩn danh (`Ctrl+Shift+N`) / tắt extension Translate |
| `password authentication failed` | Reset password ở Settings → Database, update `.env.local` |
| `ENOTFOUND` / `ECONNREFUSED` | Kiểm tra internet + DATABASE_URL đúng format |
| `relation already exists` | OK - chạy lại nhiều lần OK, script tự skip |
| `Bảng nhan_su chưa tồn tại` | Chạy `apply-schema.mjs` trước |
| `column X does not exist` | Schema cũ thiếu cột - chạy lại `apply-schema.mjs` |

---

## 🎯 Sau khi 2 bước xong

Báo lại em:
- ✅ "Apply xong, có X bảng" + "Seed xong, có 19 nhân sự"
- Hoặc paste lỗi nếu có

Em sẽ refactor 9 stores từ localStorage sang Supabase (3-5 đợt) để data đồng bộ giữa các máy.
