-- @codex H6: nhật ký kiểm toán chỉ đọc cho hồ sơ công ty, độc lập danh mục ERP chính thức.

create table if not exists public.production_company_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique default gen_random_uuid()::text,
  organization_id text not null default 'mimin' check (organization_id = 'mimin'),
  company_profile_id uuid not null references public.production_company_profiles(id) on delete cascade,
  entity_type text not null check (entity_type in ('PROFILE','IMAGE','DOCUMENT','DOCUMENT_EXTRACTION')),
  entity_id uuid not null,
  event_type text not null check (event_type in (
    'PROFILE_CREATED','PROFILE_UPDATED','IMAGE_DISCOVERED','IMAGE_APPROVED','IMAGE_REJECTED',
    'DOCUMENT_UPLOADED','DOCUMENT_VERIFIED','DOCUMENT_REJECTED',
    'DOCUMENT_OCR_COMPLETED','DOCUMENT_OCR_ACCEPTED','DOCUMENT_OCR_REJECTED'
  )),
  title text not null check (length(trim(title)) between 1 and 300),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  actor_id uuid,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists production_company_audit_events_profile_time_idx
  on public.production_company_audit_events (company_profile_id, occurred_at desc, id desc);
create index if not exists production_company_audit_events_entity_idx
  on public.production_company_audit_events (entity_type, entity_id);

alter table public.production_company_audit_events enable row level security;
revoke all on public.production_company_audit_events from anon, authenticated;
grant select on public.production_company_audit_events to authenticated;

create policy "production_company_audit_events_read"
on public.production_company_audit_events for select to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant')
);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.capture_production_company_audit_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  profile_id uuid;
  entity_kind text;
  event_name text;
  event_title text;
  event_details jsonb := '{}'::jsonb;
  event_actor uuid;
  event_time timestamptz := now();
  stable_key text;
begin
  if tg_table_name = 'production_company_profiles' then
    profile_id := new.id;
    entity_kind := 'PROFILE';
    event_actor := coalesce((select auth.uid()), new.updated_by, new.created_by);
    if tg_op = 'INSERT' then
      event_name := 'PROFILE_CREATED'; event_title := 'Tạo hồ sơ công ty'; event_time := new.created_at;
      stable_key := 'profile:' || new.id || ':created';
    elsif to_jsonb(new) is distinct from to_jsonb(old) then
      event_name := 'PROFILE_UPDATED'; event_title := 'Cập nhật hồ sơ công ty'; event_time := new.updated_at;
    else return new;
    end if;
    event_details := jsonb_build_object('verificationStatus', new.verification_status, 'profileStatus', new.profile_status);

  elsif tg_table_name = 'production_company_images' then
    profile_id := new.company_profile_id; entity_kind := 'IMAGE';
    event_actor := coalesce((select auth.uid()), new.reviewed_by, new.created_by);
    if tg_op = 'INSERT' then
      event_name := 'IMAGE_DISCOVERED'; event_title := 'Thu thập ảnh ứng viên'; event_time := new.created_at;
      stable_key := 'image:' || new.id || ':discovered';
    elsif new.review_status is distinct from old.review_status then
      event_name := case new.review_status when 'APPROVED' then 'IMAGE_APPROVED' else 'IMAGE_REJECTED' end;
      event_title := case new.review_status when 'APPROVED' then 'Duyệt và lưu ảnh công ty' else 'Loại ảnh ứng viên' end;
      event_time := coalesce(new.reviewed_at, now()); stable_key := 'image:' || new.id || ':review:' || new.review_status;
    else return new;
    end if;
    event_details := jsonb_build_object('category', new.image_category, 'status', new.review_status, 'archivalStatus', new.archival_status);

  elsif tg_table_name = 'production_company_documents' then
    profile_id := new.company_profile_id; entity_kind := 'DOCUMENT';
    event_actor := coalesce((select auth.uid()), new.reviewed_by, new.uploaded_by);
    if tg_op = 'INSERT' then
      event_name := 'DOCUMENT_UPLOADED'; event_title := 'Tải giấy tờ vào vùng chờ'; event_time := new.created_at;
      stable_key := 'document:' || new.id || ':uploaded';
    elsif new.review_status is distinct from old.review_status then
      event_name := case new.review_status when 'VERIFIED' then 'DOCUMENT_VERIFIED' else 'DOCUMENT_REJECTED' end;
      event_title := case new.review_status when 'VERIFIED' then 'Xác minh giấy tờ' else 'Loại giấy tờ' end;
      event_time := coalesce(new.reviewed_at, now()); stable_key := 'document:' || new.id || ':review:' || new.review_status;
    else return new;
    end if;
    event_details := jsonb_build_object('documentType', new.document_type, 'status', new.review_status, 'title', new.title);

  elsif tg_table_name = 'production_company_document_extractions' then
    select document.company_profile_id into profile_id
    from public.production_company_documents document where document.id = new.document_id;
    if profile_id is null then return new; end if;
    entity_kind := 'DOCUMENT_EXTRACTION';
    event_actor := coalesce((select auth.uid()), new.reviewed_by, new.created_by);
    if tg_op = 'INSERT' then
      event_name := 'DOCUMENT_OCR_COMPLETED'; event_title := 'AI hoàn tất trích xuất giấy tờ'; event_time := new.created_at;
      stable_key := 'extraction:' || new.id || ':completed';
    elsif new.extraction_status is distinct from old.extraction_status then
      event_name := case new.extraction_status when 'ACCEPTED' then 'DOCUMENT_OCR_ACCEPTED' else 'DOCUMENT_OCR_REJECTED' end;
      event_title := case new.extraction_status when 'ACCEPTED' then 'Áp dụng metadata do AI đề xuất' else 'Bỏ kết quả trích xuất AI' end;
      event_time := coalesce(new.reviewed_at, now()); stable_key := 'extraction:' || new.id || ':review:' || new.extraction_status;
    else return new;
    end if;
    event_details := jsonb_build_object('provider', new.provider, 'model', new.model, 'confidence', new.confidence, 'status', new.extraction_status);
  else
    return new;
  end if;

  insert into public.production_company_audit_events (
    event_key, organization_id, company_profile_id, entity_type, entity_id,
    event_type, title, details, actor_id, occurred_at
  ) values (
    coalesce(stable_key, gen_random_uuid()::text), 'mimin', profile_id, entity_kind, new.id,
    event_name, event_title, event_details, event_actor, event_time
  ) on conflict (event_key) do nothing;
  return new;
end;
$$;

revoke all on function private.capture_production_company_audit_event() from public, anon, authenticated;

create trigger production_company_profiles_audit_h6
after insert or update on public.production_company_profiles
for each row execute function private.capture_production_company_audit_event();
create trigger production_company_images_audit_h6
after insert or update on public.production_company_images
for each row execute function private.capture_production_company_audit_event();
create trigger production_company_documents_audit_h6
after insert or update on public.production_company_documents
for each row execute function private.capture_production_company_audit_event();
create trigger production_company_document_extractions_audit_h6
after insert or update on public.production_company_document_extractions
for each row execute function private.capture_production_company_audit_event();

-- Backfill các cột mốc đã có từ H1-H5; khóa event_key ngăn tạo trùng.
insert into public.production_company_audit_events (event_key,organization_id,company_profile_id,entity_type,entity_id,event_type,title,details,actor_id,occurred_at)
select 'profile:'||id||':created','mimin',id,'PROFILE',id,'PROFILE_CREATED','Tạo hồ sơ công ty',jsonb_build_object('verificationStatus',verification_status,'profileStatus',profile_status),created_by,created_at
from public.production_company_profiles on conflict (event_key) do nothing;

insert into public.production_company_audit_events (event_key,organization_id,company_profile_id,entity_type,entity_id,event_type,title,details,actor_id,occurred_at)
select 'image:'||id||':discovered','mimin',company_profile_id,'IMAGE',id,'IMAGE_DISCOVERED','Thu thập ảnh ứng viên',jsonb_build_object('category',image_category,'status',review_status,'archivalStatus',archival_status),created_by,created_at
from public.production_company_images on conflict (event_key) do nothing;

insert into public.production_company_audit_events (event_key,organization_id,company_profile_id,entity_type,entity_id,event_type,title,details,actor_id,occurred_at)
select 'image:'||id||':review:'||review_status,'mimin',company_profile_id,'IMAGE',id,case review_status when 'APPROVED' then 'IMAGE_APPROVED' else 'IMAGE_REJECTED' end,case review_status when 'APPROVED' then 'Duyệt và lưu ảnh công ty' else 'Loại ảnh ứng viên' end,jsonb_build_object('category',image_category,'status',review_status,'archivalStatus',archival_status),reviewed_by,coalesce(reviewed_at,created_at)
from public.production_company_images where review_status in ('APPROVED','REJECTED') on conflict (event_key) do nothing;

insert into public.production_company_audit_events (event_key,organization_id,company_profile_id,entity_type,entity_id,event_type,title,details,actor_id,occurred_at)
select 'document:'||id||':uploaded','mimin',company_profile_id,'DOCUMENT',id,'DOCUMENT_UPLOADED','Tải giấy tờ vào vùng chờ',jsonb_build_object('documentType',document_type,'status',review_status,'title',title),uploaded_by,created_at
from public.production_company_documents on conflict (event_key) do nothing;

insert into public.production_company_audit_events (event_key,organization_id,company_profile_id,entity_type,entity_id,event_type,title,details,actor_id,occurred_at)
select 'document:'||id||':review:'||review_status,'mimin',company_profile_id,'DOCUMENT',id,case review_status when 'VERIFIED' then 'DOCUMENT_VERIFIED' else 'DOCUMENT_REJECTED' end,case review_status when 'VERIFIED' then 'Xác minh giấy tờ' else 'Loại giấy tờ' end,jsonb_build_object('documentType',document_type,'status',review_status,'title',title),reviewed_by,coalesce(reviewed_at,created_at)
from public.production_company_documents where review_status in ('VERIFIED','REJECTED') on conflict (event_key) do nothing;

insert into public.production_company_audit_events (event_key,organization_id,company_profile_id,entity_type,entity_id,event_type,title,details,actor_id,occurred_at)
select 'extraction:'||extraction.id||':completed','mimin',document.company_profile_id,'DOCUMENT_EXTRACTION',extraction.id,'DOCUMENT_OCR_COMPLETED','AI hoàn tất trích xuất giấy tờ',jsonb_build_object('provider',extraction.provider,'model',extraction.model,'confidence',extraction.confidence,'status',extraction.extraction_status),extraction.created_by,extraction.created_at
from public.production_company_document_extractions extraction join public.production_company_documents document on document.id=extraction.document_id
on conflict (event_key) do nothing;

insert into public.production_company_audit_events (event_key,organization_id,company_profile_id,entity_type,entity_id,event_type,title,details,actor_id,occurred_at)
select 'extraction:'||extraction.id||':review:'||extraction.extraction_status,'mimin',document.company_profile_id,'DOCUMENT_EXTRACTION',extraction.id,case extraction.extraction_status when 'ACCEPTED' then 'DOCUMENT_OCR_ACCEPTED' else 'DOCUMENT_OCR_REJECTED' end,case extraction.extraction_status when 'ACCEPTED' then 'Áp dụng metadata do AI đề xuất' else 'Bỏ kết quả trích xuất AI' end,jsonb_build_object('provider',extraction.provider,'model',extraction.model,'confidence',extraction.confidence,'status',extraction.extraction_status),extraction.reviewed_by,coalesce(extraction.reviewed_at,extraction.created_at)
from public.production_company_document_extractions extraction join public.production_company_documents document on document.id=extraction.document_id
where extraction.extraction_status in ('ACCEPTED','REJECTED') on conflict (event_key) do nothing;

comment on table public.production_company_audit_events is
  'H6: nhật ký bất biến, chỉ đọc về hồ sơ/ảnh/giấy tờ/OCR; không chứa toàn văn giấy tờ và không liên kết danh mục ERP.';
