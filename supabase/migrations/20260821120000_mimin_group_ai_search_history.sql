-- @codex MIMIN GROUP - lịch sử tìm kiếm AI Search Agent (tab "Lịch sử tìm kiếm").
-- Tách biệt khỏi production_discovery_candidates (vùng chờ duyệt) - đây là nhật ký
-- truy vấn/kết quả, phục vụ hiển thị lại không cần tìm lại. Theo đúng convention
-- organization_id + RLS theo app_metadata.role của các migration production_network_*.

create table if not exists public.ai_search_history (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (length(trim(organization_id)) > 0),
  user_id uuid default auth.uid(),
  user_email text,
  entry_point text not null default 'ADVANCED_FORM'
    check (entry_point in ('AGENT_CHAT', 'QUICK_CHIP', 'ADVANCED_FORM')),
  query_text text not null check (length(trim(query_text)) > 0),
  tool_name text,
  structured_filters jsonb not null default '{}'::jsonb,
  tool_calls jsonb not null default '[]'::jsonb,
  assistant_reply text,
  provider text,
  result_count integer not null default 0 check (result_count >= 0),
  status text not null default 'OK' check (status in ('OK', 'ERROR', 'RATE_LIMITED')),
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_search_results (
  id uuid primary key default gen_random_uuid(),
  search_history_id uuid not null references public.ai_search_history(id) on delete cascade,
  organization_id text not null default 'mimin' check (length(trim(organization_id)) > 0),
  legal_name text not null check (length(trim(legal_name)) > 0),
  address text,
  province text,
  district text,
  phone text,
  email text,
  website text,
  tax_code text,
  result_tier text check (result_tier in ('EXACT', 'RELATED')),
  confidence smallint check (confidence is null or confidence between 0 and 100),
  location_status text,
  distance_km numeric,
  source_url text,
  raw_candidate jsonb not null default '{}'::jsonb,
  matched_partner_id uuid references public.production_partners(id) on delete set null,
  matched_candidate_id uuid references public.production_discovery_candidates(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ai_search_history_org_user_idx
  on public.ai_search_history (organization_id, user_id, created_at desc);
create index if not exists ai_search_history_org_created_idx
  on public.ai_search_history (organization_id, created_at desc);
create index if not exists ai_search_results_history_idx
  on public.ai_search_results (search_history_id, created_at desc);
create index if not exists ai_search_results_org_idx
  on public.ai_search_results (organization_id, created_at desc);

alter table public.ai_search_history enable row level security;
alter table public.ai_search_results enable row level security;

revoke all on public.ai_search_history from anon;
revoke all on public.ai_search_results from anon;
grant select, insert on public.ai_search_history to authenticated;
grant select, insert on public.ai_search_results to authenticated;

drop policy if exists "ai_search_history_read" on public.ai_search_history;
create policy "ai_search_history_read"
on public.ai_search_history
for select
to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in (
    'admin', 'planner', 'warehouse', 'accountant', 'content', 'partner'
  )
);

drop policy if exists "ai_search_history_create" on public.ai_search_history;
create policy "ai_search_history_create"
on public.ai_search_history
for insert
to authenticated
with check (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in (
    'admin', 'planner', 'warehouse', 'accountant'
  )
);

drop policy if exists "ai_search_results_read" on public.ai_search_results;
create policy "ai_search_results_read"
on public.ai_search_results
for select
to authenticated
using (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in (
    'admin', 'planner', 'warehouse', 'accountant', 'content', 'partner'
  )
);

drop policy if exists "ai_search_results_create" on public.ai_search_results;
create policy "ai_search_results_create"
on public.ai_search_results
for insert
to authenticated
with check (
  organization_id = 'mimin'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') in (
    'admin', 'planner', 'warehouse', 'accountant'
  )
  and exists (
    select 1
    from public.ai_search_history history
    where history.id = search_history_id
      and history.organization_id = ai_search_results.organization_id
  )
);

comment on table public.ai_search_history is
  'MIMIN GROUP: nhật ký mỗi lượt tìm kiếm AI (chat agent / quick chip / form nâng cao).';
comment on table public.ai_search_results is
  'MIMIN GROUP: snapshot từng ứng viên của 1 lượt tìm kiếm, phục vụ xem lại không cần tìm lại.';
