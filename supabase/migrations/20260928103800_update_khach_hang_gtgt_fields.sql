-- Cập nhật bảng khach_hang để hỗ trợ lưu trữ thông tin GTGT và các trường mới
ALTER TABLE khach_hang ADD COLUMN IF NOT EXISTS ten_phap_nhan text;
ALTER TABLE khach_hang ADD COLUMN IF NOT EXISTS dia_chi_xuat_hd text;
ALTER TABLE khach_hang ADD COLUMN IF NOT EXISTS so_tk_ngan_hang text;

-- Cập nhật thêm các trường có thể bị thiếu (fallback trong khach-hang-store.tsx)
ALTER TABLE khach_hang ADD COLUMN IF NOT EXISTS han_muc_no int8 DEFAULT 0;
ALTER TABLE khach_hang ADD COLUMN IF NOT EXISTS facebook_url text;
ALTER TABLE khach_hang ADD COLUMN IF NOT EXISTS nhu_cau_chinh jsonb;
ALTER TABLE khach_hang ADD COLUMN IF NOT EXISTS rating int4 DEFAULT 4;
ALTER TABLE khach_hang ADD COLUMN IF NOT EXISTS ghi_nho boolean DEFAULT false;
ALTER TABLE khach_hang ADD COLUMN IF NOT EXISTS avatar_url text;
