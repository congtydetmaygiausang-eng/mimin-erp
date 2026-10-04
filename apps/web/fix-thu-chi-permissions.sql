-- ==============================================================================
-- FIX NHANH LỖI 42501 (permission denied for table thu_chi_noi_bo) TRÊN SUPABASE
-- Chạy trên Supabase Dashboard > SQL Editor:
-- https://supabase.com/dashboard/project/ejcuqyaiwabfygyesvxj/sql/new
-- ==============================================================================

-- 1. Cấp quyền thực thi bảng cho anon (web client), authenticated và service_role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.thu_chi_noi_bo TO anon, authenticated, service_role;

-- 2. Đảm bảo RLS cho phép anon và authenticated đọc, thêm, sửa, xoá
ALTER TABLE public.thu_chi_noi_bo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated and anon users on thu_chi_noi_bo" ON public.thu_chi_noi_bo;
DROP POLICY IF EXISTS "Allow all for anon and authenticated on thu_chi_noi_bo" ON public.thu_chi_noi_bo;

CREATE POLICY "Allow all for anon and authenticated on thu_chi_noi_bo"
ON public.thu_chi_noi_bo
FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);
