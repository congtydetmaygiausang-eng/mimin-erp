-- @codex U6: ảnh chụp bất biến của kết quả đánh giá uy tín hồ sơ công ty.

create table if not exists public.production_company_trust_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (organization_id = 'mimin'),
  company_profile_id uuid not null references public.production_company_profiles(id) on delete cascade,
  formula_version text not null check (length(trim(formula_version)) between 1 and 30),
  score smallint not null check (score between 0 and 100),
  base_score smallint not null check (base_score between 0 and 100),
  penalty_total smallint not null check (penalty_total between 0 and 40),
  coverage smallint not null check (coverage between 0 and 100),
  assessment_label text not null check (length(trim(assessment_label)) between 1 and 100),
  risk_level text not null check (risk_level in ('NONE','MEDIUM','HIGH','CRITICAL')),
  factors jsonb not null check (jsonb_typeof(factors) = 'array'),
  penalties jsonb not null default '[]'::jsonb check (jsonb_typeof(penalties) = 'array'),
  evidence_summary jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence_summary) = 'object'),
  note text not null default '' check (length(note) <= 1000),
  assessed_by uuid not null default auth.uid(),
  assessed_at timestamptz not null default now()
);

create index if not exists production_company_trust_assessments_profile_time_idx
  on public.production_company_trust_assessments (company_profile_id, assessed_at desc, id desc);

alter table public.production_company_trust_assessments enable row level security;
revoke all on public.production_company_trust_assessments from anon, authenticated;
grant select, insert on public.production_company_trust_assessments to authenticated;

create policy "production_company_trust_assessments_read"
on public.production_company_trust_assessments for select to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant')
);

create policy "production_company_trust_assessments_insert"
on public.production_company_trust_assessments for insert to authenticated
with check (
  organization_id = 'mimin'
  and assessed_by = (select auth.uid())
  and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant')
  and exists (
    select 1 from public.production_company_profiles profile
    where profile.id = company_profile_id and profile.organization_id = organization_id
  )
);

create or replace function public.set_production_company_trust_assessment_metadata()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  new.organization_id := 'mimin';
  new.assessed_by := (select auth.uid());
  new.assessed_at := now();
  return new;
end;
$$;

revoke all on function public.set_production_company_trust_assessment_metadata() from public, anon;
grant execute on function public.set_production_company_trust_assessment_metadata() to authenticated;

create trigger production_company_trust_assessments_metadata_u6
before insert on public.production_company_trust_assessments
for each row execute function public.set_production_company_trust_assessment_metadata();

comment on table public.production_company_trust_assessments is
  'U6: lịch sử ảnh chụp bất biến của điểm uy tín; không cho client sửa hoặc xóa và không tự tạo đối tác ERP.';
