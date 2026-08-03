-- ============================================
-- MIMIN ERP - SUPABASE SCHEMA
-- ============================================
-- Chạy file này trong Supabase SQL Editor để tạo tables
-- Project URL: https://supabase.com/dashboard/project/_/sql

-- 1. Bảng Đơn hàng
CREATE TABLE IF NOT EXISTS don_hang (
  id TEXT PRIMARY KEY,
  ma_dh TEXT UNIQUE NOT NULL,
  ngay_dat DATE NOT NULL,
  ngay_giao DATE NOT NULL,
  khach_hang TEXT NOT NULL,
  sdt TEXT,
  san_pham TEXT NOT NULL,
  loai TEXT CHECK (loai IN ('Áo', 'Bộ')) NOT NULL,
  so_luong INTEGER NOT NULL,
  don_gia NUMERIC NOT NULL,
  thanh_tien NUMERIC NOT NULL,
  trang_thai TEXT CHECK (trang_thai IN ('Mới', 'Đã duyệt', 'Đang SX', 'Hoàn thành', 'Đã giao', 'Hủy')) DEFAULT 'Mới',
  tien_coc NUMERIC DEFAULT 0,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng Phân công công đoạn
CREATE TABLE IF NOT EXISTS phan_cong (
  id TEXT PRIMARY KEY,
  lenh_cat_id TEXT NOT NULL,
  cong_doan TEXT NOT NULL,
  nguoi_ma TEXT NOT NULL,
  nguoi_ten TEXT NOT NULL,
  nguoi_loai TEXT,
  nguoi_sdt TEXT,
  don_gia_giao NUMERIC NOT NULL,
  so_luong_giao INTEGER NOT NULL,
  don_vi TEXT,
  ngay_giao DATE NOT NULL,
  ngay_xong_du_kien DATE NOT NULL,
  trang_thai TEXT DEFAULT 'Chờ giao',
  da_thanh_toan NUMERIC DEFAULT 0,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng Giao dịch kho
CREATE TABLE IF NOT EXISTS giao_dich_kho (
  id TEXT PRIMARY KEY,
  ngay DATE NOT NULL,
  loai TEXT CHECK (loai IN ('NHAP', 'XUAT')) NOT NULL,
  ma_vt TEXT NOT NULL,
  ten_vt TEXT NOT NULL,
  so_luong NUMERIC NOT NULL,
  don_vi TEXT NOT NULL,
  don_gia NUMERIC NOT NULL,
  thanh_tien NUMERIC NOT NULL,
  loai_kho TEXT CHECK (loai_kho IN ('vai', 'phu-lieu')) NOT NULL,
  nguon_nhap TEXT,
  nguoi_thuc_hien TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng NCC (Nhà cung cấp)
CREATE TABLE IF NOT EXISTS ncc (
  stt INTEGER PRIMARY KEY,
  ten TEXT NOT NULL,
  vai_tro TEXT,
  sdt TEXT,
  mail TEXT,
  dia_chi TEXT,
  ma_so_thue TEXT,
  cong_no NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 4,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bảng Khách hàng
CREATE TABLE IF NOT EXISTS khach_hang (
  stt INTEGER PRIMARY KEY,
  ma_kh TEXT UNIQUE NOT NULL,
  ten TEXT NOT NULL,
  sdt TEXT,
  email TEXT,
  dia_chi TEXT,
  mst TEXT,
  cong_no NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 4,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bảng Nhân sự
CREATE TABLE IF NOT EXISTS nhan_su (
  stt INTEGER PRIMARY KEY,
  ma_nv TEXT UNIQUE NOT NULL,
  ho_ten TEXT NOT NULL,
  bo_phan TEXT,
  chuc_vu TEXT,
  sdt TEXT,
  email TEXT,
  luong_cung NUMERIC DEFAULT 8500000,
  rating NUMERIC DEFAULT 4,
  trang_thai TEXT DEFAULT 'dang_lam',
  avatar_url TEXT,
  cccd_front_url TEXT,
  cccd_back_url TEXT,
  ngay_sinh TEXT,
  gioi_tinh TEXT,
  cccd TEXT,
  dia_chi_tt TEXT,
  dia_chi_tam_tru TEXT,
  ngay_vao TEXT,
  tai_khoan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Bảng Push Subscriptions (cho Web Push Notification)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Bảng Notifications (lưu thông báo gửi cho user)
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL, -- 'late', 'due_soon', 'new_order', 'qc_fail', 'low_stock'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,         -- URL để click vào
  data JSONB,        -- Metadata
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE don_hang ENABLE ROW LEVEL SECURITY;
ALTER TABLE phan_cong ENABLE ROW LEVEL SECURITY;
ALTER TABLE giao_dich_kho ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncc ENABLE ROW LEVEL SECURITY;
ALTER TABLE khach_hang ENABLE ROW LEVEL SECURITY;
ALTER TABLE nhan_su ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies: Cho phép tất cả user đã đăng nhập được CRUD (đơn giản)
-- Trong thực tế nên chi tiết hơn theo role

CREATE POLICY "Allow all for authenticated" ON don_hang FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON phan_cong FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON giao_dich_kho FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON ncc FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON khach_hang FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON nhan_su FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for all" ON push_subscriptions FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete for all" ON push_subscriptions FOR DELETE USING (true);
CREATE POLICY "Allow all for authenticated" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGERS: Tự động tạo notification
-- ============================================

-- Function: Tạo notification khi phân công sắp trễ hạn
CREATE OR REPLACE FUNCTION notify_late_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ngay_xong_du_kien < CURRENT_DATE AND NEW.trang_thai NOT IN ('Hoàn thành', 'Đã thanh toán') THEN
    INSERT INTO notifications (type, title, body, link, data)
    VALUES (
      'late',
      '⚠️ Công đoạn trễ hạn',
      NEW.cong_doan || ' - ' || NEW.nguoi_ten,
      '/cong-no?lenh=' || NEW.lenh_cat_id,
      jsonb_build_object('phanCongId', NEW.id, 'lenhCatId', NEW.lenh_cat_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_late ON phan_cong;
CREATE TRIGGER trg_notify_late
  AFTER INSERT OR UPDATE ON phan_cong
  FOR EACH ROW
  EXECUTE FUNCTION notify_late_assignment();

-- Function: Notification khi tồn kho thấp
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_ton NUMERIC;
BEGIN
  -- Tính tồn kho = base + sum(NHAP) - sum(XUAT)
  SELECT
    COALESCE((SELECT so_luong FROM giao_dich_kho WHERE ma_vt = NEW.ma_vt AND loai = 'NHAP'), 0) -
    COALESCE((SELECT so_luong FROM giao_dich_kho WHERE ma_vt = NEW.ma_vt AND loai = 'XUAT'), 0)
  INTO v_ton;
  
  -- Nếu tồn < 0 (xuất nhiều hơn nhập) thì cảnh báo
  IF v_ton < 0 THEN
    INSERT INTO notifications (type, title, body, link, data)
    VALUES (
      'low_stock',
      '📦 Tồn kho âm!',
      NEW.ten_vt || ' đang âm: ' || v_ton,
      '/kho-vai',
      jsonb_build_object('maVT', NEW.ma_vt, 'ton', v_ton)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_low_stock ON giao_dich_kho;
CREATE TRIGGER trg_notify_low_stock
  AFTER INSERT ON giao_dich_kho
  FOR EACH ROW
  WHEN (NEW.loai = 'XUAT')
  EXECUTE FUNCTION notify_low_stock();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_don_hang_ngay_giao ON don_hang(ngay_giao);
CREATE INDEX IF NOT EXISTS idx_don_hang_trang_thai ON don_hang(trang_thai);
CREATE INDEX IF NOT EXISTS idx_phan_cong_lenh ON phan_cong(lenh_cat_id);
CREATE INDEX IF NOT EXISTS idx_phan_cong_deadline ON phan_cong(ngay_xong_du_kien);
CREATE INDEX IF NOT EXISTS idx_gd_kho_ma_vt ON giao_dich_kho(ma_vt);
CREATE INDEX IF NOT EXISTS idx_gd_kho_loai ON giao_dich_kho(loai_kho, loai);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read_at);

-- ============================================
-- REALTIME: Enable cho các bảng
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE don_hang;
ALTER PUBLICATION supabase_realtime ADD TABLE phan_cong;
ALTER PUBLICATION supabase_realtime ADD TABLE giao_dich_kho;
ALTER PUBLICATION supabase_realtime ADD TABLE ncc;
ALTER PUBLICATION supabase_realtime ADD TABLE khach_hang;
ALTER PUBLICATION supabase_realtime ADD TABLE nhan_su;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
