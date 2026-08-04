-- BƯỚC 1: XÓA BẢNG NCC DƯ THỪA (vì đã dùng nha_cung_cap)
DROP TABLE IF EXISTS ncc CASCADE;

-- BƯỚC 2: TẠO BẢNG DANH MỤC VẬT TƯ (MASTER DATA)
CREATE TABLE IF NOT EXISTS vat_tu (
  ma_vt TEXT PRIMARY KEY,
  ten_vt TEXT NOT NULL,
  loai_vat_tu TEXT NOT NULL, -- e.g., 'vai', 'phu-lieu'
  don_vi_tinh TEXT NOT NULL,
  don_gia_mac_dinh NUMERIC DEFAULT 0,
  mau_sac TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo policy cho vat_tu (nếu có RLS)
ALTER TABLE vat_tu ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép đọc dữ liệu vat_tu" ON vat_tu FOR SELECT USING (true);
CREATE POLICY "Cho phép thêm/sửa/xóa vat_tu" ON vat_tu FOR ALL USING (true);

-- BƯỚC 3: CHUẨN HÓA BẢNG GIAO DỊCH KHO
-- 3.1: Chuyển đổi cột 'ngay' từ TEXT sang TIMESTAMPTZ
ALTER TABLE giao_dich_kho 
  ALTER COLUMN ngay TYPE TIMESTAMPTZ 
  USING ngay::TIMESTAMPTZ;

-- 3.2: Thêm Khóa Ngoại (Foreign Key)
-- Đảm bảo ma_vt trong giao_dich_kho phải tồn tại trong bảng vat_tu
ALTER TABLE giao_dich_kho 
  ADD CONSTRAINT fk_giao_dich_kho_vat_tu 
  FOREIGN KEY (ma_vt) 
  REFERENCES vat_tu(ma_vt) 
  ON DELETE CASCADE;

-- (Tùy chọn) Xóa cột ten_vt và don_vi trong giao_dich_kho vì đã có trong vat_tu
-- Tạm thời chưa DROP vội để tránh lỗi UI chưa update kịp, chỉ comment lại:
-- ALTER TABLE giao_dich_kho DROP COLUMN ten_vt, DROP COLUMN don_vi;
