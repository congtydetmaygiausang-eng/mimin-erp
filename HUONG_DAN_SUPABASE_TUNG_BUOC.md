# 🚀 HƯỚNG DẪN SETUP SUPABASE - TỪNG BƯỚC CỤ THỂ

> **Mục tiêu**: Sau 15 phút, a sẽ có Supabase thật chạy được với MIMIN ERP
> **Yêu cầu**: A có quyền admin vào project `nftlwdcsmlpeiazhuoho`

---

## 📋 CHECKLIST TỔNG QUAN

```
□ Bước 1: Apply Schema       (5 phút) → Tạo 10 bảng + RLS + Realtime
□ Bước 2: Apply Seed Data     (3 phút) → 26 user + 16 task + 5 SKU + 4 CN + 16 NCC + 12 KH + 5 xưởng
□ Bước 3: Verify              (2 phút) → Check 10 bảng có data
□ Bước 4: Enable Realtime     (2 phút) → Bật Realtime cho 5 bảng
□ Bước 5: Lấy Anon Key        (1 phút) → Copy anon public key
□ Bước 6: Tạo .env.local      (1 phút) → File config cho Next.js
□ Bước 7: Test kết nối       (2 phút) → Vào /supabase-status xem ✅
```

---

## BƯỚC 1: APPLY SCHEMA (5 phút)

### 1.1. Mở SQL Editor
**Click link này** (đã login sẵn Supabase):
```
https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/sql/new
```

### 1.2. Copy nội dung Schema
**Mở file** `mimin-erp/supabase-migrations/001_init_schema.sql` (nằm trong workspace).

**Hoặc** chạy lệnh này trong terminal để xem:
```bash
cat /workspace/mimin-erp/supabase-migrations/001_init_schema.sql
```

### 1.3. Paste + Run
1. **Ctrl+A** để chọn tất cả (320 dòng)
2. **Ctrl+C** để copy
3. Paste vào ô SQL Editor trong browser
4. Click nút **"Run"** (góc phải, màu xanh) hoặc **Ctrl+Enter**
5. Đợi 5-10 giây

### 1.4. Kết quả mong đợi
- ✅ "Success. No rows returned"
- Hoặc thấy dòng `ALTER PUBLICATION` chạy OK
- ❌ Nếu lỗi "extension uuid-ossp not found" → báo em
- ❌ Nếu lỗi "permission denied" → a không phải owner, cần vào Settings → API → đổi role

**Chụp màn hình** nếu có lỗi để em debug.

---

## BƯỚC 2: APPLY SEED DATA (3 phút)

### 2.1. Tạo query mới
- Click **"New query"** (góc trên bên trái) hoặc **"+"**
- Hoặc vào link: https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/sql/new

### 2.2. Copy nội dung Seed
**Mở file** `mimin-erp/supabase-migrations/002_seed_data.sql` (162 dòng).

```bash
cat /workspace/mimin-erp/supabase-migrations/002_seed_data.sql
```

### 2.3. Paste + Run
1. Copy toàn bộ nội dung (162 dòng)
2. Paste vào SQL Editor
3. Click **"Run"**
4. Đợi 3-5 giây

### 2.4. Kết quả mong đợi
Bảng kết quả cuối cùng sẽ hiển thị:
```
   table_name   | count
 ---------------+-------
  users         |    26
  tasks         |    16
  kho           |     5
  cong_no       |     4
  nha_cung_cap  |    16
  khach_hang_si |    12
  xuong_gia_cong|     5
```

✅ Nếu thấy đúng số → Bước 2 OK
❌ Nếu số 0 → check lại SQL có bị lỗi ở dòng nào

---

## BƯỚC 3: VERIFY DATA (2 phút)

### 3.1. Mở Table Editor
Click link: https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/editor

### 3.2. Check từng bảng
Click vào từng bảng bên trái và xem có data:

| Bảng | Phải thấy | Mẫu |
|---|---|---|
| `users` | 26 rows | "Anh Sang", "Chị Giàu", "Giang"... |
| `tasks` | 16 rows | "CAT_001" (Cắt M758), "MAY_001"... |
| `kho` | 5 rows | "VAI-COTTON-TRANG", "NUT-15MM"... |
| `cong_no` | 4 rows | "Mẹ Bé Xinh", "Thanh Hà"... |
| `nha_cung_cap` | 16 rows | "Lucky Avanti", "Sammoon"... |
| `khach_hang_si` | 12 rows | "Mẹ Bé Xinh", "5S Fashion"... |
| `xuong_gia_cong` | 5 rows | "Minh Phát", "Bảo Ngân"... |

✅ Tất cả đều có data → Bước 3 OK

---

## BƯỚC 4: ENABLE REALTIME (2 phút)

### 4.1. Mở Replication
Click link: https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/database/replication

### 4.2. Bật Realtime cho 5 bảng
Tìm các bảng sau và **BẬT** toggle Realtime:

- ✅ `tasks` - Phiếu workflow
- ✅ `kho` - Tồn kho
- ✅ `cong_no` - Công nợ
- ✅ `notifications` - Thông báo
- ✅ `nha_cung_cap` - Nhà cung cấp
- ✅ `khach_hang_si` - Khách hàng sỉ

Sau khi bật, các bảng sẽ có badge "**Realtime**" màu xanh.

⚠️ **Nếu bảng không có trong danh sách**: tức là SQL đã chạy OK và bảng đã được add vào publication `supabase_realtime` tự động (trong schema.sql em đã có `ALTER PUBLICATION supabase_realtime ADD TABLE`).

---

## BƯ�C 5: LẤY ANON KEY (1 phút)

### 5.1. Mở API Keys
Click link: https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/settings/api-keys

### 5.2. Copy Anon Public Key
Tìm section **"Project API keys"**:
- **Publishable key** (hoặc **anon public**)
- Chuỗi bắt đầu bằng `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Dài khoảng 200 ký tự

**Click icon copy** bên phải key.

⚠️ **KHÔNG copy service_role** (chỉ dùng cho admin, không an toàn nếu lộ).

### 5.3. Gửi cho em
Dán key vào chat theo format:
```
ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
```

(Lưu ý: anon key vô hại nếu lộ vì chỉ có quyền RLS-gated, OK để share)

---

## BƯỚC 6: TẠO .ENV.LOCAL (1 phút)

### 6.1. Tạo file
Mở terminal:
```bash
cat > /workspace/mimin-erp/apps/web/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://nftlwdcsmlpeiazhuoho.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_KEY_VAO_DAY
EOF
```

**Thay `PASTE_KEY_VAO_DAY`** bằng key a vừa copy.

### 6.2. Verify file
```bash
cat /workspace/mimin-erp/apps/web/.env.local
```

Phải hiện ra 2 dòng:
```
NEXT_PUBLIC_SUPABASE_URL=https://nftlwdcsmlpeiazhuoho.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

---

## BƯỚC 7: TEST KẾT NỐI (2 phút)

### 7.1. Build lại Next.js
```bash
cd /workspace/mimin-erp/apps/web
./node_modules/.bin/next build 2>&1 | tail -5
```

### 7.2. Deploy lại
Em sẽ deploy sau khi a báo. Hoặc a tự chạy dev server:
```bash
npm run dev
```
→ Mở http://localhost:3000

### 7.3. Vào trang Supabase Status
URL: `https://uzxoz3lcndmgl.space.minimax.io/supabase-status/`

**Đăng nhập** bằng 1 user (vd `sang@mimin.vn` / `sang123`).

### 7.4. Check kết quả
Trang sẽ hiển thị:
- ✅ "Supabase đã kết nối" (header xanh)
- ✅ Users: 26/26
- ✅ Tasks: 16/16
- ✅ Kho: 5/5
- ✅ Realtime: Hoạt động

Nếu có bất kỳ ❌ nào → chụp màn hình gửi em.

---

## 🧪 TEST REALTIME (Bonus)

Sau khi setup xong, test realtime bằng cách:

1. Mở **2 tab** cùng URL: `https://uzxoz3lcndmgl.space.minimax.io/`
2. **Tab 1**: Login `cat2` / `de123` → mở `/ui-cat/`
3. **Tab 2**: Login `giau` / `giau123` → mở `/lenh-cat/`
4. **Tab 1**: Click `+10` trên 1 task
5. **Tab 2**: **Thấy SL thay đổi NGAY không cần F5** ← Realtime thành công!

---

## ❌ XỬ LÝ LỖI

### Lỗi "extension uuid-ossp not found"
```sql
-- Chạy trước:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Lỗi "permission denied for schema public"
→ A không phải owner. Cần vào Settings → API → check role = "postgres"

### Lỗi "relation users does not exist"
→ Chưa chạy Bước 1 (Schema). Quay lại Bước 1.

### Lỗi "duplicate key value violates unique constraint"
→ Bảng đã có data rồi. Chạy TRUNCATE trước:
```sql
TRUNCATE users, tasks, kho, cong_no, nha_cung_cap, khach_hang_si, xuong_gia_cong CASCADE;
```
→ Rồi chạy lại Bước 2.

### Lỗi ".env.local not found"
→ File phải nằm ở `/workspace/mimin-erp/apps/web/.env.local` (KHÔNG phải root)

---

## 📞 KHI CẦN EM

Sau mỗi bước, a làm theo xong thì báo em:
- ✅ "Bước 1 OK" → em qua bước 2 cùng a
- ❌ "Bước 1 lỗi XYZ" → em debug

Em sẵn sàng hỗ trợ realtime a nhé! 🚀
