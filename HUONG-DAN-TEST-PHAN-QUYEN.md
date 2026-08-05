# 🧪 HƯỚNG DẪN TEST PHÂN QUYỀN 9 ROLE × 30 MODULE

**Ngày tạo:** 2026-08-05
**Tác giả:** Mavis
**Mục đích:** Verify quyền của từng role × từng phòng ban theo Permission Matrix

---

## 📋 Chuẩn bị

- ✅ Đã sync 44 user @mimin.vn vào Supabase (1 admin + 23 NV + 20 NCC)
- ✅ Permission matrix 9 role × 30 module × 4 action (R/C/U/D)
- ✅ Trang `/phan-quen-cua-toi` hiển thị quyền của user hiện tại
- ✅ Trang `/test-phan-quyen` cho admin login nhanh 44 user

**Trang test chính:** `https://mimin-erp.vercel.app/test-phan-quyen` (admin only)

---

## 🎯 Quy trình test chuẩn

Mỗi role test theo 3 bước:
1. **Login** bằng user mẫu → xác nhận redirect đúng
2. **Check Sidebar** → đếm menu items (phải khớp matrix)
3. **Test truy cập** từng module → verify CRUD theo matrix

**Ký hiệu:**
- ✅ = Được phép
- ❌ = Bị chặn (redirect / ẩn / 403)
- 🟡 = Chỉ xem (R) - không tạo/sửa/xóa
- 🟢 = Full CRUD (R+C+U+D)

---

## 👑 ROLE 1: ADMIN (Ban Giám Đốc)

**User test:** `sang@mimin.vn` / `sang123`

### Expected matrix
- ✅ Tất cả 30 module
- ✅ Full CRUD (R+C+U+D) trên mọi module
- ✅ Thấy menu admin: `/test-phan-quyen`, `/quan-ly-tai-khoan`, `/audit-log`, `/seed-data`, `/backup-restore`, `/mohinh-phan-quyen-chuan`

### Test steps
| # | Bước | Expected |
|---|---|---|
| 1 | Login `sang@mimin.vn` / `sang123` | Redirect `/dashboard` |
| 2 | Đếm menu sidebar | Phải có **40+ menu items** |
| 3 | Vào `/phan-quen-cua-toi` | Hiển thị 30 modules với R/C/U/D = xanh |
| 4 | Vào `/audit-log` | ✅ Xem được log |
| 5 | Vào `/test-phan-quyen` | ✅ Thấy 44 user |
| 6 | Vào `/seed-data` | ✅ Vào được |
| 7 | Vào `/cai-dat` | ✅ Cài đặt đầy đủ |
| 8 | Tạo mới 1 lệnh cắt | ✅ OK |
| 9 | Xóa 1 user test | ✅ OK (nếu có quyền) |

---

## 📋 ROLE 2: PLANNER (Điều phối SX)

**User test:** `giau@mimin.vn` / `Mimin@123`

### Expected matrix
- ✅ Dashboard (R), Lệnh cắt (R+C+U), Kế hoạch SX (R+C+U), Đơn hàng (R+C+U), Khách hàng (R+C+U), NCC (R+C+U)
- ❌ KHÔNG thấy: Kho, Bảng lương, Công nợ, Hoàn thiện, Cài đặt, Audit log
- ❌ KHÔNG có nút Xóa (D) trên các module

### Test steps
| # | Bước | Expected |
|---|---|---|
| 1 | Login `giau@mimin.vn` | Redirect `/dashboard` |
| 2 | Sidebar | Thấy: Lệnh cắt, KH SX, Đơn hàng, Khách hàng, Bảng điều hành SX |
| 3 | Sidebar KHÔNG thấy | Kho vải, Kho TP, Bảng lương, Audit, Cài đặt |
| 4 | Vào `/lenh-cat` | ✅ Thấy nút Tạo + Sửa, ❌ KHÔNG có nút Xóa |
| 5 | Vào `/ke-hoach-san-xuat` | ✅ Tạo + Sửa OK |
| 6 | Vào `/kho-vai-tinhmann` | ❌ 403 / trang trắng |
| 7 | Vào `/bang-luong` | ❌ 403 |
| 8 | Vào `/seed-data` | ❌ 403 |

---

## 📦 ROLE 3: WAREHOUSE (Quản lý Kho)

**User test:** `hau@mimin.vn` / `Mimin@123`

### Expected matrix
- ✅ Kho vải, Kho phụ liệu, Kho thành phẩm (R+C+U+D)
- ✅ NCC (R+C+U)
- 🟡 Xem: Lệnh cắt, Đơn hàng, KH SX, Hoàn thiện, Giao hàng
- ❌ KHÔNG: Khách hàng, Công nợ, Tổ may, Bảng lương, Cài đặt, Audit

### Test steps
| # | Bước | Expected |
|---|---|---|
| 1 | Login `hau@mimin.vn` | Redirect `/dashboard` |
| 2 | Sidebar | Thấy: 3 loại kho, NCC, Bảng điều hành SX |
| 3 | Vào `/kho-vai-tinhmann` | ✅ Full CRUD |
| 4 | Vào `/kho-phu-lieu` | ✅ Full CRUD |
| 5 | Vào `/kho-thanh-pham` | ✅ Full CRUD |
| 6 | Vào `/nha-cung-cap` | ✅ Tạo + Sửa NCC |
| 7 | Vào `/khach-hang` | ❌ 403 |
| 8 | Vào `/to-may` | ❌ 403 |
| 9 | Vào `/bang-luong` | ❌ 403 |

---

## ✂️ ROLE 4: SEWING (Tổ trưởng May)

**User test:** `giang@mimin.vn` / `Mimin@123`

### Expected matrix
- ✅ Tổ may, Chấm công (R+C+U)
- ✅ Công việc gia công, Bàn giao (R+C+U)
- 🟡 Xem: Lệnh cắt (R+U - được sửa phiếu của mình), Kho, Đơn hàng, Hoàn thiện
- ❌ KHÔNG: Khách hàng, Công nợ, Bảng lương, NCC, Cài đặt, Audit

### Test steps
| # | Bước | Expected |
|---|---|---|
| 1 | Login `giang@mimin.vn` | Redirect `/dashboard` |
| 2 | Sidebar | Thấy: Tổ may, Chấm công, Trang chủ gia công |
| 3 | Vào `/may` (Tổ may) | ✅ Tạo + Sửa |
| 4 | Vào `/cham-cong` | ✅ Chấm công NV |
| 5 | Vào `/trang-chu-gia-cong` | ✅ OK (xem phiếu giao) |
| 6 | Vào `/lenh-cat` | 🟡 Xem + Sửa, ❌ không Xóa |
| 7 | Vào `/kho-vai-tinhmann` | 🟡 Chỉ xem |
| 8 | Vào `/khach-hang` | ❌ 403 |
| 9 | Vào `/bang-luong` | ❌ 403 |
| 10 | Vào `/nha-cung-cap` | ❌ 403 |

---

## 🛡️ ROLE 5: QC (Kiểm tra chất lượng)

**User test:** Hiện chưa có user QC @mimin.vn (cần tạo thêm)

### Expected matrix
- ✅ Kiểm tra chất lượng (R+C+U+D) - full quyền QC
- 🟡 Xem: Lệnh cắt, KH SX, Kho, Đơn hàng, Hoàn thiện, Tổ may, Gia công ngoài
- ❌ KHÔNG: Khách hàng, Công nợ, Chấm công, Bảng lương, NCC, Cài đặt, Audit

### Test steps (sau khi tạo user QC)
| # | Bước | Expected |
|---|---|---|
| 1 | Login user QC | Redirect `/dashboard` |
| 2 | Vào `/qc` | ✅ Full CRUD (tạo/sửa/xóa QC record) |
| 3 | Vào `/lenh-cat` | 🟡 Chỉ xem |
| 4 | Vào `/cham-cong` | ❌ 403 |

> ⚠️ **Action:** Hiện chưa có user QC @mimin.vn. Có thể dùng fallback `users.ts` (qc123) hoặc tạo mới.

---

## 🧵 ROLE 6: FINISHING (Tổ trưởng Hoàn thiện)

**User test:** `nhi@mimin.vn` / `Mimin@123`

### Expected matrix
- ✅ Hoàn thiện (R+C+U+D)
- ✅ Giao hàng (R+C+U)
- ✅ Công việc gia công, Bàn giao (R+C+U)
- 🟡 Xem: Lệnh cắt, Kho, Đơn hàng, Tổ may, Công nợ
- ❌ KHÔNG: Khách hàng, Bảng lương, NCC, Cài đặt, Audit

### Test steps
| # | Bước | Expected |
|---|---|---|
| 1 | Login `nhi@mimin.vn` | Redirect `/dashboard` |
| 2 | Sidebar | Thấy: Hoàn thiện, Giao hàng, Trang chủ gia công |
| 3 | Vào `/hoan-thien` | ✅ Full CRUD |
| 4 | Vào `/giao-hang` | ✅ Tạo + Sửa |
| 5 | Vào `/kho-thanh-pham` | 🟡 Xem + Sửa |
| 6 | Vào `/cong-no` | 🟡 Chỉ xem |
| 7 | Vào `/khach-hang` | ❌ 403 |
| 8 | Vào `/bang-luong` | ❌ 403 |

---

## 💰 ROLE 7: ACCOUNTANT (Kế toán)

**User test:** `thanh@mimin.vn` / `Mimin@123`

### Expected matrix
- ✅ Bảng lương, Công nợ, NCC (R+C+U+D) - full quyền tài chính
- ✅ Đối soát tiền công (R+C+U+D)
- 🟡 Xem: Tất cả module còn lại (KHÔNG có Tổ may, Cài đặt, Audit)
- ❌ KHÔNG: Tổ may, Cài đặt, Audit log

### Test steps
| # | Bước | Expected |
|---|---|---|
| 1 | Login `thanh@mimin.vn` | Redirect `/dashboard` |
| 2 | Sidebar | Thấy: Bảng lương, Công nợ, NCC, Đối soát |
| 3 | Vào `/bang-luong` | ✅ Full CRUD |
| 4 | Vào `/cong-no` | ✅ Full CRUD |
| 5 | Vào `/nha-cung-cap` | ✅ Full CRUD |
| 6 | Vào `/doi-soat-tien-cong` | ✅ Full CRUD |
| 7 | Vào `/lenh-cat` | 🟡 Chỉ xem |
| 8 | Vào `/to-may` | ❌ 403 |
| 9 | Vào `/cai-dat` | ❌ 403 |
| 10 | Vào `/audit-log` | ❌ 403 |

---

## 🎨 ROLE 8: CONTENT (Content / Media)

**User test:** `vy@mimin.vn` / `Mimin@123`

### Expected matrix
- ✅ Danh mục sản phẩm (R+C+U+D) - full quyền
- 🟡 Xem: Dashboard, Lệnh cắt, KH SX, Đơn hàng, Kho TP, NCC, Báo cáo
- ❌ KHÔNG: Kho vải, Kho phụ liệu, Nhân sự, Công nợ, QC, Tổ may, Hoàn thiện, Giao hàng, Chấm công, Bảng lương, Cài đặt, Audit

### Test steps
| # | Bước | Expected |
|---|---|---|
| 1 | Login `vy@mimin.vn` | Redirect `/dashboard` |
| 2 | Dashboard | Thấy PartnerDashboard 4 tile (Danh mục SP, Đơn hàng, KH SX, Báo cáo) |
| 3 | Vào `/danh-muc-sp` | ✅ Full CRUD (tạo mẫu, sửa, xóa) |
| 4 | Vào `/don-hang` | 🟡 Chỉ xem (để chụp ảnh) |
| 5 | Vào `/ke-hoach-san-xuat` | 🟡 Chỉ xem |
| 6 | Vào `/bao-cao` | 🟡 Chỉ xem |
| 7 | Vào `/kho-vai-tinhmann` | ❌ 403 |
| 8 | Vào `/nhan-su` | ❌ 403 |
| 9 | Vào `/cong-no` | ❌ 403 |
| 10 | Vào `/bang-luong` | ❌ 403 |
| 11 | Vào `/to-may` | ❌ 403 |

---

## 🤝 ROLE 9: PARTNER (Đối tác gia công may)

**User test:** `gc-gc-in-001@mimin.vn` / `Mimin@123`

### Expected matrix
- ✅ Trang chủ gia công (R+C+U+D)
- ✅ Công việc gia công, Bàn giao gia công (R+C+U)
- 🟡 Xem: Sản lượng gia công, Tiền công gia công, NCC, Gia công ngoài
- ❌ KHÔNG: Tất cả module khác (Kho, Lệnh cắt, Nhân sự, Bảng lương, Đơn hàng, Báo cáo, Cài đặt, Audit, v.v.)

### Test steps
| # | Bước | Expected |
|---|---|---|
| 1 | Login `gc-gc-in-001@mimin.vn` | **Redirect `/trang-chu-gia-cong`** (KHÔNG phải /dashboard) |
| 2 | Sidebar | **CHỈ thấy 5 menu**: Trang chủ GC, Công việc, Bàn giao, Sản lượng, Tiền công |
| 3 | Vào `/trang-chu-gia-cong` | ✅ Thấy phiếu giao cho xưởng mình |
| 4 | Vào `/cong-viec` | ✅ Thấy công việc được giao |
| 5 | Vào `/ban-giao` | ✅ Cập nhật bàn giao |
| 6 | Vào `/san-luong` | 🟡 Báo cáo SL |
| 7 | Vào `/tien-cong` | 🟡 Xem tiền công |
| 8 | Vào `/kho-vai-tinhmann` | ❌ 403 |
| 9 | Vào `/lenh-cat` | ❌ 403 |
| 10 | Vào `/nhan-su` | ❌ 403 |
| 11 | Vào `/bang-luong` | ❌ 403 |
| 12 | Vào `/don-hang` | ❌ 403 |
| 13 | Vào `/dashboard` | 🟡 Redirect về `/trang-chu-gia-cong` (không có data) |
| 14 | Vào `/seed-data` | ❌ 403 |
| 15 | Vào `/audit-log` | ❌ 403 |

### Test quan trọng nhất
**Kiểm tra dữ liệu cô lập giữa các NCC:**
- Login NCC A (Bảo Ngân `gc-gc-in-001`) → thấy 5 phiếu
- Login NCC B (Hạnh `gc-gc-in-002`) → thấy 0 phiếu của A (cô lập)
- Đây là test bảo mật quan trọng nhất của hệ thống!

---

## 🧪 TEST NHANH (Checklist tổng hợp)

Dùng khi muốn test nhanh toàn bộ hệ thống (~10 phút):

```bash
# 1. Login từng role, check redirect
sang@mimin.vn      → /dashboard           ✓
giau@mimin.vn      → /dashboard           ✓
hau@mimin.vn       → /dashboard           ✓
giang@mimin.vn     → /dashboard           ✓
nhi@mimin.vn       → /dashboard           ✓
thanh@mimin.vn     → /dashboard           ✓
vy@mimin.vn        → /dashboard           ✓ (PartnerDashboard 4 tile)
gc-gc-in-001@mimin.vn → /trang-chu-gia-cong ✓
```

```bash
# 2. Vào /phan-quen-cua-toi, check matrix
- admin: 30/30 modules
- planner: 15 modules
- warehouse: 8 modules
- sewing: 10 modules
- qc: 3 modules
- finishing: 10 modules
- accountant: 8 modules
- content: 5 modules
- partner: 5 modules (chỉ gia công)
```

```bash
# 3. Test cross-role access
- NCC vào /lenh-cat → 403
- Content vào /nhan-su → 403
- Sewing vào /bang-luong → 403
- Accountant vào /to-may → 403
- Tất cả role ngoài admin vào /seed-data → 403
```

---

## 📊 Kết quả kỳ vọng

| Role | Sidebar items | Modules truy cập | Full CRUD | Read only |
|---|---|---|---|---|
| admin | 40+ | 30/30 | 30 | 0 |
| planner | 25 | 15/30 | 5 | 10 |
| warehouse | 12 | 8/30 | 4 | 4 |
| sewing | 15 | 10/30 | 5 | 5 |
| qc | 8 | 3/30 | 1 | 2 |
| finishing | 15 | 10/30 | 5 | 5 |
| accountant | 12 | 8/30 | 4 | 4 |
| content | 8 | 5/30 | 1 | 4 |
| partner | 5 | 5/30 | 3 | 2 |

> ⚠️ Nếu kết quả khác → có bug → báo Mavis fix.

---

## 🔧 Script test tự động (PowerShell)

Chạy trên Windows PowerShell để verify 44 user login:

```powershell
$env:SUPABASE_PAT = "sbp_REDACTED"
$URL = "https://ejcuqyaiwabfygyesvxj.supabase.co"
$KEY = "sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd"

$tests = @(
    @{email="sang@mimin.vn";role="admin";pw="sang123"},
    @{email="giau@mimin.vn";role="planner";pw="Mimin@123"},
    @{email="hau@mimin.vn";role="warehouse";pw="Mimin@123"},
    @{email="giang@mimin.vn";role="sewing";pw="Mimin@123"},
    @{email="nhi@mimin.vn";role="finishing";pw="Mimin@123"},
    @{email="thanh@mimin.vn";role="accountant";pw="Mimin@123"},
    @{email="vy@mimin.vn";role="content";pw="Mimin@123"},
    @{email="gc-gc-in-001@mimin.vn";role="partner";pw="Mimin@123"},
    @{email="gc-gc-quan-001@mimin.vn";role="partner";pw="Mimin@123"}
)

foreach ($t in $tests) {
    $body = '{"email":"' + $t.email + '","password":"' + $t.pw + '"}'
    try {
        $resp = Invoke-RestMethod -Uri "$URL/auth/v1/token?grant_type=password" -Method Post -Headers @{apikey=$KEY;"Content-Type"="application/json"} -Body $body -TimeoutSec 30
        $ok = $resp.user.app_metadata.role -eq $t.role
        $color = if ($ok) {"Green"} else {"Red"}
        Write-Host "OK: $($t.email) role=$($resp.user.app_metadata.role) (expected $($t.role))" -ForegroundColor $color
    } catch {
        Write-Host "FAIL: $($t.email) - $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

**Expected output:** 9/9 OK (mỗi user role đúng với expected)

---

## 📞 Khi phát hiện bug

Báo Mavis với format:
```
[BUG] Role: <role>
       Module: <module path>
       Expected: <R/C/U/D nào được phép>
       Actual: <thực tế - OK/403/redirect>
       User: <email test>
```

Em sẽ fix ngay trong ngày.
