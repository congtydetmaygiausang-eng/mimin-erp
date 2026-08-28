ALTER TABLE lenh_cat DROP CONSTRAINT IF EXISTS lenh_cat_loai_sp_check;
NOTIFY pgrst, 'reload schema';
