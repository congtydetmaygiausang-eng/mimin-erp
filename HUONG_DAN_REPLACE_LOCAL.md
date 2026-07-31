# 📦 HƯỚNG DẪN REPLACE LOCAL VỚI MIMIN ERP v89.6.8

> Tác giả: Trợ lý sếp Sang  
> Ngày: 2026-07-30

---

## 📥 Bước 1: Tải file ZIP

File: `MIMIN-ERP-v89.6.8-full.zip` (178MB, 592 files)

Sếp Sang lưu vào `D:\Downloads\` (hoặc bất kỳ đâu).

---

## 🗑️ Bước 2: Backup folder cũ (QUAN TRỌNG!)

Trước khi replace, sếp cần backup 2 thứ:

### Backup folder `mimin-erp` cũ
```powershell
# Mở PowerShell
cd D:\MIMIN-ERP-app-moi

# Rename folder cũ (không xóa, để backup)
Rename-Item mimin-erp mimin-erp-v45-backup
```

### Backup file `.env.local` (chứa 9 keys Supabase)
```powershell
# Copy file .env.local ra ngoài
Copy-Item apps\web\.env.local D:\MIMIN-ERP-env-backup.txt
```

---

## 📂 Bước 3: Giải nén ZIP vào đúng vị trí

### Cách A: Dùng PowerShell
```powershell
# Giải nén vào D:\MIMIN-ERP-app-moi
Expand-Archive D:\Downloads\MIMIN-ERP-v89.6.8-full.zip -DestinationPath D:\MIMIN-ERP-app-moi -Force
```

Sau đó sẽ có folder: `D:\MIMIN-ERP-app-moi\mimin-erp\`

### Cách B: Dùng 7-Zip (nhanh hơn cho file lớn)
```powershell
# Cài 7-Zip trước (nếu chưa có): https://7-zip.org
& "C:\Program Files\7-Zip\7z.exe" x "D:\Downloads\MIMIN-ERP-v89.6.8-full.zip" -o"D:\MIMIN-ERP-app-moi" -y
```

---

## 🔄 Bước 4: Move folder

Vì ZIP giải nén ra `mimin-erp/` trong `MIMIN-ERP-app-moi/`, sếp cần:

```powershell
# PowerShell
cd D:\MIMIN-ERP-app-moi

# Nếu folder cũ đã backup ở Bước 2, giờ move folder mới
Move-Item mimin-erp mimin-erp-new

# Xóa folder cũ (nếu đã backup)
# Remove-Item mimin-erp-v45-backup -Recurse -Force
```

Hoặc đơn giản: Vào Explorer → Drag folder `mimin-erp` mới ra Desktop → Xóa folder `mimin-erp` cũ → Kéo folder mới vào lại.

---

## 🔑 Bước 5: Restore file `.env.local`

File `.env.local` KHÔNG có trong ZIP (vì chứa key bí mật). Sếp cần restore:

```powershell
# PowerShell
Copy-Item D:\MIMIN-ERP-env-backup.txt D:\MIMIN-ERP-app-moi\mimin-erp\apps\web\.env.local
```

Verify:
```powershell
Test-Path D:\MIMIN-ERP-app-moi\mimin-erp\apps\web\.env.local
# Phải trả về: True
```

---

## 📦 Bước 6: Cài đặt dependencies

```powershell
cd D:\MIMIN-ERP-app-moi\mimin-erp\apps\web
npm install
```

Chờ 2-5 phút. Nếu lỗi:
- Xóa `package-lock.json` rồi `npm install` lại
- Hoặc dùng `npm install --legacy-peer-deps`

---

## ✅ Bước 7: Verify project

```powershell
# Chạy từ thư mục root
cd D:\MIMIN-ERP-app-moi\mimin-erp

# Kiểm tra cấu trúc
node audit-project.js
```

Kỳ vọng output:
```
✅ Passed:   56
⚠️  Warnings: 0
❌ Errors:   0
   🎉 PERFECT! Dự án hoàn hảo, sẵn sàng production.
```

---

## 🚀 Bước 8: Chạy dev server

```powershell
cd D:\MIMIN-ERP-app-moi\mimin-erp\apps\web
npm run dev
```

Mở trình duyệt: http://localhost:3000

Đăng nhập với:
- **Admin**: `sang@mimin.vn` / `sang123` (có 2FA)
- **Demo**: `admin@mimin.vn` / `admin123` (không 2FA)

---

## 📋 SAU KHI CHẠY ĐƯỢC

### Test các tính năng mới v89.6.8:

| # | Tính năng | URL |
|--:|---|---|
| 1 | Tạo lệnh cắt mới | `/lenh-cat/` → Click "Tạo lệnh cắt" |
| 2 | Kho thành phẩm | `/kho-thanh-pham/` → Click "Auto" để generate 32 SP |
| 3 | Seed data 1-click | `/seed-data/` |
| 4 | Test 54 modules | `/test-kiem-thu/` |
| 5 | Test 32 user | `/test-phan-quyen/` |
| 6 | Backup/Restore | `/backup-restore/` |
| 7 | GlobalSearch Ctrl+K | Nhấn Ctrl+K ở bất kỳ đâu |
| 8 | Bảng lương auto | `/bang-luong-auto/` |
| 9 | Cảnh báo | `/canh-bao/` |
| 10 | Apply Supabase | Xem `HUONG_DAN_APPLY_SUPABASE.md` |

---

## 🐛 TROUBLESHOOTING

### Lỗi "Cannot find module"
- Chưa `npm install` → chạy `npm install` ở `apps/web/`

### Lỗi "Port 3000 already in use"
```powershell
# Kill process cũ
Get-Process -Name "node" | Stop-Process -Force
npm run dev
```

### Lỗi "Module not found: Can't resolve"
- Xóa `.next` folder:
```powershell
Remove-Item apps\web\.next -Recurse -Force
npm run dev
```

### .env.local không tồn tại
- Restore từ backup `D:\MIMIN-ERP-env-backup.txt`
- Hoặc tạo mới theo template `apps\web\.env.example`

### Build error TypeScript
```powershell
cd apps\web
npx tsc --noEmit
# Xem lỗi ở đâu, paste cho em
```

---

## 💡 GHI CHÚ

- File ZIP 178MB (gồm screenshots, docs, SQL, code). Exclude `node_modules` (~400MB) để giảm size.
- Nếu sếp muốn code only (không có screenshots, docs): em có thể tạo ZIP nhỏ hơn ~10MB.
- Sau khi replace xong, sếp có thể xóa folder backup `mimin-erp-v45-backup` để giải phóng disk.

---

**Sẵn sàng? Paste output `node audit-project.js` cho em nếu có lỗi! 🚀**
