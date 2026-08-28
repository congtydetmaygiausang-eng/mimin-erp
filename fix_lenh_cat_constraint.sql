-- Cập nhật lại Check Constraint cho trường loai_sp trong bảng lenh_cat
-- Để hỗ trợ đầy đủ các loại sản phẩm mới (Bộ trụ, Bộ cổ tròn, Áo trụ, Áo cổ tròn, Áo polo, Phụ kiện)

ALTER TABLE public.lenh_cat DROP CONSTRAINT IF EXISTS lenh_cat_loai_sp_check;

ALTER TABLE public.lenh_cat ADD CONSTRAINT lenh_cat_loai_sp_check 
CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron', 'AoPolo', 'PhuKien'));

-- Kiểm tra lại
-- Lỗi "violates check constraint lenh_cat_loai_sp_check" sẽ được khắc phục sau khi chạy script này.
