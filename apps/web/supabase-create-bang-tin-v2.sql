-- ==========================================
-- NÂNG CẤP BẢNG TIN: video (≤3 phút), thông báo khi được thích
-- Chạy script này trong Supabase > SQL Editor (sau khi đã chạy
-- supabase-create-bang-tin.sql)
-- ==========================================

-- 1. Thêm cột video cho bài đăng (video lưu ở Supabase Storage, chỉ lưu URL)
ALTER TABLE public.bang_tin_bai_dang ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. Bảng thông báo (khi có người thích/bình luận bài của mình)
CREATE TABLE IF NOT EXISTS public.bang_tin_thong_bao (
    id TEXT PRIMARY KEY,
    nguoi_nhan_name TEXT NOT NULL,
    nguoi_gui_name TEXT NOT NULL,
    loai TEXT NOT NULL, -- 'thich' | 'binh_luan'
    bai_dang_id TEXT REFERENCES public.bang_tin_bai_dang(id) ON DELETE CASCADE,
    noi_dung TEXT,
    da_doc BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.bang_tin_thong_bao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bang_tin_thong_bao_authenticated" ON public.bang_tin_thong_bao
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

GRANT SELECT ON public.bang_tin_thong_bao TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bang_tin_thong_bao TO authenticated;

-- 3. Bucket lưu video bảng tin (public để phát video trực tiếp qua URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('bang-tin-video', 'bang-tin-video', true)
ON CONFLICT (id) DO NOTHING;
