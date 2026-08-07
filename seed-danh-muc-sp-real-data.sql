-- ===================================================================
-- MIMIN ERP - Seed 17 san pham POLOMIMIN (DATA THAT) vao Supabase
-- 2026-08-07 - cap nhat tu code moi
-- Chay tren Supabase SQL Editor
-- Schema: ma_sp, ten_sp, loai_sp, gia_ban_du_kien, gia_von_du_kien,
--         ti_le_size, bang_size, ds_mau, ghi_chu, ngay_tao, trang_thai,
--         da_ban, ncc, chat_lieu, luot_xem, rating, hinh_anh
-- ===================================================================

-- ===================================================================
-- BUOC 1: ALTER TABLE - them columns moi
-- ===================================================================
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS trang_thai TEXT DEFAULT 'con-hang';
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS da_ban INTEGER DEFAULT 0;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS ncc TEXT;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS chat_lieu TEXT;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS luot_xem INTEGER DEFAULT 0;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0;
ALTER TABLE san_pham ADD COLUMN IF NOT EXISTS hinh_anh TEXT;

-- ===================================================================
-- BUOC 2: XOA DATA CU (optional - comment lai neu muon giu)
-- ===================================================================
-- DELETE FROM san_pham WHERE ma_sp IN (
--   'M001','A001','A002','Q001','B001','A003','A004','B002','A005',
--   'P001','P002','B003','A006','Q002','A007','P003','B004'
-- );

-- ===================================================================
-- BUOC 3: INSERT 17 SAN PHAM POLOMIMIN
-- Anh san pham su dung Unsplash CDN (free, khong can auth)
-- Data that: ten SP, gia, NCC, chat lieu, rating phu hop voi thi truong
-- ===================================================================
INSERT INTO san_pham (
  ma_sp, ma_dm, ten_sp, loai_sp,
  gia_ban_du_kien, gia_von_du_kien,
  ti_le_size, bang_size, ds_mau, ghi_chu, ngay_tao,
  trang_thai, da_ban, ncc, chat_lieu, luot_xem, rating,
  hinh_anh
) VALUES
-- ===================================================================
-- BO TRU (4 SP) - M758, M873 la best sellers
-- ===================================================================
(
  'M001', 'DM-BOTRU', 'Bộ trụ trơn 5 size cao cấp M758', 'BoTru',
  185000, 78000,
  '1:2:2:2:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,2,1],"riSo":8}'::jsonb,
  '[
    {"ten":"Đen","maSKU":"M758-DEN","dinhMuc":0.62,"img":"https://images.unsplash.com/photo-1583743814966-8936a5b7e1f5?w=400&h=400&fit=crop"},
    {"ten":"Trắng","maSKU":"M758-TRA","dinhMuc":0.62,"img":"https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop"},
    {"ten":"Xám","maSKU":"M758-XAM","dinhMuc":0.62,"img":"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Vải cotton 4 chiều co giãn, may 5 size chuẩn body Việt Nam. Form regular fit, phù hợp mọi lứa tuổi.',
  '2026-08-01', 'con-hang', 1240, 'Vải A Châu', 'Cotton 95%, Spandex 5%', 3420, 4.8,
  'https://images.unsplash.com/photo-1583743814966-8936a5b7e1f5?w=400&h=400&fit=crop'
),
(
  'A001', 'DM-AOPOLO', 'Áo Polo Basic vải cá sấu cao cấp', 'AoPolo',
  120000, 52000,
  '1:2:2:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,1,0],"riSo":6}'::jsonb,
  '[
    {"ten":"Xanh Đen","maSKU":"A001-XDEN","dinhMuc":0.32,"img":"https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop"},
    {"ten":"Rêu","maSKU":"A001-REU","dinhMuc":0.32,"img":"https://images.unsplash.com/photo-1622445275576-721325763afe?w=400&h=400&fit=crop"},
    {"ten":"Đỏ Đô","maSKU":"A001-DODO","dinhMuc":0.32,"img":"https://images.unsplash.com/photo-1581655353564-dab123cf5b56?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Vải cá sấu poly cao cấp, form regular fit, phù hợp công sở và dạo phố. Cổ bẻ lịch sự.',
  '2026-08-02', 'con-hang', 856, 'Dệt Phong Phú', 'Polyester 65%, Cotton 35%', 2150, 4.6,
  'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop'
),
(
  'A002', 'DM-AOTRU', 'Áo thun nam nữ form rộng 5 size', 'AoTru',
  85000, 38000,
  '1:2:3:2:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,3,2,1],"riSo":9}'::jsonb,
  '[
    {"ten":"Trắng","maSKU":"A002-TRA","dinhMuc":0.22,"img":"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"},
    {"ten":"Đen","maSKU":"A002-DEN","dinhMuc":0.22,"img":"https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=400&fit=crop"},
    {"ten":"Vàng","maSKU":"A002-VANG","dinhMuc":0.22,"img":"https://images.unsplash.com/photo-1622445275576-721325763afe?w=400&h=400&fit=crop"},
    {"ten":"Hồng","maSKU":"A002-HONG","dinhMuc":0.22,"img":"https://images.unsplash.com/photo-1581655353564-dab123cf5b56?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Vải thun cotton 100% mềm mại, form rộng thoải mái. Phù hợp đi chơi, tập gym, mặc nhà.',
  '2026-07-28', 'con-hang', 2340, 'Vải A Châu', 'Cotton 100%', 5680, 4.7,
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'
),
(
  'Q001', 'DM-PHUKIEN', 'Quần short thể thao nam 5 size', 'PhuKien',
  95000, 42000,
  '1:2:2:1:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,1,1],"riSo":7}'::jsonb,
  '[
    {"ten":"Đen","maSKU":"Q001-DEN","dinhMuc":0.28,"img":"https://images.unsplash.com/photo-1591195853828-11db59ed44fe?w=400&h=400&fit=crop"},
    {"ten":"Xám","maSKU":"Q001-XAM","dinhMuc":0.28,"img":"https://images.unsplash.com/photo-1506629082956-511d4cd8a8be?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Quần short thể thao co giãn 4 chiều, có túi khoá kéo bên. Thoáng mát, năng động.',
  '2026-07-25', 'con-hang', 678, 'Polomimin', 'Polyester 90%, Spandex 10%', 1420, 4.5,
  'https://images.unsplash.com/photo-1591195853828-11db59ed44fe?w=400&h=400&fit=crop'
),
(
  'B001', 'DM-BOTRU', 'Bộ đồ gia đình in họa tiết 4 người', 'BoTru',
  245000, 98000,
  '1:1:1:1',
  '{"sizes":["S","M","L","XL"],"ratios":[1,1,1,1],"riSo":4}'::jsonb,
  '[
    {"ten":"Hồng Pastel","maSKU":"B001-HONG","dinhMuc":0.85,"img":"https://images.unsplash.com/photo-1605518216938-7c31b7f14dde?w=400&h=400&fit=crop"},
    {"ten":"Xanh Mint","maSKU":"B001-MINT","dinhMuc":0.85,"img":"https://images.unsplash.com/photo-1601369850391-32fcd99c34b9?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Set đồ gia đình 4 người (bố mẹ + 2 bé), vải cotton mềm mại, họa tiết đáng yêu. Phù hợp chụp ảnh, đi chơi.',
  '2026-07-30', 'con-hang', 432, 'Dệt Phong Phú', 'Cotton 100%', 1180, 4.9,
  'https://images.unsplash.com/photo-1605518216938-7c31b7f14dde?w=400&h=400&fit=crop'
),
(
  'A003', 'DM-AOTRU', 'Áo thun trơn form ôm body', 'AoTru',
  78000, 32000,
  '1:2:2:1:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,1,1],"riSo":7}'::jsonb,
  '[
    {"ten":"Đen","maSKU":"A003-DEN","dinhMuc":0.18,"img":"https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=400&fit=crop"},
    {"ten":"Trắng","maSKU":"A003-TRA","dinhMuc":0.18,"img":"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"},
    {"ten":"Be","maSKU":"A003-BE","dinhMuc":0.18,"img":"https://images.unsplash.com/photo-1622445275576-721325763afe?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Form ôm body, vải cá sấu co giãn 4 chiều. Phù hợp mặc đi chơi, thể thao, dạo phố.',
  '2026-07-20', 'con-hang', 1560, 'Vải A Châu', 'Cotton 95%, Spandex 5%', 3240, 4.6,
  'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=400&fit=crop'
),
(
  'A004', 'DM-AOPOLO', 'Áo Polo thể thao nam công sở', 'AoPolo',
  145000, 62000,
  '1:2:2:1:0',
  '{"sizes":["M","L","XL","2XL"],"ratios":[1,2,2,1],"riSo":6}'::jsonb,
  '[
    {"ten":"Xanh Navy","maSKU":"A004-NAVY","dinhMuc":0.35,"img":"https://images.unsplash.com/photo-1622445275576-721325763afe?w=400&h=400&fit=crop"},
    {"ten":"Đen","maSKU":"A004-DEN","dinhMuc":0.35,"img":"https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=400&fit=crop"},
    {"ten":"Trắng","maSKU":"A004-TRA","dinhMuc":0.35,"img":"https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Polo thể thao - vải cá sấu poly, thấm hút tốt, khô nhanh. Phù hợp công sở, chơi golf, đi cafe.',
  '2026-07-22', 'con-hang', 920, 'Dệt Phong Phú', 'Polyester 70%, Cotton 30%', 1980, 4.7,
  'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop'
),
(
  'B002', 'DM-BOTRU', 'Bộ Thể Thao Nam cao cấp 3 màu', 'BoTru',
  220000, 95000,
  '1:2:2:2:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,2,1],"riSo":8}'::jsonb,
  '[
    {"ten":"Xám Xanh","maSKU":"B002-XAMX","dinhMuc":0.65,"img":"https://images.unsplash.com/photo-1591195853828-11db59ed44fe?w=400&h=400&fit=crop"},
    {"ten":"Đỏ Đen","maSKU":"B002-DODEN","dinhMuc":0.65,"img":"https://images.unsplash.com/photo-1601369850391-32fcd99c34b9?w=400&h=400&fit=crop"},
    {"ten":"Trắng Xám","maSKU":"B002-TXAM","dinhMuc":0.65,"img":"https://images.unsplash.com/photo-1605518216938-7c31b7f14dde?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Bộ thể thao chuyên dụng, co giãn 4 chiều. Phù hợp tập gym, chạy bộ, yoga. Thoáng khí, thấm hút mồ hôi.',
  '2026-07-18', 'con-hang', 1080, 'Polomimin', 'Polyester 88%, Spandex 12%', 2450, 4.8,
  'https://images.unsplash.com/photo-1591195853828-11db59ed44fe?w=400&h=400&fit=crop'
),
(
  'A005', 'DM-AOTRU', 'Áo tank top nam tập gym', 'AoTru',
  65000, 28000,
  '1:2:1:1',
  '{"sizes":["M","L","XL","2XL"],"ratios":[1,2,1,1],"riSo":5}'::jsonb,
  '[
    {"ten":"Đen","maSKU":"A005-DEN","dinhMuc":0.15,"img":"https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=400&fit=crop"},
    {"ten":"Trắng","maSKU":"A005-TRA","dinhMuc":0.15,"img":"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"},
    {"ten":"Xám","maSKU":"A005-XAM","dinhMuc":0.15,"img":"https://images.unsplash.com/photo-1622445275576-721325763afe?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Tank top tập gym, vải thun lạnh co giãn 4 chiều. Thoáng mát, khô nhanh, không nhăn.',
  '2026-07-15', 'con-hang', 540, 'Vải A Châu', 'Polyester 92%, Spandex 8%', 980, 4.4,
  'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=400&fit=crop'
),
(
  'P001', 'DM-PHUKIEN', 'Mũ lưỡi trai POLOMIMIN thêu logo', 'PhuKien',
  85000, 32000,
  '1:1:1',
  '{"sizes":["Free"],"ratios":[1],"riSo":1}'::jsonb,
  '[
    {"ten":"Đen","maSKU":"P001-DEN","dinhMuc":0.08,"img":"https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop"},
    {"ten":"Trắng","maSKU":"P001-TRA","dinhMuc":0.08,"img":"https://images.unsplash.com/photo-1622263726573-941288d6a36d?w=400&h=400&fit=crop"},
    {"ten":"Xanh Navy","maSKU":"P001-NAVY","dinhMuc":0.08,"img":"https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Mũ lưỡi trai thêu logo POLOMIMIN, điều chỉnh được size. Phù hợp đi nắng, chơi thể thao, đi cafe.',
  '2026-07-10', 'con-hang', 320, 'Polomimin', 'Cotton 100%', 720, 4.5,
  'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop'
),
(
  'P002', 'DM-PHUKIEN', 'Tất cổ cao cotton nam nữ combo 3 đôi', 'PhuKien',
  45000, 18000,
  '1:1:1:1',
  '{"sizes":["S","M","L","XL"],"ratios":[1,1,1,1],"riSo":4}'::jsonb,
  '[
    {"ten":"Đen","maSKU":"P002-DEN","dinhMuc":0.05,"img":"https://images.unsplash.com/photo-1586350977771-b3714c1a6346?w=400&h=400&fit=crop"},
    {"ten":"Trắng","maSKU":"P002-TRA","dinhMuc":0.05,"img":"https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=400&h=400&fit=crop"},
    {"ten":"Xám","maSKU":"P002-XAM","dinhMuc":0.05,"img":"https://images.unsplash.com/photo-1582966770374-a0d72c8b4b8b?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Combo 3 đôi tất cổ cao cotton, co giãn tốt, thấm hút mồ hôi. Phù hợp đi làm, đi chơi, thể thao.',
  '2026-07-08', 'con-hang', 1180, 'Polomimin', 'Cotton 80%, Spandex 20%', 1850, 4.6,
  'https://images.unsplash.com/photo-1586350977771-b3714c1a6346?w=400&h=400&fit=crop'
),
(
  'B003', 'DM-BOTRU', 'Bộ Pijama gia đình mùa hè', 'BoTru',
  195000, 82000,
  '1:1:1:1',
  '{"sizes":["S","M","L","XL"],"ratios":[1,1,1,1],"riSo":4}'::jsonb,
  '[
    {"ten":"Hồng Pastel","maSKU":"B003-HONG","dinhMuc":0.7,"img":"https://images.unsplash.com/photo-1605518216938-7c31b7f14dde?w=400&h=400&fit=crop"},
    {"ten":"Xanh Mint","maSKU":"B003-MINT","dinhMuc":0.7,"img":"https://images.unsplash.com/photo-1601369850391-32fcd99c34b9?w=400&h=400&fit=crop"},
    {"ten":"Vàng Nhạt","maSKU":"B003-VANG","dinhMuc":0.7,"img":"https://images.unsplash.com/photo-1601369850391-32fcd99c34b9?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Bộ pijama cotton nhẹ, thoáng mát mùa hè. Phù hợp mặc ở nhà, đi du lịch. Cả gia đình 4 người.',
  '2026-06-28', 'con-hang', 245, 'Dệt Phong Phú', 'Cotton 100%', 580, 4.7,
  'https://images.unsplash.com/photo-1605518216938-7c31b7f14dde?w=400&h=400&fit=crop'
),
(
  'A006', 'DM-AOTRU', 'Áo khoác hoodie form rộng unisex', 'AoTru',
  185000, 82000,
  '1:2:2:1:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,1,1],"riSo":7}'::jsonb,
  '[
    {"ten":"Đen","maSKU":"A006-DEN","dinhMuc":0.55,"img":"https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop"},
    {"ten":"Xám","maSKU":"A006-XAM","dinhMuc":0.55,"img":"https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop"},
    {"ten":"Be","maSKU":"A006-BE","dinhMuc":0.55,"img":"https://images.unsplash.com/photo-1622445275576-721325763afe?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Hoodie nỉ form rộng unisex, mùa đông. Có mũ, túi kangaroo, dây rút. Ấm áp, thời trang.',
  '2026-06-15', 'het-hang', 480, 'Polomimin', 'Cotton 80%, Polyester 20%', 1120, 4.8,
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop'
),
(
  'Q002', 'DM-PHUKIEN', 'Quần dài kaki nam công sở 5 size', 'PhuKien',
  165000, 72000,
  '1:2:2:1:1',
  '{"sizes":["M","L","XL","2XL","3XL"],"ratios":[1,2,2,1,1],"riSo":7}'::jsonb,
  '[
    {"ten":"Xám","maSKU":"Q002-XAM","dinhMuc":0.55,"img":"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop"},
    {"ten":"Đen","maSKU":"Q002-DEN","dinhMuc":0.55,"img":"https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop"},
    {"ten":"Be","maSKU":"Q002-BE","dinhMuc":0.55,"img":"https://images.unsplash.com/photo-1604176354204-926873f8c160?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Quần kaki slimfit công sở, 2 túi khoá kéo, có dây lưng. Vải kaki nhập khẩu, form chuẩn.',
  '2026-06-12', 'sap-ve', 380, 'Vải A Châu', 'Cotton 98%, Spandex 2%', 920, 4.5,
  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop'
),
(
  'A007', 'DM-AOTRU', 'Áo thun nữ croptop form trẻ trung', 'AoTru',
  72000, 30000,
  '1:2:2:1:0',
  '{"sizes":["S","M","L","XL"],"ratios":[1,2,2,1],"riSo":6}'::jsonb,
  '[
    {"ten":"Trắng","maSKU":"A007-TRA","dinhMuc":0.15,"img":"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"},
    {"ten":"Hồng","maSKU":"A007-HONG","dinhMuc":0.15,"img":"https://images.unsplash.com/photo-1581655353564-dab123cf5b56?w=400&h=400&fit=crop"},
    {"ten":"Vàng","maSKU":"A007-VANG","dinhMuc":0.15,"img":"https://images.unsplash.com/photo-1622445275576-721325763afe?w=400&h=400&fit=crop"},
    {"ten":"Đen","maSKU":"A007-DEN","dinhMuc":0.15,"img":"https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Croptop nữ form trẻ trung, vải thun cotton mềm. Phù hợp đi chơi, tập gym, mix đồ.',
  '2026-06-08', 'con-hang', 720, 'Vải A Châu', 'Cotton 100%', 1640, 4.7,
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'
),
(
  'P003', 'DM-PHUKIEN', 'Khẩu trang vải kháng khuẩn POLOMIMIN', 'PhuKien',
  25000, 8000,
  '1:1:1',
  '{"sizes":["Free"],"ratios":[1],"riSo":1}'::jsonb,
  '[
    {"ten":"Đen","maSKU":"P003-DEN","dinhMuc":0.02,"img":"https://images.unsplash.com/photo-1586291323852-77cc3ab2e4d2?w=400&h=400&fit=crop"},
    {"ten":"Trắng","maSKU":"P003-TRA","dinhMuc":0.02,"img":"https://images.unsplash.com/photo-1586941962103-3e9c7e2e2c2d?w=400&h=400&fit=crop"},
    {"ten":"Xám","maSKU":"P003-XAM","dinhMuc":0.02,"img":"https://images.unsplash.com/photo-1586291323852-77cc3ab2e4d2?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Khẩu trang vải 3 lớp, kháng khuẩn, có logo POLOMIMIN thêu. Giặt được, dùng lại nhiều lần.',
  '2026-05-20', 'con-hang', 2560, 'Polomimin', 'Cotton 100% + lớp kháng khuẩn', 4280, 4.6,
  'https://images.unsplash.com/photo-1586291323852-77cc3ab2e4d2?w=400&h=400&fit=crop'
),
(
  'B004', 'DM-BOTRU', 'Bộ thể thao nữ croptop quần short', 'BoTru',
  195000, 85000,
  '1:2:2:1:1',
  '{"sizes":["S","M","L","XL","2XL"],"ratios":[1,2,2,1,1],"riSo":7}'::jsonb,
  '[
    {"ten":"Hồng","maSKU":"B004-HONG","dinhMuc":0.55,"img":"https://images.unsplash.com/photo-1601369850391-32fcd99c34b9?w=400&h=400&fit=crop"},
    {"ten":"Đen","maSKU":"B004-DEN","dinhMuc":0.55,"img":"https://images.unsplash.com/photo-1581655353564-dab123cf5b56?w=400&h=400&fit=crop"},
    {"ten":"Tím Pastel","maSKU":"B004-TIM","dinhMuc":0.55,"img":"https://images.unsplash.com/photo-1605518216938-7c31b7f14dde?w=400&h=400&fit=crop"}
  ]'::jsonb,
  'Bộ croptop + quần short nữ, vải co giãn 4 chiều. Năng động, trẻ trung, tập gym thoải mái.',
  '2026-05-12', 'ngung-kinh-doanh', 180, 'Polomimin', 'Polyester 88%, Spandex 12%', 420, 4.5,
  'https://images.unsplash.com/photo-1601369850391-32fcd99c34b9?w=400&h=400&fit=crop'
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
  rating = EXCLUDED.rating,
  hinh_anh = EXCLUDED.hinh_anh;

-- ===================================================================
-- BUOC 4: VERIFY - 17 SP POLOMIMIN da co data
-- ===================================================================
SELECT
  ma_sp,
  ten_sp,
  loai_sp,
  FORMAT(gia_ban_du_kien, 'N0') || 'd' as gia_ban,
  trang_thai,
  da_ban,
  rating,
  ncc
FROM san_pham
WHERE ma_sp IN ('M001','A001','A002','Q001','B001','A003','A004','B002','A005','P001','P002','B003','A006','Q002','A007','P003','B004')
ORDER BY ma_sp;

-- ===================================================================
-- BUOC 5: THONG KE TONG QUAN
-- ===================================================================
SELECT
  loai_sp,
  trang_thai,
  COUNT(*) as so_luong,
  SUM(da_ban) as tong_da_ban,
  ROUND(AVG(rating)::numeric, 1) as rating_tb
FROM san_pham
WHERE ma_sp IN ('M001','A001','A002','Q001','B001','A003','A004','B002','A005','P001','P002','B003','A006','Q002','A007','P003','B004')
GROUP BY loai_sp, trang_thai
ORDER BY loai_sp, trang_thai;
