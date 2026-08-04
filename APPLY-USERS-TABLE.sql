-- ============================================
-- BANG USERS (Profile cho Supabase Auth)
-- 2026-08-04 - Mavis
-- ============================================
-- Luu profile day du cua user (sau khi login Supabase Auth)
-- Auto-sync tu user_metadata khi login lan dau
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  "maNV"          TEXT,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL,
  "chucVu"        TEXT,
  "phongBan"      TEXT DEFAULT 'khac',
  "donGia"        NUMERIC DEFAULT 0,
  "laCongNhan"    BOOLEAN DEFAULT false,
  "isActive"      BOOLEAN DEFAULT true,
  "lastLogin"     TIMESTAMPTZ,
  "loginCount"    INTEGER DEFAULT 0,
  "created_at"    TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_maNV ON users("maNV");
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phongBan ON users("phongBan");

-- RLS (cho phep user doc profile cua minh)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read all" ON users;
CREATE POLICY "Users can read all" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own" ON users;
CREATE POLICY "Users can update own" ON users FOR UPDATE USING (auth.uid()::text = id);
DROP POLICY IF EXISTS "Service role can insert" ON users;
CREATE POLICY "Service role can insert" ON users FOR INSERT WITH CHECK (true);
