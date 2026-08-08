-- Tao bang giao_dich_kho (sau khi bang kho da co)
CREATE TABLE IF NOT EXISTS public.giao_dich_kho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_gd TEXT UNIQUE NOT NULL,
  ngay DATE NOT NULL DEFAULT CURRENT_DATE,
  loai TEXT NOT NULL CHECK (loai IN ('NHAP','XUAT','XUAT_GIA_CONG')),
  sku TEXT REFERENCES public.kho(sku) ON DELETE CASCADE,
  ma_ncc TEXT,
  ma_xuong TEXT,
  ma_lenh TEXT,
  so_luong NUMERIC(12,2) NOT NULL,
  don_gia NUMERIC(12,0) DEFAULT 0,
  thanh_tien NUMERIC(15,0) DEFAULT 0,
  so_met NUMERIC(12,2),
  hao_hut NUMERIC(5,2),
  nguoi_thuc_hien TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gd_kho_sku ON public.giao_dich_kho(sku);

ALTER TABLE public.giao_dich_kho ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_gd_kho" ON public.giao_dich_kho;
DROP POLICY IF EXISTS "auth_write_gd_kho" ON public.giao_dich_kho;
CREATE POLICY "anon_read_gd_kho" ON public.giao_dich_kho FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_gd_kho" ON public.giao_dich_kho FOR ALL TO authenticated USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
