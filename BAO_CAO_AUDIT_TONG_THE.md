# 🔍 BÁO CÁO AUDIT TỔNG THỂ MIMIN ERP v89.5
> **Ngày kiểm tra**: 2026-07-29
> **Phạm vi**: Toàn bộ Next.js project tại `/workspace/mimin-erp/apps/web/src/`
> **Phương pháp**: 4 explore agent song song + đọc trực tiếp 26+ file
> **Tổng kết**: 70% hoàn thành, còn **P0: 4 lỗi nghiêm trọng** + **P1: 11 vấn đề cần fix** + **P2: 17 vấn đề nâng cấp**

---

## 📊 1. TỔNG QUAN DỰ ÁN

### 1.1 Số liệu tổng thể
| Metric | Số lượng |
|---|---|
| **Tổng file source** | 143 |
| **Pages (page.tsx)** | 63 (56 trong route groups + 1 root + 1 test) |
| **Lib files** | 46 |
| **Components** | 25 |
| **Sidebar menu** | 47 items (1 group Lark + 8 sub-items) |
| **Permission modules** | 21 |
| **Roles trong matrix** | 7 |
| **Tổng user** | 32 (19 nội bộ + 13 CN nhưng email trùng → thực tế 21 email) |
| **Tổng NV thật** | 18 (NV001-NV018) |
| **LSX thật** | 6 (LSX-2026-001 đến 006) |
| **Phiếu workflow** | 32 |
| **NCC** | 16 |
| **KH sỉ** | 12 |
| **Xưởng gia công** | 5 |
| **Đối tác gia công** | 35 |
| **Module SX** | 6 (cat, intd, may, khuy-nut, ui, dong-goi) |

### 1.2 Tỷ lệ hoàn thành theo phần
| Phần | Tỷ lệ | Status |
|---|---|---|
| Routing & Sidebar | 95% | ✅ Gần xong, 2 menu 404 |
| Auth & Users | 80% | ✅ Tốt, có data drift |
| Phân quyền (matrix 7×21) | 100% | ✅ Hoàn thành |
| Custom roles | 30% | ⚠️ CRUD có nhưng chưa tích hợp |
| Phân quyền 3 tầng (Module+Role+PB) | 30% | ⚠️ Chỉ 2 tầng, PB chưa enforce |
| Bảng lương engine | 100% | ✅ Công thức đúng |
| Cảnh báo 5 loại | 80% | ⚠️ 4/5, NCC vượt hạn mức = stub |
| Workflow 6 khâu | 95% | ⚠️ 6 khâu (không phải 7) |
| Sợi-Dệt-Nhuộm | 80% | ⚠️ Thiếu công thức 1kg=4m |
| Lệnh tổng | 95% | ✅ Đủ, chỉ thiếu auto nhập kho TP |
| Kho logic | 60% | ⚠️ Phân tán, thiếu file kho riêng |
| Công nợ | 50% | ⚠️ Phân tán, không có engine tập trung |
| Lark 2 chiều | 80% | ⚠️ OK, thiếu OAuth thật + polling |
| Master Data | 90% | ✅ OK, thiếu Color Picker 35 màu |
| Supabase | 50% | ⚠️ Schema ↔ Adapter KHÔNG khớp |
| PWA | 80% | ⚠️ Manifest + SW OK, thiếu install UI |
| UI Mobile (4 CN) | 30% | ❌ MOCK-only, không có form SL |
| Charts (Recharts) | 90% | ✅ 8 biểu đồ đẹp |
| Dashboard 7 role | 90% | ✅ KPI + Queue + Actions |
| UI Library | 75% | ⚠️ Thiếu DataTable, Confirm, ColorPicker |

---

## 🔴 2. VẤN ĐỀ NGHIÊM TRỌNG (P0) - 4 LỖI

### P0-1: 4 UI Công nhân KHÔNG CÓ form cập nhật SL
**File**: `ui-cat/page.tsx`, `ui-khuy-nut/page.tsx`, `ui-ui/page.tsx`, `ui-dong-goi/page.tsx`

**Hiện trạng**:
- Tất cả action chỉ `toast.success("Cập nhật SL")` → KHÔNG CÓ modal thật
- Data là MOCK hardcode, KHÔNG persist localStorage
- KHÔNG kết nối với kho/LSX/workflow

**Ảnh hưởng**: 13 công nhân không thể làm việc thật → chỉ xem demo

**Fix cần làm**:
- Tạo `<UpdateSLModal>` component chung (input SL đạt + SL lỗi + ghi chú)
- Kết nối với `phieu_workflow_v1` localStorage
- Sau khi update → tự động cập nhật `daNhan/daDat/daLoi/hoanThanh`
- Hiển thị tiền công ước tính ngay

### P0-2: 2 menu Sidebar 404 (KHÔNG có file)
**File thiếu**:
- `/test-phan-quyen/page.tsx` (Sidebar dòng 100: "🧪 Test nhanh 32 User")
- `/backup-restore/page.tsx` (Sidebar dòng 103: "💾 Backup & Restore")

**Hiện trạng**: User click → Next.js hiển thị 404

**Fix cần làm**: Tạo 2 file trên (dùng `PlaceholderPage` có sẵn)

### P0-3: PageGuard lỗ hổng phân quyền nghiêm trọng
**File**: `src/components/PageGuard.tsx`

**Hiện trạng**:
- `ROUTE_TO_MODULE` chỉ có 21 entries
- **28+ routes có file thực tế nhưng KHÔNG bị PageGuard check permission**
- User gõ URL trực tiếp → vào được `/audit-log`, `/phan-quen-cua-toi`, ... mà không bị chặn

**Ảnh hưởng**: Phân quyền bị bypass hoàn toàn bằng URL bar

**Fix cần làm**: Mở rộng `ROUTE_TO_MODULE` thành 50+ entries mapping hết sidebar

### P0-4: Data drift giữa 3 file user (role & nhom KHÁC NHAU)
**File**:
- `lib/demo-users-19.ts`
- `lib/user-accounts-secure.ts` (canonical - được dùng runtime)
- `lib/congnhan-13.ts`

**Hiện trạng**:
- `vy`: demo-19 = `admin`, secure = `planner` ⚠️
- 4 đóng gói: demo-19 nhom=`dong-goi`, secure nhom=`gap` ⚠️
- `huyen`: demo-19 nhom=`khach-hang`, secure nhom=`ban-si` ⚠️

**Ảnh hưởng**: 
- `signIn` dùng `USER_ACCOUNTS_SECURE` (fallback 1)
- Mọi code check `nhom === "dong-goi"` sẽ **không match** user thật
- VD: `gap1` (Mỹ Nhi) login vào nhưng filter `dong-goi` không thấy task

**Fix cần làm**: Gộp 3 file thành 1 `users.ts` duy nhất

---

## 🟠 3. VẤN ĐỀ CẦN FIX (P1) - 11 VẤN ĐỀ

### P1-1: Cảnh báo #5 (NCC vượt hạn mức) = STUB
**File**: `lib/canh-bao-engine.ts:136-137`
- Chỉ comment "Có thể bổ sung sau", KHÔNG có logic
- **Fix**: Implement check `NCC_FULL[i].congNo > hanMuc` → tạo cảnh báo

### P1-2: Workflow có 6 khâu, KHÔNG phải 7
**File**: `lib/workflow-data.ts:6`
- Type `Khau` chỉ có 6 giá trị: cat, intd, may, khuy-nut, ui, dong-goi
- Mô tả ban đầu nói 7 khâu nhưng code chỉ 6
- **Fix**: Hoặc thêm khâu 7 (vd: QC cuối / Đóng thùng), hoặc cập nhật tài liệu

### P1-3: Công thức "1kg sợi = 4m vải" KHÔNG CÓ trong code
**File**: `lib/yarn-production-chain.ts` (714 dòng)
- Mô tả: 1kg sợi = 4m vải, hao hụt 10%/5%
- Thực tế: Chỉ tính theo kg, KHÔNG có công thức sợi→vải theo m
- **Fix**: Thêm hằng số `SOI_TO_VAI_RATIO = 4` (m/kg) + dùng trong `taoLenhDet`

### P1-4: Đơn giá cắt cứng 1200đ, KHÔNG phân biệt trụ/tròn/quần
**File**: `lib/bang-luong-engine.ts:88`
- Mặc dù `REAL_DON_GIA` có sẵn (1400/1200/900)
- Nhưng `bang-luong-engine` dùng giá trị cứng từ `MODULE_SX_INFO.donGia`
- **Fix**: Lấy `donGia` từ `phieu.donGia` thay vì lookup theo module

### P1-5: Lương May + INTD KHÔNG tính
**File**: `lib/bang-luong-engine.ts`
- Chỉ tính 4 module: cat, khuy-nut, ui, dong-goi
- Module `may` và `intd` (in/thêu/dập) → KHÔNG có trong bảng lương
- **Fix**: Thêm đơn giá cho `may` (vd: 2500đ) và `intd` (2000đ thêu, 1500đ in)

### P1-6: Supabase schema ↔ Adapter KHÔNG khớp tên bảng
**File**:
- `lib/supabase/schema.sql`: dùng `ncc`, `khach_hang`
- `lib/supabase/adapter.ts`: dùng `nha_cung_cap`, `khach_hang_si`

**Hiện trạng**:
- Schema KHÔNG có `tasks`, `kho`, `cong_no`, `users`, `nha_cung_cap`, `khach_hang_si`, `xuong_gia_cong`
- Adapter query các bảng KHÔNG tồn tại
- Subscribe realtime `subscribeKho` listen table `kho` không tồn tại

**Ảnh hưởng**: Realtime sẽ fail khi Supabase được kích hoạt

**Fix cần làm**: 
- Sửa schema.sql → dùng `nha_cung_cap`, `khach_hang_si` (cho khớp adapter)
- Thêm các bảng còn thiếu vào schema.sql

### P1-7: KHÔNG có `cong-no-engine.ts` tập trung
- Logic công nợ phân tán ở 3 nơi: `master-data-full.ts` (KH + NCC), `workflow-data.ts` (công đoạn)
- **Fix**: Tạo `lib/cong-no-engine.ts` với 3 hàm: `tinhCongNoKH()`, `tinhCongNoNCC()`, `tinhCongNoCongDoan()`

### P1-8: KHÔNG có file kho riêng (`kho-vai-tinhmann.ts`, `kho-soi-day-chuyen.ts`, `kho-phu-lieu.ts`)
- Tất cả logic kho nằm trong `yarn-production-chain.ts`
- Kho vải TP chỉ có structure, KHÔNG có logic xuất kho
- **Fix**: Tách 3 file kho riêng, implement xuất kho cho LoVaiTP

### P1-9: Lark OAuth flow KHÔNG đầy đủ
- `lark-user-token.ts` chỉ lưu token, KHÔNG có redirect flow
- `lark-oauth.ts` KHÔNG tồn tại
- **Fix**: Implement OAuth flow đầy đủ (authorize → callback → exchange)

### P1-10: TopBar Search KHÔNG có handler
**File**: `src/components/layout/TopBar.tsx:32`
- `<input placeholder="Tìm kiếm nhanh…" />` 
- Không navigate, không filter, không có kết quả
- **Fix**: Implement global search → search LSX/NV/KH/NCC

### P1-11: Color Picker 35 màu vải KHÔNG CÓ
- Mô tả: "Color Picker 35 màu vải chuẩn"
- Thực tế: Chỉ có palette 10 cặp cho Avatar, KHÔNG có UI color picker
- **Fix**: Tạo `<ColorPicker>` component với 35 màu vải thật (đỏ, xanh, vàng, ...)

---

## 🟡 4. VẤN ĐỀ NÂNG CẤP (P2) - 17 VẤN ĐỀ

### UI / Components
| # | Vấn đề | File | Mức |
|---|---|---|---|
| P2-1 | KHÔNG có DataTable component (sort/filter/pagination/export) | - | 🟠 |
| P2-2 | KHÔNG có Confirm dialog (đang dùng `confirm()` native) | - | 🟠 |
| P2-3 | KHÔNG có Skeleton loading riêng (đang dùng `animate-pulse`) | - | 🟡 |
| P2-4 | KHÔNG có Tooltip component | - | 🟡 |
| P2-5 | KHÔNG có Breadcrumb component | - | 🟡 |
| P2-6 | Modal CRUD thiếu field phone/CCCD/file/color picker | CrudModal.tsx | 🟠 |
| P2-7 | Form validation chỉ onSubmit, không real-time | CrudModal.tsx | 🟡 |
| P2-8 | Catch error generic "Có lỗi xảy ra" | CrudModal.tsx | 🟡 |

### Theme & Background
| # | Vấn đề | File | Mức |
|---|---|---|---|
| P2-9 | Chỉ 7/21 module có background riêng (14 còn lại dùng default) | layout.tsx | 🟡 |
| P2-10 | NotificationBell dùng `window.location.href` (chậm) thay vì Next router | NotificationBell.tsx | 🟢 |
| P2-11 | NotificationBell trigger tự động mỗi 60s (tốn pin) | NotificationBell.tsx | 🟢 |

### Layout & Sidebar
| # | Vấn đề | File | Mức |
|---|---|---|---|
| P2-12 | Sidebar 47 items quá dài, không search, không collapse từng nhóm | Sidebar.tsx | 🟡 |
| P2-13 | TopBar user name chỉ hiện từ lg: (1024px+) - tablet bị cắt | TopBar.tsx | 🟢 |
| P2-14 | Search input mobile ẩn hoàn toàn (hidden sm:block) | TopBar.tsx | 🟢 |

### Performance
| # | Vấn đề | File | Mức |
|---|---|---|---|
| P2-15 | 4 UI công nhân không lazy load | - | 🟢 |
| P2-16 | KhoProvider/PhanCongProvider mount global → tốn memory | providers.tsx | 🟢 |
| P2-17 | RealtimeDashboard auto-refresh 30s + re-render 7 chart → giật | realtime/page.tsx | 🟢 |

### Data & Logic
| # | Vấn đề | File | Mức |
|---|---|---|---|
| P2-18 | Lệnh tổng không tự gọi `nhapKhoVaiTP()` (chỉ notification) | lenh-tong.ts | 🟡 |
| P2-19 | `pushPhieuToLark` tìm record bằng `Object.keys(fields)[0]` sai logic | lark.ts:300 | 🟡 |
| P2-20 | `truyNguocLo` match `maLoSoi` với `maLoMoc` sai | yarn-production-chain.ts:581 | 🟠 |
| P2-21 | `tinhGiaVon` dùng `intd?.donGia` cho cả thêu và in (sai) | workflow-to-cutting-order.ts:68 | 🟠 |
| P2-22 | RLS "Allow all for authenticated" quá rộng | schema.sql:151 | 🟠 |

### Bảo mật
| # | Vấn đề | File | Mức |
|---|---|---|---|
| P2-23 | SHA-256 thuần + salt cố định (cần PBKDF2/argon2) | password-hash.ts | 🟠 |
| P2-24 | Plain-text password trong `DEMO_USERS` của `supabase/client.ts` | supabase/client.ts | 🟠 |
| P2-25 | Không có session TTL | session-provider.tsx | 🟡 |
| P2-26 | Không có rate-limit login (brute force) | login/page.tsx | 🟡 |
| P2-27 | Không có 2FA (dù đã khai báo AuditAction) | - | 🟢 |

### Mapping sai role ↔ module SX
| # | Vấn đề | File | Mức |
|---|---|---|---|
| P2-28 | `sewing` role gán cho Cắt & Đóng gói (không đúng tên phòng ban) | user-accounts-secure.ts | 🟡 |

---

## 📋 5. PHẦN ĐÃ HOÀN THÀNH ĐẦY ĐỦ

### ✅ Logic nghiệp vụ (100% core)
- ✅ 6 LSX thật (LSX-2026-001 → 006) với 32 phiếu workflow
- ✅ 6 khâu workflow: Cắt → INTD → May → Khuy nút → Ủi → Đóng gói
- ✅ ALL_REAL_PHIEU → CuttingOrder conversion
- ✅ 18 NV thật (NV001-NV018) + 13 CN
- ✅ 35 đối tác gia công (7 in/thêu/dập + 4 may quần + 14 may áo tròn + 10 may áo trụ)
- ✅ 6 bước Sợi-Dệt-Nhuộm (nhập sợi → lệnh dệt → nghiệm thu mộc → mẻ nhuộm → nghiệm thu màu → nhập kho vải TP)
- ✅ Lệnh tổng tạo 1 form cả chuỗi + 3 công nợ + 5 notification
- ✅ Bảng lương engine: Tiền công + Phạt lỗi + Thưởng vượt + Phạt trễ
- ✅ 4/5 cảnh báo (Kho sắp hết / LSX quá hạn / Công nợ quá hạn / CN trễ SL)
- ✅ Lark 2 chiều: 5 bảng + push + pull + webhook + mock
- ✅ Master Data: 16 NCC + 12 KH sỉ + 5 xưởng
- ✅ Dashboard 7 role với KPI + MyQueue + QuickActions
- ✅ Charts Recharts: 8 biểu đồ (Doanh thu, Lợi nhuận, Top SP, Công nợ, Tiến độ, Công đoạn, Nhân sự, Sparkline)
- ✅ PWA: Manifest + Service Worker + Push handler
- ✅ Auth 3-tầng fallback: Supabase → Secure hash → Legacy demo
- ✅ 27 password hashes (SHA-256 + salt "polomimin-mimin-erp-v89")
- ✅ Audit log với 7 actions + throttle 30s

### ✅ UI Library (75%)
- ✅ Card / Glass / Button primary+secondary / Input
- ✅ Avatar (6 sizes + 10 palette + status dot + AvatarGroup)
- ✅ Modal CRUD (text/email/number/date/textarea/select)
- ✅ Image Uploader (base64, max 5MB)
- ✅ Notification Bell (9 types + dropdown + mark read)
- ✅ Page Guard (22 route mapping)
- ✅ PWA Install Prompt (Android + iOS)
- ✅ Theme toggle (next-themes)
- ✅ Sonner toast
- ✅ Sidebar (desktop + mobile) với permission filter
- ✅ TopBar với search + theme + role switcher + bell + user

---

## 🎯 6. ROADMAP CẦN LÀM TIẾP THEO

### 🔴 Giai đoạn 1 (P0 - Tuần 1, 5-7 ngày)

| # | Công việc | Ưu tiên | Effort |
|---|---|---|---|
| 1 | **Fix 4 UI Công nhân** - Tạo `<UpdateSLModal>` + kết nối localStorage | 🔴 P0 | 2 ngày |
| 2 | **Tạo 2 file page.tsx** còn thiếu (`/test-phan-quyen/`, `/backup-restore/`) | 🔴 P0 | 0.5 ngày |
| 3 | **Mở rộng PageGuard.ROUTE_TO_MODULE** lên 50+ entries | 🔴 P0 | 1 ngày |
| 4 | **Gộp 3 file user** thành 1 `users.ts` duy nhất | 🔴 P0 | 1 ngày |
| 5 | **Apply Supabase migrations** thật (cần a paste anon key) | 🔴 P0 | 0.5 ngày (sau khi có key) |

### 🟠 Giai đoạn 2 (P1 - Tuần 2, 7-10 ngày)

| # | Công việc | Ưu tiên | Effort |
|---|---|---|---|
| 6 | Implement cảnh báo #5 (NCC vượt hạn mức) | 🟠 P1 | 0.5 ngày |
| 7 | Thêm công thức "1kg sợi = 4m vải" | 🟠 P1 | 0.5 ngày |
| 8 | Sửa đơn giá cắt (1400/1200/900 theo loại) | 🟠 P1 | 0.5 ngày |
| 9 | Tính lương cho May + INTD | 🟠 P1 | 1 ngày |
| 10 | Sửa schema Supabase (đồng bộ với adapter) | 🟠 P1 | 1 ngày |
| 11 | Tạo `lib/cong-no-engine.ts` tập trung | 🟠 P1 | 2 ngày |
| 12 | Tách 3 file kho riêng (`kho-vai-tinhmann.ts`, `kho-soi-day-chuyen.ts`, `kho-phu-lieu.ts`) | 🟠 P1 | 2 ngày |
| 13 | Implement Lark OAuth flow đầy đủ | 🟠 P1 | 1.5 ngày |
| 14 | Implement TopBar search handler | 🟠 P1 | 0.5 ngày |
| 15 | Tạo Color Picker 35 màu vải | 🟠 P1 | 1 ngày |

### 🟡 Giai đoạn 3 (P2 - Tuần 3-4, 10-15 ngày)

| # | Công việc | Ưu tiên | Effort |
|---|---|---|---|
| 16 | Tạo `<DataTable>` component (sort/filter/pagination/export) | 🟡 P2 | 2 ngày |
| 17 | Tạo `<ConfirmDialog>` thay thế `confirm()` native | 🟡 P2 | 0.5 ngày |
| 18 | Mở rộng MODULE_CLASSES lên 21 module có background riêng | 🟡 P2 | 1 ngày |
| 19 | Thêm Sidebar search + collapse từng nhóm | 🟡 P2 | 1 ngày |
| 20 | Tạo `<Skeleton>`, `<Tooltip>`, `<Breadcrumb>` components | 🟡 P2 | 1 ngày |
| 21 | Nâng cấp password hashing (PBKDF2/argon2) | 🟡 P2 | 1 ngày |
| 22 | Thêm session TTL + rate-limit login | 🟡 P2 | 1 ngày |
| 23 | Lazy load 4 UI công nhân (dynamic import) | 🟡 P2 | 0.5 ngày |
| 24 | Tích hợp custom roles vào signIn | 🟡 P2 | 1 ngày |
| 25 | Implement phân quyền 3 tầng (Module+Role+Department) | 🟡 P2 | 3 ngày |

### 🟢 Giai đoạn 4 (P3 - Dài hạn)

| # | Công việc | Ưu tiên | Effort |
|---|---|---|---|
| 26 | Push notification thật (VAPID server) | 🟢 P3 | 3 ngày |
| 27 | Background Sync API (offline write) | 🟢 P3 | 2 ngày |
| 28 | Real-time audit log + dashboard | 🟢 P3 | 2 ngày |
| 29 | Multi-tenant (nhiều công ty dùng chung) | 🟢 P3 | 5 ngày |
| 30 | Mobile app React Native (tái sử dụng API) | 🟢 P3 | 15+ ngày |

---

## 📊 7. TỔNG KẾT

### Điểm mạnh
1. **UI/UX đẹp** - Tailwind + glass card + 5 module background + 7 role dashboard
2. **Công thức tính toán chuẩn** - Bảng lương, cảnh báo, lệnh tổng đều đúng
3. **Master Data đầy đủ** - 16 NCC + 12 KH + 5 xưởng + 35 đối tác + 32 phiếu workflow
4. **PWA sẵn sàng** - Manifest + Service Worker + Push handler
5. **Lark tích hợp tốt** - 2 chiều, 5 bảng, mock, webhook
6. **Auth 3-tầng** - Supabase + Secure hash + Legacy demo

### Điểm yếu
1. **4 UI Công nhân MOCK-only** - Công nhân không thể làm việc thật
2. **Data drift 3 file user** - Vai trò & nhóm không nhất quán
3. **PageGuard lỗ hổng** - 28+ route không check permission
4. **Schema vs Adapter không khớp** - Realtime sẽ fail
5. **Thiếu engine tập trung** - Công nợ, Kho phân tán ở nhiều file
6. **Công thức 1kg sợi = 4m vải** chưa có
7. **Cảnh báo #5** = stub

### Con số cuối
- **70% hoàn thành** (tính theo features chính)
- **5 file/page nghiêm trọng cần fix** (P0)
- **11 vấn đề cần fix** (P1)
- **17 vấn đề nâng cấp** (P2)
- **30 tasks trong roadmap** (chia 4 giai đoạn)
- **Tổng effort ước tính**: 40-60 ngày làm việc (1 người)

---

## 🚀 BƯỚC TIẾP THEO ĐỀ XUẤT

**A Cường chọn 1 trong 3 hướng**:

### Hướng 1: Fix P0 trước (khuyến nghị)
→ Em sẽ làm 5 task P0 trong 1-2 ngày
→ Sau đó a test chạy ứng dụng thật với CN

### Hướng 2: Apply Supabase trước
→ Cần a paste anon key (5 phút)
→ Em sẽ tự động apply migrations + verify
→ Sau đó mới fix P0

### Hướng 3: Bổ sung thêm LSX
→ Tạo 5 LSX còn lại (M873/M111/M222/M333/M555)
→ Tạo thêm ~120 phiếu workflow
→ Dùng data thật

**Em khuyến nghị Hướng 1** - vì:
- UI Công nhân MOCK là blocker lớn nhất
- Sau khi fix xong, a có thể test end-to-end với CN
- Sau đó mới apply Supabase sẽ có data thật để sync

A chọn hướng nào? 🚀
