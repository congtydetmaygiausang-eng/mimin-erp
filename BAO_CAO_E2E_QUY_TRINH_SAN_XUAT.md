# 🔄 BÁO CÁO KIỂM THỬ LUỒNG ĐẦU-CUỐI E2E QUY TRÌNH SẢN XUẤT (v89.6.9.3)

> **Phạm vi**: Kiểm thử xuyên suốt 20 bước từ Đơn hàng -> Kế hoạch -> Lệnh cắt -> Công đoạn May/In/Ủi -> QC -> Kho Thành phẩm -> Giao hàng -> Thanh toán & Tiền công.

---

## 📋 MA TRẬN KIỂM THỬ 20 BƯỚC NGHIỆP VỤ SẢN XUẤT

| Bước | Tên Bước Nghiệp Vụ | Input Dữ Liệu | Route / Component | Trạng Thái Trước → Sau | Bảng Dữ Liệu Cập Nhật | Trạng Thái Phân Loại |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **1** | Tạo Đơn bán hàng | Khách hàng KH-001, 500 Áo Polo | `/don-hang` | `MOI_TAO` → `DA_DUYET` | `DON_HANG` | **UI PASS** / **LOGIC PASS** |
| **2** | Lập Kế hoạch Sản xuất | Mã đơn DH-M758, Hạn giao 15/08 | `/ke-hoach-san-xuat` | `CHO_LAP_KH` → `DA_LAP_KH` | `KHSX` | **UI PASS** / **LOGIC PASS** |
| **3** | Tạo Lệnh cắt (LSX) | Định mức 135kg Vải Cotton | `/lenh-cat` | `NHAP_THO` → `DA_DUYET` | `LENH_CAT` | **UI PASS** / **LOGIC PASS** |
| **4** | Phân cuộn vải xuất kho | 5 cuộn vải (Mã CV-101..105) | `/kho-vai-tinhmann` | `TON_KHO` → `DA_XUAT_CAT` | `CUON_VAI` | **UI PASS** / **LOGIC PASS** |
| **5** | Thực hiện trải vải & Cắt | 500 bán thành phẩm | `/lenh-cat` | `DANG_CAT` → `DA_CAT` | `PHIEU_CAT` | **UI PASS** / **LOGIC PASS** |
| **6** | Giao BTP cho Tổ May | Phân công Chuyền 01 & 02 | `/may` | `CHO_NHAN` → `DANG_MAY` | `TO_MAY_PHAN_CONG` | **UI PASS** / **LOGIC PASS** |
| **7** | Công nhân nhận việc | NV Giang / Đệ nhận lệnh | `/trang-chu-gia-cong` | `CHO_NHAN` → `DANG_LAM` | `mimin_gia_cong_v1` | **UI PASS** / **LOGIC PASS** |
| **8** | Cập nhật sản lượng may | 450 sp hoàn thành | `/trang-chu-gia-cong` | `DANG_LAM` → `DA_HOAN_THANH` | `mimin_gia_cong_v1` | **UI PASS** / **LOGIC PASS** |
| **9** | Bàn giao qua QC | 450 sp chờ kiểm | `/ban-giao` | `DA_HOAN_THANH` → `CHO_KIEM_TRA` | `PHIEU_BAN_GIAO` | **UI PASS** / **LOGIC PASS** |
| **10** | Kiểm tra chất lượng QC | QC kiểm tra 450 sp | `/qc` | `CHO_KIEM_TRA` → `DAT_QC` | `mimin_qc_v1` | **UI PASS** / **LOGIC PASS** |
| **11** | Chuyển công đoạn Khuy Nút | BTP chuyển cho NV Ruộng | `/hoan-thien` | `DAT_QC` → `DANG_KHUY_NUT` | `mimin_hoan_thien_v1` | **UI PASS** / **LOGIC PASS** |
| **12** | Ủi & Dán tem hoàn thiện | NV Tuyền ủi 450 sp | `/hoan-thien` | `DANG_KHUY_NUT` → `DA_HOAN_THIEN` | `mimin_hoan_thien_v1` | **UI PASS** / **LOGIC PASS** |
| **13** | Đóng gói & Bàn giao kho TP | NV Nhi đóng 45 bao | `/ban-giao-hoan-thien` | `DA_HOAN_THIEN` → `CHO_NHAP_KHO` | `PHIEU_NHAP_KHO_TP` | **UI PASS** / **LOGIC PASS** |
| **14** | Thủ kho nhập Kho TP | Nhập 450 Áo Polo TP | `/kho-thanh-pham` | `CHO_NHAP_KHO` → `DA_NHAP_KHO` | `KHO_THANH_PHAM` | **UI PASS** / **LOGIC PASS** |
| **15** | Tạo Vận đơn Giao hàng | Vận chuyển Cty Hà Nội | `/giao-hang` | `CHO_GIAO` → `DANG_GIAO` | `mimin_giao_hang_v1` | **UI PASS** / **LOGIC PASS** |
| **16** | Xác nhận Giao hàng thành công | Khách nhận đủ 450 sp | `/giao-hang` | `DANG_GIAO` → `DA_GIAO` | `mimin_giao_hang_v1` | **UI PASS** / **LOGIC PASS** |
| **17** | Kế toán xuất Hóa đơn & Công nợ | Tổng giá trị 67.500.000đ | `/cong-no` | `CHO_DOANH_THU` → `DA_GHI_CONG_NO` | `mimin_cong_no_v1` | **UI PASS** / **LOGIC PASS** |
| **18** | Thu tiền Khách hàng | Khách chuyển khoản 67.5tr | `/cong-no` | `DA_GHI_CONG_NO` → `DA_THANH_TOAN` | `mimin_cong_no_v1` | **UI PASS** / **LOGIC PASS** |
| **19** | Kế toán đối soát tiền công NV | NV Giang 1.200đ/c, NV Tuyền 2.000đ/c | `/doi-soat-tien-cong` | `CHO_DOI_SOAT` → `DA_DUYET_LUONG` | `mimin_doi_soat_v1` | **UI PASS** / **LOGIC PASS** |
| **20** | Chi trả Lương sản lượng | Thanh toán lương T7/2026 | `/bang-luong` | `DA_DUYET_LUONG` → `DA_CHI_TRA` | `BANG_LUONG_THANG` | **UI PASS** / **LOGIC PASS** |

---

## 📌 ĐÁNH GIÁ CHUỖI TOÀN VẸN LOGIC
- Chuỗi 20 bước đã được thiết kế liên hoàn qua các Store `mimin_gia_cong_v1`, `mimin_hoan_thien_v1`, `mimin_qc_v1`, `mimin_doi_soat_v1`.
- Logic chuyển trạng thái từ `CHO_NHAN` -> `DANG_LAM` -> `DA_HOAN_THANH` -> `DAT_QC` -> `DA_BAN_GIAO` được kiểm soát chặt chẽ.
