# 📋 AUDIT DANH MỤC SẢN PHẨM - MIMIN ERP

> **Ngày audit:** 2026-08-07
> **Người audit:** Mavis (theo yêu cầu sếp Sang)
> **Phạm vi:** 17 SP thật hiện có trên Supabase + form tạo đơn hàng
> **Mục tiêu:** Xác định fields CẦN BỔ SUNG để có thể tạo đơn hàng

---

## 📊 HIỆN TRẠNG 17 SP THẬT TRÊN SUPABASE

| Mã | Tên | Loại | Mã DM | Định mức |
|---|---|---|---|---|
| C003 | Phối lé thêu | Bộ trụ | DM-BTR | 0 |
| C014 | Phối tay thêu TT | Bộ trụ | DM-BTR | 0.56 |
| C015 | Trơn chạy dây thêu | Bộ trụ | DM-BTR | 0.54 |
| C018 | Trơn chạy sọc thuê | Bộ tròn | DM-BT | 0.54 |
| M002 | Phối chạy dây | Bộ trụ | DM-BTR | 0 |
| M004 | Phối chạy dây ép cao thành | Bộ tròn | DM-BT | 0.56 |
| M008 | Phối thêu | Bộ trụ | DM-BTR | 0 |
| M008 | Phối thêu | Áo trụ | DM-ATR | 0.3 |
| M024 | Phối lé thêu | Bộ tròn | DM-BT | 0 |
| M429 | Trơn dập nổi thân trước | Bộ tròn | DM-BT | 0.54 |
| M651 | Phối lé thêu | Bộ tròn | DM-BT | 0 |
| M758 | Phối in TT | Bộ trụ | DM-BTR | 0.54 |
| M885 | Lé thêu | Bộ tròn | DM-BT | 0.56 |
| M904 | Phối | Áo trụ | DM-ATR | 0.3 |
| M909 | Trơn thuê | Bộ trụ | DM-BTR | 0.54 |
| M970 | Phối chạy dây thêu TT | Bộ trụ | DM-BTR | 0 |
| M977 | Phối thêu | Bộ tròn | DM-BT | 0.56 |

**🔍 Columns hiện có (7):** `id, ma_sp, loai_sp, ma_dm, ten_sp, dinh_muc, created_at`

**❌ Vấn đề phát hiện:**
- M008 xuất hiện 2 lần (1 Bộ trụ, 1 Áo trụ) - có thể trùng lặp do chưa có constraint UNIQUE
- 5/17 SP có `dinh_muc = 0` (C003, M002, M008-BTR, M024, M651, M970) - không đủ info để tính vải

---

## 🎯 BẢNG SO SÁNH: SP hiện tại vs Form tạo đơn hàng

### Form tạo đơn hàng (OrderFormModal) cần những fields gì?

| Field trong Form | Nguồn từ san_pham | Hiện có? | Mức độ |
|---|---|---|---|
| Tên SP | `ten_sp` | ✅ Có | OK |
| Mã SP | `ma_sp` | ✅ Có | OK |
| Loại SP | `loai_sp` | ✅ Có | OK |
| Ảnh SP | `hinh_anh` | ❌ **THIẾU** | 🔴 BẮT BUỘC |
| Giá bán | `gia_ban_du_kien` | ❌ **THIẾU** | 🔴 BẮT BUỘC |
| Bảng size | `bang_size` (sizes, ratios) | ❌ **THIẾU** | 🔴 BẮT BUỘC |
| Tỉ lệ size | `ti_le_size` | ❌ **THIẾU** | 🟡 QUAN TRỌNG |
| Danh sách màu | `ds_mau` | ❌ **THIẾU** | 🔴 BẮT BUỘC |
| Trạng thái kho | `trang_thai` | ❌ **THIẾU** | 🟡 QUAN TRỌNG |
| Tồn kho | `ton_kho` | ❌ **THIẾU** | 🟢 Optional |
| Mô tả ngắn | `mo_ta_ngan` | ❌ **THIẾU** | 🟢 Optional |
| Nhà cung cấp | `ncc` | ❌ **THIẾU** | 🟢 Optional |
| Chất liệu | `chat_lieu` | ❌ **THIẾU** | 🟢 Optional |
| Giá vốn | `gia_von_du_kien` | ❌ **THIẾU** | 🟡 QUAN TRỌNG (tính LN) |
| Đã bán (stats) | `da_ban` | ❌ **THIẾU** | 🟢 Optional |

---

## 🎯 KẾT QUẢ: CẦN BỔ SUNG 10-12 CỘT

### 🔴 BẮT BUỘC (block tạo đơn - 4 cột)

| Cột mới | Type | Default | Mục đích |
|---|---|---|---|
| `gia_ban_du_kien` | NUMERIC(12,0) | 0 | Giá bán dự kiến - **không có thì form không thể tạo đơn** |
| `bang_size` | JSONB | `{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,2,1]}` | Bảng size - dùng để generate variants (maSP × mau × size) |
| `ds_mau` | JSONB | `[]` | Danh sách màu - dùng để generate variants, khách chọn màu |
| `hinh_anh` | TEXT | NULL | URL ảnh SP - hiển thị trong card đơn hàng |

### 🟡 QUAN TRỌNG (4 cột)

| Cột mới | Type | Default | Mục đích |
|---|---|---|---|
| `ti_le_size` | TEXT | '1:2:2:2:1' | Hiển thị tỉ lệ size (snapshot) |
| `trang_thai` | TEXT | 'con-hang' | CHECK constraint: con-hang / het-hang / sap-ve / ngung-kinh-doanh |
| `gia_von_du_kien` | NUMERIC(12,0) | 0 | Tính lợi nhuận (= gia_ban - gia_von) |
| `chat_lieu` | TEXT | 'Cotton' | Mô tả chất liệu vải |

### 🟢 OPTIONAL (4 cột)

| Cột mới | Type | Default | Mục đích |
|---|---|---|---|
| `ncc` | TEXT | NULL | Nhà cung cấp chính (FK sau) |
| `mo_ta_ngan` | TEXT | NULL | Mô tả ngắn hiển thị card |
| `ton_kho` | INTEGER | 0 | Tổng tồn kho (check khi tạo đơn) |
| `da_ban` | INTEGER | 0 | Thống kê số lượng đã bán |

---

## 📁 FILE SQL ĐÃ TẠO SẴN

**`add-sp-columns-for-orders.sql`** (5.6KB) - chạy trên Supabase Dashboard:
- ✅ ALTER TABLE thêm 12 cột (4 bắt buộc + 4 quan trọng + 4 optional)
- ✅ Tự động fill default cho 17 SP hiện có:
  - `gia_von = dinh_muc × 100,000` (ước lượng)
  - `gia_ban = gia_von × 1.5` (markup 50%)
  - `ds_mau` = 1 màu "Mặc định" (đủ để generate variants)
  - `bang_size` = 5 size Ri8 (M, L, XL, 2XL, 3XL - tỉ lệ 1:2:2:2:1)
  - `chat_lieu` = 'Cotton'
  - `trang_thai` = 'con-hang'
- ✅ Tạo index cho performance
- ✅ Verify query cuối file

---

## 🎨 SAU KHI CHẠY SQL

### Sep cần làm tiếp (tùy chọn)

1. **Upload ảnh thật** cho 17 SP (Sep có thể dùng file Unsplash từ trước hoặc tự chụp):
   ```sql
   UPDATE san_pham SET hinh_anh = 'https://images.unsplash.com/photo-...' WHERE ma_sp = 'M758';
   ```

2. **Bổ sung NCC + chất liệu** cho từng SP (nếu khác mặc định):
   ```sql
   UPDATE san_pham SET ncc = 'Dệt Phong Phú', chat_lieu = 'Cotton 95%, Spandex 5%' WHERE ma_sp = 'M758';
   ```

3. **Sửa M008 trùng lặp** (1 Bộ trụ, 1 Áo trụ) - quyết định giữ SP nào, xoá SP còn lại.

4. **Sửa 5 SP có `dinh_muc = 0`** - bổ sung định mức vải (cần để tính vải cắt).

---

## 🔄 LUỒNG TẠO ĐƠN HÀNG (sau khi có đủ fields)

```
┌─────────────────────┐
│ User mở /don-hang   │
│ Click "Tạo đơn"     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Tab 1: THÔNG TIN ĐƠN                    │
│ - Khách hàng (FK → khach_hang_si)       │
│ - Ngày đặt, deadline                    │
│ - Loại bán (lẻ/sỉ/sản xuất)            │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Tab 2: ITEMS (chọn SP)                  │
│ - Dropdown chọn SP → load ds_mau,      │
│   bang_size, gia_ban từ san_pham       │
│ - Auto-generate variants (mau × size)  │
│ - Chọn số lượng cho từng variant       │
│ - Tính thành tiền = sl × gia_ban       │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Tab 3: PAYMENT (thanh toán)             │
│ - Tiền cọc (nếu có)                     │
│ - Phương thức: CK / Tiền mặt / Cả hai  │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Tab 4: SHIPPING (vận chuyển)            │
│ - Địa chỉ giao                         │
│ - Phương thức: Grab / Viettel Post...  │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Lưu đơn → DB đơn_hàng                  │
│ - order_items lưu variant + số lượng   │
│ - Trừ tồn kho (nếu có)                 │
│ - Tạo phiếu xuất kho (nếu sản xuất)   │
└─────────────────────────────────────────┘
```

---

## 📌 TÓM TẮT HÀNH ĐỘNG

| Bước | Người | Thời gian |
|---|---|---|
| 1. Chạy `add-sp-columns-for-orders.sql` trên Supabase | Sếp | 2 phút |
| 2. Verify query cuối file → thấy 17 SP có đủ 12 cột | Sếp | 1 phút |
| 3. (Optional) Sửa M008 trùng + 5 SP thiếu định mức | Sếp | 10 phút |
| 4. (Optional) Upload ảnh thật cho SP | Sếp | 30 phút |
| 5. Test tạo đơn hàng từ /don-hang | Sếp + em | 15 phút |

**Sau khi chạy SQL, app sẽ load được 17 SP với đầy đủ info, Sep có thể vào /don-hang → Tạo đơn → chọn SP → chọn size/màu/số lượng → tạo đơn thành công!**

---

**File liên quan:**
- `add-sp-columns-for-orders.sql` (5.6KB) - SQL chính
- `apps/web/src/lib/data/danh-muc-sp-store.tsx` - code store (đã có sẵn type mới)
- `apps/web/src/lib/data/product-variants.ts` - generate variants từ ds_mau × bang_size
- `apps/web/src/components/order-detail/OrderFormModal.tsx` - form tạo đơn (49KB)
