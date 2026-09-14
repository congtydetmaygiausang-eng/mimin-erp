begin;

create table if not exists public.phieu_dat_ncc_san_xuat (
  id uuid primary key,
  ma_phieu text not null unique,
  ngay_dat date not null,
  ngay_giao date not null,
  nguoi_tao text not null default '',
  ma_khach_hang text,
  ma_ncc text not null,
  noi_dung jsonb not null default '{}'::jsonb,
  trang_thai text not null default 'Nháp',
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint phieu_dat_ncc_trang_thai_check check (trang_thai in ('Nháp', 'Đã gửi NCC', 'NCC xác nhận', 'Đang dệt', 'Hoàn thành', 'Đã giao'))
);

create index if not exists idx_phieu_dat_ncc_ma_ncc on public.phieu_dat_ncc_san_xuat (ma_ncc);
create index if not exists idx_phieu_dat_ncc_ma_khach_hang on public.phieu_dat_ncc_san_xuat (ma_khach_hang);
create index if not exists idx_phieu_dat_ncc_trang_thai on public.phieu_dat_ncc_san_xuat (trang_thai);

alter table public.phieu_dat_ncc_san_xuat enable row level security;
revoke all on table public.phieu_dat_ncc_san_xuat from anon, authenticated;
grant select, insert, update on table public.phieu_dat_ncc_san_xuat to authenticated;

create policy phieu_dat_ncc_select on public.phieu_dat_ncc_san_xuat
for select to authenticated using (
  created_by = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'planner', 'accountant')
  or (
    (select auth.jwt() -> 'app_metadata' ->> 'role') in ('supplier', 'partner')
    and ma_ncc = coalesce(
      (select auth.jwt() -> 'user_metadata' ->> 'maNV'),
      (select auth.jwt() -> 'user_metadata' ->> 'ma_ncc')
    )
  )
  or (
    (select auth.jwt() -> 'app_metadata' ->> 'role') in ('workshop_customer', 'buyer_customer')
    and ma_khach_hang = coalesce(
      (select auth.jwt() -> 'user_metadata' ->> 'maNV'),
      (select auth.jwt() -> 'user_metadata' ->> 'ma_khach_hang')
    )
  )
);

create policy phieu_dat_ncc_insert on public.phieu_dat_ncc_san_xuat
for insert to authenticated with check (
  created_by = (select auth.uid())
  and (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'planner', 'accountant')
);

create policy phieu_dat_ncc_update on public.phieu_dat_ncc_san_xuat
for update to authenticated using (
  created_by = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'planner', 'accountant')
  or (
    (select auth.jwt() -> 'app_metadata' ->> 'role') in ('supplier', 'partner')
    and ma_ncc = coalesce(
      (select auth.jwt() -> 'user_metadata' ->> 'maNV'),
      (select auth.jwt() -> 'user_metadata' ->> 'ma_ncc')
    )
  )
) with check (
  created_by = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'planner', 'accountant')
  or (
    (select auth.jwt() -> 'app_metadata' ->> 'role') in ('supplier', 'partner')
    and ma_ncc = coalesce(
      (select auth.jwt() -> 'user_metadata' ->> 'maNV'),
      (select auth.jwt() -> 'user_metadata' ->> 'ma_ncc')
    )
  )
);

create or replace function public.kiem_tra_cap_nhat_tien_do_phieu_dat_ncc()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_role text := auth.jwt() -> 'app_metadata' ->> 'role';
begin
  if current_role in ('supplier', 'partner') then
    if new.ma_phieu <> old.ma_phieu
      or new.ma_ncc <> old.ma_ncc
      or new.ma_khach_hang is distinct from old.ma_khach_hang
      or new.ngay_dat <> old.ngay_dat
      or new.ngay_giao <> old.ngay_giao then
      raise exception 'NCC chỉ được cập nhật tiến độ của đơn hàng';
    end if;

    if not (
      (old.trang_thai = 'Đã gửi NCC' and new.trang_thai = 'NCC xác nhận')
      or (old.trang_thai = 'NCC xác nhận' and new.trang_thai = 'Đang dệt')
      or (old.trang_thai = 'Đang dệt' and new.trang_thai = 'Hoàn thành')
    ) then
      raise exception 'Chuyển trạng thái NCC không hợp lệ: % -> %', old.trang_thai, new.trang_thai;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_kiem_tra_tien_do_phieu_dat_ncc on public.phieu_dat_ncc_san_xuat;
create trigger trg_kiem_tra_tien_do_phieu_dat_ncc
before update on public.phieu_dat_ncc_san_xuat
for each row execute function public.kiem_tra_cap_nhat_tien_do_phieu_dat_ncc();

notify pgrst, 'reload schema';
commit;
