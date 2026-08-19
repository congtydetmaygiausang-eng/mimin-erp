-- @codex T2: lưu nội dung thu thập Tavily có truy xuất nguồn; không cập nhật danh mục ERP.

alter table public.production_company_sources
  add column if not exists source_excerpt text,
  add column if not exists raw_content text,
  add column if not exists relevance_score numeric(5,4),
  add column if not exists search_query text;

alter table public.production_company_sources
  drop constraint if exists production_company_sources_relevance_score_check,
  add constraint production_company_sources_relevance_score_check
    check (relevance_score is null or relevance_score between 0 and 1);

create index if not exists production_company_sources_type_score_idx
  on public.production_company_sources
  (company_profile_id, source_type, relevance_score desc nulls last, captured_at desc);

comment on column public.production_company_sources.source_excerpt is
  'T2: đoạn trích ngắn dùng để đối chiếu và hiển thị nguồn.';
comment on column public.production_company_sources.raw_content is
  'T2: nội dung văn bản Tavily advanced; không được coi là dữ liệu đã xác minh.';
comment on column public.production_company_sources.relevance_score is
  'T2: điểm liên quan 0..1 do nhà cung cấp tìm kiếm trả về.';
comment on column public.production_company_sources.search_query is
  'T2: truy vấn đã tạo ra nguồn để kiểm toán và tái lập kết quả.';
