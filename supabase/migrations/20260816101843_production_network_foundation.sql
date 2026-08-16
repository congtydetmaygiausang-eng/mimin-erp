-- @codex Giai đoạn 1: nền móng Mạng lưới sản xuất.
-- Migration chỉ tạo bảng mới; không sửa hoặc sao chép dữ liệu từ các danh mục cũ.

create table if not exists public.production_partners (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin'
    check (length(trim(organization_id)) > 0),
  partner_code text not null,
  legal_name text not null check (length(trim(legal_name)) > 0),
  tax_code text,
  phone text,
  email text,
  website text,
  contact_name text,
  address text,
  province text,
  district text,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'INACTIVE')),
  verification_status text not null default 'DISCOVERED'
    check (verification_status in ('DISCOVERED', 'REVIEWED', 'VERIFIED')),
  notes text,
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint production_partners_org_code_key unique (organization_id, partner_code)
);

create table if not exists public.production_partner_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin'
    check (length(trim(organization_id)) > 0),
  partner_id uuid not null references public.production_partners(id) on delete cascade,
  role text not null check (
    role in ('CUSTOMER', 'SATELLITE_PROCESSOR', 'MATERIAL_SUPPLIER', 'PACKAGING_FINISHER')
  ),
  created_at timestamptz not null default now(),
  constraint production_partner_roles_partner_role_key unique (partner_id, role)
);

create unique index if not exists production_partners_org_tax_code_key
  on public.production_partners (organization_id, tax_code)
  where tax_code is not null and length(trim(tax_code)) > 0;

create index if not exists production_partners_org_name_idx
  on public.production_partners (organization_id, lower(legal_name));

create index if not exists production_partners_org_phone_idx
  on public.production_partners (organization_id, phone)
  where phone is not null and length(trim(phone)) > 0;

create index if not exists production_partner_roles_org_role_idx
  on public.production_partner_roles (organization_id, role, partner_id);

create index if not exists production_partner_roles_partner_id_idx
  on public.production_partner_roles (partner_id);

create or replace function public.set_production_partner_updated_at()
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

drop trigger if exists production_partners_set_updated_at on public.production_partners;
create trigger production_partners_set_updated_at
before update on public.production_partners
for each row execute function public.set_production_partner_updated_at();

alter table public.production_partners enable row level security;
alter table public.production_partner_roles enable row level security;

revoke all on public.production_partners from anon;
revoke all on public.production_partner_roles from anon;
grant select, insert, update, delete on public.production_partners to authenticated;
grant select, insert, update, delete on public.production_partner_roles to authenticated;

drop policy if exists "production_partners_read" on public.production_partners;
create policy "production_partners_read"
on public.production_partners
for select
to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in (
    'admin', 'planner', 'warehouse', 'accountant', 'content', 'partner'
  )
);

drop policy if exists "production_partners_create" on public.production_partners;
create policy "production_partners_create"
on public.production_partners
for insert
to authenticated
with check (
  organization_id = 'mimin'
  and created_by = (select auth.uid())
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in (
    'admin', 'planner', 'warehouse', 'accountant'
  )
);

drop policy if exists "production_partners_update" on public.production_partners;
create policy "production_partners_update"
on public.production_partners
for update
to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in (
    'admin', 'planner', 'warehouse', 'accountant'
  )
)
with check (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in (
    'admin', 'planner', 'warehouse', 'accountant'
  )
);

drop policy if exists "production_partners_delete" on public.production_partners;
create policy "production_partners_delete"
on public.production_partners
for delete
to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('admin', 'accountant')
);

drop policy if exists "production_partner_roles_read" on public.production_partner_roles;
create policy "production_partner_roles_read"
on public.production_partner_roles
for select
to authenticated
using (
  organization_id = 'mimin'
  and exists (
    select 1
    from public.production_partners partner
    where partner.id = partner_id
      and partner.organization_id = production_partner_roles.organization_id
  )
);

drop policy if exists "production_partner_roles_create" on public.production_partner_roles;
create policy "production_partner_roles_create"
on public.production_partner_roles
for insert
to authenticated
with check (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in (
    'admin', 'planner', 'warehouse', 'accountant'
  )
  and exists (
    select 1
    from public.production_partners partner
    where partner.id = partner_id
      and partner.organization_id = production_partner_roles.organization_id
  )
);

drop policy if exists "production_partner_roles_delete" on public.production_partner_roles;
create policy "production_partner_roles_delete"
on public.production_partner_roles
for delete
to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in (
    'admin', 'planner', 'warehouse', 'accountant'
  )
);

create or replace function public.save_production_partner(
  p_id uuid,
  p_partner_code text,
  p_legal_name text,
  p_tax_code text,
  p_phone text,
  p_email text,
  p_website text,
  p_contact_name text,
  p_address text,
  p_province text,
  p_district text,
  p_status text,
  p_verification_status text,
  p_notes text,
  p_roles text[]
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_id uuid;
  invalid_role text;
begin
  if coalesce(array_length(p_roles, 1), 0) = 0 then
    raise exception 'Đối tác phải có ít nhất một vai trò';
  end if;

  select role_name
  into invalid_role
  from unnest(p_roles) as role_name
  where role_name not in (
    'CUSTOMER', 'SATELLITE_PROCESSOR', 'MATERIAL_SUPPLIER', 'PACKAGING_FINISHER'
  )
  limit 1;

  if invalid_role is not null then
    raise exception 'Vai trò không hợp lệ: %', invalid_role;
  end if;

  if p_id is null then
    insert into public.production_partners (
      organization_id, partner_code, legal_name, tax_code, phone, email,
      website, contact_name, address, province, district, status,
      verification_status, notes, created_by, updated_by
    ) values (
      'mimin', trim(p_partner_code), trim(p_legal_name), nullif(trim(p_tax_code), ''),
      nullif(trim(p_phone), ''), nullif(trim(p_email), ''), nullif(trim(p_website), ''),
      nullif(trim(p_contact_name), ''), nullif(trim(p_address), ''),
      nullif(trim(p_province), ''), nullif(trim(p_district), ''), p_status,
      p_verification_status, nullif(trim(p_notes), ''), (select auth.uid()), (select auth.uid())
    )
    returning id into saved_id;
  else
    update public.production_partners
    set partner_code = trim(p_partner_code),
        legal_name = trim(p_legal_name),
        tax_code = nullif(trim(p_tax_code), ''),
        phone = nullif(trim(p_phone), ''),
        email = nullif(trim(p_email), ''),
        website = nullif(trim(p_website), ''),
        contact_name = nullif(trim(p_contact_name), ''),
        address = nullif(trim(p_address), ''),
        province = nullif(trim(p_province), ''),
        district = nullif(trim(p_district), ''),
        status = p_status,
        verification_status = p_verification_status,
        notes = nullif(trim(p_notes), '')
    where id = p_id and organization_id = 'mimin'
    returning id into saved_id;

    if saved_id is null then
      raise exception 'Không tìm thấy đối tác hoặc không có quyền cập nhật';
    end if;
  end if;

  delete from public.production_partner_roles
  where partner_id = saved_id and organization_id = 'mimin';

  insert into public.production_partner_roles (organization_id, partner_id, role)
  select 'mimin', saved_id, role_name
  from (select distinct unnest(p_roles) as role_name) selected_roles;

  return saved_id;
end;
$$;

revoke all on function public.save_production_partner(
  uuid, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text[]
) from public, anon;
grant execute on function public.save_production_partner(
  uuid, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text[]
) to authenticated;

comment on table public.production_partners is
  'Hồ sơ đối tác dùng riêng cho phân hệ Mạng lưới sản xuất.';
comment on table public.production_partner_roles is
  'Vai trò nhiều-nhiều của đối tác trong Mạng lưới sản xuất.';
