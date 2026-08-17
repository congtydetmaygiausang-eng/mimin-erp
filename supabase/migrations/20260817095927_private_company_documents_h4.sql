-- @codex H4: hồ sơ giấy tờ pháp lý riêng tư, không liên kết danh mục đối tác chính thức.

create table if not exists public.production_company_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (organization_id = 'mimin'),
  company_profile_id uuid not null references public.production_company_profiles(id) on delete cascade,
  document_type text not null check (document_type in ('BUSINESS_LICENSE','TAX_REGISTRATION','BRAND_LICENSE','CERTIFICATE','FACTORY_LICENSE','OTHER')),
  title text not null check (length(trim(title)) between 1 and 200),
  document_number text,
  issuer text,
  issued_on date,
  expires_on date,
  notes text,
  original_filename text not null,
  storage_bucket text not null default 'production-company-documents' check (storage_bucket = 'production-company-documents'),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png','image/webp')),
  file_bytes integer not null check (file_bytes between 1 and 15728640),
  review_status text not null default 'PENDING' check (review_status in ('PENDING','VERIFIED','REJECTED')),
  uploaded_by uuid not null default auth.uid(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_on is null or issued_on is null or expires_on >= issued_on),
  check ((review_status = 'PENDING' and reviewed_by is null and reviewed_at is null) or (review_status in ('VERIFIED','REJECTED') and reviewed_by is not null and reviewed_at is not null))
);

create index if not exists production_company_documents_profile_idx on public.production_company_documents (company_profile_id, review_status, created_at desc);
create index if not exists production_company_documents_org_expiry_idx on public.production_company_documents (organization_id, expires_on) where expires_on is not null;

create or replace function public.review_production_company_document()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.organization_id <> old.organization_id or new.company_profile_id <> old.company_profile_id or new.storage_path <> old.storage_path or new.uploaded_by <> old.uploaded_by or new.created_at <> old.created_at then
    raise exception 'Không được thay đổi định danh hoặc tệp gốc';
  end if;
  if new.review_status is distinct from old.review_status then
    if new.review_status = 'PENDING' then new.reviewed_by := null; new.reviewed_at := null;
    else new.reviewed_by := coalesce((select auth.uid()), new.reviewed_by); new.reviewed_at := coalesce(new.reviewed_at, now()); end if;
  else new.reviewed_by := old.reviewed_by; new.reviewed_at := old.reviewed_at; end if;
  return new;
end; $$;
create trigger production_company_documents_review_guard before update on public.production_company_documents for each row execute function public.review_production_company_document();
revoke all on function public.review_production_company_document() from public, anon;
grant execute on function public.review_production_company_document() to authenticated;

alter table public.production_company_documents enable row level security;
revoke all on public.production_company_documents from anon;
grant select, insert, update on public.production_company_documents to authenticated;
create policy "production_company_documents_read" on public.production_company_documents for select to authenticated using (organization_id='mimin' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant'));
create policy "production_company_documents_create" on public.production_company_documents for insert to authenticated with check (organization_id='mimin' and uploaded_by=(select auth.uid()) and review_status='PENDING' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','accountant'));
create policy "production_company_documents_update" on public.production_company_documents for update to authenticated using (organization_id='mimin' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','accountant')) with check (organization_id='mimin' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','accountant'));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('production-company-documents','production-company-documents',false,15728640,array['application/pdf','image/jpeg','image/png','image/webp']::text[]) on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "production_company_documents_private_read" on storage.objects for select to authenticated using (bucket_id='production-company-documents' and storage.allow_any_operation(array['object.get_authenticated_info','object.get_authenticated']) and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant') and exists(select 1 from public.production_company_documents document where document.organization_id='mimin' and document.storage_path=storage.objects.name));

comment on table public.production_company_documents is 'H4: giấy tờ pháp lý riêng tư của hồ sơ công ty, chưa OCR và chưa tự xác minh.';
