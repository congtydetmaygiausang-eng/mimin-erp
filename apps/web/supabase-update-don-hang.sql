-- ==============================================================================
-- SCRIPT CẬP NHẬT BẢNG don_hang (SUPABASE)
-- Phục vụ cho tính năng đồng bộ hóa luồng bán hàng mới
-- ==============================================================================

-- 1. Xóa các ràng buộc cũ không còn phù hợp với version mới
ALTER TABLE don_hang DROP CONSTRAINT IF EXISTS don_hang_loai_check;
ALTER TABLE don_hang DROP CONSTRAINT IF EXISTS don_hang_trang_thai_check;

-- 2. Thêm các cột bị thiếu vào bảng
ALTER TABLE don_hang ADD COLUMN IF NOT EXISTS dia_chi TEXT;
ALTER TABLE don_hang ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE don_hang ADD COLUMN IF NOT EXISTS loai_don TEXT;
ALTER TABLE don_hang ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE don_hang ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE don_hang ADD COLUMN IF NOT EXISTS shipping JSONB;
ALTER TABLE don_hang ADD COLUMN IF NOT EXISTS giam_gia NUMERIC DEFAULT 0;
ALTER TABLE don_hang ADD COLUMN IF NOT EXISTS kenh_ban TEXT;
ALTER TABLE don_hang ADD COLUMN IF NOT EXISTS lo_hang TEXT;
ALTER TABLE don_hang ADD COLUMN IF NOT EXISTS tien_cuoi_ky NUMERIC DEFAULT 0;
ALTER TABLE don_hang ADD COLUMN IF NOT EXISTS tong_tien NUMERIC DEFAULT 0;

-- 3. Cho phép các cột cũ được rỗng (tránh lỗi khi insert dữ liệu mới)
ALTER TABLE don_hang ALTER COLUMN loai DROP NOT NULL;
ALTER TABLE don_hang ALTER COLUMN san_pham DROP NOT NULL;
ALTER TABLE don_hang ALTER COLUMN so_luong DROP NOT NULL;
ALTER TABLE don_hang ALTER COLUMN don_gia DROP NOT NULL;
ALTER TABLE don_hang ALTER COLUMN thanh_tien DROP NOT NULL;
