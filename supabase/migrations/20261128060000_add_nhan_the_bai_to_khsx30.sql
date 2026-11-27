begin;

alter table public.ke_hoach_san_xuat_30_ngay
  add column if not exists nhan text,
  add column if not exists the_bai text;

comment on column public.ke_hoach_san_xuat_30_ngay.nhan is 'Ten/ma nhan (label/brand tag), chon tu kho_phu_lieu.';
comment on column public.ke_hoach_san_xuat_30_ngay.the_bai is 'Ten/ma the bai (hang tag), chon tu kho_phu_lieu.';

notify pgrst, 'reload schema';
commit;
