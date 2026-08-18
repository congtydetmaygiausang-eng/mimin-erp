-- ==========================================
-- TIN NHẮN RIÊNG (MIMIN Group) - kiểu Zalo
-- Chạy script này trong Supabase > SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.bang_tin_tin_nhan_rieng (
    id TEXT PRIMARY KEY,
    nguoi_gui_name TEXT NOT NULL,
    nguoi_nhan_name TEXT NOT NULL,
    noi_dung TEXT NOT NULL,
    da_doc BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.bang_tin_tin_nhan_rieng ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bang_tin_tin_nhan_rieng_authenticated" ON public.bang_tin_tin_nhan_rieng
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

GRANT SELECT ON public.bang_tin_tin_nhan_rieng TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bang_tin_tin_nhan_rieng TO authenticated;
