-- Fix: rất nhiều bảng trong public schema KHÔNG được GRANT cho service_role
-- (phát hiện khi rà soát lại toàn hệ thống 2026-08-24) - cùng một lỗi đã sửa
-- riêng lẻ cho public.users và public.nhan_su trước đó, hoá ra là vấn đề
-- RỘNG hơn nhiều: lenh_cat, ai_search_history, ai_search_results,
-- production_discovery_candidates, production_partners,
-- production_company_profiles, production_company_registry_cache,
-- agent_usage_logs, notifications, push_subscriptions, don_hang, ncc,
-- kho_thanh_pham, san_pham... đều bị chặn với service_role (mọi API route
-- server-side dùng SUPABASE_SERVICE_ROLE_KEY gọi các bảng này sẽ lỗi
-- "permission denied for table ..." dù caller đã có access token hợp lệ).
--
-- Nguyên nhân nhiều khả năng: các bảng này được tạo thủ công ngoài migration
-- (không qua quy ước GRANT chuẩn của repo), hoặc từng có 1 lần REVOKE ALT
-- rộng mà không re-grant lại cho service_role.
--
-- Thay vì tiếp tục vá từng bảng một mỗi khi phát sinh lỗi mới (đã xảy ra 2
-- lần), grant 1 lần cho TẤT CẢ bảng hiện có trong public schema, và đặt
-- default privileges để các bảng tạo MỚI sau này tự động có quyền, không
-- lặp lại vấn đề này nữa. An toàn tuyệt đối - service_role vốn đã bypass RLS
-- theo thiết kế Supabase, GRANT này chỉ khớp lại đúng quyền vốn dĩ phải có.

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to service_role;
