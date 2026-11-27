begin;

create table if not exists public.ke_hoach_san_xuat_30_ngay (
  id uuid primary key default gen_random_uuid(),
  thu_tu int not null default 0,
  ma_sp text not null,
  loai_sp text not null,
  mau_ao text,
  mau_quan text,
  mau_bo_co text,
  sl_ke_hoach numeric(12, 0) not null default 0 check (sl_ke_hoach >= 0),
  dm_vai_chinh numeric(8, 4) not null default 0 check (dm_vai_chinh >= 0),
  sl_bo_co numeric(12, 0) not null default 0 check (sl_bo_co >= 0),
  nhip_giao text,
  ghi_chu text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ke_hoach_san_xuat_30_ngay is
  'Bang ke hoach san xuat don gian theo chu ky 30 ngay: dinh muc vai chinh (kg) va bo co (so luong) theo tung ma SP + mau.';

create index if not exists idx_khsx30_thu_tu on public.ke_hoach_san_xuat_30_ngay (thu_tu);

create or replace function public.set_khsx30_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_khsx30_updated_at on public.ke_hoach_san_xuat_30_ngay;
create trigger trg_khsx30_updated_at
before update on public.ke_hoach_san_xuat_30_ngay
for each row execute function public.set_khsx30_updated_at();

revoke all on function public.set_khsx30_updated_at() from public, anon, authenticated;

alter table public.ke_hoach_san_xuat_30_ngay enable row level security;

drop policy if exists khsx30_read on public.ke_hoach_san_xuat_30_ngay;
create policy khsx30_read
on public.ke_hoach_san_xuat_30_ngay for select
to anon, authenticated
using (true);

drop policy if exists khsx30_write on public.ke_hoach_san_xuat_30_ngay;
create policy khsx30_write
on public.ke_hoach_san_xuat_30_ngay for all
to authenticated
using (true)
with check (true);

grant select on public.ke_hoach_san_xuat_30_ngay to anon;
grant select, insert, update, delete on public.ke_hoach_san_xuat_30_ngay to authenticated;

notify pgrst, 'reload schema';
commit;
