-- @codex U5: xác minh thực địa/thông tin liên hệ, tách biệt danh mục đối tác ERP chính thức.

create table if not exists public.production_company_manual_checks (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (organization_id = 'mimin'),
  company_profile_id uuid not null references public.production_company_profiles(id) on delete cascade,
  check_type text not null check (check_type in ('PHONE_REACHED','ZALO_CONFIRMED','SITE_VISITED','DOCUMENTS_MATCHED')),
  check_status text not null default 'CONFIRMED' check (check_status in ('CONFIRMED','REVOKED')),
  notes text not null default '' check (length(notes) <= 1000),
  checked_by uuid not null default auth.uid(),
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_profile_id, check_type)
);

create index if not exists production_company_manual_checks_profile_status_idx
  on public.production_company_manual_checks (company_profile_id, check_status, checked_at desc);

alter table public.production_company_manual_checks enable row level security;
revoke all on public.production_company_manual_checks from anon, authenticated;
grant select, insert, update on public.production_company_manual_checks to authenticated;

create policy "production_company_manual_checks_read"
on public.production_company_manual_checks for select to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant')
);

create policy "production_company_manual_checks_insert"
on public.production_company_manual_checks for insert to authenticated
with check (
  organization_id = 'mimin'
  and checked_by = (select auth.uid())
  and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant')
  and exists (
    select 1 from public.production_company_profiles profile
    where profile.id = company_profile_id and profile.organization_id = organization_id
  )
);

create policy "production_company_manual_checks_update"
on public.production_company_manual_checks for update to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant')
)
with check (
  organization_id = 'mimin'
  and checked_by = (select auth.uid())
  and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant')
);

create or replace function public.set_production_company_manual_check_metadata()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  new.organization_id := 'mimin';
  new.checked_by := (select auth.uid());
  new.checked_at := now();
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_production_company_manual_check_metadata() from public, anon;
grant execute on function public.set_production_company_manual_check_metadata() to authenticated;

create trigger production_company_manual_checks_metadata_u5
before insert or update on public.production_company_manual_checks
for each row execute function public.set_production_company_manual_check_metadata();

comment on table public.production_company_manual_checks is
  'U5: trạng thái xác nhận thủ công mới nhất của nhân viên; chỉ ảnh hưởng hồ sơ uy tín, không tự tạo đối tác ERP.';
