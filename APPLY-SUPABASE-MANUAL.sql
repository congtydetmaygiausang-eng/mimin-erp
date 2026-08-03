-- ============================================
-- MIMIN ERP - FULL SUPABASE SETUP (Chạy thủ công)
-- Sếp Sang copy toàn bộ file này → paste vào:
-- https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/sql/new
-- (Project MỚI - Gói Pro $25/tháng)
-- Bấm Run ▶️
-- ============================================
-- Tạo bởi: Mavis - 2026-08-03
-- Project cũ: nftlwdcsmlpeiazhuoho (Free) - KHÔNG dùng nữa
-- Project mới: ejcuqyaiwabfygyesvxj (Pro) - DÙNG từ giờ
-- Tổng cộng: 18 bảng + 20 đối tác + RLS + indexes
-- ============================================

-- ============================================
-- PHAN 0: DROP bang cu (neu co)
-- ============================================
DROP TABLE IF EXISTS nha_cung_cap CASCADE;
DROP TABLE IF EXISTS lenh_cat CASCADE;
DROP TABLE IF EXISTS mau_cong_doan CASCADE;
DROP TABLE IF EXISTS mau_chi_phi CASCADE;

-- ============================================
-- PHAN 1: SCHEMA CHINH (14 bang goc)
-- ============================================

-- 1. Bang Don hang
CREATE TABLE IF NOT EXISTS don_hang (
  id TEXT PRIMARY KEY,
  ma_dh TEXT UNIQUE NOT NULL,
  ngay_dat DATE NOT NULL,
  ngay_giao DATE NOT NULL,
  khach_hang TEXT NOT NULL,
  sdt TEXT,
  san_pham TEXT NOT NULL,
  loai TEXT CHECK (loai IN ('Ao', 'Bo')) NOT NULL,
  so_luong INTEGER NOT NULL,
  don_gia NUMERIC NOT NULL,
  thanh_tien NUMERIC NOT NULL,
  trang_thai TEXT CHECK (trang_thai IN ('Moi', 'Da duyet', 'Dang SX', 'Hoan thanh', 'Da giao', 'Huy')) DEFAULT 'Moi',
  tien_coc NUMERIC DEFAULT 0,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bang Phan cong cong doan
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
  trang_thai TEXT DEFAULT 'Cho giao',
  da_thanh_toan NUMERIC DEFAULT 0,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bang Giao dich kho
CREATE TABLE IF NOT EXISTS giao_dich_kho (
  id TEXT PRIMARY KEY,
  ngay TEXT NOT NULL,
  ma_vt TEXT NOT NULL,
  ten_vt TEXT,
  loai_kho TEXT NOT NULL,
  loai TEXT CHECK (loai IN ('NHAP', 'XUAT', 'KIEM_KE')) NOT NULL,
  so_luong NUMERIC NOT NULL,
  don_gia NUMERIC,
  thanh_tien NUMERIC,
  don_vi TEXT,
  nguoi_thuc_hien TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bang NCC (schema goc, ten ngan)
CREATE TABLE IF NOT EXISTS ncc (
  id TEXT PRIMARY KEY,
  ma_ncc TEXT UNIQUE NOT NULL,
  ten_ncc TEXT NOT NULL,
  loai TEXT,
  dia_chi TEXT,
  sdt TEXT,
  email TEXT,
  ghi_chu TEXT,
  trang_thai TEXT DEFAULT 'dang_hop_tac',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bang Khach hang
CREATE TABLE IF NOT EXISTS khach_hang (
  id TEXT PRIMARY KEY,
  ma_kh TEXT UNIQUE NOT NULL,
  ten_kh TEXT NOT NULL,
  loai TEXT,
  dia_chi TEXT,
  sdt TEXT,
  email TEXT,
  cong_no NUMERIC DEFAULT 0,
  ghi_chu TEXT,
  trang_thai TEXT DEFAULT 'hoat_dong',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bang Nhan su
CREATE TABLE IF NOT EXISTS nhan_su (
  stt SERIAL PRIMARY KEY,
  ma_nv TEXT UNIQUE NOT NULL,
  ho_ten TEXT NOT NULL,
  bo_phan TEXT,
  chuc_vu TEXT,
  sdt TEXT,
  email TEXT,
  luong_cung NUMERIC DEFAULT 0,
  rating INTEGER DEFAULT 3,
  trang_thai TEXT DEFAULT 'dang_lam',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Bang Bang luong
CREATE TABLE IF NOT EXISTS bang_luong (
  id TEXT PRIMARY KEY,
  ma_nv TEXT NOT NULL,
  thang DATE NOT NULL,
  luong_cung NUMERIC DEFAULT 0,
  luong_sp NUMERIC DEFAULT 0,
  phu_cap NUMERIC DEFAULT 0,
  thuc_nhan NUMERIC DEFAULT 0,
  trang_thai TEXT DEFAULT 'CHUA_TT',
  ngay_tt DATE,
  nguoi_tt TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Bang Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Bang Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT,
  read_at TIMESTAMPTZ,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Bang Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  resource_id TEXT,
  resource_name TEXT,
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  ip TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Bang Time bounds
CREATE TABLE IF NOT EXISTS time_bounds (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  bounds JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Bang Custom roles
CREATE TABLE IF NOT EXISTS custom_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Bang Two factor configs
CREATE TABLE IF NOT EXISTS two_factor_configs (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  secret TEXT,
  enabled BOOLEAN DEFAULT false,
  backup_codes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Bang Login attempts
CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  email TEXT,
  ip TEXT,
  success BOOLEAN DEFAULT false,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHAN 2: BANG RIENG (3 bang moi)
-- ============================================

-- 15. Bang Nha cung cap (chi tiet hon NCC)
CREATE TABLE IF NOT EXISTS nha_cung_cap (
  id              TEXT PRIMARY KEY,
  stt             INTEGER NOT NULL,
  ma_ncc          TEXT UNIQUE NOT NULL,
  ten_ncc         TEXT NOT NULL,
  loai            TEXT NOT NULL,
  chuyen_mon      TEXT NOT NULL,
  nguoi_lh        TEXT,
  sdt             TEXT,
  email           TEXT,
  dia_chi         TEXT,
  so_tai_khoan    TEXT,
  ngan_hang       TEXT,
  ma_so_thue      TEXT,
  cccd            TEXT,
  cccd_ngay_cap   TEXT,
  trang_thai      TEXT DEFAULT 'dang_hop_tac',
  ghi_chu         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ncc_ma ON nha_cung_cap(ma_ncc);
CREATE INDEX IF NOT EXISTS idx_ncc_loai ON nha_cung_cap(loai);
CREATE INDEX IF NOT EXISTS idx_ncc_trang_thai ON nha_cung_cap(trang_thai);

-- 16. Bang Lenh cat
CREATE TABLE IF NOT EXISTS lenh_cat (
  id              TEXT PRIMARY KEY,
  loai_lenh       TEXT NOT NULL CHECK (loai_lenh IN ('HangNha', 'HangDat')),
  khach_hang      TEXT,
  loai_sp         TEXT NOT NULL CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron')),
  ma_sp           TEXT NOT NULL,
  ten_sp          TEXT NOT NULL,
  tong_sl         INTEGER NOT NULL DEFAULT 0,
  tong_sl_thuc_te INTEGER,
  han_hoan_thanh  DATE,
  ti_le_size      TEXT,
  phu_trach_cat   TEXT,
  phu_trach_sx    TEXT,
  trang_thai      TEXT NOT NULL DEFAULT 'Nhap' CHECK (trang_thai IN ('Nhap', 'DaTao', 'DangCat', 'HoanThanh', 'ChuyenTiep')),
  phien_ban_dinh_muc INTEGER DEFAULT 1,
  ngay_tao        TIMESTAMPTZ DEFAULT NOW(),
  nguoi_tao       TEXT,
  ghi_chu         TEXT,
  ds_mau          JSONB DEFAULT '[]'::jsonb,
  ds_phu_lieu     JSONB DEFAULT '[]'::jsonb,
  phan_cong       JSONB DEFAULT '[]'::jsonb,
  chi_phi_co_dinh JSONB DEFAULT '{}'::jsonb,
  bang_cogs       JSONB,
  mau_cong_doan   TEXT,
  mau_chi_phi     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lenh_cat_trang_thai ON lenh_cat(trang_thai);
CREATE INDEX IF NOT EXISTS idx_lenh_cat_loai_sp ON lenh_cat(loai_sp);
CREATE INDEX IF NOT EXISTS idx_lenh_cat_ngay_tao ON lenh_cat(ngay_tao DESC);

-- 17. Bang Mau cong doan
CREATE TABLE IF NOT EXISTS mau_cong_doan (
  id          TEXT PRIMARY KEY,
  ten         TEXT NOT NULL,
  gia_cong    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Bang Mau chi phi
CREATE TABLE IF NOT EXISTS mau_chi_phi (
  id          TEXT PRIMARY KEY,
  ten         TEXT NOT NULL,
  chi_phi     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHAN 3: ROW LEVEL SECURITY (RLS) - Cho phep user da dang nhap CRUD
-- ============================================
ALTER TABLE don_hang ENABLE ROW LEVEL SECURITY;
ALTER TABLE phan_cong ENABLE ROW LEVEL SECURITY;
ALTER TABLE giao_dich_kho ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncc ENABLE ROW LEVEL SECURITY;
ALTER TABLE khach_hang ENABLE ROW LEVEL SECURITY;
ALTER TABLE nhan_su ENABLE ROW LEVEL SECURITY;
ALTER TABLE bang_luong ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_bounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nha_cung_cap ENABLE ROW LEVEL SECURITY;
ALTER TABLE lenh_cat ENABLE ROW LEVEL SECURITY;
ALTER TABLE mau_cong_doan ENABLE ROW LEVEL SECURITY;
ALTER TABLE mau_chi_phi ENABLE ROW LEVEL SECURITY;

-- Policies: Cho phep user da dang nhap CRUD
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['don_hang', 'phan_cong', 'giao_dich_kho', 'ncc', 'khach_hang', 'nhan_su', 'bang_luong', 'notifications', 'audit_logs', 'time_bounds', 'custom_roles', 'two_factor_configs', 'login_attempts', 'nha_cung_cap', 'lenh_cat', 'mau_cong_doan', 'mau_chi_phi'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated" ON %I', tbl);
    EXECUTE format('CREATE POLICY "Allow all for authenticated" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;

-- push_subscriptions rieng
DROP POLICY IF EXISTS "Allow read for all" ON push_subscriptions;
DROP POLICY IF EXISTS "Allow insert for all" ON push_subscriptions;
DROP POLICY IF EXISTS "Allow delete for all" ON push_subscriptions;
CREATE POLICY "Allow read for all" ON push_subscriptions FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete for all" ON push_subscriptions FOR DELETE USING (true);

-- ============================================
-- PHAN 4: INSERT 20 DOI TAC GIA CONG (tu CSV sep Sang 2026-08-03)
-- ============================================
INSERT INTO nha_cung_cap (id, stt, ma_ncc, ten_ncc, loai, chuyen_mon, nguoi_lh, sdt, email, dia_chi, so_tai_khoan, ngan_hang, ma_so_thue, cccd, cccd_ngay_cap, trang_thai) VALUES
-- 5 IN/THÊU/DẬP
('ncc_gc_in_001', 1, 'GC-IN-001', 'Xưởng in/thêu/dập Bảo Ngân', 'in_thêu_dập', 'In – Dập', 'Bảo Ngân', '978417243', '', 'b13/1a/15c ấp 2, xã tân vĩnh lộc, tphcm', '114624915555', 'TMCP công thương việt nam', '319004432', '', '', 'dang_hop_tac'),
('ncc_gc_in_002', 2, 'GC-IN-002', 'Xưởng in/thêu/dập Hạnh', 'in_thêu_dập', 'In – Dập', 'Hạnh', '374592478', 'honghanh38911@gmail.com', 'ấp mỹ hòa 2, xuân thới sơn, hcm', '0374592478', 'viettinbank', '', '079188007153', '12/01/2022', 'dang_hop_tac'),
('ncc_gc_in_003', 3, 'GC-IN-003', 'Xưởng in/thêu/dập Thanh Sơn', 'in_thêu_dập', 'In – Dập', 'Thanh Sơn', '937557261', 'thanhson040696@gmail.com', '219/1/1 đường 12, bình tân', '04061996', 'sacombank', '', '', '', 'dang_hop_tac'),
('ncc_gc_in_004', 4, 'GC-IN-004', 'Xưởng in/thêu/dập Tiến Đạt', 'in_thêu_dập', 'In – Dập', 'Tiến Đạt', '987700589', 'Invaitiendat@gmail.com', '48 nguyễn văn vinh, phú thạnh, hcm', '160320168', 'acb', '0316108031', '', '', 'dang_hop_tac'),
('ncc_gc_in_006', 6, 'GC-IN-006', 'Xưởng in/thêu/dập Vui', 'in_thêu_dập', 'In – Dập', 'Vui', '373779959', 'tranvuivn@gmai.com', 'đông hưng thuận 03, quận 12', '', '', '', '', '', 'dang_hop_tac'),

-- 4 MAY QUẦN
('ncc_gc_quan_001', 8, 'GC-QUAN-001', 'NGUYỄN THỊ NGỌC DUNG', 'may_quần', 'May quần', 'Nguyễn Thị Ngọc Dung', '383373415', 'nguyenthingocdung3415@gmail.com', 'Số 45C đường 26 ấp trung, Xã Tân Thông Hội, Huyện Củ Chi, TP.HCM', '00241983', 'OCB', '8898968687-001', '091183000355', '27/03/2022', 'dang_hop_tac'),
('ncc_gc_quan_002', 9, 'GC-QUAN-002', 'NHÀ MAY MINH VY', 'may_quần', 'May quần', 'Tổng Thị Minh', '362044839', 'Tongminh10081987@gmail.com', '27/6C Hưng Lân, Xã Bà Điểm, TP.HCM', '4362044839', 'vietcombank', '', '38187008969', '25/08/2022', 'dang_hop_tac'),
('ncc_gc_quan_003', 10, 'GC-QUAN-003', 'Xưởng may quần anh Thơ', 'may_quần', 'May quần', 'Tăng Văn Thơ', '766769562', 'Tangtho101@gmail.com', 'Ấp 12, Xã Vĩnh Lộc, TP.Hồ Chí Minh', '1490190764', 'bidv', '', '83084003261', '22/02/2023', 'dang_hop_tac'),
('ncc_gc_quan_004', 11, 'GC-QUAN-004', 'LÊ THỊ HOÀI HƯƠNG', 'may_quần', 'May quần', 'Lê Thị Hoài Hương', '941104007', '0941104007h@gmail.com', 'Thôn Xuân Thuận, Xã Phú Xuân, Tỉnh Đăk Lăk', '0231000604464', 'vietcombank', '66190017850', '066190017850', '12/08/2021', 'dang_hop_tac'),

-- 5 MAY ÁO TRÒN
('ncc_gc_tron_001', 12, 'GC-TRON-001', 'Xưởng may tròn anh Trai', 'may_áo_tròn', 'May áo tròn', 'Nguyễn Ngọc Trai', '908908167', 'nguyenngoctrai139@gmail.com', 'Ấp 19, Xã Vĩnh Lộc, Huyện Bình Chánh, TP.HCM', '3180088065', 'bidv', '', '0520082013001', '27/01/2023', 'dang_hop_tac'),
('ncc_gc_tron_002', 13, 'GC-TRON-002', 'Xưởng may tròn chị Hằng', 'may_áo_tròn', 'May áo tròn', 'phan thị thúy hằng', '909802852', '', '41/1C Hưng Lân, Bà Điểm, Hóc Môn', '060259005607', 'sacombank', '', '', '', 'dang_hop_tac'),
('ncc_gc_tron_003', 14, 'GC-TRON-003', 'Xưởng may tròn anh Chiến', 'may_áo_tròn', 'May áo tròn', 'Chiến', '986747344', '', '1/8/13 Tân Thới Nhất 22, hẻm 123, Q.12', '19035056718019', 'techcombank', '', '', '', 'dang_hop_tac'),
('ncc_gc_tron_004', 15, 'GC-TRON-004', 'Xưởng may tròn anh Thuận', 'may_áo_tròn', 'May áo tròn', 'Thuận', '903071501', 'ducthuan0715@gmail.com', '28/10/15 KP40, Tân Thới Nhất 11, Q.12', '43075977', 'ACB', '', '', '', 'dang_hop_tac'),
('ncc_gc_tron_005', 16, 'GC-TRON-005', 'Xưởng may quang', 'may_áo_tròn', 'May áo tròn', 'Quang', '966670624', '', '133/42 liên khu 4, khu phố 5, phường binh hưng hòa B, quận bình tân', '6440205573303', 'agribank', '', '', '', 'dang_hop_tac'),

-- 6 MAY ÁO TRỤ
('ncc_gc_tru_001', 26, 'GC-TRU-001', 'NGUYỄN THỊ NGỌC LIỄU', 'may_áo_trụ', 'May áo trụ', 'Nguyễn Thị Ngọc Liễu', '933305465', '', '594/59 Âu Cơ, KP 4, P. Bảy Hiền, TP.HCM', '', '', '83182011101', '083182011101', '22/12/2021', 'dang_hop_tac'),
('ncc_gc_tru_002', 27, 'GC-TRU-002', 'Xưởng may trụ anh Tý Sơn', 'may_áo_trụ', 'May áo trụ', 'Nguyễn Hữu Kim Ly Sơn', '794953483', 'nguyenhuukimlyson@gmail.com', 'Nhà không số ấp 29, Xã Tân Vĩnh Lộc, TP.HCM', '060287316545', 'sacombank', '', '066188019712', '20/01/2022', 'dang_hop_tac'),
('ncc_gc_tru_003', 28, 'GC-TRU-003', 'Xưởng may trụ anh Duẩn', 'may_áo_trụ', 'May áo trụ', 'Dương Xuân Duẩn', '966266775', 'Xuanduanduong87@gmail.com', 'Đường N11, tổ 1 KP 2, P. Thới Hòa, TP.HCM', '07119869', 'vietcombank', '', '034086003445', '26/08/2022', 'dang_hop_tac'),
('ncc_gc_tru_005', 30, 'GC-TRU-005', 'THÔNG THƯƠNG', 'may_áo_trụ', 'May áo trụ', 'Nguyễn Văn Thông', '933305465', 'bt5815989@gmail.com', '28/8 Ấp 46, Xã Hóc Môn, TP.HCM', '0355589066', 'mb', '86090005870', '086090005870', '22/12/2021', 'dang_hop_tac'),
('ncc_gc_tru_006', 31, 'GC-TRU-006', 'Xưởng may trụ cô Cúc', 'may_áo_trụ', 'May áo trụ', 'Huỳnh Thị Cúc Em', '907869422', 'huynhthicucem1210@gmail.com', '1/5B KP49 Nguyễn Văn Quá, P.Đông Hưng Thuận', '9907869422', 'techcombank', '', '', '', 'dang_hop_tac'),
('ncc_gc_tru_007', 32, 'GC-TRU-007', 'Xưởng may trụ anh Sản', 'may_áo_trụ', 'May áo trụ', 'Nguyễn Gia Sản', '906042853', 'Giasan20015@gmail.com', 'Tổ 16 đường Lê Văn Chi, Linh Xuân', '8888906042853', 'agribank', '', '030080000661', '19/09/2024', 'dang_hop_tac')
ON CONFLICT (ma_ncc) DO NOTHING;

-- ============================================
-- PHAN 5: INSERT 18 NHAN SU (admin + 17 NV moi tu Excel)
-- ============================================
INSERT INTO nhan_su (ma_nv, ho_ten, bo_phan, chuc_vu, sdt, email, luong_cung, trang_thai) VALUES
('NV035', 'Hồ Minh Sang', 'Ban Giám Đốc', 'Quản trị hệ thống', '0774480916', 'sang@mimin.vn', 25000000, 'dang_lam'),

('NV002', 'Bùi Thị Thanh', 'Phòng Kế Toán', 'Kế toán điều phối SX', '0911546004', 'thanh@mimin.vn', 8000000, 'dang_lam'),
('NV003', 'Đỗ Thị Huyền', 'Phòng Kinh Doanh', 'QL Khách hàng Sỉ', '0376327699', 'huyen@mimin.vn', 7000000, 'dang_lam'),
('NV004', 'Nguyễn Ngọc Cẩm Vy', 'Phòng Marketing', 'Content - Media', '0779182053', 'vy@mimin.vn', 8000000, 'dang_lam'),
('NV005', 'Nguyễn Quốc Hậu', 'Phòng Kho', 'Nhân viên Kho', '0386231456', 'hau@mimin.vn', 7000000, 'dang_lam'),

('NV007', 'Phạm Văn Đệ', 'Tổ May', 'Cắt (1400đ trụ/1200đ tròn/900đ quần)', '0834033992', 'de@mimin.vn', 0, 'dang_lam'),
('NV009', 'Nguyễn Thị Mỹ Nhi', 'Tổ Hoàn Thiện', 'Gấp xếp (Bộ 1.300đ/Áo 800đ)', '0901207771', 'nhi@mimin.vn', 0, 'dang_lam'),
('NV010', 'Võ Thị Phương', 'Tổ Hoàn Thiện', 'Gấp xếp (Bộ 1.300đ/Áo 800đ)', '0702501456', 'phuong@mimin.vn', 0, 'dang_lam'),
('NV019', 'Nguyễn Thị Bé', 'Tổ Hoàn Thiện', 'Gấp xếp', '0363073998', 'be@mimin.vn', 0, 'dang_lam'),
('NV021', 'Nguyễn Minh Đức', 'Tổ Hoàn Thiện', 'Ủi (Áo trụ 800đ/Áo tròn 700đ)', '0365052474', 'duc1@mimin.vn', 0, 'dang_lam'),
('NV022', 'Trương Minh Tâm', 'Tổ Hoàn Thiện', 'Ủi (Áo trụ 800đ/Áo tròn 700đ)', '0343513417', 'tam@mimin.vn', 0, 'dang_lam'),
('NV023', 'Lê Định', 'Tổ Hoàn Thiện', 'Ủi (Áo trụ 800đ/Áo tròn 700đ)', '334047628', 'dinh@mimin.vn', 0, 'dang_lam'),
('NV024', 'Dương Tấn Vĩnh', 'Tổ May', 'Cắt (1400đ/1200đ/900đ)', '0392123831', 'vinh@mimin.vn', 0, 'dang_lam'),
('NV025', 'Nguyễn Quốc Minh', 'Tổ May', 'Cắt (1400đ/1200đ/900đ)', '0332026731', 'minh1@mimin.vn', 0, 'dang_lam'),
('NV026', 'Trương Văn Nhẫn', 'Tổ May', 'Cắt (1400đ/1200đ/900đ)', '0345141953', 'nhan@mimin.vn', 0, 'dang_lam'),
('NV017', 'Nguyễn Văn Ruộng', 'Tổ Hoàn Thiện', 'Khuy nút (750đ)', '0339724459', 'ruong@mimin.vn', 0, 'dang_lam'),
('NV020', 'Huỳnh Xuân Hòa', 'Phòng Marketing', 'Media', '0334536752', 'hoa@mimin.vn', 10000000, 'dang_lam'),
('NV027', 'Lương Hoàng Phi', 'Phòng Marketing', 'Media', '0938625594', 'phi@mimin.vn', 0, 'dang_lam')
ON CONFLICT (ma_nv) DO NOTHING;

-- ============================================
-- PHAN 6: REALTIME
-- ============================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE don_hang;
    ALTER PUBLICATION supabase_realtime ADD TABLE phan_cong;
    ALTER PUBLICATION supabase_realtime ADD TABLE giao_dich_kho;
    ALTER PUBLICATION supabase_realtime ADD TABLE ncc;
    ALTER PUBLICATION supabase_realtime ADD TABLE khach_hang;
    ALTER PUBLICATION supabase_realtime ADD TABLE nhan_su;
    ALTER PUBLICATION supabase_realtime ADD TABLE bang_luong;
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication skipped (some tables may not exist yet)';
  END;
END $$;

-- ============================================
-- HOAN THANH
-- ============================================
-- Da tao 18 bang + 20 doi tac + 18 nhan su + RLS + indexes + realtime
-- Bang: don_hang, phan_cong, giao_dich_kho, ncc, khach_hang, nhan_su,
--       bang_luong, push_subscriptions, notifications, audit_logs,
--       time_bounds, custom_roles, two_factor_configs, login_attempts,
--       nha_cung_cap, lenh_cat, mau_cong_doan, mau_chi_phi
