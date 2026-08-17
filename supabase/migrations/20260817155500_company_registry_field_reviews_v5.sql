-- @codex V5: quyết định kiểm duyệt từng trường pháp lý, bất biến và chưa áp dụng vào hồ sơ chính thức.
create table if not exists public.production_company_registry_field_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (organization_id = 'mimin'),
  company_profile_id uuid not null references public.production_company_profiles(id) on delete cascade,
  reconciliation_id uuid not null references public.production_company_registry_reconciliations(id) on delete restrict,
  tax_code text not null check (tax_code ~ '^([0-9]{10}|[0-9]{10}-[0-9]{3})$'),
  field_name text not null check (field_name in ('TAX_CODE','LEGAL_NAME','REGISTERED_ADDRESS','TAXPAYER_STATUS')),
  decision text not null check (decision in ('ACCEPT_VIETQR','ACCEPT_MASOTHUE','KEEP_PROFILE','REJECT_BOTH')),
  selected_value text,
  note text not null default '' check (char_length(note) <= 1000),
  evidence_snapshot jsonb not null check (jsonb_typeof(evidence_snapshot) = 'object'),
  reviewed_by uuid not null references auth.users(id) on delete restrict,
  reviewed_at timestamptz not null default now()
);

create index if not exists production_company_registry_field_reviews_lookup_idx
  on public.production_company_registry_field_reviews (company_profile_id, reconciliation_id, field_name, reviewed_at desc);
create index if not exists production_company_registry_field_reviews_reconciliation_idx
  on public.production_company_registry_field_reviews (reconciliation_id);
create index if not exists production_company_registry_field_reviews_reviewer_idx
  on public.production_company_registry_field_reviews (reviewed_by);

alter table public.production_company_registry_field_reviews enable row level security;
revoke all on public.production_company_registry_field_reviews from anon, authenticated;
grant select, insert on public.production_company_registry_field_reviews to authenticated;

create policy "production_company_registry_field_reviews_read"
on public.production_company_registry_field_reviews for select to authenticated
using (
  organization_id = 'mimin'
  and (select auth.uid()) is not null
  and coalesce((select auth.jwt())->'app_metadata'->>'role','') in ('admin','planner','warehouse','accountant')
);

create policy "production_company_registry_field_reviews_insert"
on public.production_company_registry_field_reviews for insert to authenticated
with check (
  organization_id = 'mimin'
  and reviewed_by = (select auth.uid())
  and coalesce((select auth.jwt())->'app_metadata'->>'role','') in ('admin','planner','warehouse','accountant')
);

create or replace function public.set_production_company_registry_field_review_metadata()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.organization_id := 'mimin';
  new.reviewed_by := (select auth.uid());
  new.reviewed_at := now();
  return new;
end;
$$;

revoke all on function public.set_production_company_registry_field_review_metadata() from public, anon;
grant execute on function public.set_production_company_registry_field_review_metadata() to authenticated;

create trigger production_company_registry_field_reviews_metadata_v5
before insert on public.production_company_registry_field_reviews
for each row execute function public.set_production_company_registry_field_review_metadata();

comment on table public.production_company_registry_field_reviews is
  'V5: lịch sử quyết định từng trường bất biến; không tự cập nhật hồ sơ công ty hoặc danh mục ERP.';
