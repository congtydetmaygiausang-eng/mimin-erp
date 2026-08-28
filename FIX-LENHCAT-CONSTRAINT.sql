ALTER TABLE lenh_cat DROP CONSTRAINT IF EXISTS lenh_cat_loai_sp_check;
ALTER TABLE lenh_cat ADD CONSTRAINT lenh_cat_loai_sp_check CHECK (loai_sp IN ('AoTru', 'AoCoTron', 'BoTru', 'BoCoTron', 'AoPolo', 'PhuKien'));
