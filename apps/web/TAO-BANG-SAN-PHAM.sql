-- ====================================================
-- TẠO BẢNG DANH SÁCH SẢN PHẨM & BƠM DỮ LIỆU
-- ====================================================

-- 1. Xoá bảng cũ (nếu có) để tạo mới sạch sẽ
DROP TABLE IF EXISTS san_pham CASCADE;

-- 2. Tạo cấu trúc bảng
CREATE TABLE IF NOT EXISTS san_pham (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_sp TEXT NOT NULL,
  loai_sp TEXT NOT NULL,
  ma_dm TEXT NOT NULL,
  ten_sp TEXT NOT NULL,
  dinh_muc NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật bảo mật RLS
ALTER TABLE san_pham ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON san_pham;
CREATE POLICY "Allow all for authenticated" ON san_pham FOR ALL USING (true) WITH CHECK (true);

-- Bật Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE san_pham;

-- 3. Bơm dữ liệu ban đầu
INSERT INTO san_pham (ma_sp, loai_sp, ma_dm, ten_sp, dinh_muc) VALUES
('M429', 'Bộ tròn', 'DM-BT', 'Trơn dập nổi thân trước', 0.54),
('M004', 'Bộ tròn', 'DM-BT', 'Phối chạy dây ép cao thành', 0.56),
('M909', 'Bộ trụ', 'DM-BTR', 'Trơn thuê', 0.54),
('M758', 'Bộ trụ', 'DM-BTR', 'Phối in TT', 0.54),
('C018', 'Bộ tròn', 'DM-BT', 'Trơn chạy sọc thuê', 0.54),
('C015', 'Bộ trụ', 'DM-BTR', 'Trơn chạy dây thêu', 0.54),
('C014', 'Bộ trụ', 'DM-BTR', 'Phối tay thêu TT', 0.56),
('M977', 'Bộ tròn', 'DM-BT', 'Phối thêu', 0.56),
('M008', 'Áo trụ', 'DM-ATR', 'Phối thêu', 0.3),
('C003', 'Bộ trụ', 'DM-BTR', 'Phối lé thêu', 0),
('M885', 'Bộ tròn', 'DM-BT', 'Lé thêu', 0.56),
('M651', 'Bộ tròn', 'DM-BT', 'Phối lé thêu', 0),
('M970', 'Bộ trụ', 'DM-BTR', 'Phối chạy dây thêu TT', 0),
('M002', 'Bộ trụ', 'DM-BTR', 'Phối chạy dây', 0),
('M008', 'Bộ trụ', 'DM-BTR', 'Phối thêu', 0),
('M024', 'Bộ tròn', 'DM-BT', 'Phối lé thêu', 0),
('M904', 'Áo trụ', 'DM-ATR', 'Phối', 0.3);
