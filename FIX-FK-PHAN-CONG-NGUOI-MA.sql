-- ============================================
-- FIX: FK trên phan_cong.nguoi_ma chặn nhầm "Đối tác gia công"
-- 2026-08-20 (v3 - thêm chặn xoá nhân viên/đối tác còn công nợ)
-- ============================================
-- Bối cảnh: phan_cong.nguoi_ma đang có FK -> nhan_su(ma_nv) cho MỌI dòng, không
-- phân biệt loại người phụ trách. Nhưng phan_cong.nguoi_ma của "Đối tác gia công"
-- (xưởng ngoài, VD "GC-IN-002") thực ra nằm trong bảng nha_cung_cap (cột ma_ncc,
-- where loai='doi_tac_gia_cong'), KHÔNG nằm trong nhan_su.
-- => Mọi lần công đoạn giao cho xưởng ngoài được đánh dấu "Hoàn thành" bị Supabase
-- từ chối ghi (lỗi FK).
--
-- v1 của file này (2026-08-19 đầu tiên) đoán nhầm tên constraint là
-- "fk_phan_cong_nhan_su" (theo APPLY-FK-CONSTRAINTS.sql trong repo) và DROP
-- CONSTRAINT IF EXISTS trên tên đó - lệnh "chạy thành công" nhưng KHÔNG XOÁ ĐƯỢC
-- GÌ vì tên thật trên Supabase production là "fk_phan_cong_nguoi" (xác nhận qua
-- pg_get_constraintdef ngày 2026-08-19: FOREIGN KEY (nguoi_ma) REFERENCES
-- nhan_su(ma_nv) ON DELETE SET NULL - khác cả tên lẫn ON DELETE behavior so với
-- APPLY-FK-CONSTRAINTS.sql, có vẻ đã bị 1 migration khác ghi đè ngoài repo).
-- v2 này DROP cả 2 tên để an toàn dù chạy trên môi trường nào.
--
-- Fix: bỏ FK cứng 1-bảng, thay bằng trigger kiểm tra CÓ ĐIỀU KIỆN theo cột
-- nguoi_loai đã có sẵn trong schema (trước đây app không set cột này, đã sửa
-- phanCongToRow() trong cong-no-store.tsx để luôn set kèm).
--
-- An toàn chạy lại nhiều lần: DROP IF EXISTS trước khi tạo.

BEGIN;

-- 1. Bỏ FK cứng chỉ trỏ 1 bảng nhan_su (cả tên cũ trong repo lẫn tên thật trên
--    Supabase - DROP IF EXISTS không lỗi nếu 1 trong 2 không tồn tại)
ALTER TABLE phan_cong
  DROP CONSTRAINT IF EXISTS fk_phan_cong_nhan_su;
ALTER TABLE phan_cong
  DROP CONSTRAINT IF EXISTS fk_phan_cong_nguoi;

-- 2. Trigger function: kiểm tra nguoi_ma theo đúng bảng dựa vào nguoi_loai.
--    - nguoi_loai = 'Đối tác gia công' -> phải khớp nha_cung_cap.ma_ncc
--    - còn lại (kể cả 'Nhân viên nội bộ' và NULL/dữ liệu cũ chưa có nguoi_loai,
--      để giữ đúng hành vi nghiêm ngặt cũ làm mặc định an toàn) -> phải khớp
--      nhan_su.ma_nv
CREATE OR REPLACE FUNCTION check_phan_cong_nguoi_ma()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nguoi_loai = 'Đối tác gia công' THEN
    IF NOT EXISTS (SELECT 1 FROM nha_cung_cap WHERE ma_ncc = NEW.nguoi_ma) THEN
      RAISE EXCEPTION 'phan_cong.nguoi_ma "%" (Đối tác gia công) không tồn tại trong nha_cung_cap.ma_ncc', NEW.nguoi_ma;
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM nhan_su WHERE ma_nv = NEW.nguoi_ma) THEN
      RAISE EXCEPTION 'phan_cong.nguoi_ma "%" (Nhân viên nội bộ) không tồn tại trong nhan_su.ma_nv', NEW.nguoi_ma;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_phan_cong_nguoi_ma ON phan_cong;
CREATE TRIGGER trg_check_phan_cong_nguoi_ma
  BEFORE INSERT OR UPDATE OF nguoi_ma, nguoi_loai ON phan_cong
  FOR EACH ROW
  EXECUTE FUNCTION check_phan_cong_nguoi_ma();

-- 3. (v3) Bỏ FK cũ đồng nghĩa bỏ luôn "ON DELETE SET NULL" cũ khi xoá nhân viên/
--    đối tác - nhưng cột phan_cong.nguoi_ma là NOT NULL nên hành vi SET NULL đó
--    thực ra chưa từng chạy được (Postgres sẽ chặn DELETE nếu phải set NULL vào
--    cột NOT NULL). Quyết định: CHẶN xoá nhân viên/đối tác nếu còn dòng phan_cong
--    tham chiếu (còn công nợ) - an toàn hơn, giữ đúng lịch sử trả công, người
--    dùng phải xử lý/xoá công nợ liên quan trước khi xoá nhân viên/đối tác đó.
CREATE OR REPLACE FUNCTION check_nhan_su_con_cong_no()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM phan_cong WHERE nguoi_ma = OLD.ma_nv) THEN
    RAISE EXCEPTION 'Không thể xoá nhân viên "%" (mã %) vì còn dòng công nợ công đoạn (phan_cong) tham chiếu tới mã này. Cần xử lý/xoá công nợ liên quan trước.', OLD.ho_ten, OLD.ma_nv;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_nhan_su_con_cong_no ON nhan_su;
CREATE TRIGGER trg_check_nhan_su_con_cong_no
  BEFORE DELETE ON nhan_su
  FOR EACH ROW
  EXECUTE FUNCTION check_nhan_su_con_cong_no();

CREATE OR REPLACE FUNCTION check_nha_cung_cap_con_cong_no()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM phan_cong WHERE nguoi_ma = OLD.ma_ncc) THEN
    RAISE EXCEPTION 'Không thể xoá nhà cung cấp/đối tác "%" (mã %) vì còn dòng công nợ công đoạn (phan_cong) tham chiếu tới mã này. Cần xử lý/xoá công nợ liên quan trước.', OLD.ten_ncc, OLD.ma_ncc;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_nha_cung_cap_con_cong_no ON nha_cung_cap;
CREATE TRIGGER trg_check_nha_cung_cap_con_cong_no
  BEFORE DELETE ON nha_cung_cap
  FOR EACH ROW
  EXECUTE FUNCTION check_nha_cung_cap_con_cong_no();

COMMIT;

-- ============================================
-- KIỂM TRA SAU KHI CHẠY (chạy tay, không phải phần migration):
-- 1) Xác nhận trigger đã gắn:
--    SELECT tgname FROM pg_trigger WHERE tgrelid = 'phan_cong'::regclass;
-- 2) Test 1 dòng "Đối tác gia công" hợp lệ (phải chạy được, trước đây bị chặn):
--    INSERT INTO phan_cong (id, lenh_cat_id, cong_doan, nguoi_ma, nguoi_ten, nguoi_loai,
--      don_gia_giao, so_luong_giao, ngay_giao, ngay_xong_du_kien, trang_thai)
--    VALUES ('PC-TEST-TRIGGER', '<1 id lenh_cat có thật>', 'Thêu', 'GC-IN-002',
--      'Xưởng thêu chị Hạnh', 'Đối tác gia công', 1000, 1, CURRENT_DATE, CURRENT_DATE, 'Hoàn thành');
--    -- rồi xoá lại: DELETE FROM phan_cong WHERE id = 'PC-TEST-TRIGGER';
-- 3) Test chặn xoá nhân viên còn công nợ (phải báo lỗi, không cho xoá):
--    DELETE FROM nhan_su WHERE ma_nv = 'GS018'; -- (nếu GS018 đang có dòng phan_cong)
-- ============================================
