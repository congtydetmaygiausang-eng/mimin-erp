-- ===================================================================
-- MIMIN ERP - Fix RLS + them columns moi cho san_pham
-- 2026-08-07 - Mavis
-- Chay tren Supabase Dashboard SQL Editor:
--   https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/sql/new
-- ===================================================================

-- ===================================================================
-- BUOC 1: Them columns moi (de app co the hien thi gia, size, mau, anh)
-- ===================================================================
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS gia_ban_du_kien NUMERIC(12,0) DEFAULT 0;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS gia_von_du_kien NUMERIC(12,0) DEFAULT 0;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS ti_le_size TEXT DEFAULT '1:2:2:2:1';
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS bang_size JSONB DEFAULT '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,2,1],"riSo":8}'::jsonb;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS ds_mau JSONB DEFAULT '[]'::jsonb;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS ghi_chu TEXT;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS ngay_tao DATE DEFAULT CURRENT_DATE;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS trang_thai TEXT DEFAULT 'con-hang';
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS da_ban INTEGER DEFAULT 0;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS ncc TEXT;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS chat_lieu TEXT;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS luot_xem INTEGER DEFAULT 0;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS hinh_anh TEXT;

-- ===================================================================
-- BUOC 2: Fix RLS - cho phep public SELECT (de app doc duoc)
-- ===================================================================
-- Drop policies cu (neu co)
DROP POLICY IF EXISTS "Public read san_pham" ON san_pham;
DROP POLICY IF EXISTS "Allow read access for all users" ON san_pham;
DROP POLICY IF EXISTS "anon_read_san_pham" ON san_pham;
DROP POLICY IF EXISTS "authenticated_read_san_pham" ON san_pham;

-- Enable RLS
ALTER TABLE san_pham ENABLE ROW LEVEL SECURITY;

-- Tao policy moi - cho phep SELECT voi anon + authenticated
CREATE POLICY "anon_read_san_pham" ON san_pham
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy cho INSERT/UPDATE/DELETE - chi authenticated
CREATE POLICY "auth_write_san_pham" ON san_pham
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===================================================================
-- BUOC 3: Verify
-- ===================================================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'san_pham'
ORDER BY ordinal_position;
