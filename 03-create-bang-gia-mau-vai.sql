-- Bang gia + ma nhuom theo mau vai (GIGATEX / Thai Thanh / Tan Duc Khanh)
-- Nguon: 03_Gia_va_ma_mau_vai_POLOMIMIN.csv
CREATE TABLE IF NOT EXISTS public.bang_gia_mau_vai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ten_mau_vai TEXT NOT NULL,
  ma_mau_vai_noi_bo TEXT,
  ma_nhuom_gigatex TEXT,
  ma_nhuom_thai_thanh TEXT,
  ma_nhuom_tan_duc_khanh TEXT,
  lab_dip_chot TEXT,
  gia_mua_vai NUMERIC(12,0),
  don_gia_gia_cong_gigatex NUMERIC(12,0),
  ky_tu_ngay DATE,
  ky_den_ngay DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bang_gia_mau_vai_ten ON public.bang_gia_mau_vai(ten_mau_vai);

ALTER TABLE public.bang_gia_mau_vai ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_bang_gia_mau_vai" ON public.bang_gia_mau_vai;
DROP POLICY IF EXISTS "auth_write_bang_gia_mau_vai" ON public.bang_gia_mau_vai;
CREATE POLICY "anon_read_bang_gia_mau_vai" ON public.bang_gia_mau_vai FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_bang_gia_mau_vai" ON public.bang_gia_mau_vai FOR ALL TO authenticated USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

-- Du lieu tu file CSV (28 mau). O trong CSV goc bi cat ngan ("…") duoc de NULL
-- thay vi luu gia tri sai, vi khong the biet ma nhuom day du la gi.
INSERT INTO public.bang_gia_mau_vai
  (ten_mau_vai, ma_mau_vai_noi_bo, ma_nhuom_gigatex, ma_nhuom_thai_thanh, ma_nhuom_tan_duc_khanh, lab_dip_chot, gia_mua_vai, don_gia_gia_cong_gigatex, ky_tu_ngay, ky_den_ngay)
VALUES
  ('Trắng', NULL, NULL, 'D0-WH-0-01-00-0008', NULL, NULL, NULL, 14000, '2026-03-01', '2026-04-30'),
  ('Trắng 003', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('Đen BM 4-5', NULL, NULL, NULL, 'KA030-AD0-BK-0-11-00-0017', NULL, NULL, 39000, '2026-03-01', '2026-04-30'),
  ('Đen cầm màu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('Xanh Đen BM 4-5', NULL, NULL, NULL, NULL, NULL, NULL, 39000, '2026-03-01', '2026-04-30'),
  ('Xanh Đen cầm màu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('Xanh Nhớt 069', NULL, NULL, NULL, NULL, NULL, NULL, 20000, '2026-03-01', '2026-04-30'),
  ('Cổ Vịt 012', NULL, NULL, 'D0-BL-0-03-00-0017', NULL, NULL, NULL, 20000, '2026-03-01', '2026-04-30'),
  ('Cổ Vịt 11', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('Rêu 036', NULL, NULL, 'D0-GY-0-02-00-0018', NULL, NULL, NULL, 20000, '2026-03-01', '2026-04-30'),
  ('Xám 81', NULL, NULL, 'D0-GY-0-01-00-0034', NULL, NULL, NULL, 17000, '2026-03-01', '2026-04-30'),
  ('Xám Chì 035', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('Xám Chì 066', NULL, NULL, NULL, NULL, NULL, NULL, 19000, '2026-03-01', '2026-04-30'),
  ('Xám Lợt 061', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('Kem 029', NULL, NULL, NULL, 'KA030-AD0-YL-0-01-00-0010', NULL, NULL, 14000, '2026-03-01', '2026-04-30'),
  ('Kem 108', NULL, NULL, 'D0-YL-0-01-00-0014', NULL, NULL, NULL, NULL, NULL, NULL),
  ('Beige', NULL, NULL, 'D0-GY-0-01-00-0039', NULL, NULL, NULL, NULL, NULL, NULL),
  ('Gừng 040', NULL, NULL, NULL, 'KA030-AD0-YL-0-01-00-0008', NULL, NULL, 20000, '2026-03-01', '2026-04-30'),
  ('Bò 068', NULL, NULL, 'D0-BR-0-02-00-0017', 'KA030-AD0-BR-0-02-00-0012', NULL, NULL, 20000, '2026-03-01', '2026-04-30'),
  ('Cỏ Úa 044', NULL, NULL, NULL, NULL, NULL, NULL, 16500, '2026-03-01', '2026-04-30'),
  ('Ca Cao', NULL, NULL, 'D0-GY-0-01-00-0041', NULL, NULL, NULL, NULL, NULL, NULL),
  ('Ca Cao 21', NULL, NULL, NULL, NULL, NULL, NULL, 16500, '2026-03-01', '2026-04-30'),
  ('Ca Cao Mới', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('Đen CM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('Trắng thường', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('Trắng 003-T', NULL, NULL, NULL, 'KA030-AD0-WH-0-01-00-0025', NULL, NULL, 14000, '2026-03-01', '2026-04-30'),
  ('Trắng · Bột 100', NULL, NULL, NULL, 'KA030-AD0-WH-0-01-00-0070', NULL, NULL, NULL, NULL, NULL),
  ('Trắng In', NULL, NULL, NULL, NULL, NULL, NULL, 14000, '2026-03-01', '2026-04-30');
