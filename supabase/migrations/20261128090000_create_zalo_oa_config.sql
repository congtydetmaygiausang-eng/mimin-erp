begin;

create table if not exists public.zalo_oa_config (
  id text primary key default 'default',
  oa_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  connected_by text,
  updated_at timestamptz not null default now()
);

comment on table public.zalo_oa_config is 'Luu access/refresh token cua Zalo Official Account de dang bai/gui tin.';

alter table public.zalo_oa_config enable row level security;

drop policy if exists zalo_oa_config_read on public.zalo_oa_config;
create policy zalo_oa_config_read
on public.zalo_oa_config for select
to authenticated
using (true);

-- Chi service role (server) moi duoc ghi token; khong cap quyen ghi cho client.
grant select on public.zalo_oa_config to authenticated;

notify pgrst, 'reload schema';
commit;
