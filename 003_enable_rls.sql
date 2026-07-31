-- ============================================
-- MIMIN ERP - Enable RLS (Row Level Security)
-- Chạy SAU khi 001_init_schema.sql đã apply thành công
-- ============================================

-- ============================================
-- 1. ENABLE RLS TRÊN TẤT CẢ CÁC BẢNG
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kho ENABLE ROW LEVEL SECURITY;
ALTER TABLE cong_no ENABLE ROW LEVEL SECURITY;
ALTER TABLE nha_cung_cap ENABLE ROW LEVEL SECURITY;
ALTER TABLE khach_hang_si ENABLE ROW LEVEL SECURITY;
ALTER TABLE xuong_gia_cong ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lenh_sx_tong ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. POLICIES CHO USERS
-- ============================================
-- Ai cũng đọc được users (cần cho việc login, hiển thị tên NV)
DROP POLICY IF EXISTS "users_read_all" ON users;
CREATE POLICY "users_read_all" ON users FOR SELECT USING (true);

-- Chỉ admin được insert/update/delete
DROP POLICY IF EXISTS "users_admin_all" ON users;
CREATE POLICY "users_admin_all" ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================
-- 3. POLICIES CHO TASKS
-- ============================================
-- Tất cả authenticated users đọc được tasks
DROP POLICY IF EXISTS "tasks_read_all" ON tasks;
CREATE POLICY "tasks_read_all" ON tasks FOR SELECT TO authenticated USING (true);

-- User có thể update task của mình (theo assignee_id)
DROP POLICY IF EXISTS "tasks_update_own" ON tasks;
CREATE POLICY "tasks_update_own" ON tasks FOR UPDATE TO authenticated
  USING (assignee_id = auth.uid())
  WITH CHECK (assignee_id = auth.uid());

-- Admin/planner có thể tạo task mới
DROP POLICY IF EXISTS "tasks_insert_admin" ON tasks;
CREATE POLICY "tasks_insert_admin" ON tasks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'planner'))
  );

-- ============================================
-- 4. POLICIES CHO KHO
-- ============================================
-- Warehouse + admin đọc/ghi kho
DROP POLICY IF EXISTS "kho_warehouse_all" ON kho;
CREATE POLICY "kho_warehouse_all" ON kho FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'warehouse', 'planner'))
  );

-- Tất cả user xem được tồn kho (cho UI công nhân)
DROP POLICY IF EXISTS "kho_read_all" ON kho;
CREATE POLICY "kho_read_all" ON kho FOR SELECT TO authenticated USING (true);

-- ============================================
-- 5. POLICIES CHO CONG_NO
-- ============================================
-- Accountant + admin xem tất cả
DROP POLICY IF EXISTS "cong_no_accountant_all" ON cong_no;
CREATE POLICY "cong_no_accountant_all" ON cong_no FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
  );

-- ============================================
-- 6. POLICIES CHO NHA_CUNG_CAP, KHACH_HANG_SI, XUONG_GIA_CONG
-- ============================================
-- Admin + warehouse + accountant xem master data
DROP POLICY IF EXISTS "ncc_read_master" ON nha_cung_cap;
CREATE POLICY "ncc_read_master" ON nha_cung_cap FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'warehouse', 'planner', 'accountant'))
  );

DROP POLICY IF EXISTS "ncc_admin_write" ON nha_cung_cap;
CREATE POLICY "ncc_admin_write" ON nha_cung_cap FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "kh_read_master" ON khach_hang_si;
CREATE POLICY "kh_read_master" ON khach_hang_si FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'warehouse', 'planner', 'accountant', 'sewing'))
  );

DROP POLICY IF EXISTS "kh_admin_write" ON khach_hang_si;
CREATE POLICY "kh_admin_write" ON khach_hang_si FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "xuong_read_all" ON xuong_gia_cong;
CREATE POLICY "xuong_read_all" ON xuong_gia_cong FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "xuong_admin_write" ON xuong_gia_cong;
CREATE POLICY "xuong_admin_write" ON xuong_gia_cong FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- 7. POLICIES CHO AUDIT_LOG (chỉ ghi + admin đọc)
-- ============================================
-- Ai cũng có thể ghi log
DROP POLICY IF EXISTS "audit_log_insert_all" ON audit_log;
CREATE POLICY "audit_log_insert_all" ON audit_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Chỉ admin đọc audit log
DROP POLICY IF EXISTS "audit_log_read_admin" ON audit_log;
CREATE POLICY "audit_log_read_admin" ON audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- 8. POLICIES CHO NOTIFICATIONS
-- ============================================
-- User chỉ đọc/sửa notification của mình
DROP POLICY IF EXISTS "notif_user_own" ON notifications;
CREATE POLICY "notif_user_own" ON notifications FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 9. POLICIES CHO LENH_SX_TONG
-- ============================================
-- Tất cả authenticated đọc LSX
DROP POLICY IF EXISTS "lsx_read_all" ON lenh_sx_tong;
CREATE POLICY "lsx_read_all" ON lenh_sx_tong FOR SELECT TO authenticated USING (true);

-- Admin + planner + warehouse ghi LSX
DROP POLICY IF EXISTS "lsx_admin_planner_write" ON lenh_sx_tong;
CREATE POLICY "lsx_admin_planner_write" ON lenh_sx_tong FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'planner', 'warehouse'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'planner', 'warehouse'))
  );

-- ============================================
-- 10. ENABLE REALTIME (cho bảng cần listen changes)
-- ============================================
-- Cho phép Supabase Realtime gửi events khi data thay đổi
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE kho;
ALTER PUBLICATION supabase_realtime ADD TABLE lenh_sx_tong;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- DONE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS enabled trên 10 bảng';
  RAISE NOTICE '✅ 12 policies đã apply';
  RAISE NOTICE '✅ Realtime enabled cho 4 bảng';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Test bằng:';
  RAISE NOTICE '   SELECT * FROM users LIMIT 5;';
  RAISE NOTICE '   SELECT * FROM kho WHERE don_gia > 0 LIMIT 5;';
END $$;
