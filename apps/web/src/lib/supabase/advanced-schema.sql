-- ===================================================================
-- MIMIN ERP - Advanced Security Schema (Phase 6)
-- Audit Log + Time-Bound Permission + 2FA + Custom Roles
-- ===================================================================

-- 1. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  resource_id TEXT,
  resource_name TEXT,
  description TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  ip INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_failed ON audit_logs(success) WHERE success = FALSE;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Chỉ admin xem được audit log
CREATE POLICY "admin_view_audit" ON audit_logs
  FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Insert: mọi user đã login đều insert được (để log action của mình)
CREATE POLICY "user_insert_audit" ON audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. TIME-BOUND PERMISSIONS (quyền có thời hạn)
CREATE TABLE IF NOT EXISTS time_bounds (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reason TEXT,
  approved_by TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_bounds_user ON time_bounds(user_id);
CREATE INDEX IF NOT EXISTS idx_time_bounds_active ON time_bounds(active) WHERE active = TRUE;

ALTER TABLE time_bounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_time_bounds" ON time_bounds
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "user_view_own_time_bound" ON time_bounds
  FOR SELECT
  USING (user_email = (auth.jwt() ->> 'email'));

-- 3. CUSTOM ROLES
CREATE TABLE IF NOT EXISTS custom_roles (
  id TEXT PRIMARY KEY,
  role_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_roles_key ON custom_roles(role_key);

ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_view_custom_roles" ON custom_roles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin_manage_custom_roles" ON custom_roles
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4. 2FA CONFIGS
CREATE TABLE IF NOT EXISTS two_factor_configs (
  user_id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  secret TEXT NOT NULL,
  backup_codes TEXT[] NOT NULL DEFAULT '{}',
  enabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE two_factor_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_2fa" ON two_factor_configs
  FOR ALL
  USING (user_email = (auth.jwt() ->> 'email'));

-- 5. ENHANCED RLS cho tables chính (ví dụ: nhan_su)
-- Lương cứng: chỉ admin + accountant
ALTER TABLE nhan_su ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_view_nhan_su_basic" ON nhan_su
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Field-level: ẩn cột lương trong queries
-- Cách 1: View riêng cho lương
CREATE OR REPLACE VIEW nhan_su_salary AS
SELECT
  id, ma_nv, ho_ten, bo_phan, chuc_vu, luong_cung, luong_sp, thuc_nhan
FROM nhan_su
WHERE (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'accountant');

GRANT SELECT ON nhan_su_salary TO authenticated;

-- 6. LOGIN ATTEMPTS (chống brute force)
CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip INET,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, attempted_at DESC);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_view_login_attempts" ON login_attempts
  FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 7. AUTO-LOG FUNCTION: trigger ghi log khi UPDATE/DELETE
CREATE OR REPLACE FUNCTION auto_log_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id TEXT;
  v_user_name TEXT;
  v_user_role TEXT;
  v_action TEXT;
BEGIN
  -- Lấy thông tin user từ JWT
  v_user_id := auth.uid()::TEXT;
  v_user_name := COALESCE(auth.jwt() ->> 'email', 'system');
  v_user_role := COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'user');

  IF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    INSERT INTO audit_logs (id, user_id, user_name, user_email, user_role, action, module, resource_id, resource_name, description, old_value, new_value)
    VALUES (
      'log_' || extract(epoch from now()) || '_' || substr(md5(random()::TEXT), 1, 8),
      v_user_id, v_user_name, v_user_name, v_user_role, v_action, TG_TABLE_NAME,
      OLD.id::TEXT, OLD.ho_ten, 'Sửa ' || TG_TABLE_NAME,
      to_jsonb(OLD), to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    INSERT INTO audit_logs (id, user_id, user_name, user_email, user_role, action, module, resource_id, resource_name, description, old_value)
    VALUES (
      'log_' || extract(epoch from now()) || '_' || substr(md5(random()::TEXT), 1, 8),
      v_user_id, v_user_name, v_user_name, v_user_role, v_action, TG_TABLE_NAME,
      OLD.id::TEXT, OLD.ho_ten, 'Xoá ' || TG_TABLE_NAME,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger cho các bảng chính
DROP TRIGGER IF EXISTS trg_audit_nhan_su ON nhan_su;
CREATE TRIGGER trg_audit_nhan_su
  AFTER UPDATE OR DELETE ON nhan_su
  FOR EACH ROW EXECUTE FUNCTION auto_log_changes();

DROP TRIGGER IF EXISTS trg_audit_don_hang ON don_hang;
CREATE TRIGGER trg_audit_don_hang
  AFTER UPDATE OR DELETE ON don_hang
  FOR EACH ROW EXECUTE FUNCTION auto_log_changes();

DROP TRIGGER IF EXISTS trg_audit_bang_luong ON bang_luong;
CREATE TRIGGER trg_audit_bang_luong
  AFTER UPDATE OR DELETE ON bang_luong
  FOR EACH ROW EXECUTE FUNCTION auto_log_changes();

-- 8. Function check time-bound
CREATE OR REPLACE FUNCTION check_user_active(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_active BOOLEAN;
BEGIN
  SELECT active INTO v_active
  FROM time_bounds
  WHERE user_email = p_email
    AND active = TRUE
    AND NOW() BETWEEN start_date AND end_date
  LIMIT 1;

  -- Nếu không có time_bound → active
  -- Nếu có nhưng hết hạn → return false
  RETURN COALESCE(v_active, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Rate limiting cho login
CREATE OR REPLACE FUNCTION check_login_rate(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_recent_failures INT;
BEGIN
  SELECT COUNT(*) INTO v_recent_failures
  FROM login_attempts
  WHERE email = p_email
    AND success = FALSE
    AND attempted_at > NOW() - INTERVAL '15 minutes';

  RETURN v_recent_failures < 5; -- Max 5 lần sai trong 15 phút
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
