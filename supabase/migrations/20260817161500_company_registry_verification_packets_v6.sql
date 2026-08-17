-- @codex V6: biên bản chốt kiểm duyệt pháp lý bất biến, tách khỏi hồ sơ/danh mục ERP.
create table if not exists public.production_company_registry_verification_packets (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (organization_id = 'mimin'),
  company_profile_id uuid not null references public.production_company_profiles(id) on delete cascade,
  reconciliation_id uuid not null references public.production_company_registry_reconciliations(id) on delete restrict,
  tax_code text not null check (tax_code ~ '^([0-9]{10}|[0-9]{10}-[0-9]{3})$'),
  packet_status text not null check (packet_status in ('VERIFIED','NEEDS_REVIEW')),
  review_count smallint not null check (review_count = 4),
  selected_fields jsonb not null check (jsonb_typeof(selected_fields) = 'object'),
  review_snapshot jsonb not null check (jsonb_typeof(review_snapshot) = 'array'),
  note text not null default '' check (char_length(note) <= 1000),
  finalized_by uuid not null references auth.users(id) on delete restrict,
  finalized_at timestamptz not null default now()
);

create index if not exists production_company_registry_packets_profile_time_idx
  on public.production_company_registry_verification_packets (company_profile_id, finalized_at desc, id desc);
create index if not exists production_company_registry_packets_reconciliation_idx
  on public.production_company_registry_verification_packets (reconciliation_id);
create index if not exists production_company_registry_packets_finalizer_idx
  on public.production_company_registry_verification_packets (finalized_by);

alter table public.production_company_registry_verification_packets enable row level security;
revoke all on public.production_company_registry_verification_packets from anon, authenticated;
grant select, insert on public.production_company_registry_verification_packets to authenticated;

create policy "production_company_registry_packets_read"
on public.production_company_registry_verification_packets for select to authenticated
using (
  organization_id = 'mimin'
  and (select auth.uid()) is not null
  and coalesce((select auth.jwt())->'app_metadata'->>'role','') in ('admin','planner','warehouse','accountant')
);

create policy "production_company_registry_packets_insert"
on public.production_company_registry_verification_packets for insert to authenticated
with check (
  organization_id = 'mimin'
  and finalized_by = (select auth.uid())
  and coalesce((select auth.jwt())->'app_metadata'->>'role','') in ('admin','planner','warehouse','accountant')
);

create or replace function public.set_production_company_registry_packet_metadata()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.organization_id := 'mimin';
  new.finalized_by := (select auth.uid());
  new.finalized_at := now();
  return new;
end;
$$;

revoke all on function public.set_production_company_registry_packet_metadata() from public, anon;
grant execute on function public.set_production_company_registry_packet_metadata() to authenticated;

create trigger production_company_registry_packets_metadata_v6
before insert on public.production_company_registry_verification_packets
for each row execute function public.set_production_company_registry_packet_metadata();

comment on table public.production_company_registry_verification_packets is
  'V6: biên bản chốt 4 trường bất biến; không tự cập nhật hồ sơ, điểm uy tín hoặc danh mục ERP.';
