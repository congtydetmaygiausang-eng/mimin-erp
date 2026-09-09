begin;

create table if not exists public.cham_cong (
  id text primary key,
  ma_nv text not null,
  auth_user_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  bo_phan text,
  ngay date not null,
  trang_thai text not null,
  gio_vao time,
  gio_ra time,
  so_gio_tang_ca numeric(5, 2) not null default 0,
  ghi_chu text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cham_cong_ma_nv_ngay_unique unique (ma_nv, ngay),
  constraint cham_cong_trang_thai_check check (trang_thai in ('di-lam', 'nghi-phep', 'nghi-khong-phep', 'nua-cong', 'di-tre')),
  constraint cham_cong_tang_ca_check check (so_gio_tang_ca >= 0 and so_gio_tang_ca <= 24),
  constraint cham_cong_gio_hop_le_check check (gio_ra is null or gio_vao is null or gio_ra >= gio_vao)
);

create index if not exists idx_cham_cong_ngay on public.cham_cong (ngay desc);
create index if not exists idx_cham_cong_ma_nv_ngay on public.cham_cong (ma_nv, ngay desc);

alter table public.cham_cong enable row level security;

revoke all on table public.cham_cong from anon, authenticated;
grant select, insert, update, delete on table public.cham_cong to authenticated;

drop policy if exists cham_cong_authenticated_select on public.cham_cong;
create policy cham_cong_authenticated_select on public.cham_cong
for select to authenticated
using (
  (select auth.uid()) = auth_user_id
  or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'accountant', 'hr')
);

drop policy if exists cham_cong_authenticated_insert on public.cham_cong;
create policy cham_cong_authenticated_insert on public.cham_cong
for insert to authenticated
with check (
  (select auth.uid()) = auth_user_id
  or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'accountant', 'hr')
);

drop policy if exists cham_cong_authenticated_update on public.cham_cong;
create policy cham_cong_authenticated_update on public.cham_cong
for update to authenticated
using (
  (select auth.uid()) = auth_user_id
  or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'accountant', 'hr')
)
with check (
  (select auth.uid()) = auth_user_id
  or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'accountant', 'hr')
);

drop policy if exists cham_cong_authenticated_delete on public.cham_cong;
create policy cham_cong_authenticated_delete on public.cham_cong
for delete to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'accountant', 'hr'));

notify pgrst, 'reload schema';

commit;
