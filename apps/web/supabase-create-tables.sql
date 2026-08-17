-- ==========================================
-- SCRIPT TẠO BẢNG CHO CÔNG THỨC ĐỊNH MỨC & SƠ ĐỒ CHIẾN LƯỢC
-- Chạy script này trong Supabase > SQL Editor
-- ==========================================

-- 1. Bảng Công thức định mức
CREATE TABLE IF NOT EXISTS public.cong_thuc_dinh_muc (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Bật RLS (Row Level Security) cho bảng cong_thuc_dinh_muc
ALTER TABLE public.cong_thuc_dinh_muc ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả user đã đăng nhập đọc/ghi
CREATE POLICY "Cho phép user đọc cong_thuc_dinh_muc" ON public.cong_thuc_dinh_muc
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Cho phép user thêm/sửa cong_thuc_dinh_muc" ON public.cong_thuc_dinh_muc
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 2. Bảng Sơ đồ chiến lược
CREATE TABLE IF NOT EXISTS public.so_do_chien_luoc (
    id TEXT PRIMARY KEY, -- Sử dụng TEXT vì frontend đang dùng Date.now().toString() hoặc uuid chuỗi
    name TEXT NOT NULL,
    nodes JSONB DEFAULT '[]'::jsonb,
    edges JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Bật RLS cho bảng so_do_chien_luoc
ALTER TABLE public.so_do_chien_luoc ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả user đã đăng nhập đọc/ghi
CREATE POLICY "Cho phép user đọc so_do_chien_luoc" ON public.so_do_chien_luoc
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Cho phép user thêm/sửa so_do_chien_luoc" ON public.so_do_chien_luoc
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
