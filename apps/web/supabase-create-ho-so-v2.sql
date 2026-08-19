-- ==========================================
-- HỒ SƠ CÁ NHÂN: thêm ảnh đại diện (avatar)
-- Chạy script này trong Supabase > SQL Editor
-- ==========================================

ALTER TABLE public.bang_tin_ho_so ADD COLUMN IF NOT EXISTS anh_dai_dien TEXT;
