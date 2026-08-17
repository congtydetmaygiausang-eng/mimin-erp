-- @codex H3: lưu bền vững ảnh đã duyệt trong Supabase Storage riêng tư.

alter table public.production_company_images
  add column if not exists archival_status text not null default 'REMOTE'
    check (archival_status in ('REMOTE','ARCHIVED','FAILED')),
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_mime_type text,
  add column if not exists archived_bytes integer check (archived_bytes is null or archived_bytes between 1 and 10485760),
  add constraint production_company_images_archive_consistency check (
    (archival_status = 'ARCHIVED' and storage_bucket = 'production-company-images' and storage_path is not null and archived_at is not null and archived_mime_type is not null and archived_bytes is not null)
    or (archival_status in ('REMOTE','FAILED') and storage_path is null and archived_at is null)
  ),
  add constraint production_company_images_approved_archive check (
    review_status <> 'APPROVED' or archival_status = 'ARCHIVED'
  );

create index if not exists production_company_images_archive_idx
  on public.production_company_images (organization_id, archival_status, archived_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'production-company-images',
  'production-company-images',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "production_company_images_private_read" on storage.objects;
create policy "production_company_images_private_read" on storage.objects
for select to authenticated using (
  bucket_id = 'production-company-images' and
  storage.allow_any_operation(array['object.get_authenticated_info','object.get_authenticated']) and
  ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant','content','partner') and
  exists (
    select 1 from public.production_company_images image
    where image.organization_id = 'mimin'
      and image.review_status = 'APPROVED'
      and image.archival_status = 'ARCHIVED'
      and image.storage_path = storage.objects.name
  )
);

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
      new.reviewed_by := coalesce((select auth.uid()), new.reviewed_by);
      new.reviewed_at := coalesce(new.reviewed_at, now());
      if new.reviewed_by is null then raise exception 'Thiếu người duyệt ảnh'; end if;
      if new.review_status = 'REJECTED' then new.is_primary := false; end if;
    end if;
  else
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
  end if;
  return new;
end;
$$;

comment on column public.production_company_images.storage_path is
  'H3: đường dẫn riêng tư sau khi ảnh được tải, kiểm tra và duyệt trên máy chủ.';
