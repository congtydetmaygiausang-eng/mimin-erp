-- The ERP uses its own employee session, so browser requests reach Supabase
-- with the anon role. Permit only validated inventory inserts/updates; no delete.
alter table public.kho enable row level security;

drop policy if exists "kho_client_insert" on public.kho;
create policy "kho_client_insert"
on public.kho
for insert
to anon
with check (
  sku is not null
  and length(trim(sku)) between 1 and 80
  and loai in ('Vai', 'Phu lieu')
  and coalesce(ton_kho, 0) >= 0
  and coalesce(don_gia, 0) >= 0
);

drop policy if exists "kho_client_update" on public.kho;
create policy "kho_client_update"
on public.kho
for update
to anon
using (loai in ('Vai', 'Phu lieu'))
with check (
  sku is not null
  and length(trim(sku)) between 1 and 80
  and loai in ('Vai', 'Phu lieu')
  and coalesce(ton_kho, 0) >= 0
  and coalesce(don_gia, 0) >= 0
);

grant select, insert, update on public.kho to anon;
grant select, insert, update, delete on public.kho to authenticated;

notify pgrst, 'reload schema';
