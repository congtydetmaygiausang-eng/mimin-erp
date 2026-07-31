-- ============================================
-- MIMIN ERP - Initial Schema
-- Chạy 1 lần trong Supabase SQL Editor
-- https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/sql/new
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. BẢNG USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  nhom TEXT NOT NULL,
  phong_ban TEXT,
  ma_nv TEXT,
  chuc_vu TEXT,
  sdt TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'worker',
  vai_tro_chuan TEXT[],
  data_scope TEXT DEFAULT 'SELF',
  trang_thai TEXT DEFAULT 'active',       -- active | inactive | locked
  is_active BOOLEAN DEFAULT TRUE,         -- MỚI: có thể login không
  last_login TIMESTAMPTZ,                 -- MỚI: lần cuối login
  last_active_at TIMESTAMPTZ,            -- MỚI: lần cuối có hoạt động
  login_count INT DEFAULT 0,             -- MỚI: số lần login
  failed_login_count INT DEFAULT 0,      -- MỚI: số lần login sai
  locked_until TIMESTAMPTZ,              -- MỚI: bị khóa đến khi nào
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()    -- MỚI
);

-- Index cho query
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_nhom ON users(nhom);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
-- P2-4: Index cho NCC
CREATE INDEX IF NOT EXISTS idx_nha_cung_cap_ma ON nha_cung_cap(ma_ncc);
CREATE INDEX IF NOT EXISTS idx_nha_cung_cap_loai ON nha_cung_cap(loai);
CREATE INDEX IF NOT EXISTS idx_nha_cung_cap_cong_no ON nha_cung_cap(cong_no DESC);
-- P2-4: Index cho KH
CREATE INDEX IF NOT EXISTS idx_khach_hang_si_ma ON khach_hang_si(ma_kh);
CREATE INDEX IF NOT EXISTS idx_khach_hang_si_loai ON khach_hang_si(loai);
CREATE INDEX IF NOT EXISTS idx_khach_hang_si_cong_no ON khach_hang_si(cong_no_hien_tai DESC);

-- ============================================
-- 2. BẢNG TASKS
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  sp TEXT,                       -- Sản phẩm
  lsx TEXT,                      -- Mã LSX
  lsx_code TEXT,                 -- LSX-2026-001
  mau TEXT,                      -- Màu
  size TEXT,
  so_luong_giao INT DEFAULT 0,
  so_luong_nhan INT DEFAULT 0,
  so_luong_dat INT DEFAULT 0,
  so_luong_loi INT DEFAULT 0,
  so_luong_thieu INT DEFAULT 0,
  so_luong_sua INT DEFAULT 0,
  status TEXT DEFAULT 'chua-lam', -- chua-lam | dang-lam | hoan-thanh
  nhom TEXT NOT NULL,             -- cat | khuy-nut | ui | gap
  assigned_to TEXT REFERENCES users(username),
  giao_boi TEXT REFERENCES users(username),
  deadline DATE,
  ngay_giao DATE,
  ngay_nhan DATE,
  ngay_hoan_thanh DATE,
  don_gia NUMERIC DEFAULT 0,
  thanh_tien NUMERIC DEFAULT 0,
  da_thanh_toan NUMERIC DEFAULT 0,
  con_no NUMERIC DEFAULT 0,
  ghi_chu TEXT,
  trang_thai TEXT,
  mau_da_duyet BOOLEAN DEFAULT false,
  nguoi_xac_nhan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_lsx ON tasks(lsx_code);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_nhom ON tasks(nhom);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tasks_updated ON tasks;
CREATE TRIGGER trg_tasks_updated
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 3. BẢNG KHO
-- ============================================
CREATE TABLE IF NOT EXISTS kho (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  ten TEXT NOT NULL,
  sl INT DEFAULT 0,
  don_vi TEXT DEFAULT 'cái',
  don_gia NUMERIC DEFAULT 0,          -- đơn giá VND/đơn vị (MỚI)
  gia_tri NUMERIC DEFAULT 0,          -- = sl * don_gia (MỚI)
  ton_thap INT DEFAULT 0,
  ngay_nhap DATE,
  ngay_het_han DATE,                  -- HSD (MỚI)
  loai TEXT,                          -- vai | phu-lieu | thanh-pham
  nha_cung_cap_id UUID REFERENCES nha_cung_cap(id),  -- FK (MỚI)
  vi_tri_kho TEXT,                    -- Kệ A1, A2, B1... (MỚI)
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()  -- MỚI
);

CREATE INDEX IF NOT EXISTS idx_kho_sku ON kho(sku);
CREATE INDEX IF NOT EXISTS idx_kho_loai ON kho(loai);
CREATE INDEX IF NOT EXISTS idx_kho_don_gia ON kho(don_gia);
CREATE INDEX IF NOT EXISTS idx_kho_nha_cung_cap ON kho(nha_cung_cap_id);
CREATE INDEX IF NOT EXISTS idx_kho_ngay_het_han ON kho(ngay_het_han);

-- ============================================
-- 4. BẢNG CÔNG NỢ
-- ============================================
CREATE TABLE IF NOT EXISTS cong_no (
  id TEXT PRIMARY KEY,
  -- Hỗ trợ 2 loại: công nợ KH hoặc công nợ NCC
  kh TEXT,                            -- Tên khách hàng
  kh_id UUID,                         -- Có thể tham chiếu users hoặc KH riêng
  ncc_id UUID REFERENCES nha_cung_cap(id),  -- Công nợ NCC (MỚI)
  loai_cong_no TEXT DEFAULT 'kh',     -- 'kh' | 'ncc' (MỚI)
  no NUMERIC DEFAULT 0,
  da_thanh_toan NUMERIC DEFAULT 0,     -- Số đã trả (MỚI)
  con_no NUMERIC GENERATED ALWAYS AS (no - da_thanh_toan) STORED,  -- Số còn lại (MỚI)
  han DATE,
  status TEXT DEFAULT 'chua-thu',      -- chua-thu | da-thu-1-phan | da-thu | qua-han
  lsx_id TEXT,                        -- Tham chiếu LSX
  so_ngay_qua_han INT DEFAULT 0,      -- Tự tính (MỚI)
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho query nhanh
CREATE INDEX IF NOT EXISTS idx_cong_no_loai ON cong_no(loai_cong_no);
CREATE INDEX IF NOT EXISTS idx_cong_no_han ON cong_no(han);
CREATE INDEX IF NOT EXISTS idx_cong_no_status ON cong_no(status);

CREATE INDEX IF NOT EXISTS idx_congno_status ON cong_no(status);
CREATE INDEX IF NOT EXISTS idx_congno_kh ON cong_no(kh);

DROP TRIGGER IF EXISTS trg_congno_updated ON cong_no;
CREATE TRIGGER trg_congno_updated
BEFORE UPDATE ON cong_no
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 5. BẢNG NCC (Master Data)
-- ============================================
CREATE TABLE IF NOT EXISTS nha_cung_cap (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ma_ncc TEXT UNIQUE NOT NULL,
  ten_ncc TEXT NOT NULL,
  han_muc NUMERIC DEFAULT 500_000_000,  -- MỚI: hạn mức tín dụng (VND)
  loai TEXT,                     -- soi | vai | phu-lieu | hoa-chat | etc
  dia_chi TEXT,
  sdt TEXT,
  email TEXT,
  mst TEXT,
  nguoi_lh TEXT,
  cong_no NUMERIC DEFAULT 0,  -- Công nợ hiện tại (VND)
  don_gia TEXT,
  ghi_chu TEXT,
  trang_thai TEXT DEFAULT 'Đang hợp tác',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. BẢNG KHÁCH HÀNG SỈ (Master Data)
-- ============================================
CREATE TABLE IF NOT EXISTS khach_hang_si (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ma_kh TEXT UNIQUE NOT NULL,
  ten_kh TEXT NOT NULL,
  loai TEXT,                     -- shop-online | dai-ly | chuoi-cua-hang
  dia_chi TEXT,
  sdt TEXT,
  email TEXT,
  mst TEXT,
  nguoi_lh TEXT,
  chinh_sach TEXT,                -- Cong no 30 ngay | 15 ngay | etc
  han_muc_no NUMERIC DEFAULT 0,
  cong_no_hien_tai NUMERIC DEFAULT 0,
  doanh_so_nam NUMERIC DEFAULT 0,
  sp_chinh TEXT,
  ghi_chu TEXT,
  trang_thai TEXT DEFAULT 'Thường',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. BẢNG XƯỞNG GIA CÔNG (Master Data)
-- ============================================
CREATE TABLE IF NOT EXISTS xuong_gia_cong (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ma_xuong TEXT UNIQUE NOT NULL,
  ten_xuong TEXT NOT NULL,
  loai TEXT,                     -- may-ao | may-quan | in-theu-dap
  dia_chi TEXT,
  sdt TEXT,
  email TEXT,
  nguoi_lh TEXT,
  cong_suat TEXT,
  don_gia_tb NUMERIC DEFAULT 0,
  don_vi TEXT,
  ghi_chu TEXT,
  trang_thai TEXT DEFAULT 'Đang hợp tác',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. BẢNG AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT,
  action TEXT,
  table_name TEXT,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(username);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ============================================
-- 9. BẢNG NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT,
  title TEXT,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(username, read);

-- ============================================
-- 10. BẢNG LSOI (Lệnh Sản Xuất Tổng)
-- ============================================
CREATE TABLE IF NOT EXISTS lenh_sx_tong (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lsx_code TEXT UNIQUE NOT NULL,
  ma_sp TEXT NOT NULL,
  ten_sp TEXT NOT NULL,
  so_luong INT NOT NULL,
  mau TEXT,
  deadline DATE,
  khach_hang_id UUID REFERENCES khach_hang_si(id),
  trang_thai TEXT DEFAULT 'moi', -- moi | dang-sx | hoan-thanh | huy
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
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

-- ========== USERS POLICIES ==========
DROP POLICY IF EXISTS "users_read_all" ON users;
CREATE POLICY "users_read_all" ON users FOR SELECT USING (true);

-- ========== TASKS POLICIES ==========
DROP POLICY IF EXISTS "tasks_read_all" ON tasks;
CREATE POLICY "tasks_read_all" ON tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "tasks_write_self" ON tasks;
CREATE POLICY "tasks_write_self" ON tasks FOR ALL
  USING (true) WITH CHECK (true);

-- ========== KHO POLICIES ==========
DROP POLICY IF EXISTS "kho_read_all" ON kho;
CREATE POLICY "kho_read_all" ON kho FOR SELECT USING (true);

DROP POLICY IF EXISTS "kho_write_all" ON kho;
CREATE POLICY "kho_write_all" ON kho FOR ALL USING (true) WITH CHECK (true);

-- ========== CÔNG NỢ ==========
DROP POLICY IF EXISTS "cong_no_read_all" ON cong_no;
CREATE POLICY "cong_no_read_all" ON cong_no FOR SELECT USING (true);

DROP POLICY IF EXISTS "cong_no_write_all" ON cong_no;
CREATE POLICY "cong_no_write_all" ON cong_no FOR ALL USING (true) WITH CHECK (true);

-- ========== MASTER DATA (NCC, KH, Xưởng) ==========
DROP POLICY IF EXISTS "ncc_read_all" ON nha_cung_cap;
CREATE POLICY "ncc_read_all" ON nha_cung_cap FOR SELECT USING (true);

DROP POLICY IF EXISTS "kh_read_all" ON khach_hang_si;
CREATE POLICY "kh_read_all" ON khach_hang_si FOR SELECT USING (true);

DROP POLICY IF EXISTS "xuong_read_all" ON xuong_gia_cong;
CREATE POLICY "xuong_read_all" ON xuong_gia_cong FOR SELECT USING (true);

-- ========== NOTIFICATIONS ==========
DROP POLICY IF EXISTS "notif_read_all" ON notifications;
CREATE POLICY "notif_read_all" ON notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "notif_write_all" ON notifications;
CREATE POLICY "notif_write_all" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- REALTIME - Enable cho các bảng chính
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE kho;
ALTER PUBLICATION supabase_realtime ADD TABLE cong_no;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE nha_cung_cap;
ALTER PUBLICATION supabase_realtime ADD TABLE khach_hang_si;

-- ============================================
-- DONE!
-- ============================================
