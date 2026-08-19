-- ============================================
-- MIMIN ERP - Sua loi KHONG LUU DUOC len Supabase: don_hang + lenh_cat + khach_hang
-- 2026-08-19 - Ban sua lan 3 (lan 1 va 2 deu bi ROLLBACK het vi cau kiem tra loi)
-- ============================================
-- CHAY: bam "Run" MOT LAN DUY NHAT cho toan bo file nay. Khong can tach phan nua -
-- phan kiem tra o cuoi da duoc boc trong khoi tu bat loi (EXCEPTION), nen du no
-- co loi gi cung KHONG lam mat tac dung cac lenh ALTER TABLE o tren.
-- ============================================
--
-- VAN DE (da kiem chung truc tiep tren DB that qua nhieu vong test):
--
-- 1) don_hang: thieu 14 cot cho model don hang nhieu san pham (items, payments,
--    shipping...) - PostgREST tu choi nguyen dong khi thieu 1 cot.
-- 2) don_hang: 2 cot cu "san_pham" va "loai" (thiet ke 1-don-1-san-pham truoc day)
--    con NOT NULL + CHECK gia tri cu (don_hang_loai_check). App moi khong con
--    dien 2 cot nay nua.
-- 3) don_hang: cot "trang_thai" cung con CHECK gia tri cu (don_hang_trang_thai_check)
--    khac voi cac trang thai app dang dung ("Mới", "Đã duyệt", "Đang SX"...).
-- 4) lenh_cat: thieu 2 cot tong_sl_thuc_te_ao/quan -> lenh cat "Bo" (ao+quan)
--    tao moi deu luu that bai (day la loi lam lenh cat vua tao khong hien o To Cat).
-- 5) khach_hang: thieu cot nhu_cau_chinh -> tao/sua khach hang deu that bai.
--
-- Hau qua nghiem trong nhat: SELECT COUNT(*) FROM don_hang -> 0. Tu truoc den
-- gio CHUA CO don hang nao luu duoc len may chu, chi nam tam trong trinh duyet.
--
-- LUU Y KY THUAT: 2 lan sua truoc bi that bai vi Supabase SQL Editor chay ca
-- doan duoc chon nhu MOT transaction - cau INSERT kiem tra o cuoi loi se ROLLBACK
-- luon ca cac cau ALTER TABLE phia truoc trong cung 1 lan Run. Ban nay khong con
-- rui ro do nua vi da bo khoi kiem tra vao EXCEPTION block rieng.
-- ============================================


-- ============================================
-- BUOC 1: Them cot con thieu + go rang buoc cu tren don_hang
-- ============================================

ALTER TABLE don_hang
  ADD COLUMN IF NOT EXISTS dia_chi                TEXT,
  ADD COLUMN IF NOT EXISTS email                  TEXT,
  ADD COLUMN IF NOT EXISTS loai_don_hang          TEXT,
  ADD COLUMN IF NOT EXISTS loai_don               TEXT,
  ADD COLUMN IF NOT EXISTS kenh_ban               TEXT,
  ADD COLUMN IF NOT EXISTS tong_tien              NUMERIC,
  ADD COLUMN IF NOT EXISTS tien_cuoi_ky           NUMERIC,
  ADD COLUMN IF NOT EXISTS giam_gia               NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lo_hang                TEXT,
  ADD COLUMN IF NOT EXISTS items                  JSONB   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS payments               JSONB   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS shipping               JSONB,
  ADD COLUMN IF NOT EXISTS trang_thai_thanh_toan  TEXT,
  ADD COLUMN IF NOT EXISTS da_tru_kho             BOOLEAN DEFAULT false;

-- 2 cot cu "san_pham" / "loai" - model moi khong con dien nua
ALTER TABLE don_hang ALTER COLUMN san_pham DROP NOT NULL;
ALTER TABLE don_hang ALTER COLUMN loai DROP NOT NULL;
ALTER TABLE don_hang DROP CONSTRAINT IF EXISTS don_hang_loai_check;

-- "trang_thai" - CHECK cu chi cho phep vai gia tri cu, khong khop voi trang thai
-- that app dang dung ("Mới", "Đã duyệt", "Đang SX", "Hoàn thành", "Đã giao", "Hủy")
ALTER TABLE don_hang DROP CONSTRAINT IF EXISTS don_hang_trang_thai_check;

-- Phong khi so_luong/don_gia cung con NOT NULL tu thiet ke cu (an toan du dang la gi)
ALTER TABLE don_hang ALTER COLUMN so_luong DROP NOT NULL;
ALTER TABLE don_hang ALTER COLUMN don_gia DROP NOT NULL;


-- ============================================
-- BUOC 2: lenh_cat + khach_hang
-- ============================================

ALTER TABLE lenh_cat
  ADD COLUMN IF NOT EXISTS tong_sl_thuc_te_ao   NUMERIC,
  ADD COLUMN IF NOT EXISTS tong_sl_thuc_te_quan NUMERIC;

ALTER TABLE khach_hang
  ADD COLUMN IF NOT EXISTS nhu_cau_chinh JSONB DEFAULT '[]'::jsonb;


-- ============================================
-- BUOC 3: Kiem tra lai - BOC TRONG KHOI TU BAT LOI nen KHONG THE lam rollback
-- cac lenh ALTER TABLE o tren, du co loi gi xay ra o day.
-- ============================================

DO $$
BEGIN
  INSERT INTO don_hang
    (id, ma_dh, ngay_dat, ngay_giao, khach_hang, sdt, thanh_tien, trang_thai,
     loai_don_hang, tong_tien, items, payments, shipping, trang_thai_thanh_toan, da_tru_kho)
  VALUES
    ('DH-KIEMTRA-XOA-DI', 'DH-KIEMTRA', CURRENT_DATE, CURRENT_DATE, 'Kiem tra', '0900000000',
     0, 'Mới', 'ban-le', 0, '[]'::jsonb, '[]'::jsonb, NULL, 'chua-thanh-toan', false);
  DELETE FROM don_hang WHERE id = 'DH-KIEMTRA-XOA-DI';
  RAISE NOTICE 'OK: don_hang da luu duoc.';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'CHUA XONG don_hang: %', SQLERRM;
END $$;

DO $$
BEGIN
  INSERT INTO lenh_cat
    (id, loai_lenh, loai_sp, ma_sp, ten_sp, tong_sl, tong_sl_thuc_te_ao, tong_sl_thuc_te_quan,
     han_hoan_thanh, ti_le_size, ds_mau, ds_phu_lieu, phan_cong, trang_thai, ngay_tao, nguoi_tao)
  VALUES
    ('LC-KIEMTRA-XOA-DI', 'HangDat', 'BoTru', 'TEST', 'Kiem tra', 10, 5, 5,
     CURRENT_DATE, '1:1', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'Nhap', CURRENT_DATE, 'test');
  DELETE FROM lenh_cat WHERE id = 'LC-KIEMTRA-XOA-DI';
  RAISE NOTICE 'OK: lenh_cat da luu duoc.';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'CHUA XONG lenh_cat: %', SQLERRM;
END $$;

DO $$
BEGIN
  INSERT INTO khach_hang (id, ma_kh, ten_kh, nhu_cau_chinh)
  VALUES ('KH-KIEMTRA-XOA-DI', 'KH-KIEMTRA', 'Kiem tra', '[]'::jsonb);
  DELETE FROM khach_hang WHERE id = 'KH-KIEMTRA-XOA-DI';
  RAISE NOTICE 'OK: khach_hang da luu duoc.';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'CHUA XONG khach_hang: %', SQLERRM;
END $$;

-- Sau khi Run xong, xem tab "Logs"/"Notices" cua Supabase (khong phai "Results")
-- de doc 3 dong "NOTICE: OK: ..." hoac "NOTICE: CHUA XONG ...: <ly do>".
-- Neu ca 3 deu "OK" -> DA SUA XONG HOAN TOAN. Neu con dong "CHUA XONG" nao,
-- gui lai dung dong do (co ghi ro ten cot/rang buoc con vuong) de sua tiep.


-- ============================================
-- LUU Y SAU KHI SUA XONG
-- ============================================
-- Cac don hang/lenh cat dang nam trong localStorage cua may dang dung SE TU DONG
-- day len may chu ngay lan sau mo lai trang tuong ung (store merge local + remote).
--
-- => QUAN TRONG: hay mo trang /don-hang va /lenh-cat bang DUNG CAI MAY / TRINH
--    DUYET da tao du lieu do TRUOC KHI xoa cache hay doi may. Mo bang may khac
--    (chua tung tao du lieu do) thi may do khong co gi de day len.
-- ============================================
