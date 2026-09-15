begin;

drop policy if exists cham_cong_authenticated_select on public.cham_cong;
create policy cham_cong_authenticated_select on public.cham_cong
for select to authenticated
using (true);

drop policy if exists cham_cong_authenticated_insert on public.cham_cong;
create policy cham_cong_authenticated_insert on public.cham_cong
for insert to authenticated
with check (
  (select auth.uid()) = auth_user_id
  or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'accountant', 'hr', 'quan_tri')
);

drop policy if exists cham_cong_authenticated_update on public.cham_cong;
create policy cham_cong_authenticated_update on public.cham_cong
for update to authenticated
using (
  (select auth.uid()) = auth_user_id
  or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'accountant', 'hr', 'quan_tri')
)
with check (
  (select auth.uid()) = auth_user_id
  or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'accountant', 'hr', 'quan_tri')
);

notify pgrst, 'reload schema';
commit;
