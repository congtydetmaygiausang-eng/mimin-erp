-- BƯỚC 1: Thêm cột loai_sp nếu chưa có cho các bảng để đồng bộ với Front-end
ALTER TABLE public.khsx ADD COLUMN IF NOT EXISTS loai_sp text;
ALTER TABLE public.don_hang ADD COLUMN IF NOT EXISTS loai_sp text;

-- BƯỚC 2: Hủy bỏ constraint cũ
ALTER TABLE public.lenh_cat DROP CONSTRAINT IF EXISTS lenh_cat_loai_sp_check;
ALTER TABLE public.khsx DROP CONSTRAINT IF EXISTS khsx_loai_sp_check;
ALTER TABLE public.don_hang DROP CONSTRAINT IF EXISTS don_hang_loai_sp_check;

-- BƯỚC 3: Cập nhật lại Check Constraint cho trường loai_sp (Áp dụng các mã Code mới)
ALTER TABLE public.lenh_cat ADD CONSTRAINT lenh_cat_loai_sp_check 
CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron', 'AoPolo', 'PhuKien'));

ALTER TABLE public.khsx ADD CONSTRAINT khsx_loai_sp_check 
CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron', 'AoPolo', 'PhuKien', NULL, ''));

ALTER TABLE public.don_hang ADD CONSTRAINT don_hang_loai_sp_check 
CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron', 'AoPolo', 'PhuKien', NULL, ''));

-- (Bỏ qua bảng san_pham vì bảng này đang dùng Tiếng Việt có dấu như 'Áo trụ', 'Bộ trụ'...)
