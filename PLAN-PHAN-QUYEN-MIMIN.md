# 📋 KẾ HOẠCH PHÂN QUYỀN MIMIN ERP v89.6.8
> **Phiên bản:** 1.0 (Draft — chờ anh Sang duyệt)
> **Ngày:** 2026-07-30
> **Nguyên tắc:** KHÔNG redesign UX/UI, tận dụng 100% design system hiện tại (sky/teal, glassmorphism, sidebar, topbar, KPI card, filter chip, status badge, modal, animation).

---

## 0️⃣ TỔNG QUAN

### Hiện trạng MIMIN ERP (đã có sẵn — em sẽ tận dụng)
| Thành phần | File | Trạng thái |
|---|---|---|
| **Permission matrix 7 role × 21 module × 4 action** | `lib/permissions.ts` | ✅ Đã có (r/c/u/d) |
| **19 vai trò chuẩn + 11 phòng ban + 6 Data Scope** | `lib/vai-tro-chuan.ts` | ✅ Đã có (mapping role → scope) |
| **Field-level permission (lương, giá, CMND...)** | `lib/field-permission.ts` | ✅ Đã có |
| **PageGuard (route → module → check)** | `components/PageGuard.tsx` | ✅ Đã có |
| **PermissionGuard + usePermission** | `components/PermissionGuard.tsx` | ✅ Đã có |
| **Audit log system** | `lib/audit-log.ts` | ✅ Đã có (view, create, update, delete, login, 2FA...) |
| **Personal tasks theo role** | `lib/personal-tasks.ts` | ✅ Đã có (5-7 task/role) |
| **Data Phân công & Công nợ** | `lib/data/cong-no.ts` (PHAN_CONG) | ✅ Đã có 8 record mẫu (M758, M873) |
| **Demo users 19 NV + 13 CN + 7 mock** | `lib/users.ts` | ✅ Đã có 26 user với role/module/donGia |
| **Design system (Tailwind + glassmorphism + sky brand)** | `app/globals.css`, `tailwind.config.ts` | ✅ Cố định, không đổi |

### Khoảng trống cần lấp
1. ❌ Chưa có bộ giao diện dùng chung theo 7 vai trò nghiệp vụ (chỉ có admin/planner/warehouse/sewing/qc/finishing/accountant)
2. ❌ Chưa có màn riêng cho **người gia công** (mobile-first) — yêu cầu quan trọng
3. ❌ Chưa có **bảng điều hành sản xuất** cho QLSX
4. ❌ Chưa có **màn QC + Bàn giao + Xác nhận công đoạn** đầy đủ
5. ❌ Chưa có **màn sản lượng / tiền công / đối soát** cho kế toán
6. ❌ Chưa có **action mới** (RECEIVE, START, REPORT_PROGRESS, HANDOVER, CONFIRM, APPROVE, REWORK, LOCK, PAYMENT) trong permission matrix
7. ❌ Chưa có **Data Scope filter** thực tế (SELF/ASSIGNED/TEAM/DEPARTMENT/ALL) — hiện chỉ là khai báo
8. ❌ Sidebar đang hard-code 50+ nav items (line 63-122 của `Sidebar.tsx`) → cần chuyển sang **role-based config**
9. ❌ 4/7 trang dùng `confirm()/prompt()` browser native → cần modal xác nhận chung
10. ❌ Ngày tháng hiển thị raw ISO → cần format `dd/MM/yyyy`

---

## 1️⃣ DANH SÁCH VAI TRÒ CUỐI CÙNG

### Mapping: Bộ giao diện (7) ↔ Vai trò chuẩn (19)

| # | Bộ giao diện | Vai trò chuẩn áp dụng | Ghi chú |
|---|---|---|---|
| 1 | **Điều hành** | `GIAM_DOC` | Xem tất cả, duyệt cuối |
| 2 | **Quản lý sản xuất** | `DIEU_PHOI_SX` | Điều phối, giao việc, duyệt |
| 3 | **Kế toán & đối soát** | `KE_TOAN` | Tiền công, công nợ, NCC |
| 4 | **Kho & tổ cắt nội bộ** | `THU_KHO_VAI`, `THU_KHO_TP`, `PHU_TRACH_CAT`, `NHAN_VIEN_CAT` | Kho + cắt nội bộ |
| 5 | **Người nhận gia công** | `DOI_TAC_IN_THEU`, `DOI_TAC_MAY` | Đối tác ngoài (mobile-first) |
| 6 | **Công đoạn hoàn thiện** | `PHU_TRACH_UI`, `PHU_TRACH_QC`, `PHU_TRACH_DONG_GOI`, `NHAN_VIEN_UI`, `NHAN_VIEN_KHUY_NUT`, `NHAN_VIEN_DONG_GOI` | Ủi, QC, khuy nút, đóng gói |
| 7 | **Bán hàng & giao nhận** | `QUAN_TRI_HE_THONG` (mở rộng), `planner` (sales) | Đơn hàng, khách hàng, giao nhận |

### Danh sách 19 vai trò chuẩn (giữ nguyên từ `vai-tro-chuan.ts`)

**Nhóm 1 — Nhân viên nội bộ (13 vai trò):**
- `GIAM_DOC` — Chủ doanh nghiệp / Giám đốc
- `DIEU_PHOI_SX` — Quản lý sản xuất
- `KE_TOAN` — Kế toán
- `THU_KHO_VAI` — Kho vải
- `THU_KHO_TP` — Kho thành phẩm
- `PHU_TRACH_CAT` — Tổ trưởng Cắt
- `NHAN_VIEN_CAT` — Nhân viên Cắt
- `PHU_TRACH_UI` — Tổ trưởng Ủi
- `NHAN_VIEN_UI` — Nhân viên Ủi
- `PHU_TRACH_QC` — QC
- `PHU_TRACH_DONG_GOI` — Tổ trưởng Gấp xếp / Đóng gói
- `NHAN_VIEN_KHUY_NUT` — Nhân viên Khuy nút
- `NHAN_VIEN_DONG_GOI` — Nhân viên Đóng gói
- `QUAN_TRI_HE_THONG` — Quản trị hệ thống (admin kỹ thuật)

**Nhóm 2 — Người nhận gia công / Đối tác (2 vai trò):**
- `DOI_TAC_MAY` — Xưởng may gia công (May áo trụ, May áo tròn, May quần)
- `DOI_TAC_IN_THEU` — Xưởng in/thêu/dập/khuy nút (gộp lại 1 role)

> **Lưu ý:** Gộp "In/Thêu/Dập/Khuy nút" thành 1 role `DOI_TAC_IN_THEU` để đơn giản, phân biệt bằng `module` thuộc tính (intd / khuy-nut). Mỗi đối tác được gán `module` cụ thể khi tạo user.

**Mapping phòng ban (giữ nguyên từ `vai-tro-chuan.ts`):**
| Vai trò | Phòng ban |
|---|---|
| GIAM_DOC | BDH (Ban điều hành) |
| DIEU_PHOI_SX | DPSX (Điều phối sản xuất) |
| KE_TOAN | KE_TOAN |
| THU_KHO_VAI | KHO_VAI |
| THU_KHO_TP | KHO_TP |
| PHU_TRACH_CAT, NHAN_VIEN_CAT | CAT |
| PHU_TRACH_IN_THEU, DOI_TAC_IN_THEU | GC_NGOAI |
| PHU_TRACH_MAY, DOI_TAC_MAY | GC_NGOAI |
| PHU_TRACH_KHUY_NUT, NHAN_VIEN_KHUY_NUT | KHUY_NUT |
| PHU_TRACH_UI, NHAN_VIEN_UI | UI |
| PHU_TRACH_QC | QC |
| PHU_TRACH_DONG_GOI, NHAN_VIEN_DONG_GOI | DONG_GOI |
| QUAN_TRI_HE_THONG | BDH |

---

## 2️⃣ MENU CỦA TỪNG VAI TRÒ (7 bộ giao diện)

### 🟢 Bộ 1: ĐIỀU HÀNH (`GIAM_DOC`)
```
📊 Dashboard (tổng quan toàn hệ thống)
🏭 Sản xuất
   └─ Bảng điều hành SX
   └─ Kế hoạch SX
   └─ Lệnh cắt
   └─ Công đoạn & tiến độ
📦 Kho
   └─ Kho vải
   └─ Kho phụ liệu
   └─ Kho thành phẩm
🛒 Bán hàng
   └─ Đơn hàng
   └─ Khách hàng
   └─ Giao hàng
👥 Nhân sự
   └─ Nhân viên
   └─ Đối tác gia công
💰 Tài chính
   └─ Công nợ công đoạn
   └─ Bảng lương
   └─ Chấm công
📈 Báo cáo
   └─ Báo cáo tổng hợp
   └─ Real-time Dashboard
   └─ Audit Log
⚙️ Cài đặt
   └─ Cài đặt hệ thống
   └─ Phân quyền của tôi
```

### 🟢 Bộ 2: QUẢN LÝ SẢN XUẤT (`DIEU_PHOI_SX`)
```
📊 Dashboard (focus SX)
🏭 Sản xuất
   └─ Bảng điều hành SX ⭐ (màn chính)
   └─ Kế hoạch SX
   └─ Lệnh cắt
   └─ Lệnh tổng (Dệt-Nhuộm)
   └─ Sản xuất ERP (tổng hợp)
   └─ Workflow công đoạn
   └─ Tổng hợp công đoạn
👥 Nhân sự
   └─ Nhân viên (chỉ xem)
   └─ Đối tác gia công
📦 Kho (chỉ xem)
   └─ Kho vải
   └─ Kho phụ liệu
   └─ Kho thành phẩm
📈 Báo cáo
   └─ Tiến độ SX
   └─ Real-time Dashboard
⚙️ Phân quyền của tôi
```

### 🟢 Bộ 3: KẾ TOÁN & ĐỐI SOÁT (`KE_TOAN`)
```
📊 Dashboard (tài chính)
🛒 Đơn hàng (chỉ xem doanh thu)
👥 Nhân sự (chỉ xem, ẩn lương NV khác)
💰 Tài chính ⭐
   └─ Đối soát sản lượng ⭐ (màn chính)
   └─ Đối soát tiền công
   └─ Công nợ công đoạn
   └─ Công nợ NCC
   └─ Bảng lương auto
   └─ Bảng lương
🏭 Sản xuất (chỉ xem sản lượng đã duyệt)
   └─ Kế hoạch SX
   └─ Lệnh cắt
📈 Báo cáo
   └─ Báo cáo tài chính
   └─ Audit Log (xem thao tác kế toán)
⚙️ Phân quyền của tôi
```

### 🟢 Bộ 4: KHO & TỔ CẮT NỘI BỘ (`THU_KHO_VAI` / `THU_KHO_TP` / `PHU_TRACH_CAT` / `NHAN_VIEN_CAT`)
```
📊 Dashboard (kho / cắt)
🏭 Sản xuất
   └─ Lệnh cắt (chỉ lệnh được phân công)
   └─ Công đoạn cắt nội bộ ⭐ (màn riêng cho tổ cắt)
📦 Kho ⭐
   └─ Kho vải
   └─ Kho phụ liệu
   └─ Kho thành phẩm
   └─ Kho sợi - dây chuyền
👥 Nhân sự (chỉ xem tổ mình)
📈 Báo cáo
   └─ Báo cáo nhập-xuất-tồn
⚙️ Phân quyền của tôi
```

### 🟢 Bộ 5: NGƯỜI NHẬN GIA CÔNG (`DOI_TAC_MAY` / `DOI_TAC_IN_THEU`) — **MOBILE-FIRST**
```
🏠 Trang chủ (mobile card view)
   └─ Lệnh mới
   └─ Đang thực hiện
   └─ Chờ kiểm
   └─ Cần làm lại
   └─ Đã hoàn thành
📋 Công việc ⭐
🎯 Đang thực hiện
🤝 Bàn giao
⚠️ Hàng lỗi & làm lại
📊 Sản lượng
💵 Tiền công
📜 Lịch sử
⚙️ Cài đặt cá nhân
```

> **Menu rất gọn, mobile-first, chữ lớn, nút to, KHÔNG có bảng nhiều cột**

### 🟢 Bộ 6: CÔNG ĐOẠN HOÀN THIỆN (`PHU_TRACH_UI` / `PHU_TRACH_QC` / `PHU_TRACH_DONG_GOI` + NV tương ứng)
```
📊 Dashboard (riêng từng bộ phận)
🏭 Sản xuất
   └─ Công đoạn của tôi ⭐
   └─ Bàn giao giữa công đoạn
   └─ QC & Kiểm hàng
🏭 Hoàn thiện
   └─ Ủi & Hoàn thiện
   └─ Gấp xếp
   └─ Đóng gói
   └─ Khuy nút
📦 Kho thành phẩm (chỉ xem hàng về)
📊 Sản lượng của tôi
💵 Tiền công
📜 Lịch sử thao tác
⚙️ Cài đặt
```

### 🟢 Bộ 7: BÁN HÀNG & GIAO NHẬN (`planner` mở rộng / hoặc role mới `NV_BAN_HANG`)
```
📊 Dashboard (doanh thu + đơn hàng)
🛒 Bán hàng ⭐
   └─ Đơn hàng (CRUD đầy đủ)
   └─ Khách hàng
   └─ Báo giá
🚚 Giao nhận
   └─ Giao hàng (tạo lô, in phiếu)
   └─ Theo dõi giao hàng
🏭 Sản xuất (chỉ xem)
   └─ Lệnh cắt
   └─ Kế hoạch SX
📦 Kho (chỉ xem tồn)
💰 Tài chính (xem doanh thu, công nợ KH)
📈 Báo cáo
⚙️ Phân quyền của tôi
```

### 🔧 Cách triển khai menu
- Tạo `lib/role-menu.ts` — config động: `Record<VaiTroChuan, MenuItem[]>`
- Sidebar đọc từ config này theo `user.role` thay vì hard-code 50+ item
- Thêm `data-scope` cho từng menu item để filter data hiển thị

---

## 3️⃣ MA TRẬN PHÂN QUYỀN

### 3.1. 15 Action mới (mở rộng từ 4 cũ)

| Action | Mô tả | Module chính |
|---|---|---|
| `VIEW` | Xem | Tất cả |
| `CREATE` | Tạo mới | Tất cả |
| `UPDATE` | Cập nhật | Tất cả |
| `DELETE` | Xóa | Tất cả |
| `ASSIGN` | Giao việc cho người khác | lenh-cat, ke-hoach-sx, kho |
| `RECEIVE` | Nhận việc (từ giao việc) | workflow cá nhân |
| `START` | Bắt đầu làm | workflow cá nhân |
| `REPORT_PROGRESS` | Cập nhật sản lượng | workflow cá nhân |
| `HANDOVER` | Bàn giao cho công đoạn sau | workflow cá nhân |
| `CONFIRM` | Xác nhận đã nhận (công đoạn sau / QC) | workflow |
| `APPROVE` | Duyệt cuối (QLSX / GĐ) | workflow, đơn hàng, bảng lương |
| `REJECT` | Từ chối / yêu cầu làm lại | workflow |
| `REWORK` | Đánh dấu làm lại | workflow |
| `LOCK` | Khóa đối soát (kế toán) | bang-luong, cong-no |
| `PAYMENT` | Thanh toán | bang-luong, cong-no |

### 3.2. 5 Data Scope

| Scope | Ý nghĩa | Áp dụng cho |
|---|---|---|
| `SELF` | Chỉ thấy bản thân | Công nhân, đối tác gia công |
| `ASSIGNED` | Thấy cái được giao cho mình | Tổ trưởng (việc trong tổ mình) |
| `TEAM` | Thấy tất cả trong tổ | Tổ trưởng |
| `DEPARTMENT` | Thấy tất cả trong phòng ban | Trưởng phòng |
| `ALL` | Thấy tất cả | Giám đốc, Admin, Kế toán trưởng |

> **Đã có sẵn trong `vai-tro-chuan.ts`** (thêm 1 scope `ASSIGNED` để phân biệt với `TEAM`)

### 3.3. Ma trận Role × Module × Action (tóm tắt)

| Role | dashboard | lenh-cat | ke-hoach-sx | kho-vai | kho-phu-lieu | kho-thanh-pham | don-hang | khach-hang | to-may | hoan-thien | qc | giao-hang | cong-no | bang-luong | cham-cong | nhan-su | ncc | bao-cao | audit-log | cai-dat |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **GIAM_DOC** | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | R | CRUD |
| **DIEU_PHOI_SX** | R | CRUD+ASSIGN+APPROVE | CRUD | R | R | R | R | R | CRUD+ASSIGN | R | R | R | R | R | R | R | R | R | R | R |
| **KE_TOAN** | R | R | R | R | R | R | R | R | — | — | — | R | CRUD+LOCK+PAY | CRUD+LOCK | R | R | R+U | R | R | R |
| **THU_KHO_VAI** | R | R | R | CRUD | CRUD | R | R | — | R | R | R | R | — | — | — | R | R | R | — | R |
| **THU_KHO_TP** | R | R | R | R | R | CRUD | R | — | R | R | R | R | — | — | — | R | R | R | — | R |
| **PHU_TRACH_CAT** | R | R+ASSIGN | R | R | R | R | R | — | R | R | R | R | R | R | R | R | R | R | — | R |
| **NHAN_VIEN_CAT** | — | R+SELF | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | R-self |
| **PHU_TRACH_UI** | R | R | R | R | R | R | R | — | R | CRUD+ASSIGN+CONFIRM | R | R | R | R | R | R | R | R | — | R |
| **PHU_TRACH_QC** | R | R | R | R | R | R | R | — | R | R | CRUD+CONFIRM+APPROVE | R | R | R | R | R | R | R | — | R |
| **PHU_TRACH_DONG_GOI** | R | R | R | R | R | R | R | — | R | R | R | R | R | R | R | R | R | R | — | R |
| **NHAN_VIEN_UI/KHUY/DONGGOI** | — | R+SELF | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | R-self |
| **DOI_TAC_MAY** | — | R+SELF (giao cho mình) | — | — | — | — | — | — | — | — | — | — | — | R-self (tiền công) | — | — | — | — | — | R-self |
| **DOI_TAC_IN_THEU** | — | R+SELF (giao cho mình) | — | — | — | — | — | — | — | — | — | — | — | R-self (tiền công) | — | — | — | — | — | R-self |
| **QUAN_TRI_HE_THONG** | R | R | R | R | R | R | R | R | R | R | R | R | R | R | R | CRUD | R | R | R | CRUD |

> **Ký hiệu:**
> - `R` = VIEW, `C` = CREATE, `U` = UPDATE, `D` = DELETE
> - `+ASSIGN/+CONFIRM/+APPROVE` = action riêng cho workflow
> - `+SELF` = chỉ thấy data của mình
> - `—` = không truy cập

### 3.4. Cấu trúc file mới

```
lib/
├── permissions.ts          # 7 role legacy (giữ nguyên, deprecated dần)
├── vai-tro-chuan.ts        # 19 vai trò + 11 PB + 6 DataScope (đã có)
├── permission-matrix.ts    # 🆕 19 role × 21 module × 15 action × 5 scope
├── role-menu.ts            # 🆕 Config menu cho 19 role
├── data-scope-filter.ts    # 🆕 Helper filter data theo scope
├── role-actions.ts         # 🆕 Constants 15 action
└── role-guard.tsx          # 🆕 Component check role + scope
```

---

## 4️⃣ DANH SÁCH MÀN HÌNH CẦN SỬA / TẠO MỚI

### 4.1. Màn hình TẠO MỚI (7 màn chính)

| # | Đường dẫn | Tên màn | Bộ giao diện | Mobile-first | Ưu tiên |
|---|---|---|---|---|---|
| 1 | `/trang-chu-gia-cong` | Trang chủ người gia công | Bộ 5 (Đối tác gia công) | ✅ | 🔴 P0 |
| 2 | `/cong-viec` | Công việc của tôi (bộ 5) | Bộ 5 | ✅ | 🔴 P0 |
| 3 | `/cong-viec/[id]` | Modal/Tab chi tiết công việc (7 tab) | Bộ 5 + Bộ 6 | ✅ | 🔴 P0 |
| 4 | `/ban-giao` | Bàn giao (bộ 5) | Bộ 5 | ✅ | 🟠 P1 |
| 5 | `/san-luong` | Sản lượng của tôi (bộ 5 + 6) | Bộ 5 + 6 | ✅ | 🟠 P1 |
| 6 | `/tien-cong` | Tiền công (bộ 5 + 6 + kế toán) | Bộ 3 + 5 + 6 | ✅ | 🟠 P1 |
| 7 | `/bang-dieu-hanh-sx` | Bảng điều hành SX (bộ 2) | Bộ 2 | ❌ | 🔴 P0 |
| 8 | `/cong-doan` | Công đoạn của tôi (bộ 6) | Bộ 6 | ✅ | 🟠 P1 |
| 9 | `/cat-noi-bo` | Tổ cắt nội bộ (bộ 4) | Bộ 4 | ❌ | 🟠 P1 |
| 10 | `/doi-soat` | Đối soát sản lượng (bộ 3) | Bộ 3 | ❌ | 🟠 P1 |
| 11 | `/doi-soat-tien-cong` | Đối soát tiền công (bộ 3) | Bộ 3 | ❌ | 🟠 P1 |
| 12 | `/lock` | Khóa đối soát (bộ 3) | Bộ 3 | ❌ | 🟡 P2 |

### 4.2. Màn hình CẦN SỬA (giữ design, thêm data scope + actions)

| # | Đường dẫn | Thay đổi chính | Ưu tiên |
|---|---|---|---|
| 1 | `/lenh-cat` | Thêm filter scope theo role, thêm nút Giao việc / Gia hạn / Thu hồi cho QLSX | 🟠 P1 |
| 2 | `/ke-hoach-san-xuat` | Implement form tạo thật, thêm Tiến độ / Giao việc / Chia SL | 🟠 P1 |
| 3 | `/giao-hang` | Build đầy đủ (đang stub 95 dòng) — CRUD + workflow + in phiếu | 🟠 P1 |
| 4 | `/qc` | Đổi sang luồng: Nhận kiểm → Kiểm tra → Xác nhận đạt/lỗi → Đề xuất xử lý | 🟠 P1 |
| 5 | `/hoan-thien` | Tách thành: Ủi, Gấp xếp, Đóng gói, Khuy nút (4 sub-tab) | 🟠 P1 |
| 6 | `/don-hang` | Giữ nguyên + thêm action Export, Bulk action | 🟡 P2 |
| 7 | `/kho-vai-tinhmann`, `/kho-phu-lieu`, `/kho-thanh-pham` | Thêm data scope filter, chuyển prompt/confirm → modal chung | 🟡 P2 |
| 8 | `/may` (to-may) | Tách rõ công đoạn: May áo trụ, May áo tròn, May quần | 🟠 P1 |
| 9 | `/cong-no` | Màn đối soát mới theo flow mới (xem bộ 3) | 🟠 P1 |
| 10 | `/bang-luong` + `/bang-luong-auto` | Gộp thành 1 màn, thêm trạng thái tiền công (7 trạng thái) | 🟡 P2 |

### 4.3. Sidebar (refactor)
- **File:** `components/layout/Sidebar.tsx`
- **Đổi:** Đọc menu từ `lib/role-menu.ts` thay vì hard-code 50+ item
- **Mỗi menu item khai báo:**
  ```ts
  { href, label, icon, allowedRoles: VaiTroChuan[], dataScope, group }
  ```
- **Sidebar.tsx:** Chỉ giữ logic render + filter, không khai báo data

### 4.4. Components dùng chung (chuẩn hóa)
| Component | Mô tả | File mới |
|---|---|---|
| `<ConfirmDialog>` | Thay `window.confirm()` | `components/ui/ConfirmDialog.tsx` |
| `<PromptModal>` | Thay `window.prompt()` | `components/ui/PromptModal.tsx` |
| `<EmptyState>` | Empty state đẹp | `components/ui/EmptyState.tsx` |
| `<Skeleton>` | Loading skeleton | `components/ui/Skeleton.tsx` |
| `<ErrorBoundary>` | Bắt lỗi React | `components/ErrorBoundary.tsx` |
| `<MobileCardView>` | Thay bảng dài trên mobile | `components/ui/MobileCardView.tsx` |
| `<DateDisplay>` | Format dd/MM/yyyy | `components/ui/DateDisplay.tsx` |
| `<RoleBadge>` | Badge hiển thị vai trò | `components/ui/RoleBadge.tsx` |
| `<ScopeBadge>` | Badge hiển thị data scope | `components/ui/ScopeBadge.tsx` |

### 4.5. Mỗi thẻ công việc (Bộ 5) — 11 trường + 8 nút

**Hiển thị:**
```
[Ảnh SP] | Mã LSX · Mã SP · Công đoạn
         | Màu · Size
         | SL giao / SL hoàn thành / SL còn lại
         | Hạn giao · Trạng thái · Người giao
```

**8 nút thao tác:**
1. `Nhận việc` (chỉ khi trạng thái = "Chờ giao")
2. `Bắt đầu làm` (sau khi nhận)
3. `Cập nhật sản lượng` (mở modal nhập SL đạt/lỗi)
4. `Báo thiếu hàng` (mở modal lý do)
5. `Báo lỗi` (mở modal upload ảnh lỗi)
6. `Yêu cầu hỗ trợ` (mở modal nhập yêu cầu)
7. `Bàn giao` (mở modal chọn công đoạn sau + SL bàn giao)
8. `Xem tiền công` (chuyển `/tien-cong?taskId=...`)

**Modal chi tiết (7 tab):**
- Tab 1: Thông tin (mã LSX, mã SP, công đoạn, deadline, người giao)
- Tab 2: Yêu cầu kỹ thuật (mô tả, ghi chú QLSX)
- Tab 3: Hình ảnh / file mẫu (ảnh sản phẩm, file thiết kế)
- Tab 4: Sản lượng (bảng nhập SL theo thời gian)
- Tab 5: Lỗi (ảnh lỗi, loại lỗi, hướng xử lý)
- Tab 6: Bàn giao (lịch sử bàn giao, xác nhận của công đoạn sau)
- Tab 7: Tiền công (số lượng đạt × đơn giá, các khoản khấu trừ, thực nhận)

**Biến thể theo công đoạn (Bộ 5):**
| Công đoạn | Field riêng |
|---|---|
| **May (áo trụ / áo tròn / quần)** | Loại may, màu+size chi tiết, SL chi tiết nhận, SL đạt, SL lỗi, đơn giá may, tiền công |
| **In / Thêu / Dập** | Vị trí, hình thiết kế, kích thước, màu mực/chỉ, file mẫu, SL nhận/đạt/lỗi, đơn giá |
| **Khuy/Nút** | Loại khuy, màu khuy, số khuy/SP, vị trí, SL đạt/lỗi |
| **Ủi** | Đủ bộ / chưa đủ bộ, SL nhận, SL đã ủi, SL lỗi, SL chuyển kiểm |
| **Kiểm** | SL nhận kiểm, SL đạt, SL lỗi, loại lỗi, công đoạn gây lỗi, người TH, ảnh lỗi, hướng xử lý, làm lại/loại bỏ |
| **Gấp / Đóng gói** | Quy cách gấp, tỷ lệ size, SL/cục, SL đã gấp, SL đã đóng gói, số kiện, tem cần in |

---

## 5️⃣ LUỒNG DỮ LIỆU END-TO-END

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    1. TẠO LỆNH (DIEU_PHOI_SX / GIAM_DOC)             │
│  /ke-hoach-san-xuat → Tạo KHSX → /lenh-cat → Tạo lệnh cắt            │
│  Action: CREATE lenh-cat                                               │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    2. PHÂN CÔNG TỔ CẮT (PHU_TRACH_CAT)                 │
│  /lenh-cat → Modal chi tiết → Phân công công đoạn (Cắt)                │
│  Action: ASSIGN lenh-cat + CREATE phan-cong-cong-doan                 │
│  → Chia SL cho nhiều nhân viên cắt nội bộ                             │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    3. TỔ CẮT NHẬN VIỆC (NHAN_VIEN_CAT)                 │
│  /cat-noi-bo → Thẻ công việc → Nhận việc → Bắt đầu làm               │
│  Action: RECEIVE + START (workflow cá nhân, scope SELF)                │
│  → Cập nhật SL: trải, cắt, đánh số, phân loại, bó kiện               │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    4. BÀN GIAO TỔ CẮT → TỔ MAY/IN/THÊU                │
│  Action: HANDOVER (ghi SL bàn giao + người nhận)                       │
│  → Tự động trừ kho vải (nếu có)                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    5. NGƯỜI GIA CÔNG NHẬN (DOI_TAC_MAY / IN_THEU)       │
│  /cong-viec (mobile) → Nhận việc → Bắt đầu làm                        │
│  Action: RECEIVE + START                                                │
│  → Cập nhật sản lượng (SL đạt, SL lỗi, ghi chú)                       │
│  → Báo lỗi / Yêu cầu hỗ trợ (nếu có)                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    6. BÀN GIAO NGƯỜI GIA CÔNG → CÔNG ĐOẠN SAU         │
│  Action: HANDOVER (ghi SL bàn giao + người nhận)                       │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    7. CÔNG ĐOẠN SAU XÁC NHẬN NHẬN (CONFIRM)            │
│  Ví dụ: May áo → Ủi                                                   │
│  Action: CONFIRM (ghi SL thực nhận, SL chênh lệch)                     │
│  → Nếu SL nhận < SL bàn giao → tự động flag "Thiếu hàng"             │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    8. QC XÁC NHẬN ĐẠT / LỖI (PHU_TRACH_QC)            │
│  /qc → Nhận kiểm → Kiểm tra → Xác nhận                                │
│  Action: CONFIRM (SL đạt, SL lỗi, loại lỗi, công đoạn gây lỗi)        │
│  → Upload ảnh lỗi (nếu có)                                             │
│  → Đề xuất: Làm lại (REWORK) hoặc Loại bỏ                             │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    9. HOÀN THIỆN (ỦI → GẤP XẾP → ĐÓNG GÓI)            │
│  Ủi → CONFIRM → Gấp xếp → CONFIRM → Đóng gói → CONFIRM                │
│  Mỗi công đoạn đều có: Nhận việc → Làm → Cập nhật SL → Bàn giao      │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    10. NHẬP KHO THÀNH PHẨM (THU_KHO_TP)                │
│  /kho-thanh-pham → Auto-generate từ phiếu ĐG hoàn thành                │
│  Action: CREATE kho-thanh-pham                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    11. QLSX DUYỆT (DIEU_PHOI_SX / GIAM_DOC)            │
│  /bang-dieu-hanh-sx → Xem tổng quan → Duyệt hoàn thành                │
│  Action: APPROVE (đối với toàn bộ lệnh)                                │
│  → Có thể Yêu cầu làm lại (REJECT)                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    12. KẾ TOÁN ĐỐI SOÁT (KE_TOAN)                      │
│  /doi-soat → Bảng đối soát tự động                                     │
│  Action: CONFIRM (đối soát sản lượng)                                  │
│  → Tính tiền công: SL đạt × đơn giá = Tiền công                        │
│  → Chỉ tính khi: (1) Bàn giao ✓ (2) CĐ sau xác nhận ✓ (3) QC ✓        │
│  → Action: LOCK đối soát → Khóa không cho sửa                          │
└─────────────────────────────────────────────────────────────────────────┏┘
                                ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    13. THANH TOÁN (KE_TOAN)                             │
│  /bang-luong → Duyệt thanh toán                                         │
│  Action: PAYMENT                                                        │
│  → Trạng thái: Chưa đối soát → Chờ NV xác nhận → Đã xác nhận          │
│              → Chờ thanh toán → Đã thanh toán 1 phần → Đã thanh toán   │
│              → Có khiếu nại                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Bảng trạng thái tiền công (7 trạng thái)
| Trạng thái | Điều kiện |
|---|---|
| `Chưa đối soát` | Mặc định sau khi bàn giao |
| `Chờ NV xác nhận` | Kế toán đã đối soát, gửi cho NV |
| `Đã xác nhận` | NV xác nhận OK |
| `Chờ thanh toán` | Duyệt thanh toán |
| `Đã thanh toán 1 phần` | Đã trả 1 phần |
| `Đã thanh toán` | Thanh toán đủ |
| `Có khiếu nại` | NV khiếu nại về số tiền |

---

## 6️⃣ KẾ HOẠCH TRIỂN KHAI 10 BƯỚC

| Bước | Nội dung | Ưu tiên | Ước lượng |
|---|---|---|---|
| **1** | ✅ Khảo sát role/permission/user/menu hiện tại | — | ✅ Xong |
| **2** | ✅ Tổng hợp cấu trúc hiện tại | — | ✅ Xong |
| **3** | ✅ Ma trận Role × Module × Action × Data Scope | — | ✅ Xong |
| **4** | Chuẩn hóa component giao diện dùng chung (ConfirmDialog, PromptModal, EmptyState, Skeleton, MobileCardView, DateDisplay, RoleBadge, ScopeBadge) | 🟠 P1 | 1 đợt |
| **5** | Refactor Sidebar: đọc từ `lib/role-menu.ts` (xóa hard-code 50+ items) | 🟠 P1 | 1 đợt |
| **6** | Tạo `lib/permission-matrix.ts` (15 action × 19 role × 5 scope) + `lib/data-scope-filter.ts` (helper filter) | 🔴 P0 | 1 đợt |
| **7** | Màn **Bộ 5: Người gia công** (mobile-first): Trang chủ, Công việc, Modal 7 tab, 8 nút thao tác, Bàn giao, Sản lượng, Tiền công, Lịch sử | 🔴 P0 | 2-3 đợt |
| **8** | Màn **Bộ 2: Bảng điều hành SX** (QLSX): giao việc, chia SL, gia hạn, thu hồi, duyệt, chuyển công đoạn | 🟠 P1 | 1-2 đợt |
| **9** | Màn **Bộ 6: Công đoạn hoàn thiện**: Ủi, QC, Gấp xếp, Đóng gói, Khuy nút (tách 4 sub-tab, áp dụng workflow) | 🟠 P1 | 1-2 đợt |
| **10** | Màn **Bộ 3: Đối soát + Tiền công** (Kế toán): bảng đối soát, khóa, thanh toán, 7 trạng thái | 🟠 P1 | 1-2 đợt |
| **11** | Màn **Bộ 4: Tổ cắt nội bộ** (kết hợp vào /lenh-cat hoặc tách /cat-noi-bo) | 🟡 P2 | 1 đợt |
| **12** | Sửa các màn còn lại: `/lenh-cat`, `/giao-hang` (build đầy đủ), `/ke-hoach-san-xuat` (form thật), `/kho-*` (data scope + modal chung) | 🟠 P1 | 1-2 đợt |
| **13** | Kết nối dữ liệu thật (nếu có Supabase) hoặc nâng cấp `lib/data/*` lên store có audit log | 🟡 P2 | 1-2 đợt |
| **14** | Test responsive mobile + desktop, kiểm tra permission ở từng route, kiểm tra audit log đầy đủ | 🟠 P1 | 1 đợt |
| **15** | Báo cáo cuối: file đã sửa, tính năng hoàn thành, phần còn thiếu, lỗi cần xử lý | — | 1 đợt |

> **Tổng ước lượng: ~10-15 đợt** (mỗi đợt 30-60 phút, mỗi đợt 1 commit/PR riêng để dễ review)

---

## 7️⃣ PHỤ LỤC: AUDIT LOG MỚI

Mở rộng `AuditAction` (từ 17 hiện tại) thêm:
```
| "assign"           | (đã có)
| "receive"          | 🆕 Nhận việc
| "start"            | 🆕 Bắt đầu làm
| "report_progress"  | 🆕 Cập nhật sản lượng
| "handover"         | 🆕 Bàn giao
| "confirm"          | 🆕 Xác nhận (công đoạn sau / QC)
| "approve"          | (đã có) - dùng cho QLSX duyệt
| "reject"           | (đã có) - dùng cho QLSX từ chối
| "rework"           | 🆕 Yêu cầu làm lại
| "lock"             | 🆕 Khóa đối soát
| "payment"          | (đã có)
| "report_issue"     | 🆕 Báo lỗi / thiếu hàng
| "request_support"  | 🆕 Yêu cầu hỗ trợ
```

Mỗi action sẽ ghi log: `userId, userName, role, timestamp, resourceId (taskId/lenhId), oldValue, newValue, scope, success, errorMessage`.

---

## 8️⃣ CHECKLIST TRƯỚC KHI BẮT ĐẦU CODE

Anh Sang vui lòng xác nhận các điểm sau trước khi em bắt đầu sửa code:

- [ ] **Roles 19 + Data Scope 6:** Dùng nguyên `vai-tro-chuan.ts` đã có, bổ sung thêm 1 scope `ASSIGNED`?
- [ ] **Gộp `DOI_TAC_IN_THEU` = In + Thêu + Dập + Khuy nút** (phân biệt qua `module` property của user)?
- [ ] **15 Action mới** (giữ nguyên 4 cũ VIEW/C/U/D, thêm 11 mới)?
- [ ] **Menu Sidebar** chuyển từ hard-code → đọc từ `lib/role-menu.ts` (cấu hình động)?
- [ ] **Bộ 5 (Đối tác gia công)** là mobile-first, không có bảng dài?
- [ ] **Modal chi tiết công việc** 7 tab (Thông tin / Yêu cầu KT / Hình ảnh / Sản lượng / Lỗi / Bàn giao / Tiền công)?
- [ ] **8 nút thao tác** trên mỗi thẻ (Nhận việc / Bắt đầu / Cập nhật SL / Báo thiếu / Báo lỗi / YC hỗ trợ / Bàn giao / Xem tiền)?
- [ ] **Trạng thái tiền công 7 cấp** (Chưa đối soát → ... → Có khiếu nại)?
- [ ] **Điều kiện tính tiền công** = Bàn giao ✓ + CĐ sau xác nhận ✓ + QC duyệt ✓ + QLSX duyệt?
- [ ] **7 ngày bàn giao** giữ nguyên design system (sky/teal, glassmorphism, Tailwind)?
- [ ] **Audit log** mở rộng + 13 action mới?
- [ ] **Components dùng chung mới**: ConfirmDialog, PromptModal, EmptyState, Skeleton, MobileCardView, DateDisplay, RoleBadge, ScopeBadge?
- [ ] **Triển khai theo 10-15 đợt** (mỗi đợt 1 commit nhỏ, dễ review)?

---

## 9️⃣ BƯỚC TIẾP THEO

Sau khi anh duyệt plan này, em sẽ:

1. **Tạo file plan chính thức** trong `D:\APP ERP POLOMIMIN\PLAN-PHAN-QUYEN-MIMIN.md` (đã có)
2. **Bắt đầu Bước 4**: Chuẩn hóa components dùng chung (ConfirmDialog, PromptModal, EmptyState...)
3. **Sau đó Bước 5**: Refactor Sidebar đọc từ config
4. **Rồi mới đến Bước 6**: Permission matrix 15 action × 5 scope
5. **Cuối cùng là Bộ 5 (Người gia công)** — phần quan trọng nhất

**Anh Sang vui lòng review plan này và cho em biết:**
- ✅ Có chỉnh sửa gì không?
- ✅ Có bổ sung vai trò / scope / action nào không?
- ✅ Có cần tách / gộp bộ giao diện nào không?
- ✅ Ưu tiên bắt đầu từ bước nào trước?

Em sẽ CHỜ phản hồi trước khi chạm vào code. 🚦
