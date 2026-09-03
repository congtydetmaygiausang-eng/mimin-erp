begin;

-- Dữ liệu dùng chung cho toàn bộ chuỗi Sợi -> Dệt -> Nhuộm.
-- payload giữ nguyên model camelCase của ứng dụng để không làm sai dữ liệu nghiệp vụ.
create table if not exists public.yarn_production_records (
  entity_type text not null check (entity_type in (
    'KHO_LOG',
    'PHIEU_NHAP_SOI',
    'LO_SOI',
    'LENH_DET',
    'LO_MOC',
    'ME_NHUOM',
    'NGHIEM_THU_MAU',
    'LO_VAI_TP'
  )),
  entity_id text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create index if not exists idx_yarn_production_records_updated_at
  on public.yarn_production_records (updated_at desc);

create or replace function public.set_yarn_production_record_audit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_yarn_production_record_audit on public.yarn_production_records;
create trigger trg_yarn_production_record_audit
before update on public.yarn_production_records
for each row execute function public.set_yarn_production_record_audit();

alter table public.yarn_production_records enable row level security;

drop policy if exists yarn_production_records_read on public.yarn_production_records;
create policy yarn_production_records_read
on public.yarn_production_records for select
to authenticated
using (true);

drop policy if exists yarn_production_records_write on public.yarn_production_records;
create policy yarn_production_records_write
on public.yarn_production_records for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.yarn_production_records to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'yarn_production_records'
  ) then
    alter publication supabase_realtime add table public.yarn_production_records;
  end if;
end;
$$;

notify pgrst, 'reload schema';
commit;
