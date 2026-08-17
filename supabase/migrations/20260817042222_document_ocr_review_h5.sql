-- @codex H5: AI chỉ trích xuất dữ liệu giấy tờ; người có quyền phải duyệt trước khi áp dụng.

create table if not exists public.production_company_document_extractions (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (organization_id = 'mimin'),
  document_id uuid not null references public.production_company_documents(id) on delete cascade,
  extraction_status text not null default 'PENDING' check (extraction_status in ('PENDING','ACCEPTED','REJECTED')),
  provider text not null default 'GEMINI' check (provider = 'GEMINI'),
  model text not null,
  legal_name text,
  tax_code text,
  document_number text,
  issuer text,
  issued_on date,
  expires_on date,
  registered_address text,
  legal_representative text,
  summary text,
  raw_text_excerpt text,
  confidence smallint not null default 0 check (confidence between 0 and 100),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  check (expires_on is null or issued_on is null or expires_on >= issued_on),
  check (
    (extraction_status = 'PENDING' and reviewed_by is null and reviewed_at is null)
    or (extraction_status in ('ACCEPTED','REJECTED') and reviewed_by is not null and reviewed_at is not null)
  )
);

create index if not exists production_company_document_extractions_document_idx
  on public.production_company_document_extractions (document_id, created_at desc);
create index if not exists production_company_document_extractions_pending_idx
  on public.production_company_document_extractions (organization_id, created_at desc)
  where extraction_status = 'PENDING';

create or replace function public.guard_company_document_extraction_review()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.organization_id <> old.organization_id
    or new.document_id <> old.document_id
    or new.provider <> old.provider
    or new.model <> old.model
    or new.legal_name is distinct from old.legal_name
    or new.tax_code is distinct from old.tax_code
    or new.document_number is distinct from old.document_number
    or new.issuer is distinct from old.issuer
    or new.issued_on is distinct from old.issued_on
    or new.expires_on is distinct from old.expires_on
    or new.registered_address is distinct from old.registered_address
    or new.legal_representative is distinct from old.legal_representative
    or new.summary is distinct from old.summary
    or new.raw_text_excerpt is distinct from old.raw_text_excerpt
    or new.confidence <> old.confidence
    or new.created_by <> old.created_by
    or new.created_at <> old.created_at then
    raise exception 'Không được sửa dữ liệu AI đã trích xuất';
  end if;

  if old.extraction_status <> 'PENDING' then
    raise exception 'Kết quả trích xuất đã được xử lý';
  end if;
  if new.extraction_status = 'PENDING' then
    new.reviewed_by := null;
    new.reviewed_at := null;
  else
    new.reviewed_by := (select auth.uid());
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

create trigger production_company_document_extractions_review_guard
before update on public.production_company_document_extractions
for each row execute function public.guard_company_document_extraction_review();

create or replace function public.apply_accepted_company_document_extraction()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.extraction_status = 'PENDING' and new.extraction_status = 'ACCEPTED' then
    update public.production_company_documents
    set document_number = coalesce(nullif(trim(new.document_number), ''), document_number),
        issuer = coalesce(nullif(trim(new.issuer), ''), issuer),
        issued_on = coalesce(new.issued_on, issued_on),
        expires_on = coalesce(new.expires_on, expires_on),
        notes = concat_ws(E'\n', nullif(trim(notes), ''),
          nullif(concat_ws(' · ',
            case when nullif(trim(new.legal_name), '') is not null then 'Tên pháp lý: ' || trim(new.legal_name) end,
            case when nullif(trim(new.tax_code), '') is not null then 'MST: ' || trim(new.tax_code) end,
            case when nullif(trim(new.registered_address), '') is not null then 'Địa chỉ: ' || trim(new.registered_address) end,
            case when nullif(trim(new.legal_representative), '') is not null then 'Đại diện: ' || trim(new.legal_representative) end
          ), ''))
    where id = new.document_id and organization_id = new.organization_id;
  end if;
  return new;
end;
$$;

create trigger production_company_document_extractions_apply
after update on public.production_company_document_extractions
for each row execute function public.apply_accepted_company_document_extraction();

revoke all on function public.guard_company_document_extraction_review() from public, anon;
revoke all on function public.apply_accepted_company_document_extraction() from public, anon;
grant execute on function public.guard_company_document_extraction_review() to authenticated;
grant execute on function public.apply_accepted_company_document_extraction() to authenticated;

alter table public.production_company_document_extractions enable row level security;
revoke all on public.production_company_document_extractions from anon;
grant select, update on public.production_company_document_extractions to authenticated;

create policy "production_company_document_extractions_read"
on public.production_company_document_extractions for select to authenticated
using (organization_id = 'mimin' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant'));

create policy "production_company_document_extractions_review"
on public.production_company_document_extractions for update to authenticated
using (organization_id = 'mimin' and extraction_status = 'PENDING' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','accountant'))
with check (organization_id = 'mimin' and extraction_status in ('ACCEPTED','REJECTED') and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','accountant'));

comment on table public.production_company_document_extractions is
  'H5: kết quả OCR/trích xuất AI dạng đề xuất; chỉ áp dụng metadata giấy tờ sau khi người dùng chấp nhận.';
