-- ===================================================================
-- MIMIN ERP - Fix RLS Errors v2 (2026-08-07)
-- Loi: audit_logs 403, khach_hang 403, api/admin/users 500
-- Nguyen nhan: Policy check app_metadata.role (khong co)
-- Fix: Policy check bang users (custom) thay vi app_metadata
-- Chay tren Supabase SQL Editor
-- ===================================================================

-- 1. DROP cac policy cu (de recreate)
DROP POLICY IF EXISTS "admin_view_audit" ON audit_logs;
DROP POLICY IF EXISTS "user_insert_audit" ON audit_logs;
DROP POLICY IF EXISTS "authenticated_view_audit" ON audit_logs;
DROP POLICY IF EXISTS "Allow all for authenticated" ON khach_hang;
DROP POLICY IF EXISTS "users_select_authenticated" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;

-- 2. AUDIT_LOGS: Cho phep SELECT theo role trong bang users
-- (Service role bypass RLS mac dinh, khong can policy)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Moi user da login co the insert audit log
CREATE POLICY "audit_insert_authenticated" ON audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admin (theo bang users) moi xem duoc audit log
CREATE POLICY "audit_select_admin" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'admin'
      AND users."isActive" = true
    )
  );

-- User thuong cung co the xem audit log cua chinh minh
CREATE POLICY "audit_select_own" ON audit_logs
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- 3. KHACH_HANG: Re-create policy de chac chan work
ALTER TABLE khach_hang ENABLE ROW LEVEL SECURITY;

-- Drop cac policy cu neu co
DROP POLICY IF EXISTS "khach_hang_all_authenticated" ON khach_hang;

CREATE POLICY "khach_hang_all_authenticated" ON khach_hang
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. USERS (custom): Cho phep SELECT theo role
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Moi user da login co the xem users (de hien thi ten NV, role, etc.)
CREATE POLICY "users_select_all_authenticated" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Chi admin moi sua duoc
CREATE POLICY "users_modify_admin" ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()::text
      AND u2.role = 'admin'
      AND u2."isActive" = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()::text
      AND u2.role = 'admin'
      AND u2."isActive" = true
    )
  );

-- User sua chinh minh (change password, profile)
CREATE POLICY "users_update_self" ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- 5. DON_HANG, NCC, NHAN_SU, GIAO_DICH_KHO: Re-confirm policies
-- (Neu chua co thi them)
DO $$
BEGIN
  -- don_hang
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'don_hang' AND policyname LIKE '%authenticated%') THEN
    EXECUTE 'CREATE POLICY "don_hang_all_authenticated" ON don_hang FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;

  -- ncc
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ncc' AND policyname LIKE '%authenticated%') THEN
    EXECUTE 'CREATE POLICY "ncc_all_authenticated" ON ncc FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;

  -- nhan_su
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nhan_su' AND policyname LIKE '%authenticated%') THEN
    EXECUTE 'CREATE POLICY "nhan_su_all_authenticated" ON nhan_su FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;

  -- giao_dich_kho
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'giao_dich_kho' AND policyname LIKE '%authenticated%') THEN
    EXECUTE 'CREATE POLICY "giao_dich_kho_all_authenticated" ON giao_dich_kho FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END
$$;

-- 6. GRANT quyen cho roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Specific grant cho users table
GRANT SELECT ON users TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON users TO authenticated;

-- 7. Verify
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('audit_logs', 'khach_hang', 'users', 'don_hang', 'ncc', 'nhan_su', 'giao_dich_kho')
ORDER BY tablename, policyname;

-- ===================================================================
-- Verify bang users co admin khong
-- ===================================================================
SELECT id, email, name, role, "isActive" FROM users WHERE role = 'admin' LIMIT 5;

-- Neu khong co admin, them admin cho sang@mimin.vn
INSERT INTO users (id, email, name, role, "chucVu", "phongBan", "isActive")
SELECT id, email, 'Hồ Minh Sang', 'admin', 'Chủ tịch HĐQT', 'ban-giam-doc', true
FROM auth.users
WHERE email = 'sang@mimin.vn'
ON CONFLICT (id) DO UPDATE SET role = 'admin', "isActive" = true;
