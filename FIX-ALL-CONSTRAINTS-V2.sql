-- Thêm cột loai_sp nếu chưa có cho các bảng để đồng bộ với Front-end
ALTER TABLE public.khsx ADD COLUMN IF NOT EXISTS loai_sp text;
ALTER TABLE public.don_hang ADD COLUMN IF NOT EXISTS loai_sp text;
ALTER TABLE public.san_pham ADD COLUMN IF NOT EXISTS loai_sp text;

-- Hủy bỏ constraint trên lenh_cat (nếu chưa chạy thành công)
ALTER TABLE public.lenh_cat DROP CONSTRAINT IF EXISTS lenh_cat_loai_sp_check;

-- Cập nhật lại Check Constraint cho trường loai_sp trong bảng lenh_cat
ALTER TABLE public.lenh_cat ADD CONSTRAINT lenh_cat_loai_sp_check 
CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron', 'AoPolo', 'PhuKien'));

-- Hủy và tạo constraint trên khsx
ALTER TABLE public.khsx DROP CONSTRAINT IF EXISTS khsx_loai_sp_check;
ALTER TABLE public.khsx ADD CONSTRAINT khsx_loai_sp_check 
CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron', 'AoPolo', 'PhuKien'));

-- Hủy và tạo constraint trên don_hang
ALTER TABLE public.don_hang DROP CONSTRAINT IF EXISTS don_hang_loai_sp_check;
ALTER TABLE public.don_hang ADD CONSTRAINT don_hang_loai_sp_check 
CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron', 'AoPolo', 'PhuKien'));

-- Hủy và tạo constraint trên san_pham
ALTER TABLE public.san_pham DROP CONSTRAINT IF EXISTS san_pham_loai_sp_check;
ALTER TABLE public.san_pham ADD CONSTRAINT san_pham_loai_sp_check 
CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron', 'AoPolo', 'PhuKien'));
