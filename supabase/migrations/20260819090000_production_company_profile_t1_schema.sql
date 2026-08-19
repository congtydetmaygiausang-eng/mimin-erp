-- @codex T1: chuẩn hóa hồ sơ công ty và chứng cứ theo từng trường.
-- Chỉ mở rộng production_company_profiles; không ghi vào production_partners/danh mục chính thức.

alter table public.production_company_profiles
  add column if not exists trade_name text,
  add column if not exists short_name text,
  add column if not exists registered_address text,
  add column if not exists factory_address text,
  add column if not exists office_address text,
  add column if not exists phones text[] not null default '{}',
  add column if not exists zalo_phone text,
  add column if not exists facebook_url text,
  add column if not exists legal_representative text,
  add column if not exists business_lines text[] not null default '{}',
  add column if not exists company_introduction text,
  add column if not exists founded_year smallint,
  add column if not exists operating_status text;

update public.production_company_profiles
set registered_address = coalesce(nullif(trim(registered_address), ''), address),
    phones = case when cardinality(phones) = 0 and nullif(trim(phone), '') is not null then array[trim(phone)] else phones end,
    company_introduction = coalesce(nullif(trim(company_introduction), ''), summary)
where registered_address is null
   or cardinality(phones) = 0
   or company_introduction is null;

alter table public.production_company_profiles
  drop constraint if exists production_company_profiles_founded_year_check,
  add constraint production_company_profiles_founded_year_check
    check (founded_year is null or founded_year between 1800 and 2100),
  drop constraint if exists production_company_profiles_facebook_url_check,
  add constraint production_company_profiles_facebook_url_check
    check (facebook_url is null or facebook_url ~ '^https://');

create table if not exists public.production_company_field_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (length(trim(organization_id)) > 0),
  company_profile_id uuid not null references public.production_company_profiles(id) on delete cascade,
  field_name text not null check (field_name in (
    'LEGAL_NAME','TRADE_NAME','SHORT_NAME','TAX_CODE','REGISTERED_ADDRESS','FACTORY_ADDRESS',
    'OFFICE_ADDRESS','PHONE','ZALO','EMAIL','WEBSITE','FACEBOOK','LEGAL_REPRESENTATIVE',
    'BUSINESS_LINE','CAPABILITY','COMPANY_INTRODUCTION','FOUNDED_YEAR','OPERATING_STATUS'
  )),
  field_value text not null check (length(trim(field_value)) > 0),
  source_id uuid references public.production_company_sources(id) on delete set null,
  source_url text check (source_url is null or source_url ~ '^https://'),
  source_excerpt text,
  confidence smallint not null default 0 check (confidence between 0 and 100),
  verification_status text not null default 'UNVERIFIED'
    check (verification_status in ('UNVERIFIED','PARTIAL','VERIFIED','REJECTED')),
  is_selected boolean not null default false,
  captured_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_id is not null or source_url is not null),
  constraint production_company_field_evidence_value_key
    unique (company_profile_id, field_name, field_value, source_url)
);

create index if not exists production_company_field_evidence_profile_idx
  on public.production_company_field_evidence
  (company_profile_id, field_name, is_selected desc, confidence desc, captured_at desc);
create index if not exists production_company_field_evidence_org_status_idx
  on public.production_company_field_evidence
  (organization_id, verification_status, captured_at desc);

alter table public.production_company_field_evidence enable row level security;
revoke all on public.production_company_field_evidence from anon;
grant select, insert, update on public.production_company_field_evidence to authenticated;

drop policy if exists "production_company_field_evidence_read" on public.production_company_field_evidence;
create policy "production_company_field_evidence_read" on public.production_company_field_evidence
for select to authenticated using (
  organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in
  ('admin','planner','warehouse','accountant','content','partner')
);

drop policy if exists "production_company_field_evidence_create" on public.production_company_field_evidence;
create policy "production_company_field_evidence_create" on public.production_company_field_evidence
for insert to authenticated with check (
  organization_id = 'mimin' and created_by = (select auth.uid()) and
  ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant') and
  exists (
    select 1 from public.production_company_profiles profile
    where profile.id = company_profile_id
      and profile.organization_id = production_company_field_evidence.organization_id
  )
);

drop policy if exists "production_company_field_evidence_update" on public.production_company_field_evidence;
create policy "production_company_field_evidence_update" on public.production_company_field_evidence
for update to authenticated
using (
  organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in
  ('admin','planner','warehouse','accountant')
)
with check (
  organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in
  ('admin','planner','warehouse','accountant')
);

comment on table public.production_company_field_evidence is
  'T1: chứng cứ độc lập cho từng trường hồ sơ; chưa tự động cập nhật danh mục đối tác chính thức.';
