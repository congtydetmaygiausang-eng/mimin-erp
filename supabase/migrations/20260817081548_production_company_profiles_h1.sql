-- @codex H1: nền tảng hồ sơ chi tiết công ty, tách biệt danh mục đối tác chính thức.

create table if not exists public.production_company_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (length(trim(organization_id)) > 0),
  identity_key text not null check (length(trim(identity_key)) >= 16),
  partner_id uuid references public.production_partners(id) on delete set null,
  discovery_candidate_id uuid references public.production_discovery_candidates(id) on delete set null,
  role text not null check (role in ('CUSTOMER','SATELLITE_PROCESSOR','MATERIAL_SUPPLIER','PACKAGING_FINISHER')),
  legal_name text not null check (length(trim(legal_name)) > 0),
  tax_code text,
  phone text,
  email text,
  website text,
  address text,
  province text,
  district text,
  latitude double precision,
  longitude double precision,
  capabilities text[] not null default '{}',
  profile_status text not null default 'DRAFT' check (profile_status in ('DRAFT','ACTIVE','ARCHIVED')),
  verification_status text not null default 'DISCOVERED' check (verification_status in ('DISCOVERED','REVIEWED','VERIFIED')),
  summary text,
  source_provider text,
  source_url text,
  raw_data jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_company_profiles_org_identity_key unique (organization_id, identity_key),
  check ((latitude is null) = (longitude is null)),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create table if not exists public.production_company_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (length(trim(organization_id)) > 0),
  company_profile_id uuid not null references public.production_company_profiles(id) on delete cascade,
  source_type text not null default 'SEARCH' check (source_type in ('SEARCH','OFFICIAL','REGISTRY','MAP','SOCIAL','OTHER')),
  source_provider text,
  source_url text not null check (source_url ~ '^https://'),
  source_title text,
  verification_status text not null default 'UNVERIFIED' check (verification_status in ('UNVERIFIED','PARTIAL','VERIFIED','REJECTED')),
  captured_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  constraint production_company_sources_company_url_key unique (company_profile_id, source_url)
);

create unique index if not exists production_company_profiles_partner_key
  on public.production_company_profiles (organization_id, partner_id)
  where partner_id is not null;
create unique index if not exists production_company_profiles_candidate_key
  on public.production_company_profiles (organization_id, discovery_candidate_id)
  where discovery_candidate_id is not null;
create index if not exists production_company_profiles_org_status_idx
  on public.production_company_profiles (organization_id, profile_status, updated_at desc);
create index if not exists production_company_profiles_org_name_idx
  on public.production_company_profiles (organization_id, lower(legal_name));
create index if not exists production_company_sources_company_idx
  on public.production_company_sources (company_profile_id, captured_at desc);
create index if not exists production_company_sources_org_status_idx
  on public.production_company_sources (organization_id, verification_status, captured_at desc);

create or replace function public.set_production_company_profile_updated_at()
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

drop trigger if exists production_company_profiles_set_updated_at on public.production_company_profiles;
create trigger production_company_profiles_set_updated_at
before update on public.production_company_profiles
for each row execute function public.set_production_company_profile_updated_at();

revoke all on function public.set_production_company_profile_updated_at() from public, anon;
grant execute on function public.set_production_company_profile_updated_at() to authenticated;

alter table public.production_company_profiles enable row level security;
alter table public.production_company_sources enable row level security;

revoke all on public.production_company_profiles from anon;
revoke all on public.production_company_sources from anon;
grant select, insert, update on public.production_company_profiles to authenticated;
grant select, insert, update on public.production_company_sources to authenticated;

drop policy if exists "production_company_profiles_read" on public.production_company_profiles;
create policy "production_company_profiles_read" on public.production_company_profiles
for select to authenticated using (
  organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in
  ('admin','planner','warehouse','accountant','content','partner')
);
drop policy if exists "production_company_profiles_create" on public.production_company_profiles;
create policy "production_company_profiles_create" on public.production_company_profiles
for insert to authenticated with check (
  organization_id = 'mimin' and created_by = (select auth.uid()) and
  ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant')
);
drop policy if exists "production_company_profiles_update" on public.production_company_profiles;
create policy "production_company_profiles_update" on public.production_company_profiles
for update to authenticated
using (
  organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in
  ('admin','planner','warehouse','accountant')
)
with check (
  organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in
  ('admin','planner','warehouse','accountant')
);

drop policy if exists "production_company_sources_read" on public.production_company_sources;
create policy "production_company_sources_read" on public.production_company_sources
for select to authenticated using (
  organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in
  ('admin','planner','warehouse','accountant','content','partner')
);
drop policy if exists "production_company_sources_create" on public.production_company_sources;
create policy "production_company_sources_create" on public.production_company_sources
for insert to authenticated with check (
  organization_id = 'mimin' and created_by = (select auth.uid()) and
  ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant') and
  exists (
    select 1 from public.production_company_profiles profile
    where profile.id = company_profile_id and profile.organization_id = production_company_sources.organization_id
  )
);
drop policy if exists "production_company_sources_update" on public.production_company_sources;
create policy "production_company_sources_update" on public.production_company_sources
for update to authenticated
using (
  organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in
  ('admin','planner','warehouse','accountant')
)
with check (
  organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in
  ('admin','planner','warehouse','accountant')
);

comment on table public.production_company_profiles is
  'H1: hồ sơ chi tiết công ty dạng nháp; không tự động trở thành production_partners.';
comment on table public.production_company_sources is
  'H1: nguồn chứng cứ liên kết hồ sơ công ty; ảnh và giấy tờ được bổ sung ở các giai đoạn sau.';
