-- @codex Giai đoạn 3: vùng đệm kết quả tìm kiếm, tách biệt danh mục chính.
create table public.production_discovery_candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (length(trim(organization_id)) > 0),
  role text not null check (role in ('CUSTOMER','SATELLITE_PROCESSOR','MATERIAL_SUPPLIER','PACKAGING_FINISHER')),
  search_query text not null,
  legal_name text not null check (length(trim(legal_name)) > 0),
  address text, province text, district text, phone text, website text,
  latitude double precision, longitude double precision,
  source_provider text not null,
  source_url text not null,
  external_id text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  matched_partner_id uuid references public.production_partners(id) on delete set null,
  raw_data jsonb not null default '{}'::jsonb,
  discovered_by uuid default auth.uid(),
  discovered_at timestamptz not null default now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  unique (organization_id, source_provider, external_id),
  check ((latitude is null) = (longitude is null)),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create index production_discovery_org_status_idx
  on public.production_discovery_candidates (organization_id, status, discovered_at desc);
create index production_discovery_partner_idx
  on public.production_discovery_candidates (matched_partner_id) where matched_partner_id is not null;

alter table public.production_discovery_candidates enable row level security;
revoke all on public.production_discovery_candidates from anon;
grant select, insert, update on public.production_discovery_candidates to authenticated;

create policy "production_discovery_read" on public.production_discovery_candidates
for select to authenticated using (
  organization_id='mimin' and ((select auth.jwt())->'app_metadata'->>'role') in
  ('admin','planner','warehouse','accountant','content','partner')
);
create policy "production_discovery_create" on public.production_discovery_candidates
for insert to authenticated with check (
  organization_id='mimin' and discovered_by=(select auth.uid()) and
  ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant')
);
create policy "production_discovery_update" on public.production_discovery_candidates
for update to authenticated
using (organization_id='mimin' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant'))
with check (organization_id='mimin' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant'));

comment on table public.production_discovery_candidates is
  'Vùng đệm kết quả tìm kiếm Giai đoạn 3; chỉ ứng viên được duyệt mới vào production_partners.';

create function public.approve_production_candidate(p_candidate_id uuid)
returns uuid language plpgsql security invoker set search_path=public as $$
declare candidate public.production_discovery_candidates; partner_id uuid;
begin
  select * into candidate from public.production_discovery_candidates
  where id=p_candidate_id and organization_id='mimin' for update;
  if candidate.id is null then raise exception 'Không tìm thấy ứng viên'; end if;
  if candidate.status='APPROVED' and candidate.matched_partner_id is not null then return candidate.matched_partner_id; end if;
  if candidate.status='REJECTED' then raise exception 'Ứng viên đã bị loại'; end if;
  insert into public.production_partners (
    organization_id, partner_code, legal_name, phone, website, address, province, district,
    latitude, longitude, status, verification_status, notes, created_by, updated_by
  ) values (
    'mimin', 'DISC-'||upper(substr(replace(candidate.id::text,'-',''),1,8)), candidate.legal_name,
    candidate.phone, candidate.website, candidate.address, candidate.province, candidate.district,
    candidate.latitude, candidate.longitude, 'ACTIVE', 'DISCOVERED',
    'Nguồn: '||candidate.source_provider||' — '||candidate.source_url, (select auth.uid()), (select auth.uid())
  ) returning id into partner_id;
  insert into public.production_partner_roles(organization_id,partner_id,role)
  values ('mimin',partner_id,candidate.role);
  update public.production_discovery_candidates set status='APPROVED', matched_partner_id=partner_id,
    reviewed_by=(select auth.uid()), reviewed_at=now() where id=candidate.id;
  return partner_id;
end; $$;
revoke all on function public.approve_production_candidate(uuid) from public, anon;
grant execute on function public.approve_production_candidate(uuid) to authenticated;
