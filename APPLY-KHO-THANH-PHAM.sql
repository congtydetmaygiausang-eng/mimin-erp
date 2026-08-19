-- ============================================
-- MIMIN ERP - Bang Supabase cho Kho Thanh Pham
-- Module nay truoc gio chi luu localStorage (mimin_kho_thanh_pham_v2),
-- khong dong bo giua cac trinh duyet/thiet bi. Bang nay khac phuc.
-- 2026-08-18 - Mavis
-- ============================================
-- Vao: https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/sql/new
-- Paste toan bo -> bam "Run"
-- ============================================

CREATE TABLE IF NOT EXISTS kho_thanh_pham (
  id            TEXT PRIMARY KEY,
  ma_sp         TEXT NOT NULL,
  ten_sp        TEXT,
  phan_loai     TEXT,
  mau           TEXT,
  size          TEXT,
  lsx           TEXT,
  ngay_nhap     DATE,
  so_luong      INTEGER DEFAULT 0,
  don_gia       NUMERIC DEFAULT 0,
  gia_tri       NUMERIC DEFAULT 0,
  vi_tri        TEXT,
  trang_thai    TEXT DEFAULT 'con',
  khach_hang    TEXT,
  ti_le_size    TEXT,
  ghi_chu       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kho_tp_ma_sp ON kho_thanh_pham(ma_sp);
CREATE INDEX IF NOT EXISTS idx_kho_tp_lsx ON kho_thanh_pham(lsx);
CREATE INDEX IF NOT EXISTS idx_kho_tp_trang_thai ON kho_thanh_pham(trang_thai);

ALTER TABLE kho_thanh_pham ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_kho_thanh_pham" ON kho_thanh_pham;
DROP POLICY IF EXISTS "auth_write_kho_thanh_pham" ON kho_thanh_pham;
CREATE POLICY "anon_read_kho_thanh_pham" ON kho_thanh_pham FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_kho_thanh_pham" ON kho_thanh_pham FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kho_thanh_pham TO anon, authenticated;

-- ============================================
-- HOAN THANH - bang kho_thanh_pham da san sang de dong bo 2 chieu.
-- ============================================
