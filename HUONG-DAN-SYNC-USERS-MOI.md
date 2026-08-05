# 🚀 HƯỚNG DẪN SYNC 22 NV MỚI + 20 NCC GIA CÔNG

**Ngày tạo:** 2026-08-05
**Tác giả:** Mavis

## Tổng quan

Sau khi chạy xong 3 scripts này, hệ thống sẽ có:
- ✅ **1 admin**: `sang@mimin.vn` (đã có sẵn)
- ✅ **22 NV mới @mimin.vn** (chưa có trong Auth)
- ✅ **20 NCC gia công may** (role=partner)
- 🗑️ **19 user cũ** (admin@mimin.com + 18 @gmail/@mimin-erp.local) → **XÓA HẾT**

**Tổng cộng: 43 user @mimin.vn** (1 admin + 22 NV + 20 NCC)

---

## Bước 0: Set biến môi trường

Mở PowerShell và chạy:

```powershell
$env:SUPABASE_PAT = "sbp_REDACTED"
cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
```

> ⚠️ Nếu PAT trên hết hạn, lấy PAT mới tại: https://supabase.com/dashboard/account/tokens

---

## Bước 1: Sync 22 NV mới @mimin.vn

```powershell
node sync-22-new-nv.mjs
```

**Kết quả mong đợi:**
- ✅ Created/Updated 22 user NV mới
- Mỗi user có password `Mimin@123` (trừ `sang` dùng `sang123`)
- Role phân bổ: 1 planner (giau) + 1 accountant (thanh) + 1 planner (huyen) + 1 content (vy) + 1 warehouse (hau) + 5 sewing (giang, de, phu, vinh, minh1, nhan) + 6 finishing (nhi, phuong, be, duc1, tam, dinh) + 3 admin (hoa, phi) + 2 phụ (vy2, thanh2)

**Danh sách 22 user:**

| # | Email | Tên | Role | Phòng ban |
|---|---|---|---|---|
| 1 | `giau@mimin.vn` | Nguyễn Thị Giàu | planner | ban-dieu-hanh |
| 2 | `thanh@mimin.vn` | Bùi Thị Thanh | accountant | ban-ke-toan |
| 3 | `huyen@mimin.vn` | Đỗ Thị Huyền | planner | ban-ban-si |
| 4 | `vy@mimin.vn` | Nguyễn Ngọc Cẩm Vy | content | ban-content |
| 5 | `hau@mimin.vn` | Nguyễn Quốc Hậu | warehouse | ban-kho |
| 6 | `giang@mimin.vn` | Phan Văn Giang | sewing | to-cat |
| 7 | `de@mimin.vn` | Phạm Văn Đệ | sewing | to-cat |
| 8 | `phu@mimin.vn` | Nguyễn Văn Phú | sewing | to-cat |
| 9 | `ruong@mimin.vn` | Nguyễn Văn Ruộng | sewing | to-khuy-nut |
| 10 | `nhi@mimin.vn` | Nguyễn Thị Mỹ Nhi | finishing | to-hoan-thien |
| 11 | `phuong@mimin.vn` | Võ Thị Phượng | finishing | to-hoan-thien |
| 12 | `be@mimin.vn` | Nguyễn Thị Bé | finishing | to-hoan-thien |
| 13 | `hoa@mimin.vn` | Huỳnh Xuân Hòa | admin | ban-hanh-chinh |
| 14 | `duc1@mimin.vn` | Nguyễn Minh Đức | finishing | to-hoan-thien |
| 15 | `tam@mimin.vn` | Trương Minh Tâm | finishing | to-hoan-thien |
| 16 | `dinh@mimin.vn` | Lê Đỉnh | finishing | to-hoan-thien |
| 17 | `vinh@mimin.vn` | Dương Tấn Vĩnh | sewing | to-cat |
| 18 | `minh1@mimin.vn` | Nguyễn Quốc Minh | sewing | to-cat |
| 19 | `nhan@mimin.vn` | Trương Văn Nhẫn | sewing | to-cat |
| 20 | `phi@mimin.vn` | Lương Hoàng Phi | admin | ban-content |
| 21 | `vy2@mimin.vn` | Vy Phòng Kho | warehouse | ban-kho |
| 22 | `thanh2@mimin.vn` | Thanh Phòng Cắt | sewing | to-cat |

---

## Bước 2: Sync 20 NCC gia công may

```powershell
node sync-20-ncc-users.mjs
```

**Kết quả mong đợi:**
- ✅ Created/Updated 20 user NCC (role=partner)
- Email pattern: `gc-{ma_ncc}@mimin.vn` (vd: `gc-gc-in-001@mimin.vn`)
- Password: `Mimin@123`
- Lấy data từ bảng `nha_cung_cap` với `ma_ncc LIKE 'GC-%'`

**Danh sách 20 NCC:**

| Nhóm | Prefix | Số lượng |
|---|---|---|
| In/Thêu/Dập | `GC-IN-*` | 5 |
| May quần | `GC-QUAN-*` | 4 |
| May áo tròn | `GC-TRON-*` | 5 |
| May áo trụ | `GC-TRU-*` | 6 |

---

## Bước 3: Xóa 19 user cũ

```powershell
node delete-19-old-users.mjs
```

**Sẽ xóa:**
- `admin@mimin.com` (Administrator cũ)
- 18 user `@gmail.com` và `@mimin-erp.local` cũ

**Giữ lại:**
- Tất cả user `@mimin.vn` (1 admin + 22 NV + 20 NCC = 43 user)

⚠️ **LƯU Ý:** Chạy bước này SAU khi đã sync 22 NV + 20 NCC xong, không chạy trước kẻo mất quyền admin!

---

## Bước 4: Audit tổng kết

```powershell
node audit-final-users.mjs
```

**Sẽ hiển thị:**
- Tổng user @mimin.vn: 43 user (1 admin + 22 NV + 20 NCC)
- Đối chiếu auth.users ↔ bang users (check khớp 100%)
- Chi tiết từng role
- Check user cũ còn sót (nếu có)

---

## 🧪 Test login

Sau khi chạy xong, F5 trang `https://mimin-erp.vercel.app/` rồi test:

| Email | Password | Role |
|---|---|---|
| `sang@mimin.vn` | `sang123` | admin |
| `giau@mimin.vn` | `Mimin@123` | planner |
| `thanh@mimin.vn` | `Mimin@123` | accountant |
| `vy@mimin.vn` | `Mimin@123` | content |
| `hau@mimin.vn` | `Mimin@123` | warehouse |
| `giang@mimin.vn` | `Mimin@123` | sewing |
| `gc-gc-in-001@mimin.vn` | `Mimin@123` | partner (NCC) |

---

## ⚠️ Lưu ý quan trọng

1. **Backup trước khi xóa:** Script `delete-19-old-users.mjs` sẽ xóa 19 user cũ VĨNH VIỄN. Nếu lỡ chạy sai, phải tạo lại thủ công.

2. **FK Constraints:** Đã setup `ON DELETE SET NULL` cho `audit_logs`, `push_subs`, `notifications` nên xóa user không ảnh hưởng lịch sử.

3. **Password mặc định:**
   - Admin: `sang123`
   - Tất cả user khác: `Mimin@123`
   - Sếp nên đổi password sau lần đăng nhập đầu tiên

4. **Nếu script bị lỗi ENOTFOUND / DNS:**
   - Mavis chạy trên sandbox bị block DNS
   - Sếp phải chạy trực tiếp trên máy local

5. **Nếu PAT hết hạn:**
   - Lấy PAT mới: https://supabase.com/dashboard/account/tokens
   - Set lại: `$env:SUPABASE_PAT = "sbp_..."`

---

## 📞 Hỗ trợ

Nếu gặp lỗi, gửi Mavis output terminal + commit hash để debug.
