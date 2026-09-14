begin;

create table if not exists public.vat_tu_dat_san_xuat (
  id uuid primary key,
  ma_mau text not null unique,
  ten_mau text not null,
  loai text not null,
  mau_sac text not null default '',
  quy_cach text not null default '',
  don_vi text not null,
  ma_ncc_mac_dinh text,
  gia_mua_tham_khao numeric(15, 2) not null default 0,
  gia_ban_de_xuat numeric(15, 2) not null default 0,
  so_luong_toi_thieu numeric(15, 2) not null default 0,
  thoi_gian_san_xuat integer not null default 0,
  ma_khach_hang_so_huu text,
  hinh_anh text,
  dung_chung boolean not null default true,
  trang_thai text not null default 'Đang dùng',
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vat_tu_dat_sx_gia_mua_check check (gia_mua_tham_khao >= 0),
  constraint vat_tu_dat_sx_gia_ban_check check (gia_ban_de_xuat >= 0),
  constraint vat_tu_dat_sx_so_luong_check check (so_luong_toi_thieu >= 0),
  constraint vat_tu_dat_sx_thoi_gian_check check (thoi_gian_san_xuat >= 0),
  constraint vat_tu_dat_sx_trang_thai_check check (trang_thai in ('Đang dùng', 'Tạm ngưng')),
  constraint vat_tu_dat_sx_mau_rieng_check check (dung_chung or ma_khach_hang_so_huu is not null)
);

create index if not exists idx_vat_tu_dat_sx_trang_thai on public.vat_tu_dat_san_xuat (trang_thai);
create index if not exists idx_vat_tu_dat_sx_ncc on public.vat_tu_dat_san_xuat (ma_ncc_mac_dinh);
create index if not exists idx_vat_tu_dat_sx_khach_hang on public.vat_tu_dat_san_xuat (ma_khach_hang_so_huu);

alter table public.vat_tu_dat_san_xuat enable row level security;
revoke all on table public.vat_tu_dat_san_xuat from anon, authenticated;
grant select, insert, update, delete on table public.vat_tu_dat_san_xuat to authenticated;

create policy vat_tu_dat_sx_select on public.vat_tu_dat_san_xuat
for select to authenticated
using (true);

create policy vat_tu_dat_sx_insert on public.vat_tu_dat_san_xuat
for insert to authenticated
with check (
  (select auth.uid()) = created_by
  and (dung_chung or ma_khach_hang_so_huu is not null)
);

create policy vat_tu_dat_sx_update on public.vat_tu_dat_san_xuat
for update to authenticated
using (
  (select auth.uid()) = created_by
  or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'accountant', 'planner')
)
with check (
  (select auth.uid()) = created_by
  or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'accountant', 'planner')
);

create policy vat_tu_dat_sx_delete on public.vat_tu_dat_san_xuat
for delete to authenticated
using (
  (select auth.uid()) = created_by
  or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'accountant')
);

notify pgrst, 'reload schema';

commit;
