-- ====================================================
-- GIA CỐ RÀNG BUỘC KHÓA NGOẠI (FOREIGN KEYS)
-- ====================================================

-- 1. Bảng Lương: Ép buộc mã nhân viên (ma_nv) phải tồn tại trong bảng nhan_su
ALTER TABLE bang_luong 
  ADD CONSTRAINT fk_bang_luong_nhan_su 
  FOREIGN KEY (ma_nv) 
  REFERENCES nhan_su(ma_nv) 
  ON DELETE CASCADE;

-- 2. Lệnh Cắt: Ép buộc mã Mẫu Công Đoạn phải tồn tại
-- (Để tránh nhập rác vào cột mau_cong_doan)
ALTER TABLE lenh_cat 
  ADD CONSTRAINT fk_lenh_cat_mau_cong_doan 
  FOREIGN KEY (mau_cong_doan) 
  REFERENCES mau_cong_doan(id) 
  ON DELETE SET NULL;

-- 3. Lệnh Cắt: Ép buộc mã Mẫu Chi Phí phải tồn tại
ALTER TABLE lenh_cat 
  ADD CONSTRAINT fk_lenh_cat_mau_chi_phi 
  FOREIGN KEY (mau_chi_phi) 
  REFERENCES mau_chi_phi(id) 
  ON DELETE SET NULL;


-- ====================================================
-- LƯU Ý VỀ BẢNG ĐƠN HÀNG (don_hang)
-- ====================================================
-- Hiện tại cột "khach_hang" trong bảng don_hang và lenh_cat đang lưu
-- TÊN KHÁCH HÀNG (ví dụ: "Cty May Hà Nội") thay vì MÃ KHÁCH HÀNG (ví dụ: "KH01").
-- Nếu chúng ta ép Khóa Ngoại ngay lập tức thì hệ thống sẽ báo lỗi.
-- 
-- Hướng xử lý tiếp theo:
-- 1. Em sẽ sửa code giao diện (UI) để lưu "Mã KH" thay vì "Tên KH".
-- 2. Sau đó mới chạy lệnh ép Khóa Ngoại cho Đơn hàng.
