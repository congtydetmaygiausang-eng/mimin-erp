begin;

-- Bảng mới hoàn toàn: không alter, backfill hay ghi đè bảng kho hiện tại.
create table if not exists public.kho_vai_me_nhuom (
  id uuid primary key default gen_random_uuid(),
  ma_me text not null unique,
  sku text not null,
  mau_sac text not null,
  ngay_nhap date not null default current_date,
  xuong_nhuom text,
  don_gia numeric(14, 0) not null default 0 check (don_gia >= 0),
  so_kg_nhap numeric(14, 2) not null default 0 check (so_kg_nhap >= 0),
  ton_kg numeric(14, 2) not null default 0 check (ton_kg >= 0),
  so_cay numeric(12, 0) not null default 0 check (so_cay >= 0),
  khu text not null default 'C' check (khu in ('A', 'B', 'C', 'D', 'E')),
  ke text,
  tang text,
  o text,
  trang_thai text not null default 'CHO_KIEM'
    check (trang_thai in ('CHO_KIEM', 'DANG_SU_DUNG', 'ME_KE_TIEP', 'GIU_RIENG', 'CHO_TRA', 'DA_HET')),
  ghi_chu text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.kho_vai_me_nhuom is
  'Tồn vải theo mẻ nhuộm và giá vốn; tách biệt khỏi tồn tổng trong public.kho.';
comment on column public.kho_vai_me_nhuom.sku is
  'Tham chiếu logic tới kho.sku; không tạo FK để migration không khóa/xóa dữ liệu kho cũ.';

create index if not exists idx_kho_vai_me_nhuom_sku_mau
  on public.kho_vai_me_nhuom (sku, mau_sac, ngay_nhap);
create index if not exists idx_kho_vai_me_nhuom_khu_trang_thai
  on public.kho_vai_me_nhuom (khu, trang_thai);

create or replace function public.set_kho_vai_me_nhuom_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_kho_vai_me_nhuom_updated_at on public.kho_vai_me_nhuom;
create trigger trg_kho_vai_me_nhuom_updated_at
before update on public.kho_vai_me_nhuom
for each row execute function public.set_kho_vai_me_nhuom_updated_at();

revoke all on function public.set_kho_vai_me_nhuom_updated_at() from public, anon, authenticated;

create or replace function public.promote_next_kho_vai_dye_lot()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_id uuid;
begin
  if new.ton_kg = 0 and old.ton_kg > 0 then
    new.trang_thai := 'DA_HET';
    select id into next_id
    from public.kho_vai_me_nhuom
    where sku = new.sku
      and mau_sac = new.mau_sac
      and trang_thai = 'ME_KE_TIEP'
      and ton_kg > 0
      and id <> new.id
    order by ngay_nhap, created_at
    limit 1;

    if next_id is not null then
      update public.kho_vai_me_nhuom
      set khu = 'A', trang_thai = 'DANG_SU_DUNG'
      where id = next_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_promote_next_kho_vai_dye_lot on public.kho_vai_me_nhuom;
create trigger trg_promote_next_kho_vai_dye_lot
before update of ton_kg on public.kho_vai_me_nhuom
for each row execute function public.promote_next_kho_vai_dye_lot();

revoke all on function public.promote_next_kho_vai_dye_lot() from public, anon, authenticated;

alter table public.kho_vai_me_nhuom enable row level security;

drop policy if exists kho_vai_me_nhuom_read on public.kho_vai_me_nhuom;
create policy kho_vai_me_nhuom_read
on public.kho_vai_me_nhuom for select
to anon, authenticated
using (true);

drop policy if exists kho_vai_me_nhuom_write on public.kho_vai_me_nhuom;
create policy kho_vai_me_nhuom_write
on public.kho_vai_me_nhuom for all
to authenticated
using (true)
with check (true);

grant select on public.kho_vai_me_nhuom to anon;
grant select, insert, update, delete on public.kho_vai_me_nhuom to authenticated;

notify pgrst, 'reload schema';
commit;
