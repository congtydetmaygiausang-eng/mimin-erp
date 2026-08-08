-- ===================================================================
-- PHAN 1: FIX RLS + ALTER nhan_su + audit_logs (chay truoc)
-- 2026-08-08
-- ===================================================================

-- BUOC 1: Them columns cho nhan_su
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nhan_su' AND column_name = 'avatar_url') THEN
    ALTER TABLE nhan_su ADD COLUMN avatar_url TEXT;
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

NOTIFY pgrst, 'reload schema';

-- BUOC 2: RLS cho nhan_su
ALTER TABLE nhan_su ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_nhan_su" ON nhan_su;
DROP POLICY IF EXISTS "auth_write_nhan_su" ON nhan_su;
CREATE POLICY "anon_read_nhan_su" ON nhan_su FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_nhan_su" ON nhan_su FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- BUOC 3: RLS cho audit_logs (cho phep INSERT tu anon)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "anon_insert_audit_logs" ON audit_logs;
CREATE POLICY "anon_read_audit_logs" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_audit_logs" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
