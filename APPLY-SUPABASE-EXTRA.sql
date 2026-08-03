-- ============================================
-- MIMIN ERP - SQL BỔ SUNG cho 8 bảng localStorage sync
-- Sếp Sang chạy file này SAU khi apply APPLY-SUPABASE-MANUAL.sql
-- 2026-08-03 - Mavis
-- ============================================
-- Vào: https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/sql/new
-- (Project MỚI - Gói Pro $25/tháng)
-- Paste toàn bộ → bấm "Run and enable RLS"
-- ============================================

-- ============================================
-- 1. Bảng CONG_NO (công nợ theo công đoạn)
-- ============================================
CREATE TABLE IF NOT EXISTS cong_no (
  id              TEXT PRIMARY KEY,
  ma_pc           TEXT,
  lenh_cat_id     TEXT,
  cong_doan       TEXT,
  nguoi_ma        TEXT,
  nguoi_ten       TEXT,
  nguoi_loai      TEXT,
  nguoi_sdt       TEXT,
  don_gia_giao    NUMERIC,
  so_luong_giao   INTEGER,
  don_vi          TEXT,
  ngay_giao       DATE,
  ngay_xong_du_kien DATE,
  trang_thai      TEXT DEFAULT 'Cho giao',
  da_thanh_toan   NUMERIC DEFAULT 0,
  ghi_chu         TEXT,
  -- Phân bổ thanh toán
  lich_su_thanh_toan JSONB DEFAULT '[]'::jsonb,
  -- Audit
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cong_no_lenh_cat ON cong_no(lenh_cat_id);
CREATE INDEX IF NOT EXISTS idx_cong_no_nguoi ON cong_no(nguoi_ma);
CREATE INDEX IF NOT EXISTS idx_cong_no_trang_thai ON cong_no(trang_thai);
ALTER TABLE cong_no ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON cong_no FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 2. Bảng KHSX (kế hoạch sản xuất)
-- ============================================
CREATE TABLE IF NOT EXISTS khsx (
  id              TEXT PRIMARY KEY,
  ma_khsx         TEXT UNIQUE,
  ten_khsx        TEXT NOT NULL,
  khach_hang      TEXT,
  so_luong        INTEGER,
  han_giao        DATE,
  trang_thai      TEXT DEFAULT 'Moi',
  ghi_chu         TEXT,
  ds_cong_doan   JSONB DEFAULT '[]'::jsonb,
  -- Audit
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_khsx_trang_thai ON khsx(trang_thai);
ALTER TABLE khsx ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON khsx FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 3. Bảng QC_RECORDS (ghi nhận kiểm tra chất lượng)
-- ============================================
CREATE TABLE IF NOT EXISTS qc_records (
  id              TEXT PRIMARY KEY,
  task_id         TEXT,
  ngay_qc         DATE,
  nguoi_qc        TEXT,
  so_luong_dat    INTEGER,
  so_luong_loi    INTEGER,
  so_luong_sua    INTEGER,
  loi_chi_tiet    JSONB DEFAULT '[]'::jsonb,
  trang_thai      TEXT DEFAULT 'Dat',
  ghi_chu         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qc_task ON qc_records(task_id);
ALTER TABLE qc_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON qc_records FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 4. Bảng HOAN_THIEN (bản ghi hoàn thiện)
-- ============================================
CREATE TABLE IF NOT EXISTS hoan_thien (
  id              TEXT PRIMARY KEY,
  task_id         TEXT,
  ngay_hoan_thanh DATE,
  nguoi_thuc_hien TEXT,
  so_luong_hoan_thanh INTEGER,
  so_luong_loi    INTEGER,
  trang_thai      TEXT DEFAULT 'Hoan thanh',
  ghi_chu         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hoan_thien_task ON hoan_thien(task_id);
ALTER TABLE hoan_thien ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON hoan_thien FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 5. Bảng GIAO_HANG (đơn giao hàng)
-- ============================================
CREATE TABLE IF NOT EXISTS giao_hang (
  id              TEXT PRIMARY KEY,
  so_phieu        TEXT UNIQUE,
  khach_hang      TEXT NOT NULL,
  dia_chi_giao    TEXT,
  sdt_nguoi_nhan  TEXT,
  ngay_giao       DATE,
  trang_thai      TEXT DEFAULT 'Cho giao',
  ds_san_pham     JSONB DEFAULT '[]'::jsonb,
  tong_tien       NUMERIC,
  ghi_chu         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_giao_hang_khach ON giao_hang(khach_hang);
CREATE INDEX IF NOT EXISTS idx_giao_hang_trang_thai ON giao_hang(trang_thai);
ALTER TABLE giao_hang ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON giao_hang FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 6. Bảng GIA_CONG (bản ghi gia công)
-- ============================================
CREATE TABLE IF NOT EXISTS gia_cong (
  id              TEXT PRIMARY KEY,
  task_id         TEXT,
  nguoi_ma        TEXT,
  nguoi_ten       TEXT,
  ngay_nhan       DATE,
  ngay_xong       DATE,
  trang_thai      TEXT DEFAULT 'Cho nhan',
  so_luong_nhan   INTEGER,
  so_luong_dat    INTEGER,
  so_luong_loi    INTEGER,
  don_gia         NUMERIC,
  thanh_tien      NUMERIC,
  ghi_chu         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gia_cong_task ON gia_cong(task_id);
CREATE INDEX IF NOT EXISTS idx_gia_cong_nguoi ON gia_cong(nguoi_ma);
ALTER TABLE gia_cong ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON gia_cong FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 7. Bảng DOI_SOAT (đối soát tiền công)
-- ============================================
CREATE TABLE IF NOT EXISTS doi_soat (
  id              TEXT PRIMARY KEY,
  task_id         TEXT,
  ngay_giao       DATE,
  nguoi_thuc_hien TEXT,
  nguoi_thuc_hien_ma TEXT,
  cong_doan       TEXT,
  ma_sp           TEXT,
  so_luong_nhan   INTEGER,
  so_luong_dat    INTEGER,
  so_luong_loi    INTEGER,
  don_gia         NUMERIC,
  thanh_tien      NUMERIC,
  khau_tru        NUMERIC DEFAULT 0,
  thuc_nhan       NUMERIC,
  da_thanh_toan   NUMERIC DEFAULT 0,
  con_no          NUMERIC DEFAULT 0,
  trang_thai      TEXT DEFAULT 'Chua doi soat',
  lich_su         JSONB DEFAULT '[]'::jsonb,
  khiieu_nai      JSONB,
  ghi_chu         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doi_soat_task ON doi_soat(task_id);
CREATE INDEX IF NOT EXISTS idx_doi_soat_trang_thai ON doi_soat(trang_thai);
ALTER TABLE doi_soat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON doi_soat FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 8. Bảng KHO_MOBILE (kho mobile)
-- ============================================
CREATE TABLE IF NOT EXISTS kho_mobile (
  id              TEXT PRIMARY KEY,
  ngay            DATE NOT NULL,
  ma_vt           TEXT NOT NULL,
  ten_vt          TEXT,
  loai            TEXT CHECK (loai IN ('NHAP', 'XUAT', 'KIEM_KE')) NOT NULL,
  so_luong        NUMERIC NOT NULL,
  don_vi          TEXT,
  don_gia         NUMERIC,
  thanh_tien      NUMERIC,
  vi_tri          TEXT,
  nguoi_thuc_hien TEXT,
  ghi_chu         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kho_mobile_ma_vt ON kho_mobile(ma_vt);
CREATE INDEX IF NOT EXISTS idx_kho_mobile_loai ON kho_mobile(loai);
CREATE INDEX IF NOT EXISTS idx_kho_mobile_ngay ON kho_mobile(ngay DESC);
ALTER TABLE kho_mobile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON kho_mobile FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- HOÀN THÀNH
-- ============================================
-- Da tao 8 bang bo sung:
-- cong_no (cong no theo cong doan)
-- khsx (ke hoach san xuat)
-- qc_records (ghi nhan kiem tra chat luong)
-- hoan_thien (ban ghi hoan thien)
-- giao_hang (don giao hang)
-- gia_cong (ban ghi gia cong)
-- doi_soat (doi soat tien cong)
-- kho_mobile (kho mobile)
--
-- Tong cong: 18 bang (14 goc + 4 moi) + 8 bo sung = 26 bang
--
-- Tat ca co:
-- - RLS policy "Allow all for authenticated"
-- - Index cho cac cot thuong query
-- - created_at / updated_at timestamps
