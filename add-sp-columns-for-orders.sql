-- ===================================================================
-- MIMIN ERP - Bo sung columns cho san_pham de tao don hang
-- Ngay 2026-08-07 - Mavis
-- Sep yeu cau: "xem danh muc san pham can bo sung nhung gi can bo sung
--               de tao don hang dua tren du lieu co san"
-- ===================================================================
-- Chay tren Supabase Dashboard SQL Editor:
--   https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/sql/new
-- ===================================================================

-- ===================================================================
-- BUOC 1: THEM 10 COT MOI cho san_pham
-- ===================================================================

-- 1. GIA BAN DU KIEN (VND) - QUAN TRONG NHAT
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS gia_ban_du_kien NUMERIC(12,0) DEFAULT 0;
COMMENT ON COLUMN san_pham.gia_ban_du_kien IS 'Giá bán dự kiến (VND) - dùng khi tạo đơn hàng';

-- 2. GIA VON DU KIEN (VND)
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS gia_von_du_kien NUMERIC(12,0) DEFAULT 0;
COMMENT ON COLUMN san_pham.gia_von_du_kien IS 'Giá vốn dự kiến (VND) - tính lợi nhuận';

-- 3. BANG SIZE (JSONB) - de generate variants (maSP x mau x size)
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS bang_size JSONB DEFAULT '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,2,1],"riSo":8}'::jsonb;
COMMENT ON COLUMN san_pham.bang_size IS 'Bảng size chuẩn: sizes[], ratios[], riSo';

-- 4. TI LE SIZE (TEXT) - snapshot hien thi
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS ti_le_size TEXT DEFAULT '1:2:2:2:1';
COMMENT ON COLUMN san_pham.ti_le_size IS 'Tỉ lệ size hiển thị (VD: 1:2:2:2:1)';

-- 5. DANH SACH MAU (JSONB) - de generate variants + khach chon mau
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS ds_mau JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN san_pham.ds_mau IS 'Danh sách màu: [{ten, maSKU, dinhMuc, img}]';

-- 6. HINH ANH (URL)
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS hinh_anh TEXT;
COMMENT ON COLUMN san_pham.hinh_anh IS 'URL ảnh sản phẩm (Unsplash CDN hoặc upload)';

-- 7. TRANG THAI KHO
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS trang_thai TEXT DEFAULT 'con-hang'
  CHECK (trang_thai IN ('con-hang', 'het-hang', 'sap-ve', 'ngung-kinh-doanh'));
COMMENT ON COLUMN san_pham.trang_thai IS 'Trạng thái kho';

-- 8. NHA CUNG CAP
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS ncc TEXT;
COMMENT ON COLUMN san_pham.ncc IS 'Nhà cung cấp chính';

-- 9. CHAT LIEU
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS chat_lieu TEXT DEFAULT 'Cotton';
COMMENT ON COLUMN san_pham.chat_lieu IS 'Chất liệu vải (Cotton 100%, Polyester...)';

-- 10. MO TA NGAN
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS mo_ta_ngan TEXT;
COMMENT ON COLUMN san_pham.mo_ta_ngan IS 'Mô tả ngắn sản phẩm (hiển thị card)';

-- BONUS: ton_kho (so luong ton trong kho - check khi tao don)
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS ton_kho INTEGER DEFAULT 0;
COMMENT ON COLUMN san_pham.ton_kho IS 'Số lượng tồn kho hiện tại (tổng các size)';

-- BONUS: da_ban (so luong da ban - thong ke)
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS da_ban INTEGER DEFAULT 0;

-- ===================================================================
-- BUOC 2: TU DONG FILL DEFAULT cho 17 SP hien co
-- (De khong phai nhap tay 17 SP, em auto-fill tu data co san)
-- ===================================================================

-- 2a. Fill gia_von_du_kien = dinh_muc * 100000 (uoc luong)
UPDATE san_pham
SET gia_von_du_kien = COALESCE(dinh_muc, 0) * 100000
WHERE gia_von_du_kien = 0 OR gia_von_du_kien IS NULL;

-- 2b. Fill gia_ban_du_kien = gia_von * 1.5 (uoc luong markup 50%)
UPDATE san_pham
SET gia_ban_du_kien = gia_von_du_kien * 1.5
WHERE gia_ban_du_kien = 0 OR gia_ban_du_kien IS NULL;

-- 2c. Fill chat_lieu default
UPDATE san_pham
SET chat_lieu = 'Cotton'
WHERE chat_lieu IS NULL OR chat_lieu = '';

-- 2d. Fill ds_mau default (1 mau "Mac dinh") - de co the generate variants
UPDATE san_pham
SET ds_mau = jsonb_build_array(
  jsonb_build_object(
    'ten', 'Mặc định',
    'maSKU', ma_sp || '-DEFAULT',
    'dinhMuc', COALESCE(dinh_muc, 0.5),
    'img', COALESCE(hinh_anh, '')
  )
)
WHERE ds_mau IS NULL OR ds_mau = '[]'::jsonb OR jsonb_array_length(ds_mau) = 0;

-- 2e. Fill bang_size default (neu chua co)
UPDATE san_pham
SET bang_size = jsonb_build_object(
  'sizes', jsonb_build_array('M', 'L', 'XL', '2XL', '3XL'),
  'ratios', jsonb_build_array(1, 2, 2, 2, 1),
  'riSo', 8
)
WHERE bang_size IS NULL;

-- 2f. Fill ti_le_size default
UPDATE san_pham
SET ti_le_size = '1:2:2:2:1'
WHERE ti_le_size IS NULL OR ti_le_size = '';

-- 2g. Fill trang_thai default
UPDATE san_pham
SET trang_thai = 'con-hang'
WHERE trang_thai IS NULL;

-- 2h. Fill mo_ta_ngan tu ten_sp (snapshot)
UPDATE san_pham
SET mo_ta_ngan = ten_sp
WHERE mo_ta_ngan IS NULL;

-- ===================================================================
-- BUOC 3: TAO INDEX cho performance
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_san_pham_trang_thai ON san_pham(trang_thai);
CREATE INDEX IF NOT EXISTS idx_san_pham_ncc ON san_pham(ncc);

-- ===================================================================
-- BUOC 4: Verify
-- ===================================================================
SELECT
  ma_sp,
  ten_sp,
  gia_ban_du_kien,
  gia_von_du_kien,
  trang_thai,
  chat_lieu,
  jsonb_array_length(ds_mau) AS so_mau,
  jsonb_array_length(bang_size->'sizes') AS so_size
FROM san_pham
ORDER BY ma_sp;
