-- Bật RLS và cấp quyền cho client (role anon) có thể thêm/sửa/xóa bảng kho_thanh_pham
alter table public.kho_thanh_pham enable row level security;

-- kho_thanh_pham
drop policy if exists "kho_thanh_pham_client_insert" on public.kho_thanh_pham;
create policy "kho_thanh_pham_client_insert" on public.kho_thanh_pham for insert to anon with check (true);

drop policy if exists "kho_thanh_pham_client_update" on public.kho_thanh_pham;
create policy "kho_thanh_pham_client_update" on public.kho_thanh_pham for update to anon using (true) with check (true);

drop policy if exists "kho_thanh_pham_client_delete" on public.kho_thanh_pham;
create policy "kho_thanh_pham_client_delete" on public.kho_thanh_pham for delete to anon using (true);

grant select, insert, update, delete on public.kho_thanh_pham to anon;

notify pgrst, 'reload schema';
