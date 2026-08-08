-- ===================================================================
-- PHAN 2: TAO BANG kho, giao_dich_kho, phan_cong
-- Chay SAU phan 1 (fix-rls-nhan-su-audit.sql)
-- 2026-08-08
-- ===================================================================

-- BUOC 1: Tao bang kho
CREATE TABLE IF NOT EXISTS public.kho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  ten_vt TEXT NOT NULL,
  loai TEXT NOT NULL CHECK (loai IN ('Vai','Phụ liệu','Khác')),
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
  kho TEXT DEFAULT 'Kho chính',
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

-- BUOC 2: Tao bang giao_dich_kho (Sau khi kho da co)
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

-- BUOC 3: Tao bang phan_cong
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
CREATE INDEX IF NOT EXISTS idx_phan_cong_ma_nv ON public.phan_cong(ma_nv);

ALTER TABLE public.phan_cong ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_phan_cong" ON public.phan_cong;
DROP POLICY IF EXISTS "auth_write_phan_cong" ON public.phan_cong;
CREATE POLICY "anon_read_phan_cong" ON public.phan_cong FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_phan_cong" ON public.phan_cong FOR ALL TO authenticated USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

-- Verify
SELECT 'nhan_su' as tbl, (SELECT COUNT(*) FROM nhan_su) as rows
UNION ALL SELECT 'audit_logs', (SELECT COUNT(*) FROM audit_logs)
UNION ALL SELECT 'kho', (SELECT COUNT(*) FROM kho)
UNION ALL SELECT 'giao_dich_kho', (SELECT COUNT(*) FROM giao_dich_kho)
UNION ALL SELECT 'phan_cong', (SELECT COUNT(*) FROM phan_cong);
