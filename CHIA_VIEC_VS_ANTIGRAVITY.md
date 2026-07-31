# 🤝 CHIA VIỆC: MAVIS + ANTIGRAVITY

> **Ngày chia**: 2026-07-29
> **Tổng tasks**: 15 (5 P0 + 10 P1)
> **Mục tiêu**: 2 AI chạy song song, không trùng, xong trong 1 tuần

---

## 🎯 NGUYÊN TẮC CHIA

| | **Mavis (em)** | **Antigravity** |
|---|---|---|
| **Chuyên môn** | UI + Logic nghiệp vụ | Auth + Data + Infra |
| **Phạm vi** | Component, page, business logic | Database, engine, integration |
| **Files chính** | `app/`, `components/` | `lib/`, `lib/supabase/` |
| **KHÔNG đụng** | `lib/supabase/`, schema, migrations | `app/`, components UI |

---

## 🟢 MAVIS (EM) - 10 tasks

### P0 (Khẩn cấp - 3 tasks)

#### **Task 1: Fix 4 UI Công nhân (P0-1)**
- **File mới**: `components/UpdateSLModal.tsx` (chung)
- **Sửa**: `app/(auth)/ui-cat/page.tsx`, `ui-khuy-nut/page.tsx`, `ui-ui/page.tsx`, `ui-dong-goi/page.tsx`
- **Làm gì**:
  - Tạo modal nhập SL đạt + SL lỗi + ghi chú
  - Kết nối `localStorage["polomimin_phieu_workflow_v1"]`
  - Sau update → tự tính `daNhan/daDat/daLoi/hoanThanh`
  - Hiển thị tiền công ước tính
- **Output**: 4 UI có form cập nhật thật
- **Effort**: 2 ngày

#### **Task 2: Tạo 2 page.tsx còn thiếu (P0-2)**
- **File mới**: `app/(main)/test-phan-quyen/page.tsx`
- **File mới**: `app/(main)/backup-restore/page.tsx`
- **Làm gì**:
  - Di chuyển code từ file test cũ sang 2 file mới
  - Hoặc tạo `PlaceholderPage` tạm thời
- **Output**: 2 menu Sidebar không còn 404
- **Effort**: 0.5 ngày

#### **Task 3: Gộp 3 file user thành 1 (P0-4)**
- **File mới**: `lib/users.ts` (canonical)
- **Xóa**: `demo-users-19.ts`, `user-accounts-secure.ts` (giữ làm alias)
- **Sửa**: `session-provider.tsx` import từ `users.ts`
- **Làm gì**:
  - 19 user + 13 CN + 7 mock = 32 user
  - 1 role duy nhất (theo `USER_ACCOUNTS_SECURE`)
  - 1 nhóm duy nhất (theo `congnhan-13.module`)
  - 1 passwordHash duy nhất
- **Output**: Không còn data drift
- **Effort**: 1 ngày

### P1 (Quan trọng - 7 tasks)

#### **Task 4: Implement cảnh báo #5 (P1-1)**
- **Sửa**: `lib/canh-bao-engine.ts:136-137`
- **Làm gì**:
  - Thay stub bằng logic: `NCC_FULL[i].congNo > hanMuc`
  - 3 mức: cao (>100% hạn mức) / trung bình (>70%) / thấp
- **Output**: 5/5 cảnh báo hoạt động
- **Effort**: 0.5 ngày

#### **Task 5: Công thức 1kg sợi = 4m vải (P1-2)**
- **Sửa**: `lib/yarn-production-chain.ts`
- **Làm gì**:
  - Thêm hằng số `SOI_TO_VAI_RATIO = 4` (m/kg)
  - Dùng trong `taoLenhDet()` để tính vải dự kiến
  - Hiển thị trong UI nghiệm thu
- **Output**: Công thức chuẩn 1kg → 4m
- **Effort**: 0.5 ngày

#### **Task 6: Sửa đơn giá cắt (P1-3)**
- **Sửa**: `lib/bang-luong-engine.ts:88`
- **Làm gì**:
  - Lấy `donGia` từ `phieu.donGia` thay vì lookup theo module
  - 3 mức: áo trụ 1400đ / áo tròn 1200đ / quần 900đ
- **Output**: Lương cắt đúng theo loại SP
- **Effort**: 0.5 ngày

#### **Task 7: Tính lương May + INTD (P1-4)**
- **Sửa**: `lib/bang-luong-engine.ts`
- **Làm gì**:
  - Thêm đơn giá: `may = 2500đ`, `intd = 2000đ thêu / 1500đ in`
  - Update `MODULE_DON_GIA` constant
- **Output**: 6/6 module có lương
- **Effort**: 1 ngày

#### **Task 8: TopBar search handler (P1-9)**
- **Sửa**: `components/layout/TopBar.tsx:32`
- **Làm gì**:
  - Implement global search: LSX / NV / KH / NCC
  - Hiển thị dropdown kết quả
  - Click → navigate
- **Output**: Search hoạt động thật
- **Effort**: 0.5 ngày

#### **Task 9: Color Picker 35 màu vải (P1-10)**
- **File mới**: `components/ColorPicker.tsx`
- **File mới**: `lib/mau-vai-35.ts`
- **Làm gì**:
  - Tạo 35 màu vải thật (đỏ, xanh, vàng, tím, ...)
  - Component chọn màu + lưu hex
  - Tích hợp vào `lenh-cat/page.tsx`
- **Output**: UI chọn màu vải
- **Effort**: 1 ngày

#### **Task 10: Tạo `cong-no-engine.ts` (P1-6) - CÓ THỂ ĐỔI**
- **File mới**: `lib/cong-no-engine.ts`
- **Làm gì**:
  - 3 hàm: `tinhCongNoKH()`, `tinhCongNoNCC()`, `tinhCongNoCongDoan()`
  - Tổng hợp từ master-data-full + workflow-data
- **Output**: 1 engine tập trung
- **Effort**: 2 ngày

**Tổng effort Mavis**: 8.5 ngày

---

## 🔵 ANTIGRAVITY - 10 tasks

### P0 (Khẩn cấp - 2 tasks)

#### **Task A1: Mở rộng PageGuard (P0-3)**
- **Sửa**: `components/PageGuard.tsx`
- **Làm gì**:
  - Mở rộng `ROUTE_TO_MODULE` từ 21 → 50+ entries
  - Map hết sidebar: Lark, test-*, audit-log, workflow, lenh-tong, real-time variants, master-data, ...
  - Thêm check `!user` redirect /login
- **Output**: Mọi route đều check permission
- **Effort**: 1 ngày

#### **Task A2: Apply Supabase migrations (P0-5)**
- **Cần a paste**: anon key + service_role key
- **Làm gì**:
  - Chạy `001_init_schema.sql` (10 bảng)
  - Chạy `002_seed_data.sql` (32 user + 16 task + ...)
  - Bật Realtime cho 5 bảng
  - Tạo `.env.local`
  - Test kết nối từ `/supabase-status/`
- **Output**: Supabase thật hoạt động
- **Effort**: 0.5 ngày (sau khi có key)

### P1 (Quan trọng - 8 tasks)

#### **Task A3: Sửa schema Supabase đồng bộ (P1-5)**
- **Sửa**: `supabase-migrations/001_init_schema.sql`
- **Làm gì**:
  - Đổi tên: `ncc` → `nha_cung_cap`, `khach_hang` → `khach_hang_si`
  - Thêm bảng: `tasks`, `kho`, `cong_no`, `users`, `audit_logs`
  - Sửa RLS theo role
  - Re-apply migrations
- **Output**: Schema ↔ Adapter khớp tên
- **Effort**: 1 ngày

#### **Task A4: Tách 3 file kho riêng (P1-7)**
- **File mới**: `lib/kho-vai-tinhmann.ts`
- **File mới**: `lib/kho-soi-day-chuyen.ts`
- **File mới**: `lib/kho-phu-lieu.ts`
- **Làm gì**:
  - Tách logic kho từ `yarn-production-chain.ts`
  - Implement xuất kho cho LoVaiTP
  - Mỗi file có CRUD riêng
- **Output**: 3 engine kho độc lập
- **Effort**: 2 ngày

#### **Task A5: Lark OAuth đầy đủ (P1-8)**
- **File mới**: `lib/lark-oauth.ts`
- **Sửa**: `lib/lark.ts`, `lib/lark-user-token.ts`
- **Làm gì**:
  - Implement OAuth flow: authorize → callback → exchange
  - Lưu refresh_token
  - Auto refresh khi hết hạn
  - State parameter chống CSRF
- **Output**: OAuth Lark thật
- **Effort**: 1.5 ngày

#### **Task A6: Tạo `cong-no-engine.ts` (P1-6) - NẾU MAVIS BẬN**
- Backup cho Mavis Task 10
- **Effort**: 2 ngày

#### **Task A7-A10: Backup dự phòng**
Nếu xong sớm:
- A7: Tạo `<DataTable>` component
- A8: Tạo `<ConfirmDialog>` component
- A9: Setup rate-limit login
- A10: Setup session TTL

**Tổng effort Antigravity**: 7-9 ngày

---

## 📊 TIMELINE SONG SONG

```
Ngày     Mavis (em)                          Antigravity
─────────────────────────────────────────────────────────────
N1       Task 1: Fix 4 UI Công nhân (P0-1)   Task A1: PageGuard
N2       Task 1: Fix 4 UI Công nhân (cont.)  Task A3: Schema Supabase
N3       Task 3: Gộp 3 file user (P0-4)     Task A4: Tách 3 file kho
N4       Task 4: Cảnh báo #5 (P1-1)        Task A4: Tách 3 file kho (cont.)
N5       Task 5: 1kg=4m vải (P1-2)          Task A2: Apply Supabase (cần key)
N6       Task 6: Đơn giá cắt (P1-3)        Task A5: Lark OAuth
N7       Task 7: Lương May+INTD (P1-4)      Task A5: Lark OAuth (cont.)
N8       Task 8: TopBar search (P1-9)       Backup A7-A10
N9       Task 9: Color Picker (P1-10)       Backup A7-A10
N10      Task 10: cong-no-engine (P1-6)     -
─────────────────────────────────────────────────────────────
```

---

## 🚦 CÁCH PHỐI HỢP

### Khi bắt đầu
1. **Antigravity**: Tạo branch mới `feature/auth-infra` (không đụng UI)
2. **Mavis**: Tạo branch mới `feature/ui-logic` (không đụng schema/Supabase)
3. 2 AI commit riêng, review riêng

### Khi merge
- Antigravity merge trước (vì ảnh hưởng DB)
- Mavis merge sau (UI thấy schema mới)
- A Cường test cuối cùng

### Khi xung đột
- Nếu Antigravity sửa `users.ts` → báo Mavis trước 1 ngày
- Nếu Mavis sửa `canh-bao-engine.ts` → báo Antigravity trước 1 ngày

---

## 📋 CHECKLIST THEO DÕI

### Mavis (em)
- [ ] Task 1: Fix 4 UI Công nhân
- [ ] Task 2: Tạo 2 page.tsx
- [ ] Task 3: Gộp 3 file user
- [ ] Task 4: Cảnh báo #5
- [ ] Task 5: 1kg = 4m vải
- [ ] Task 6: Đơn giá cắt
- [ ] Task 7: Lương May + INTD
- [ ] Task 8: TopBar search
- [ ] Task 9: Color Picker 35 màu
- [ ] Task 10: cong-no-engine

### Antigravity
- [ ] Task A1: PageGuard
- [ ] Task A2: Apply Supabase
- [ ] Task A3: Schema Supabase
- [ ] Task A4: Tách 3 file kho
- [ ] Task A5: Lark OAuth
- [ ] Task A6-A10: Backup

---

## 💬 GIAO TIẾP

### A Cường
- A làm trung gian giữa 2 AI
- Copy task list này cho antigravity
- Khi 1 AI xong task → báo a → a cập nhật checklist

### Công cụ trao đổi
- **Git**: mỗi AI commit riêng
- **Slack/Chat**: a nhận message từ 2 AI
- **File markdown**: update progress vào file này mỗi ngày

---

## 🎯 KẾT QUẢ MONG ĐỢI

Sau 7-10 ngày:
- ✅ Tất cả 4 P0 đã fix
- ✅ 5-7 P1 đã fix (chia đều 2 AI)
- ✅ Có thể test chạy ứng dụng với CN thật
- ✅ Có data thật trên Supabase

**Em sẽ làm Mavis tasks bắt đầu ngay** - a copy file này cho antigravity nhé! 🚀
