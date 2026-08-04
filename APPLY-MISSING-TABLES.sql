-- ============================================
-- APPLY-MISSING-TABLES.sql
-- Apply cac bang con thieu trong Supabase Pro (ejcuqyaiwabfygyesvxj)
-- Date: 2026-08-05
-- ============================================
-- Audit phat hien:
-- 1. 9 bang workflow CHUA co (code co store sync, DB thieu)
-- 2. vat_tu KHONG co RLS policy
-- 3. cong_nhan_gia_cong (bang moi Phase 3) can apply
--
-- Lenh apply: Copy toan bo file nay -> Supabase SQL Editor -> Run

-- ============================================
-- 1. BANG CONG_NO (workflow store)
-- ============================================
CREATE TABLE IF NOT EXISTS cong_no (
  id              TEXT PRIMARY KEY,
  "maLenhCat"     TEXT,
  "boPhan"        TEXT,
  "nguoiPhuTrach" TEXT,
  "soTien"        NUMERIC DEFAULT 0,
  "trangThai"     TEXT DEFAULT 'CHUA_TT',
  "ghiChu"        TEXT,
  "ngayTao"       TIMESTAMPTZ DEFAULT NOW(),
  "ngayTT"        DATE,
  "created_at"    TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cong_no_trang_thai ON cong_no("trangThai");
CREATE INDEX IF NOT EXISTS idx_cong_no_ngay_tao ON cong_no("ngayTao" DESC);
ALTER TABLE cong_no ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON cong_no;
CREATE POLICY "Allow all for authenticated" ON cong_no FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 2. BANG KHSX (ke hoach san xuat)
-- ============================================
CREATE TABLE IF NOT EXISTS khsx (
  id              TEXT PRIMARY KEY,
  "maLenhCat"     TEXT,
  "ngayBD"        DATE,
  "ngayKT"        DATE,
  "sanPham"       TEXT,
  "soLuong"       INTEGER DEFAULT 0,
  "trangThai"     TEXT DEFAULT 'chua_thuc_hien',
  "ghiChu"        TEXT,
  "nguoiPhuTrach" TEXT,
  "ngayTao"       TIMESTAMPTZ DEFAULT NOW(),
  "created_at"    TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_khsx_trang_thai ON khsx("trangThai");
CREATE INDEX IF NOT EXISTS idx_khsx_ngay_bd ON khsx("ngayBD" DESC);
ALTER TABLE khsx ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON khsx;
CREATE POLICY "Allow all for authenticated" ON khsx FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 3. BANG QC_RECORDS (kiem tra chat luong)
-- ============================================
CREATE TABLE IF NOT EXISTS qc_records (
  id              TEXT PRIMARY KEY,
  "maLenhCat"     TEXT,
  "nguoiQC"       TEXT,
  "soLuongKiem"   INTEGER DEFAULT 0,
  "soLuongDat"    INTEGER DEFAULT 0,
  "soLuongLoi"    INTEGER DEFAULT 0,
  "loiPhatHien"   TEXT,
  "trangThai"     TEXT DEFAULT 'dat',
  "ngayKiem"      DATE,
  "ghiChu"        TEXT,
  "ngayTao"       TIMESTAMPTZ DEFAULT NOW(),
  "created_at"    TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qc_ngay_kiem ON qc_records("ngayKiem" DESC);
CREATE INDEX IF NOT EXISTS idx_qc_trang_thai ON qc_records("trangThai");
ALTER TABLE qc_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON qc_records;
CREATE POLICY "Allow all for authenticated" ON qc_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 4. BANG HOAN_THIEN (workflow store)
-- ============================================
CREATE TABLE IF NOT EXISTS hoan_thien (
  id              TEXT PRIMARY KEY,
  "maLenhCat"     TEXT,
  "nguoiHT"       TEXT,
  "congDoan"      TEXT,
  "soLuong"       INTEGER DEFAULT 0,
  "trangThai"     TEXT DEFAULT 'chua_hoan_thien',
  "ngayHT"        DATE,
  "ghiChu"        TEXT,
  "ngayTao"       TIMESTAMPTZ DEFAULT NOW(),
  "created_at"    TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hoan_thien_ma_lenh_cat ON hoan_thien("maLenhCat");
ALTER TABLE hoan_thien ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON hoan_thien;
CREATE POLICY "Allow all for authenticated" ON hoan_thien FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 5. BANG GIAO_HANG (don giao hang)
-- ============================================
CREATE TABLE IF NOT EXISTS giao_hang (
  id              TEXT PRIMARY KEY,
  "maDonHang"     TEXT,
  "maLenhCat"     TEXT,
  "khachHang"     TEXT,
  "diaChiGiao"    TEXT,
  "ngayGiao"      DATE,
  "soLuong"       INTEGER DEFAULT 0,
  "trangThai"     TEXT DEFAULT 'chua_giao',
  "nguoiGiao"     TEXT,
  "ghiChu"        TEXT,
  "ngayTao"       TIMESTAMPTZ DEFAULT NOW(),
  "created_at"    TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_giao_hang_ngay_giao ON giao_hang("ngayGiao" DESC);
CREATE INDEX IF NOT EXISTS idx_giao_hang_trang_thai ON giao_hang("trangThai");
ALTER TABLE giao_hang ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON giao_hang;
CREATE POLICY "Allow all for authenticated" ON giao_hang FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 6. BANG GIA_CONG (xuong gia cong ngoai)
-- ============================================
CREATE TABLE IF NOT EXISTS gia_cong (
  id              TEXT PRIMARY KEY,
  "maLenhCat"     TEXT,
  "maDoiTac"      TEXT,
  "tenDoiTac"     TEXT,
  "congDoan"      TEXT,
  "soLuongGiao"   INTEGER DEFAULT 0,
  "soLuongNhan"   INTEGER DEFAULT 0,
  "donGia"        NUMERIC DEFAULT 0,
  "thanhTien"     NUMERIC DEFAULT 0,
  "trangThai"     TEXT DEFAULT 'cho_thuc_hien',
  "ngayGiao"      DATE,
  "ngayNhan"      DATE,
  "ghiChu"        TEXT,
  "nguoiTao"      TEXT,
  "ngayTao"       TIMESTAMPTZ DEFAULT NOW(),
  "created_at"    TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gia_cong_ma_lenh_cat ON gia_cong("maLenhCat");
CREATE INDEX IF NOT EXISTS idx_gia_cong_trang_thai ON gia_cong("trangThai");
ALTER TABLE gia_cong ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON gia_cong;
CREATE POLICY "Allow all for authenticated" ON gia_cong FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 7. BANG DOI_SOAT (doi soat tien cong)
-- ============================================
CREATE TABLE IF NOT EXISTS doi_soat (
  id              TEXT PRIMARY KEY,
  "maDoiTac"      TEXT,
  "tenDoiTac"     TEXT,
  "kyThanhToan"   TEXT,
  "soLuong"       INTEGER DEFAULT 0,
  "donGia"        NUMERIC DEFAULT 0,
  "tongTien"      NUMERIC DEFAULT 0,
  "daThanhToan"   NUMERIC DEFAULT 0,
  "conLai"        NUMERIC DEFAULT 0,
  "trangThai"     TEXT DEFAULT 'chua_tt',
  "ngayDoiSoat"   DATE,
  "ghiChu"        TEXT,
  "nguoiTao"      TEXT,
  "ngayTao"       TIMESTAMPTZ DEFAULT NOW(),
  "created_at"    TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doi_soat_ma_doi_tac ON doi_soat("maDoiTac");
CREATE INDEX IF NOT EXISTS idx_doi_soat_trang_thai ON doi_soat("trangThai");
ALTER TABLE doi_soat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON doi_soat;
CREATE POLICY "Allow all for authenticated" ON doi_soat FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 8. BANG KHO_MOBILE (kho mobile)
-- ============================================
CREATE TABLE IF NOT EXISTS kho_mobile (
  id              TEXT PRIMARY KEY,
  "maKho"         TEXT,
  "tenKho"        TEXT,
  "maVatTu"       TEXT,
  "tenVatTu"      TEXT,
  "soLuong"       NUMERIC DEFAULT 0,
  "donViTinh"     TEXT,
  "loaiGiaoDich"  TEXT,
  "ngayGiaoDich"  DATE,
  "ghiChu"        TEXT,
  "nguoiTao"      TEXT,
  "ngayTao"       TIMESTAMPTZ DEFAULT NOW(),
  "created_at"    TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kho_mobile_ma_kho ON kho_mobile("maKho");
CREATE INDEX IF NOT EXISTS idx_kho_mobile_ngay ON kho_mobile("ngayGiaoDich" DESC);
ALTER TABLE kho_mobile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON kho_mobile;
CREATE POLICY "Allow all for authenticated" ON kho_mobile FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 9. BANG MAU_CHI_PHI (mau chi phi co dinh)
-- ============================================
CREATE TABLE IF NOT EXISTS mau_chi_phi (
  id          TEXT PRIMARY KEY,
  "ten"       TEXT NOT NULL,
  "chiPhi"    JSONB NOT NULL DEFAULT '{}'::jsonb,
  "moTa"      TEXT,
  "nguoiTao"  TEXT,
  "ngayTao"   TIMESTAMPTZ DEFAULT NOW(),
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE mau_chi_phi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON mau_chi_phi;
CREATE POLICY "Allow all for authenticated" ON mau_chi_phi FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 10. BANG CONG_NHAN_GIA_CONG (Phase 3 - 27 CN du phong)
-- ============================================
CREATE TABLE IF NOT EXISTS cong_nhan_gia_cong (
  id            TEXT PRIMARY KEY,
  "stt"         INTEGER NOT NULL,
  "hoTen"       TEXT NOT NULL,
  "sdt"         TEXT NOT NULL,
  "loaiHang"    TEXT NOT NULL,
  "soTho"       INTEGER DEFAULT 0,
  "diaChi"      TEXT,
  "ghiChu"      TEXT,
  "trangThai"   TEXT NOT NULL DEFAULT 'san_sang' CHECK ("trangThai" IN ('san_sang', 'tam_ngung', 'het_viec')),
  "nguoiTao"    TEXT,
  "ngayTao"     TIMESTAMPTZ DEFAULT NOW(),
  "created_at"  TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cong_nhan_stt ON cong_nhan_gia_cong("stt");
CREATE INDEX IF NOT EXISTS idx_cong_nhan_loai_hang ON cong_nhan_gia_cong("loaiHang");
CREATE INDEX IF NOT EXISTS idx_cong_nhan_trang_thai ON cong_nhan_gia_cong("trangThai");
CREATE INDEX IF NOT EXISTS idx_cong_nhan_ngay_tao ON cong_nhan_gia_cong("ngayTao" DESC);
ALTER TABLE cong_nhan_gia_cong ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON cong_nhan_gia_cong;
CREATE POLICY "Allow all for authenticated" ON cong_nhan_gia_cong FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert 27 cong nhan gia cong
INSERT INTO cong_nhan_gia_cong (id, "stt", "hoTen", "sdt", "loaiHang", "soTho", "diaChi", "ghiChu", "trangThai") VALUES
  ('CNGC-001', 1, 'Trần Liên', '0333270997', 'đa dạng', 22, 'Bình Phước (giáp ranh BD)', 'Xưởng lớn, đa dạng', 'san_sang'),
  ('CNGC-002', 2, 'Minh Thuy', '0902310887', 'đa dạng', 28, 'Quận 8', 'Lớn nhất, nhận đơn đa dạng', 'san_sang'),
  ('CNGC-003', 3, 'Hiền Vũ', '0352186386', 'cổ tròn', 18, 'Ngã 3 Mỹ Hạnh, Long An', 'Xưởng lớn, gần TP.HCM', 'san_sang'),
  ('CNGC-004', 4, 'Quang Vinh', '0978939078', 'polo', 20, 'Dĩ An, Bình Dương', 'Chuyên polo, quy mô tốt', 'san_sang'),
  ('CNGC-005', 5, 'Delisngo', '0919919767', 'đa dạng', 10, 'Đức Hòa, Long An', 'Thầu đa dạng', 'san_sang'),
  ('CNGC-006', 6, 'Nguyễn Văn Cường', '0969423170', 'cổ trụ', 10, 'Bình Chánh - Vĩnh Lộc A', 'Gần khu công nghiệp', 'san_sang'),
  ('CNGC-007', 7, 'Sang Vo', '0985070815', 'cổ tròn', 10, 'Vĩnh Lộc A', 'Có thể so giá với Cường', 'san_sang'),
  ('CNGC-008', 8, 'Thanh Trần', '0988678351', 'cổ tròn', 10, 'Hóc Môn', 'Khu vực trung tâm huyện', 'san_sang'),
  ('CNGC-009', 9, 'Lý Nguyên', '0765618968', 'cổ trụ', 10, 'Hóc Môn', 'Cạnh tranh khu vực', 'san_sang'),
  ('CNGC-010', 10, 'Cuc Nguyen', '0386226824', 'cổ trụ', 10, 'Xuân Thới Thượng', 'Chi phí nhân công rẻ', 'san_sang'),
  ('CNGC-011', 11, 'Xưởng may Nam Việt', '0903147259', 'polo', 10, 'Quận 12', 'Có thương hiệu xưởng', 'san_sang'),
  ('CNGC-012', 12, 'Anh Minh', '0983332294', 'cổ tròn', 8, 'Gò Vấp', 'Linh hoạt số lượng ít', 'san_sang'),
  ('CNGC-013', 13, 'Nguyễn Thị Tịnh', '0344015210', 'móc xích', 8, 'Vĩnh Lộc', 'Chuyên móc xích (hiếm)', 'san_sang'),
  ('CNGC-014', 14, 'Lê Thị Thu Phương', '0902908053', 'polo', 6, 'Bình Thuận', 'Xưởng nhỏ, chuyên polo', 'san_sang'),
  ('CNGC-015', 15, 'Trương Tuấn Phong', '0985988901', 'đa dạng', 6, 'Thủ Đức', 'Đa dạng, có áo khoác', 'san_sang'),
  ('CNGC-016', 16, 'Kim Nguyễn', '0934137991', 'cổ tròn', 6, 'Quận 7', 'Xưởng nhỏ, nội thành', 'san_sang'),
  ('CNGC-017', 17, 'Nguyễn Sang', '0934157917', 'cổ tròn', 8, 'Quận 7', 'Gần Kim Nguyễn, có thể so giá', 'san_sang'),
  ('CNGC-018', 18, 'Nguyễn Chương', '0703549098', 'cổ tròn', 16, 'Vĩnh Lộc', 'Xưởng vừa, số thợ ổn định', 'san_sang'),
  ('CNGC-019', 19, 'Vinh', '0384854479', 'cổ trụ', 20, 'TP.HCM (không rõ quận)', 'Xưởng lớn nhưng thiếu địa chỉ', 'san_sang'),
  ('CNGC-020', 20, 'Mai Hậu', '0973018817', 'móc xích', 8, '(chưa rõ)', 'Cần hỏi lại kho bãi', 'san_sang'),
  ('CNGC-021', 21, 'Hoàng Trần', '0867796951', 'móc xích', 8, '(chưa rõ)', 'Cần hỏi lại địa chỉ', 'san_sang'),
  ('CNGC-022', 22, 'Đặng Quốc Phong', '0906389774', 'thun', 8, 'Nga Tư Gò Mây (?)', 'Khu vực nào? có thể là Gò Vấp?', 'san_sang'),
  ('CNGC-023', 23, '(SĐT 968898952)', '0968898952', 'thun', 20, 'Tân Phú', 'Xưởng lớn, chỉ có số', 'san_sang'),
  ('CNGC-024', 24, 'Ngọc', '0979630047', 'móc xích', 8, 'Cầu Sáng, Hóc Môn', 'Chuyên móc xích', 'san_sang'),
  ('CNGC-025', 25, 'Đầm Lê', '0965000281', 'cổ tròn', 9, 'Thủ Đức', 'Xưởng nhỏ gần trường', 'san_sang'),
  ('CNGC-026', 26, '(SĐT 372639336)', '0372639336', 'cổ tròn', 10, 'Bà Điểm', 'Khu vực Hóc Môn', 'san_sang'),
  ('CNGC-027', 27, 'Duy Tú', '0345635667', 'đa dạng', 7, 'Bệnh viện Hóc Môn', 'Gần bệnh viện, tiện liên hệ', 'san_sang')
ON CONFLICT (id) DO UPDATE SET
  "stt" = EXCLUDED."stt",
  "hoTen" = EXCLUDED."hoTen",
  "sdt" = EXCLUDED."sdt",
  "loaiHang" = EXCLUDED."loaiHang",
  "soTho" = EXCLUDED."soTho",
  "diaChi" = EXCLUDED."diaChi",
  "ghiChu" = EXCLUDED."ghiChu",
  "trangThai" = EXCLUDED."trangThai",
  "updated_at" = NOW();

-- ============================================
-- 11. FIX: THEM RLS POLICY CHO VAT_TU
-- ============================================
ALTER TABLE vat_tu ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON vat_tu;
CREATE POLICY "Allow all for authenticated" ON vat_tu
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VERIFY
-- ============================================
SELECT 'audit_logs' AS tbl, COUNT(*) FROM audit_logs
UNION ALL SELECT 'bang_chi_phi_co_dinh', COUNT(*) FROM bang_chi_phi_co_dinh
UNION ALL SELECT 'bang_luong', COUNT(*) FROM bang_luong
UNION ALL SELECT 'cong_no', COUNT(*) FROM cong_no
UNION ALL SELECT 'cong_nhan_gia_cong', COUNT(*) FROM cong_nhan_gia_cong
UNION ALL SELECT 'custom_roles', COUNT(*) FROM custom_roles
UNION ALL SELECT 'doi_soat', COUNT(*) FROM doi_soat
UNION ALL SELECT 'don_hang', COUNT(*) FROM don_hang
UNION ALL SELECT 'giao_dich_kho', COUNT(*) FROM giao_dich_kho
UNION ALL SELECT 'giao_hang', COUNT(*) FROM giao_hang
UNION ALL SELECT 'gia_cong', COUNT(*) FROM gia_cong
UNION ALL SELECT 'hoan_thien', COUNT(*) FROM hoan_thien
UNION ALL SELECT 'khach_hang', COUNT(*) FROM khach_hang
UNION ALL SELECT 'kho_mobile', COUNT(*) FROM kho_mobile
UNION ALL SELECT 'khsx', COUNT(*) FROM khsx
UNION ALL SELECT 'lenh_cat', COUNT(*) FROM lenh_cat
UNION ALL SELECT 'login_attempts', COUNT(*) FROM login_attempts
UNION ALL SELECT 'mau_chi_phi', COUNT(*) FROM mau_chi_phi
UNION ALL SELECT 'mau_cong_doan', COUNT(*) FROM mau_cong_doan
UNION ALL SELECT 'nha_cung_cap', COUNT(*) FROM nha_cung_cap
UNION ALL SELECT 'nhan_su', COUNT(*) FROM nhan_su
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'phan_cong', COUNT(*) FROM phan_cong
UNION ALL SELECT 'push_subscriptions', COUNT(*) FROM push_subscriptions
UNION ALL SELECT 'qc_records', COUNT(*) FROM qc_records
UNION ALL SELECT 'time_bounds', COUNT(*) FROM time_bounds
UNION ALL SELECT 'two_factor_configs', COUNT(*) FROM two_factor_configs
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'vat_tu', COUNT(*) FROM vat_tu
ORDER BY tbl;
