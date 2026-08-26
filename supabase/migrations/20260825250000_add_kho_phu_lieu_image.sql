begin;

alter table public.kho
  add column if not exists hinh_anh text;

comment on column public.kho.hinh_anh is 'URL anh phu lieu trong Supabase Storage';

notify pgrst, 'reload schema';
commit;
