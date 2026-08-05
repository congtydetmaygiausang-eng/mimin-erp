-- ============================================
-- THEM 13 FK CONSTRAINTS (D1 FK Migration)
-- 2026-08-05 - Mavis
-- ============================================
-- Audit: 0 orphans -> safe to add FK
-- Strategy:
--   - Workflow tables (phan_cong, qc, khsx, ...): ON DELETE CASCADE
--     (xoa lenh_cat -> xoa het workflow con)
--   - User-related tables (audit_logs, push_subs, notifications):
--     ON DELETE SET NULL (xoa user -> giu log/sub/notif)
--   - Reference tables: ON DELETE RESTRICT (khong cho xoa NCC neu con doi_soat)

BEGIN;

-- ====== WORKFLOW TABLES (CASCADE) ======

-- 1. phan_cong -> lenh_cat
ALTER TABLE phan_cong
  DROP CONSTRAINT IF EXISTS fk_phan_cong_lenh_cat;
ALTER TABLE phan_cong
  ADD CONSTRAINT fk_phan_cong_lenh_cat
  FOREIGN KEY (lenh_cat_id) REFERENCES lenh_cat(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. phan_cong -> nhan_su
ALTER TABLE phan_cong
  DROP CONSTRAINT IF EXISTS fk_phan_cong_nhan_su;
ALTER TABLE phan_cong
  ADD CONSTRAINT fk_phan_cong_nhan_su
  FOREIGN KEY (nguoi_ma) REFERENCES nhan_su(ma_nv)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. qc_records -> lenh_cat
ALTER TABLE qc_records
  DROP CONSTRAINT IF EXISTS fk_qc_records_lenh_cat;
ALTER TABLE qc_records
  ADD CONSTRAINT fk_qc_records_lenh_cat
  FOREIGN KEY ("maLenhCat") REFERENCES lenh_cat(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. khsx -> lenh_cat
ALTER TABLE khsx
  DROP CONSTRAINT IF EXISTS fk_khsx_lenh_cat;
ALTER TABLE khsx
  ADD CONSTRAINT fk_khsx_lenh_cat
  FOREIGN KEY ("maLenhCat") REFERENCES lenh_cat(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. giao_hang -> lenh_cat
ALTER TABLE giao_hang
  DROP CONSTRAINT IF EXISTS fk_giao_hang_lenh_cat;
ALTER TABLE giao_hang
  ADD CONSTRAINT fk_giao_hang_lenh_cat
  FOREIGN KEY ("maLenhCat") REFERENCES lenh_cat(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. hoan_thien -> lenh_cat
ALTER TABLE hoan_thien
  DROP CONSTRAINT IF EXISTS fk_hoan_thien_lenh_cat;
ALTER TABLE hoan_thien
  ADD CONSTRAINT fk_hoan_thien_lenh_cat
  FOREIGN KEY ("maLenhCat") REFERENCES lenh_cat(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. cong_no -> lenh_cat
ALTER TABLE cong_no
  DROP CONSTRAINT IF EXISTS fk_cong_no_lenh_cat;
ALTER TABLE cong_no
  ADD CONSTRAINT fk_cong_no_lenh_cat
  FOREIGN KEY ("maLenhCat") REFERENCES lenh_cat(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. gia_cong -> lenh_cat
ALTER TABLE gia_cong
  DROP CONSTRAINT IF EXISTS fk_gia_cong_lenh_cat;
ALTER TABLE gia_cong
  ADD CONSTRAINT fk_gia_cong_lenh_cat
  FOREIGN KEY ("maLenhCat") REFERENCES lenh_cat(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ====== MASTER REFERENCE (RESTRICT) ======

-- 9. doi_soat -> nha_cung_cap
ALTER TABLE doi_soat
  DROP CONSTRAINT IF EXISTS fk_doi_soat_ncc;
ALTER TABLE doi_soat
  ADD CONSTRAINT fk_doi_soat_ncc
  FOREIGN KEY ("maDoiTac") REFERENCES nha_cung_cap(id)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 10. bang_luong -> nhan_su
ALTER TABLE bang_luong
  DROP CONSTRAINT IF EXISTS fk_bang_luong_nhan_su;
ALTER TABLE bang_luong
  ADD CONSTRAINT fk_bang_luong_nhan_su
  FOREIGN KEY (ma_nv) REFERENCES nhan_su(ma_nv)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ====== USER-RELATED (SET NULL) ======

-- 11. audit_logs -> users
ALTER TABLE audit_logs
  DROP CONSTRAINT IF EXISTS fk_audit_logs_users;
ALTER TABLE audit_logs
  ADD CONSTRAINT fk_audit_logs_users
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 12. push_subscriptions -> users
ALTER TABLE push_subscriptions
  DROP CONSTRAINT IF EXISTS fk_push_subs_users;
ALTER TABLE push_subscriptions
  ADD CONSTRAINT fk_push_subs_users
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 13. notifications -> users
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS fk_notifications_users;
ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_users
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;

-- Verify
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname LIKE 'fk_%'
  AND connamespace = 'public'::regnamespace
ORDER BY conname;
