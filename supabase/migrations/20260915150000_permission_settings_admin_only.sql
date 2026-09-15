-- Ma trận quyền dùng chung: local cache để đọc nhanh, Supabase là nguồn đồng bộ giữa các máy.
create table if not exists public.permission_settings (
  id text primary key,
  matrix jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.permission_settings enable row level security;

drop policy if exists "authenticated_read_permission_settings" on public.permission_settings;
create policy "authenticated_read_permission_settings"
  on public.permission_settings for select
  to authenticated
  using (true);

drop policy if exists "authenticated_write_permission_settings" on public.permission_settings;
drop policy if exists "admin_write_permission_settings" on public.permission_settings;
create policy "admin_write_permission_settings"
  on public.permission_settings for all
  to authenticated
  using (
    exists (
      select 1 from public.users
      where lower(email) = lower(auth.jwt() ->> 'email')
        and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.users
      where lower(email) = lower(auth.jwt() ->> 'email')
        and role = 'admin'
    )
  );

-- Reset dữ liệu dùng chung. Client sẽ dựng admin=rcud cho mọi module và các role khác rỗng.
insert into public.permission_settings (id, matrix, updated_at)
values ('global', '{}'::jsonb, now())
on conflict (id) do update set matrix = excluded.matrix, updated_at = excluded.updated_at;

alter publication supabase_realtime add table public.permission_settings;
