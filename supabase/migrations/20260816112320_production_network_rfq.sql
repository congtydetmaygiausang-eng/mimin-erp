-- Giai đoạn 6: RFQ độc lập, chỉ tham chiếu đối tác của Mạng lưới sản xuất.
create table public.production_partner_rfqs (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'mimin' check (length(trim(organization_id)) > 0),
  partner_id uuid not null references public.production_partners(id) on delete restrict,
  subject text not null check (length(trim(subject)) > 0),
  requirement text not null check (length(trim(requirement)) > 0),
  quantity integer check (quantity is null or quantity > 0),
  response_deadline date,
  status text not null default 'DRAFT' check (status in ('DRAFT','SENT','RESPONDED','SELECTED','REJECTED','CANCELLED')),
  quoted_price numeric(18,2) check (quoted_price is null or quoted_price >= 0),
  response_notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index production_partner_rfqs_org_status_idx on public.production_partner_rfqs (organization_id,status,created_at desc);
create index production_partner_rfqs_partner_idx on public.production_partner_rfqs (partner_id);
alter table public.production_partner_rfqs enable row level security;
revoke all on public.production_partner_rfqs from anon;
grant select,insert,update on public.production_partner_rfqs to authenticated;
create policy "production_rfqs_read" on public.production_partner_rfqs for select to authenticated
using (organization_id='mimin' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant','content'));
create policy "production_rfqs_create" on public.production_partner_rfqs for insert to authenticated
with check (organization_id='mimin' and created_by=(select auth.uid()) and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant'));
create policy "production_rfqs_update" on public.production_partner_rfqs for update to authenticated
using (organization_id='mimin' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant'))
with check (organization_id='mimin' and ((select auth.jwt())->'app_metadata'->>'role') in ('admin','planner','warehouse','accountant'));
comment on table public.production_partner_rfqs is 'Yêu cầu báo giá riêng của phân hệ Mạng lưới sản xuất; không tạo đơn hàng/công nợ ERP.';
