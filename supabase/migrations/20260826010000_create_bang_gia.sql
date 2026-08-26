begin;

create table if not exists public.bang_gia (
  id text primary key,
  ten_bang_gia text not null,
  kenh_ban text not null,
  tu_ngay date,
  den_ngay date,
  trang_thai text not null default 'dang-ap-dung',
  ghi_chu text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bang_gia_kenh_ban_check check (kenh_ban in ('ban-le', 'ban-si', 'ban-lo', 'tiktok', 'shopee')),
  constraint bang_gia_trang_thai_check check (trang_thai in ('nhap', 'dang-ap-dung', 'ngung-ap-dung')),
  constraint bang_gia_date_check check (den_ngay is null or tu_ngay is null or den_ngay >= tu_ngay),
  constraint bang_gia_ten_length check (char_length(ten_bang_gia) between 1 and 200)
);

create table if not exists public.bang_gia_chi_tiet (
  id text primary key,
  bang_gia_id text not null references public.bang_gia(id) on delete cascade,
  ma_sp text not null,
  ma_sku_bien_the text,
  gia_ban numeric not null,
  so_luong_tu integer not null default 1,
  so_luong_den integer,
  ghi_chu text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bang_gia_ct_price_check check (gia_ban >= 0),
  constraint bang_gia_ct_quantity_check check (so_luong_tu >= 1 and (so_luong_den is null or so_luong_den >= so_luong_tu)),
  constraint bang_gia_ct_product_check check (char_length(ma_sp) between 1 and 100),
  constraint bang_gia_ct_sku_length check (ma_sku_bien_the is null or char_length(ma_sku_bien_the) between 1 and 150),
  unique (bang_gia_id, ma_sp, ma_sku_bien_the, so_luong_tu)
);

create index if not exists idx_bang_gia_channel_status on public.bang_gia (kenh_ban, trang_thai);
create index if not exists idx_bang_gia_ct_product on public.bang_gia_chi_tiet (ma_sp, ma_sku_bien_the);
create index if not exists idx_bang_gia_ct_list on public.bang_gia_chi_tiet (bang_gia_id);

alter table public.bang_gia enable row level security;
alter table public.bang_gia_chi_tiet enable row level security;

drop policy if exists bang_gia_read_all on public.bang_gia;
create policy bang_gia_read_all on public.bang_gia
for select to anon, authenticated using (true);

drop policy if exists bang_gia_write_all on public.bang_gia;
create policy bang_gia_write_all on public.bang_gia
for all to anon, authenticated using (true) with check (true);

drop policy if exists bang_gia_ct_read_all on public.bang_gia_chi_tiet;
create policy bang_gia_ct_read_all on public.bang_gia_chi_tiet
for select to anon, authenticated using (true);

drop policy if exists bang_gia_ct_write_all on public.bang_gia_chi_tiet;
create policy bang_gia_ct_write_all on public.bang_gia_chi_tiet
for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on public.bang_gia to anon, authenticated;
grant select, insert, update, delete on public.bang_gia_chi_tiet to anon, authenticated;

notify pgrst, 'reload schema';
commit;
