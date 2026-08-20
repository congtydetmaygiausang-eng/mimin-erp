-- ============================================
-- FIX GRANT service_role cho 4 bảng nghiệp vụ - 2026-08-20
-- Chạy thủ công trên Supabase SQL Editor (Dashboard), giống các file
-- FIX-*.sql trước đó trong repo - KHÔNG tự động chạy từ code.
-- ============================================
--
-- BỐI CẢNH: đang nối agent AI (Lan/Hà/Vy/MIMIN Help...) đọc dữ liệu THẬT
-- qua supabaseAdmin (service-role key, server-side trong ai-tools.ts) thay
-- vì snapshot Excel tĩnh 2026-07-23. Test trực tiếp phát hiện service_role
-- bị Postgres từ chối thẳng ở tầng GRANT (không phải RLS - service_role có
-- BYPASSRLS mặc định trên Supabase, RLS không phải nguyên nhân):
--
--   permission denied for table giao_dich_kho
--   permission denied for table nhan_su
--   permission denied for table phan_cong
--   permission denied for table nha_cung_cap
--
-- Giống hệt lỗi "permission denied for table users" đã vá trong
-- FIX-RLS-AUDIT-2026-08-20.sql mục 1: 4 bảng này được tạo bằng SQL Editor
-- thủ công (00-create-bang-kho.sql, 01-create-bang-giao-dich-kho.sql,
-- 02-create-bang-phan-cong.sql...) không có dòng GRANT cho service_role.
--
-- AN TOÀN: chỉ thêm GRANT SELECT (đọc, đủ cho agent AI tra cứu) cho
-- service_role - KHÔNG đụng tới RLS policy hiện có của anon/authenticated,
-- nên không ảnh hưởng luồng đọc/ghi hiện tại của UI (kho-vai-tinhmann,
-- nhan-su, cong-no, doi-soat-tien-cong...) vẫn đang dùng anon key.
-- ============================================

GRANT SELECT ON public.giao_dich_kho TO service_role;
GRANT SELECT ON public.nhan_su TO service_role;
GRANT SELECT ON public.phan_cong TO service_role;
GRANT SELECT ON public.nha_cung_cap TO service_role;

-- ============================================
-- VERIFY (chạy sau khi áp dụng)
-- ============================================
-- SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants
--   WHERE table_schema = 'public'
--     AND table_name IN ('giao_dich_kho','nhan_su','phan_cong','nha_cung_cap')
--     AND grantee = 'service_role'
--   ORDER BY table_name;
-- Kỳ vọng: mỗi bảng có ít nhất 1 dòng grantee=service_role, privilege_type=SELECT.
