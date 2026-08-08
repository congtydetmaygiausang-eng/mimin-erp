-- Tao bang phan_cong
CREATE TABLE IF NOT EXISTS public.phan_cong (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_lenh TEXT NOT NULL,
  ma_sp TEXT,
  loai_nguoi TEXT NOT NULL CHECK (loai_nguoi IN ('noi_bo','xuong_ngoai')),
  ma_nv TEXT,
  ma_xuong TEXT,
  cong_doan TEXT NOT NULL,
  don_gia NUMERIC(12,0) DEFAULT 0,
  so_luong NUMERIC(12,2) DEFAULT 0,
  thanh_tien NUMERIC(15,0) DEFAULT 0,
  da_thanh_toan NUMERIC(15,0) DEFAULT 0,
  con_lai NUMERIC(15,0) DEFAULT 0,
  trang_thai_tt TEXT DEFAULT 'chua_tra',
  ngay_thanh_toan DATE,
  ngay_tao TIMESTAMPTZ DEFAULT NOW(),
  nguoi_tao TEXT,
  ghi_chu TEXT
);

CREATE INDEX IF NOT EXISTS idx_phan_cong_ma_lenh ON public.phan_cong(ma_lenh);

ALTER TABLE public.phan_cong ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_phan_cong" ON public.phan_cong;
DROP POLICY IF EXISTS "auth_write_phan_cong" ON public.phan_cong;
CREATE POLICY "anon_read_phan_cong" ON public.phan_cong FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_phan_cong" ON public.phan_cong FOR ALL TO authenticated USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
