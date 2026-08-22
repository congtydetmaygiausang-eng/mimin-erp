-- @codex MIMIN GROUP - hồ sơ công ty dùng làm ngữ cảnh cố định cho AI Search Agent
-- (system prompt), tránh phải gõ lại mỗi lần tìm kiếm. 1 dòng cấu hình / organization.

create table if not exists public.mimin_group_agent_config (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (length(trim(organization_id)) > 0),
  company_products text,
  preferred_regions text,
  default_moq integer check (default_moq is null or default_moq >= 0),
  quality_requirements text,
  preferred_certifications text[] not null default '{}',
  industry_synonyms text,
  additional_notes text,
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  constraint mimin_group_agent_config_org_key unique (organization_id)
);

create or replace function public.set_mimin_group_agent_config_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end;
$$;

drop trigger if exists mimin_group_agent_config_set_updated_at on public.mimin_group_agent_config;
create trigger mimin_group_agent_config_set_updated_at
before update on public.mimin_group_agent_config
for each row execute function public.set_mimin_group_agent_config_updated_at();

alter table public.mimin_group_agent_config enable row level security;

revoke all on public.mimin_group_agent_config from anon;
grant select, insert, update on public.mimin_group_agent_config to authenticated;

drop policy if exists "mimin_group_agent_config_read" on public.mimin_group_agent_config;
create policy "mimin_group_agent_config_read"
on public.mimin_group_agent_config
for select
to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in (
    'admin', 'planner', 'warehouse', 'accountant', 'content', 'partner'
  )
);

drop policy if exists "mimin_group_agent_config_write" on public.mimin_group_agent_config;
create policy "mimin_group_agent_config_write"
on public.mimin_group_agent_config
for insert
to authenticated
with check (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin', 'planner')
);

drop policy if exists "mimin_group_agent_config_update" on public.mimin_group_agent_config;
create policy "mimin_group_agent_config_update"
on public.mimin_group_agent_config
for update
to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin', 'planner')
)
with check (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin', 'planner')
);

comment on table public.mimin_group_agent_config is
  'MIMIN GROUP: hồ sơ công ty (sản phẩm, khu vực, MOQ, tiêu chuẩn, từ đồng nghĩa ngành) nạp vào system prompt của AI Search Agent. Người dùng tự chỉnh sửa (LEARNING_REVIEW dạng thủ công) - không có pipeline crawl tự động ghi vào bảng này.';
