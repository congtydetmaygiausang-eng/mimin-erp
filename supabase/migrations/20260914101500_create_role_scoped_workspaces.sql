begin;

create table if not exists public.erp_organizations (
  id text primary key,
  code text not null unique,
  name text not null,
  organization_type text not null,
  tax_code text,
  status text not null default 'ACTIVE',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_organizations_type_check check (organization_type in ('SYSTEM', 'COMPANY', 'HOUSEHOLD_BUSINESS', 'WORKSHOP', 'SUPPLIER', 'CUSTOMER')),
  constraint erp_organizations_status_check check (status in ('ACTIVE', 'SUSPENDED', 'ARCHIVED'))
);

create table if not exists public.erp_organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.erp_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_role text not null,
  data_scope text not null default 'SELF',
  team_code text,
  is_active boolean not null default true,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id),
  constraint erp_org_members_role_check check (workspace_role in ('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'TEAM_LEAD', 'WORKER', 'DELIVERY', 'VIEWER', 'CUSTOMER')),
  constraint erp_org_members_scope_check check (data_scope in ('SELF', 'ASSIGNED', 'TEAM', 'ORGANIZATION', 'SYSTEM'))
);

create index if not exists idx_erp_org_members_user on public.erp_organization_members (user_id) where is_active;
create index if not exists idx_erp_org_members_org on public.erp_organization_members (organization_id) where is_active;

insert into public.erp_organizations (id, code, name, organization_type)
values ('mimin', 'MIMIN', 'MIMIN', 'SYSTEM')
on conflict (id) do nothing;

insert into public.erp_organization_members (organization_id, user_id, workspace_role, data_scope)
select
  'mimin',
  u.id,
  case
    when coalesce(u.raw_app_meta_data ->> 'role', '') = 'admin' then 'ADMIN'
    when coalesce(u.raw_app_meta_data ->> 'role', '') = 'accountant' then 'ACCOUNTANT'
    else 'WORKER'
  end,
  case
    when coalesce(u.raw_app_meta_data ->> 'role', '') = 'admin' then 'SYSTEM'
    when coalesce(u.raw_app_meta_data ->> 'role', '') in ('planner', 'accountant') then 'ORGANIZATION'
    else 'SELF'
  end
from auth.users u
where coalesce(u.raw_app_meta_data ->> 'role', '') not in ('partner', 'supplier', 'workshop_customer', 'buyer_customer')
on conflict (organization_id, user_id) do nothing;

insert into public.erp_organizations (id, code, name, organization_type)
select distinct
  'ncc:' || coalesce(u.raw_user_meta_data ->> 'ma_ncc', u.raw_user_meta_data ->> 'maNV'),
  coalesce(u.raw_user_meta_data ->> 'ma_ncc', u.raw_user_meta_data ->> 'maNV'),
  coalesce(u.raw_user_meta_data ->> 'organization_name', u.raw_user_meta_data ->> 'full_name', u.email, 'Đối tác'),
  case when coalesce(u.raw_app_meta_data ->> 'role', '') = 'supplier' then 'SUPPLIER' else 'WORKSHOP' end
from auth.users u
where coalesce(u.raw_app_meta_data ->> 'role', '') in ('partner', 'supplier')
  and coalesce(u.raw_user_meta_data ->> 'ma_ncc', u.raw_user_meta_data ->> 'maNV') is not null
on conflict (id) do nothing;

insert into public.erp_organization_members (organization_id, user_id, workspace_role, data_scope)
select
  'ncc:' || coalesce(u.raw_user_meta_data ->> 'ma_ncc', u.raw_user_meta_data ->> 'maNV'),
  u.id,
  'OWNER',
  'ORGANIZATION'
from auth.users u
where coalesce(u.raw_app_meta_data ->> 'role', '') in ('partner', 'supplier')
  and coalesce(u.raw_user_meta_data ->> 'ma_ncc', u.raw_user_meta_data ->> 'maNV') is not null
on conflict (organization_id, user_id) do nothing;

insert into public.erp_organizations (id, code, name, organization_type)
select distinct
  'kh:' || coalesce(u.raw_user_meta_data ->> 'ma_khach_hang', u.raw_user_meta_data ->> 'maNV'),
  coalesce(u.raw_user_meta_data ->> 'ma_khach_hang', u.raw_user_meta_data ->> 'maNV'),
  coalesce(u.raw_user_meta_data ->> 'organization_name', u.raw_user_meta_data ->> 'full_name', u.email, 'Khách hàng'),
  'CUSTOMER'
from auth.users u
where coalesce(u.raw_app_meta_data ->> 'role', '') in ('workshop_customer', 'buyer_customer')
  and coalesce(u.raw_user_meta_data ->> 'ma_khach_hang', u.raw_user_meta_data ->> 'maNV') is not null
on conflict (id) do nothing;

insert into public.erp_organization_members (organization_id, user_id, workspace_role, data_scope)
select
  'kh:' || coalesce(u.raw_user_meta_data ->> 'ma_khach_hang', u.raw_user_meta_data ->> 'maNV'),
  u.id,
  'CUSTOMER',
  'ORGANIZATION'
from auth.users u
where coalesce(u.raw_app_meta_data ->> 'role', '') in ('workshop_customer', 'buyer_customer')
  and coalesce(u.raw_user_meta_data ->> 'ma_khach_hang', u.raw_user_meta_data ->> 'maNV') is not null
on conflict (organization_id, user_id) do nothing;

create or replace function public.is_erp_organization_member(target_organization_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.erp_organization_members member
    where member.organization_id = target_organization_id
      and member.user_id = auth.uid()
      and member.is_active
  );
$$;

create or replace function public.has_erp_workspace_scope(target_organization_id text, allowed_scopes text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.erp_organization_members member
    where member.organization_id = target_organization_id
      and member.user_id = auth.uid()
      and member.is_active
      and member.data_scope = any(allowed_scopes)
  );
$$;

create or replace function public.has_erp_workspace_role(target_organization_id text, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.erp_organization_members member
    where member.organization_id = target_organization_id
      and member.user_id = auth.uid()
      and member.is_active
      and member.workspace_role = any(allowed_roles)
  );
$$;

revoke all on function public.is_erp_organization_member(text) from public;
revoke all on function public.has_erp_workspace_scope(text, text[]) from public;
revoke all on function public.has_erp_workspace_role(text, text[]) from public;
grant execute on function public.is_erp_organization_member(text) to authenticated;
grant execute on function public.has_erp_workspace_scope(text, text[]) to authenticated;
grant execute on function public.has_erp_workspace_role(text, text[]) to authenticated;

alter table public.erp_organizations enable row level security;
alter table public.erp_organization_members enable row level security;
grant select on public.erp_organizations, public.erp_organization_members to authenticated;
grant insert, update on public.erp_organizations, public.erp_organization_members to authenticated;

create policy erp_organizations_select on public.erp_organizations
for select to authenticated using (
  public.is_erp_organization_member(id)
  or public.has_erp_workspace_scope('mimin', array['SYSTEM'])
);

create policy erp_organization_members_select on public.erp_organization_members
for select to authenticated using (
  user_id = (select auth.uid())
  or public.has_erp_workspace_scope(organization_id, array['ORGANIZATION', 'SYSTEM'])
  or public.has_erp_workspace_scope('mimin', array['SYSTEM'])
);

create policy erp_organizations_manage on public.erp_organizations
for all to authenticated using (public.has_erp_workspace_scope('mimin', array['SYSTEM']))
with check (public.has_erp_workspace_scope('mimin', array['SYSTEM']));

create policy erp_organization_members_manage on public.erp_organization_members
for all to authenticated using (
  public.has_erp_workspace_scope('mimin', array['SYSTEM'])
  or public.has_erp_workspace_role(organization_id, array['OWNER', 'ADMIN'])
) with check (
  public.has_erp_workspace_scope('mimin', array['SYSTEM'])
  or public.has_erp_workspace_role(organization_id, array['OWNER', 'ADMIN'])
);

alter table public.phieu_dat_ncc_san_xuat
  add column if not exists owner_organization_id text not null default 'mimin' references public.erp_organizations(id),
  add column if not exists supplier_organization_id text references public.erp_organizations(id),
  add column if not exists customer_organization_id text references public.erp_organizations(id);

create or replace function public.ensure_phieu_dat_ncc_organizations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_organization_id is null then
    new.owner_organization_id := 'mimin';
  end if;
  if new.supplier_organization_id is null or new.supplier_organization_id = '' then
    new.supplier_organization_id := 'ncc:' || new.ma_ncc;
  end if;
  if new.ma_khach_hang is not null and new.ma_khach_hang <> ''
    and (new.customer_organization_id is null or new.customer_organization_id = '') then
    new.customer_organization_id := 'kh:' || new.ma_khach_hang;
  end if;

  insert into public.erp_organizations (id, code, name, organization_type, created_by)
  values (new.supplier_organization_id, new.ma_ncc, new.ma_ncc, 'SUPPLIER', auth.uid())
  on conflict (id) do nothing;

  if new.customer_organization_id is not null then
    insert into public.erp_organizations (id, code, name, organization_type, created_by)
    values (new.customer_organization_id, new.ma_khach_hang, new.ma_khach_hang, 'CUSTOMER', auth.uid())
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ensure_phieu_dat_ncc_organizations on public.phieu_dat_ncc_san_xuat;
create trigger trg_ensure_phieu_dat_ncc_organizations
before insert or update on public.phieu_dat_ncc_san_xuat
for each row execute function public.ensure_phieu_dat_ncc_organizations();

update public.phieu_dat_ncc_san_xuat
set supplier_organization_id = 'ncc:' || ma_ncc
where supplier_organization_id is null
  and exists (select 1 from public.erp_organizations organization where organization.id = 'ncc:' || ma_ncc);

update public.phieu_dat_ncc_san_xuat
set customer_organization_id = 'kh:' || ma_khach_hang
where customer_organization_id is null
  and ma_khach_hang is not null
  and exists (select 1 from public.erp_organizations organization where organization.id = 'kh:' || ma_khach_hang);

drop policy if exists phieu_dat_ncc_select on public.phieu_dat_ncc_san_xuat;
create policy phieu_dat_ncc_select on public.phieu_dat_ncc_san_xuat
for select to authenticated using (
  created_by = (select auth.uid())
  or public.is_erp_organization_member(owner_organization_id)
  or public.is_erp_organization_member(supplier_organization_id)
  or public.is_erp_organization_member(customer_organization_id)
  or public.has_erp_workspace_scope('mimin', array['SYSTEM'])
);

drop policy if exists phieu_dat_ncc_insert on public.phieu_dat_ncc_san_xuat;
create policy phieu_dat_ncc_insert on public.phieu_dat_ncc_san_xuat
for insert to authenticated with check (
  created_by = (select auth.uid())
  and public.has_erp_workspace_scope(owner_organization_id, array['ORGANIZATION', 'SYSTEM'])
);

drop policy if exists phieu_dat_ncc_update on public.phieu_dat_ncc_san_xuat;
create policy phieu_dat_ncc_update on public.phieu_dat_ncc_san_xuat
for update to authenticated using (
  public.has_erp_workspace_scope(owner_organization_id, array['ORGANIZATION', 'SYSTEM'])
  or public.has_erp_workspace_scope(supplier_organization_id, array['ORGANIZATION', 'SYSTEM'])
) with check (
  public.has_erp_workspace_scope(owner_organization_id, array['ORGANIZATION', 'SYSTEM'])
  or public.has_erp_workspace_scope(supplier_organization_id, array['ORGANIZATION', 'SYSTEM'])
);

notify pgrst, 'reload schema';
commit;
