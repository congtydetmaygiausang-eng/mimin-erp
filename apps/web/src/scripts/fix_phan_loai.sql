-- Update script to normalize 'phan_loai' column in 'kho_thanh_pham' table
-- This replaces legacy Vietnamese string labels with the standard internal keys

UPDATE kho_thanh_pham
SET phan_loai = 'AoPolo'
WHERE phan_loai ILIKE '%áo polo%' OR phan_loai ILIKE '%ao polo%';

UPDATE kho_thanh_pham
SET phan_loai = 'BoTru'
WHERE phan_loai ILIKE '%bộ polo%' OR phan_loai ILIKE '%bo polo%' OR phan_loai ILIKE '%bộ trụ%' OR phan_loai ILIKE '%bo tru%';

UPDATE kho_thanh_pham
SET phan_loai = 'AoTru'
WHERE phan_loai ILIKE '%áo trụ%' OR phan_loai ILIKE '%ao tru%' OR phan_loai ILIKE '%cổ trụ%' OR phan_loai ILIKE '%co tru%';

UPDATE kho_thanh_pham
SET phan_loai = 'BoCoTron'
WHERE phan_loai ILIKE '%bộ tròn%' OR phan_loai ILIKE '%bộ cổ tròn%' OR phan_loai ILIKE '%bo tron%' OR phan_loai ILIKE '%bo co tron%';

UPDATE kho_thanh_pham
SET phan_loai = 'AoCoTron'
WHERE phan_loai ILIKE '%áo tròn%' OR phan_loai ILIKE '%áo cổ tròn%' OR phan_loai ILIKE '%cổ tròn%' OR phan_loai ILIKE '%co tron%' OR phan_loai ILIKE '%áo thun%' OR phan_loai ILIKE '%áo%' OR phan_loai ILIKE '%ao%';

UPDATE kho_thanh_pham
SET phan_loai = 'PhuKien'
WHERE phan_loai ILIKE '%phụ kiện%' OR phan_loai ILIKE '%quần%' OR phan_loai ILIKE '%quan%';
