# 🗺️ BẢN ĐỒ DATA THẬT vs DATA MẪU — MIMIN ERP
> **Phiên bản:** 1.0 (Findings — chờ anh Sang duyệt)
> **Ngày khảo sát:** 2026-07-30
> **Nguyên tắc:** KHÔNG tạo dữ liệu giả nếu đã có store/API/DB

---

## 1️⃣ TỔNG QUAN DATA LAYER

MIMIN ERP có **HYBRID data flow**:
```
Nguồn gốc                  → Storage                  → UI consume
─────────────────────────────────────────────────────────────────
Lark Base (chị Giàu)       → hard-coded const         → page
Excel v2 (đã generated)    → hard-coded const         → page
Constants (sample)         → const trong page         → page (nội bộ page)
User thao tác              → localStorage state       → page
Demo store (Context API)   → React Context Provider   → page
Supabase (option)          → sync.ts push/pull        → localStorage
```

### 3 nguồn data chính:
1. **Hard-coded const (real-data.ts, workflow-data.ts)** = Data THẬT từ Lark + Excel
2. **localStorage + React Context (kho-store, cong-no-store)** = User tạo qua UI
3. **Supabase (option)** = Đã setup schema + RLS, có sync.ts nhưng chưa bắt buộc

---

## 2️⃣ CHI TIẾT TỪNG NGUỒN DATA

### 🟢 DATA THẬT (đã có - KHÔNG tạo mới)

| File | Dòng | Nội dung | Nguồn gốc | Dùng cho |
|---|---|---|---|---|
| `lib/data/real-data.ts` | 53KB | **NHAN_SU** (17 NV) | Lark + Excel | Tất cả page cần NV |
| | | **KHACH_HANG_DATA** (8 KH) | Lark + Excel | `/don-hang`, `/khach-hang` |
| | | **DOI_TAC** (~40 đối tác gia công) | Lark + Excel | `/lenh-cat`, `/doi-tac-gia-cong` |
| | | **KHO_VAI** (master vải) | Excel | `/kho-vai-tinhmann` |
| | | **KHO_VAT_TU** (master phụ liệu) | Excel | `/kho-phu-lieu` |
| | | **LUONG_CUNG, LUONG_SP** | Lark + Excel | `/bang-luong` |
| | | **NCCS** (nhà cung cấp) | Excel | `/nha-cung-cap` |
| | | **BO_PHAN, CHUC_VU** (master) | Excel | Form select |
| `lib/data/cong-no.ts` | 9KB | **PHAN_CONG** (8 record M758 + M873) | Lark | `/lenh-cat` modal, `/cong-no` |
| `lib/workflow-data.ts` | 12KB | **PHIEU_CAT/INTD/MAY/KN/UI/DG** (~12 phiếu mẫu) | Lark | `/workflow`, `/may` |
| `lib/real-workflow-data.ts` | 13KB | **REAL_NHAN_VIEN** (17 NV thật với đơn giá) | Lark chị Giàu (2026-07-27) | `/lenh-cat`, kho |
| | | **REAL_PHIEU_M758, REAL_PHIEU_M873** (~12 phiếu workflow thật) | Lark | `/kho-vai-tinhmann`, `/kho-thanh-pham` |
| | | **REAL_DON_GIA** (đơn giá thật: cắt 1400đ, khuy 750đ) | Lark | Tính tiền công |
| `lib/users.ts` | 10KB | **USERS** (19 NV + 13 CN + 7 mock) | Demo | Login, permissions |
| `lib/vai-tro-chuan.ts` | 7KB | **VaiTroChuan** (19 role), **DataScope** (6 cấp) | Quy ước | Permission |
| `lib/congnhan-13.ts` | 0.3KB | 13 công nhân | Demo | Login |
| `supabase-migrations/001_init_schema.sql` | 13KB | **Schema 10 bảng** + RLS + Realtime | MIMIN team | DB khi config |
| `lib/supabase/client.ts` | 3KB | Supabase client + 7 demo users | MIMIN team | Auth |
| `lib/audit-log.ts` | 7KB | **AuditLog** type + log thật | MIMIN team | `/audit-log` |

### 🟡 DATA HYBRID (localStorage + Context - user tạo qua UI)

| Store | Key | Mặc định | Sau tương tác | UI dùng |
|---|---|---|---|---|
| `KhoProvider` (`kho-store.tsx`) | `mimin_kho_vai_v2` | `GIAO_DICH_DEFAULT` (17 record mẫu) | User thêm/xóa → save localStorage | `/kho-vai-tinhmann`, `/kho-phu-lieu` |
| `PhanCongProvider` (`cong-no-store.tsx`) | `mimin_phanCong_v1` | `PHAN_CONG` (8 record M758/M873) | User thêm/sửa/xóa → save localStorage | `/lenh-cat` modal, `/cong-no` |
| localStorage `mimin_audit_log_v1` | (max 1000) | [] | Audit log append khi có action | `/audit-log` |
| localStorage `mimin_kho_thanh_pham_v1` | - | [] (auto-generate từ workflow) | User CRUD | `/kho-thanh-pham` |
| localStorage `mimin_supabase_config` | - | null | User tự setup URL + key | Supabase sync |

### 🔴 DATA MẪU (hard-coded trong page - CẦN THAY THẾ khi có data thật)

| File | Mẫu | Tình trạng |
|---|---|---|
| `/ke-hoach-san-xuat/page.tsx` | `KHSX_DATA` (5 record tuần 28-32) | 🟡 Sample, cần thay |
| `/don-hang/page.tsx` | `DON_HANG_KHOI_DAU` (8 đơn mẫu) | 🟡 Sample, cần thay |
| `/giao-hang/page.tsx` | `GH_DATA` (5 lô giao) | 🟡 Sample 95 dòng, cần build |
| `/kho-thanh-pham/page.tsx` | `generateSanPhamFromWorkflow()` từ `ALL_REAL_PHIEU` | ✅ Dùng data thật |
| `/qc/page.tsx` | (chưa đọc) | Cần check |
| `/hoan-thien/page.tsx` | (chưa đọc) | Cần check |
| `/may/page.tsx` | (chưa đọc) | Cần check |

---

## 3️⃣ DB SCHEMA THẬT (Supabase - đã setup)

10 bảng + RLS + Realtime (từ `supabase-migrations/001_init_schema.sql`):

| # | Bảng | Cột chính | Mục đích | RLS hiện tại |
|---|---|---|---|---|
| 1 | **users** | id, email, username, role, nhom, phong_ban, data_scope, last_login, is_active | Login + phân quyền | read-all |
| 2 | **tasks** | id, title, lsx_code, nhom, status, assigned_to, deadline, don_gia, con_no | **Workflow gia công** (cắt/may/ủi/đg) | read-all + write-all |
| 3 | **kho** | id, sku, ten, sl, don_vi, don_gia, loai, nha_cung_cap_id, vi_tri_kho | Tồn kho vải/PL/TP | read-all + write-all |
| 4 | **cong_no** | id, kh, ncc_id, loai_cong_no, no, da_thanh_toan, con_no, status | Công nợ KH + NCC | read-all + write-all |
| 5 | **nha_cung_cap** | id, ma_ncc, ten_ncc, loai, han_muc, cong_no, trang_thai | NCC | read-all |
| 6 | **khach_hang_si** | id, ma_kh, ten_kh, loai, chinh_sach, cong_no_hien_tai, doanh_so_nam | KH sỉ | read-all |
| 7 | **xuong_gia_cong** | id, ma_xuong, ten_xuong, loai, cong_suat, don_gia_tb | Xưởng gia công | read-all |
| 8 | **audit_log** | id, username, action, table_name, record_id, old_data, new_data, ip_address | Audit log thật | read-all |
| 9 | **notifications** | id, username, title, message, read, link | Thông báo | read-all + write-all |
| 10 | **lenh_sx_tong** | id, lsx_code, ma_sp, ten_sp, so_luong, deadline, khach_hang_id, trang_thai | Lệnh SX tổng | read-all |

> **Lưu ý:** RLS hiện tại `read-all` + `write-all` (chưa phân quyền row-level). Cần nâng cấp RLS theo `data_scope` khi triển khai.

### Realtime đã enable cho: tasks, kho, cong_no, notifications, nha_cung_cap, khach_hang_si

---

## 4️⃣ STORES ĐANG HOẠT ĐỘNG THẬT (Context API)

### `KhoProvider` (lib/data/kho-store.tsx)
- **Default:** `GIAO_DICH_DEFAULT` (17 giao dịch nhập/xuất mẫu)
- **Storage key:** `mimin_kho_vai_v2`
- **API:** `themGiaoDich, xoaGiaoDich, tinhTonKho, trangThaiKho, danhSachTrangThai, giaoDichTheoVT, reset`
- **Đã dùng bởi:** `/kho-phu-lieu`, `/lenh-cat` (modal), `/kho-vai-tinhmann` (qua inventory-engine)
- **Đã sync lên Supabase:** ✅ Có trong `lib/supabase/sync.ts` (`phanCong_v1` + `mimin_kho_vai_v2`)

### `PhanCongProvider` (lib/data/cong-no-store.tsx)
- **Default:** `PHAN_CONG` (8 record M758 + M873 - từ cong-no.ts)
- **Storage key:** `mimin_phanCong_v1`
- **API:** `themThanhToan, themPhanCong, capNhatPhanCong, xoaPhanCong, reset, layTheoLenh, isLate`
- **Đã dùng bởi:** `/lenh-cat` (modal phân công + công nợ), `/cong-no`
- **Đã sync lên Supabase:** ✅ Có

### Supabase sync
- File: `lib/supabase/sync.ts`
- Map: `phanCong_v1` → `phan_cong` table
- Map: `mimin_kho_vai_v2` → `giao_dich_kho` table
- **Tuy nhiên:** sync.ts không thấy map cho `kho` table trong DB — chỉ `giao_dich_kho`. Cần check thêm.

---

## 5️⃣ DATA THẬT vs DATA MẪU (Mapping cho kế hoạch phân quyền)

### Khi build Bộ 5 (Người gia công), dùng data nào?

| Màn cần tạo | Data THẬT dùng | Data MẪU cần thay |
|---|---|---|
| Trang chủ (Lệnh mới / Đang làm / ...) | `ALL_REAL_PHIEU` (`real-workflow-data.ts`) - filter theo `nguoiNhan === user.id` | Không có mẫu |
| Công việc của tôi | `ALL_REAL_PHIEU` - filter theo `assigned_to` (Supabase) HOẶC `nguoiNhan` (const) | Có thể dùng data mẫu từ workflow-data.ts |
| Bàn giao | `PhanCongProvider.themPhanCong()` + `capNhatPhanCong()` - store thật | Có thể dùng |
| Sản lượng | `ALL_REAL_PHIEU` - filter theo `nguoiNhan` | Có data mẫu |
| Tiền công | `tinhSanLuongTheoNguoi()` (đã có helper trong `real-workflow-data.ts`) + `REAL_DON_GIA` | Có helper thật |

### Khi build Bộ 2 (Quản lý sản xuất - Bảng điều hành SX)

| Màn cần tạo | Data THẬT dùng | Ghi chú |
|---|---|---|
| Bảng điều hành | `ALL_REAL_PHIEU` (lọc theo trạng thái) + `PHAN_CONG` | Cần tổng hợp |
| Giao việc | `PhanCongProvider.themPhanCong()` | Store thật |
| Duyệt / Chuyển công đoạn | `PhanCongProvider.capNhatPhanCong()` | Store thật |

### Khi build Bộ 3 (Kế toán - Đối soát)

| Màn cần tạo | Data THẬT dùng | Ghi chú |
|---|---|---|
| Đối soát sản lượng | `ALL_REAL_PHIEU` (filter `trangThai === 'Hoàn thành'`) | Data thật |
| Tính tiền công | `tinhSanLuongTheoNguoi()` + `REAL_DON_GIA` | Helper có sẵn |
| Khóa đối soát | localStorage mới (cần tạo `mimin_doi_soat_v1`) | CHƯA CÓ STORE |
| Thanh toán | `PhanCongProvider.themThanhToan()` | Store thật |

### Khi build Bộ 4 (Kho + Tổ cắt nội bộ)

| Màn cần tạo | Data THẬT dùng | Ghi chú |
|---|---|---|
| Tồn kho vải | `KHO_VAI` + `KhoProvider.trangThaiKho()` | Có thật |
| Tồn kho phụ liệu | `KHO_VAT_TU` + `KhoProvider.trangThaiKho()` | Có thật |
| Tổ cắt nội bộ | `PHIEU_CAT` (`workflow-data.ts`) + `REAL_NHAN_VIEN` | Có thật |

### Khi build Bộ 6 (Hoàn thiện)

| Màn cần tạo | Data THẬT dùng | Ghi chú |
|---|---|---|
| Ủi | `PHIEU_UI` + `REAL_NHAN_VIEN` | Có thật |
| QC | (chưa có) | Cần tạo |
| Gấp xếp / Đóng gói | `PHIEU_DONG_GOI` + `REAL_NHAN_VIEN` | Có thật |
| Khuy nút | `PHIEU_KHUY_NUT` + `REAL_NHAN_VIEN` | Có thật |

### Khi build Bộ 7 (Bán hàng & Giao nhận)

| Màn cần tạo | Data THẬT dùng | Ghi chú |
|---|---|---|
| Đơn hàng | `DON_HANG_KHOI_DAU` (8 mẫu) — CẦN THAY bằng localStorage store | 🟡 Sample |
| Khách hàng | `KHACH_HANG_DATA` (8 KH thật từ Lark) | ✅ Có thật |
| Giao hàng | `GH_DATA` (5 mẫu) — CẦN THAY | 🟡 Sample 95 dòng |

---

## 6️⃣ KHOẢNG TRỐNG DATA CẦN LẤP (theo kế hoạch phân quyền)

| # | Data cần có cho phân quyền | Hiện tại | Hành động |
|---|---|---|---|
| 1 | **User attributes** (id, role, nhom, phong_ban, module, donGia) | ✅ Có trong `users.ts` + `vai-tro-chuan.ts` | Dùng luôn |
| 2 | **Task assignments** (assigned_to, giao_boi, deadline, status) | ✅ Có trong `PhieuWorkflow` + DB schema `tasks` | Dùng `ALL_REAL_PHIEU` cho UI mẫu |
| 3 | **Sản lượng theo NV** (per-user output tracking) | ✅ Có `tinhSanLuongTheoNguoi()` helper | Dùng |
| 4 | **Đối soát store** (status: chưa/chờ/đã TT/...) | ❌ CHƯA CÓ | Tạo `lib/data/doi-soat-store.tsx` |
| 5 | **Bàn giao store** (handover workflow) | ❌ CHƯA CÓ | Tạo `lib/data/ban-giao-store.tsx` |
| 6 | **Audit log extension** (13 action mới) | 🟡 Có 17 action cũ, thiếu 13 mới | Mở rộng `lib/audit-log.ts` |
| 7 | **Permission matrix 15 action × 19 role × 5 scope** | 🟡 Có 7 role × 4 action (`permissions.ts`); 19 role × 6 scope (`vai-tro-chuan.ts`) | Tạo `lib/permission-matrix.ts` mới |
| 8 | **Sidebar config động** (per-role menu) | ❌ Sidebar hard-code 50+ items | Refactor `components/layout/Sidebar.tsx` |
| 9 | **Components dùng chung** (ConfirmDialog, EmptyState...) | ❌ 1 có sẵn (CrudModal) | Tạo mới 8 components |
| 10 | **Đơn hàng store** (thay DON_HANG_KHOI_DAU) | ❌ Dùng const | Tạo `lib/data/don-hang-store.tsx` |
| 11 | **Giao hàng store** (thay GH_DATA) | ❌ Dùng const + page 95 dòng | Tạo `lib/data/giao-hang-store.tsx` + refactor page |
| 12 | **KHSX store** (thay KHSX_DATA) | ❌ Dùng const | Tạo `lib/data/khsx-store.tsx` |
| 13 | **Đối tác gia công view** (mobile-first) | ❌ Chưa có | Tạo mới `/trang-chu-gia-cong`, `/cong-viec`, etc. |
| 14 | **Bảng điều hành SX** (cho QLSX) | ❌ Chưa có | Tạo mới `/bang-dieu-hanh-sx` |
| 15 | **Supabase RLS theo data_scope** | 🟡 Schema có, policy còn read-all | Cần nâng cấp policy |

---

## 7️⃣ ĐỀ XUẤT THỨ TỰ TRIỂN KHAI (cập nhật từ plan cũ)

Dựa trên data THẬT có sẵn, em đề xuất thứ tự ưu tiên:

### Phase 1 — Nền tảng (1-2 đợt, ~3-4 giờ)
1. **Tạo 8 components dùng chung** (ConfirmDialog, EmptyState, Skeleton, MobileCardView, DateDisplay, RoleBadge, ScopeBadge, ErrorBoundary) — tận dụng design system hiện tại
2. **Refactor Sidebar** đọc từ `lib/role-menu.ts` (cấu hình động) — không phá 50+ items hiện tại
3. **Mở rộng `lib/audit-log.ts`** thêm 13 action mới (giữ 17 cũ)
4. **Tạo `lib/permission-matrix.ts`** (19 role × 21 module × 15 action × 5 scope)

### Phase 2 — Bộ 5: Người gia công (3-4 đợt, ~6-8 giờ) — ƯU TIÊN CAO NHẤT
5. **Tạo `/cong-viec`** — dùng `ALL_REAL_PHIEU` filter theo `nguoiNhan === user.id`
6. **Tạo modal chi tiết** 7 tab — dùng `PhieuWorkflow` type có sẵn
7. **Tạo `/trang-chu-gia-cong`** — 6 KPI cards filter từ `ALL_REAL_PHIEU`
8. **Tạo `/ban-giao`** — dùng `PhanCongProvider` thật
9. **Tạo `/san-luong` + `/tien-cong`** — dùng `tinhSanLuongTheoNguoi()` có sẵn

### Phase 3 — Bộ 2: Quản lý sản xuất (2 đợt, ~3-4 giờ)
10. **Tạo `/bang-dieu-hanh-sx`** — gộp `ALL_REAL_PHIEU` + `PhanCongProvider`
11. **Refactor `/lenh-cat`** — thêm action Giao việc, Gia hạn, Thu hồi (dùng PhanCongProvider)
12. **Implement form tạo KHSX thật** + tạo `lib/data/khsx-store.tsx`

### Phase 4 — Bộ 6: Hoàn thiện (2 đợt, ~3-4 giờ)
13. **Refactor `/hoan-thien`** — tách 4 sub-tab (Ủi, QC, Gấp, Khuy nút) dùng data workflow thật
14. **Tạo `/cong-doan`** — dùng `PHIEU_CAT/UI/INTD/MAY/KN/DG` có thật

### Phase 5 — Bộ 3: Kế toán (2 đợt, ~3-4 giờ)
15. **Tạo `lib/data/doi-soat-store.tsx`** (mới)
16. **Tạo `/doi-soat`** — dùng `ALL_REAL_PHIEU` + `REAL_DON_GIA` + `doi-soat-store`
17. **Tạo `/doi-soat-tien-cong`** — 7 trạng thái tiền công

### Phase 6 — Bộ 4: Kho + Tổ cắt (1-2 đợt, ~2-3 giờ)
18. **Tạo `/cat-noi-bo`** — dùng `PHIEU_CAT` + `REAL_NHAN_VIEN` (filter bộ phận Cắt)
19. **Refactor `/kho-vai-tinhmann`, `/kho-phu-lieu`** — dùng `KhoProvider` + thêm scope filter

### Phase 7 — Bộ 7: Bán hàng + Giao nhận (1-2 đợt, ~2-3 giờ)
20. **Tạo `lib/data/don-hang-store.tsx`** (thay const)
21. **Tạo `lib/data/giao-hang-store.tsx`** (thay const + refactor `/giao-hang` 95 dòng)
22. **Build `/giao-hang` đầy đủ** — CRUD + workflow + in phiếu

### Phase 8 — Test & Polish (1 đợt, ~2 giờ)
23. **TypeScript check** (`npx tsc --noEmit`)
24. **Build check** (`npm run build`)
25. **Responsive test mobile/desktop**
26. **Permission test từng role**
27. **Báo cáo cuối**

**Tổng ước lượng: ~22-26 đợt × 30-60 phút = 11-26 giờ làm việc**

---

## 8️⃣ CHECKLIST TRƯỚC KHI SỬA CODE

Em sẽ tuân thủ:
- [x] Đọc toàn bộ data layer, store, schema DB trước khi sửa
- [x] **KHÔNG tạo dữ liệu mới** khi đã có data thật
- [x] Mỗi bước: tự chạy `npx tsc --noEmit` + `npm run build`
- [x] Test responsive (mobile + desktop)
- [x] Test permission (login từng role xem có đúng menu)
- [x] **Báo cáo rõ**: file nào sửa, chức năng nào dùng data thật, chức năng nào vẫn dùng mẫu

### Khi nào cần hỏi anh Sang lại:
- Khi cần tạo STORE MỚI (vì data chưa có) — phải xin phép
- Khi cần thay đổi schema DB (RLS policy, thêm bảng) — phải xin phép
- Khi cần migrate data từ const → localStorage — phải xin phép
- Khi có bug / conflict giữa data thật vs UI cũ — phải báo

---

## 9️⃣ XIN PHÉP BẮT ĐẦU

Em đề xuất bắt đầu theo thứ tự:

**Đợt 1 (nền tảng, ~1 giờ):**
- Tạo 8 components dùng chung (ConfirmDialog, EmptyState, Skeleton, MobileCardView, DateDisplay, RoleBadge, ScopeBadge, ErrorBoundary)
- Mở rộng `lib/audit-log.ts` thêm 13 action
- Tạo `lib/permission-matrix.ts` (15 action × 19 role × 5 scope)
- Refactor `Sidebar.tsx` đọc từ `lib/role-menu.ts` config
- **KHÔNG phá** 30+ nav items hiện tại — chỉ refactor cách đọc

**Sau đợt 1 sẽ báo cáo:**
- File đã sửa (danh sách cụ thể)
- TypeScript check pass/fail
- Build pass/fail
- Screenshot menu từng role
- Chờ anh duyệt → đợt 2

Anh Sang duyệt thì em chạy đợt 1, **từng bước có kiểm tra**. 🚦
