-- Fix: bảng public.nhan_su được tạo từ apps/web/src/lib/supabase/schema.sql
-- (CREATE TABLE gốc, không nằm trong thư mục migrations này) - từ đó code đã
-- tiến hoá thêm nhiều field (hợp đồng, lương cơ bản, ngân hàng...) nhưng
-- schema.sql chưa từng được cập nhật lại theo, và các cột mới có vẻ được
-- thêm thủ công KHÔNG đầy đủ ở đâu đó ngoài migration. Hậu quả thực tế: lưu
-- hồ sơ nhân sự (POST /api/employee-records, dùng toSupabaseEmployeeRecord())
-- lỗi "Could not find the 'loai_hd' column of 'nhan_su' in the schema cache".
--
-- Tất cả ADD COLUMN dùng IF NOT EXISTS - an toàn tuyệt đối, không đụng dữ
-- liệu/cột đã có, chỉ bổ sung cột còn thiếu so với những gì code thực sự ghi
-- (xem apps/web/src/lib/employee-records.js + lib/data/nhan-su-store.tsx).

alter table public.nhan_su add column if not exists loai_hd text;
alter table public.nhan_su add column if not exists tinh_trang_hn text;
alter table public.nhan_su add column if not exists loai_luong text;
alter table public.nhan_su add column if not exists luong_cb numeric;
alter table public.nhan_su add column if not exists mst text;
alter table public.nhan_su add column if not exists so_tk text;
alter table public.nhan_su add column if not exists ngan_hang text;
alter table public.nhan_su add column if not exists ghi_chu text;
alter table public.nhan_su add column if not exists don_gia_sp text;
alter table public.nhan_su add column if not exists ngay_vao_lam text;
alter table public.nhan_su add column if not exists role text;
alter table public.nhan_su add column if not exists ma_dm text;
-- Phòng trường hợp cột gốc từng bị đổi tên/xoá ngoài ý muốn - vô hại nếu đã có sẵn.
alter table public.nhan_su add column if not exists avatar_url text;
alter table public.nhan_su add column if not exists bhxh text;
