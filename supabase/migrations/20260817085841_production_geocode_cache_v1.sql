-- @codex L6: cache geocode bền vững, chỉ máy chủ được đọc/ghi để tránh đầu độc tọa độ.

create table if not exists public.production_geocode_cache (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (organization_id = 'mimin'),
  cache_key text not null check (length(cache_key) between 3 and 500),
  normalized_query text not null check (length(normalized_query) between 3 and 500),
  provider text not null default 'NOMINATIM' check (provider in ('NOMINATIM')),
  places jsonb not null default '[]'::jsonb check (jsonb_typeof(places) = 'array'),
  result_count smallint not null default 0 check (result_count between 0 and 10),
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, cache_key)
);

create index if not exists production_geocode_cache_expiry_idx
  on public.production_geocode_cache (organization_id, provider, expires_at);

alter table public.production_geocode_cache enable row level security;
revoke all on public.production_geocode_cache from public, anon, authenticated;
grant select, insert, update, delete on public.production_geocode_cache to service_role;

comment on table public.production_geocode_cache is
  'L6: cache Nominatim phía máy chủ; bản hết hạn được giữ làm fallback khi nhà cung cấp tạm lỗi.';
