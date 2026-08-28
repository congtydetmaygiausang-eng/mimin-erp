-- Hủy bỏ constraint trên lenh_cat (nếu chưa chạy)
ALTER TABLE public.lenh_cat DROP CONSTRAINT IF EXISTS lenh_cat_loai_sp_check;

-- Cập nhật lại Check Constraint cho trường loai_sp trong bảng lenh_cat
ALTER TABLE public.lenh_cat ADD CONSTRAINT lenh_cat_loai_sp_check 
CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron', 'AoPolo', 'PhuKien'));


-- ĐẶC BIỆT: Hủy bỏ constraint trên bảng khsx (ĐÂY CHÍNH LÀ NGUYÊN NHÂN LÀM MẤT DỮ LIỆU KHI F5)
ALTER TABLE public.khsx DROP CONSTRAINT IF EXISTS khsx_loai_sp_check;

-- Cập nhật lại Check Constraint cho trường loai_sp trong bảng khsx
ALTER TABLE public.khsx ADD CONSTRAINT khsx_loai_sp_check 
CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron', 'AoPolo', 'PhuKien'));

-- Hủy bỏ cả constraint trong bảng don_hang (đề phòng lỗi tương tự)
ALTER TABLE public.don_hang DROP CONSTRAINT IF EXISTS don_hang_loai_sp_check;
ALTER TABLE public.don_hang ADD CONSTRAINT don_hang_loai_sp_check 
CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron', 'AoPolo', 'PhuKien'));

-- Hủy bỏ constraint trong bảng san_pham (đề phòng lỗi tương tự)
ALTER TABLE public.san_pham DROP CONSTRAINT IF EXISTS san_pham_loai_sp_check;
ALTER TABLE public.san_pham ADD CONSTRAINT san_pham_loai_sp_check 
CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron', 'AoPolo', 'PhuKien'));
