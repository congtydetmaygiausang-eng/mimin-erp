-- ===================================================================
-- Fix RLS permissions cho 5 bảng chính
-- Lỗi: "permission denied for table ..." (401 khi dùng publishable key)
-- Ngày: 2026-08-06
-- Người tạo: Mavis (mavis-agent)
-- Apply: Paste vào Supabase Dashboard > SQL Editor > Run
-- ===================================================================

-- PHẦN 1: Verify RLS + policies hiện tại (đã chạy, kết quả ở dưới)
-- SELECT schemaname, tablename, rowsecurity,
--   (SELECT array_agg(policyname) FROM pg_policies WHERE tablename = t.tablename) AS policies
-- FROM pg_tables t
-- WHERE schemaname = 'public'
--   AND tablename IN ('cong_nhan_gia_cong', 'lenh_cat', 'san_pham', 'nhan_su', 'cong_no')
-- ORDER BY tablename;
-- Kết quả: Tất cả 5 bảng có RLS=true, chỉ có 1 policy "Allow all for authenticated" → anon bị block.

-- PHẦN 2: Thêm policy cho phép anon (publishable key) đọc 5 bảng
-- Đây là FIX chính - chạy đoạn này:
CREATE POLICY "Allow read for anon" ON public.cong_nhan_gia_cong FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read for anon" ON public.cong_no              FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read for anon" ON public.lenh_cat             FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read for anon" ON public.nhan_su              FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read for anon" ON public.san_pham             FOR SELECT TO anon USING (true);

-- PHẦN 3: Nếu muốn user thật (authenticated) được INSERT/UPDATE/DELETE thì bật thêm:
/*
GRANT INSERT, UPDATE, DELETE ON public.cong_nhan_gia_cong TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lenh_cat             TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.san_pham             TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.nhan_su              TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cong_no              TO authenticated;
*/

-- ===================================================================
-- Verify sau khi apply: chạy script check-supabase.cjs, status phải 200
-- Hoặc truy cập https://mimin-9tjkzr8mr-mimin-erp.vercel.app, F5 xem console
-- ===================================================================
