-- Chạy sau: 20260828_create_hop_dong_ncc.sql
-- Bổ sung thanh toán và các view tổng hợp cho module Nhà cung cấp.

create table if not exists public.thanh_toan_ncc (
  id text primary key,
  ma_ncc text not null,
  ngay date not null,
  so_tien numeric(18, 2) not null,
  phuong_thuc text not null,
  ma_chung_tu text not null,
  ghi_chu text not null default '',
  created_at timestamptz not null default now(),
  constraint thanh_toan_ncc_so_tien_check check (so_tien > 0),
  constraint thanh_toan_ncc_ma_chung_tu_unique unique (ma_chung_tu)
);

create index if not exists thanh_toan_ncc_ma_ncc_idx
  on public.thanh_toan_ncc (ma_ncc);
create index if not exists thanh_toan_ncc_ngay_idx
  on public.thanh_toan_ncc (ngay desc);

alter table public.thanh_toan_ncc enable row level security;

drop policy if exists "Authenticated users can read supplier payments"
  on public.thanh_toan_ncc;
create policy "Authenticated users can read supplier payments"
  on public.thanh_toan_ncc for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create supplier payments"
  on public.thanh_toan_ncc;
create policy "Authenticated users can create supplier payments"
  on public.thanh_toan_ncc for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update supplier payments"
  on public.thanh_toan_ncc;
create policy "Authenticated users can update supplier payments"
  on public.thanh_toan_ncc for update
  to authenticated
  using (true)
  with check (true);

-- Giao dịch mua được lấy từ phiếu nhập kho hiện có, không nhân đôi dữ liệu.
create or replace view public.v_giao_dich_mua_ncc
with (security_invoker = true)
as
select
  gd.id,
  gd.ngay,
  ncc.ma_ncc,
  coalesce(ncc.ten_ncc, substring(coalesce(gd.ghi_chu, '') from 'Nguồn:[[:space:]]*([^·]+)')) as ten_ncc,
  gd.loai_kho,
  gd.ma_vt,
  gd.ten_vt,
  gd.so_luong,
  gd.don_vi,
  gd.don_gia,
  gd.thanh_tien,
  gd.nguoi_thuc_hien,
  gd.ghi_chu,
  gd.created_at
from public.giao_dich_kho gd
left join public.nha_cung_cap ncc
  on lower(trim(ncc.ten_ncc)) = lower(trim(substring(coalesce(gd.ghi_chu, '') from 'Nguồn:[[:space:]]*([^·]+)')))
where gd.loai = 'NHAP';

-- Công nợ tính từ tổng mua trừ tổng phiếu thanh toán.
create or replace view public.v_cong_no_ncc_tong
with (security_invoker = true)
as
with mua as (
  select
    ma_ncc,
    max(ten_ncc) as ten_ncc,
    sum(coalesce(thanh_tien, 0)) as tong_mua
  from public.v_giao_dich_mua_ncc
  where ma_ncc is not null
  group by ma_ncc
), thanh_toan as (
  select ma_ncc, sum(so_tien) as da_thanh_toan
  from public.thanh_toan_ncc
  group by ma_ncc
)
select
  ncc.ma_ncc,
  ncc.ten_ncc,
  coalesce(mua.tong_mua, 0) as tong_mua,
  coalesce(thanh_toan.da_thanh_toan, 0) as da_thanh_toan,
  greatest(coalesce(mua.tong_mua, 0) - coalesce(thanh_toan.da_thanh_toan, 0), 0) as con_no,
  ncc.han_muc,
  ncc.trang_thai
from public.nha_cung_cap ncc
left join mua on mua.ma_ncc = ncc.ma_ncc
left join thanh_toan on thanh_toan.ma_ncc = ncc.ma_ncc;

-- Timeline thống nhất từ mua hàng, hợp đồng và thanh toán.
create or replace view public.v_lich_su_ncc
with (security_invoker = true)
as
select
  'GD-' || gd.id as id,
  gd.ma_ncc,
  gd.ngay as ngay,
  'GIAO_DICH_MUA'::text as loai_su_kien,
  'Nhập ' || gd.ten_vt as tieu_de,
  gd.thanh_tien as so_tien,
  gd.ghi_chu as chi_tiet,
  gd.created_at
from public.v_giao_dich_mua_ncc gd
union all
select
  'HD-' || hd.id,
  hd.ma_ncc,
  hd.ngay_ky,
  'HOP_DONG'::text,
  hd.ten_hop_dong,
  hd.gia_tri,
  hd.ghi_chu,
  hd.created_at
from public.hop_dong_ncc hd
union all
select
  'TT-' || tt.id,
  tt.ma_ncc,
  tt.ngay,
  'THANH_TOAN'::text,
  'Thanh toán ' || tt.ma_chung_tu,
  tt.so_tien,
  tt.ghi_chu,
  tt.created_at
from public.thanh_toan_ncc tt;

grant select on public.v_giao_dich_mua_ncc to authenticated;
grant select on public.v_cong_no_ncc_tong to authenticated;
grant select on public.v_lich_su_ncc to authenticated;

-- Yêu cầu PostgREST nạp lại schema ngay sau khi chạy file.
notify pgrst, 'reload schema';
