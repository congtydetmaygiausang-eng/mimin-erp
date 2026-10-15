-- ==============================================================================
-- MIMIN ERP: YARN PRODUCTION CHAIN & ATTACHMENT STORAGE MIGRATION
-- Copy toàn bộ đoạn script này vào Supabase Dashboard -> SQL Editor -> Nhấn RUN
-- ==============================================================================

begin;

-- 1. BẢNG DỮ LIỆU DÙNG CHUNG: yarn_production_records
create table if not exists public.yarn_production_records (
  entity_type text not null check (entity_type in (
    'PHIEU_SX_VAI',
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

create index if not exists idx_yarn_production_records_type
  on public.yarn_production_records (entity_type);

create or replace function public.set_yarn_production_record_audit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  if auth.uid() is not null then
    new.updated_by := auth.uid();
  end if;
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
to authenticated, anon
using (true);

drop policy if exists yarn_production_records_write on public.yarn_production_records;
create policy yarn_production_records_write
on public.yarn_production_records for all
to authenticated, anon
using (true)
with check (true);

grant select, insert, update, delete on public.yarn_production_records to authenticated, anon;

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

-- 2. TẠO BUCKET STORAGE CHO ẢNH CHỨNG TỪ: chung-tu-san-xuat
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chung-tu-san-xuat',
  'chung-tu-san-xuat',
  true,
  10485760, -- 10MB tối đa mỗi ảnh
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

drop policy if exists "ChungTu Public Read" on storage.objects;
create policy "ChungTu Public Read"
on storage.objects for select
using (bucket_id = 'chung-tu-san-xuat');

drop policy if exists "ChungTu Upload Any" on storage.objects;
create policy "ChungTu Upload Any"
on storage.objects for insert
with check (bucket_id = 'chung-tu-san-xuat');

drop policy if exists "ChungTu Update Any" on storage.objects;
create policy "ChungTu Update Any"
on storage.objects for update
using (bucket_id = 'chung-tu-san-xuat');

drop policy if exists "ChungTu Delete Any" on storage.objects;
create policy "ChungTu Delete Any"
on storage.objects for delete
using (bucket_id = 'chung-tu-san-xuat');

notify pgrst, 'reload schema';
commit;
