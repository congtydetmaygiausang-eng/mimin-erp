begin;

alter table public.ke_hoach_san_xuat_30_ngay
  add column if not exists lung_thun text,
  add column if not exists day_keo text,
  add column if not exists nut text,
  add column if not exists bao_bi text,
  add column if not exists gia_cong_ao numeric(12, 0),
  add column if not exists gia_cong_quan numeric(12, 0);

comment on column public.ke_hoach_san_xuat_30_ngay.lung_thun is 'Ten/ma phu lieu lung thun, chon tu kho_phu_lieu.';
comment on column public.ke_hoach_san_xuat_30_ngay.day_keo is 'Ten/ma phu lieu day keo, chon tu kho_phu_lieu.';
comment on column public.ke_hoach_san_xuat_30_ngay.nut is 'Ten/ma phu lieu nut, chon tu kho_phu_lieu.';
comment on column public.ke_hoach_san_xuat_30_ngay.bao_bi is 'Ten/ma phu lieu bao bi, chon tu kho_phu_lieu.';
comment on column public.ke_hoach_san_xuat_30_ngay.gia_cong_ao is 'Don gia gia cong may ao (d/sp).';
comment on column public.ke_hoach_san_xuat_30_ngay.gia_cong_quan is 'Don gia gia cong may quan (d/sp).';

notify pgrst, 'reload schema';
commit;
