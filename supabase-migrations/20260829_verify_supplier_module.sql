-- File kiểm tra sau khi chạy 2 migration Nhà cung cấp.
-- Chỉ đọc schema, không thay đổi hoặc xóa dữ liệu.

select
  to_regclass('public.hop_dong_ncc') as bang_hop_dong,
  to_regclass('public.thanh_toan_ncc') as bang_thanh_toan,
  to_regclass('public.v_giao_dich_mua_ncc') as view_giao_dich_mua,
  to_regclass('public.v_cong_no_ncc_tong') as view_cong_no_tong,
  to_regclass('public.v_lich_su_ncc') as view_lich_su;

select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'hop_dong_ncc',
    'thanh_toan_ncc',
    'v_giao_dich_mua_ncc',
    'v_cong_no_ncc_tong',
    'v_lich_su_ncc'
  )
order by table_name, ordinal_position;
