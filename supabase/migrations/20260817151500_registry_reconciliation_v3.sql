-- @codex V3: ảnh chụp bất biến khi đối chiếu VietQR với MaSoThue theo từng trường.

create table if not exists public.production_company_registry_reconciliations (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (organization_id = 'mimin'),
  company_profile_id uuid not null references public.production_company_profiles(id) on delete cascade,
  tax_code text not null check (tax_code ~ '^\d{10}(-\d{3})?$'),
  formula_version text not null default 'registry-v3.1' check (length(formula_version) between 1 and 30),
  overall_status text not null check (overall_status in ('MATCH','PARTIAL','CONFLICT','INSUFFICIENT')),
  match_score smallint not null check (match_score between 0 and 100),
  matched_fields smallint not null default 0 check (matched_fields >= 0),
  partial_fields smallint not null default 0 check (partial_fields >= 0),
  conflict_fields smallint not null default 0 check (conflict_fields >= 0),
  missing_fields smallint not null default 0 check (missing_fields >= 0),
  field_results jsonb not null check (jsonb_typeof(field_results) = 'array'),
  source_snapshot jsonb not null check (jsonb_typeof(source_snapshot) = 'object'),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists production_company_registry_reconciliations_profile_time_idx
  on public.production_company_registry_reconciliations (company_profile_id, created_at desc, id desc);

alter table public.production_company_registry_reconciliations enable row level security;
revoke all on public.production_company_registry_reconciliations from anon, authenticated;
grant select, insert on public.production_company_registry_reconciliations to authenticated;

create policy "production_company_registry_reconciliations_read"
on public.production_company_registry_reconciliations for select to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant')
);

create policy "production_company_registry_reconciliations_insert"
on public.production_company_registry_reconciliations for insert to authenticated
with check (
  organization_id = 'mimin'
  and created_by = (select auth.uid())
  and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant')
  and exists (
    select 1 from public.production_company_profiles profile
    where profile.id = company_profile_id and profile.organization_id = organization_id
  )
);

create or replace function public.set_production_company_registry_reconciliation_metadata()
returns trigger language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
  new.organization_id := 'mimin';
  new.created_by := (select auth.uid());
  new.created_at := now();
  return new;
end;
$$;
revoke all on function public.set_production_company_registry_reconciliation_metadata() from public, anon;
grant execute on function public.set_production_company_registry_reconciliation_metadata() to authenticated;

create trigger production_company_registry_reconciliations_metadata_v3
before insert on public.production_company_registry_reconciliations
for each row execute function public.set_production_company_registry_reconciliation_metadata();

comment on table public.production_company_registry_reconciliations is
  'V3: lịch sử đối chiếu VietQR/MaSoThue bất biến; không tự ghi đè hồ sơ hay tạo đối tác ERP.';
