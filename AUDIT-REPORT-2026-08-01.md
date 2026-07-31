# 🔍 AUDIT REPORT - MIMIN ERP v89.6.8
**Ngày audit**: 2026-08-01  
**Người audit**: Mavis  
**Phạm vi**: 8 đợt phân quyền (Đợt 1-8) + 9 stores + 10 helpers + 30+ pages  
**Phương pháp**: Đọc từng file, cross-check schema, công thức, logic giữa store ↔ helper ↔ page

---

## 📊 TỔNG QUAN

| Mức độ | Số lượng | Mô tả |
|---|---|---|
| 🔴 **BUG NGHIÊM TRỌNG** | 6 | Logic sai ảnh hưởng data thật, tính toán tiền, workflow |
| 🟠 **BUG NGHIỆP VỤ** | 7 | Trạng thái sai, filter không khớp, KPI không nhất quán |
| 🟡 **LOGIC MƠ HỒ** | 5 | Đặt tên/đếm không rõ ràng, có thể gây hiểu nhầm |
| 🔵 **CODE QUALITY** | 6 | Dead code, type phức tạp, không nhất quán giữa các store |

---

## 🔴 BUG NGHIÊM TRỌNG (CẦN FIX NGAY)

### BUG #1: KPI trang chủ Gia công KHÔNG merge với `taskStates` (Đợt 2)
- **File**: `apps/web/src/app/(main)/trang-chu-gia-cong/page.tsx:36`
- **Helper**: `apps/web/src/lib/workflow-filter.ts:104-143` (`getGiaCongKPI`)
- **Mô tả**: 
  - `getGiaCongKPI(user)` gọi `getWorkflowForUser(user)` → dùng data gốc `ALL_REAL_PHIEU` (KHÔNG merge với `taskStates` từ `gia-cong-store`)
  - Nhưng list "Lệnh mới" / "Đang thực hiện" ở dưới lại dùng `effectiveWorkflow = allWorkflow.map(getEffectiveTask)` (CÓ merge)
  - Hệ quả: Khi user nhận việc → `taskStates[taskId].trangThai = "Đang làm"`, KPI `kpi.moi` KHÔNG giảm nhưng list "Lệnh mới" GIẢM → SỐ LIỆU KHÔNG KHỚP nhau
- **Fix đề xuất**: Sửa `getGiaCongKPI` để merge với `taskStates` giống như trang `cong-viec`:
  ```typescript
  const phieus = getWorkflowForUser(user).map((p) => {
    const state = data.taskStates[p.id] || {};
    return { ...p, ...state };
  });
  ```
  Hoặc export `getGiaCongKPI` từ store (có access `taskStates`).

### BUG #2: Tiền công KPI dùng `thanhTien` gốc, KHÔNG cập nhật khi user update SL
- **File**: `apps/web/src/lib/workflow-filter.ts:131-135` (`kpi.tienCongHomNay`, `kpi.tienCongThangNay`)
- **Vấn đề**:
  - `kpi.tienCongHomNay += p.thanhTien;` - dùng `thanhTien` GỐC từ `ALL_REAL_PHIEU`
  - User update SL mới qua `capNhatSanLuong` → `taskStates[taskId].soLuongDat` thay đổi nhưng `taskStates[taskId].thanhTien` KHÔNG thay đổi
  - Trang `tien-cong/page.tsx:58` lại dùng `t.soLuongDat * t.donGia` → KHÁC với KPI ở trang chủ
- **Hệ quả**: Cùng 1 phiếu, 2 trang hiển thị 2 số tiền khác nhau
- **Fix**: Dùng công thức `soLuongDat * donGia` thống nhất ở CẢ 2 nơi

### BUG #3: Tiền công hôm nay/tháng KHÔNG CẬP NHẬT khi user báo cáo SL mới
- **File**: `apps/web/src/lib/workflow-filter.ts:127-135`
- **Vấn đề**:
  ```typescript
  if (p.ngayHoanThanh === today) {
    kpi.sanLuongHomNay += p.soLuongDat;
  }
  if (p.trangThai === "Hoàn thành") {
    const date = p.ngayHoanThanh || p.ngayGiao || "";
    if (date === today) kpi.tienCongHomNay += p.thanhTien;
    ...
  }
  ```
  - Dùng `p.ngayHoanThanh` GỐC (không merge `taskStates`)
  - User báo cáo SL mới với `ngay = today` (hôm nay) nhưng phiếu chưa bàn giao → `ngayHoanThanh = ""` → KHÔNG ĐƯỢC ĐẾM vào "hôm nay"
  - Nên dùng `sanLuongUpdates` từ gia-cong-store (đã có `ngay` chính xác)

### BUG #4: Sanity helper `kho-mobile-helper.ts` KHÔNG cập nhật `KHO_VAI/KHO_VAT_TU` khi nhập/xuất
- **File**: `apps/web/src/lib/data/kho-mobile-store.tsx` (actions `duyetPhieu`, `hoanThanh`, `tuChoiPhieu`)
- **Mô tả**: 
  - Phiếu nhập "Hoàn thành" → `KHO_VAI[i].tonKho` KHÔNG tăng
  - Phiếu xuất "Hoàn thành" → `KHO_VAI[i].tonKho` KHÔNG giảm
  - `getTonKhoHienTai("vai")` ở `kho-mobile-helper.ts:84-92` LUÔN trả về tồn gốc
  - Hệ quả: Mọi tính toán "Tồn vải", "Sắp hết (<100)" đều SAI so với thực tế sau khi có phiếu nhập/xuất
- **Đây là bug NGHIÊM TRỌNG NHẤT** vì ảnh hưởng đến quyết định mua hàng
- **Fix**: Trong `hoanThanh` action:
  ```typescript
  if (p.loai === "nhap") KHO_VAI[i].tonKho += p.soLuong;
  if (p.loai === "xuat") KHO_VAI[i].tonKho -= p.soLuong;
  ```
  Hoặc tách `KHO_VAI` ra thành mutable state trong store, sync lại real-data mỗi khi reset.

### BUG #5: Đối soát `congDoan` gộp SAI - `KN_` (Khuy nút) bị xếp vào "Ủi/Đóng gói"
- **File**: `apps/web/src/lib/data/doi-soat-store.tsx:103-110`
- **Vấn đề**:
  ```typescript
  const congDoan = ...
    : t.id.startsWith("KN_") ? "Ủi/Đóng gói"  // ❌ SAI - phải là "Khuy nút"
    : t.id.startsWith("UI_") ? "Ủi/Đóng gói"
    : t.id.startsWith("DG_") ? "Ủi/Đóng gói"
    ...
  ```
  - `KN_` là Khuy nút, KHÔNG phải Ủi/Đóng gói
  - Hệ quả: KPI "Theo công đoạn" ở `doi-soat-helper.ts:54-59` gộp Khuy nút + Ủi + Đóng gói thành 1 → sai
  - So sánh: `qc-store.tsx:89` và `hoan-thien-store.tsx:90-92` MAP ĐÚNG (`KN_` → "Khuy nút")
- **Fix**: Thêm type `DieuDoan` cho Khuy nút, hoặc:
  ```typescript
  : t.id.startsWith("KN_") ? "Khuy nút"
  : t.id.startsWith("UI_") ? "Ủi"
  : t.id.startsWith("DG_") ? "Đóng gói"
  ```

### BUG #6: QC store `themKhiieuNai` (đối soát) KHÔNG cập nhật `lichSu`
- **File**: `apps/web/src/lib/data/doi-soat-store.tsx:232-249`
- **Vấn đề**: Khi user khiếu nại:
  - `trangThai` được đổi thành "Có khiếu nại" ✓
  - `khiieuNai` được set ✓
  - **NHƯNG `lichSu` KHÔNG có entry mới** → `giaiQuyetKhiieuNai` (line 251-262) lấy `d.lichSu?.[length-1]?.trangThaiCu` để quay lại trạng thái trước sẽ **SAI** (lấy nhầm trạng thái cũ hơn)
- **Fix**: Thêm entry lichSu trong `themKhiieuNai`:
  ```typescript
  const lichSuMoi = [...(d.lichSu || []), {
    ngay: new Date().toISOString(),
    trangThaiCu: d.trangThai,
    trangThaiMoi: "Có khiếu nại" as TrangThaiDoiSoat,
    nguoiThucHien: user?.name || user?.id || "unknown",
    ghiChu: `Khiếu nại: ${noiDung}`,
  }];
  ```

---

## 🟠 BUG NGHIỆP VỤ (CẦN XEM XÉT)

### BUG #7: Filter "Cần làm lại" ở `cong-viec/page.tsx:31` không match trạng thái nào
- **File**: `apps/web/src/app/(main)/cong-viec/page.tsx:31`
- **Mô tả**: `match: (s) => s === "Cần làm lại"` nhưng `TrangThaiPhieu` (workflow-data.ts:7-9) KHÔNG có "Cần làm lại"
- **Có 12 status**: "Chờ giao", "Chờ gấp", "Đã giao", "Đang làm", "Đang may", "Đã nhận", "Hoàn thành", "Trễ hạn", "Lỗi", "Thiếu", "Sửa lại", "Đã thanh toán"
- **Fix**: 
  - Option A: Đổi match thành `s === "Sửa lại" || s === "Lỗi"`
  - Option B: Thêm "Cần làm lại" vào `TrangThaiPhieu` enum
  - Note: KPI `kpi.canLamLai` ở workflow-filter:139 dùng logic khác (`soLuongLoi > 0`) → cần thống nhất

### BUG #8: KPI `trang-chu-kho/page.tsx:86,90` "Nhập/Xuất hôm nay" TÍNH TỔNG (không phải hôm nay)
- **File**: `apps/web/src/app/(main)/trang-chu-kho/page.tsx:86,90`
- **Mô tả**: `kpi.tongGiaTriNhap` và `kpi.tongGiaTriXuat` ở `kho-mobile-helper.ts:60,64` tính TỔNG tất cả phiếu, không filter theo `ngayTao === today`
- **Fix**: Tính riêng "hôm nay" trong helper:
  ```typescript
  const today = new Date().toISOString().split("T")[0];
  if (p.loai === "nhap" && p.ngayTao === today) kpi.giaTriNhapHomNay += p.thanhTien;
  ```

### BUG #9: `nhap-kho-mobile/page.tsx:135` hardcode `donVi: "m"` (mét) cho tất cả loại kho
- **File**: `apps/web/src/app/(main)/nhap-kho-mobile/page.tsx:135`
- **Mô tả**: Khi tạo phiếu nhập, đơn vị LUÔN là "m" (mét), kể cả phụ liệu (đơn vị "Bộ", "Cái", "kg")
- **Fix**: Lấy `donVi` từ `dsSP` (data đã chọn ở select nhanh):
  ```typescript
  donVi: sp?.dvt || "m",  // lưu sp trong state khi user chọn
  ```

### BUG #10: QC workflow bị stuck - "Đã xử lý lỗi" không có cách quay lại "Đang kiểm" để "Đạt"
- **File**: `apps/web/src/lib/data/qc-store.tsx`
- **Mô tả**: Workflow QC:
  - "Chờ kiểm" → "Đang kiểm" → "Đạt" hoặc "Có lỗi"
  - "Có lỗi" → "Đã xử lý lỗi" (NV rework xong)
  - **NHƯNG từ "Đã xử lý lỗi" KHÔNG CÓ action để quay lại "Đang kiểm" và "Đạt"**
  - Action `dat` (line 176) chỉ set "Đạt" từ bất kỳ trạng thái nào, NHƯNG không thay đổi `ngayKiem` → khó truy vết
- **Fix**: Thêm action `kiemLai` (re-QC) chuyển "Đã xử lý lỗi" → "Đang kiểm" + clear `ngayHoanThanh`

### BUG #11: `cong-viec/page.tsx:30` filter "Chờ kiểm" khác với KPI `choKiem`
- **File**: `apps/web/src/app/(main)/cong-viec/page.tsx:30`
- **Mô tả**:
  - Filter "Chờ kiểm" ở page: `match: (s) => s === "Hoàn thành"` (TẤT CẢ phiếu hoàn thành)
  - KPI `kpi.choKiem` ở workflow-filter:140: `phieus.filter((p) => p.trangThai === "Hoàn thành" && !p.nguoiXacNhan).length` (chỉ phiếu chưa xác nhận)
- **Fix**: Đổi filter thành `s === "Hoàn thành" && !nguoiXacNhan` (cần truyền task vào match function)

### BUG #12: `trang-chu-hoan-thien/page.tsx:27` dùng `user.id` làm `maNV` không chắc chắn
- **File**: `apps/web/src/app/(main)/trang-chu-hoan-thien/page.tsx:27`
- **Mô tả**: 
  ```typescript
  const maNV = user.id;
  const userData = filterByNguoiThucHien(banGhi, maNV);
  ```
  - `filterByNguoiThucHien` (hoan-thien-helper.ts:63-66) so sánh với `b.nguoiThucHienMa` (NV011, NV017...)
  - Cần verify `user.id` từ SessionProvider có format đúng (NV001, NV011...)
  - Cùng vấn đề ở `trang-chu-kho/page.tsx` (dùng `user.id` cho filter)
- **Fix**: Verify SessionProvider hoặc dùng `getMaNVFromUser` từ `workflow-filter.ts:12`

### BUG #13: Audit log inconsistency giữa các stores
- **Mô tả**: 
  - `hoan-thien-store.tsx:194` `updateStatus` gọi `logWorkflow("update", ...)`
  - `qc-store.tsx:150` `updateStatus` KHÔNG gọi logWorkflow
  - `doi-soat-store.tsx:187` `capNhatTrangThai` gọi logWorkflow với action mapping
  - `kho-mobile-store.tsx:211` `updateStatus` KHÔNG gọi logWorkflow (chỉ các action riêng mới log)
- **Hệ quả**: Audit log bị miss, khó truy vết
- **Fix**: Chuẩn hoá pattern - mọi `updateStatus` nên log 1 entry chung, các action riêng log thêm nếu cần

---

## 🟡 LOGIC MƠ HỒ (CẦN LÀM RÕ)

### LOGIC #1: `kpi.canLamLai` đếm tất cả phiếu có lỗi, kể cả đã hoàn thành
- **File**: `apps/web/src/lib/workflow-filter.ts:139`
- **Mô tả**: `kpi.canLamLai = phieus.filter((p) => p.soLuongLoi > 0).length` - đếm TẤT CẢ có lỗi, không quan tâm trạng thái
- **Vấn đề**: Tên gọi "Cần làm lại" nhưng thực tế bao gồm cả phiếu đã hoàn thành (lỗi đã được xử lý)
- **Fix**: Thêm filter `p.trangThai !== "Hoàn thành"` hoặc đổi tên thành "Có lỗi"

### LOGIC #2: `kpi.sanLuongHomNay` dùng `ngayHoanThanh` gốc, không cập nhật khi user báo cáo SL mới
- (Đã nêu ở BUG #3 - note thêm: cần dùng `sanLuongUpdates`)

### LOGIC #3: Reset stores làm MẤT TOÀN BỘ dữ liệu user
- **Files**: Tất cả stores có action `reset` (gia-cong, hoan-thien, kho-mobile, qc, doi-soat, khsx, giao-hang)
- **Mô tả**: `reset()` xóa localStorage + restore default. Nếu user lỡ bấm → mất hết lịch sử
- **Fix**: Thêm `ConfirmDialog` (component dùng chung) trước khi reset

### LOGIC #4: `capNhatTienDo` ở KHSX set "Trễ hạn" tự động nhưng `batDauSX` KHÔNG check
- **File**: `apps/web/src/lib/data/khsx-store.tsx:109-127` vs `129-132`
- **Mô tả**: 
  - `capNhatTienDo` tự động chuyển sang "Trễ hạn" nếu quá `denNgay`
  - `batDauSX` chỉ đổi thành "Đang SX" mà KHÔNG check deadline
- **Fix**: Thêm check trong `batDauSX`

### LOGIC #5: Trang `cong-viec-hoan-thien` cho phép "Hoàn thành" từ "Đã nhận" (bypass "Đang làm")
- **File**: `apps/web/src/app/(main)/cong-viec-hoan-thien/page.tsx:152-156`
- **Mô tả**: Button "Hoàn thành" hiện khi `trangThai === "Đang làm" || trangThai === "Đã nhận"` - cho phép skip "Đang làm"
- **Fix**: Bỏ "Đã nhận" khỏi điều kiện, hoặc thêm confirm dialog nếu bypass

---

## 🔵 CODE QUALITY (NÊN REFACTOR)

### CQ #1: `cong-viec-hoan-thien/page.tsx:18` type `FilterTrangThai` quá phức tạp
- **Mô tả**: `"all" | ReturnType<typeof TRANG_THAI_HOAN_THIEN[number] extends infer T ? () => T : never> | (typeof TRANG_THAI_HOAN_THIEN)[number]`
- **Fix**: Đơn giản thành `"all" | (typeof TRANG_THAI_HOAN_THIEN)[number]`

### CQ #2: `hoan-thien-helper.ts:27` `tongDonGia` declared nhưng không bao giờ được cộng
- **Mô tả**: Field `tongDonGia` ở `HoanThienKPI` không có code nào `+=` trong vòng lặp
- **Fix**: Bỏ field này hoặc implement đúng

### CQ #3: `bang-dieu-hanh-helper.ts:127-129` `congDoanHienTai` chỉ hiển thị khâu đầu + count
- **Mô tả**: Nếu 5 khâu đều open, chỉ hiển thị "Cắt (+4)" → khó hiểu
- **Fix**: Hiển thị dạng danh sách: "Cắt → May → Ủi"

### CQ #4: `nhap-kho-mobile/page.tsx:31` filter pipeline dài dòng
- **Mô tả**: `filterByLoaiPhieu(filterByLoaiKho(phieu, filterKho), "nhap")` - nên dùng 1 helper
- **Fix**: Tạo `filterPhieu(phieu, { loaiKho, loaiPhieu })` ở helper

### CQ #5: `qc-store.tsx:176-200` action `dat` quá dài, hardcode "Đạt"
- **Mô tả**: Nên refactor dùng `updateStatus` chung
- **Fix**: Tách `updateStatus` ra làm helper, `dat` gọi nó

### CQ #6: `FloatingAI.tsx` dùng `ph: ...` với `ph` không rõ ràng
- **Mô tả**: `sophucTap` -> không rõ
- **Fix**: Sửa typo nếu có

---

## ✅ CROSS-CHECK: NHẤT QUÁN vs KHÔNG NHẤT QUÁN

### ✅ Nhất quán
- **Schema `PhieuWorkflow`** dùng đồng nhất ở `workflow-data.ts`, `real-workflow-data.ts`, các store Bộ 5/6/8
- **Công thức `thanhTien = soLuongDat * donGia`** dùng ở `bang-dieu-hanh-helper.ts:60-62` đúng với comment workflow-data.ts:86
- **`CongDoanKey` mapping** (CAT_/INTD_/MAY_/KN_/UI_/DG_) nhất quán giữa `bang-dieu-hanh-helper.ts:24-32`, `workflow-filter.ts:77-84`, `qc-store.tsx:89`, `hoan-thien-store.tsx:90-92`
- **`AuditAction` enum** đầy đủ, các store dùng đúng action name

### ❌ KHÔNG nhất quán
1. **`getGiaCongKPI` (workflow-filter.ts) không merge taskStates** ↔ **Pages có merge**
2. **`thanhTien` (gốc) ↔ `soLuongDat * donGia` (tính lại)** dùng 2 cách ở 2 nơi
3. **`congDoan` mapping `KN_`**: doi-soat-store (sai) ↔ qc-store (đúng)
4. **`canLamLai` (KPI) ↔ filter "Cần làm lại" (page)**: 2 logic khác nhau
5. **`choKiem` (KPI) ↔ filter "Chờ kiểm" (page)**: 2 logic khác nhau
6. **`updateStatus` có log vs không log** giữa các store
7. **`reset` KHÔNG có confirm dialog** → dễ mất data

---

## 🎯 ĐỀ XUẤT ƯU TIÊN FIX

### P0 - Fix ngay (ảnh hưởng tiền, tồn kho, KPI chính)
1. **BUG #1** (KPI trang chủ Gia công) - 30 phút
2. **BUG #2** (Tiền công KPI vs page) - 15 phút
3. **BUG #3** (Sản lượng hôm nay) - 20 phút
4. **BUG #4** (Tồn kho không cập nhật) - 1 giờ (cần test kỹ)
5. **BUG #5** (congDoan "Khuy nút" bị gộp sai) - 10 phút
6. **BUG #6** (themKhiieuNai thiếu lichSu) - 10 phút

### P1 - Xem xét (ảnh hưởng UX, nghiệp vụ)
7. **BUG #7** (Filter "Cần làm lại" không match) - 10 phút
8. **BUG #8** ("Nhập/Xuất hôm nay" sai) - 15 phút
9. **BUG #9** (donVi hardcode "m") - 10 phút
10. **BUG #10** (QC workflow bị stuck) - 30 phút
11. **BUG #11** (Filter "Chờ kiểm" khác KPI) - 10 phút
12. **BUG #12** (user.id không chắc = maNV) - 15 phút

### P2 - Refactor (chất lượng code)
- Các CQ #1-6

---

## 📝 CHECKLIST VERIFY SAU KHI FIX

```bash
cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
npx tsc --noEmit                                          # 0 errors
npm run build                                             # 89 routes OK
# Test thủ công:
# 1. /trang-chu-gia-cong → nhận việc → KPI "Lệnh mới" giảm đúng
# 2. /cong-viec → update SL → /trang-chu-gia-cong → "Tiền công hôm nay" tăng
# 3. /trang-chu-kho → tạo phiếu nhập → "Tồn vải" tăng đúng
# 4. /doi-soat → xem KPI theo công đoạn → "Khuy nút" tách riêng khỏi "Ủi"
# 5. /doi-soat → khiếu nại → giải quyết → trở về trạng thái trước đúng
# 6. /cong-viec → filter "Cần làm lại" → match đúng (Sửa lại/Lỗi)
# 7. /cong-viec → filter "Chờ kiểm" → chỉ hiện phiếu Hoàn thành chưa xác nhận
# 8. /kiem-tra-cl → "Có lỗi" → "Đã xử lý lỗi" → quay lại "Đang kiểm" được
```

---

**Maintainer**: Mavis  
**Reviewer**: Anh Sang (POLOMIMIN)  
**Ngày tạo**: 2026-08-01
