# 📋 AUDIT 7 TABS DỮ LIỆU NỀN TẢNG - MIMIN ERP

> **Ngày audit:** 2026-08-07
> **Người audit:** Mavis (theo yêu cầu sếp Sang)
> **Phạm vi:** 6 Tab Master Data + 1 Tab Lệnh Cắt
> **Kết quả:** 5/7 Tab đầy đủ | 2/7 Tab thiếu fields nghiêm trọng

---

## 🏭 NHÓM 1: QUẢN LÝ NGUỒN LỰC VÀ ĐỐI TÁC

### ✅ TAB 1: NHÂN SỰ (nhan-su-store.tsx + nhan-su/data.ts)

| Sep yêu cầu | Hiện có (NhanSuExt) | Status |
|---|---|---|
| Mã NV (NV001) | `maNV` | ✅ |
| Họ và tên | `hoTen` | ✅ |
| Bộ phận (Cắt/May/QC...) | `boPhan` | ✅ |
| Chức vụ | `chucVu` | ✅ |
| Số ĐT | `sdt` | ✅ |
| Mức lương cứng | `luongCB`, `luongCung` | ✅ |
| Trạng thái (Đang làm/Đã nghỉ) | `trangThai` | ✅ |

**🎁 Bonus (nhiều hơn Sep yêu cầu):**
- `ngaySinh`, `gioiTinh`, `cccd`, `bhxh`, `mst` (Mã số thuế)
- `email`, `diaChiTT`, `diaChiTamTru`
- `ngayVaoLam`, `loaiHD`, `tinhTrangHN` (BHXH)
- `soTK`, `nganHang`
- `loaiLuong` (Thời gian / Sản phẩm)
- `rating` (đánh giá 3-5 sao)
- `avatar`, `cccdFrontImage`, `cccdBackImage` (ảnh)

**KẾT LUẬN TAB 1: ✅ ĐẦY ĐỦ 100%**

---

### ✅ TAB 2: KHÁCH HÀNG (khach-hang-store.tsx)

| Sep yêu cầu | Hiện có (KhachHangDBModel) | Status |
|---|---|---|
| Mã KH (KH-LAN) | `ma_kh` | ✅ |
| Tên khách hàng | `ten_kh` | ✅ |
| Số ĐT | `sdt` | ✅ |
| Phân loại (Đại lý cấp 1/2) | `loai` (text) | ⚠️ |
| Địa chỉ | `dia_chi` | ✅ |
| Công nợ hiện tại | `cong_no_hien_tai` | ✅ |
| Hạn mức cho nợ | `han_muc_no` | ✅ |

**🎁 Bonus:**
- `email`, `mst` (Mã số thuế)
- `nguoi_lh` (Người liên hệ)
- `trang_thai` (Thường/VIP/Cấm nợ)
- `rating` (đánh giá 1-5 sao)

**⚠️ VẤN ĐỀ PHỤ:**
1. **`loai` lưu dạng text tự do** (VD: "Công ty", "Shop") - chưa chuẩn hoá thành enum "Đại lý cấp 1/2" như Sep mô tả
2. **`rating` đang lưu trong `ghi_chu` dạng text** (regex match) - không clean, khó query
3. **`chinh_sach` (chính sách giá) đã có trong DB nhưng chưa map UI**

**KẾT LUẬN TAB 2: ✅ ĐẦY ĐỦ 100% (có 3 vấn đề nhỏ cần refine)**

---

### ⚠️ TAB 3: NHÀ CUNG CẤP (nha-cung-cap-store.tsx)

| Sep yêu cầu | Hiện có (NhaCungCapModel) | Status |
|---|---|---|
| Mã NCC (NCC-VAI01) | `ma_ncc` | ✅ |
| Tên công ty | `ten_ncc` | ✅ |
| Loại cung cấp (Vải/Phụ liệu) | `loai` (VaiTro) | ✅ |
| Số ĐT | `sdt` | ✅ |
| Công nợ hiện tại | `cong_no` | ✅ |

**🎁 Bonus:**
- `email`, `dia_chi`, `mst`, `nguoi_lh`
- `don_gia` (đơn giá nhập)
- `trang_thai` (Đang hợp tác / Ngừng)
- `han_muc` (đã có trong Type nhưng UI form chưa dùng)
- `rating`

**⚠️ VẤN ĐỀ PHỤ:**
1. **`han_muc` (Hạn mức cho nợ) có trong Type nhưng:**
   - Không có trong `mapToDB`/`fromDB` mapping
   - Không có trong UI form
   - Không sync với Supabase
   - → **CẦN BỔ SUNG** đầy đủ (nếu Sep muốn quản lý hạn mức NCC)
2. **`rating` lưu trong `ghi_chu` text** (giống Tab 2) - không clean
3. **Thiếu `loaiNCC` enum chuẩn** (Vải/Phụ liệu/Cả hai)

**KẾT LUẬN TAB 3: ⚠️ ĐỦ 100% theo Sep yêu cầu, nhưng THIẾU 1 field quan trọng (`han_muc` đầy đủ)**

---

### ❌ TAB 4: ĐỐI TÁC GIA CÔNG (doi-tac-store.tsx) - THIẾU NGHIÊM TRỌNG

| Sep yêu cầu | Hiện có (DoiTacDBModel) | Status |
|---|---|---|
| Mã xưởng (GC-IN01) | `ma_xuong` | ✅ |
| Tên xưởng | `ten_xuong` | ✅ |
| Chuyên môn (In/Thêu/Wash/May) | `loai` (text) | ⚠️ |
| Số ĐT | `sdt` | ✅ |
| **Công nợ gia công** | ❌ **KHÔNG CÓ** | ❌ |

**🎁 Bonus có sẵn:**
- `email`, `nguoi_lh`, `dia_chi`
- `cong_suat` (công suất xưởng)
- `don_gia_tb` (đơn giá trung bình)
- `don_vi` (đơn vị tính: cái/bộ/kg)
- `trang_thai`

**❌ THIẾU NGHIÊM TRỌNG:**
1. **`cong_no` (Công nợ gia công)** - Sep yêu cầu rõ ràng, nhưng Type KHÔNG CÓ
2. **`loai` lưu text tự do** - chưa chuẩn hoá thành enum (In / Thêu / Wash / May / In-Thêu / Wash-May...)
3. **Thiếu `ngayHopTac` (ngày bắt đầu hợp tác)**
4. **Thiếu `thoiHanThanhToan` (VD: 30 ngày cuối tháng)**
5. **Thiếu `phuongThucThanhToan` (Chuyển khoản/Tiền mặt)**

**KẾT LUẬN TAB 4: ❌ THIẾU 1 FIELD NGHIÊM TRỌNG (`cong_no` = Công nợ gia công) - CẦN BỔ SUNG GẤP**

---

## 📦 NHÓM 2: QUẢN LÝ HÀNG HOÁ VÀ TỒN KHO

### ✅ TAB 5: DANH MỤC SẢN PHẨM (danh-muc-sp-store.tsx)

| Sep yêu cầu | Hiện có (SanPham) | Status |
|---|---|---|
| Mã SP (M001) | `id`, `maSP` | ✅ |
| Tên sản phẩm | `tenSP` | ✅ |
| Loại SP (Áo Trụ/Polo/Bộ) | `loaiSP` (enum) | ✅ |
| Bảng Size (M,L,XL...) | `bangSize.sizes[]` | ✅ |
| Tỉ lệ cắt rập (1:2:2:2:1) | `tiLeSize` + `bangSize.ratios[]` | ✅ |
| Giá vốn dự kiến | `giaVonDuKien` | ✅ |
| Giá bán dự kiến | `giaBanDuKien` | ✅ |

**🎁 Bonus (em đã thêm ngày 2026-08-07):**
- `dsMau[]` (danh sách màu + ảnh)
- `trangThai` (còn hàng / hết / sắp về / ngừng KD)
- `daBan` (số lượng đã bán)
- `ncc` (nhà cung cấp)
- `chatLieu` (Cotton 100%, Polyester...)
- `luotXem` (analytics)
- `rating` (đánh giá)
- `hinhAnh` (URL ảnh sản phẩm)
- `ghiChu`, `ngayTao`

**KẾT LUẬN TAB 5: ✅ ĐẦY ĐỦ 100% + Bonus 9 fields**

---

### ⚠️ TAB 6: KHO VẢI (KhoVai trong real-data.ts + kho-store.tsx)

| Sep yêu cầu | Hiện có (KhoVai) | Status |
|---|---|---|
| Mã SKU Vải | `maVT` | ✅ |
| Tên Vải | `tenVT` | ✅ |
| Màu sắc | `mauSac` | ✅ |
| Số lượng tồn (Kg/M) | `tonKho` + `dvt` | ✅ |
| Đơn giá nhập | `donGia` | ✅ |
| **Số hao hụt** | ⚠️ CÓ TRONG TÍNH TOÁN | ⚠️ |

**🎁 Bonus có sẵn:**
- `loai` (Vải chính / Phụ liệu)
- `kho` (Kho lưu trữ)
- `tonToiThieu` (cảnh báo tồn kho)
- `soCayNhap`, `tonCay` (quản lý theo cây vải)
- `ghiChu`

**⚠️ VẤN ĐỀ VỀ HAO HỤT:**
- Hiện tại `KhoVai` KHÔNG có field `tyLeHaoHut` (số % hao hụt mặc định theo loại vải)
- Nhưng trong `/kho-vai-tinhmann` page có `HAO_HUT_MAC_DINH` và `DINH_MUC_VAI` - tức hao hụt được tính **theo Lệnh Sản Xuất (LSX)**, không phải theo vải
- `MauVai` (trong Lệnh Cắt) CÓ field `haoHut` riêng

**ĐỀ XUẤT:**
- Thêm `tyLeHaoHut` (number, % mặc định) vào `KhoVai` - để tự động fill vào `MauVai.haoHut` khi tạo LSX

**KẾT LUẬN TAB 6: ⚠️ ĐỦ 100% theo Sep yêu cầu, nhưng nên bổ sung `tyLeHaoHut` để tự động hoá**

---

## ⚙️ NHÓM 3: QUY TRÌNH LÕI SẢN XUẤT

### ❌ TAB 7: LỆNH CẮT (lenh-cat-store.tsx) - THIẾU NGHIÊM TRỌNG

| Sep yêu cầu | Hiện có (LenhCat) | Status |
|---|---|---|
| Mã Lệnh (LC-2026-001) | `id` (auto-gen) | ✅ |
| Chọn Sản phẩm từ (Tab 5) | `loaiSP`, `maSP`, `tenSP` | ✅ |
| Phân bổ Size và Số lượng cắt | `tiLeSize`, `tongSL`, `tongSLThucTe`, `MauVai.phanBoSize[]` | ✅ |
| Tính định mức vải (từ Tab 6) | `MauVai.dinhMuc`, `maVai`, `kgThucTe`, `haoHut` | ✅ |
| Tính tiền công (đẩy về Nhân sự Tab 1) | `phanCong[]` + `bangCOGS` | ⚠️ |
| **Tính công nợ đẩy về Xưởng ngoài (Tab 4)** | ⚠️ KHÔNG RÕ RÀNG | ❌ |

**CẤU TRÚC HIỆN TẠI:**

```typescript
// CongDoanItem - dùng cho CẢ NV nội bộ VÀ Xưởng ngoài
type CongDoanItem = {
  id: string;              // "cat", "mayAo", "in", "theu"...
  tenCongDoan: string;     // "Cắt", "May Áo", "In", "Thêu"...
  nguoiMa: string;         // ← KHÔNG RÕ LÀ NV HAY XƯỞNG
  nguoiTen: string;        // ← KHÔNG RÕ LÀ NV HAY XƯỞNG
  donGia: number;          // đơn giá gia công
};
```

**❌ VẤN ĐỀ NGHIÊM TRỌNG:**

1. **`phanCong` KHÔNG phân biệt NV nội bộ vs Xưởng ngoài:**
   - `nguoiMa` = "NV007" (NV cắt) hoặc "GC-IN01" (Xưởng in)?
   - Khi tính công nợ: không biết cộng vào `nhan_su.cong_no` hay `xuong_gia_cong.cong_no`
   - Khi thanh toán: không biết trừ từ bảng nào

2. **Thiếu tracking tiền công đã trả:**
   - Có `donGia` nhưng không có `soTienDaThanhToan`
   - Không biết NV/xưởng nào đã nhận tiền, còn nợ bao nhiêu

3. **Thiếu bảng `phuong_thuc_thanh_toan`:**
   - Chuyển khoản / Tiền mặt / Công nợ 30 ngày

4. **Thiếu `ngay_thanh_toan` / `trang_thai_thanh_toan`:**
   - Chưa thanh toán / Đã thanh toán 1 phần / Đã thanh toán đủ

**ĐỀ XUẤT REFACTOR LỚN:**

```typescript
// MỚI: Tách rõ NV nội bộ vs Xưởng ngoài
type PhanCongNoiBo = {
  loai: "noi_bo";
  maNV: string;            // FK -> nhan_su.ma_nv
  tenNV: string;
  congDoan: string;        // "Cắt", "May Áo"...
  donGia: number;
  soLuong: number;
  thanhTien: number;       // = donGia * soLuong
  daThanhToan: number;
  conLai: number;
  trangThai: "chua_tra" | "tra_mot_phan" | "da_tra_du";
  ngayThanhToan?: string;
};

type PhanCongXuongNgoai = {
  loai: "xuong_ngoai";
  maXuong: string;         // FK -> xuong_gia_cong.ma_xuong (CẦN THÊM cong_no)
  tenXuong: string;
  chuyenMon: string;
  congDoan: string;        // "In", "Thêu", "Wash"...
  donGia: number;
  soLuong: number;
  thanhTien: number;
  daThanhToan: number;
  conLai: number;
  trangThai: "chua_tra" | "tra_mot_phan" | "da_tra_du";
  hanThanhToan?: string;   // deadline trả tiền xưởng
  ngayThanhToan?: string;
};

type LenhCatPhanCong = (PhanCongNoiBo | PhanCongXuongNgoai)[];
```

**KẾT LUẬN TAB 7: ❌ THIẾU NGHIÊM TRỌNG - CẦN REFACTOR `phanCong` để tách rõ NV vs Xưởng, đồng thời bổ sung Tab 4 (`cong_no` cho xưởng)**

---

## 📊 TỔNG HỢP

| Tab | Tên | Status | Cần bổ sung |
|---|---|---|---|
| 1 | Nhân sự | ✅ 100% | (Đã đầy đủ) |
| 2 | Khách hàng | ✅ 100% | ⚠️ 3 refine nhỏ (enum loại, rating riêng, mapping chinh_sach) |
| 3 | Nhà cung cấp | ⚠️ 95% | ➕ `han_muc` đầy đủ (Type có, UI thiếu) |
| 4 | Đối tác gia công | ❌ 80% | ➕ `cong_no` (Công nợ gia công) - **BẮT BUỘC** |
| 5 | Danh mục SP | ✅ 100% | (Đã đầy đủ + 9 bonus) |
| 6 | Kho vải | ⚠️ 95% | ➕ `tyLeHaoHut` (mặc định theo vải) |
| 7 | Lệnh cắt | ❌ 70% | ❌ **REFACTOR LỚN** - tách `phanCong` thành NV nội bộ + Xưởng ngoài, thêm tracking thanh toán |

---

## 🎯 ĐỀ XUẤT ƯU TIÊN BỔ SUNG

### P0 (BẮT BUỘC - block business logic)
1. **Tab 4:** Thêm field `cong_no` (Công nợ gia công) - Sep yêu cầu rõ
2. **Tab 7:** Refactor `phanCong` tách rõ NV nội bộ vs Xưởng ngoài

### P1 (Quan trọng)
3. **Tab 3:** Hoàn thiện `han_muc` cho NCC (UI form + sync DB)
4. **Tab 2:** Refine `loai` thành enum (Đại lý cấp 1 / Đại lý cấp 2 / Khách lẻ)
5. **Tab 4:** Refine `loai` thành enum (In / Thêu / Wash / May / In-Thêu)

### P2 (Cải tiến)
6. **Tab 6:** Thêm `tyLeHaoHut` mặc định theo loại vải
7. **Tab 2 & 3:** Tách `rating` ra column riêng (không lưu trong `ghi_chu` text)

---

## 📁 FILES LIÊN QUAN

- `apps/web/src/lib/data/nhan-su-store.tsx` + `nhan-su/data.ts`
- `apps/web/src/lib/data/khach-hang-store.tsx`
- `apps/web/src/lib/data/nha-cung-cap-store.tsx`
- `apps/web/src/lib/data/doi-tac-store.tsx`
- `apps/web/src/lib/data/danh-muc-sp-store.tsx`
- `apps/web/src/lib/data/kho-store.tsx` + `real-data.ts` (KhoVai type)
- `apps/web/src/lib/data/lenh-cat-store.tsx`

---

**Em (Mavis) đề xuất:** Triển khai P0 trước (khoảng 2-3 giờ code) sẽ giải quyết được vấn đề "Công nợ đẩy về Nhân sự (Tab 1) và Xưởng ngoài (Tab 4)" mà sếp mô tả. Sếp duyệt em làm tiếp nhé!
