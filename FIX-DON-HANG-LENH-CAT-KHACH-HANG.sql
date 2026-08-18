-- ============================================
-- MIMIN ERP - Sua loi KHONG LUU DUOC len Supabase: don_hang + lenh_cat + khach_hang
-- 2026-08-18 - Phat hien khi kiem tra lai sau 4 dot sua he thong
-- ============================================
-- Vao: https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/sql/new
-- Paste toan bo file nay -> bam "Run"
-- ============================================
--
-- Ca 3 bang deu bi CUNG MOT LOAI LOI: code app da them field moi theo thoi gian
-- nhung bang that tren Supabase chua duoc ALTER theo kip, nen PostgREST tu choi
-- NGUYEN DONG khi thieu du 1 cot (loi PGRST204/42703). Day la loi da gap 2 lan
-- truoc do (giao_dich_kho, kho_thanh_pham) - lan nay phat hien tiep o don_hang
-- (nghiem trong nhat: TOAN BO don hang chua tung luu duoc) va lenh_cat + khach_hang.
-- ============================================
--
-- MUC DO: NGHIEM TRONG NHAT trong toan bo he thong.
--
-- VAN DE (da kiem chung truc tiep tren DB that):
--
--   Bang don_hang van dang o cau truc CU (moi don chi 1 san pham), trong khi
--   ung dung da chuyen sang cau truc MOI (1 don nhieu san pham, nhieu lan thanh
--   toan, co thong tin van chuyen).
--
--   Bang dang co:  id, ma_dh, ngay_dat, ngay_giao, khach_hang, sdt, san_pham,
--                  loai, so_luong, don_gia, thanh_tien, trang_thai, ghi_chu,
--                  tien_coc, created_at
--
--   Ung dung can THEM 14 cot: dia_chi, email, loai_don_hang, loai_don, kenh_ban,
--                  tong_tien, tien_cuoi_ky, giam_gia, lo_hang, items, payments,
--                  shipping, trang_thai_thanh_toan, da_tru_kho
--
--   Vi thieu cot "items" (va nhieu cot khac), PostgREST tu choi NGUYEN DONG
--   (loi PGRST204). Ket qua:
--
--       SELECT COUNT(*) FROM don_hang;  -->  0
--
--   Nghia la TU TRUOC DEN NAY CHUA CO DON HANG NAO duoc luu len may chu.
--   Tat ca don hang chi nam trong bo nho trinh duyet (localStorage) cua DUNG
--   MOT may. Doi may, doi trinh duyet, hoac xoa cache la MAT SACH don hang.
--   (Cong no khach hang thi van luu duoc binh thuong - bang khach_hang co 727
--   dong - nen so no van con, chi mat chi tiet don.)
--
-- ============================================
-- BUOC 1: Them cac cot con thieu
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


-- ============================================
-- BUOC 2: Kiem tra lai
-- ============================================
-- Cau lenh nay phai chay THANH CONG (khong bao loi) thi moi la da sua xong.

INSERT INTO don_hang
  (id, ma_dh, ngay_dat, ngay_giao, khach_hang, sdt, thanh_tien, trang_thai,
   loai_don_hang, tong_tien, items, payments, shipping, trang_thai_thanh_toan, da_tru_kho)
VALUES
  ('DH-KIEMTRA-XOA-DI', 'DH-KIEMTRA', CURRENT_DATE, CURRENT_DATE, 'Kiem tra', '0900000000',
   0, 'Mới', 'ban-le', 0, '[]'::jsonb, '[]'::jsonb, NULL, 'chua-thanh-toan', false);

DELETE FROM don_hang WHERE id = 'DH-KIEMTRA-XOA-DI';

-- Neu chay den day khong loi -> DA SUA XONG PHAN don_hang.


-- ============================================
-- BUOC 3: Bang lenh_cat - thieu 2 cot tong SL thuc te rieng ao/quan
-- ============================================
-- Hau qua: MOI lenh cat tao moi tu luc them tinh nang "Bo" (ao+quan) deu bi
-- Supabase tu choi luu -> lenh cat chi ton tai tam trong trinh duyet, mat khi
-- doi may/xoa cache. Day la ly do lenh cat "vua tao" khong hien o trang To Cat.

ALTER TABLE lenh_cat
  ADD COLUMN IF NOT EXISTS tong_sl_thuc_te_ao   NUMERIC,
  ADD COLUMN IF NOT EXISTS tong_sl_thuc_te_quan NUMERIC;


-- ============================================
-- BUOC 4: Bang khach_hang - thieu cot nhu_cau_chinh
-- ============================================
-- Hau qua: tao moi hoac SUA khach hang (doi ten, SDT, dia chi...) deu bi tu
-- choi luu. Rieng cap nhat cong no (Dot 4) khong bi anh huong vi chi update
-- dung 1 cot cong_no, khong di qua field nay.

ALTER TABLE khach_hang
  ADD COLUMN IF NOT EXISTS nhu_cau_chinh JSONB DEFAULT '[]'::jsonb;


-- ============================================
-- BUOC 5: Kiem tra lai lenh_cat + khach_hang
-- ============================================

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

-- Neu chay den day khong loi -> DA SUA XONG CA 3 BANG.


-- ============================================
-- LUU Y SAU KHI CHAY
-- ============================================
-- Cac don hang dang nam trong localStorage cua may dang dung SE TU DONG day len
-- may chu ngay lan sau mo trang Don hang (store merge local + remote).
--
-- => QUAN TRONG: hay mo trang /don-hang bang DUNG CAI MAY / TRINH DUYET da tao
--    don truoc do, TRUOC KHI xoa cache hay doi may. Neu mo bang may khac (chua
--    tung tao don) thi may do khong co du lieu de day len.
-- ============================================
