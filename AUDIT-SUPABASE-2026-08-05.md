# 🔍 AUDIT TỔNG THỂ HỆ THỐNG DỮ LIỆU - 2026-08-05

**Project**: `ejcuqyaiwabfygyesvxj` (Supabase Pro $25/tháng)
**Auditor**: Mavis
**Phương pháp**: Management API + PAT + SQL queries trực tiếp

---

## 📊 TỔNG QUAN

| Metric | Giá trị |
|---|---|
| Tổng bảng trong DB | **19** |
| Tổng bảng trong code/SQL files | **28** |
| **Bảng THIẾU cần apply** | **9** |
| Tổng rows (data) | **374** |
| Bảng có RLS | **18/19** (94.7%) |
| Bảng có foreign key | **1/19** (5.3%) |
| Bảng camelCase (chuẩn sync) | **0** ⚠️ |
| Bảng snake_case | 18 |
| Bảng MIXED | 1 (`users`) |

---

## ✅ BẢNG ĐÃ CÓ (19 bảng)

| # | Bảng | Style | Rows | Cột | RLS | Index | FK | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| 1 | audit_logs | snake | 0 | 17 | ✅ | 1 | 0 | OK |
| 2 | bang_chi_phi_co_dinh | snake | 0 | 5 | ✅ | 1 | 0 | OK (Antigravity tạo) |
| 3 | bang_luong | snake | 0 | 12 | ✅ | 1 | 0 | OK |
| 4 | custom_roles | snake | 0 | 4 | ✅ | 1 | 0 | OK |
| 5 | don_hang | snake | 0 | 16 | ✅ | 2 | 0 | OK |
| 6 | giao_dich_kho | snake | **80** | 13 | ✅ | 1 | **1** | ✅ Có FK |
| 7 | khach_hang | snake | **128** | 11 | ✅ | 2 | 0 | OK |
| 8 | lenh_cat | snake | 0 | 26 | ✅ | 4 | 0 | ⚠️ Snake (expected camel) |
| 9 | login_attempts | snake | 0 | 6 | ✅ | 1 | 0 | OK |
| 10 | mau_cong_doan | snake | **4** | 5 | ✅ | 1 | 0 | OK (Antigravity push 4 mẫu) |
| 11 | nha_cung_cap | snake | **42** | 19 | ✅ | 5 | 0 | OK (20 NCC + 22 khác?) |
| 12 | nhan_su | snake | **18** | 11 | ✅ | 2 | 0 | OK (đúng 17 NV + 1 admin) |
| 13 | notifications | snake | 0 | 8 | ✅ | 1 | 0 | OK |
| 14 | phan_cong | snake | 0 | 16 | ✅ | 1 | 0 | OK |
| 15 | push_subscriptions | snake | 0 | 6 | ✅ | 1 | 0 | OK (3 policies) |
| 16 | time_bounds | snake | 0 | 4 | ✅ | 1 | 0 | OK |
| 17 | two_factor_configs | snake | 0 | 6 | ✅ | 2 | 0 | OK |
| 18 | users | **MIXED** | **20** | 14 | ✅ | 6 | 0 | OK (camelCase + snake timestamp) |
| 19 | vat_tu | snake | **82** | 9 | ❌ | 1 | 0 | ❌ **THIẾU RLS** |

---

## ❌ BẢNG THIẾU - CẦN APPLY (10 bảng)

Các bảng này **CÓ TRONG CODE/SQL files** nhưng **CHƯA CÓ TRONG DB**:

| # | Bảng | Có trong SQL | Tình trạng sync |
|---|---|---|---|
| 1 | `cong_no` | EXTRA + CAMELCASE | ❌ Code có `cong-no-store.tsx` → sync FAIL |
| 2 | `khsx` | EXTRA + CAMELCASE | ❌ Code có `khsx-store.tsx` → sync FAIL |
| 3 | `qc_records` | EXTRA + CAMELCASE | ❌ Code có `qc-store.tsx` → sync FAIL |
| 4 | `hoan_thien` | EXTRA + CAMELCASE | ❌ Code có `hoan-thien-store.tsx` → sync FAIL |
| 5 | `giao_hang` | EXTRA + CAMELCASE | ❌ Code có `giao-hang-store.tsx` → sync FAIL |
| 6 | `gia_cong` | EXTRA + CAMELCASE | ❌ Code có `gia-cong-store.tsx` → sync FAIL |
| 7 | `doi_soat` | EXTRA + CAMELCASE | ❌ Code có `doi-soat-store.tsx` → sync FAIL |
| 8 | `kho_mobile` | EXTRA + CAMELCASE | ❌ Code có `kho-mobile-store.tsx` → sync FAIL |
| 9 | `mau_chi_phi` | MANUAL + CAMELCASE | ❌ Code có `lenh-cat-store.tsx` → sync FAIL |
| 10 | `cong_nhan_gia_cong` | **MỚI (Phase 3)** | ❌ Code mới tạo hôm nay |

---

## 🔥 VẤN ĐỀ NGHIÊM TRỌNG

### 1. ❌ Code sync FAIL silent cho 9 bảng workflow

**Triệu chứng**: Sếp Sang nhập liệu Lệnh cắt, KHSX, Công nợ, Đối soát... → lưu thành công vào localStorage → **NHƯNG KHÔNG sync lên Supabase** (vì bảng không tồn tại).

**Lý do silent fail**: `sync-helper.ts` dùng `.catch(err => console.error(...))` → chỉ log console, không báo UI.

**Tác động**:
- Multi-device sync: KHÔNG hoạt động
- Sếp Sang mở máy khác → không thấy data
- Mất data khi clear localStorage

**Fix**: Apply `APPLY-MISSING-TABLES.sql` (đã chuẩn bị) để tạo 9 bảng + Phase 3.

### 2. ⚠️ Bảng `lenh_cat` là snake_case thay vì camelCase

**Hiện trạng**:
- DB: `loai_lenh`, `ma_sp`, `ten_sp`, `tong_sl`, `tong_sl_thuc_te`, ...
- Code: `loaiLenh`, `maSP`, `tenSP`, `tongSL`, `tongSLThucTe`, ...

**Lý do**:
- Theo summary, sếp Sang đã "DROP + RECREATE 11 bảng sync với camelCase"
- NHƯNG thực tế bảng `lenh_cat` trong DB vẫn là snake_case
- → Có thể sếp Sang chưa apply `APPLY-SUPABASE-CAMELCASE.sql` lên Pro

**Tác động**:
- Vẫn work vì `sync-helper.ts` có `camelToSnake` / `snakeToCamel` converters
- NHƯNG:
  - Bảng `mau_cong_doan` (snake) khớp với code `mau_cong_doan` ✓
  - Bảng `mau_chi_phi` (CHƯA CÓ) sẽ khớp camelCase
  - Inconsistent: một số bảng snake, một số camel (nếu apply CAMELCASE sau)

**Đề xuất**:
- Option A: **GIỮ NGUYÊN** snake_case (hiện tại) → consistent, sync-helper handle
- Option B: **RECREATE** toàn bộ 11 bảng camelCase → code camelCase trực tiếp (no convert)
- **Recommend A** vì:
  - Sync-helper đã tested ổn
  - Snake_case phù hợp convention PostgreSQL
  - Ít rủi ro hơn

### 3. ❌ `vat_tu` thiếu RLS policy

**Hiện trạng**: `vat_tu` có 82 rows nhưng KHÔNG có RLS policy.

**Tác động**: Bất kỳ user (authenticated hay anonymous) đều có thể SELECT/INSERT/UPDATE/DELETE.

**Fix**: Thêm RLS policy `Allow all for authenticated` (đã có trong `APPLY-MISSING-TABLES.sql`).

### 4. ⚠️ 18/19 bảng không có Foreign Key

**Hiện trạng**:
- Chỉ `giao_dich_kho` có 1 FK (có thể là `lenh_cat_id` → `lenh_cat.id`)
- 18 bảng khác KHÔNG có FK → không enforce referential integrity

**Tác động**:
- Có thể xoá `lenh_cat` mà `giao_dich_kho.lenh_cat_id` vẫn còn (orphan rows)
- Có thể nhập `maNV` không tồn tại trong `nhan_su`

**Đề xuất**: Cân nhắc thêm FK cho các quan hệ chính:
- `giao_dich_kho.lenh_cat_id` → `lenh_cat.id` (CASCADE)
- `phan_cong.lenh_cat_id` → `lenh_cat.id` (CASCADE)
- `khsx.maLenhCat` → `lenh_cat.id`
- `qc_records.maLenhCat` → `lenh_cat.id`
- `hoan_thien.maLenhCat` → `lenh_cat.id`
- `giao_hang.maLenhCat` → `lenh_cat.id`
- `gia_cong.maDoiTac` → `nha_cung_cap.ma`
- `doi_soat.maDoiTac` → `nha_cung_cap.ma`
- `don_hang.khach_hang` → `khach_hang.ma_kh`

**Recommend**: Chưa fix vội (tốn thời gian + test kỹ). Có thể làm trong sprint sau.

### 5. ⚠️ `nha_cung_cap` có 42 rows (expected 20 NCC)

**Hiện trạng**: 42 rows, nhưng code chỉ có 20 NCC.

**Có thể lý do**:
- Sếp Sang từng add NCC mới nhưng chưa xoá
- Hoặc seed data test
- Hoặc CASCADE issue

**Recommend**: Audit `nha_cung_cap` xem có bao nhiêu NCC active, bao nhiêu duplicate/test.

---

## 🚀 HÀNH ĐỘNG CẦN LÀM

### 🔴 URGENT (1 lệnh, 5 phút)

**Sếp Sang apply 1 file SQL**:
1. Vào https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/sql
2. Copy toàn bộ nội dung file `APPLY-MISSING-TABLES.sql` (16KB)
3. Paste vào SQL Editor → Click **Run**
4. Đợi ~30s
5. Verify: chạy query cuối file → phải thấy **28 bảng** với row counts

**Tác động**:
- ✅ Tạo 9 bảng workflow còn thiếu
- ✅ Tạo 1 bảng `cong_nhan_gia_cong` (Phase 3) + insert 27 CN
- ✅ Fix RLS cho `vat_tu`
- → Code sync Supabase sẽ work đầy đủ

### 🟡 SAU KHI APPLY (verify, 5 phút)

1. Vào Vercel: `mimin-erp.vercel.app/cong-nhan-gia-cong`
   - Phải thấy 27 CN (fetch từ Supabase)
2. Test sync trên 1 workflow (vd: tạo KHSX mới)
   - Check Table Editor: phải thấy row mới
3. Chạy lại `node audit-schema.mjs` → phải thấy 28 bảng

### 🟢 TƯƠNG LAI (sprint sau)

1. Thêm Foreign Key cho các quan hệ chính (~2 giờ)
2. Audit `nha_cung_cap` 42 rows → clean duplicate (~30 phút)
3. Cân nhắc chuyển 11 bảng sync sang camelCase (recreate) - hoặc giữ snake_case
4. Thêm 2FA cho `nhan_su` (dù có bảng `two_factor_configs` rồi nhưng chưa integrate)
5. Monitoring + alert cho sync fail (không chỉ console.error)

---

## 📂 FILES AUDIT

- `apps/web/audit-schema.mjs` (5.9KB) - List 19 bảng + count + indexes + policies
- `apps/web/audit-schema-detail.mjs` (2.4KB) - Schema chi tiết 20 bảng
- `apps/web/scripts/audit-schema-result.json` (sau khi chạy)
- `apps/web/scripts/audit-schema-detail.txt` (sau khi chạy)
- `APPLY-MISSING-TABLES.sql` (16.5KB) - File SQL gộp để apply 1 lần
- `AUDIT-SUPABASE-2026-08-05.md` - Báo cáo này

---

## 🔍 SO SÁNH CODE vs DB

### Bảng `lenh_cat`

| Code (camelCase) | DB (snake_case) | Match? |
|---|---|---|
| `loaiLenh` | `loai_lenh` | ✓ (sync-helper convert) |
| `maSP` | `ma_sp` | ✓ (regex giữ SP viết hoa) |
| `tenSP` | `ten_sp` | ✓ |
| `tongSL` | `tong_sl` | ✓ |
| `bangCOGS` | `bang_cogs` | ✓ |
| `dsMau` | `ds_mau` | ✓ |
| `dsPhuLieu` | `ds_phu_lieu` | ✓ |
| `phanCong` | `phan_cong` | ✓ |
| `chiPhiCoDinh` | `chi_phi_co_dinh` | ✓ |

→ Tất cả đều work nhờ `sync-helper.ts` (camelToSnake/snakeToCamel).

### Bảng `users`

| Code | DB | Match? |
|---|---|---|
| `id` | `id` | ✓ |
| `email` | `email` | ✓ |
| `maNV` | `maNV` | ✓ (MIXED - camelCase) |
| `name` | `name` | ✓ |
| `role` | `role` | ✓ |
| `chucVu` | `chucVu` | ✓ (camelCase) |
| `phongBan` | `phongBan` | ✓ (camelCase) |
| `donGia` | `donGia` | ✓ (camelCase) |
| `laCongNhan` | `laCongNhan` | ✓ (camelCase) |
| `isActive` | `isActive` | ✓ (camelCase) |
| `lastLogin` | `lastLogin` | ✓ (camelCase) |
| `loginCount` | `loginCount` | ✓ (camelCase) |
| `created_at` | `created_at` | ✓ (snake) |
| `updated_at` | `updated_at` | ✓ (snake) |

→ Bảng `users` dùng camelCase cho fields business + snake cho timestamp → **MIXED OK** (cố ý thiết kế theo convention).

---

## 📝 KẾT LUẬN

**Trạng thái tổng thể**: 🟡 **CẦN FIX 1 LỆNH SQL**

- ✅ 19/28 bảng đã có → tốt
- ✅ RLS cho 18/19 bảng → gần đủ (thiếu `vat_tu`)
- ❌ 9 bảng workflow còn thiếu → **PHẢI FIX** (silent fail sync)
- ⚠️ FK chưa có nhiều → chấp nhận được
- ⚠️ camelCase vs snake_case → sync-helper handle, không cần fix

**Ưu tiên #1**: Sếp Sang apply `APPLY-MISSING-TABLES.sql` → unlock sync toàn bộ system.

Sau khi apply, system sẽ **hoạt động đầy đủ** trên mọi device (multi-device sync) với 28 bảng + 374 rows hiện tại + sync real-time cho mọi workflow.
