-- Chạy đoạn script này trên Supabase SQL Editor để thêm các cột mới
-- giúp fix lỗi "Could not find the 'phu_trach_so_do' column of 'lenh_cat' in the schema cache"

ALTER TABLE public.lenh_cat 
ADD COLUMN IF NOT EXISTS phu_trach_so_do TEXT,
ADD COLUMN IF NOT EXISTS tong_sl_thuc_te_ao INTEGER,
ADD COLUMN IF NOT EXISTS tong_sl_thuc_te_quan INTEGER;

-- Chạy lệnh sau để làm mới schema cache của Supabase
NOTIFY pgrst, 'reload schema';
