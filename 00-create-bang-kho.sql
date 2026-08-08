-- Tao bang kho (chay truoc tien)
CREATE TABLE IF NOT EXISTS public.kho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  ten_vt TEXT NOT NULL,
  loai TEXT NOT NULL CHECK (loai IN ('Vai','Phu lieu','Khac')),
  loai_chi_tiet TEXT,
  mau_sac TEXT,
  dvt TEXT DEFAULT 'kg',
  don_gia NUMERIC(12,0) DEFAULT 0,
  ton_kho NUMERIC(12,2) DEFAULT 0,
  ton_toi_thieu NUMERIC(12,2) DEFAULT 0,
  so_cay_nhap NUMERIC(12,2) DEFAULT 0,
  ton_cay NUMERIC(12,2) DEFAULT 0,
  ma_ncc TEXT,
  ty_le_hao_hut NUMERIC(5,2) DEFAULT 0,
  kho TEXT DEFAULT 'Kho chinh',
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kho_sku ON public.kho(sku);
CREATE INDEX IF NOT EXISTS idx_kho_loai ON public.kho(loai);

ALTER TABLE public.kho ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_kho" ON public.kho;
DROP POLICY IF EXISTS "auth_write_kho" ON public.kho;
CREATE POLICY "anon_read_kho" ON public.kho FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_kho" ON public.kho FOR ALL TO authenticated USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
