begin;

alter table public.ke_hoach_san_xuat_30_ngay
  add column if not exists mau_chinh text,
  add column if not exists hinh_anh text;

comment on column public.ke_hoach_san_xuat_30_ngay.mau_chinh is 'Mau chinh/dai dien cua san pham (1 ma SP co nhieu mau).';
comment on column public.ke_hoach_san_xuat_30_ngay.hinh_anh is 'URL hinh anh san pham tren Supabase Storage.';

notify pgrst, 'reload schema';
commit;
