-- ============================================
-- MIMIN ERP - Sua loi KHONG LUU DUOC len Supabase: don_hang + lenh_cat + khach_hang
-- 2026-08-19 - Ban sua lan 2 (lan 1 bi rollback het vi cau test o cuoi loi)
-- ============================================
-- QUAN TRONG VE CACH CHAY: bam nut "Run" cho TUNG PHAN rieng (PHAN A, roi PHAN B),
-- KHONG bam Run 1 lan cho ca file. Supabase SQL Editor chay moi lan "Run" la MOT
-- transaction - neu co 1 cau loi o cuoi, TOAN BO cac cau ALTER TABLE phia truoc
-- trong CUNG LAN RUN DO cung bi huy bo (rollback). Lan truoc da bi dung do:
-- da them cot xong nhung cau INSERT kiem tra o cuoi loi -> rollback mat het.
-- ============================================
--
-- VAN DE (da kiem chung truc tiep tren DB that qua nhieu vong test):
--
-- 1) don_hang: con thieu 14 cot cho model don hang nhieu san pham (items,
--    payments, shipping...) - PostgREST tu choi nguyen dong khi thieu 1 cot.
-- 2) don_hang: 2 cot cu "san_pham" va "loai" (thiet ke 1-don-1-san-pham truoc day)
--    vAN con NOT NULL + rang buoc CHECK gia tri cu. App moi KHONG con dien 2 cot
--    nay nua -> du them du cot o (1) thi van bi chan boi (2).
-- 3) lenh_cat: thieu 2 cot tong_sl_thuc_te_ao/quan -> lenh cat "Bo" (ao+quan)
--    tao moi deu luu that bai (day la loi lam lenh cat vua tao khong hien o To Cat).
-- 4) khach_hang: thieu cot nhu_cau_chinh -> tao/sua khach hang deu that bai.
--
-- Hau qua nghiem trong nhat: SELECT COUNT(*) FROM don_hang -> 0. Tu truoc den
-- gio CHUA CO don hang nao luu duoc len may chu, chi nam tam trong trinh duyet.
-- ============================================


-- ============================================
-- PHAN A - Bam "Run" cho khoi nay TRUOC (chi ALTER TABLE, an toan, khong the loi)
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

-- 2 cot cu "san_pham" / "loai" - go NOT NULL va go CHECK cu, vi model moi khong
-- con dien 2 cot nay (da thay bang cot "items" JSONB nhieu san pham).
ALTER TABLE don_hang ALTER COLUMN san_pham DROP NOT NULL;
ALTER TABLE don_hang ALTER COLUMN loai DROP NOT NULL;
ALTER TABLE don_hang DROP CONSTRAINT IF EXISTS don_hang_loai_check;
-- Phong khi so_luong/don_gia cung con NOT NULL tu thiet ke cu (an toan du dang la gi):
ALTER TABLE don_hang ALTER COLUMN so_luong DROP NOT NULL;
ALTER TABLE don_hang ALTER COLUMN don_gia DROP NOT NULL;

ALTER TABLE lenh_cat
  ADD COLUMN IF NOT EXISTS tong_sl_thuc_te_ao   NUMERIC,
  ADD COLUMN IF NOT EXISTS tong_sl_thuc_te_quan NUMERIC;

ALTER TABLE khach_hang
  ADD COLUMN IF NOT EXISTS nhu_cau_chinh JSONB DEFAULT '[]'::jsonb;


-- ============================================
-- PHAN B - Bam "Run" RIENG cho khoi nay SAU KHI Phan A da chay xong khong loi.
-- Day chi la buoc KIEM TRA - neu Phan B loi thi Phan A van giu nguyen (vi da
-- chay + commit o lan Run truoc do roi), chi can bao lai loi cu the la duoc.
-- ============================================

INSERT INTO don_hang
  (id, ma_dh, ngay_dat, ngay_giao, khach_hang, sdt, thanh_tien, trang_thai,
   loai_don_hang, tong_tien, items, payments, shipping, trang_thai_thanh_toan, da_tru_kho)
VALUES
  ('DH-KIEMTRA-XOA-DI', 'DH-KIEMTRA', CURRENT_DATE, CURRENT_DATE, 'Kiem tra', '0900000000',
   0, 'Mới', 'ban-le', 0, '[]'::jsonb, '[]'::jsonb, NULL, 'chua-thanh-toan', false);
DELETE FROM don_hang WHERE id = 'DH-KIEMTRA-XOA-DI';

INSERT INTO lenh_cat
  (id, loai_lenh, loai_sp, ma_sp, ten_sp, tong_sl, tong_sl_thuc_te_ao, tong_sl_thuc_te_quan,
   han_hoan_thanh, ti_le_size, ds_mau, ds_phu_lieu, phan_cong, trang_thai, ngay_tao, nguoi_tao)
VALUES
  ('LC-KIEMTRA-XOA-DI', 'HangDat', 'BoTru', 'TEST', 'Kiem tra', 10, 5, 5,
   CURRENT_DATE, '1:1', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'Nhap', CURRENT_DATE, 'test');
DELETE FROM lenh_cat WHERE id = 'LC-KIEMTRA-XOA-DI';

INSERT INTO khach_hang (id, ma_kh, ten_kh, nhu_cau_chinh)
VALUES ('KH-KIEMTRA-XOA-DI', 'KH-KIEMTRA', 'Kiem tra', '[]'::jsonb);
DELETE FROM khach_hang WHERE id = 'KH-KIEMTRA-XOA-DI';

-- Neu ca 3 INSERT/DELETE tren chay khong loi -> DA SUA XONG HOAN TOAN CA 3 BANG.


-- ============================================
-- LUU Y SAU KHI CHAY XONG CA 2 PHAN
-- ============================================
-- Cac don hang/lenh cat dang nam trong localStorage cua may dang dung SE TU DONG
-- day len may chu ngay lan sau mo lai trang tuong ung (store merge local + remote).
--
-- => QUAN TRONG: hay mo trang /don-hang va /lenh-cat bang DUNG CAI MAY / TRINH
--    DUYET da tao du lieu do TRUOC KHI xoa cache hay doi may. Mo bang may khac
--    (chua tung tao du lieu do) thi may do khong co gi de day len.
-- ============================================
