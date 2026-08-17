-- @codex H2: ảnh ứng viên của hồ sơ công ty, độc lập danh mục đối tác chính thức.

create table if not exists public.production_company_images (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (length(trim(organization_id)) > 0),
  company_profile_id uuid not null references public.production_company_profiles(id) on delete cascade,
  image_url text not null check (image_url ~ '^https://'),
  source_page_url text not null check (source_page_url ~ '^https://'),
  source_provider text not null default 'TAVILY',
  source_title text,
  caption text,
  image_category text not null default 'OTHER' check (image_category in ('LOGO','FACADE','FACTORY','MACHINERY','PRODUCT','CERTIFICATE','OTHER')),
  review_status text not null default 'PENDING' check (review_status in ('PENDING','APPROVED','REJECTED')),
  match_score smallint not null default 0 check (match_score between 0 and 100),
  is_primary boolean not null default false,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  constraint production_company_images_profile_url_key unique (company_profile_id, image_url),
  check ((review_status = 'PENDING' and reviewed_at is null and reviewed_by is null) or
         (review_status in ('APPROVED','REJECTED') and reviewed_at is not null and reviewed_by is not null)),
  check (not is_primary or review_status = 'APPROVED')
);

create index if not exists production_company_images_profile_status_idx
  on public.production_company_images (company_profile_id, review_status, match_score desc, created_at desc);
create index if not exists production_company_images_org_status_idx
  on public.production_company_images (organization_id, review_status, created_at desc);

create or replace function public.review_production_company_image()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.organization_id <> old.organization_id or
     new.company_profile_id <> old.company_profile_id or
     new.image_url <> old.image_url or
     new.source_page_url <> old.source_page_url or
     new.created_by is distinct from old.created_by or
     new.created_at <> old.created_at then
    raise exception 'Không được thay đổi định danh hoặc nguồn gốc ảnh';
  end if;
  if new.review_status is distinct from old.review_status then
    if new.review_status = 'PENDING' then
      new.reviewed_by := null;
      new.reviewed_at := null;
      new.is_primary := false;
    else
      new.reviewed_by := (select auth.uid());
      new.reviewed_at := now();
      if new.review_status = 'REJECTED' then new.is_primary := false; end if;
    end if;
  else
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
  end if;
  return new;
end;
$$;

create trigger production_company_images_review_guard
before update on public.production_company_images
for each row execute function public.review_production_company_image();

revoke all on function public.review_production_company_image() from public, anon;
grant execute on function public.review_production_company_image() to authenticated;

alter table public.production_company_images enable row level security;
revoke all on public.production_company_images from anon;
grant select, insert, update on public.production_company_images to authenticated;

create policy "production_company_images_read" on public.production_company_images
for select to authenticated using (
  organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in
  ('admin','planner','warehouse','accountant','content','partner')
);

create policy "production_company_images_create" on public.production_company_images
for insert to authenticated with check (
  organization_id = 'mimin' and created_by = (select auth.uid()) and review_status = 'PENDING' and is_primary = false and
  ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant') and
  exists (
    select 1 from public.production_company_profiles profile
    where profile.id = company_profile_id and profile.organization_id = production_company_images.organization_id
  )
);

create policy "production_company_images_update" on public.production_company_images
for update to authenticated
using (
  organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in
  ('admin','planner','warehouse','accountant')
)
with check (
  organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in
  ('admin','planner','warehouse','accountant')
);

comment on table public.production_company_images is
  'H2: ảnh ứng viên có nguồn của hồ sơ công ty; phải duyệt trước khi dùng chính thức.';
