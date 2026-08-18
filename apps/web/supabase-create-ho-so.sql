-- ==========================================
-- HỒ SƠ CÁ NHÂN: ảnh bìa (MIMIN Group)
-- Chạy script này trong Supabase > SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.bang_tin_ho_so (
    id TEXT PRIMARY KEY, -- dùng tên người dùng làm khoá, nhất quán với created_by_name ở các bảng bảng tin khác
    anh_bia TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.bang_tin_ho_so ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bang_tin_ho_so_authenticated" ON public.bang_tin_ho_so
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

GRANT SELECT ON public.bang_tin_ho_so TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bang_tin_ho_so TO authenticated;
