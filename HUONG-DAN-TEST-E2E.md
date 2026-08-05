# 🧪 HƯỚNG DẪN TEST E2E - MIMIN ERP v89.6.8+

**Ngày tạo**: 2026-08-05
**Audit & Apply**: Mavis (Mavis)
**Mục đích**: Verify toàn bộ chain sync Supabase hoạt động đúng sau khi apply 11 bảng mới + fix 3 sprint

---

## 🎯 MỤC TIÊU TEST

Sau khi sếp Sang làm theo hướng dẫn này, hệ thống sẽ verify được:
1. ✅ Login Supabase Auth hoạt động
2. ✅ Auto-sync profile vào bảng `users`
3. ✅ Tạo KHSX → sync lên Supabase
4. ✅ Đối soát → sync lên Supabase
5. ✅ Bảng lương fetch từ Supabase
6. ✅ Multi-device sync (mở 2 browser)
7. ✅ RLS bảo vệ data

---

## 📋 CHECKLIST TEST (8 bước, ~10 phút)

### Bước 1: Mở Vercel

1. Mở browser: https://mimin-erp.vercel.app/
2. Đợi load (~2 giây)
3. Sẽ redirect đến `/login`

**Expected**: Trang login hiển thị với 2 ô Email + Password

---

### Bước 2: Login Admin

1. Email: `sang@mimin.vn`
2. Password: `sang123`
3. Click **Đăng nhập**

**Expected**:
- Login thành công → redirect về `/dashboard`
- Header hiển thị tên "Hồ Minh Sang" + role "Quản trị viên"

**Nếu FAIL**:
- ❌ Check email/password đúng chưa
- ❌ Xem Console (F12) có lỗi gì
- ❌ Screenshot + báo em

---

### Bước 3: Verify Auto-Sync Profile

1. Mở tab mới: https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/editor
2. Click table **`users`**
3. Tìm row có email `sang@mimin.vn`

**Expected**:
- Row có: `id`, `email`, `maNV = NV035`, `name = Hồ Minh Sang`, `role = admin`, `chucVu = Quản trị viên`
- Cột `lastLogin` vừa update (timestamp mới)
- Cột `loginCount` tăng 1 so với trước

**Nếu row KHÔNG có hoặc `lastLogin` không update**:
- ❌ Auto-sync fail → báo em

---

### Bước 4: Test KHSX Sync

1. Trong Vercel, vào menu **Sản xuất → Kế hoạch SX** (hoặc `/ke-hoach-san-xuat`)
2. Click **Tạo KHSX mới**
3. Điền:
   - Mã KHSX: `KHSX-TEST-E2E-001`
   - Sản phẩm: (chọn bất kỳ)
   - Số lượng: 100
   - Ngày BD → Ngày KT: (hôm nay → 7 ngày sau)
4. Click **Lưu**

**Expected**:
- KHSX mới xuất hiện trong danh sách
- Toast "Tạo KHSX thành công"

**Verify trong Supabase**:
- Quay lại Supabase Table Editor → table **`khsx`**
- Tìm row có `maKHSX = KHSX-TEST-E2E-001`
- Row phải có: id, maLenhCat (null), sanPham, soLuong = 100, trangThai = "Lên kế hoạch"

**Nếu KHÔNG có row**:
- ❌ KHSX store KHÔNG sync → báo em
- Mở Console (F12) → tab Network → tìm request đến Supabase → check response

---

### Bước 5: Test Bảng lương Fetch từ Supabase

1. Vào menu **Nhân sự → Bảng lương** (hoặc `/bang-luong`)
2. Chọn tháng/năm (mặc định tháng hiện tại)
3. Xem 17 NV hiển thị với:
   - `thucNhan` = 0 (vì chưa có workflow)
   - `tienCong` = 0
   - `tasks` = []

**Verify source**:
- Mở Console (F12) → tab Console
- Tìm log: `[useBangLuongData] Supabase fetch failed...` HOẶC `source: "supabase"`
- Nếu thấy `source: "supabase"` → hook đã fetch từ Supabase ✅
- Nếu thấy `source: "localStorage"` → fallback về local (OK vì chưa có data)

**Expected**:
- Bảng lương hiển thị 17 NV với tất cả `thucNhan = 0`
- KHÔNG có lỗi đỏ trong Console

---

### Bước 6: Test Công nhân Gia công Dự phòng

1. Vào menu **Danh mục → Công nhân gia công dự phòng** (hoặc `/cong-nhan-gia-cong`)
2. Đợi load ~2 giây

**Expected**:
- Thấy **27 công nhân** hiển thị
- 5 tabs filter: Tất cả / Cổ tròn / Cổ trụ / Polo / Thun / Móc xích / Đa dạng
- Stats: 27 sẵn sàng / 0 tạm ngưng / 0 hết việc / 199 tổng thợ

**Verify trong Supabase**:
- Table Editor → table **`cong_nhan_gia_cong`**
- Phải có 27 rows với id `CNGC-001` → `CNGC-027`

---

### Bước 7: Test Multi-Device Sync

1. Mở **browser A** (Chrome): https://mimin-erp.vercel.app/ke-hoach-san-xuat
2. Tạo KHSX: `KHSX-MULTI-001` (SL: 50)
3. Mở **browser B** (Edge/Firefox Incognito): https://mimin-erp.vercel.app/ke-hoach-san-xuat
4. Login cùng `sang@mimin.vn` / `sang123`
5. Reload trang B

**Expected**:
- Browser B thấy `KHSX-MULTI-001` (do realtime sync từ browser A)
- Nếu KHÔNG thấy ngay → chờ 5-10s rồi reload

**Verify trong Supabase**:
- Table `khsx` phải có row `KHSX-MULTI-001`

---

### Bước 8: Test CRUD Khác (Optional)

Test nhanh 1 method của 1 store:
- Tạo Đối soát mới → check table `doi_soat`
- Tạo Phiếu kho → check table `kho_mobile`
- Tạo QC record → check table `qc_records`

---

## 📊 KẾT QUẢ MONG ĐỢI

Sau 8 bước, sếp Sang nên thấy:

| Check | Expected |
|---|---|
| Login | ✅ OK + auto-sync profile |
| KHSX | ✅ Tạo mới + sync Supabase |
| Bảng lương | ✅ 17 NV + fetch Supabase |
| Công nhân GC | ✅ 27 CN hiển thị |
| Multi-device | ✅ Sync realtime |
| Console errors | ❌ KHÔNG có lỗi đỏ |

---

## 🆘 NẾU CÓ LỖI

### Lỗi: "Cannot connect to Supabase"
- Check internet
- Vercel có thể đang redeploy → đợi 30s

### Lỗi: "Row not found in users table"
- Auto-sync fail → báo em
- Tạm thời: dùng tài khoản NV khác (vd: `de7481039@gmail.com` / `Mimin@123`)

### Lỗi: "Build failed" trên Vercel
- Vercel đang build → đợi 2-3 phút
- Check Vercel dashboard → Deployments → xem log

### Báo em khi:
- Có lỗi KHÔNG có trong danh sách trên
- Sync KHÔNG hoạt động (mở browser khác không thấy data)
- Bảng lương hiển thị 0 NV (thay vì 17)

---

## 📞 LIÊN HỆ

Nếu có vấn đề, báo em với:
- Screenshot lỗi
- Console log (F12)
- Steps reproduce

Em sẽ debug + fix ngay!

---

**Sếp Sang test xong báo em kết quả nha!** 🚀
