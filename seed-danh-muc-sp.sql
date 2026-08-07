-- ===================================================================
-- MIMIN ERP - Seed 17 san pham POLOMIMIN vao bang san_pham
-- Chay tren Supabase SQL Editor (2026-08-07)
-- Schema columns: ma_sp, ma_dm, ten_sp, loai_sp, gia_ban_du_kien, gia_von_du_kien,
--                 ti_le_size, bang_size (jsonb), ds_mau (jsonb), ghi_chu, ngay_tao,
--                 trang_thai, da_ban, ncc, chat_lieu, luot_xem, rating, hinh_anh
-- ===================================================================

-- 1. ALTER TABLE - them columns moi (neu chua co)
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS trang_thai TEXT DEFAULT 'con-hang';
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS da_ban INTEGER DEFAULT 0;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS ncc TEXT;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS chat_lieu TEXT;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS luot_xem INTEGER DEFAULT 0;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS hinh_anh TEXT;

-- 2. DELETE data cu (optional - chi chay neu muon reset)
-- DELETE FROM san_pham WHERE ma_sp IN (
--   'M001','A001','A002','Q001','B001','A003','A004','B002','A005',
--   'P001','P002','B003','A006','Q002','A007','P003','B004'
-- );

-- 3. INSERT 17 san pham POLOMIMIN (dung ON CONFLICT de upsert)
INSERT INTO san_pham (
  ma_sp, ma_dm, ten_sp, loai_sp, gia_ban_du_kien, gia_von_du_kien,
  ti_le_size, bang_size, ds_mau, ghi_chu, ngay_tao,
  trang_thai, da_ban, ncc, chat_lieu, luot_xem, rating
) VALUES
-- 1. M001 - Bo trụ trơn 5 size M758 (Best seller)
(
  'M001', 'DM-BOTRU', 'Bộ trụ trơn 5 size cao cấp M758', 'BoTru', 185000, 78000,
  '1:2:2:2:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,2,1],"riSo":8}'::jsonb,
  '[{"ten":"Đen","maSKU":"M758-DEN","dinhMuc":0.62},{"ten":"Trắng","maSKU":"M758-TRA","dinhMuc":0.62},{"ten":"Xám","maSKU":"M758-XAM","dinhMuc":0.62}]'::jsonb,
  'Vải cotton 4 chiều, may 5 size chuẩn body VN',
  '2026-08-01', 'con-hang', 1240, 'Vải A Châu', 'Cotton 95%, Spandex 5%', 3420, 4.8
),
-- 2. A001 - Ao Polo Basic
(
  'A001', 'DM-AOPOLO', 'Áo Polo Basic vải cá sấu cao cấp', 'AoPolo', 120000, 52000,
  '1:2:2:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,1,0],"riSo":6}'::jsonb,
  '[{"ten":"Xanh Đen","maSKU":"A001-XDEN","dinhMuc":0.32},{"ten":"Rêu","maSKU":"A001-REU","dinhMuc":0.32},{"ten":"Đỏ Đô","maSKU":"A001-DODO","dinhMuc":0.32}]'::jsonb,
  'Vải cá sấu poly - form regular fit, phù hợp công sở',
  '2026-08-02', 'con-hang', 856, 'Dệt Phong Phú', 'Polyester 65%, Cotton 35%', 2150, 4.6
),
-- 3. A002 - Ao thun form rong
(
  'A002', 'DM-AOTRU', 'Áo thun nam nữ form rộng 5 size', 'AoTru', 85000, 38000,
  '1:2:3:2:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,3,2,1],"riSo":9}'::jsonb,
  '[{"ten":"Trắng","maSKU":"A002-TRA","dinhMuc":0.22},{"ten":"Đen","maSKU":"A002-DEN","dinhMuc":0.22},{"ten":"Vàng","maSKU":"A002-VANG","dinhMuc":0.22},{"ten":"Hồng","maSKU":"A002-HONG","dinhMuc":0.22}]'::jsonb,
  'Vải thun cotton 100%, form rộng thoải mái',
  '2026-07-28', 'con-hang', 2340, 'Vải A Châu', 'Cotton 100%', 5680, 4.7
),
-- 4. Q001 - Quan short the thao
(
  'Q001', 'DM-PHUKIEN', 'Quần short thể thao nam 5 size', 'PhuKien', 95000, 42000,
  '1:2:2:1:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,1,1],"riSo":7}'::jsonb,
  '[{"ten":"Đen","maSKU":"Q001-DEN","dinhMuc":0.28},{"ten":"Xám","maSKU":"Q001-XAM","dinhMuc":0.28}]'::jsonb,
  'Quần short thể thao, có túi khoá kéo',
  '2026-07-25', 'con-hang', 678, 'Polomimin', 'Polyester 90%, Spandex 10%', 1420, 4.5
),
-- 5. B001 - Bo do gia dinh
(
  'B001', 'DM-BOTRU', 'Bộ đồ gia đình in họa tiết 4 người', 'BoTru', 245000, 98000,
  '1:1:1:1',
  '{"sizes":["S","M","L","XL"],"ratios":[1,1,1,1],"riSo":4}'::jsonb,
  '[{"ten":"Hồng Pastel","maSKU":"B001-HONG","dinhMuc":0.85},{"ten":"Xanh Mint","maSKU":"B001-MINT","dinhMuc":0.85}]'::jsonb,
  'Set đồ gia đình 4 người, vải cotton mềm mại',
  '2026-07-30', 'con-hang', 432, 'Dệt Phong Phú', 'Cotton 100%', 1180, 4.9
),
-- 6. A003 - Ao thun tron form om
(
  'A003', 'DM-AOTRU', 'Áo thun trơn form ôm body', 'AoTru', 78000, 32000,
  '1:2:2:1:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,1,1],"riSo":7}'::jsonb,
  '[{"ten":"Đen","maSKU":"A003-DEN","dinhMuc":0.18},{"ten":"Trắng","maSKU":"A003-TRA","dinhMuc":0.18},{"ten":"Be","maSKU":"A003-BE","dinhMuc":0.18}]'::jsonb,
  'Form ôm body, vải cá sấu co giãn 4 chiều',
  '2026-07-20', 'con-hang', 1560, 'Vải A Châu', 'Cotton 95%, Spandex 5%', 3240, 4.6
),
-- 7. A004 - Ao Polo the thao
(
  'A004', 'DM-AOPOLO', 'Áo Polo thể thao nam công sở', 'AoPolo', 145000, 62000,
  '1:2:2:1:0',
  '{"sizes":["M","L","XL","2XL"],"ratios":[1,2,2,1],"riSo":6}'::jsonb,
  '[{"ten":"Xanh Navy","maSKU":"A004-NAVY","dinhMuc":0.35},{"ten":"Đen","maSKU":"A004-DEN","dinhMuc":0.35},{"ten":"Trắng","maSKU":"A004-TRA","dinhMuc":0.35}]'::jsonb,
  'Polo thể thao - vải cá sấu poly, thấm hút tốt',
  '2026-07-22', 'con-hang', 920, 'Dệt Phong Phú', 'Polyester 70%, Cotton 30%', 1980, 4.7
),
-- 8. B002 - Bo the thao 3 mau
(
  'B002', 'DM-BOTRU', 'Bộ Thể Thao Nam cao cấp 3 màu', 'BoTru', 220000, 95000,
  '1:2:2:2:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,2,1],"riSo":8}'::jsonb,
  '[{"ten":"Xám Xanh","maSKU":"B002-XAMX","dinhMuc":0.65},{"ten":"Đỏ Đen","maSKU":"B002-DODEN","dinhMuc":0.65},{"ten":"Trắng Xám","maSKU":"B002-TXAM","dinhMuc":0.65}]'::jsonb,
  'Bộ thể thao chuyên dụng, co giãn 4 chiều',
  '2026-07-18', 'con-hang', 1080, 'Polomimin', 'Polyester 88%, Spandex 12%', 2450, 4.8
),
-- 9. A005 - Ao tank top
(
  'A005', 'DM-AOTRU', 'Áo tank top nam tập gym', 'AoTru', 65000, 28000,
  '1:2:1:1',
  '{"sizes":["M","L","XL","2XL"],"ratios":[1,2,1,1],"riSo":5}'::jsonb,
  '[{"ten":"Đen","maSKU":"A005-DEN","dinhMuc":0.15},{"ten":"Trắng","maSKU":"A005-TRA","dinhMuc":0.15},{"ten":"Xám","maSKU":"A005-XAM","dinhMuc":0.15}]'::jsonb,
  'Tank top tập gym, vải thun lạnh co giãn',
  '2026-07-15', 'con-hang', 540, 'Vải A Châu', 'Polyester 92%, Spandex 8%', 980, 4.4
),
-- 10. P001 - Mũ lưỡi trai
(
  'P001', 'DM-PHUKIEN', 'Mũ lưỡi trai POLOMIMIN thêu logo', 'PhuKien', 85000, 32000,
  '1:1:1',
  '{"sizes":["Free"],"ratios":[1],"riSo":1}'::jsonb,
  '[{"ten":"Đen","maSKU":"P001-DEN","dinhMuc":0.08},{"ten":"Trắng","maSKU":"P001-TRA","dinhMuc":0.08},{"ten":"Xanh Navy","maSKU":"P001-NAVY","dinhMuc":0.08}]'::jsonb,
  'Mũ lưỡi trai thêu logo POLOMIMIN, điều chỉnh được',
  '2026-07-10', 'con-hang', 320, 'Polomimin', 'Cotton 100%', 720, 4.5
),
-- 11. P002 - Tất cổ cao combo 3 đôi
(
  'P002', 'DM-PHUKIEN', 'Tất cổ cao cotton nam nữ 3 đôi', 'PhuKien', 45000, 18000,
  '1:1:1:1',
  '{"sizes":["S","M","L","XL"],"ratios":[1,1,1,1],"riSo":4}'::jsonb,
  '[{"ten":"Đen","maSKU":"P002-DEN","dinhMuc":0.05},{"ten":"Trắng","maSKU":"P002-TRA","dinhMuc":0.05},{"ten":"Xám","maSKU":"P002-XAM","dinhMuc":0.05}]'::jsonb,
  'Combo 3 đôi tất cổ cao cotton, co giãn tốt',
  '2026-07-08', 'con-hang', 1180, 'Polomimin', 'Cotton 80%, Spandex 20%', 1850, 4.6
),
-- 12. B003 - Bo Pijama
(
  'B003', 'DM-BOTRU', 'Bộ Pijama gia đình mùa hè', 'BoTru', 195000, 82000,
  '1:1:1:1',
  '{"sizes":["S","M","L","XL"],"ratios":[1,1,1,1],"riSo":4}'::jsonb,
  '[{"ten":"Hồng Pastel","maSKU":"B003-HONG","dinhMuc":0.7},{"ten":"Xanh Mint","maSKU":"B003-MINT","dinhMuc":0.7},{"ten":"Vàng Nhạt","maSKU":"B003-VANG","dinhMuc":0.7}]'::jsonb,
  'Bộ pijama cotton nhẹ, thoáng mát mùa hè',
  '2026-06-28', 'con-hang', 245, 'Dệt Phong Phú', 'Cotton 100%', 580, 4.7
),
-- 13. A006 - Ao khoac hoodie (HET HANG)
(
  'A006', 'DM-AOTRU', 'Áo khoác hoodie form rộng unisex', 'AoTru', 185000, 82000,
  '1:2:2:1:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,1,1],"riSo":7}'::jsonb,
  '[{"ten":"Đen","maSKU":"A006-DEN","dinhMuc":0.55},{"ten":"Xám","maSKU":"A006-XAM","dinhMuc":0.55},{"ten":"Be","maSKU":"A006-BE","dinhMuc":0.55}]'::jsonb,
  'Hoodie nỉ form rộng unisex, mùa đông',
  '2026-06-15', 'het-hang', 480, 'Polomimin', 'Cotton 80%, Polyester 20%', 1120, 4.8
),
-- 14. Q002 - Quan dai kaki (SAP VE)
(
  'Q002', 'DM-PHUKIEN', 'Quần dài kaki nam công sở 5 size', 'PhuKien', 165000, 72000,
  '1:2:2:1:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,1,1],"riSo":7}'::jsonb,
  '[{"ten":"Xám","maSKU":"Q002-XAM","dinhMuc":0.55},{"ten":"Đen","maSKU":"Q002-DEN","dinhMuc":0.55},{"ten":"Be","maSKU":"Q002-BE","dinhMuc":0.55}]'::jsonb,
  'Quần kaki slimfit, 2 túi khoá kéo',
  '2026-06-12', 'sap-ve', 380, 'Vải A Châu', 'Cotton 98%, Spandex 2%', 920, 4.5
),
-- 15. A007 - Ao croptop nu
(
  'A007', 'DM-AOTRU', 'Áo thun nữ croptop form trẻ trung', 'AoTru', 72000, 30000,
  '1:2:2:1:0',
  '{"sizes":["S","M","L","XL"],"ratios":[1,2,2,1],"riSo":6}'::jsonb,
  '[{"ten":"Trắng","maSKU":"A007-TRA","dinhMuc":0.15},{"ten":"Hồng","maSKU":"A007-HONG","dinhMuc":0.15},{"ten":"Vàng","maSKU":"A007-VANG","dinhMuc":0.15},{"ten":"Đen","maSKU":"A007-DEN","dinhMuc":0.15}]'::jsonb,
  'Croptop nữ form trẻ trung, vải thun cotton mềm',
  '2026-06-08', 'con-hang', 720, 'Vải A Châu', 'Cotton 100%', 1640, 4.7
),
-- 16. P003 - Khau trang vai
(
  'P003', 'DM-PHUKIEN', 'Khẩu trang vải kháng khuẩn POLOMIMIN', 'PhuKien', 25000, 8000,
  '1:1:1',
  '{"sizes":["Free"],"ratios":[1],"riSo":1}'::jsonb,
  '[{"ten":"Đen","maSKU":"P003-DEN","dinhMuc":0.02},{"ten":"Trắng","maSKU":"P003-TRA","dinhMuc":0.02},{"ten":"Xám","maSKU":"P003-XAM","dinhMuc":0.02}]'::jsonb,
  'Khẩu trang vải 3 lớp, kháng khuẩn, có logo POLOMIMIN',
  '2026-05-20', 'con-hang', 2560, 'Polomimin', 'Cotton 100% + lớp kháng khuẩn', 4280, 4.6
),
-- 17. B004 - Bo the thao nu croptop (NGUNG KD)
(
  'B004', 'DM-BOTRU', 'Bộ thể thao nữ croptop quần short', 'BoTru', 195000, 85000,
  '1:2:2:1:1',
  '{"sizes":["S","M","L","XL","2XL"],"ratios":[1,2,2,1,1],"riSo":7}'::jsonb,
  '[{"ten":"Hồng","maSKU":"B004-HONG","dinhMuc":0.55},{"ten":"Đen","maSKU":"B004-DEN","dinhMuc":0.55},{"ten":"Tím Pastel","maSKU":"B004-TIM","dinhMuc":0.55}]'::jsonb,
  'Bộ croptop + quần short nữ, vải co giãn 4 chiều',
  '2026-05-12', 'ngung-kinh-doanh', 180, 'Polomimin', 'Polyester 88%, Spandex 12%', 420, 4.5
)
ON CONFLICT (ma_sp) DO UPDATE SET
  ten_sp = EXCLUDED.ten_sp,
  loai_sp = EXCLUDED.loai_sp,
  gia_ban_du_kien = EXCLUDED.gia_ban_du_kien,
  gia_von_du_kien = EXCLUDED.gia_von_du_kien,
  ti_le_size = EXCLUDED.ti_le_size,
  bang_size = EXCLUDED.bang_size,
  ds_mau = EXCLUDED.ds_mau,
  ghi_chu = EXCLUDED.ghi_chu,
  ngay_tao = EXCLUDED.ngay_tao,
  trang_thai = EXCLUDED.trang_thai,
  da_ban = EXCLUDED.da_ban,
  ncc = EXCLUDED.ncc,
  chat_lieu = EXCLUDED.chat_lieu,
  luot_xem = EXCLUDED.luot_xem,
  rating = EXCLUDED.rating;

-- 4. Verify
SELECT
  ma_sp,
  ten_sp,
  loai_sp,
  gia_ban_du_kien,
  trang_thai,
  da_ban,
  rating,
  ncc
FROM san_pham
ORDER BY ma_sp
LIMIT 20;

-- 5. Thong ke
SELECT
  loai_sp,
  trang_thai,
  COUNT(*) as so_luong,
  SUM(da_ban) as tong_da_ban
FROM san_pham
GROUP BY loai_sp, trang_thai
ORDER BY loai_sp, trang_thai;
