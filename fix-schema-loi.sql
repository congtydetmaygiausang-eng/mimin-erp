-- Thêm cột nguoi_phu_trach vào bảng phan_cong
ALTER TABLE public.phan_cong ADD COLUMN IF NOT EXISTS nguoi_phu_trach text;

-- Thêm cột dia_chi và items vào bảng don_hang
ALTER TABLE public.don_hang ADD COLUMN IF NOT EXISTS dia_chi text;
ALTER TABLE public.don_hang ADD COLUMN IF NOT EXISTS items jsonb;
