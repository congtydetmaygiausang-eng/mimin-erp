-- Bật RLS và cấp quyền cho client
alter table public.kho_thanh_pham enable row level security;

-- Xóa các policy cũ
drop policy if exists "kho_thanh_pham_client_insert" on public.kho_thanh_pham;
drop policy if exists "kho_thanh_pham_client_update" on public.kho_thanh_pham;
drop policy if exists "kho_thanh_pham_client_delete" on public.kho_thanh_pham;

-- Tạo policy mới áp dụng chung (không giới hạn to anon)
create policy "kho_thanh_pham_client_insert" on public.kho_thanh_pham for insert with check (true);
create policy "kho_thanh_pham_client_update" on public.kho_thanh_pham for update using (true) with check (true);
create policy "kho_thanh_pham_client_delete" on public.kho_thanh_pham for delete using (true);

-- Cấp quyền
grant select, insert, update, delete on public.kho_thanh_pham to authenticated, anon;

notify pgrst, 'reload schema';
