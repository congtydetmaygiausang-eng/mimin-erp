-- @codex V2: dữ liệu bổ sung từ trang MaSoThue công khai, không thay thế nguồn pháp lý chính.

alter table public.production_company_registry_cache
  add column if not exists representative_name text not null default '' check (length(representative_name) <= 300),
  add column if not exists phone text not null default '' check (length(phone) <= 50),
  add column if not exists operation_date date,
  add column if not exists managing_tax_authority text not null default '' check (length(managing_tax_authority) <= 300),
  add column if not exists business_type text not null default '' check (length(business_type) <= 300),
  add column if not exists main_business_line text not null default '' check (length(main_business_line) <= 500),
  add column if not exists source_updated_at timestamptz;

alter table public.production_company_field_evidence
  drop constraint if exists production_company_field_evidence_field_name_check;
alter table public.production_company_field_evidence
  add constraint production_company_field_evidence_field_name_check
  check (field_name in (
    'TAX_CODE','LEGAL_NAME','INTERNATIONAL_NAME','SHORT_NAME','REGISTERED_ADDRESS','TAXPAYER_STATUS',
    'REPRESENTATIVE_NAME','PHONE','OPERATION_DATE','MANAGING_TAX_AUTHORITY','BUSINESS_TYPE','MAIN_BUSINESS_LINE'
  ));

comment on column public.production_company_registry_cache.representative_name is 'V2: người đại diện theo nguồn MaSoThue; cần đối chiếu trước khi duyệt.';
comment on column public.production_company_registry_cache.source_updated_at is 'Thời điểm nguồn công khai tự công bố đã cập nhật, khác fetched_at của MIMIN.';
