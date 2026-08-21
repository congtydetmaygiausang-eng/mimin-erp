-- @codex MIMIN GROUP - Search Profile Engine (thí điểm). Đây là LỚP CẤU HÌNH BỔ SUNG
-- cho pipeline tìm kiếm đã có (search-engine.ts) - KHÔNG thay Query Builder/Scoring Engine
-- lõi. Mỗi profile chỉ bổ sung ngữ cảnh (synonyms/exclusion/query gợi ý) vào system prompt
-- và lọc hậu kiểm nhẹ. status DRAFT không ảnh hưởng hành vi hiện có; chỉ ACTIVE mới áp dụng.

create table if not exists public.search_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (length(trim(organization_id)) > 0),
  code text not null,
  name text not null check (length(trim(name)) > 0),
  intent text not null,
  entity_type text not null,
  config jsonb not null default '{}'::jsonb,
  scoring_profile jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version >= 1),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint search_profiles_org_code_key unique (organization_id, code)
);

-- Chỉ 1 bản ACTIVE cho mỗi (organization_id, entity_type) tại một thời điểm - tránh xung đột
-- ngữ cảnh khi nhiều profile cùng khớp 1 loại đối tác.
create unique index if not exists search_profiles_one_active_per_entity
  on public.search_profiles (organization_id, entity_type)
  where status = 'ACTIVE';

create or replace function public.set_search_profiles_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end;
$$;

drop trigger if exists search_profiles_set_updated_at on public.search_profiles;
create trigger search_profiles_set_updated_at
before update on public.search_profiles
for each row execute function public.set_search_profiles_updated_at();

alter table public.search_profiles enable row level security;

revoke all on public.search_profiles from anon;
grant select, insert, update on public.search_profiles to authenticated;

drop policy if exists "search_profiles_read" on public.search_profiles;
create policy "search_profiles_read"
on public.search_profiles
for select
to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in (
    'admin', 'planner', 'warehouse', 'accountant', 'content', 'partner'
  )
);

-- Ghi/duyệt profile chỉ dành cho admin - đây là thay đổi ảnh hưởng ngữ cảnh AI cho toàn bộ
-- tổ chức, không phải dữ liệu tác nghiệp thường ngày như mimin_group_agent_config.
drop policy if exists "search_profiles_write" on public.search_profiles;
create policy "search_profiles_write"
on public.search_profiles
for insert
to authenticated
with check (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "search_profiles_update" on public.search_profiles;
create policy "search_profiles_update"
on public.search_profiles
for update
to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

comment on table public.search_profiles is
  'MIMIN GROUP: Search Profile config (metadata/filters/synonyms/query templates/sources/scoring/output fields) theo entity_type. Lớp bổ sung ngữ cảnh cho AI Search Agent - không thay Query Builder lõi. status DRAFT không ảnh hưởng hành vi; chỉ ACTIVE mới áp dụng, tối đa 1 ACTIVE / entity_type.';

-- Seed Profile 01 - GARMENT_FACTORY, trạng thái DRAFT (chưa áp dụng, chờ admin duyệt sau khi
-- test). Nội dung khớp bản A-H đã trình bày và được duyệt trong phiên làm việc.
insert into public.search_profiles (organization_id, code, name, intent, entity_type, config, scoring_profile, version, status)
values (
  'mimin',
  'GARMENT_FACTORY',
  'Xưởng may / nhà máy sản xuất quần áo trực tiếp',
  'FACTORY_SEARCH',
  'SATELLITE_PROCESSOR',
  '{
    "requiredFilters": ["location"],
    "optionalFilters": ["radiusKm", "productType", "minMonthlyCapacity", "minMoq", "maxMoq", "directFactoryOnly", "requiredCertifications"],
    "defaultFilters": { "radiusKm": 20 },
    "queryTemplates": [
      "xưởng may {product} {location}",
      "nhà máy sản xuất {product} {location}",
      "xưởng sản xuất {product} nhận đơn sỉ {location}",
      "{product} manufacturer factory {location}",
      "{product} OEM garment factory {location}"
    ],
    "preferredSources": ["TAVILY", "BRAVE", "GEMINI_GROUNDED", "GOOGLE_PLACES", "OPENAI_WEB_SEARCH"],
    "verificationRules": ["phone", "taxCode", "address", "monthlyCapacity", "moq", "certifications"],
    "exclusionRules": [
      "không đúng ngành may mặc",
      "đã ngừng hoạt động",
      "kết quả trùng lặp",
      "không có nguồn xác minh"
    ],
    "synonyms": {
      "GARMENT_FACTORY": ["xưởng may", "nhà máy may", "cơ sở may", "nhà máy sản xuất quần áo"],
      "POLO": ["áo polo", "áo trụ", "áo cổ trụ"],
      "MOQ": ["số lượng tối thiểu", "đơn hàng tối thiểu", "đặt tối thiểu"]
    },
    "outputFields": ["legalName", "phone", "address", "monthlyCapacity", "moq", "certifications", "confidence", "resultTier"]
  }'::jsonb,
  '{
    "code": "GARMENT_FACTORY_SCORE",
    "total": 100,
    "criteria": [
      {"key": "productFit", "weight": 25},
      {"key": "directFactory", "weight": 15},
      {"key": "capacityMatch", "weight": 15},
      {"key": "locationProximity", "weight": 15},
      {"key": "evidenceCoverage", "weight": 20},
      {"key": "certifications", "weight": 10}
    ]
  }'::jsonb,
  1,
  'DRAFT'
)
on conflict (organization_id, code) do nothing;
