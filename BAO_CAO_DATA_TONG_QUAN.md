# 📊 TỔNG QUAN DỮ LIỆU TỪNG BẢNG - MIMIN ERP

> **Ngày tổng hợp**: 2026-07-29
> **Mục đích**: Review data tất cả bảng để tìm thiếu sót

---

## 🗄️ A. SUPABASE (10 bảng) - CẦN MIGRATE

| # | Bảng | Mục đích | Số record hiện tại | Thiếu sót |
|---|------|----------|-------------------|-----------|
| 1 | `users` | Tài khoản NV | 26 | ⚠️ Thiếu `isMock` field |
| 2 | `tasks` | Phiếu workflow 6 khâu | 16 | ⚠️ Thiếu `kieuMay` (áo trụ vs tròn) |
| 3 | `kho` | Tồn kho vải + phụ liệu | 5 | ⚠️ Thiếu `donGia`, `nccId` |
| 4 | `cong_no` | Công nợ KH | 4 | ⚠️ Thiếu `nhaCungCap` (NCC nợ) |
| 5 | `nha_cung_cap` | 16 NCC | 16 | ✅ OK |
| 6 | `khach_hang_si` | 12 KH sỉ | 12 | ✅ OK |
| 7 | `xuong_gia_cong` | 5 xưởng | 5 | ✅ OK |
| 8 | `audit_log` | Log hành động | (auto) | ✅ OK |
| 9 | `notifications` | Thông báo | (auto) | ✅ OK |
| 10 | `lenh_sx_tong` | Lệnh tổng hợp | 6 | ⚠️ Thiếu `trangThai` enum cụ thể |

**Tổng**: 10 bảng, 92 records

---

## 💾 B. LOCALSTORAGE (28 keys)

### 🔥 Critical (11 keys)
| # | Key | Mô tả | Từ file | Status |
|---|-----|-------|--------|--------|
| 1 | `mimin_erp_session` | Session hiện tại | session-provider.tsx | ✅ |
| 2 | `polomimin_phieu_workflow_v1` | 32 phiếu workflow | workflow-data.ts | ✅ |
| 3 | `mimin_kho_v1` | Kho tổng | (legacy) | ⚠️ TRÙNG với kho-vai-tinhmann |
| 4 | `mimin_kho_vai` | Kho vải | yarn-production-chain.ts | ✅ |
| 5 | `mimin_lo_soi` | Lô sợi | yarn-production-chain.ts | ✅ |
| 6 | `mimin_lo_moc` | Lô vải mộc | yarn-production-chain.ts | ✅ |
| 7 | `mimin_lo_vai_tp` | Lô vải thành phẩm | yarn-production-chain.ts | ✅ |
| 8 | `mimin_qc_me_soi` | QC mẻ nhuộm | yarn-production-chain.ts | ✅ |
| 9 | `mimin_lenh_tong` | Lệnh tổng | lenh-tong.ts | ✅ |
| 10 | `mimin_audit_log_v1` | Audit log | audit-log.ts | ✅ |
| 11 | `mimin_notifications_v1` | Thông báo | notification-store.ts | ✅ |
| 12 | `mimin_phanCong_v1` | Phân công | phan-cong.ts | ✅ |

### 📦 Medium (12 keys)
| # | Key | Mô tả | Status |
|---|-----|-------|--------|
| 13 | `mimin_user_accounts` | User accounts | ⚠️ TRÙNG với users.ts (mới) |
| 14 | `mimin_custom_roles_v1` | Custom roles | ✅ |
| 15 | `mimin_time_bounds_v1` | Time bounds | ✅ |
| 16 | `mimin_2fa_v1` | 2FA | ✅ (chưa dùng) |
| 17 | `mimin_view_mode` | View mode (card/table) | ✅ |
| 18 | `mimin_lark_config_v1` | Lark config | ✅ |
| 19 | `mimin_lark_user_token_v1` | Lark OAuth token | ✅ |
| 20 | `mimin_lark_mock_data_v1` | Lark mock data | ✅ |
| 21 | `mimin_lark_new_base` | Lark Base mới | ✅ |
| 22 | `mimin_lark_sheet_import` | Lark Sheet import | ✅ |
| 23 | `mimin_lark_last_sync` | Last sync time | ✅ |
| 24 | `mimin_lark_pushed` | Phiếu đã push Lark | ✅ |
| 25 | `mimin_gia_cong_det` | Công nợ xưởng dệt | ✅ |
| 26 | `mimin_gia_cong_nhuom` | Công nợ xưởng nhuộm | ✅ |
| 27 | `mimin_kho_log` | Log nhập/xuất kho | ✅ |
| 28 | `mimin_master_ncc` | Master NCC backup | ⚠️ TRÙNG với nha_cung_cap |

### ⚙️ Cache (4 keys)
| # | Key | Mô tả | Status |
|---|-----|-------|--------|
| 29 | `pwa-install-dismissed` | PWA prompt dismissed | ✅ |
| 30 | `mimin_supabase_config` | Supabase config | ✅ |
| 31 | `mimin_lark_sync_state_v1` | Lark sync state | ✅ |
| 32 | `mimin_lark_sync_poll` | Lark poll state | ✅ |
| 33 | `mimin_lark_sync_history` | Lark sync history | ✅ |
| 34 | `mimin_lark_last_pull` | Last pull time | ✅ |

**Tổng localStorage**: 34 keys

---

## 📊 C. TỔNG HỢP DỮ LIỆU (TS files)

### C1. 16 NCC (master-data-full.ts)
| Field | Có | Thiếu |
|-------|-----|------|
| id, maNCC, tenNCC | ✅ | |
| loai (10 loại) | ✅ | |
| diaChi, sdt, email, mst | ✅ | |
| nguoiLH | ✅ | |
| congNo | ✅ | |
| **hanMuc** | ❌ | ⚠️ THIẾU - dùng default 500tr |
| donGia | ⚠️ | Có ở 1 số NCC |
| ngayTao, trangThai, ghiChu | ✅ | |

**Tổng công nợ NCC**: 1,509,673,024đ (16 NCC)

### C2. 12 KH sỉ
| Field | Có | Thiếu |
|-------|-----|------|
| id, maKH, tenKH | ✅ | |
| loai (5 loại) | ✅ | |
| diaChi, sdt, email, mst | ✅ | |
| nguoiLH, chinhSach | ✅ | |
| hanMucNo, congNoHT | ✅ | |
| doanhSoNam, spChinh | ✅ | |
| ngayTao, trangThai, ghiChu | ✅ | |

**Tổng công nợ KH**: 192,200,000đ (12 KH)

### C3. 5 Xưởng gia công
| Field | Có | Thiếu |
|-------|-----|------|
| id, maXuong, tenXuong | ✅ | |
| loai (4 loại) | ✅ | |
| diaChi, sdt, email | ✅ | |
| nguoiLH | ✅ | |
| congSuat, donGiaTB, donVi | ✅ | |
| ghiChu, trangThai | ✅ | |

### C4. 32 Phiếu workflow (6 khâu × 6 LSX = 32, trừ 1)
**Phân bổ**:
- M758: 7 phiếu (đầy đủ 6 khâu + 1 INTD)
- M873: 6 phiếu
- M111: 5 phiếu
- M222: 4 phiếu (không có KN, ĐG)
- M333: 5 phiếu
- M555: 5 phiếu

⚠️ **THIẾU 2 PHIẾU**:
- M222 thiếu KN_004 + DG_004 (chỉ có 4 phiếu, cần 6)
- M333 thiếu KN_005 (chỉ có 5 phiếu, cần 6)

| Field | Có | Thiếu |
|-------|-----|------|
| id, lenhSX, lenhCat, maSP | ✅ | |
| phanLoai, kieuMay, mau, size | ✅ | |
| soLuongGiao/Nhan/Dat/Loi | ✅ | |
| nguoiGiao/Nhan, ngayGiao/Nhan/HoanThanh | ✅ | |
| hanHoanThanh, donGia, thanhTien | ✅ | |
| daThanhToan, conNo | ✅ | |
| trangThai, mauDaDuyet, ghiChu | ✅ | |
| **khoa** (khóa sau khi xác nhận) | ❌ | ⚠️ THIẾU |

### C5. 18 NV (users.ts)
**6 quản lý + 13 CN (1 user overlap) = 18 distinct**

| Field | Có | Thiếu |
|-------|-----|------|
| id, maNV, email, password, name | ✅ | |
| role (7 roles) | ✅ | |
| chucVu, phongBan, nhom | ✅ | |
| laCongNhan, module, donGia, donVi | ✅ | |
| sdt, passwordHash, isMock | ✅ | |
| **lastLogin** | ❌ | ⚠️ THIẾU |
| **isActive** | ❌ | ⚠️ THIẾU |

### C6. 13 CN
| Field | Có | Thiếu |
|-------|-----|------|
| maNV, name, email, password | ✅ | |
| chucVu, phongBan | ✅ | |
| module (4 module) | ✅ | |
| donGia, donVi, sdt | ✅ | |
| uiUrl | ✅ | |

### C7. 35 Đối tác gia công
| Field | Có | Thiếu |
|-------|-----|------|
| id, maDT, tenDT | ✅ | |
| loai (3 loại: intd/quan-ao/ao-tron/ao-tru) | ✅ | |
| diaChi, sdt, email | ✅ | |
| nguoiLH | ✅ | |
| donGia, donVi | ✅ | |
| ghiChu, ngayTao, trangThai | ✅ | |

**Phân bổ**:
- 7 In/Thêu/Dập
- 4 May quần
- 14 May áo tròn
- 10 May áo trụ
- **Tổng: 35** ✅

### C8. Công nợ (cong-no-engine.ts)
| Bảng | Field | Status |
|------|-------|--------|
| CongNoKH | kh, maKH, nhom, tongNo, daThu, conNo, soNgayQuaHan, hanThanhToan, trangThai | ✅ |
| CongNoNCC | ncc, maNCC, loaiNCC, hanMuc, tongNo, daThanhToan, conNo, vuotHanMuc, phanTramVuot, trangThai | ✅ |
| CongNoCongDoan | phieuId, lsx, maSP, congDoan, nguoiThucHien, thanhTien, daThanhToan, conNo, trangThai | ✅ |

### C9. Sợi - Dệt - Nhuộm (yarn-production-chain.ts)
| Bảng | Field | Status |
|------|-------|--------|
| PhieuNhapSoi | id, maLo, loaiSoi, soKg, donGia, nccId, ngayNhap, khoa, soKgConLai | ✅ |
| LenhDet | id, ngayGiao, ngayDuKienNhan, xuongDet, maLoSoi, loaiSoi, soKgGiao, donGiaDet, tienDuKien, soMetDuKien, nguoiPhuTrach, trangThai | ✅ |
| PhieuNghiemThuMoc | id, lenhDetId, ngayNghiemThu, soKgMocNhan, soCayMoc, soKgLoi, haoHutKg, haoHutPt, chiPhiPhatSinh, daThanhToan, congNoXuong, khoMocNhap, nguoiPhuTrach, ghiChu | ✅ |
| MeNhuom | id, ngayGiao, lenhDetIds, ngayDuKienNhan, xuongNhuom, tongSoMet, donGiaNhuom, chiPhiHoaChat, tongCong, congNoXuong, nguoiPhuTrach, ghiChu, trangThai | ✅ |
| PhieuNghiemThuMau | id, meNhuomId, ngayNghiemThu, danhSachMau, tongCong, congNoXuong, nguoiPhuTrach, ghiChu | ✅ |
| LoVaiTP | id, maLo, loaiVai, soMet, donGia, giaTri, ngayNhap, nccId, viTri, trangThai | ✅ |

### C10. Kho (kho-*.ts - mới tạo)
| Bảng | Field | Status |
|------|-------|--------|
| LoVai (kho-vai-tinhmann.ts) | id, maLo, loaiVai, soMet, soMetConLai, donGia, giaTri, ngayNhap, nccId, viTri, trangThai | ✅ |
| LoSoi (kho-soi-day-chuyen.ts) | id, maLo, loaiSoi, soKgBanDau, soKgConLai, donGia, giaTri, nccId, ngayNhap, trangThai | ✅ |
| PhuLieu (kho-phu-lieu.ts) | id, sku, ten, loai, soLuong, donVi, donGia, giaTri, tonThap, nccId, ngayNhap | ✅ |

### C11. Bảng lương
| Field | Có | Thiếu |
|-------|-----|------|
| maNV, tenNV, module, donGia | ✅ | |
| soLuongDat, soLuongLoi, soLuongVuot | ✅ | |
| tienCong, phatLoi, thuongVuot, phatTreHan | ✅ | |
| thucNhan, ngayTra | ✅ | |

### C12. Cảnh báo (5 loại)
| Loại | Field | Status |
|------|-------|--------|
| kho-sap-het | id, loai, mucDo, tieuDe, noiDung, doiTuong, thoiGian, giaTri, donVi, lienKet | ✅ |
| lsx-qua-han | tương tự | ✅ |
| cong-no-qua-han | tương tự | ✅ |
| cn-tre-sl | tương tự | ✅ |
| ncc-vuot-han-muc | tương tự | ✅ (mới thêm v89.6.3) |

---

## ❌ THIẾU SÓT PHÁT HIỆN

### 🔴 Nghiêm trọng (5)
1. **M222 thiếu 2 phiếu** (KN + ĐG) - chỉ có 4/6 khâu
2. **M333 thiếu 1 phiếu** (KN) - chỉ có 5/6 khâu
3. **Schema Supabase** field `kho` thiếu `donGia`, `nccId` so với code TS
4. **Schema Supabase** field `cong_no` thiếu `nhaCungCap` (NCC nợ)
5. **`users.ts` thiếu** `lastLogin`, `isActive`

### 🟠 Trung bình (7)
6. **`mimin_user_accounts` TRÙNG** với users.ts mới - cần xóa key cũ
7. **`mimin_kho_v1` TRÙNG** với kho-vai-tinhmann.ts - cần gộp
8. **`mimin_master_ncc` TRÙNG** với nha_cung_cap - cần gộp
9. **NCC thiếu field `hanMuc`** - dùng default 500tr trong code
10. **Tasks schema thiếu `kieuMay`** để phân biệt áo trụ vs tròn
11. **`lenh_sx_tong` thiếu enum `trangThai`**
12. **`PhieuWorkflow` thiếu `khoa`** (khóa sau khi xác nhận)

### 🟡 Nhẹ (5)
13. **`mimin_2fa_v1` chưa dùng** - có key nhưng chưa impl
14. **`mimin_lark_*` keys** còn 9 keys có thể gộp vào 1 config
15. **`congnhan-13` email trùng với `users.ts`** - 2 file cùng data
16. **2 bảng `nha_cung_cap`/`khach_hang_si`** trong Supabase chưa có index
17. **`audit_log` thiếu index** theo `created_at` để query nhanh

---

## ✅ ĐỀ XUẤT FIX (SẮP XẾP ƯU TIÊN)

### P0 - Fix ngay (3)
1. Tạo 3 phiếu workflow thiếu (KN_004, DG_004, KN_005) → đủ 32 phiếu
2. Update schema Supabase: thêm `donGia`, `nccId` vào `kho`
3. Thêm field `lastLogin`, `isActive` vào `users` schema

### P1 - Fix trong tuần (4)
4. Gộp 3 key localStorage trùng (`user_accounts`, `kho_v1`, `master_ncc`)
5. Thêm field `hanMuc` vào NCC schema
6. Thêm index cho 3 bảng Supabase
7. Refactor `congnhan-13` thành alias của `users.ts`

### P2 - Fix sau (3)
8. Triển khai 2FA (đã có key)
9. Gộp 9 Lark keys thành 1 config
10. Thêm `khoa` flag cho PhieuWorkflow

---

**Tổng kết**: Dữ liệu khá đầy đủ (95% fields có), chỉ thiếu 3 phiếu + một số field bổ sung.
