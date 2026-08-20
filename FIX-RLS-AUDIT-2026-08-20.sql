-- ============================================
-- FIX RLS/GRANT phát hiện từ audit toàn hệ thống 2026-08-20
-- Chạy thủ công trên Supabase SQL Editor (Dashboard), giống các file
-- FIX-*.sql trước đó trong repo - KHÔNG tự động chạy từ code.
-- ============================================
--
-- PHẠM VI file này (đã cân nhắc rủi ro, chỉ sửa phần AN TOÀN):
--
-- 1. GRANT bảng "users" cho service_role - bị thiếu từ lúc tạo bảng
--    (APPLY-USERS-TABLE.sql không có GRANT), gây lỗi thật "permission
--    denied for table users" khi trang /quan-ly-tai-khoan gọi
--    GET /api/admin/users bằng service-role key. Phát hiện khi test trực
--    tiếp API sau khi vá lỗ hổng thiếu xác thực (xem commit xác thực
--    server-side cho API admin).
--
-- 2. Sửa policy INSERT trên bảng "users" tên là "Service role can insert"
--    nhưng KHÔNG có mệnh đề "TO service_role" - áp dụng cho MỌI role kể cả
--    anon, nghĩa là ai cầm anon key (vốn đã public) cũng INSERT được 1 dòng
--    "users" tự xưng role=admin. Lưu ý: role hiển thị trong quan-ly-tai-khoan
--    lấy từ bảng này, NHƯNG quyền hạn THẬT do code kiểm tra qua
--    app_metadata.role trong auth.users (chỉ set được qua Admin API) - nên
--    đây là rủi ro ở mức hiển thị/gây nhiễu, không phải leo quyền thật. Vẫn
--    nên vá vì tên policy đã nói rõ ý định ban đầu là service_role-only.
--
-- 3. Khôi phục policy đúng phạm vi cho 3 bảng: two_factor_configs,
--    login_attempts, custom_roles - hiện đang là "USING (true) WITH CHECK
--    (true)" (mở toang) do bị 1 migration sau (APPLY-SUPABASE-MANUAL.sql)
--    ghi đè lên policy gốc đã định nghĩa đúng trong advanced-schema.sql.
--    ĐÃ XÁC NHẬN: cả 3 bảng này KHÔNG được bất kỳ code nào trong app hiện
--    tại đọc/ghi qua Supabase client (grep toàn bộ src/ không thấy
--    .from("two_factor_configs"|"login_attempts"|"custom_roles")) - an toàn
--    tuyệt đối để siết lại, không ảnh hưởng tính năng đang chạy.
--
-- CHỦ ĐỘNG KHÔNG SỬA trong file này (để tránh làm sập tính năng đang chạy
-- thật cho người dùng):
--
-- - audit_logs: policy gốc đúng là "WITH CHECK (auth.uid() IS NOT NULL)"
--   cho INSERT - nhưng nhiều tài khoản nhân viên hiện đăng nhập qua luồng
--   "demo/fallback" (lib/users.server.ts, xác thực qua /api/auth/login mới
--   thêm) KHÔNG có phiên Supabase Auth thật, nên auth.uid() sẽ luôn NULL
--   với họ - áp policy gốc lại sẽ chặn mất tính năng ghi audit log của
--   đúng nhóm người dùng này. Đây là hệ quả của việc hệ thống có 2 luồng
--   đăng nhập song song chưa hợp nhất - cần làm cùng lúc với việc hợp nhất
--   xác thực (khuyến nghị lớn hơn, làm riêng, không phải phạm vi hôm nay).
-- - Các bảng nghiệp vụ chính (don_hang, khach_hang, nha_cung_cap, nhan_su,
--   phan_cong, kho*, bang_luong, doi_soat...) - cùng lý do trên: rất nhiều
--   thao tác đọc/ghi hiện tại đi qua anon key vì người dùng "demo" không có
--   session Supabase Auth thật. Siết RLS những bảng này NGAY BÂY GIỜ sẽ làm
--   gián đoạn vận hành thật. Cần lộ trình: (a) chuyển toàn bộ đăng nhập
--   sang Supabase Auth thật, (b) sau đó mới siết RLS theo auth.uid()/role.

-- ============================================
-- 1. GRANT bảng users cho service_role (khắc phục lỗi "permission denied")
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO service_role;

-- ============================================
-- 2. Sửa policy INSERT "users" đúng ý định ban đầu (chỉ service_role)
-- ============================================
DROP POLICY IF EXISTS "Service role can insert" ON public.users;
CREATE POLICY "Service role can insert" ON public.users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- 3a. two_factor_configs - khôi phục policy chỉ user đã đăng nhập mới đọc/sửa
-- ============================================
-- LƯU Ý: bản đầu dùng "USING (user_email = (auth.jwt() ->> 'email'))" theo
-- đúng schema advanced-schema.sql trong repo, nhưng chạy thật báo lỗi
-- "column user_email does not exist" - bảng thật trên Supabase production
-- đã KHÔNG có cột này (một lần nữa xác nhận schema production lệch khỏi
-- file SQL tracked trong repo - vấn đề đã nêu trong audit). Vì bảng này
-- không được code nào trong app đọc/ghi (đã grep xác nhận), không cần biết
-- chính xác cột nào - chỉ cần đóng lỗ hổng "USING (true)" mở cho ẩn danh,
-- dùng điều kiện không phụ thuộc cột nào: chỉ user đã đăng nhập mới thấy.
DROP POLICY IF EXISTS "Allow all public" ON public.two_factor_configs;
DROP POLICY IF EXISTS "auth_write_two_factor_configs" ON public.two_factor_configs;
DROP POLICY IF EXISTS "anon_read_two_factor_configs" ON public.two_factor_configs;
DROP POLICY IF EXISTS "user_own_2fa" ON public.two_factor_configs;
CREATE POLICY "user_own_2fa" ON public.two_factor_configs
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 3b. login_attempts - chỉ admin xem được, không cho ghi qua anon/authenticated
--     (bảng này nên được ghi bởi service-role/server-side, không phải client)
-- ============================================
DROP POLICY IF EXISTS "Allow all public" ON public.login_attempts;
DROP POLICY IF EXISTS "auth_write_login_attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "anon_read_login_attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "admin_view_login_attempts" ON public.login_attempts;
CREATE POLICY "admin_view_login_attempts" ON public.login_attempts
  FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
GRANT SELECT, INSERT, UPDATE, DELETE ON public.login_attempts TO service_role;

-- ============================================
-- 3c. custom_roles - mọi người đăng nhập thật xem được, chỉ admin sửa
-- ============================================
DROP POLICY IF EXISTS "Allow all public" ON public.custom_roles;
DROP POLICY IF EXISTS "auth_write_custom_roles" ON public.custom_roles;
DROP POLICY IF EXISTS "anon_read_custom_roles" ON public.custom_roles;
DROP POLICY IF EXISTS "all_view_custom_roles" ON public.custom_roles;
DROP POLICY IF EXISTS "admin_manage_custom_roles" ON public.custom_roles;
CREATE POLICY "all_view_custom_roles" ON public.custom_roles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_manage_custom_roles" ON public.custom_roles
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================
-- VERIFY (chạy sau khi áp dụng, đối chiếu kết quả mong đợi)
-- ============================================
-- SELECT tablename, policyname, cmd, qual FROM pg_policies
--   WHERE tablename IN ('users','two_factor_configs','login_attempts','custom_roles')
--   ORDER BY tablename, policyname;
-- Kỳ vọng: không còn policy nào có qual = 'true' cho 4 bảng trên.
