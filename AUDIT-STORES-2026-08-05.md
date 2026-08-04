# 🔍 AUDIT LOGIC + SYNC SUPABASE - 2026-08-05

**Auditor**: Mavis
**Phạm vi**: 12 store localStorage + 19 bảng Supabase + logic tính toán
**Phương pháp**: Đọc code + chạy audit script + so sánh với summary

---

## 🚨 PHÁT HIỆN NGHIÊM TRỌNG

### 1. ❌ 9/12 store KHÔNG sync Supabase

**Triệu chứng**: Sếp Sang nhập liệu → lưu localStorage → **KHÔNG sync lên Supabase** (silent fail).

**Audit 12 store**:

| # | Store | STORAGE_KEY | Sync? | Methods CRUD | Methods có sync |
|---|---|---|---|---|---|
| 1 | `cong-nhan-gia-cong` | `mimin_cong_nhan_gia_cong_v1` | ✅ | 3 | 3/3 |
| 2 | **`cong-no-store`** | **`mimin_phanCong_v1` ❌** | ❌ | 4 | **0/4** |
| 3 | `danh-muc-sp-store` | (none) | ❌ | 3 | 0/3 |
| 4 | **`doi-soat-store`** | `mimin_doi_soat_v1` | ❌ | 5 | **0/5** |
| 5 | **`gia-cong-store`** | `mimin_gia_cong_v1` | ❌ | 2 | **0/2** |
| 6 | **`giao-hang-store`** | `mimin_giao_hang_v1` | ❌ | 5 | **0/5** |
| 7 | **`hoan-thien-store`** | `mimin_hoan_thien_v1` | ❌ | 2 | **0/2** |
| 8 | **`kho-mobile-store`** | `mimin_kho_mobile_v1` | ❌ | 2 | **0/2** |
| 9 | `kho-store` | `mimin_kho_vai_v2` | ⚠️ | 3 | 2/3 (no fetch) |
| 10 | **`khsx-store`** | `mimin_khsx_v1` | ❌ | 5 | **0/5** |
| 11 | `lenh-cat-store` | `mimin_lenh_cat_v2` | ✅ | 9 | 3/9 (CRUD OK, MauCongDoan/ChiPhi chưa) |
| 12 | **`qc-store`** | `mimin_qc_v1` | ❌ | 1 | **0/1** |

**Tổng**: 41 methods CRUD, chỉ **8/41** (19.5%) có sync Supabase.

### 2. ❌ `cong-no-store.tsx` có 3 bug nghiêm trọng

**Bug 1 - STORAGE_KEY sai format**:
```typescript
// Code hiện tại
const STORAGE_KEY = "mimin_phanCong_v1";  // ❌ camelCase

// Convention đúng (giống các store khác)
const STORAGE_KEY = "mimin_phan_cong_v1";  // snake_case
```
→ User cũ từ localStorage cũ sẽ mất data khi upgrade.

**Bug 2 - supabaseDelete sai tên bảng**:
```typescript
// Code hiện tại (line 86)
supabaseDelete("cong_no", id)  // ❌ Bảng "cong_no" CHƯA TỒN TẠI trong DB

// Đúng theo schema
supabaseDelete("phan_cong", id)  // ✅ Bảng "phan_cong" có trong DB
```

**Bug 3 - KHÔNG sync CRUD methods**:
- `themPhanCong` → KHÔNG sync
- `themThanhToan` → KHÔNG sync
- `capNhatPhanCong` → KHÔNG sync
- Chỉ `xoaPhanCong` mới sync (nhưng sync SAI bảng)

### 3. ⚠️ Bug trong `bang-luong-engine.ts`

**Bug 1 - `ngayTra` sai khi tháng = 12**:
```typescript
// Code hiện tại (line 116)
const ngayTra = `${nam}-${String(thang + 1).padStart(2, "0")}-05`;
// Nếu thang = 12 → "2026-13-05" (SAI FORMAT!)
```

**Bug 2 - `soLuongVuot` có thể vô lý**:
```typescript
const soLuongVuot = Math.max(0, soLuongDat - soLuongGiao);
```
→ NV làm nhiều hơn giao → thưởng 20% đơn giá. Nhưng nếu NV cố tình làm nhiều hơn thì sao? Có nên cap?

**Bug 3 - `LUONG_CUNG_DEFAULT` keys không cover hết**:
```typescript
const LUONG_CUNG_DEFAULT = {
  "Content - Media": 8_000_000,
  "QL Khách hàng Sỉ": 7_000_000,
  "Kế toán điều phối SX": 8_000_000,
  "Nhân viên Kho": 7_000_000,
  "Media": 10_000_000,
};
```
→ Nếu có NV thuộc `boPhan` mới (không có trong dict) → sẽ lương SP (donGia=0 nếu không có).

### 4. ⚠️ `use-bang-luong.ts` KHÔNG sync từ Supabase

```typescript
// Hook chỉ đọc localStorage
const raw = localStorage.getItem(key);  // ❌ Không fetch từ Supabase
```
→ Multi-device sync cho bảng lương: **KHÔNG hoạt động**.

### 5. ⚠️ Hook `useBangLuongData` skip data thiếu `nguoiNhan`

```typescript
if (row.nguoiNhan) {  // ❌ Nếu không có nguoiNhan → skip
  allRows.push(row);
}
```
→ Nếu workflow thật từ Supabase có field khác (`nguoiMa`, `assignee`) → sẽ miss.

---

## 🔧 ĐỀ XUẤT FIX (theo priority)

### 🔴 P0 - URGENT (block sếp Sang nhập data)

1. **Fix `cong-no-store.tsx`** - 3 bugs trên (1 commit)
2. **Sync `doi-soat-store.tsx`** - thêm upsert/delete (1 commit)
3. **Sync `gia-cong-store.tsx`** - thêm upsert/delete (1 commit)
4. **Sync `giao-hang-store.tsx`** - thêm upsert/delete (1 commit)
5. **Sync `hoan-thien-store.tsx`** - thêm upsert/delete (1 commit)
6. **Sync `khsx-store.tsx`** - thêm upsert/delete (1 commit)
7. **Sync `qc-store.tsx`** - thêm upsert/delete (1 commit)
8. **Sync `kho-mobile-store.tsx`** - thêm upsert/delete (1 commit)
9. **Sync `danh-muc-sp-store.tsx`** - thêm upsert/delete + STORAGE_KEY (1 commit)
10. **Fix `bang-luong-engine.ts`** - ngayTra + LUONG_CUNG_DEFAULT (1 commit)

### 🟡 P1 - QUAN TRỌNG (sau khi sếp apply SQL)

11. **Apply `APPLY-MISSING-TABLES.sql`** (sếp Sang làm thủ công qua Supabase Dashboard)
12. **Update `use-bang-luong.ts`** - đọc từ Supabase thay vì chỉ localStorage
13. **Add validation** - tất cả input form cần validate (SĐT, email, tiền, ngày)

### 🟢 P2 - TỐI ƯU (sau khi system ổn định)

14. **Foreign Keys** - thêm FK cho các quan hệ chính
15. **Foreign key constraints** - add FOREIGN KEY cho tất cả quan hệ
16. **Add 2FA** - bảng `two_factor_configs` đã có nhưng chưa integrate đầy đủ
17. **Email notifications** - thông báo khi task trễ hạn, công nợ quá hạn

---

## 📊 THỐNG KÊ

| Metric | Giá trị |
|---|---|
| Tổng store localStorage | 12 |
| Store có sync Supabase | 3 (25%) |
| Store KHÔNG sync | 9 (75%) |
| Tổng methods CRUD | 41 |
| Methods có sync | 8 (19.5%) |
| Methods KHÔNG sync | 33 (80.5%) |
| Bug critical trong code | 8 |
| Số bảng DB thiếu (cần apply) | 9 |
| Số bảng thiếu RLS | 1 (vat_tu) |

---

## 🎯 ĐỀ XUẤT CHO SẾP SANG

Em đề xuất làm theo 2 giai đoạn:

### Giai đoạn 1 (1-2 giờ, ~5-7 commits)
- Fix tất cả bug trong code (cong-no-store, bang-luong-engine, use-bang-luong)
- Thêm sync Supabase cho 9 store còn lại
- Apply `APPLY-MISSING-TABLES.sql` (sếp làm thủ công)

### Giai đoạn 2 (1 giờ, ~3 commits)
- Thêm validation cho tất cả input
- Update hooks để sync từ Supabase
- Documentation

Sếp muốn em làm giai đoạn nào trước? Hay fix gọn 1 đợt tất cả?

---

## 📂 Files Audit
- `apps/web/audit-stores.mjs` (1.4KB) - Script audit store
- `apps/web/scripts/audit-stores-report.json` - Kết quả
- `AUDIT-SUPABASE-2026-08-05.md` (10.4KB) - Audit schema (turn trước)
- `AUDIT-STORES-2026-08-05.md` - Báo cáo này
