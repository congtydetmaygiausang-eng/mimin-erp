-- @codex V5: chỉ mục bao phủ khóa ngoại theo Supabase database advisor.
create index if not exists production_company_registry_field_reviews_reconciliation_idx
  on public.production_company_registry_field_reviews (reconciliation_id);
create index if not exists production_company_registry_field_reviews_reviewer_idx
  on public.production_company_registry_field_reviews (reviewed_by);
