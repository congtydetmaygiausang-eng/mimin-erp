-- ==========================================
-- SCRIPT TẠO BẢNG CHO "BẢNG TIN ỨNG DỤNG" (MIMIN Group)
-- Chạy script này trong Supabase > SQL Editor
-- ==========================================

-- 1. Bảng bài đăng
CREATE TABLE IF NOT EXISTS public.bang_tin_bai_dang (
    id TEXT PRIMARY KEY,
    noi_dung TEXT NOT NULL DEFAULT '',
    hinh_anh JSONB DEFAULT '[]'::jsonb,
    ghim BOOLEAN DEFAULT false,
    created_by_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Bảng bình luận
CREATE TABLE IF NOT EXISTS public.bang_tin_binh_luan (
    id TEXT PRIMARY KEY,
    bai_dang_id TEXT NOT NULL REFERENCES public.bang_tin_bai_dang(id) ON DELETE CASCADE,
    noi_dung TEXT NOT NULL,
    created_by_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Bảng lượt thích (1 người thích 1 lần / 1 bài)
CREATE TABLE IF NOT EXISTS public.bang_tin_luot_thich (
    id TEXT PRIMARY KEY,
    bai_dang_id TEXT NOT NULL REFERENCES public.bang_tin_bai_dang(id) ON DELETE CASCADE,
    created_by_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(bai_dang_id, created_by_name)
);

-- Bật RLS
ALTER TABLE public.bang_tin_bai_dang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bang_tin_binh_luan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bang_tin_luot_thich ENABLE ROW LEVEL SECURITY;

-- Cho phép user đã đăng nhập đọc/ghi (giống các bảng khác trong app)
CREATE POLICY "bang_tin_bai_dang_authenticated" ON public.bang_tin_bai_dang
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "bang_tin_binh_luan_authenticated" ON public.bang_tin_binh_luan
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "bang_tin_luot_thich_authenticated" ON public.bang_tin_luot_thich
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- QUAN TRỌNG: cấp quyền GRANT (bài học từ lần tạo bảng so_do_chien_luoc / cong_thuc_dinh_muc
-- trước đây - thiếu bước này thì PostgREST trả về lỗi "permission denied" dù RLS đã đúng)
GRANT SELECT ON public.bang_tin_bai_dang TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bang_tin_bai_dang TO authenticated;

GRANT SELECT ON public.bang_tin_binh_luan TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bang_tin_binh_luan TO authenticated;

GRANT SELECT ON public.bang_tin_luot_thich TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bang_tin_luot_thich TO authenticated;
