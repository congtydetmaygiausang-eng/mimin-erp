-- Fix: public.users chưa từng được GRANT cho service_role (bảng này được tạo
-- ngoài migration, trước khi có convention grant/revoke trong repo). Hậu quả
-- thực tế: /api/admin/users (GET/POST/PATCH/DELETE) dùng supabaseAdmin
-- (service_role key) gọi thẳng .from("users") đều bị Postgres từ chối với
-- lỗi "permission denied for table users" (mã 42501) - kể cả khi caller đã
-- có access token admin hợp lệ. Trang "Quản lý tài khoản" ẩn lỗi GET này vì
-- có fallback về mock data khi fetch lỗi, nên chỉ lộ ra khi POST (tạo tài
-- khoản mới) - đúng như báo lỗi "Thiếu access token" mà thực chất che giấu
-- 1 lớp lỗi permission phía sau (chỉ tái hiện được sau khi token đã hợp lệ).
--
-- Chỉ grant thêm cho service_role (server-only, đã tự xác thực qua
-- requireAdmin ở tầng API - xem lib/api-auth.ts) - không đụng tới grant của
-- anon/authenticated hiện có trên bảng này.

grant select, insert, update, delete on public.users to service_role;
