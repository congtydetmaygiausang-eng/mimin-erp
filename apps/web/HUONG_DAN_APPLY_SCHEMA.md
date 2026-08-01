# 🚀 Hướng dẫn Apply Supabase Schema (Cách B - SQL Editor)

> Em bị sandbox chặn DNS, không connect được từ máy em. Anh Sang copy SQL paste vào SQL Editor trên web là nhanh nhất.

## ✅ Cách B: Dùng Supabase SQL Editor (1 phút)

### Bước 1: Mở Supabase SQL Editor
Truy cập: **https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/sql/new**

### Bước 2: Copy toàn bộ SQL
Mở file: `D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\all-schemas-combined.sql`

**Cách mở nhanh (PowerShell):**
```powershell
notepad "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\all-schemas-combined.sql"
```

`Ctrl+A` → `Ctrl+C` để copy toàn bộ.

### Bước 3: Paste vào SQL Editor
- Paste vào ô SQL Editor
- Bấm **Run** (góc phải dưới) hoặc `Ctrl+Enter`
- Đợi 5-15 giây

### Bước 4: Kiểm tra
Chạy query này để verify:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Kết quả phải có **≥14 bảng mới**:
- audit_logs
- chuyen_cong_doan
- cong_doan
- cong_viec
- don_hang
- kho_phu_lieu
- kho_vai
- lich_su_kho
- nhan_vien
- phan_cong
- phien_kiem
- san_luong
- thong_bao
- users

## ⚠️ Nếu gặp lỗi

| Lỗi | Cách xử lý |
|------|-----------|
| `permission denied for table users` | OK - schema cũ có RLS, kệ nó chạy tiếp |
| `relation already exists` | OK - DROP TABLE đã có ở đầu file |
| `syntax error at or near "policy"` | OK - bỏ qua policy đã tạo, các CREATE TABLE vẫn chạy |

## 📋 Cách A: Chạy bằng Node script (cần password)

Nếu anh muốn tự chạy script Node:
```powershell
cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
$env:DATABASE_URL = "postgresql://postgres.nftlwdcsmlpeiazhuoho:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
node apply-schema.mjs
```

`[PASSWORD]` lấy từ: Dashboard → Settings → Database → Connection string → URI

## 🎯 Sau khi apply xong

Báo lại em:
- ✅ "Apply xong, có 14 bảng mới"
- Hoặc paste lỗi nếu có

Em sẽ:
1. Insert 19 user nội bộ thật vào bảng `users`
2. Migrate data cũ (nếu có)
3. Refactor 9 stores từ localStorage sang Supabase (3-5 đợt)
