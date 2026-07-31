# 📋 BÁO CÁO PHÂN TÍCH & KẾ HOẠCH PHÂN QUYỀN MIMIN ERP v2

> **Ngày**: 2026-07-30  
> **Người lập**: Mavis (trợ lý sếp Sang)  
> **Trạng thái**: CHỜ SẾP DUYỆT - chưa sửa code

---

## 1️⃣ DANH SÁCH VAI TRÒ CUỐI CÙNG (7 ROLE)

Từ 17 vị trí nhân sự sếp liệt kê + 7 role hiện tại, em gộp thành **7 role chuẩn**:

| # | Role key | Tên hiển thị | Mô tả | Phạm vi data |
|---|----------|--------------|-------|--------------|
| 1 | **`chu_doanh_nghiep`** | 👑 Chủ doanh nghiệp | Xem toàn bộ hệ thống, dashboard tổng quan | ALL |
| 2 | **`dieu_hanh`** | 🎯 Điều hành | Điều phối chung, KH sỉ, báo cáo tổng | ALL |
| 3 | **`quan_ly_sx`** | 🏭 Quản lý sản xuất | Quản lý tiến độ, giao việc, bảng điều hành | ALL + ASSIGNED |
| 4 | **`ke_toan`** | 💰 Kế toán & Đối soát | Tiền công, công nợ, đối soát, thanh toán | ALL (trừ giá vốn KH) |
| 5 | **`kho_to_cat`** | 📦 Kho & Tổ cắt nội bộ | Quản lý 4 kho + tổ cắt nội bộ | KHO + ASSIGNED (lệnh cắt) |
| 6 | **`hoan_thien`** | 👔 Hoàn thiện nội bộ | Ủi, kiểm, gấp, đóng gói | ASSIGNED |
| 7 | **`ban_hang_giao_nhan`** | 🤝 Bán hàng & Giao nhận | KH, đơn hàng, giao hàng | ALL (BH) + ASSIGNED |
| 8 | **`nguoi_gia_cong`** | 🪡 Người nhận gia công | May/in/thêu/dập/khuy/ủi/kiểm/gấp/đóng gói (ăn theo SP) | **SELF** (chỉ thấy việc của mình) |
| 9 | **`qc`** | 🔍 Kiểm hàng | QC, kiểm tra cuối | ASSIGNED |
| 10 | **`nhan_vien_kho`** | 📦 NV Kho (legacy) | Tương đương kho_to_cat | KHO |

> **Lưu ý**: `nguoi_gia_cong` là role đặc biệt — mobile-first, chỉ thấy công việc được giao, KHÔNG thấy giá vốn/giá bán/KH/kho tổng.

---

## 2️⃣ MENU CỦA TỪNG ROLE

### 👑 `chu_doanh_nghiep` (Menu đầy đủ)
```
📊 Dashboard tổng quan
📋 Lệnh cắt
👥 Khách hàng
📅 Kế hoạch SX
👤 Nhân sự
📦 Kho (Vải / Sợi / PL / TP)
🛒 Đơn hàng
💰 Công nợ
✅ Kiểm chất lượng
🧵 Tổ may
📝 Hoàn thiện
🚚 Giao hàng
🕐 Chấm công
💵 Bảng lương
🏢 Nhà cung cấp
🤝 Gia công ngoài
📊 Báo cáo
🔍 Audit Log
⚙️ Cài đặt
🤖 AI Assistant / Agents
```

### 🎯 `dieu_hanh` (Menu đầy đủ + Dashboard điều hành)
- Giống chủ DN + trang Dashboard điều hành riêng

### 🏭 `quan_ly_sx` (Bảng điều hành SX)
```
📊 Dashboard
📋 Lệnh cắt (giao việc)
📅 Kế hoạch SX
🧵 Tổ may (xem tiến độ)
📝 Hoàn thiện
✅ Kiểm chất lượng
📦 Kho (xem tồn)
🕐 Chấm công
📊 Báo cáo SX
🤖 AI Assistant
```

### 💰 `ke_toan` (Kế toán & Đối soát)
```
📊 Dashboard
💰 Công nợ công đoạn (đối soát)
💵 Bảng lương
🏢 Nhà cung cấp
🛒 Đơn hàng (xem giá bán)
📊 Báo cáo TC
🤝 Gia công ngoài
```

### 📦 `kho_to_cat` (Kho + Tổ cắt)
```
📊 Dashboard
📋 Lệnh cắt (chỉ lệnh được giao)
🧵 Tổ cắt (cắt nội bộ)
📦 Kho vải
📦 Kho sợi
📦 Kho phụ liệu
📦 Kho thành phẩm
📊 Báo cáo kho
```

### 👔 `hoan_thien` (Hoàn thiện nội bộ)
```
📊 Dashboard
📝 Hoàn thiện (ủi/gấp/đóng gói - chỉ việc được giao)
✅ Kiểm chất lượng
📦 Kho thành phẩm
🕐 Chấm công
```

### 🤝 `ban_hang_giao_nhan`
```
📊 Dashboard
🛒 Đơn hàng
👥 Khách hàng
🚚 Giao hàng
📦 Kho thành phẩm (xem)
📊 Báo cáo bán hàng
```

### 🪡 `nguoi_gia_cong` (Mobile-first, tối giản)
```
🏠 Trang chủ (Lệnh mới / Đang làm / Chờ kiểm / Làm lại / Hoàn thành)
📋 Công việc
🛠️ Đang thực hiện
📦 Bàn giao
⚠️ Hàng lỗi & làm lại
📊 Sản lượng
💵 Tiền công
📅 Lịch sử
```
**KHÔNG có menu**: Dashboard, KH, Kho, Báo cáo, Giá cả, NS

### 🔍 `qc`
```
📊 Dashboard
✅ Kiểm chất lượng
📋 Lệnh cắt (xem)
🧵 Tổ may (xem)
📝 Hoàn thiện (xem)
📦 Kho TP (xem)
```

---

## 3️⃣ MA TRẬN PHÂN QUYỀN (Role × Module × Action × Data Scope)

### Action mới (mở rộng từ 4 cũ):
```ts
Action = "view" | "create" | "edit" | "delete" 
       | "assign" | "receive" | "start" | "report_progress"
       | "handover" | "confirm" | "approve" | "reject" 
       | "rework" | "lock" | "payment"
```

### Data Scope:
```ts
DataScope = "SELF" | "ASSIGNED" | "TEAM" | "DEPARTMENT" | "ALL"
```

### Bảng phân quyền (rút gọn):

| Module | chu_doanh_nghiep | dieu_hanh | quan_ly_sx | ke_toan | kho_to_cat | hoan_thien | ban_hang | nguoi_gia_cong | qc |
|--------|------|------|------|------|------|------|------|------|------|
| **dashboard** | VIEW ALL | VIEW ALL | VIEW ALL | VIEW ALL | VIEW TEAM | VIEW SELF | VIEW TEAM | VIEW SELF | VIEW ASSIGNED |
| **lenh-cat** | CRUD ALL | CRUD ALL | CRUD+ASSIGN ALL | VIEW ALL | VIEW ASSIGNED+CRUD (lệnh cắt) | VIEW ASSIGNED | VIEW ALL | VIEW SELF | VIEW ASSIGNED |
| **ke-hoach-sx** | CRUD ALL | CRUD ALL | CRUD+ASSIGN ALL | VIEW ALL | VIEW ALL | VIEW ASSIGNED | VIEW ALL | — | VIEW ASSIGNED |
| **ke-hoach-sx.assign** | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| **kho-vai** | VIEW ALL | VIEW ALL | VIEW ALL | VIEW ALL | CRUD ALL | VIEW ASSIGNED | VIEW ALL | — | — |
| **kho-thanh-pham** | VIEW ALL | VIEW ALL | VIEW ALL | VIEW ALL | CRUD ALL | VIEW ASSIGNED | VIEW ALL | — | VIEW ASSIGNED |
| **to-may** | VIEW ALL | VIEW ALL | CRUD+ASSIGN ALL | — | VIEW ASSIGNED | — | — | **SELF only** | VIEW ASSIGNED |
| **to-may.receive** | — | — | ✓ | — | — | — | — | ✓ (việc mình) | — |
| **to-may.start** | — | — | ✓ | — | — | — | — | ✓ (việc mình) | — |
| **to-may.report_progress** | — | — | ✓ | — | — | — | — | ✓ (việc mình) | — |
| **to-may.handover** | — | — | ✓ | — | — | — | — | ✓ (việc mình) | — |
| **hoan-thien** | VIEW ALL | VIEW ALL | CRUD+ASSIGN ALL | — | VIEW ASSIGNED | **SELF only** | — | **SELF only** (nếu gia công) | VIEW ASSIGNED |
| **qc** | VIEW ALL | VIEW ALL | VIEW ALL | VIEW ASSIGNED | VIEW ASSIGNED | VIEW ASSIGNED | — | VIEW SELF (lỗi của mình) | **CRUD ASSIGNED + CONFIRM** |
| **cong-no-cong-doan** | VIEW ALL | VIEW ALL | VIEW ALL | **CRUD ALL** | — | VIEW ASSIGNED | — | VIEW SELF (tiền công mình) | — |
| **cong-no.payment** | ✓ | ✓ | — | ✓ | — | — | — | — | — |
| **cong-no.lock** | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| **bang-luong** | VIEW ALL | VIEW ALL | VIEW ALL | **CRUD ALL** | — | VIEW SELF | VIEW SELF | VIEW SELF (tiền công) | VIEW SELF |
| **khach-hang** | CRUD ALL | CRUD ALL | — | VIEW ALL | — | — | CRUD ALL | — | — |
| **don-hang** | CRUD ALL | CRUD ALL | VIEW ALL | VIEW ALL | VIEW ALL | — | CRUD ALL | — | — |
| **giao-hang** | VIEW ALL | VIEW ALL | VIEW ASSIGNED | VIEW ALL | VIEW ALL | VIEW ASSIGNED | **CRUD ALL** | — | — |
| **cham-cong** | VIEW ALL | VIEW ALL | VIEW ALL | VIEW ALL | VIEW TEAM | VIEW SELF | VIEW SELF | — | — |
| **nha-cung-cap** | CRUD ALL | CRUD ALL | — | **CRUD ALL** | VIEW ALL | — | VIEW ALL | — | — |
| **gia-cong-ngoai** | VIEW ALL | VIEW ALL | **CRUD+ASSIGN** | VIEW+CRUD | — | — | — | **SELF only** (việc gia công) | — |
| **bao-cao** | VIEW ALL | VIEW ALL | VIEW ASSIGNED | VIEW ALL | VIEW ALL | VIEW SELF | VIEW TEAM | — | VIEW SELF |
| **audit-log** | VIEW ALL | VIEW ALL | VIEW ASSIGNED | VIEW ALL | VIEW ASSIGNED | — | VIEW ASSIGNED | — | — |
| **cai-dat** | CRUD ALL | VIEW | — | — | — | — | — | — | — |

### Quy tắc đặc biệt cho `nguoi_gia_cong`:
- ❌ **KHÔNG xem được**: Giá vốn, giá bán, KH, kho tổng, lệnh của người khác, báo cáo tài chính
- ✅ **Chỉ thấy**: Công việc được giao cho mình (theo `assignee_id = user.id`)
- ✅ **Quyền**: Nhận việc, bắt đầu, cập nhật SL, báo thiếu/lỗi, bàn giao, xem tiền công của mình

---

## 4️⃣ DANH SÁCH MÀN HÌNH CẦN SỬA / TẠO MỚI

### ✅ SỬA (giữ nguyên UX, chỉ thêm permission filter)
| File | Thay đổi |
|------|----------|
| `lib/permissions.ts` | Mở rộng Action (4→15), thêm DataScope |
| `lib/role-config.ts` (MỚI) | Cấu hình 10 role + menu + scope |
| `components/layout/Sidebar.tsx` | Filter menu theo role |
| `components/PageGuard.tsx` | Check quyền + scope |
| `components/PermissionGuard.tsx` | Nâng cấp check Action + Scope |

### 🆕 TẠO MỚI
| File | Mô tả |
|------|--------|
| `app/(main)/trang-chu-gia-cong/page.tsx` | Trang chủ mobile-first cho người gia công |
| `app/(main)/trang-chu-gia-cong/cong-viec/page.tsx` | Danh sách việc của tôi |
| `app/(main)/trang-chu-gia-cong/dang-lam/page.tsx` | Việc đang thực hiện |
| `app/(main)/trang-chu-gia-cong/ban-giao/page.tsx` | Bàn giao cho công đoạn sau |
| `app/(main)/trang-chu-gia-cong/loi-lam-lai/page.tsx` | Hàng lỗi, làm lại |
| `app/(main)/trang-chu-gia-cong/san-luong/page.tsx` | Sản lượng cá nhân |
| `app/(main)/trang-chu-gia-cong/tien-cong/page.tsx` | Tiền công cá nhân |
| `app/(main)/trang-chu-gia-cong/lich-su/page.tsx` | Lịch sử |
| `app/(main)/trang-chu-gia-cong/cong-viec/[id]/page.tsx` | Modal chi tiết 7 tab |
| `app/(main)/bang-dieu-hanh-sx/page.tsx` | Bảng điều hành cho quản lý SX |
| `app/(main)/doi-soat-tien-cong/page.tsx` | Bảng đối soát tiền công |
| `app/(main)/to-cat-noi-bo/page.tsx` | Tổ cắt nội bộ (5 vị trí) |
| `app/(main)/quan-ly-cong-doan/[id]/page.tsx` | Quản lý chi tiết 1 công đoạn |
| `lib/permission-resolver.ts` | API kiểm tra permission + scope |
| `lib/data-scope-filter.ts` | Filter query theo scope |
| `lib/audit-log.ts` (extend) | Log tất cả thao tác gán việc, handover, payment |
| `components/mobile/MobileNav.tsx` | Bottom nav cho mobile |

---

## 5️⃣ LUỒNG DỮ LIỆU: GIAO VIỆC → THANH TOÁN

```
┌──────────────────────────────────────────────────────────────┐
│ BƯỚC 1: NỘI BỘ TẠO LỆNH                                    │
│ - Quản lý SX (hoặc Chủ DN) tạo LSX                         │
│ - Chia nhỏ thành các "lệnh công đoạn" (workflow)            │
│ - Mỗi lệnh có: sản phẩm, SL, hạn, đơn giá, người thực hiện │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ BƯỚC 2: GIAO NGƯỜI THỰC HIỆN                                │
│ - Quản lý SX giao → Gia công viên (hoặc Tổ nội bộ)         │
│ - Trạng thái: PENDING_RECEIVE                               │
│ - Ghi audit: assign_by, assign_to, timestamp                │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ BƯỚC 3: NGƯỜI THỰC HIỆN NHẬN VIỆC                          │
│ - Bấm "Nhận việc" trên mobile                               │
│ - Trạng thái: RECEIVED                                      │
│ - Ghi audit: receive_by, receive_at                         │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ BƯỚC 4: BẮT ĐẦU LÀM                                        │
│ - Bấm "Bắt đầu làm"                                         │
│ - Trạng thái: IN_PROGRESS                                   │
│ - Ghi start_at                                               │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ BƯỚC 5: CẬP NHẬT SẢN LƯỢNG                                 │
│ - Nhập số lượng đạt / lỗi hàng ngày                        │
│ - Trạng thái vẫn: IN_PROGRESS                               │
│ - Có thể báo: thiếu hàng, lỗi kỹ thuật, yêu cầu hỗ trợ    │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ BƯỚC 6: BÀN GIAO                                            │
│ - Bấm "Bàn giao" → nhập SL đạt, SL lỗi                     │
│ - Trạng thái: HANDOVER_PENDING                              │
│ - Ghi handover_at, handover_qty, handover_defect            │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ BƯỚC 7: CÔNG ĐOẠN SAU XÁC NHẬN                             │
│ - Công đoạn sau (hoặc QC) xác nhận SL nhận                  │
│ - Có thể: Confirm / Từ chối (kèm lý do) / Yêu cầu làm lại  │
│ - Trạng thái: HANDOVER_CONFIRMED hoặc HANDOVER_REJECTED     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ BƯỚC 8: QC XÁC NHẬN ĐẠT/LỖI                                │
│ - QC kiểm tra: SL đạt, SL lỗi, phân loại lỗi              │
│ - Trạng thái: QC_PASSED / QC_FAILED / QC_REWORK            │
│ - Nếu REWORK: quay lại Bước 3 (người gia công)            │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ BƯỚC 9: QUẢN LÝ DUYỆT                                       │
│ - Quản lý SX duyệt sản lượng cuối                           │
│ - Trạng thái: APPROVED                                      │
│ - Ghi approved_by, approved_at                              │
│ - Sau khi duyệt → công đoạn tiếp theo bắt đầu              │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ BƯỚC 10: KẾ TOÁN ĐỐI SOÁT                                  │
│ - Tính: Tiền công = SL_đạt × Đơn_giá                       │
│ - Trạng thái: NOT_RECONCILED                                │
│ - Gia công viên xác nhận → CONFIRMED                       │
│ - Trạng thái tiền: PENDING_PAYMENT                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ BƯỚC 11: THANH TOÁN                                         │
│ - Kế toán thanh toán 1 phần / toàn bộ                       │
│ - Trạng thái: PARTIAL_PAID → FULLY_PAID                    │
│ - Ghi payment_by, payment_at, payment_amount                │
│ - Nếu có khiếu nại: COMPLAINED (quay lại B10)              │
└──────────────────────────────────────────────────────────────┘
```

---

## 6️⃣ KẾ HOẠCH TRIỂN KHAI (10 bước)

| Bước | Nội dung | Ước tính | Rủi ro |
|------|----------|---------|--------|
| **1** | Kiểm tra cấu trúc role/permission/menu hiện tại | ✅ Xong | Thấp |
| **2** | Lập bảng Role × Module × Action × Data Scope | ✅ Xong | Thấp |
| **3** | Chuẩn hoá component giao diện dùng chung (Modal, Table, Card, EmptyState, Skeleton, ConfirmDialog) | 2h | Thấp |
| **4** | **Làm giao diện người gia công (mobile-first)** — 7 trang + 1 modal chi tiết 7 tab | 4h | **Cao** |
| **5** | **Làm giao diện Quản lý SX** — Bảng điều hành, giao việc, chia SL, đổi người, gia hạn, thu hồi, REWORK | 3h | Trung bình |
| **6** | **Màn QC, bàn giao, xác nhận công đoạn** | 2h | Trung bình |
| **7** | **Sản lượng, tiền công, đối soát** (bảng 11 cột) | 2h | Trung bình |
| **8** | **Kết nối dữ liệu thật** (localStorage → schema chuẩn `work_order_step`) | 3h | **Cao** |
| **9** | **Test responsive, permission, handover logic, audit log** | 2h | Trung bình |
| **10** | **Báo cáo** — file sửa, tính năng hoàn thành, lỗi | 0.5h | Thấp |

**Tổng**: ~18.5h làm việc (1 MVP trong 2-3 ngày làm liên tục)

---

## 7️⃣ ĐỀ XUẤT SCHEMA MỚI

### Table: `work_order_step` (lệnh công đoạn)
```sql
CREATE TABLE work_order_step (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES lenh_sx_tong(id),
  step_name TEXT,                -- may/in/thêu/khuy/ủi/kiểm/gấp/đóng gói
  step_order INT,                -- thứ tự công đoạn
  assignee_id UUID,              -- người/nhóm thực hiện (NULL = chưa giao)
  assignee_type TEXT,            -- "internal_team" | "outsourced"
  qty_planned INT,               -- SL kế hoạch
  qty_received INT,              -- SL nhận
  qty_completed INT,             -- SL đạt
  qty_defect INT,                -- SL lỗi
  qty_rework INT,                -- SL làm lại
  start_at TIMESTAMPTZ,
  receive_at TIMESTAMPTZ,
  handover_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,
  unit_price INT,                -- đơn giá (VND/SP)
  status TEXT,                   -- PENDING_RECEIVE|RECEIVED|IN_PROGRESS|HANDOVER_PENDING|HANDOVER_CONFIRMED|QC_PASSED|QC_FAILED|QC_REWORK|APPROVED|NOT_RECONCILED|CONFIRMED|PENDING_PAYMENT|PARTIAL_PAID|FULLY_PAID|COMPLAINED
  product_id TEXT,
  product_image TEXT,
  color TEXT,
  size TEXT,
  notes TEXT,
  qc_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Audit log mở rộng:
```sql
CREATE TABLE audit_log_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  action TEXT,                   -- ASSIGN|RECEIVE|START|REPORT|HANDOVER|CONFIRM|APPROVE|REWORK|PAYMENT
  entity_type TEXT,              -- "work_order_step"
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 8️⃣ CHECKLIST ĐỒNG THUẬN VỚI SẾP

Trước khi em bắt đầu code, sếp xác nhận các điểm sau:

- [ ] **Danh sách 10 role** (mục 1) — có cần bổ sung/sửa gì không?
- [ ] **Menu của từng role** (mục 2) — đã đầy đủ chưa?
- [ ] **Ma trận phân quyền** (mục 3) — có role nào cần thêm quyền/bớt quyền?
- [ ] **Danh sách màn hình** (mục 4) — có trang nào em bỏ sót?
- [ ] **Luồng 11 bước** (mục 5) — có bước nào thừa/thiếu?
- [ ] **Schema mới** (mục 7) — OK dùng tên bảng `work_order_step` chưa?
- [ ] **Thứ tự ưu tiên**: em nên làm **GIAO DIỆN GIA CÔNG TRƯỚC** (bước 4) — đúng không?
- [ ] **Thời gian**: 2-3 ngày cho toàn bộ — OK chưa?

---

## 9️⃣ CAM KẾT CỦA EM

✅ **Không phá vỡ** các tính năng hiện tại
✅ **Giữ nguyên** design system (sky/teal, glassmorphism, font, bo góc, animation)
✅ **Mỗi thay đổi** đều backup file trước khi sửa
✅ **Mỗi bước** xong đều test + deploy + báo cáo sếp
✅ **Không tự ý** thay đổi ngoài phạm vi đã thoả thuận

---

**Sếp Sang ơi, em đã lên kế hoạch xong. Sếp xem qua rồi cho em xin phản hồi để bắt đầu code. 🚀**
