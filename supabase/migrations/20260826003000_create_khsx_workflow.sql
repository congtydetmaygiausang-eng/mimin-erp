begin;

create table if not exists public.khsx (
  id text primary key,
  ma_khsx text not null,
  ma_sp text,
  ten_sp text,
  loai_sp text,
  ti_le_size text,
  ds_mau jsonb not null default '[]'::jsonb,
  tuan text not null default '',
  tu_ngay date not null,
  den_ngay date not null,
  san_pham text not null,
  loai text not null default 'Bộ',
  so_luong numeric not null default 0,
  da_hoan_thanh numeric not null default 0,
  xuong_phu_trach text not null default 'Tổ cắt',
  trang_thai text not null default 'Lên kế hoạch',
  ghi_chu text,
  ngay_tao date not null default current_date,
  nguoi_tao text,
  lenh_cat_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.khsx add column if not exists ma_sp text;
alter table public.khsx add column if not exists ma_khsx text;
alter table public.khsx add column if not exists ten_sp text;
alter table public.khsx add column if not exists loai_sp text;
alter table public.khsx add column if not exists ti_le_size text;
alter table public.khsx add column if not exists ds_mau jsonb not null default '[]'::jsonb;
alter table public.khsx add column if not exists tuan text not null default '';
alter table public.khsx add column if not exists tu_ngay date;
alter table public.khsx add column if not exists den_ngay date;
alter table public.khsx add column if not exists san_pham text;
alter table public.khsx add column if not exists loai text not null default 'Bộ';
alter table public.khsx add column if not exists so_luong numeric not null default 0;
alter table public.khsx add column if not exists da_hoan_thanh numeric not null default 0;
alter table public.khsx add column if not exists xuong_phu_trach text not null default 'Tổ cắt';
alter table public.khsx add column if not exists trang_thai text not null default 'Lên kế hoạch';
alter table public.khsx add column if not exists ghi_chu text;
alter table public.khsx add column if not exists ngay_tao date not null default current_date;
alter table public.khsx add column if not exists nguoi_tao text;
alter table public.khsx add column if not exists lenh_cat_id text;
alter table public.khsx add column if not exists created_at timestamptz not null default now();
alter table public.khsx add column if not exists updated_at timestamptz not null default now();

alter table public.khsx enable row level security;
drop policy if exists khsx_read_all on public.khsx;
create policy khsx_read_all on public.khsx for select to anon, authenticated using (true);
drop policy if exists khsx_insert_all on public.khsx;
create policy khsx_insert_all on public.khsx for insert to anon, authenticated with check (char_length(ma_khsx) between 1 and 100 and so_luong >= 0);
drop policy if exists khsx_update_all on public.khsx;
create policy khsx_update_all on public.khsx for update to anon, authenticated using (true) with check (so_luong >= 0);
drop policy if exists khsx_delete_authenticated on public.khsx;
create policy khsx_delete_authenticated on public.khsx for delete to authenticated using (true);

grant select, insert, update on public.khsx to anon;
grant select, insert, update, delete on public.khsx to authenticated;
notify pgrst, 'reload schema';
commit;
