-- ============================================
-- APPLY-SUPABASE-CONG-NHAN-GIA-CONG.sql
-- Tao bang moi: cong_nhan_gia_cong (camelCase)
-- Date: 2026-08-04
-- Project: ejcuqyaiwabfygyesvxj (Pro $25/thang)
-- ============================================
-- Bang luu cong nhan / xuong gia cong du phong (27 nguoi)
-- Dung de backup khi 20 NCC chinh thuc het lich / qua tai
-- Khac voi bang nha_cung_cap (20 NCC chinh thuc, snake_case)

-- ============================================
-- 1. CREATE TABLE
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cong_nhan_stt ON cong_nhan_gia_cong("stt");
CREATE INDEX IF NOT EXISTS idx_cong_nhan_loai_hang ON cong_nhan_gia_cong("loaiHang");
CREATE INDEX IF NOT EXISTS idx_cong_nhan_trang_thai ON cong_nhan_gia_cong("trangThai");
CREATE INDEX IF NOT EXISTS idx_cong_nhan_ngay_tao ON cong_nhan_gia_cong("ngayTao" DESC);

-- ============================================
-- 2. ENABLE RLS + POLICY
-- ============================================
ALTER TABLE cong_nhan_gia_cong ENABLE ROW LEVEL SECURITY;

-- Policy: Cho phep tat ca user authenticated CRUD
DROP POLICY IF EXISTS "Allow all for authenticated" ON cong_nhan_gia_cong;
CREATE POLICY "Allow all for authenticated" ON cong_nhan_gia_cong
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. INSERT 27 CONG NHAN GIA CONG (tu Excel gia cong du phong)
-- ============================================
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

-- Verify
SELECT COUNT(*) AS "Tong CNGC" FROM cong_nhan_gia_cong;
