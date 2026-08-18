-- ============================================
-- MIMIN ERP - Sua loi KHONG LUU DUOC giao dich kho len Supabase
-- 2026-08-18 - Dot 2 cua ra soat he thong
-- ============================================
-- Vao: https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/sql/new
-- Paste toan bo file nay -> bam "Run"
-- ============================================
--
-- VAN DE PHAT HIEN (da kiem chung truc tiep tren DB that):
--
--   1. Bang giao_dich_kho THIEU cot "nguon_nhap" ma app dang gui
--      -> PostgREST tra loi PGRST204, TU CHOI NGUYEN DONG.
--      (Da xu ly xong o phia code: app khong gui cot nay nua, gop vao ghi_chu)
--
--   2. QUAN TRONG HON: bang giao_dich_kho co rang buoc khoa ngoai
--      "fk_giao_dich_kho_vat_tu" tren cot ma_vt -> bang vat_tu,
--      NHUNG bang vat_tu dang co 0 DONG.
--      -> MOI lenh ghi giao dich kho deu bi tu choi (loi 23503),
--         bat ke ma vat tu la gi. Day la ly do that su khien ton kho vai
--         KHONG BAO GIO luu duoc len may chu (chi luu tam trong may).
--
-- Kiem chung: SELECT COUNT(*) FROM vat_tu;  -> 0
--             SELECT COUNT(*) FROM giao_dich_kho; -> 80 (ghi truoc khi co FK)
--
-- ============================================
-- BUOC 1: Xem cau truc that cua bang vat_tu
-- ============================================
-- Chay rieng cau lenh nay truoc de biet bang vat_tu co nhung cot gi.
-- Neu ket qua tra ve khac voi gia dinh o BUOC 3, bao lai de dieu chinh.

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'vat_tu'
ORDER BY ordinal_position;


-- ============================================
-- BUOC 2: Them cot nguon_nhap (de danh cho sau nay)
-- ============================================
-- App hien da gop "nguon nhap" vao ghi_chu nen khong bat buoc,
-- nhung them vao de sau nay truy van duoc theo lenh cat.

ALTER TABLE giao_dich_kho
  ADD COLUMN IF NOT EXISTS nguon_nhap TEXT;


-- ============================================
-- BUOC 3: GO NUT THAT vat_tu  -- CHON 1 TRONG 2 CACH
-- ============================================
--
-- >>> CACH A (KHUYEN NGHI - don gian, dung voi thiet ke hien tai) <<<
--
-- Bo rang buoc khoa ngoai.
--
-- Ly do: danh muc vat tu that cua app nam trong file code
-- (apps/web/src/lib/data/real-data.ts - hang so KHO_VAI / KHO_VAT_TU),
-- KHONG nam trong bang vat_tu. Toan bo ma nguon app khong he doc hay ghi
-- bang vat_tu (da grep kiem tra: 0 ket qua). Rang buoc nay dang bat buoc
-- mot quan he ma app khong co cach nao duy tri duoc -> chi gay chan ghi.
--
-- Neu sau nay chuyen danh muc vat tu vao DB that thi them lai FK.

ALTER TABLE giao_dich_kho
  DROP CONSTRAINT IF EXISTS fk_giao_dich_kho_vat_tu;


-- >>> CACH B (neu muon GIU rang buoc toan ven du lieu) <<<
--
-- Thay vi bo FK, do danh muc vat tu vao bang vat_tu.
-- Bo comment (xoa dau --) o cac dong duoi va BO CACH A o tren di.
--
-- LUU Y: cach nay chi vá tam - moi khi them ma vai/phu lieu moi trong code
-- ma quen do vao bang vat_tu thi loi 23503 se quay lai, va thong bao loi
-- rat kho hieu voi nguoi dung cuoi.
--
-- -- Do cac ma dang duoc dung boi 80 dong giao dich san co:
-- INSERT INTO vat_tu (ma_vt)
-- SELECT DISTINCT ma_vt FROM giao_dich_kho
-- WHERE ma_vt IS NOT NULL
-- ON CONFLICT DO NOTHING;
--
-- -- Sau do can do them toan bo ma trong KHO_VAI / KHO_VAT_TU cua code.
-- -- (Bao lai ket qua BUOC 1 de sinh cau lenh INSERT day du.)


-- ============================================
-- BUOC 4: Kiem tra lai
-- ============================================
-- Sau khi chay xong, cau lenh nay phai chay THANH CONG (khong bao loi).
-- Neu OK thi xoa dong test di.

INSERT INTO giao_dich_kho
  (id, ngay, loai, loai_kho, ma_vt, ten_vt, so_luong, don_vi, don_gia, thanh_tien, nguoi_thuc_hien, ghi_chu)
VALUES
  ('GD-KIEMTRA-XOA-DI', CURRENT_DATE, 'XUAT', 'vai', 'V-KIEMTRA', 'Dong kiem tra', 1, 'kg', 0, 0, 'He thong', 'Dong kiem tra - xoa di');

DELETE FROM giao_dich_kho WHERE id = 'GD-KIEMTRA-XOA-DI';

-- Neu chay den day khong loi -> DA SUA XONG.
-- Tu gio moi lan "Bat dau cat & Xuat kho" se luu duoc len may chu that.

-- ============================================
-- HOAN THANH
-- ============================================
