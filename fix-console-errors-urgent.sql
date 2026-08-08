-- ===================================================================
-- MIMIN ERP - FIX CONSOLE ERRORS (URGENT 2026-08-08)
-- Giai quyet 4 loi: avatar_url null + nhan_su 403 + audit_logs 403 + kho 404
-- Chay tren Supabase Dashboard SQL Editor:
--   https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/sql/new
-- ===================================================================

-- ===================================================================
-- BUOC 1: THEM avatar_url + refresh schema cache
-- ===================================================================

-- Kiem tra column avatar_url co trong nhan_su chua
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nhan_su' AND column_name = 'avatar_url') THEN
    ALTER TABLE nhan_su ADD COLUMN avatar_url TEXT;
    COMMENT ON COLUMN nhan_su.avatar_url IS 'URL ảnh đại diện nhân viên';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nhan_su' AND column_name = 'cccd_front_url') THEN
    ALTER TABLE nhan_su ADD COLUMN cccd_front_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nhan_su' AND column_name = 'cccd_back_url') THEN
    ALTER TABLE nhan_su ADD COLUMN cccd_back_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nhan_su' AND column_name = 'ngay_tao') THEN
    ALTER TABLE nhan_su ADD COLUMN ngay_tao TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nhan_su' AND column_name = 'lan_dang_nhap_cuoi') THEN
    ALTER TABLE nhan_su ADD COLUMN lan_dang_nhap_cuoi TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nhan_su' AND column_name = 'avatar') THEN
    ALTER TABLE nhan_su ADD COLUMN avatar TEXT;
  END IF;
END $$;

-- Reload schema cache (PostgREST)
NOTIFY pgrst, 'reload schema';

-- ===================================================================
-- BUOC 2: ENABLE RLS + policies cho nhan_su (cho phep anon SELECT)
-- ===================================================================
ALTER TABLE nhan_su ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_nhan_su" ON nhan_su;
DROP POLICY IF EXISTS "auth_read_nhan_su" ON nhan_su;
DROP POLICY IF EXISTS "auth_write_nhan_su" ON nhan_su;
DROP POLICY IF EXISTS "auth_all_nhan_su" ON nhan_su;

CREATE POLICY "anon_read_nhan_su" ON nhan_su
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "auth_write_nhan_su" ON nhan_su
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ===================================================================
-- BUOC 3: ENABLE RLS + policies cho audit_logs (cho phep anon INSERT)
-- ===================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "anon_insert_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "auth_read_audit_logs" ON audit_logs;

-- Cho phep SELECT audit_logs
CREATE POLICY "anon_read_audit_logs" ON audit_logs
  FOR SELECT TO anon, authenticated
  USING (true);

-- Cho phep INSERT audit_logs (cho user thuong)
CREATE POLICY "anon_insert_audit_logs" ON audit_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ===================================================================
-- BUOC 4: TAO BANG kho (vi inventory-engine query kho?loai=eq.vai bi 404)
-- ===================================================================
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
  ma_ncc TEXT REFERENCES public.nha_cung_cap(ma_ncc) ON DELETE SET NULL,
  ty_le_hao_hut NUMERIC(5,2) DEFAULT 0,
  kho TEXT DEFAULT 'Kho chính',
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kho_sku ON public.kho(sku);
CREATE INDEX IF NOT EXISTS idx_kho_loai ON public.kho(loai);
CREATE INDEX IF NOT EXISTS idx_kho_ma_ncc ON public.kho(ma_ncc);

-- RLS cho kho
ALTER TABLE public.kho ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_kho" ON public.kho;
DROP POLICY IF EXISTS "auth_write_kho" ON public.kho;
CREATE POLICY "anon_read_kho" ON public.kho FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_kho" ON public.kho FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===================================================================
-- BUOC 5: TAO BANG giao_dich_kho (cho inventory sync)
-- ===================================================================
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
CREATE INDEX IF NOT EXISTS idx_gd_kho_ma_lenh ON public.giao_dich_kho(ma_lenh);

ALTER TABLE public.giao_dich_kho ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_gd_kho" ON public.giao_dich_kho;
DROP POLICY IF EXISTS "auth_write_gd_kho" ON public.giao_dich_kho;
CREATE POLICY "anon_read_gd_kho" ON public.giao_dich_kho FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_gd_kho" ON public.giao_dich_kho FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===================================================================
-- BUOC 6: ENABLE RLS + policies cho phan_cong (khoi tao neu chua co)
-- ===================================================================
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

-- ===================================================================
-- BUOC 7: Verify
-- ===================================================================
SELECT 'nhan_su' as tbl, COUNT(*) as rows FROM nhan_su
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL SELECT 'kho', COUNT(*) FROM kho
UNION ALL SELECT 'giao_dich_kho', COUNT(*) FROM giao_dich_kho
UNION ALL SELECT 'phan_cong', COUNT(*) FROM phan_cong;

-- Verify avatar_url column
SELECT column_name FROM information_schema.columns
WHERE table_name = 'nhan_su' AND column_name IN ('avatar', 'avatar_url', 'cccd_front_url', 'cccd_back_url', 'ngay_tao', 'lan_dang_nhap_cuoi')
ORDER BY column_name;
