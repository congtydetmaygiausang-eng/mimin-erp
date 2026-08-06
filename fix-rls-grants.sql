-- ===================================================================
-- Fix RLS permissions cho 5 bảng chính
-- Lỗi: "permission denied for table ..." (401 khi dùng publishable key)
-- Ngày: 2026-08-06
-- Người tạo: Mavis (mavis-agent)
-- Apply: Paste vào Supabase Dashboard > SQL Editor > Run
-- ===================================================================

-- 1. Grant SELECT cho anon + authenticated (cho publishable key + user login)
GRANT SELECT ON public.cong_nhan_gia_cong TO anon, authenticated;
GRANT SELECT ON public.lenh_cat             TO anon, authenticated;
GRANT SELECT ON public.san_pham             TO anon, authenticated;
GRANT SELECT ON public.nhan_su              TO anon, authenticated;
GRANT SELECT ON public.cong_no              TO anon, authenticated;

-- 2. Nếu bảng có INSERT/UPDATE/DELETE cần cho user thật, bật thêm:
GRANT INSERT, UPDATE, DELETE ON public.cong_nhan_gia_cong TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lenh_cat             TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.san_pham             TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.nhan_su              TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cong_no              TO authenticated;

-- 3. Nếu RLS đang ON nhưng KHÔNG có policy "USING (true)" thì cần tạo policy.
-- Chạy query này để xem RLS + policies hiện tại:
SELECT
  schemaname, tablename, rowsecurity,
  (SELECT array_agg(policyname) FROM pg_policies WHERE tablename = t.tablename) AS policies
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN ('cong_nhan_gia_cong', 'lenh_cat', 'san_pham', 'nhan_su', 'cong_no')
ORDER BY tablename;

-- 4. Nếu rowsecurity = true mà policies rỗng, cần tạo policy:
/*
ALTER TABLE public.cong_nhan_gia_cong ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read" ON public.cong_nhan_gia_cong;
CREATE POLICY "allow_read" ON public.cong_nhan_gia_cong FOR SELECT TO anon, authenticated USING (true);
-- Lặp lại cho 4 bảng còn lại
*/

-- ===================================================================
-- Verify sau khi apply: chạy script check-supabase.cjs, status phải 200
-- ===================================================================
