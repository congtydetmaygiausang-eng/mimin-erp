-- @codex V1: cache VietQR và bằng chứng pháp lý theo trường, độc lập danh mục ERP chính thức.

create table if not exists public.production_company_registry_cache (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (organization_id = 'mimin'),
  provider text not null check (provider in ('VIETQR','MASOTHUE')),
  tax_code text not null check (tax_code ~ '^\d{10}(-\d{3})?$'),
  lookup_status text not null check (lookup_status in ('SUCCESS','NOT_FOUND','ERROR')),
  response_code text not null default '',
  legal_name text not null default '' check (length(legal_name) <= 300),
  international_name text not null default '' check (length(international_name) <= 300),
  short_name text not null default '' check (length(short_name) <= 200),
  registered_address text not null default '' check (length(registered_address) <= 1000),
  taxpayer_status text not null default '' check (length(taxpayer_status) <= 300),
  source_url text not null check (source_url like 'https://%'),
  raw_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(raw_payload) = 'object'),
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_by uuid not null default auth.uid(),
  updated_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, tax_code)
);

create index if not exists production_company_registry_cache_expiry_idx
  on public.production_company_registry_cache (organization_id, provider, expires_at);

create table if not exists public.production_company_field_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (organization_id = 'mimin'),
  company_profile_id uuid not null references public.production_company_profiles(id) on delete cascade,
  tax_code text not null check (tax_code ~ '^\d{10}(-\d{3})?$'),
  provider text not null check (provider in ('VIETQR','MASOTHUE')),
  field_name text not null check (field_name in ('TAX_CODE','LEGAL_NAME','INTERNATIONAL_NAME','SHORT_NAME','REGISTERED_ADDRESS','TAXPAYER_STATUS')),
  field_value text not null check (length(trim(field_value)) between 1 and 2000),
  normalized_value text not null check (length(normalized_value) between 1 and 2000),
  source_url text not null check (source_url like 'https://%'),
  confidence smallint not null check (confidence between 0 and 100),
  verification_status text not null default 'UNVERIFIED' check (verification_status in ('UNVERIFIED','PARTIAL','VERIFIED','REJECTED')),
  captured_at timestamptz not null default now(),
  created_by uuid not null default auth.uid(),
  updated_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_profile_id, provider, field_name)
);

create index if not exists production_company_field_evidence_profile_idx
  on public.production_company_field_evidence (company_profile_id, provider, field_name);

alter table public.production_company_registry_cache enable row level security;
alter table public.production_company_field_evidence enable row level security;
revoke all on public.production_company_registry_cache from anon, authenticated;
revoke all on public.production_company_field_evidence from anon, authenticated;
grant select, insert, update on public.production_company_registry_cache to authenticated;
grant select, insert, update on public.production_company_field_evidence to authenticated;

create policy "production_company_registry_cache_read"
on public.production_company_registry_cache for select to authenticated
using (organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant'));
create policy "production_company_registry_cache_insert"
on public.production_company_registry_cache for insert to authenticated
with check (organization_id = 'mimin' and created_by = (select auth.uid()) and updated_by = (select auth.uid()) and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant'));
create policy "production_company_registry_cache_update"
on public.production_company_registry_cache for update to authenticated
using (organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant'))
with check (organization_id = 'mimin' and updated_by = (select auth.uid()) and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant'));

create policy "production_company_field_evidence_read"
on public.production_company_field_evidence for select to authenticated
using (organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant'));
create policy "production_company_field_evidence_insert"
on public.production_company_field_evidence for insert to authenticated
with check (
  organization_id = 'mimin' and created_by = (select auth.uid()) and updated_by = (select auth.uid())
  and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant')
  and exists (select 1 from public.production_company_profiles profile where profile.id = company_profile_id and profile.organization_id = organization_id)
);
create policy "production_company_field_evidence_update"
on public.production_company_field_evidence for update to authenticated
using (organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant'))
with check (
  organization_id = 'mimin' and updated_by = (select auth.uid())
  and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant')
  and exists (select 1 from public.production_company_profiles profile where profile.id = company_profile_id and profile.organization_id = organization_id)
);

create or replace function public.set_production_company_registry_metadata()
returns trigger language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
  new.organization_id := 'mimin';
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_by := (select auth.uid());
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.set_production_company_registry_metadata() from public, anon;
grant execute on function public.set_production_company_registry_metadata() to authenticated;

create trigger production_company_registry_cache_metadata_v1
before insert or update on public.production_company_registry_cache
for each row execute function public.set_production_company_registry_metadata();
create trigger production_company_field_evidence_metadata_v1
before insert or update on public.production_company_field_evidence
for each row execute function public.set_production_company_registry_metadata();

comment on table public.production_company_registry_cache is 'V1: cache phản hồi VietQR/Masothue theo MST; không tự cập nhật hồ sơ hoặc danh mục ERP.';
comment on table public.production_company_field_evidence is 'V1: bằng chứng pháp lý theo từng trường, có nguồn và độ tin cậy; không phải giá trị đã duyệt cuối cùng.';
