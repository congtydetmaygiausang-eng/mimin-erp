# 🎯 PHÂN QUYỀN TỔNG QUAN MIMIN ERP v89.6.9.3

**Ngày tạo:** 2026-08-05
**Tác giả:** Mavis
**Mục đích:** Bảng tổng hợp phân quyền 9 role × 30 module + mapping 44 user + 7 phòng ban

---

## 📊 I. TỔNG QUAN 9 ROLE

| # | Role | Tên tiếng Việt | Icon | Màu | Phòng ban | Quyền hạn |
|---|---|---|---|---|---|---|
| 1 | **admin** | Quản trị viên | 👑 | đỏ | BĐH (Ban điều hành) | Toàn quyền (30/30) |
| 2 | **planner** | Điều phối SX | 📋 | tím | ĐPSX | 15/30 modules |
| 3 | **warehouse** | Quản lý kho | 📦 | vàng | Kho vải / Kho TP | 8/30 modules |
| 4 | **sewing** | Tổ trưởng May | ✂️ | cyan | Tổ may | 10/30 modules |
| 5 | **qc** | Kiểm tra CL | 🛡️ | xanh lá | QC | 3/30 modules |
| 6 | **finishing** | Tổ trưởng HT | 🧵 | hồng | Hoàn thiện | 10/30 modules |
| 7 | **accountant** | Kế toán | 💰 | xanh dương | Kế toán | 8/30 modules |
| 8 | **content** | Content/Media | 🎨 | hồng cánh sen | Marketing | 5/30 modules |
| 9 | **partner** | Đối tác GC | 🤝 | tím fuchsia | Gia công ngoài | 5/30 modules |

---

## 🏢 II. 7 PHÒNG BAN + MAPPING ROLE

```
┌──────────────────────────────────────────────────────────────┐
│ BĐH (Ban điều hành)                                          │
│   - admin (full quyền)                                         │
│   - sang, hoa, phi, vy2                                       │
├──────────────────────────────────────────────────────────────┤
│ ĐPSX (Điều phối sản xuất)                                    │
│   - planner (lập KH, lệnh cắt)                                │
│   - giau, huyen, huyen2                                       │
├──────────────────────────────────────────────────────────────┤
│ Kho vải (KHO_VAI) + Kho thành phẩm (KHO_TP)                  │
│   - warehouse                                                  │
│   - hau                                                       │
├──────────────────────────────────────────────────────────────┤
│ Tổ May (CAT)                                                  │
│   - sewing                                                    │
│   - giang, de, phu, vinh, minh1, nhan, ruong (7 NV)          │
├──────────────────────────────────────────────────────────────┤
│ QC (Kiểm hàng)                                                │
│   - qc                                                         │
│   - (chưa có user @mimin.vn - cần tạo)                        │
├──────────────────────────────────────────────────────────────┤
│ Hoàn thiện (UI, KHUY_NUT, DONG_GOI)                          │
│   - finishing                                                  │
│   - nhi, phuong, be (Gấp xếp)                                 │
│   - duc1, tam, dinh (Ủi)                                      │
├──────────────────────────────────────────────────────────────┤
│ Kế toán                                                       │
│   - accountant                                                 │
│   - thanh, thanh2                                              │
├──────────────────────────────────────────────────────────────┤
│ Marketing (Content)                                           │
│   - content                                                    │
│   - vy                                                         │
├──────────────────────────────────────────────────────────────┤
│ Gia công ngoài (NCC)                                          │
│   - partner (20 NCC gia công may)                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 👥 III. 44 USER @mimin.vn

### 🔴 ADMIN (4 user)
| Email | Tên | Mật khẩu | Phòng ban |
|---|---|---|---|
| sang@mimin.vn | Hồ Minh Sang | sang123 | BĐH |
| hoa@mimin.vn | Huỳnh Xuân Hòa | Mimin@123 | BĐH |
| phi@mimin.vn | Lương Hoàng Phi | Mimin@123 | BĐH |
| vy2@mimin.vn | Vy (Kho) | Mimin@123 | BĐH |

### 📋 PLANNER (3 user)
| Email | Tên | Mật khẩu | Phòng ban |
|---|---|---|---|
| giau@mimin.vn | Nguyễn Thị Giàu | Mimin@123 | ĐPSX |
| huyen@mimin.vn | Đỗ Thị Huyền | Mimin@123 | ĐPSX |
| huyen2@mimin.vn | Huyền 2 (Bán sỉ) | Mimin@123 | ĐPSX |

### 💰 ACCOUNTANT (2 user)
| Email | Tên | Mật khẩu | Phòng ban |
|---|---|---|---|
| thanh@mimin.vn | Bùi Thị Thanh | Mimin@123 | Kế toán |
| thanh2@mimin.vn | Thanh 2 | Mimin@123 | Kế toán |

### 🎨 CONTENT (1 user)
| Email | Tên | Mật khẩu | Phòng ban |
|---|---|---|---|
| vy@mimin.vn | Cẩm Vy | Mimin@123 | Marketing |

### 📦 WAREHOUSE (1 user)
| Email | Tên | Mật khẩu | Phòng ban |
|---|---|---|---|
| hau@mimin.vn | Quốc Hậu | Mimin@123 | Kho |

### ✂️ SEWING - TỔ CẮT (7 user)
| Email | Tên | Mật khẩu | Phòng ban | Module |
|---|---|---|---|---|
| giang@mimin.vn | Phan Văn Giang | Mimin@123 | Tổ cắt | Tổ trưởng Cắt |
| de@mimin.vn | Phạm Văn Đệ | Mimin@123 | Tổ cắt | CN Cắt |
| phu@mimin.vn | Nguyễn Văn Phú | Mimin@123 | Tổ cắt | CN Cắt hỗ trợ |
| vinh@mimin.vn | Dương Tấn Vĩnh | Mimin@123 | Tổ cắt | CN Cắt |
| minh1@mimin.vn | Nguyễn Quốc Minh | Mimin@123 | Tổ cắt | CN Cắt |
| nhan@mimin.vn | Trương Văn Nhẫn | Mimin@123 | Tổ cắt | CN Cắt |
| ruong@mimin.vn | Nguyễn Văn Ruộng | Mimin@123 | Khuy nút | Tổ trưởng |

### 🧵 FINISHING - HOÀN THIỆN (6 user)
| Email | Tên | Mật khẩu | Phòng ban | Module |
|---|---|---|---|---|
| nhi@mimin.vn | Nguyễn Thị Mỹ Nhi | Mimin@123 | Gấp xếp | CN Gấp xếp |
| phuong@mimin.vn | Võ Thị Phượng | Mimin@123 | Gấp xếp | CN Gấp xếp |
| be@mimin.vn | Nguyễn Thị Bé | Mimin@123 | Gấp xếp | CN Gấp xếp |
| duc1@mimin.vn | Nguyễn Minh Đức | Mimin@123 | Ủi | CN Ủi |
| tam@mimin.vn | Trương Minh Tâm | Mimin@123 | Ủi | CN Ủi |
| dinh@mimin.vn | Lê Đỉnh | Mimin@123 | Ủi | CN Ủi |

### 🤝 PARTNER - 20 NCC GIA CÔNG MAY
| Nhóm | Số lượng | Email pattern |
|---|---|---|
| In/Thêu/Dập | 5 | `gc-gc-in-001@mimin.vn` đến `gc-gc-in-006@mimin.vn` |
| May quần | 4 | `gc-gc-quan-001@mimin.vn` đến `gc-gc-quan-004@mimin.vn` |
| May áo tròn | 5 | `gc-gc-tron-001@mimin.vn` đến `gc-gc-tron-005@mimin.vn` |
| May áo trụ | 6 | `gc-gc-tru-001@mimin.vn` đến `gc-gc-tru-007@mimin.vn` |

Tất cả NCC password: `Mimin@123`

---

## 🔐 IV. PERMISSION MATRIX 9 ROLE × 30 MODULE

### Ký hiệu: R=Xem, C=Tạo, U=Sửa, D=Xóa

| Module | admin | planner | warehouse | sewing | qc | finishing | accountant | content | partner |
|---|---|---|---|---|---|---|---|---|---|
| **dashboard** | RCUD | R | R | R | R | R | R | R | - |
| **lenh-cat** | RCUD | RCU | R | RU | R | R | R | R | - |
| **khach-hang** | RCUD | RCU | - | - | - | - | R | R | - |
| **ke-hoach-sx** | RCUD | RCU | R | R | R | R | R | R | - |
| **nhan-su** | RCUD | R | R | R | R | R | R | - | - |
| **kho-vai** | RCUD | R | RCUD | R | R | R | R | - | - |
| **kho-phu-lieu** | RCUD | R | RCUD | R | R | R | R | - | - |
| **kho-thanh-pham** | RCUD | R | RCUD | R | R | RCU | R | R | - |
| **don-hang** | RCUD | RCU | R | R | R | R | R | R | - |
| **cong-no-cong-doan** | RCUD | R | - | R | - | R | RCUD | - | - |
| **kiem-tra-chat-luong** | RCUD | R | R | R | RCUD | R | R | - | - |
| **to-may** | RCUD | R | - | RCUD | R | R | - | - | - |
| **hoan-thien** | RCUD | R | R | R | R | RCUD | R | - | - |
| **giao-hang** | RCUD | R | R | - | R | RCU | R | - | - |
| **cham-cong** | RCUD | R | - | RCU | - | R | R | - | - |
| **bang-luong** | RCUD | - | - | - | - | - | RCUD | - | - |
| **nha-cung-cap** | RCUD | RCU | RCU | - | - | - | RCUD | R | R |
| **gia-cong-ngoai** | RCUD | RCU | R | R | R | R | RU | - | RU |
| **bao-cao** | RCUD | R | R | R | R | R | R | R | - |
| **realtime** | RCUD | R | R | R | R | R | R | - | - |
| **cai-dat** | RCUD | - | - | - | - | - | - | - | - |
| **trang-chu-gia-cong** | RCUD | R | R | RCU | R | RCU | R | - | RCUD |
| **bang-dieu-hanh-sx** | RCUD | RCU | R | R | R | R | R | - | - |
| **doi-soat-tien-cong** | RCUD | R | - | R | - | R | RCUD | - | - |
| **audit-log** | RCUD | - | - | - | - | - | - | - | - |
| **phan-quyen-tuy-chinh** | RCUD | - | - | - | - | - | - | - | - |
| **danh-muc-sp** | RCUD | RCU | R | R | R | R | R | RCUD | - |
| **cong-viec-gia-cong** | RCUD | R | - | RCU | R | RCU | R | - | RCU |
| **ban-giao-gia-cong** | RCUD | R | - | RCU | R | RCU | R | - | RCU |
| **san-luong-gia-cong** | RCUD | R | - | R | R | R | R | - | R |
| **tien-cong-gia-cong** | RCUD | R | - | R | R | R | R | - | R |
| **TỔNG modules** | 30 | 15 | 8 | 10 | 3 | 10 | 8 | 5 | 5 |

---

## 🎨 V. GIAO DIỆN THEO ROLE

### Login redirect
- **8 role** (admin/planner/warehouse/sewing/qc/finishing/accountant/content) → `/dashboard`
- **partner** → `/trang-chu-gia-cong` (riêng)

### Dashboard variants
- **admin/planner/warehouse/sewing/qc/finishing/accountant** → RoleDashboard với stats riêng
- **content** → PartnerDashboard 4 tile (Danh mục SP, Đơn hàng, KH SX, Báo cáo)
- **partner** → PartnerDashboard 5 tile (Trang chủ GC, Công việc, Bàn giao, Sản lượng, Tiền công)

### Sidebar items (ước lượng)
- admin: 40+ items (full menu)
- planner: 25 items
- warehouse: 12 items
- sewing: 15 items (có cả mobile gia công)
- qc: 8 items
- finishing: 15 items
- accountant: 12 items
- content: 8 items
- partner: 5 items (chỉ gia công)

### Theme/UI
- Tất cả role dùng chung design system MIMIN (gradient, glassmorphism)
- Partner dùng mobile-first (5 màn hình gia công)
- Content/Admin dùng desktop-first

---

## 🔧 VI. CÁCH CHỈNH PHÂN QUYỀN

### A. Chỉnh Permission Matrix (admin)
1. Vào `/phan-quyen-tuy-chinh` (chỉ admin)
2. Click checkbox R/C/U/D cho từng cell (role × module)
3. Click **Lưu** → lưu vào `localStorage["mimin_permission_matrix_v2"]`
4. Hoặc click **Reset** → về mặc định

### B. Đổi role user (admin)
- Hiện tại: phải sửa SQL trực tiếp trong Supabase
- Có thể yêu cầu Mavis làm thêm UI **"Quản lý tài khoản"** tại `/quan-ly-tai-khoan`

### C. Thêm user mới
1. Tạo user trong Supabase Auth (qua SQL hoặc Admin API)
2. INSERT vào bảng `users` với role tương ứng
3. Dùng script `sync-22-new-nv.mjs` (mẫu có sẵn)

### D. Reset permission
- localStorage key: `mimin_permission_matrix_v2`
- Hoặc gọi `resetCustomMatrix()` trong Console DevTools

---

## 📞 KHI PHÁT SINH USER MỚI / CẦN THÊM

Báo Mavis với format:
```
[TASK] Tên: <tên NV mới>
       Email: <email @mimin.vn>
       Phòng ban: <BĐH/ĐPSX/Kho/May/QC/HT/Kế toán/Marketing/NCC>
       Vai trò: <role tương ứng>
       Module: <module cụ thể nếu có - vd: chỉ Ủi, chỉ Khuy nút>
       Mức lương: <lương CB nếu là nhân viên chính thức>
```

Em sẽ:
1. Tạo user trong Supabase Auth (bcrypt password)
2. INSERT vào bảng `users`
3. Update permission matrix nếu role mới
4. Gán phòng ban
5. Báo lại trong 5 phút

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **KHÔNG dùng user cũ** (`admin@mimin.com`, `gs013@mimin-erp.local`, etc.) - đã xóa sạch 2026-08-05
2. **NCC KHÔNG ĐƯỢC xem data NCC khác** - data isolation phải test kỹ
3. **Admin là role DUY NHẤT** thấy `/audit-log`, `/seed-data`, `/backup-restore`, `/phan-quyen-tuy-chinh`
4. **Partner KHÔNG ĐƯỢC thấy `/dashboard`** - sẽ redirect về `/trang-chu-gia-cong`
5. **Permission Matrix có thể admin tự chỉnh** qua localStorage (không cần dev deploy)
